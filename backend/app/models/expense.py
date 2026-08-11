import uuid
from datetime import date, datetime

from sqlalchemy import Date, DateTime, Enum, ForeignKey, Numeric, String, Text, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

SplitType = Enum("equal", "percentage", "exact", "itemized", name="split_type")
ExpenseCategory = Enum(
    "food", "travel", "accommodation", "utilities", "entertainment", "other",
    name="expense_category",
)
AuditAction = Enum("created", "updated", "deleted", "restored", name="audit_action")


class Expense(Base):
    __tablename__ = "expenses"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("groups.id"), index=True)
    title: Mapped[str] = mapped_column(String(255), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    total_amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.code"), nullable=False)
    split_type: Mapped[str] = mapped_column(SplitType, nullable=False, default="equal")
    category: Mapped[str] = mapped_column(ExpenseCategory, nullable=False, default="other")
    paid_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    expense_date: Mapped[date] = mapped_column(Date, nullable=False)
    created_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    updated_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), server_default=func.now(), onupdate=func.now()
    )
    deleted_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    group: Mapped["Group"] = relationship(back_populates="expenses")  # noqa: F821
    paid_by_user: Mapped["User"] = relationship(  # noqa: F821
        back_populates="expenses_paid", foreign_keys=[paid_by]
    )
    splits: Mapped[list["ExpenseSplit"]] = relationship(back_populates="expense")
    items: Mapped[list["ExpenseItem"]] = relationship(back_populates="expense")
    payers: Mapped[list["ExpensePayer"]] = relationship(back_populates="expense")
    audit_log: Mapped[list["ExpenseAudit"]] = relationship(back_populates="expense")


class ExpenseItem(Base):
    __tablename__ = "expense_items"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expenses.id"))
    description: Mapped[str] = mapped_column(String(255), nullable=False)
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    expense: Mapped["Expense"] = relationship(back_populates="items")
    splits: Mapped[list["ExpenseSplit"]] = relationship(back_populates="item")


class ExpenseSplit(Base):
    __tablename__ = "expense_splits"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expenses.id"), index=True)
    expense_item_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("expense_items.id")
    )
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    percentage: Mapped[float | None] = mapped_column(Numeric(5, 2))

    expense: Mapped["Expense"] = relationship(back_populates="splits")
    item: Mapped["ExpenseItem | None"] = relationship(back_populates="splits")


class ExpensePayer(Base):
    """For multi-payer expenses. Single-payer uses expense.paid_by only."""

    __tablename__ = "expense_payers"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expenses.id"))
    user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)

    expense: Mapped["Expense"] = relationship(back_populates="payers")


class ExpenseAudit(Base):
    __tablename__ = "expense_audit"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    expense_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("expenses.id"), index=True)
    changed_by: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    action: Mapped[str] = mapped_column(AuditAction, nullable=False)
    snapshot: Mapped[dict] = mapped_column(
        __import__("sqlalchemy.dialects.postgresql", fromlist=["JSONB"]).JSONB, nullable=False
    )
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    expense: Mapped["Expense"] = relationship(back_populates="audit_log")
