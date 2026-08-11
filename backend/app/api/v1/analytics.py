import uuid

from fastapi import APIRouter, Depends
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_group_member
from app.database import get_db
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.settlement import Settlement
from app.models.user import User

router = APIRouter(tags=["analytics"])


@router.get("/groups/{group_id}/analytics")
async def group_analytics(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    # Total by category
    category_result = await db.execute(
        select(Expense.category, func.sum(Expense.total_amount))
        .where(Expense.group_id == group_id, Expense.deleted_at.is_(None))
        .group_by(Expense.category)
    )
    by_category = {row[0]: float(row[1]) for row in category_result.all()}

    # Total by member (what they paid)
    payer_result = await db.execute(
        select(Expense.paid_by, func.sum(Expense.total_amount))
        .where(Expense.group_id == group_id, Expense.deleted_at.is_(None))
        .group_by(Expense.paid_by)
    )
    by_payer = {str(row[0]): float(row[1]) for row in payer_result.all()}

    # Monthly totals (last 6 months)
    monthly_result = await db.execute(
        select(
            func.date_trunc("month", Expense.expense_date).label("month"),
            func.sum(Expense.total_amount),
        )
        .where(Expense.group_id == group_id, Expense.deleted_at.is_(None))
        .group_by("month")
        .order_by("month")
        .limit(6)
    )
    monthly = [{"month": str(row[0]), "total": float(row[1])} for row in monthly_result.all()]

    return {"by_category": by_category, "by_payer": by_payer, "monthly": monthly}


@router.get("/dashboard")
async def personal_dashboard(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # All groups with net balance
    membership_result = await db.execute(
        select(GroupMember).where(
            GroupMember.user_id == current_user.id, GroupMember.is_active == True  # noqa: E712
        )
    )
    memberships = membership_result.scalars().all()
    group_ids = [m.group_id for m in memberships]

    total_owe = 0.0
    total_owed = 0.0
    for gid in group_ids:
        s_result = await db.execute(select(Settlement).where(Settlement.group_id == gid))
        for s in s_result.scalars().all():
            if s.from_user_id == current_user.id:
                total_owe += s.amount
            if s.to_user_id == current_user.id:
                total_owed += s.amount

    return {
        "total_you_owe": round(total_owe, 2),
        "total_owed_to_you": round(total_owed, 2),
        "net": round(total_owed - total_owe, 2),
        "group_count": len(group_ids),
    }
