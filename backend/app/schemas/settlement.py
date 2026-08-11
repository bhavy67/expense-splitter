import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel

PaymentMethodStr = Literal["cash", "upi", "razorpay", "bank_transfer", "other"]


class SettlementResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: float
    currency_code: str
    computed_at: datetime


class SettlementPlanItem(BaseModel):
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: float
    currency_code: str


class CreatePaymentRequest(BaseModel):
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: float
    currency_code: str = "INR"
    note: str | None = None
    payment_method: PaymentMethodStr = "cash"


class PaymentResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    group_id: uuid.UUID
    from_user_id: uuid.UUID
    to_user_id: uuid.UUID
    amount: float
    currency_code: str
    note: str | None
    payment_method: str
    created_at: datetime
    confirmed_at: datetime | None
