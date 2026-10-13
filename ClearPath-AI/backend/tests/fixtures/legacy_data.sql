-- DairySetu-TN Legacy Dirty Data Fixture (Phase DB0)
-- Used to test migration upgrades, constraint safety, and preflight violation reporting.

-- 1. Base Organization
INSERT INTO organizations (organization_id, org_name, org_type, district, is_active, created_at, updated_at)
VALUES ('11111111-1111-1111-1111-111111111111', 'Tamil Dairy Coop', 'cooperative', 'Salem', true, now(), now());

-- 2. Users with Case-Duplicate Emails
INSERT INTO users (user_id, full_name, email, password_hash, role, is_active, created_at, updated_at)
VALUES 
  ('22222222-2222-2222-2222-222222222201', 'User Lowercase', 'duplicate@example.com', '$2b$12$dummyhash1', 'user', true, now(), now()),
  ('22222222-2222-2222-2222-222222222202', 'User Uppercase', 'DUPLICATE@EXAMPLE.COM', '$2b$12$dummyhash2', 'user', true, now(), now());

-- 3. User with Invalid Free-Text Role
INSERT INTO users (user_id, full_name, email, password_hash, role, is_active, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222203', 'Invalid Role User', 'badrole@example.com', '$2b$12$dummyhash3', 'superadmin_hacker', true, now(), now());

-- 4. Valid Officer User (for regulatory trail tests)
INSERT INTO users (user_id, full_name, email, password_hash, role, is_active, created_at, updated_at)
VALUES ('22222222-2222-2222-2222-222222222204', 'Officer Test', 'officer.test@fssai.example', '$2b$12$dummyhash4', 'officer', true, now(), now());

-- 5. Business Type
INSERT INTO business_types (business_type_id, type_name, type_code, is_active, created_at)
VALUES ('33333333-3333-3333-3333-333333333331', 'Dairy Processing Plant', 'DAIRY_PROC', true, now());

-- 6. Duplicate FSSAI Rules (violates natural uniqueness)
INSERT INTO fssai_rules (rule_id, business_type_id, license_tier, license_form, capacity_min_lpd, capacity_max_lpd, annual_fee_inr, rule_status, validity_years, created_at)
VALUES 
  ('44444444-4444-4444-4444-444444444401', '33333333-3333-3333-3333-333333333331', 'state_license', 'Form B', 501, 10000, 3000.00, 'unverified', 1, now()),
  ('44444444-4444-4444-4444-444444444402', '33333333-3333-3333-3333-333333333331', 'state_license', 'Form B', 501, 10000, 3000.00, 'invalid_status_enum', 1, now());

-- 7. Project with Invalid Status
INSERT INTO projects (project_id, organization_id, created_by, project_name, district, business_type_id, status, created_at, updated_at)
VALUES ('55555555-5555-5555-5555-555555555501', '11111111-1111-1111-1111-111111111111', '22222222-2222-2222-2222-222222222201', 'Test Project Alpha', 'Salem', '33333333-3333-3333-3333-333333333331', 'archived_pending', now(), now());

-- 8. Applications with Invalid Status and Invalid License Tier
INSERT INTO applications (application_id, project_id, applicant_id, application_type, license_tier, status, created_at, updated_at)
VALUES 
  ('66666666-6666-6666-6666-666666666601', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 'FSSAI', 'state_license', 'pending_approval_odd', now(), now()),
  ('66666666-6666-6666-6666-666666666602', '55555555-5555-5555-5555-555555555501', '22222222-2222-2222-2222-222222222201', 'FSSAI', 'mega_license_tier', 'draft', now(), now());

-- 9. Regulatory History & Review linked to Officer (test CASCADE vs SET NULL / RESTRICT)
INSERT INTO application_reviews (review_id, application_id, reviewer_id, decision, comments, created_at)
VALUES ('77777777-7777-7777-7777-777777777701', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222204', 'return', 'Needs water test certificate', now());

INSERT INTO application_status_history (history_id, application_id, changed_by, old_status, new_status, created_at)
VALUES ('88888888-8888-8888-8888-888888888801', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222204', 'submitted', 'returned', now());

-- 10. Application Document with Missing Physical File and Invalid Validation Status
INSERT INTO application_documents (document_id, application_id, uploaded_by, document_name, document_type, file_url, upload_status, validation_status, created_at, updated_at)
VALUES ('99999999-9999-9999-9999-999999999901', '66666666-6666-6666-6666-666666666601', '22222222-2222-2222-2222-222222222201', 'Water Report', 'water_test', 'uploads/documents/non_existent_file.pdf', 'bad_upload_status', 'unsupported_validation_status', now(), now());

-- 11. Duplicate user_organizations rows
INSERT INTO user_organizations (id, user_id, organization_id, role_in_org, joined_at)
VALUES 
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa1', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'owner', now()),
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaa2', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'member', now());

-- 12. Duplicate district_milk_production rows
INSERT INTO district_milk_production (record_id, district, year, production_thousand_tonnes, source, source_url, retrieved_on, created_at)
VALUES 
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb1', 'Salem', '2018-19', 450.5, 'data.gov.in', 'https://data.gov.in/resource/test', '2024-01-15', now()),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbb2', 'Salem', '2018-19', 450.5, 'data.gov.in', 'https://data.gov.in/resource/test', '2024-01-15', now());

-- 13. Grievance with Invalid Status and Priority
INSERT INTO grievances (grievance_id, user_id, organization_id, category, description, status, priority, created_at, updated_at)
VALUES ('cccccccc-cccc-cccc-cccc-cccccccccccc', '22222222-2222-2222-2222-222222222201', '11111111-1111-1111-1111-111111111111', 'Inspection Delay', 'Delayed review', 'pending_triage_bad', 'super_urgent_bad', now(), now());
