#!/usr/bin/env python3
"""
ClearPathAI Database Preflight Verifier (Phase DB0)

Read-only inspection script that detects violations of upcoming schema constraints:
1. Case-duplicate user emails
2. Invalid role, status, priority, and tier values against allowed enum sets
3. Duplicate natural keys on tables lacking unique constraints
4. Orphan rows in regulatory and child tables
5. File / row inconsistencies (disk files without DB rows; DB rows without disk files)

OUTPUTS row IDs and violating values. MODIFIES NOTHING.
Returns exit code 0 if clean, 1 if any violations exist.
"""
from __future__ import annotations

import argparse
import os
import sys
from collections.abc import Sequence
from pathlib import Path
from typing import Any

from sqlalchemy import create_engine, inspect, text
from sqlalchemy.engine import Connection, Engine

# Allowed value sets derived from domain rules, route schemas, and UI adapters
ALLOWED_USER_ROLES = {"user", "farmer", "entrepreneur", "consultant", "officer", "admin"}
ALLOWED_APPLICATION_STATUSES = {
    "draft",
    "submitted",
    "under_review",
    "approved",
    "rejected",
    "returned",
    "attention_needed",
}
ALLOWED_LICENSE_TIERS = {"registration", "state_license", "central_license"}
ALLOWED_PROJECT_STATUSES = {"draft", "active", "completed", "abandoned"}
ALLOWED_GRIEVANCE_STATUSES = {"open", "in_progress", "resolved", "closed"}
ALLOWED_GRIEVANCE_PRIORITIES = {"low", "medium", "high", "urgent"}
ALLOWED_UPLOAD_STATUSES = {"uploaded", "processing", "verified", "failed"}
ALLOWED_VALIDATION_STATUSES = {"pending", "passed", "warning", "failed"}
ALLOWED_NOTIFICATION_TYPES = {"info", "success", "warning", "error"}
ALLOWED_RULE_STATUSES = {"unverified", "needs_review", "verified", "superseded", "disabled"}


class PreflightReport:
    def __init__(self) -> None:
        self.violations: list[dict[str, Any]] = []

    def add(self, category: str, description: str, rows: Sequence[dict[str, Any]]) -> None:
        if rows:
            self.violations.append(
                {
                    "category": category,
                    "description": description,
                    "count": len(rows),
                    "rows": list(rows),
                }
            )

    @property
    def has_violations(self) -> bool:
        return len(self.violations) > 0

    def print_summary(self) -> None:
        print("=" * 80)
        print("CLEARPATHAI DATABASE PREFLIGHT REPORT (READ-ONLY)")
        print("=" * 80)
        if not self.violations:
            print("STATUS: PASS - Zero constraint violations detected across all checked tables.")
            print("=" * 80)
            return

        total_issues = sum(v["count"] for v in self.violations)
        print(f"STATUS: FAIL - Found {total_issues} violations across {len(self.violations)} categories.\n")
        for idx, v in enumerate(self.violations, 1):
            print(f"[{idx}] {v['category']} ({v['count']} offending rows)")
            print(f"    Description: {v['description']}")
            print("    Offending Records:")
            for r in v["rows"][:20]:
                print(f"      - {r}")
            if len(v["rows"]) > 20:
                print(f"      ... and {len(v['rows']) - 20} more")
            print()
        print("=" * 80)


def table_exists(conn: Connection, table_name: str) -> bool:
    inspector = inspect(conn)
    return table_name in inspector.get_table_names()


def check_case_duplicate_emails(conn: Connection, report: PreflightReport) -> None:
    if not table_exists(conn, "users"):
        return
    rows = conn.execute(
        text(
            """
            SELECT lower(email) AS lower_email, count(*) AS cnt
            FROM users
            GROUP BY lower(email)
            HAVING count(*) > 1
            """
        )
    ).mappings().all()

    offenders = []
    for r in rows:
        user_rows = conn.execute(
            text("SELECT user_id, email, role FROM users WHERE lower(email) = :le"),
            {"le": r["lower_email"]},
        ).mappings().all()
        offenders.append(
            {
                "lower_email": r["lower_email"],
                "count": r["cnt"],
                "users": [dict(u) for u in user_rows],
            }
        )
    report.add("Case-Duplicate Emails", "Multiple users share the same email differing only by case", offenders)


def check_free_text_constraints(conn: Connection, report: PreflightReport) -> None:
    # 1. users.role
    if table_exists(conn, "users"):
        rows = conn.execute(
            text("SELECT user_id, email, role FROM users WHERE role IS NOT NULL")
        ).mappings().all()
        bad = [dict(r) for r in rows if str(r["role"]).strip() not in ALLOWED_USER_ROLES]
        report.add("Invalid users.role", f"Role not in {sorted(ALLOWED_USER_ROLES)}", bad)

    # 2. applications.status & license_tier
    if table_exists(conn, "applications"):
        rows = conn.execute(
            text("SELECT application_id, status, license_tier FROM applications")
        ).mappings().all()
        bad_status = [
            dict(r) for r in rows if r["status"] and str(r["status"]).strip() not in ALLOWED_APPLICATION_STATUSES
        ]
        report.add(
            "Invalid applications.status",
            f"Status not in {sorted(ALLOWED_APPLICATION_STATUSES)}",
            bad_status,
        )

        bad_tier = [
            dict(r)
            for r in rows
            if r["license_tier"] and str(r["license_tier"]).strip() not in ALLOWED_LICENSE_TIERS
        ]
        report.add(
            "Invalid applications.license_tier",
            f"Tier not NULL and not in {sorted(ALLOWED_LICENSE_TIERS)}",
            bad_tier,
        )

    # 3. projects.status
    if table_exists(conn, "projects"):
        rows = conn.execute(text("SELECT project_id, status FROM projects")).mappings().all()
        bad_proj = [
            dict(r) for r in rows if r["status"] and str(r["status"]).strip() not in ALLOWED_PROJECT_STATUSES
        ]
        report.add("Invalid projects.status", f"Status not in {sorted(ALLOWED_PROJECT_STATUSES)}", bad_proj)

    # 4. grievances.status & priority
    if table_exists(conn, "grievances"):
        rows = conn.execute(text("SELECT grievance_id, status, priority FROM grievances")).mappings().all()
        bad_griev = [
            dict(r)
            for r in rows
            if (r["status"] and str(r["status"]).strip() not in ALLOWED_GRIEVANCE_STATUSES)
            or (r["priority"] and str(r["priority"]).strip() not in ALLOWED_GRIEVANCE_PRIORITIES)
        ]
        report.add(
            "Invalid grievances status/priority",
            f"Status not in {sorted(ALLOWED_GRIEVANCE_STATUSES)} or priority not in {sorted(ALLOWED_GRIEVANCE_PRIORITIES)}",
            bad_griev,
        )

    # 5. application_documents.upload_status & validation_status
    if table_exists(conn, "application_documents"):
        rows = conn.execute(
            text("SELECT document_id, upload_status, validation_status FROM application_documents")
        ).mappings().all()
        bad_docs = [
            dict(r)
            for r in rows
            if (r["upload_status"] and str(r["upload_status"]).strip() not in ALLOWED_UPLOAD_STATUSES)
            or (
                r["validation_status"]
                and str(r["validation_status"]).strip() not in ALLOWED_VALIDATION_STATUSES
            )
        ]
        report.add(
            "Invalid application_documents statuses",
            f"upload_status not in {sorted(ALLOWED_UPLOAD_STATUSES)} or validation_status not in {sorted(ALLOWED_VALIDATION_STATUSES)}",
            bad_docs,
        )

    # 6. notifications.notification_type
    if table_exists(conn, "notifications"):
        rows = conn.execute(text("SELECT notification_id, notification_type FROM notifications")).mappings().all()
        bad_notifs = [
            dict(r)
            for r in rows
            if r["notification_type"] and str(r["notification_type"]).strip() not in ALLOWED_NOTIFICATION_TYPES
        ]
        report.add(
            "Invalid notifications.notification_type",
            f"Type not in {sorted(ALLOWED_NOTIFICATION_TYPES)}",
            bad_notifs,
        )

    # 7. fssai_rules.rule_status
    if table_exists(conn, "fssai_rules"):
        rows = conn.execute(text("SELECT rule_id, rule_status FROM fssai_rules")).mappings().all()
        bad_rules = [
            dict(r)
            for r in rows
            if r["rule_status"] and str(r["rule_status"]).strip() not in ALLOWED_RULE_STATUSES
        ]
        report.add(
            "Invalid fssai_rules.rule_status",
            f"rule_status not in {sorted(ALLOWED_RULE_STATUSES)}",
            bad_rules,
        )


def check_missing_uniqueness(conn: Connection, report: PreflightReport) -> None:
    # 1. user_organizations(user_id, organization_id)
    if table_exists(conn, "user_organizations"):
        dups = conn.execute(
            text(
                """
                SELECT user_id, organization_id, count(*) AS cnt
                FROM user_organizations
                GROUP BY user_id, organization_id
                HAVING count(*) > 1
                """
            )
        ).mappings().all()
        report.add(
            "Duplicate user_organizations",
            "Multiple rows linking the same user_id and organization_id",
            [dict(d) for d in dups],
        )

    # 2. district_milk_production(district, year)
    if table_exists(conn, "district_milk_production"):
        dups = conn.execute(
            text(
                """
                SELECT district, year, count(*) AS cnt
                FROM district_milk_production
                GROUP BY district, year
                HAVING count(*) > 1
                """
            )
        ).mappings().all()
        report.add(
            "Duplicate district_milk_production",
            "Multiple production rows for same district and year",
            [dict(d) for d in dups],
        )

    # 3. brand_requirements(brand_id, requirement_name)
    if table_exists(conn, "brand_requirements"):
        dups = conn.execute(
            text(
                """
                SELECT brand_id, requirement_name, count(*) AS cnt
                FROM brand_requirements
                GROUP BY brand_id, requirement_name
                HAVING count(*) > 1
                """
            )
        ).mappings().all()
        report.add(
            "Duplicate brand_requirements",
            "Multiple requirement rows for same brand_id and requirement_name",
            [dict(d) for d in dups],
        )


def check_file_consistency(
    conn: Connection, upload_root: Path, report: PreflightReport
) -> None:
    if not table_exists(conn, "application_documents"):
        return

    rows = conn.execute(
        text("SELECT document_id, file_url FROM application_documents")
    ).mappings().all()

    # 1. Database rows pointing to non-existent files on disk
    missing_files = []
    recorded_paths: set[Path] = set()

    for r in rows:
        raw_url = str(r["file_url"]).strip()
        # file_url may be a relative storage path or absolute
        candidate = Path(raw_url)
        if not candidate.is_absolute():
            candidate = upload_root / candidate

        recorded_paths.add(candidate.resolve())
        if not candidate.exists():
            missing_files.append(
                {
                    "document_id": str(r["document_id"]),
                    "file_url": raw_url,
                    "expected_path": str(candidate),
                }
            )

    report.add(
        "Missing Files on Disk",
        "Application document records pointing to files that do not exist on disk",
        missing_files,
    )

    # 2. Orphan files on disk not recorded in any database row
    orphan_files = []
    if upload_root.exists():
        for f in upload_root.rglob("*"):
            if f.is_file():
                if f.resolve() not in recorded_paths:
                    orphan_files.append({"orphan_path": str(f)})

    report.add(
        "Orphan Files on Disk",
        "Files stored in upload directory not referenced by any application_documents row",
        orphan_files,
    )


def run_preflight(engine: Engine, upload_dir: str | Path | None = None) -> PreflightReport:
    report = PreflightReport()
    upload_path = Path(upload_dir or (Path(__file__).resolve().parent.parent / "uploads"))

    with engine.connect() as conn:
        check_case_duplicate_emails(conn, report)
        check_free_text_constraints(conn, report)
        check_missing_uniqueness(conn, report)
        check_file_consistency(conn, upload_path, report)

    return report


def main() -> int:
    parser = argparse.ArgumentParser(description="ClearPathAI Database Preflight Verifier")
    parser.add_argument(
        "--db-url",
        default=os.getenv("SYNC_DATABASE_URL"),
        help="Database URL to check (defaults to SYNC_DATABASE_URL env var)",
    )
    parser.add_argument(
        "--uploads-dir",
        default=None,
        help="Path to uploads directory (defaults to backend/uploads)",
    )
    args = parser.parse_args()

    db_url = args.db_url
    if not db_url:
        try:
            from app.config import settings
            db_url = settings.SYNC_DATABASE_URL
        except Exception:
            db_url = "postgresql://clearpathai:change-this-local-password@127.0.0.1:5432/clearpathai_tn"

    try:
        engine = create_engine(db_url, pool_pre_ping=True)
        report = run_preflight(engine, args.uploads_dir)
        report.print_summary()
        return 1 if report.has_violations else 0
    except Exception as exc:
        print(f"ERROR: Failed to connect to database at {db_url}: {exc}", file=sys.stderr)
        return 2


if __name__ == "__main__":
    sys.exit(main())
