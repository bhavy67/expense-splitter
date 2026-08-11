import secrets
import uuid

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.core.dependencies import get_current_user, get_group_admin, get_group_member
from app.database import get_db
from app.models.expense import Expense, ExpenseSplit
from app.models.group import Group, GroupMember
from app.models.settlement import Settlement
from app.models.user import User
from app.schemas.group import (
    CreateGroupRequest,
    GroupResponse,
    GroupSummaryResponse,
    InviteLinkResponse,
    UpdateGroupRequest,
)
from app.services.notification import publish_group_event
from app.services.settlement import recalculate_settlements

router = APIRouter(prefix="/groups", tags=["groups"])


@router.get("", response_model=list[GroupSummaryResponse])
async def list_groups(current_user: User = Depends(get_current_user), db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(GroupMember)
        .where(GroupMember.user_id == current_user.id, GroupMember.is_active == True)  # noqa: E712
        .options(selectinload(GroupMember.group).selectinload(Group.members))
    )
    memberships = result.scalars().all()

    summaries = []
    for m in memberships:
        group = m.group
        if group.deleted_at:
            continue

        # Net balance for current user in this group
        settlement_result = await db.execute(
            select(Settlement).where(Settlement.group_id == group.id)
        )
        settlements = settlement_result.scalars().all()

        you_owe = sum(s.amount for s in settlements if s.from_user_id == current_user.id)
        owed_to_you = sum(s.amount for s in settlements if s.to_user_id == current_user.id)

        # Total expenses
        total_result = await db.execute(
            select(func.sum(Expense.total_amount)).where(
                Expense.group_id == group.id, Expense.deleted_at.is_(None)
            )
        )
        total_expenses = float(total_result.scalar() or 0)

        summaries.append(
            GroupSummaryResponse(
                id=group.id,
                name=group.name,
                type=group.type,
                currency_code=group.currency_code,
                member_count=len([m for m in group.members if m.is_active]),
                total_expenses=total_expenses,
                you_owe=you_owe,
                owed_to_you=owed_to_you,
            )
        )
    return summaries


@router.post("", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def create_group(
    body: CreateGroupRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    group = Group(
        name=body.name,
        description=body.description,
        type=body.type,
        currency_code=body.currency_code,
        invite_code=secrets.token_urlsafe(16),
        created_by=current_user.id,
    )
    db.add(group)
    await db.flush()

    membership = GroupMember(group_id=group.id, user_id=current_user.id, role="admin")
    db.add(membership)
    await db.flush()

    await db.refresh(group, ["members"])
    return group


@router.get("/{group_id}", response_model=GroupResponse)
async def get_group(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Group)
        .where(Group.id == group_id, Group.deleted_at.is_(None))
        .options(selectinload(Group.members).selectinload(GroupMember.user))
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")
    return group


@router.put("/{group_id}", response_model=GroupResponse)
async def update_group(
    group_id: uuid.UUID,
    body: UpdateGroupRequest,
    _: GroupMember = Depends(get_group_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Group).where(Group.id == group_id, Group.deleted_at.is_(None)))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    if body.name is not None:
        group.name = body.name
    if body.description is not None:
        group.description = body.description
    if body.type is not None:
        group.type = body.type

    await db.flush()
    await db.refresh(group, ["members"])
    return group


@router.post("/{group_id}/invite", response_model=InviteLinkResponse)
async def regenerate_invite(
    group_id: uuid.UUID,
    _: GroupMember = Depends(get_group_admin),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(Group).where(Group.id == group_id, Group.deleted_at.is_(None)))
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Group not found")

    group.invite_code = secrets.token_urlsafe(16)
    await db.flush()
    return InviteLinkResponse(
        invite_code=group.invite_code,
        invite_url=f"/join/{group.invite_code}",
    )


@router.post("/join/{invite_code}", response_model=GroupResponse, status_code=status.HTTP_201_CREATED)
async def join_group(
    invite_code: str,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(
        select(Group)
        .where(Group.invite_code == invite_code, Group.deleted_at.is_(None))
        .options(selectinload(Group.members).selectinload(GroupMember.user))
    )
    group = result.scalar_one_or_none()
    if not group:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Invalid invite link")

    existing = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group.id, GroupMember.user_id == current_user.id
        )
    )
    member = existing.scalar_one_or_none()
    if member:
        if member.is_active:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Already a member")
        member.is_active = True
    else:
        db.add(GroupMember(group_id=group.id, user_id=current_user.id, role="member"))

    await db.flush()
    background_tasks.add_task(
        publish_group_event, group.id, "member.joined", {"user_id": str(current_user.id)}
    )
    return group


@router.delete("/{group_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def remove_member(
    group_id: uuid.UUID,
    user_id: uuid.UUID,
    admin: GroupMember = Depends(get_group_admin),
    db: AsyncSession = Depends(get_db),
):
    if user_id == admin.user_id:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot remove yourself")

    result = await db.execute(
        select(GroupMember).where(
            GroupMember.group_id == group_id,
            GroupMember.user_id == user_id,
            GroupMember.is_active == True,  # noqa: E712
        )
    )
    member = result.scalar_one_or_none()
    if not member:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Member not found")
    member.is_active = False


@router.post("/{group_id}/leave", status_code=status.HTTP_204_NO_CONTENT)
async def leave_group(
    group_id: uuid.UUID,
    current_user: User = Depends(get_current_user),
    member: GroupMember = Depends(get_group_member),
    db: AsyncSession = Depends(get_db),
):
    if member.role == "admin":
        active_count = await db.execute(
            select(func.count()).select_from(GroupMember).where(
                GroupMember.group_id == group_id, GroupMember.is_active == True  # noqa: E712
            )
        )
        if active_count.scalar() <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="You are the only member — delete the group instead",
            )
        admin_count = await db.execute(
            select(func.count()).select_from(GroupMember).where(
                GroupMember.group_id == group_id,
                GroupMember.role == "admin",
                GroupMember.is_active == True,  # noqa: E712
            )
        )
        if admin_count.scalar() <= 1:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Transfer admin to another member before leaving",
            )
    member.is_active = False
