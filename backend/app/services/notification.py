import json
import uuid
from typing import Any

import redis.asyncio as aioredis

from app.config import settings

_redis: aioredis.Redis | None = None


def get_redis() -> aioredis.Redis:
    global _redis
    if _redis is None:
        _redis = aioredis.from_url(settings.REDIS_URL, decode_responses=True)
    return _redis


async def publish_group_event(group_id: uuid.UUID, event_type: str, payload: Any) -> None:
    channel = f"group:{group_id}:events"
    message = json.dumps({"type": event_type, "payload": payload})
    try:
        await get_redis().publish(channel, message)
    except Exception:
        pass  # Non-critical — WS clients will re-sync on reconnect
