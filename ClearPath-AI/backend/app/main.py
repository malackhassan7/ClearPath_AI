"""
CLEARPATH AI / SIH 26130 FastAPI Application
======================================
Compliance and workflow prototype; Tamil Nadu dairy is the first case study.
"""
from __future__ import annotations

import logging
from contextlib import asynccontextmanager

from fastapi import Depends, FastAPI, Request, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.api.v1.admin import router as admin_router
from app.api.v1.auth import router as auth_router
from app.api.v1.brands import router as brands_router
from app.api.v1.chatbot import router as chatbot_router
from app.api.v1.clearances import router as clearances_router
from app.api.v1.districts import router as districts_router
from app.api.v1.documents import router as documents_router
from app.api.v1.grievances import router as grievances_router
from app.api.v1.notifications import router as notifications_router
from app.api.v1.projects import router as projects_router
from app.api.v1.rule_engine import router as rule_engine_router
from app.api.v1.schemes import router as schemes_router
from app.api.v1.users import router as users_router
from app.api.v1.registry import router as registry_router
from app.config import settings
from app.database import get_db
from sqlalchemy import text
from sqlalchemy.ext.asyncio import AsyncSession

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("clearpath")


@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("CLEARPATH AI API starting up in %s environment...", settings.APP_ENV)
    yield
    logger.info("CLEARPATH AI API shutting down...")


app = FastAPI(
    title="CLEARPATH AI — SIH 26130 API",
    description="CLEARPATH AI compliance and workflow prototype. First case study: a fictional Tamil Nadu dairy business. Internal statuses are not government approvals.",
    version="1.0.0",
    lifespan=lifespan,
    docs_url="/docs",
    redoc_url="/redoc",
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS or ["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# Government Data Transparency Header Middleware
@app.middleware("http")
async def add_transparency_headers(request: Request, call_next):
    response = await call_next(request)
    response.headers["X-Platform"] = settings.APP_NAME
    response.headers["X-Data-Source"] = "Official Government Publications (data.gov.in / FoSCoS / Aavin)"
    response.headers["X-Is-Live-Gov-API"] = "false"
    return response


# Include all v1 routers under /api/v1 prefix
app.include_router(registry_router, prefix="/api/v1")
app.include_router(auth_router, prefix="/api/v1")
app.include_router(users_router, prefix="/api/v1")
app.include_router(projects_router, prefix="/api/v1")
app.include_router(clearances_router, prefix="/api/v1")
app.include_router(documents_router, prefix="/api/v1")
app.include_router(brands_router, prefix="/api/v1")
app.include_router(districts_router, prefix="/api/v1")
app.include_router(chatbot_router, prefix="/api/v1")
app.include_router(notifications_router, prefix="/api/v1")
app.include_router(grievances_router, prefix="/api/v1")
app.include_router(schemes_router, prefix="/api/v1")
app.include_router(admin_router, prefix="/api/v1")
app.include_router(rule_engine_router, prefix="/api/v1")


@app.get("/api/v1/health", include_in_schema=False)
@app.get("/health", tags=["system"], summary="Health check endpoint")
async def health_check(db: AsyncSession | None = Depends(get_db)):
    """Readiness check: reports healthy only if the database answers a query."""
    database = "unreachable"
    try:
        if db is not None:
            await db.execute(text("SELECT 1"))
            database = "ok"
    except Exception:  # never leak driver errors to callers
        logger.warning("Health check: database query failed")
        if db is not None:
            await db.rollback()
    body = {
        "status": "healthy" if database == "ok" else "degraded",
        "platform": settings.APP_NAME,
        "version": "1.0.0",
        "database": database,
    }
    return JSONResponse(body, status_code=200 if database == "ok" else 503)


@app.get("/", tags=["system"], summary="Root endpoint")
async def root():
    return {
        "message": "Welcome to CLEARPATH AI — SIH 26130",
        "docs": "/docs",
        "tagline": "Compliance and workflow support; dairy is the first case study",
    }
