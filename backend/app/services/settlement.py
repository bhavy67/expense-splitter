import uuid
from datetime import datetime, timezone
from decimal import Decimal

from sqlalchemy import delete, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.expense import Expense, ExpensePayer, ExpenseSplit
from app.models.group import Group
from app.models.settlement import Payment, Settlement


async def recalculate_settlements(group_id: uuid.UUID, db: AsyncSession) -> list[Settlement]:
    """
    Rebuild settlement cache for a group.
    1. Compute net balance per user from expenses + payments.
    2. Run greedy minimize-transactions algorithm.
    3. Upsert results into settlements table.
    """
    net: dict[uuid.UUID, Decimal] = {}

    # Load all active expenses and their splits/payers
    expense_result = await db.execute(
        select(Expense)
        .where(Expense.group_id == group_id, Expense.deleted_at.is_(None))
        .options(selectinload(Expense.splits), selectinload(Expense.payers))
    )
    expenses = expense_result.scalars().all()

    for expense in expenses:
        if expense.payers:
            for payer in expense.payers:
                net.setdefault(payer.user_id, Decimal(0))
                net[payer.user_id] += Decimal(str(payer.amount))
        else:
            net.setdefault(expense.paid_by, Decimal(0))
            net[expense.paid_by] += Decimal(str(expense.total_amount))

        for split in expense.splits:
            net.setdefault(split.user_id, Decimal(0))
            net[split.user_id] -= Decimal(str(split.amount))

    # Factor in confirmed payments
    payment_result = await db.execute(
        select(Payment).where(
            Payment.group_id == group_id, Payment.confirmed_at.isnot(None)
        )
    )
    for payment in payment_result.scalars().all():
        net.setdefault(payment.from_user_id, Decimal(0))
        net.setdefault(payment.to_user_id, Decimal(0))
        net[payment.from_user_id] += Decimal(str(payment.amount))
        net[payment.to_user_id] -= Decimal(str(payment.amount))

    # Greedy minimize-transactions
    transactions = _minimize_transactions(net)

    # Get currency from group (we need it for the settlement rows)
    group_result = await db.execute(select(Group).where(Group.id == group_id))
    group = group_result.scalar_one()

    # Wipe existing settlements for this group and replace
    await db.execute(delete(Settlement).where(Settlement.group_id == group_id))

    new_settlements = []
    now = datetime.now(timezone.utc)
    for from_id, to_id, amount in transactions:
        s = Settlement(
            group_id=group_id,
            from_user_id=from_id,
            to_user_id=to_id,
            amount=float(amount),
            currency_code=group.currency_code,
            computed_at=now,
        )
        db.add(s)
        new_settlements.append(s)

    await db.flush()
    return new_settlements


def _minimize_transactions(net: dict[uuid.UUID, Decimal]) -> list[tuple[uuid.UUID, uuid.UUID, Decimal]]:
    """
    Greedy algorithm: match largest creditor with largest debtor each round.
    Returns list of (from_user, to_user, amount) — debtor pays creditor.
    """
    ZERO = Decimal(0)
    EPSILON = Decimal("0.01")

    creditors: list[list] = [[uid, bal] for uid, bal in net.items() if bal > EPSILON]
    debtors: list[list] = [[uid, -bal] for uid, bal in net.items() if bal < -EPSILON]

    creditors.sort(key=lambda x: x[1], reverse=True)
    debtors.sort(key=lambda x: x[1], reverse=True)

    transactions: list[tuple[uuid.UUID, uuid.UUID, Decimal]] = []

    ci, di = 0, 0
    while ci < len(creditors) and di < len(debtors):
        creditor_id, credit = creditors[ci]
        debtor_id, debt = debtors[di]

        amount = min(credit, debt)
        transactions.append((debtor_id, creditor_id, amount))

        creditors[ci][1] -= amount
        debtors[di][1] -= amount

        if creditors[ci][1] < EPSILON:
            ci += 1
        if debtors[di][1] < EPSILON:
            di += 1

    return transactions
