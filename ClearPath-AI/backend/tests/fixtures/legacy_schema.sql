-- ClearPathAI Captured Legacy Schema (Phase DB0)
-- Generated from app.models Base.metadata with PostgreSQL dialect

CREATE EXTENSION IF NOT EXISTS vector;

CREATE TABLE brands (
	brand_id UUID NOT NULL, 
	brand_name VARCHAR(150) NOT NULL, 
	brand_type VARCHAR(50) NOT NULL, 
	description TEXT, 
	logo_url VARCHAR(500), 
	website_url VARCHAR(500), 
	contact_email VARCHAR(200), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (brand_id), 
	UNIQUE (brand_name)
);

CREATE TABLE business_types (
	business_type_id UUID NOT NULL, 
	type_name VARCHAR(150) NOT NULL, 
	type_code VARCHAR(50) NOT NULL, 
	description TEXT, 
	typical_capacity_min_lpd INTEGER, 
	typical_capacity_max_lpd INTEGER, 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (business_type_id), 
	UNIQUE (type_name), 
	UNIQUE (type_code)
);

CREATE TABLE chatbot_documents (
	document_id UUID NOT NULL, 
	document_title VARCHAR(300) NOT NULL, 
	document_type VARCHAR(100) NOT NULL, 
	source_url VARCHAR(500), 
	source_org VARCHAR(200), 
	language VARCHAR(10) NOT NULL, 
	file_path VARCHAR(1000), 
	total_chunks INTEGER NOT NULL, 
	ingested_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (document_id)
);

CREATE TABLE district_milk_production (
	record_id UUID NOT NULL, 
	district VARCHAR(100) NOT NULL, 
	year VARCHAR(10) NOT NULL, 
	production_thousand_tonnes FLOAT NOT NULL, 
	source VARCHAR(255), 
	source_url VARCHAR(500), 
	retrieved_on DATE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (record_id)
);

CREATE TABLE government_schemes (
	scheme_id UUID NOT NULL, 
	scheme_name VARCHAR(255) NOT NULL, 
	sponsoring_body VARCHAR(255) NOT NULL, 
	scheme_type VARCHAR(100) NOT NULL, 
	description TEXT, 
	eligibility_criteria TEXT, 
	benefit_amount_inr NUMERIC(18, 2), 
	benefit_description TEXT, 
	application_url VARCHAR(500), 
	source_url VARCHAR(500), 
	is_active BOOLEAN NOT NULL, 
	valid_from DATE, 
	valid_until DATE, 
	last_verified_on DATE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (scheme_id)
);

CREATE TABLE organizations (
	organization_id UUID NOT NULL, 
	org_name VARCHAR(200) NOT NULL, 
	org_type VARCHAR(50), 
	district VARCHAR(100), 
	address TEXT, 
	gst_number VARCHAR(20), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (organization_id)
);

CREATE TABLE users (
	user_id UUID NOT NULL, 
	full_name VARCHAR(150) NOT NULL, 
	email VARCHAR(200) NOT NULL, 
	phone VARCHAR(15), 
	password_hash VARCHAR(255) NOT NULL, 
	role VARCHAR(20) NOT NULL, 
	preferred_language VARCHAR(10) NOT NULL, 
	is_active BOOLEAN NOT NULL, 
	email_verified BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (user_id), 
	UNIQUE (email), 
	UNIQUE (phone)
);

CREATE TABLE audit_logs (
	log_id UUID NOT NULL, 
	actor_id UUID, 
	action VARCHAR(100) NOT NULL, 
	entity_type VARCHAR(100) NOT NULL, 
	entity_id UUID, 
	old_values JSONB, 
	new_values JSONB, 
	ip_address VARCHAR(45), 
	user_agent TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (log_id), 
	FOREIGN KEY(actor_id) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE brand_requirements (
	requirement_id UUID NOT NULL, 
	brand_id UUID NOT NULL, 
	requirement_type VARCHAR(100) NOT NULL, 
	requirement_name VARCHAR(255) NOT NULL, 
	description TEXT, 
	is_mandatory BOOLEAN NOT NULL, 
	fee_amount NUMERIC(12, 2), 
	fee_currency VARCHAR(5) NOT NULL, 
	template_url VARCHAR(500), 
	source_url VARCHAR(500), 
	last_verified_on DATE, 
	rule_status VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (requirement_id), 
	FOREIGN KEY(brand_id) REFERENCES brands (brand_id) ON DELETE CASCADE
);

CREATE TABLE chatbot_chunks (
	chunk_id UUID NOT NULL, 
	document_id UUID NOT NULL, 
	chunk_index INTEGER NOT NULL, 
	chunk_text TEXT NOT NULL, 
	page_number INTEGER, 
	word_count INTEGER, 
	embedding VECTOR(384), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (chunk_id), 
	FOREIGN KEY(document_id) REFERENCES chatbot_documents (document_id) ON DELETE CASCADE
);

CREATE TABLE chatbot_conversations (
	conversation_id UUID NOT NULL, 
	user_id UUID, 
	question TEXT NOT NULL, 
	answer TEXT NOT NULL, 
	language VARCHAR(10) NOT NULL, 
	sources JSONB, 
	chunk_ids_used JSONB, 
	llm_provider VARCHAR(50), 
	response_time_ms INTEGER, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (conversation_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE farmers (
	farmer_id UUID NOT NULL, 
	user_id UUID, 
	farmer_code VARCHAR(50), 
	full_name VARCHAR(150) NOT NULL, 
	village VARCHAR(100), 
	district VARCHAR(100), 
	phone VARCHAR(15), 
	cattle_count INTEGER NOT NULL, 
	average_daily_yield_lpd FLOAT, 
	bank_account_number VARCHAR(50), 
	bank_ifsc VARCHAR(20), 
	is_active BOOLEAN NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (farmer_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE SET NULL, 
	UNIQUE (farmer_code)
);

CREATE TABLE fssai_rules (
	rule_id UUID NOT NULL, 
	business_type_id UUID NOT NULL, 
	license_tier VARCHAR(50) NOT NULL, 
	license_form VARCHAR(20) NOT NULL, 
	capacity_min_lpd INTEGER, 
	capacity_max_lpd INTEGER, 
	turnover_min_inr NUMERIC(18, 2), 
	turnover_max_inr NUMERIC(18, 2), 
	annual_fee_inr NUMERIC(12, 2) NOT NULL, 
	rule_status VARCHAR(20) NOT NULL, 
	validity_years INTEGER NOT NULL, 
	source_url VARCHAR(500), 
	effective_date DATE, 
	last_verified_on DATE, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (rule_id), 
	FOREIGN KEY(business_type_id) REFERENCES business_types (business_type_id) ON DELETE CASCADE
);

CREATE TABLE grievances (
	grievance_id UUID NOT NULL, 
	user_id UUID, 
	organization_id UUID, 
	category VARCHAR(100) NOT NULL, 
	description TEXT NOT NULL, 
	status VARCHAR(30) NOT NULL, 
	priority VARCHAR(20) NOT NULL, 
	resolution_notes TEXT, 
	assigned_to UUID, 
	resolved_at TIMESTAMP WITH TIME ZONE, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (grievance_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE SET NULL, 
	FOREIGN KEY(organization_id) REFERENCES organizations (organization_id) ON DELETE SET NULL, 
	FOREIGN KEY(assigned_to) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE notifications (
	notification_id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	title VARCHAR(255) NOT NULL, 
	message TEXT NOT NULL, 
	notification_type VARCHAR(50) NOT NULL, 
	is_read BOOLEAN NOT NULL, 
	related_entity_type VARCHAR(50), 
	related_entity_id UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	read_at TIMESTAMP WITH TIME ZONE, 
	PRIMARY KEY (notification_id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE product_batches (
	batch_id UUID NOT NULL, 
	brand_id UUID, 
	batch_number VARCHAR(100) NOT NULL, 
	product_type VARCHAR(100) NOT NULL, 
	quantity_litres FLOAT, 
	quantity_kg FLOAT, 
	production_date DATE NOT NULL, 
	expiry_date DATE, 
	quality_grade VARCHAR(10), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (batch_id), 
	FOREIGN KEY(brand_id) REFERENCES brands (brand_id) ON DELETE SET NULL, 
	UNIQUE (batch_number)
);

CREATE TABLE projects (
	project_id UUID NOT NULL, 
	organization_id UUID, 
	created_by UUID NOT NULL, 
	project_name VARCHAR(255) NOT NULL, 
	district VARCHAR(100) NOT NULL, 
	business_type_id UUID, 
	brand_id UUID, 
	capacity_lpd FLOAT, 
	annual_turnover NUMERIC(18, 2), 
	status VARCHAR(30) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (project_id), 
	FOREIGN KEY(organization_id) REFERENCES organizations (organization_id) ON DELETE SET NULL, 
	FOREIGN KEY(created_by) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(business_type_id) REFERENCES business_types (business_type_id) ON DELETE SET NULL, 
	FOREIGN KEY(brand_id) REFERENCES brands (brand_id) ON DELETE SET NULL
);

CREATE TABLE user_organizations (
	id UUID NOT NULL, 
	user_id UUID NOT NULL, 
	organization_id UUID NOT NULL, 
	role_in_org VARCHAR(50) NOT NULL, 
	joined_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (id), 
	FOREIGN KEY(user_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(organization_id) REFERENCES organizations (organization_id) ON DELETE CASCADE
);

CREATE TABLE applications (
	application_id UUID NOT NULL, 
	project_id UUID NOT NULL, 
	applicant_id UUID NOT NULL, 
	application_type VARCHAR(100) NOT NULL, 
	license_tier VARCHAR(50), 
	status VARCHAR(30) NOT NULL, 
	submission_date TIMESTAMP WITH TIME ZONE, 
	decision_date TIMESTAMP WITH TIME ZONE, 
	fssai_rule_id UUID, 
	estimated_fee_inr NUMERIC(12, 2), 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (application_id), 
	FOREIGN KEY(project_id) REFERENCES projects (project_id) ON DELETE CASCADE, 
	FOREIGN KEY(applicant_id) REFERENCES users (user_id) ON DELETE CASCADE, 
	FOREIGN KEY(fssai_rule_id) REFERENCES fssai_rules (rule_id) ON DELETE SET NULL
);

CREATE TABLE fssai_required_documents (
	doc_id UUID NOT NULL, 
	rule_id UUID NOT NULL, 
	document_name VARCHAR(255) NOT NULL, 
	description TEXT, 
	is_mandatory BOOLEAN NOT NULL, 
	template_url VARCHAR(500), 
	source_url VARCHAR(500), 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (doc_id), 
	FOREIGN KEY(rule_id) REFERENCES fssai_rules (rule_id) ON DELETE CASCADE
);

CREATE TABLE milk_collections (
	collection_id UUID NOT NULL, 
	farmer_id UUID NOT NULL, 
	collection_date DATE NOT NULL, 
	shift VARCHAR(10) NOT NULL, 
	quantity_litres FLOAT NOT NULL, 
	fat_percentage FLOAT, 
	snf_percentage FLOAT, 
	rate_per_litre NUMERIC(8, 2), 
	total_amount NUMERIC(12, 2), 
	payment_status VARCHAR(20) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (collection_id), 
	FOREIGN KEY(farmer_id) REFERENCES farmers (farmer_id) ON DELETE CASCADE
);

CREATE TABLE application_documents (
	document_id UUID NOT NULL, 
	application_id UUID NOT NULL, 
	uploaded_by UUID NOT NULL, 
	document_name VARCHAR(255) NOT NULL, 
	document_type VARCHAR(100) NOT NULL, 
	file_url VARCHAR(1000) NOT NULL, 
	file_name VARCHAR(255), 
	file_size_bytes INTEGER, 
	mime_type VARCHAR(100), 
	upload_status VARCHAR(30) NOT NULL, 
	validation_status VARCHAR(30) NOT NULL, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	updated_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (document_id), 
	FOREIGN KEY(application_id) REFERENCES applications (application_id) ON DELETE CASCADE, 
	FOREIGN KEY(uploaded_by) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE application_reviews (
	review_id UUID NOT NULL, 
	application_id UUID NOT NULL, 
	reviewer_id UUID NOT NULL, 
	decision VARCHAR(30) NOT NULL, 
	comments TEXT, 
	checklist JSONB, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (review_id), 
	FOREIGN KEY(application_id) REFERENCES applications (application_id) ON DELETE CASCADE, 
	FOREIGN KEY(reviewer_id) REFERENCES users (user_id) ON DELETE CASCADE
);

CREATE TABLE application_status_history (
	history_id UUID NOT NULL, 
	application_id UUID NOT NULL, 
	changed_by UUID, 
	old_status VARCHAR(30), 
	new_status VARCHAR(30) NOT NULL, 
	notes TEXT, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (history_id), 
	FOREIGN KEY(application_id) REFERENCES applications (application_id) ON DELETE CASCADE, 
	FOREIGN KEY(changed_by) REFERENCES users (user_id) ON DELETE SET NULL
);

CREATE TABLE document_flags (
	flag_id UUID NOT NULL, 
	document_id UUID NOT NULL, 
	flag_type VARCHAR(100) NOT NULL, 
	flag_severity VARCHAR(20) NOT NULL, 
	flag_message TEXT NOT NULL, 
	auto_detected BOOLEAN NOT NULL, 
	resolved BOOLEAN NOT NULL, 
	resolved_by UUID, 
	created_at TIMESTAMP WITH TIME ZONE DEFAULT now() NOT NULL, 
	PRIMARY KEY (flag_id), 
	FOREIGN KEY(document_id) REFERENCES application_documents (document_id) ON DELETE CASCADE, 
	FOREIGN KEY(resolved_by) REFERENCES users (user_id) ON DELETE SET NULL
);

