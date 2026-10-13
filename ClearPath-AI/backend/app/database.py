"""PostgreSQL engines and transactional sessions. Never fall back to SQLite."""
from collections.abc import AsyncGenerator
from sqlalchemy import create_engine
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker, create_async_engine
from sqlalchemy.orm import DeclarativeBase
from app.config import settings

async_engine = create_async_engine(
    settings.DATABASE_URL, pool_size=10, max_overflow=20, pool_pre_ping=True,
    connect_args={"timeout": 5, "command_timeout": 10},
)
AsyncSessionLocal = async_sessionmaker(async_engine, expire_on_commit=False, autoflush=False)
sync_engine = create_engine(
    settings.SYNC_DATABASE_URL, pool_pre_ping=True, connect_args={"connect_timeout": 5},
)

class Base(DeclarativeBase):
    pass

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
