import asyncio
import uuid

import redis.asyncio as aioredis
from fastapi import APIRouter, Query, WebSocket, WebSocketDisconnect

from app.core.security import decode_token
from app.services.notification import get_redis

router = APIRouter(tags=["websocket"])


@router.websocket("/ws/groups/{group_id}")
async def websocket_group(
    websocket: WebSocket,
    group_id: uuid.UUID,
    token: str = Query(...),
):
    try:
        decode_token(token, "access")
    except Exception:
        await websocket.close(code=4001)
        return

    await websocket.accept()

    channel = f"group:{group_id}:events"
    pubsub = get_redis().pubsub()
    await pubsub.subscribe(channel)

    async def _listen():
        async for message in pubsub.listen():
            if message["type"] == "message":
                await websocket.send_text(message["data"])

    listener = asyncio.create_task(_listen())
    try:
        while True:
            # Keep alive — client can send pings
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        listener.cancel()
        await pubsub.unsubscribe(channel)
        await pubsub.close()
