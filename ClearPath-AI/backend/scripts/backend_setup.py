"""Repeatable local setup. Run from any directory using this script's path."""
from __future__ import annotations

import argparse
from pathlib import Path
import secrets
import sys

BACKEND = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(BACKEND))


def init_env() -> None:
    target = BACKEND / ".env"
    try:
        with target.open("x", encoding="utf-8") as stream:
            password = secrets.token_hex(24)
            stream.write(
                "APP_NAME=CLEARPATH AI\nAPP_ENV=development\n"
                f"POSTGRES_PASSWORD={password}\nPOSTGRES_PORT=55432\n"
                f"DATABASE_URL=postgresql+asyncpg://dairysetu:{password}@127.0.0.1:55432/dairysetu_tn\n"
                f"JWT_SECRET_KEY={secrets.token_urlsafe(48)}\n"
                'CORS_ORIGINS=["http://localhost:3000","http://127.0.0.1:3000","http://localhost:5173"]\n'
            )
        print("Created backend/.env with unique local credentials. Start the Compose db service next.")
    except FileExistsError:
        print("backend/.env already exists; preserved without changes.")


def alembic_config():
    from alembic.config import Config
    config = Config(str(BACKEND / "alembic.ini"))
    config.set_main_option("script_location", str(BACKEND / "alembic"))
    return config


def check_database(require_head: bool = True) -> None:
    from sqlalchemy import create_engine, text
    from alembic.script import ScriptDirectory
    from app.config import settings
    engine = create_engine(settings.SYNC_DATABASE_URL, connect_args={"connect_timeout": 5})
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
            available = conn.execute(text("SELECT name FROM pg_available_extensions WHERE name='vector'")).scalar()
            if not available:
                raise RuntimeError("pgvector is unavailable. Use the pgvector Compose database image.")
            if require_head:
                exists = conn.execute(text("SELECT to_regclass('public.alembic_version')")).scalar()
                if not exists:
                    raise RuntimeError("Database schema is missing. Run backend_setup.py --migrate.")
                versions = set(conn.execute(text("SELECT version_num FROM alembic_version")).scalars())
                if versions != set(ScriptDirectory.from_config(alembic_config()).get_heads()):
                    raise RuntimeError("Database schema is behind or diverged. Review and run migrations.")
                installed = conn.execute(text("SELECT extname FROM pg_extension WHERE extname='vector'")).scalar()
                if not installed:
                    raise RuntimeError("pgvector extension has not been installed in this database.")
    finally:
        engine.dispose()


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__)
    group = parser.add_mutually_exclusive_group(required=True)
    group.add_argument("--init-env", action="store_true")
    group.add_argument("--check", action="store_true")
    group.add_argument("--migrate", action="store_true")
    args = parser.parse_args()
    try:
        if args.init_env:
            init_env()
            return 0
        check_database(require_head=not args.migrate)
        if args.migrate:
            from alembic import command
            command.upgrade(alembic_config(), "head")
            check_database()
        print("PASS: PostgreSQL reachable, pgvector installed, migrations at head.")
        return 0
    except RuntimeError as exc:
        print(f"Setup failed: {exc}", file=sys.stderr)
    except Exception as exc:
        # Driver/config exceptions may contain credentials; never echo them.
        print(f"Setup failed ({type(exc).__name__}). Check backend/.env, PostgreSQL credentials, service availability and migration compatibility.", file=sys.stderr)
    return 1


if __name__ == "__main__":
    raise SystemExit(main())
