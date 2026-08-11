import uuid
from datetime import datetime, timezone

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.dependencies import get_current_user, get_group_member
from app.database import get_db
from app.models.group import GroupMember
from app.models.settlement import Payment, Settlement
from app.models.user import User
from app.schemas.settlement import (
    CreatePaymentRequest,
    PaymentResponse,
    SettlementPlanItem,
    SettlementResponse,
)
from app.services.notification import publish_group_event
from app.services.settlement import recalculate_settlements

router = APIRouter(tags=["settlements"])


@router.get("/groups/{group_id}/settlements", response_model=list[SettlementResponse])
async def get_settlements(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settlement).where(Settlement.group_id == group_id))
    return result.scalars().all()


@router.get("/groups/{group_id}/settlement-plan", response_model=list[SettlementPlanItem])
async def get_settlement_plan(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Settlement).where(Settlement.group_id == group_id))
    settlements = result.scalars().all()
    return [
        SettlementPlanItem(
            from_user_id=s.from_user_id,
            to_user_id=s.to_user_id,
            amount=s.amount,
            currency_code=s.currency_code,
        )
        for s in settlements
    ]


@router.get("/groups/{group_id}/payments", response_model=list[PaymentResponse])
async def list_payments(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment)
        .where(Payment.group_id == group_id)
        .order_by(Payment.created_at.desc())
    )
    return result.scalars().all()


@router.post("/groups/{group_id}/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED)
async def create_payment(
    group_id: uuid.UUID,
    body: CreatePaymentRequest,
    background_tasks: BackgroundTasks,
    member: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    payment = Payment(
        group_id=group_id,
        from_user_id=body.from_user_id,
        to_user_id=body.to_user_id,
        amount=body.amount,
        currency_code=body.currency_code,
        note=body.note,
        payment_method=body.payment_method,
    )
    db.add(payment)
    await db.flush()

    background_tasks.add_task(publish_group_event, group_id, "payment.created", {"payment_id": str(payment.id)})
    return payment


@router.put("/groups/{group_id}/payments/{payment_id}/confirm", response_model=PaymentResponse)
async def confirm_payment(
    group_id: uuid.UUID,
    payment_id: uuid.UUID,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Payment).where(Payment.id == payment_id, Payment.group_id == group_id)
    )
    payment = result.scalar_one_or_none()
    if not payment:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Payment not found")
    if payment.to_user_id != current_user.id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Only the recipient can confirm")
    if payment.confirmed_at:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already confirmed")

    payment.confirmed_at = datetime.now(timezone.utc)
    await db.commit()

    background_tasks.add_task(_after_payment_confirm, group_id)
    return payment


async def _after_payment_confirm(group_id: uuid.UUID) -> None:
    from app.database import AsyncSessionLocal

    async with AsyncSessionLocal() as db:
        try:
            await recalculate_settlements(group_id, db)
            await db.commit()
        except Exception:
            await db.rollback()
    await publish_group_event(group_id, "settlement.updated", {"group_id": str(group_id)})
