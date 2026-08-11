import uuid
from datetime import date, datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import and_, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, get_group_member
from app.database import get_db
from app.models.expense import Expense, ExpenseAudit, ExpenseItem, ExpenseSplit
from app.models.group import GroupMember
from app.models.user import User
from app.schemas.expense import (
    CreateExpenseRequest,
    ExpenseListResponse,
    ExpenseResponse,
    UpdateExpenseRequest,
)
from app.services.notification import publish_group_event
from app.services.settlement import recalculate_settlements

router = APIRouter(prefix="/groups/{group_id}/expenses", tags=["expenses"])


def _expense_options():
    return selectinload(Expense.splits), selectinload(Expense.items).selectinload(ExpenseItem.splits)


async def _get_expense_or_404(db: AsyncSession, expense_id: uuid.UUID, group_id: uuid.UUID) -> Expense:
    result = await db.execute(
        select(Expense)
        .where(
            Expense.id == expense_id,
            Expense.group_id == group_id,
            Expense.deleted_at.is_(None),
        )
        .options(*_expense_options())
    )
    expense = result.scalar_one_or_none()
    if not expense:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Expense not found")
    return expense


def _build_splits(expense: Expense, request: CreateExpenseRequest) -> None:
    if request.split_type == "equal":
        per_person = round(request.total_amount / len(request.splits), 2)
        # Assign rounding remainder to first person
        amounts = [per_person] * len(request.splits)
        remainder = round(request.total_amount - sum(amounts), 2)
        amounts[0] += remainder
        for split_in, amount in zip(request.splits, amounts):
            expense.splits.append(
                ExpenseSplit(expense_id=expense.id, user_id=split_in.user_id, amount=amount)
            )

    elif request.split_type == "percentage":
        for split_in in request.splits:
            amount = round(request.total_amount * (split_in.percentage or 0) / 100, 2)
            expense.splits.append(
                ExpenseSplit(
                    expense_id=expense.id,
                    user_id=split_in.user_id,
                    amount=amount,
                    percentage=split_in.percentage,
                )
            )

    elif request.split_type == "exact":
        for split_in in request.splits:
            expense.splits.append(
                ExpenseSplit(
                    expense_id=expense.id,
                    user_id=split_in.user_id,
                    amount=split_in.amount or 0,
                )
            )

    elif request.split_type == "itemized":
        for item_in in request.items:
            item = ExpenseItem(
                expense_id=expense.id,
                description=item_in.description,
                amount=item_in.amount,
            )
            for split_in in item_in.splits:
                item.splits.append(
                    ExpenseSplit(
                        expense_id=expense.id,
                        user_id=split_in.user_id,
                        amount=split_in.amount or 0,
                    )
                )
            expense.items.append(item)


@router.get("", response_model=ExpenseListResponse)
async def list_expenses(
    group_id: uuid.UUID,
    page: int = Query(1, ge=1),
    per_page: int = Query(20, ge=1, le=100),
    paid_by: uuid.UUID | None = None,
    category: str | None = None,
    date_from: date | None = None,
    date_to: date | None = None,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    filters = [Expense.group_id == group_id, Expense.deleted_at.is_(None)]
    if paid_by:
        filters.append(Expense.paid_by == paid_by)
    if category:
        filters.append(Expense.category == category)
    if date_from:
        filters.append(Expense.expense_date >= date_from)
    if date_to:
        filters.append(Expense.expense_date <= date_to)

    count_result = await db.execute(
        select(Expense).where(and_(*filters))
    )
    total = len(count_result.scalars().all())

    result = await db.execute(
        select(Expense)
        .where(and_(*filters))
        .options(*_expense_options())
        .order_by(Expense.expense_date.desc(), Expense.created_at.desc())
        .offset((page - 1) * per_page)
        .limit(per_page)
    )
    expenses = result.scalars().all()

    return ExpenseListResponse(data=expenses, total=total, page=page, per_page=per_page)


@router.post("", response_model=ExpenseResponse, status_code=status.HTTP_201_CREATED)
async def create_expense(
    group_id: uuid.UUID,
    body: CreateExpenseRequest,
    background_tasks: BackgroundTasks,
    member: GroupMember = Depends(get_group_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = Expense(
        group_id=group_id,
        title=body.title,
        description=body.description,
        total_amount=body.total_amount,
        currency_code=body.currency_code,
        split_type=body.split_type,
        category=body.category,
        paid_by=body.paid_by,
        expense_date=body.expense_date,
        created_by=current_user.id,
    )
    expense.splits = []
    expense.items = []
    db.add(expense)
    await db.flush()

    _build_splits(expense, body)
    await db.flush()

    audit = ExpenseAudit(
        expense_id=expense.id,
        changed_by=current_user.id,
        action="created",
        snapshot={"title": expense.title, "total_amount": float(expense.total_amount)},
    )
    db.add(audit)
    await db.commit()

    background_tasks.add_task(_post_expense_tasks, group_id, expense.id, "expense.created")
    return expense


@router.get("/{expense_id}", response_model=ExpenseResponse)
async def get_expense(
    group_id: uuid.UUID,
    expense_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    return await _get_expense_or_404(db, expense_id, group_id)


@router.put("/{expense_id}", response_model=ExpenseResponse)
async def update_expense(
    group_id: uuid.UUID,
    expense_id: uuid.UUID,
    body: UpdateExpenseRequest,
    background_tasks: BackgroundTasks,
    _: GroupMember = Depends(get_group_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_expense_or_404(db, expense_id, group_id)

    if body.title is not None:
        expense.title = body.title
    if body.description is not None:
        expense.description = body.description
    if body.total_amount is not None:
        expense.total_amount = body.total_amount
    if body.category is not None:
        expense.category = body.category
    if body.paid_by is not None:
        expense.paid_by = body.paid_by
    if body.expense_date is not None:
        expense.expense_date = body.expense_date

    audit = ExpenseAudit(
        expense_id=expense.id,
        changed_by=current_user.id,
        action="updated",
        snapshot={"title": expense.title, "total_amount": float(expense.total_amount)},
    )
    db.add(audit)
    await db.commit()

    background_tasks.add_task(_post_expense_tasks, group_id, expense.id, "expense.updated")
    return expense


@router.delete("/{expense_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_expense(
    group_id: uuid.UUID,
    expense_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    _: GroupMember = Depends(get_group_member),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    expense = await _get_expense_or_404(db, expense_id, group_id)
    expense.deleted_at = datetime.now(timezone.utc)

    audit = ExpenseAudit(
        expense_id=expense.id,
        changed_by=current_user.id,
        action="deleted",
        snapshot={"title": expense.title, "total_amount": float(expense.total_amount)},
    )
    db.add(audit)
    await db.commit()

    background_tasks.add_task(_post_expense_tasks, group_id, expense_id, "expense.deleted")


@router.get("/{expense_id}/history")
async def get_expense_history(
    group_id: uuid.UUID,
    expense_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    await _get_expense_or_404(db, expense_id, group_id)
    from app.models.expense import ExpenseAudit as AuditModel

    result = await db.execute(
        select(AuditModel)
        .where(AuditModel.expense_id == expense_id)
        .order_by(AuditModel.created_at.desc())
    )
    return result.scalars().all()


async def _post_expense_tasks(
    group_id: uuid.UUID, expense_id: uuid.UUID, event_type: str
) -> None:
    """Background: open a fresh session, recalculate settlements, publish WS events."""
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            await recalculate_settlements(group_id, db)
            await db.commit()
        except Exception:
            await db.rollback()
    await publish_group_event(group_id, event_type, {"expense_id": str(expense_id)})
    await publish_group_event(group_id, "settlement.updated", {"group_id": str(group_id)})
