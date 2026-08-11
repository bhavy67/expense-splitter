import uuid
from datetime import datetime

from sqlalchemy import DateTime, Enum, ForeignKey, Numeric, String, UniqueConstraint, func
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import Mapped, mapped_column, relationship

from app.database import Base

PaymentMethod = Enum(
    "cash", "upi", "razorpay", "bank_transfer", "other", name="payment_method"
)


class Settlement(Base):
    """Computed cache — rebuilt on every expense change for a group."""

    __tablename__ = "settlements"
    __table_args__ = (UniqueConstraint("group_id", "from_user_id", "to_user_id"),)

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("groups.id"), index=True)
    from_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    to_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.code"), nullable=False)
    computed_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())

    group: Mapped["Group"] = relationship(back_populates="settlements")  # noqa: F821
    from_user: Mapped["User"] = relationship(foreign_keys=[from_user_id])  # noqa: F821
    to_user: Mapped["User"] = relationship(foreign_keys=[to_user_id])  # noqa: F821


class Payment(Base):
    __tablename__ = "payments"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    group_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("groups.id"), index=True)
    from_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    to_user_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    amount: Mapped[float] = mapped_column(Numeric(12, 2), nullable=False)
    currency_code: Mapped[str] = mapped_column(String(3), ForeignKey("currencies.code"), nullable=False)
    note: Mapped[str | None] = mapped_column(String(500))
    payment_method: Mapped[str] = mapped_column(PaymentMethod, nullable=False, default="cash")
    razorpay_payment_id: Mapped[str | None] = mapped_column(String(255))
    created_at: Mapped[datetime] = mapped_column(DateTime(timezone=True), server_default=func.now())
    confirmed_at: Mapped[datetime | None] = mapped_column(DateTime(timezone=True))

    group: Mapped["Group"] = relationship(back_populates="payments")  # noqa: F821
    from_user: Mapped["User"] = relationship(foreign_keys=[from_user_id])  # noqa: F821
    to_user: Mapped["User"] = relationship(foreign_keys=[to_user_id])  # noqa: F821
