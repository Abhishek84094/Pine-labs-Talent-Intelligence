"""Database setup and session management"""
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine, async_sessionmaker
from sqlalchemy.orm import DeclarativeBase
from app.core.config import get_settings

settings = get_settings()

engine = create_async_engine(
    settings.database_url,
    echo=settings.debug,
    connect_args={"check_same_thread": False},
)

AsyncSessionLocal = async_sessionmaker(
    engine,
    class_=AsyncSession,
    expire_on_commit=False,
)


class Base(DeclarativeBase):
    pass


async def get_db():
    async with AsyncSessionLocal() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise
        finally:
            await session.close()


async def init_db():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

        def _migrate(sync_conn):
            from sqlalchemy import text
            result = sync_conn.execute(text("PRAGMA table_info(submissions)"))
            existing_columns = {row[1] for row in result.fetchall()}

            column_definitions = [
                ("review_status", "VARCHAR(50) DEFAULT 'pending'"),
                ("review_checklist", "TEXT"),
                ("reviewed_at", "DATETIME"),
                ("reviewed_by", "VARCHAR(100)"),
                ("email_sent", "BOOLEAN DEFAULT 0"),
                ("email_sent_at", "DATETIME"),
                ("interview_details", "TEXT"),
            ]
            for col_name, col_type in column_definitions:
                if col_name not in existing_columns:
                    sync_conn.execute(text(f"ALTER TABLE submissions ADD COLUMN {col_name} {col_type}"))

        await conn.run_sync(_migrate)
