import uuid
from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel, field_validator, model_validator

SplitTypeStr = Literal["equal", "percentage", "exact", "itemized"]
CategoryStr = Literal["food", "travel", "accommodation", "utilities", "entertainment", "other"]


class ExpenseItemIn(BaseModel):
    description: str
    amount: float
    splits: list["SplitEntryIn"]


class SplitEntryIn(BaseModel):
    user_id: uuid.UUID
    amount: float | None = None
    percentage: float | None = None


class CreateExpenseRequest(BaseModel):
    title: str
    description: str | None = None
    total_amount: float
    currency_code: str = "INR"
    split_type: SplitTypeStr = "equal"
    category: CategoryStr = "other"
    paid_by: uuid.UUID
    expense_date: date
    splits: list[SplitEntryIn] = []
    items: list[ExpenseItemIn] = []

    @field_validator("total_amount")
    @classmethod
    def positive_amount(cls, v: float) -> float:
        if v <= 0:
            raise ValueError("Amount must be positive")
        return round(v, 2)

    @model_validator(mode="after")
    def validate_splits(self) -> "CreateExpenseRequest":
        if self.split_type == "itemized" and not self.items:
            raise ValueError("Itemized split requires at least one item")
        if self.split_type != "itemized" and not self.splits:
            raise ValueError("Non-itemized split requires beneficiaries")
        if self.split_type == "percentage":
            total_pct = sum(s.percentage or 0 for s in self.splits)
            if abs(total_pct - 100) > 0.01:
                raise ValueError(f"Percentages must sum to 100, got {total_pct}")
        if self.split_type == "exact":
            total = sum(s.amount or 0 for s in self.splits)
            if abs(total - self.total_amount) > 0.01:
                raise ValueError(f"Exact amounts must sum to total, got {total}")
        return self


class UpdateExpenseRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    total_amount: float | None = None
    category: CategoryStr | None = None
    paid_by: uuid.UUID | None = None
    expense_date: date | None = None
    splits: list[SplitEntryIn] | None = None
    items: list[ExpenseItemIn] | None = None


class ExpenseSplitResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    user_id: uuid.UUID
    amount: float
    percentage: float | None


class ExpenseItemResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    description: str
    amount: float
    splits: list[ExpenseSplitResponse]


class ExpenseResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    group_id: uuid.UUID
    title: str
    description: str | None
    total_amount: float
    currency_code: str
    split_type: str
    category: str
    paid_by: uuid.UUID
    expense_date: date
    created_by: uuid.UUID
    created_at: datetime
    updated_at: datetime
    splits: list[ExpenseSplitResponse]
    items: list[ExpenseItemResponse]


class ExpenseListResponse(BaseModel):
    data: list[ExpenseResponse]
    total: int
    page: int
    per_page: int
