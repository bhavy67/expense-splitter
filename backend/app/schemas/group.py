import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, field_validator

from app.schemas.auth import UserResponse


class CreateGroupRequest(BaseModel):
    name: str
    description: str | None = None
    type: Literal["travel", "roommates", "friends", "dinner", "other"] = "other"
    currency_code: str = "INR"

    @field_validator("name")
    @classmethod
    def name_not_empty(cls, v: str) -> str:
        if not v.strip():
            raise ValueError("Group name cannot be empty")
        return v.strip()


class UpdateGroupRequest(BaseModel):
    name: str | None = None
    description: str | None = None
    type: Literal["travel", "roommates", "friends", "dinner", "other"] | None = None


class GroupMemberResponse(BaseModel):
    model_config = {"from_attributes": True}

    user: UserResponse
    role: str
    joined_at: datetime
    is_active: bool


class GroupResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    description: str | None
    type: str
    currency_code: str
    invite_code: str
    created_by: uuid.UUID
    created_at: datetime
    members: list[GroupMemberResponse] = []


class GroupSummaryResponse(BaseModel):
    model_config = {"from_attributes": True}

    id: uuid.UUID
    name: str
    type: str
    currency_code: str
    member_count: int
    total_expenses: float
    you_owe: float
    owed_to_you: float


class InviteLinkResponse(BaseModel):
    invite_code: str
    invite_url: str
