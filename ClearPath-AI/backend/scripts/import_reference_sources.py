"""Import supplied local PDFs as unreviewed evidence. Never download or activate rules."""
import argparse
import asyncio
from pathlib import Path
import sys

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from sqlalchemy import select
from app.database import AsyncSessionLocal
from app.models.registry import RegistryRule
from app.schemas.registry import SourceMetadata, RuleCreate
from app.services.registry import import_source, create_rule

REFERENCES = [
    ("fssai-eligibility", "KindofBusinessEligibility_261012_161357.pdf",
     "Kind of Business Eligibility", "FSSAI / FoSCoS (identity pending review)",
     "Development plan reports a possible conflict with a newer eligibility publication; not yet compared. Do not activate capacity or fee criteria.",
     [("manufacturing", "eligibility", 1, 1), ("retail", "eligibility", 5, 5), ("distribution", "eligibility", 4, 5)]),
    ("fssai-kob-documents", "KoBwiseDocumentsrequiredforLicense_261012_161536.pdf",
     "Kind-of-Business Documents Required for License", "FSSAI / FoSCoS (identity pending review)", None,
     [("manufacturing", "checklist", 1, 1), ("retail", "checklist", 14, 14), ("distribution", "checklist", 14, 14)]),
    ("supplied-form-a", "registrationForm_Aavin_261012_163138.pdf",
     "FSSAI Form A - Application for Registration / Renewal", "FSSAI form; supplied filename mentions Aavin",
     "Filename mentions Aavin but pages contain FSSAI Schedule 2 Form A. This does not establish Aavin franchise terms. Original source identity needs review.",
     [("manufacturing", "application_form", 1, 4), ("retail", "application_form", 1, 4), ("distribution", "application_form", 1, 4)]),
]


async def ingest(reference_dir):
    async with AsyncSessionLocal() as db:
        async with db.begin():
            for key, filename, title, issuer, conflict, passages in REFERENCES:
                path = reference_dir / filename
                metadata = SourceMetadata(title=title, issuer=issuer, conflict_note=conflict,
                    provenance_note="Supplied local repository PDF. Original retrieval date, canonical URL, publication date and effective date are unknown. received_at records local intake only; filename dates are not treated as provenance.")
                source = await import_source(db, key, filename, path.read_bytes(), metadata)
                for activity, kind, start, end in passages:
                    rule_key = f"{key}-{kind}"
                    existing = (await db.execute(select(RegistryRule).where(
                        RegistryRule.rule_key == rule_key, RegistryRule.activity == activity,
                        RegistryRule.source_version_id == source.id))).scalar_one_or_none()
                    if not existing:
                        await create_rule(db, RuleCreate(rule_key=rule_key, activity=activity, kind=kind,
                            source_version_id=source.id, title=f"{activity.title()} {kind.replace('_', ' ')} evidence - applicability pending",
                            page_start=start, page_end=end, excerpt="\n".join(source.pages[start - 1:end]),
                            conflict_note=conflict))
                print(f"{key}: version {source.version}; {source.page_count} pages; {source.sha256}; {source.state}")
    print("Import committed. No rules were verified and no eligibility or fees were activated.")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--reference-dir", type=Path, default=Path(__file__).resolve().parents[2] / "reference")
    args = parser.parse_args()
    asyncio.run(ingest(args.reference_dir))
