"""Local PDF intake and controlled review. No remote fetches or eligibility evaluation."""
import hashlib
import json
from io import BytesIO
from datetime import datetime, timezone

from fastapi import HTTPException
from pypdf import PdfReader
from sqlalchemy import func, select, text

from app.models.registry import RegistryRule, SourceVersion
from app.models.notification import AuditLog
from app.schemas.registry import SourceMetadata, RuleCreate

MAX_BYTES = 15 * 1024 * 1024
TRANSITIONS = {
    "DRAFT": {"NEEDS_REVIEW", "DISABLED"},
    "NEEDS_REVIEW": {"DRAFT", "VERIFIED", "DISABLED", "SUPERSEDED"},
    "VERIFIED": {"NEEDS_REVIEW", "DISABLED", "SUPERSEDED"},
    "DISABLED": {"NEEDS_REVIEW"},
    "SUPERSEDED": set(),
}


async def lock_registry(db):
    # Serializes version allocation, conflicts and approvals across workers.
    await db.execute(text("SELECT pg_advisory_xact_lock(26130, 2)"))


def audit(db, entity, actor_id, action, old=None, reason=None):
    db.add(AuditLog(actor_id=actor_id, action=action,
                    entity_type=entity.__tablename__, entity_id=entity.id,
                    old_values=old, new_values={"state": entity.state,
                    "version": entity.version, "conflict_note": entity.conflict_note,
                    "reason": reason}))


def parse_pdf(content):
    if not content or len(content) > MAX_BYTES:
        raise HTTPException(413, "PDF must be nonempty and at most 15 MB.")
    if not content.startswith(b"%PDF-"):
        raise HTTPException(422, "A readable PDF is required.")
    try:
        reader = PdfReader(BytesIO(content), strict=True)
        if reader.is_encrypted or not 1 <= len(reader.pages) <= 200:
            raise ValueError()
        pages = [(page.extract_text() or "") for page in reader.pages]
        if sum(map(len, pages)) > 2_000_000:
            raise ValueError()
        return pages
    except Exception:
        raise HTTPException(422, "PDF could not be read, is encrypted, or exceeds intake limits.") from None


async def import_source(db, source_key, filename, content, metadata: SourceMetadata, actor_id=None):
    pages = parse_pdf(content)
    if metadata.retrieved_at and metadata.retrieved_at > datetime.now(timezone.utc):
        raise HTTPException(422, "Original retrieval date cannot be in the future.")
    digest = hashlib.sha256(content).hexdigest()
    fingerprint = hashlib.sha256((digest + json.dumps(metadata.model_dump(mode="json"), sort_keys=True)).encode()).hexdigest()
    await lock_registry(db)
    existing = (await db.execute(select(SourceVersion).where(
        SourceVersion.source_key == source_key, SourceVersion.fingerprint == fingerprint))).scalar_one_or_none()
    if existing:
        return existing  # reimport cannot overwrite earlier provenance or review
    version = (await db.execute(select(func.max(SourceVersion.version)).where(
        SourceVersion.source_key == source_key))).scalar() or 0
    values = metadata.model_dump()
    values["canonical_url"] = str(metadata.canonical_url) if metadata.canonical_url else None
    item = SourceVersion(source_key=source_key, version=version + 1, filename=filename,
                         content=content, sha256=digest, fingerprint=fingerprint, page_count=len(pages), pages=pages,
                         state="NEEDS_REVIEW", created_by=actor_id, **values)
    db.add(item)
    await db.flush()
    audit(db, item, actor_id, "SOURCE_IMPORTED", reason=metadata.provenance_note)
    if item.conflict_note:
        await invalidate_conflicting_group(db, item, actor_id, item.conflict_note)
    return item


async def get_entity(db, model, entity_id):
    entity = await db.get(model, entity_id)
    if entity is None:
        raise HTTPException(404, "Registry record not found.")
    return entity


async def create_rule(db, body: RuleCreate, actor_id=None):
    await lock_registry(db)
    source = await get_entity(db, SourceVersion, body.source_version_id)
    if source.state in ("DISABLED", "SUPERSEDED"):
        raise HTTPException(409, "Use an active source version for a new rule draft.")
    if not 1 <= body.page_start <= body.page_end <= source.page_count:
        raise HTTPException(422, "Page reference is outside the source version.")
    normalize = lambda value: " ".join(value.split())
    if normalize(body.excerpt) not in normalize("\n".join(source.pages[body.page_start - 1:body.page_end])):
        raise HTTPException(422, "Excerpt must match text on the cited source pages.")
    version = (await db.execute(select(func.max(RegistryRule.version)).where(
        RegistryRule.rule_key == body.rule_key, RegistryRule.activity == body.activity))).scalar() or 0
    item = RegistryRule(**body.model_dump(), version=version + 1, state="DRAFT", created_by=actor_id)
    db.add(item)
    await db.flush()
    audit(db, item, actor_id, "RULE_DRAFTED", reason="Page-cited draft; applicability not established.")
    if item.conflict_note:
        await invalidate_conflicting_group(db, item, actor_id, item.conflict_note)
    return item


async def review(db, model, entity_id, body, reviewer):
    await lock_registry(db)
    item = await get_entity(db, model, entity_id)
    if item.state != body.expected_state:
        raise HTTPException(409, "Review state changed; reload the record.")
    if body.state not in TRANSITIONS[item.state]:
        raise HTTPException(409, "This review transition is not allowed.")
    if body.state == "VERIFIED":
        if item.created_by == reviewer.user_id:
            raise HTTPException(403, "A different reviewer must verify this record.")
        if item.conflict_note:
            raise HTTPException(409, "Resolve the recorded conflict before verification.")
        if model is SourceVersion:
            if not item.canonical_url or not item.retrieved_at:
                raise HTTPException(409, "Verification requires an original retrieval date and canonical source URL. Import a documented version; local receipt is not original retrieval.")
            siblings = (await db.execute(select(SourceVersion).where(SourceVersion.source_key == item.source_key))).scalars().all()
        else:
            source = await get_entity(db, SourceVersion, item.source_version_id)
            if source.state != "VERIFIED" or source.conflict_note:
                raise HTTPException(409, "The cited source version must be verified and conflict-free.")
            siblings = (await db.execute(select(RegistryRule).where(
                RegistryRule.rule_key == item.rule_key, RegistryRule.activity == item.activity))).scalars().all()
        if any(s.id != item.id and (s.state == "VERIFIED" or (s.conflict_note and s.state not in ("DISABLED", "SUPERSEDED"))) for s in siblings):
            raise HTTPException(409, "Another version is verified or has an unresolved conflict. Review it first.")
    old = {"state": item.state, "reviewed_by": str(item.reviewed_by) if item.reviewed_by else None}
    item.state = body.state
    item.reviewed_by = reviewer.user_id
    item.reviewed_at = datetime.now(timezone.utc)
    item.review_note = body.reason
    audit(db, item, reviewer.user_id, "REGISTRY_REVIEW", old, body.reason)
    if model is SourceVersion and item.state != "VERIFIED":
        await demote_dependents(db, item, reviewer.user_id, body.reason)
    await db.flush()
    return item


async def demote_dependents(db, source, actor_id, reason):
    rules = (await db.execute(select(RegistryRule).where(
        RegistryRule.source_version_id == source.id, RegistryRule.state == "VERIFIED"))).scalars().all()
    for rule in rules:
        rule.state = "NEEDS_REVIEW"
        audit(db, rule, actor_id, "SOURCE_REVIEW_INVALIDATED_RULE", {"state": "VERIFIED"}, reason)


async def invalidate_conflicting_group(db, item, actor_id, reason):
    if isinstance(item, SourceVersion):
        statement = select(SourceVersion).where(SourceVersion.source_key == item.source_key, SourceVersion.state == "VERIFIED")
    else:
        statement = select(RegistryRule).where(RegistryRule.rule_key == item.rule_key,
            RegistryRule.activity == item.activity, RegistryRule.state == "VERIFIED")
    for sibling in (await db.execute(statement)).scalars().all():
        sibling.state = "NEEDS_REVIEW"
        audit(db, sibling, actor_id, "CONFLICT_INVALIDATED_REVIEW", {"state": "VERIFIED"}, reason)
        if isinstance(sibling, SourceVersion):
            await demote_dependents(db, sibling, actor_id, reason)


async def set_conflict(db, model, entity_id, body, reviewer):
    await lock_registry(db)
    item = await get_entity(db, model, entity_id)
    if item.state == "SUPERSEDED":
        raise HTTPException(409, "Superseded records are terminal; record a new version.")
    old = {"state": item.state, "conflict_note": item.conflict_note}
    item.conflict_note = body.conflict_note
    if item.state == "VERIFIED" and body.conflict_note:
        item.state = "NEEDS_REVIEW"
    audit(db, item, reviewer.user_id, "REGISTRY_CONFLICT", old, body.reason)
    if model is SourceVersion and body.conflict_note:
        await demote_dependents(db, item, reviewer.user_id, body.reason)
    if body.conflict_note:
        await invalidate_conflicting_group(db, item, reviewer.user_id, body.reason)
    await db.flush()
    return item
