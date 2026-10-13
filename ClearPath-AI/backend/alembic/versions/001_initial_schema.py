"""Create the initial schema from explicit DDL.

Revision ID: 001_initial_schema
Revises:
"""
from alembic import op
import sqlalchemy as sa
import pgvector
import pgvector.sqlalchemy
from sqlalchemy.dialects import postgresql

revision = "001_initial_schema"
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.execute("CREATE EXTENSION IF NOT EXISTS vector;")

    op.create_table('brands',
    sa.Column('brand_id', sa.UUID(), nullable=False),
    sa.Column('brand_name', sa.String(length=150), nullable=False),
    sa.Column('brand_type', sa.String(length=50), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('logo_url', sa.String(length=500), nullable=True),
    sa.Column('website_url', sa.String(length=500), nullable=True),
    sa.Column('contact_email', sa.String(length=200), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('brand_id'),
    sa.UniqueConstraint('brand_name')
    )

    op.create_table('business_types',
    sa.Column('business_type_id', sa.UUID(), nullable=False),
    sa.Column('type_name', sa.String(length=150), nullable=False),
    sa.Column('type_code', sa.String(length=50), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('typical_capacity_min_lpd', sa.Integer(), nullable=True),
    sa.Column('typical_capacity_max_lpd', sa.Integer(), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('business_type_id'),
    sa.UniqueConstraint('type_code'),
    sa.UniqueConstraint('type_name')
    )

    op.create_table('chatbot_documents',
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('document_title', sa.String(length=300), nullable=False),
    sa.Column('document_type', sa.String(length=100), nullable=False),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('source_org', sa.String(length=200), nullable=True),
    sa.Column('language', sa.String(length=10), nullable=False),
    sa.Column('file_path', sa.String(length=1000), nullable=True),
    sa.Column('total_chunks', sa.Integer(), nullable=False),
    sa.Column('ingested_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('document_id')
    )

    op.create_table('district_milk_production',
    sa.Column('record_id', sa.UUID(), nullable=False),
    sa.Column('district', sa.String(length=100), nullable=False),
    sa.Column('year', sa.String(length=10), nullable=False),
    sa.Column('production_thousand_tonnes', sa.Float(), nullable=False),
    sa.Column('source', sa.String(length=255), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('retrieved_on', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('record_id')
    )

    op.create_table('government_schemes',
    sa.Column('scheme_id', sa.UUID(), nullable=False),
    sa.Column('scheme_name', sa.String(length=255), nullable=False),
    sa.Column('sponsoring_body', sa.String(length=255), nullable=False),
    sa.Column('scheme_type', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('eligibility_criteria', sa.Text(), nullable=True),
    sa.Column('benefit_amount_inr', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('benefit_description', sa.Text(), nullable=True),
    sa.Column('application_url', sa.String(length=500), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('valid_from', sa.Date(), nullable=True),
    sa.Column('valid_until', sa.Date(), nullable=True),
    sa.Column('last_verified_on', sa.Date(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('scheme_id')
    )

    op.create_table('organizations',
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('org_name', sa.String(length=200), nullable=False),
    sa.Column('org_type', sa.String(length=50), nullable=True),
    sa.Column('district', sa.String(length=100), nullable=True),
    sa.Column('address', sa.Text(), nullable=True),
    sa.Column('gst_number', sa.String(length=20), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('organization_id')
    )

    op.create_table('users',
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('email', sa.String(length=200), nullable=False),
    sa.Column('phone', sa.String(length=15), nullable=True),
    sa.Column('password_hash', sa.String(length=255), nullable=False),
    sa.Column('role', sa.String(length=20), nullable=False),
    sa.Column('preferred_language', sa.String(length=10), nullable=False),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('email_verified', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.PrimaryKeyConstraint('user_id'),
    sa.UniqueConstraint('email'),
    sa.UniqueConstraint('phone')
    )

    op.create_table('audit_logs',
    sa.Column('log_id', sa.UUID(), nullable=False),
    sa.Column('actor_id', sa.UUID(), nullable=True),
    sa.Column('action', sa.String(length=100), nullable=False),
    sa.Column('entity_type', sa.String(length=100), nullable=False),
    sa.Column('entity_id', sa.UUID(), nullable=True),
    sa.Column('old_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('new_values', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('ip_address', sa.String(length=45), nullable=True),
    sa.Column('user_agent', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['actor_id'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('log_id')
    )

    op.create_table('brand_requirements',
    sa.Column('requirement_id', sa.UUID(), nullable=False),
    sa.Column('brand_id', sa.UUID(), nullable=False),
    sa.Column('requirement_type', sa.String(length=100), nullable=False),
    sa.Column('requirement_name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_mandatory', sa.Boolean(), nullable=False),
    sa.Column('fee_amount', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('fee_currency', sa.String(length=5), nullable=False),
    sa.Column('template_url', sa.String(length=500), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('last_verified_on', sa.Date(), nullable=True),
    sa.Column('rule_status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['brand_id'], ['brands.brand_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('requirement_id')
    )

    op.create_table('chatbot_chunks',
    sa.Column('chunk_id', sa.UUID(), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('chunk_index', sa.Integer(), nullable=False),
    sa.Column('chunk_text', sa.Text(), nullable=False),
    sa.Column('page_number', sa.Integer(), nullable=True),
    sa.Column('word_count', sa.Integer(), nullable=True),
    sa.Column('embedding', pgvector.sqlalchemy.vector.VECTOR(dim=384), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['chatbot_documents.document_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('chunk_id')
    )

    op.create_table('chatbot_conversations',
    sa.Column('conversation_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('question', sa.Text(), nullable=False),
    sa.Column('answer', sa.Text(), nullable=False),
    sa.Column('language', sa.String(length=10), nullable=False),
    sa.Column('sources', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('chunk_ids_used', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('llm_provider', sa.String(length=50), nullable=True),
    sa.Column('response_time_ms', sa.Integer(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('conversation_id')
    )

    op.create_table('farmers',
    sa.Column('farmer_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('farmer_code', sa.String(length=50), nullable=True),
    sa.Column('full_name', sa.String(length=150), nullable=False),
    sa.Column('village', sa.String(length=100), nullable=True),
    sa.Column('district', sa.String(length=100), nullable=True),
    sa.Column('phone', sa.String(length=15), nullable=True),
    sa.Column('cattle_count', sa.Integer(), nullable=False),
    sa.Column('average_daily_yield_lpd', sa.Float(), nullable=True),
    sa.Column('bank_account_number', sa.String(length=50), nullable=True),
    sa.Column('bank_ifsc', sa.String(length=20), nullable=True),
    sa.Column('is_active', sa.Boolean(), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('farmer_id'),
    sa.UniqueConstraint('farmer_code')
    )

    op.create_table('fssai_rules',
    sa.Column('rule_id', sa.UUID(), nullable=False),
    sa.Column('business_type_id', sa.UUID(), nullable=False),
    sa.Column('license_tier', sa.String(length=50), nullable=False),
    sa.Column('license_form', sa.String(length=20), nullable=False),
    sa.Column('capacity_min_lpd', sa.Integer(), nullable=True),
    sa.Column('capacity_max_lpd', sa.Integer(), nullable=True),
    sa.Column('turnover_min_inr', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('turnover_max_inr', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('annual_fee_inr', sa.Numeric(precision=12, scale=2), nullable=False),
    sa.Column('rule_status', sa.String(length=20), nullable=False),
    sa.Column('validity_years', sa.Integer(), nullable=False),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('effective_date', sa.Date(), nullable=True),
    sa.Column('last_verified_on', sa.Date(), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['business_type_id'], ['business_types.business_type_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('rule_id')
    )

    op.create_table('grievances',
    sa.Column('grievance_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=True),
    sa.Column('organization_id', sa.UUID(), nullable=True),
    sa.Column('category', sa.String(length=100), nullable=False),
    sa.Column('description', sa.Text(), nullable=False),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('priority', sa.String(length=20), nullable=False),
    sa.Column('resolution_notes', sa.Text(), nullable=True),
    sa.Column('assigned_to', sa.UUID(), nullable=True),
    sa.Column('resolved_at', sa.DateTime(timezone=True), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['assigned_to'], ['users.user_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.organization_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('grievance_id')
    )

    op.create_table('notifications',
    sa.Column('notification_id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('title', sa.String(length=255), nullable=False),
    sa.Column('message', sa.Text(), nullable=False),
    sa.Column('notification_type', sa.String(length=50), nullable=False),
    sa.Column('is_read', sa.Boolean(), nullable=False),
    sa.Column('related_entity_type', sa.String(length=50), nullable=True),
    sa.Column('related_entity_id', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('read_at', sa.DateTime(timezone=True), nullable=True),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('notification_id')
    )

    op.create_table('product_batches',
    sa.Column('batch_id', sa.UUID(), nullable=False),
    sa.Column('brand_id', sa.UUID(), nullable=True),
    sa.Column('batch_number', sa.String(length=100), nullable=False),
    sa.Column('product_type', sa.String(length=100), nullable=False),
    sa.Column('quantity_litres', sa.Float(), nullable=True),
    sa.Column('quantity_kg', sa.Float(), nullable=True),
    sa.Column('production_date', sa.Date(), nullable=False),
    sa.Column('expiry_date', sa.Date(), nullable=True),
    sa.Column('quality_grade', sa.String(length=10), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['brand_id'], ['brands.brand_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('batch_id'),
    sa.UniqueConstraint('batch_number')
    )

    op.create_table('projects',
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=True),
    sa.Column('created_by', sa.UUID(), nullable=False),
    sa.Column('project_name', sa.String(length=255), nullable=False),
    sa.Column('district', sa.String(length=100), nullable=False),
    sa.Column('business_type_id', sa.UUID(), nullable=True),
    sa.Column('brand_id', sa.UUID(), nullable=True),
    sa.Column('capacity_lpd', sa.Float(), nullable=True),
    sa.Column('annual_turnover', sa.Numeric(precision=18, scale=2), nullable=True),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['brand_id'], ['brands.brand_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['business_type_id'], ['business_types.business_type_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['created_by'], ['users.user_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.organization_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('project_id')
    )

    op.create_table('user_organizations',
    sa.Column('id', sa.UUID(), nullable=False),
    sa.Column('user_id', sa.UUID(), nullable=False),
    sa.Column('organization_id', sa.UUID(), nullable=False),
    sa.Column('role_in_org', sa.String(length=50), nullable=False),
    sa.Column('joined_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['organization_id'], ['organizations.organization_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['user_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('id')
    )

    op.create_table('applications',
    sa.Column('application_id', sa.UUID(), nullable=False),
    sa.Column('project_id', sa.UUID(), nullable=False),
    sa.Column('applicant_id', sa.UUID(), nullable=False),
    sa.Column('application_type', sa.String(length=100), nullable=False),
    sa.Column('license_tier', sa.String(length=50), nullable=True),
    sa.Column('status', sa.String(length=30), nullable=False),
    sa.Column('submission_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('decision_date', sa.DateTime(timezone=True), nullable=True),
    sa.Column('fssai_rule_id', sa.UUID(), nullable=True),
    sa.Column('estimated_fee_inr', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['applicant_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['fssai_rule_id'], ['fssai_rules.rule_id'], ondelete='SET NULL'),
    sa.ForeignKeyConstraint(['project_id'], ['projects.project_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('application_id')
    )

    op.create_table('fssai_required_documents',
    sa.Column('doc_id', sa.UUID(), nullable=False),
    sa.Column('rule_id', sa.UUID(), nullable=False),
    sa.Column('document_name', sa.String(length=255), nullable=False),
    sa.Column('description', sa.Text(), nullable=True),
    sa.Column('is_mandatory', sa.Boolean(), nullable=False),
    sa.Column('template_url', sa.String(length=500), nullable=True),
    sa.Column('source_url', sa.String(length=500), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['rule_id'], ['fssai_rules.rule_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('doc_id')
    )

    op.create_table('milk_collections',
    sa.Column('collection_id', sa.UUID(), nullable=False),
    sa.Column('farmer_id', sa.UUID(), nullable=False),
    sa.Column('collection_date', sa.Date(), nullable=False),
    sa.Column('shift', sa.String(length=10), nullable=False),
    sa.Column('quantity_litres', sa.Float(), nullable=False),
    sa.Column('fat_percentage', sa.Float(), nullable=True),
    sa.Column('snf_percentage', sa.Float(), nullable=True),
    sa.Column('rate_per_litre', sa.Numeric(precision=8, scale=2), nullable=True),
    sa.Column('total_amount', sa.Numeric(precision=12, scale=2), nullable=True),
    sa.Column('payment_status', sa.String(length=20), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['farmer_id'], ['farmers.farmer_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('collection_id')
    )

    op.create_table('application_documents',
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('application_id', sa.UUID(), nullable=False),
    sa.Column('uploaded_by', sa.UUID(), nullable=False),
    sa.Column('document_name', sa.String(length=255), nullable=False),
    sa.Column('document_type', sa.String(length=100), nullable=False),
    sa.Column('file_url', sa.String(length=1000), nullable=False),
    sa.Column('file_name', sa.String(length=255), nullable=True),
    sa.Column('file_size_bytes', sa.Integer(), nullable=True),
    sa.Column('mime_type', sa.String(length=100), nullable=True),
    sa.Column('upload_status', sa.String(length=30), nullable=False),
    sa.Column('validation_status', sa.String(length=30), nullable=False),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.Column('updated_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['application_id'], ['applications.application_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['uploaded_by'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('document_id')
    )

    op.create_table('application_reviews',
    sa.Column('review_id', sa.UUID(), nullable=False),
    sa.Column('application_id', sa.UUID(), nullable=False),
    sa.Column('reviewer_id', sa.UUID(), nullable=False),
    sa.Column('decision', sa.String(length=30), nullable=False),
    sa.Column('comments', sa.Text(), nullable=True),
    sa.Column('checklist', postgresql.JSONB(astext_type=sa.Text()), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['application_id'], ['applications.application_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['reviewer_id'], ['users.user_id'], ondelete='CASCADE'),
    sa.PrimaryKeyConstraint('review_id')
    )

    op.create_table('application_status_history',
    sa.Column('history_id', sa.UUID(), nullable=False),
    sa.Column('application_id', sa.UUID(), nullable=False),
    sa.Column('changed_by', sa.UUID(), nullable=True),
    sa.Column('old_status', sa.String(length=30), nullable=True),
    sa.Column('new_status', sa.String(length=30), nullable=False),
    sa.Column('notes', sa.Text(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['application_id'], ['applications.application_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['changed_by'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('history_id')
    )

    op.create_table('document_flags',
    sa.Column('flag_id', sa.UUID(), nullable=False),
    sa.Column('document_id', sa.UUID(), nullable=False),
    sa.Column('flag_type', sa.String(length=100), nullable=False),
    sa.Column('flag_severity', sa.String(length=20), nullable=False),
    sa.Column('flag_message', sa.Text(), nullable=False),
    sa.Column('auto_detected', sa.Boolean(), nullable=False),
    sa.Column('resolved', sa.Boolean(), nullable=False),
    sa.Column('resolved_by', sa.UUID(), nullable=True),
    sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
    sa.ForeignKeyConstraint(['document_id'], ['application_documents.document_id'], ondelete='CASCADE'),
    sa.ForeignKeyConstraint(['resolved_by'], ['users.user_id'], ondelete='SET NULL'),
    sa.PrimaryKeyConstraint('flag_id')
    )


def downgrade() -> None:
    op.drop_table("document_flags")
    op.drop_table("application_status_history")
    op.drop_table("application_reviews")
    op.drop_table("application_documents")
    op.drop_table("milk_collections")
    op.drop_table("fssai_required_documents")
    op.drop_table("applications")
    op.drop_table("user_organizations")
    op.drop_table("projects")
    op.drop_table("product_batches")
    op.drop_table("notifications")
    op.drop_table("grievances")
    op.drop_table("fssai_rules")
    op.drop_table("farmers")
    op.drop_table("chatbot_conversations")
    op.drop_table("chatbot_chunks")
    op.drop_table("brand_requirements")
    op.drop_table("audit_logs")
    op.drop_table("users")
    op.drop_table("organizations")
    op.drop_table("government_schemes")
    op.drop_table("district_milk_production")
    op.drop_table("chatbot_documents")
    op.drop_table("business_types")
    op.drop_table("brands")
    op.execute("DROP EXTENSION IF EXISTS vector;")
