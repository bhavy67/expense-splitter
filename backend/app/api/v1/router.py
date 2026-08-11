from fastapi import APIRouter

from app.api.v1 import analytics, auth, expenses, groups, settlements, websocket

api_router = APIRouter(prefix="/api/v1")

api_router.include_router(auth.router)
api_router.include_router(groups.router)
api_router.include_router(expenses.router)
api_router.include_router(settlements.router)
api_router.include_router(analytics.router)

# WebSocket lives outside /api/v1 prefix
ws_router = APIRouter()
ws_router.include_router(websocket.router)
