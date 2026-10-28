from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

import app.models  # noqa: F401  (registers tables on Base.metadata)
from app.api.routes import auth, dashboard, products, settings as settings_routes
from app.core.config import settings
from app.db.base import Base
from app.db.session import engine


@asynccontextmanager
async def lifespan(_: FastAPI):
    Base.metadata.create_all(bind=engine)  # quick setup; swap for Alembic migrations in production
    yield


app = FastAPI(title="StockFlow MVP", version="0.1.0", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

for r in (auth.router, products.router, dashboard.router, settings_routes.router):
    app.include_router(r, prefix="/api")


@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}

