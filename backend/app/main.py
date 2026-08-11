from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api.v1.router import api_router, ws_router
from app.config import settings


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: seed currencies if needed
    from app.database import AsyncSessionLocal
    from app.models.group import Currency
    from sqlalchemy import select

    async with AsyncSessionLocal() as db:
        result = await db.execute(select(Currency).where(Currency.code == "INR"))
        if not result.scalar_one_or_none():
            db.add(Currency(code="INR", symbol="₹", name="Indian Rupee", is_default=True))
            await db.commit()
    yield


app = FastAPI(
    title="Expense Splitter API",
    version="1.0.0",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(api_router)
app.include_router(ws_router)


@app.get("/health")
async def health():
    return {"status": "ok"}
