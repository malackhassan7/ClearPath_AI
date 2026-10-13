"""Create (or promote) the first administrator account.

Self-registration cannot create officer/admin accounts, so run this once after the database is up:

    docker compose exec api python scripts/create_admin.py --email you@example.com --name "Your Name"

The password is read from the ADMIN_PASSWORD environment variable or prompted for (never passed on the
command line, so it does not end up in shell history).
"""
from __future__ import annotations

import argparse
import getpass
import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))

from pydantic import EmailStr, TypeAdapter, ValidationError  # noqa: E402
from sqlalchemy import create_engine, select  # noqa: E402
from sqlalchemy.orm import Session  # noqa: E402

from app.api.v1.auth import _hash_password  # noqa: E402
from app.config import settings  # noqa: E402
from app.models.user import User  # noqa: E402

ROLES = ("admin", "officer")


def main() -> int:
    parser = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    parser.add_argument("--email", required=True)
    parser.add_argument("--name", required=True)
    parser.add_argument("--role", choices=ROLES, default="admin")
    parser.add_argument("--promote", action="store_true", help="change the role of an existing account")
    args = parser.parse_args()
    try:  # same rule the API uses, so the account can actually sign in afterwards
        args.email = str(TypeAdapter(EmailStr).validate_python(args.email)).strip().lower()
    except ValidationError as exc:
        print(f"Invalid email address: {exc.errors()[0]['msg']}", file=sys.stderr)
        return 1

    engine = create_engine(settings.SYNC_DATABASE_URL)
    with Session(engine) as session:
        existing = session.execute(select(User).where(User.email == args.email)).scalar_one_or_none()
        if existing:
            if not args.promote:
                print(f"{args.email} already exists. Use --promote to change its role.", file=sys.stderr)
                return 1
            existing.role = args.role
            session.commit()
            print(f"{args.email} is now {args.role}.")
            return 0
        password = os.environ.get("ADMIN_PASSWORD") or getpass.getpass("Password (min 8 characters): ")
        if len(password) < 8:
            print("Password must be at least 8 characters.", file=sys.stderr)
            return 1
        session.add(User(full_name=args.name, email=args.email, password_hash=_hash_password(password),
                         role=args.role, email_verified=True))
        session.commit()
        print(f"Created {args.role} account for {args.email}.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
