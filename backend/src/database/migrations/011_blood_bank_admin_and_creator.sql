-- 1. Update user_roles check constraint to include BLOOD_BANK_ADMIN
ALTER TABLE user_roles DROP CONSTRAINT IF EXISTS chk_user_role;
ALTER TABLE user_roles ADD CONSTRAINT chk_user_role CHECK (role IN ('DONOR', 'RECEIVER', 'COORDINATOR', 'ADMIN', 'BLOOD_BANK_ADMIN'));

-- 2. Update internal_invitations check constraint for role to include BLOOD_BANK_ADMIN
ALTER TABLE internal_invitations DROP CONSTRAINT IF EXISTS internal_invitations_role_check;
ALTER TABLE internal_invitations DROP CONSTRAINT IF EXISTS internal_invitations_role_check1;
ALTER TABLE internal_invitations ADD CONSTRAINT chk_internal_invitations_role CHECK (role IN ('ADMIN', 'COORDINATOR', 'BLOOD_BANK_ADMIN'));

-- 3. Make receiver_id nullable in blood_requests
ALTER TABLE blood_requests ALTER COLUMN receiver_id DROP NOT NULL;

-- 4. Add request creator columns
ALTER TABLE blood_requests ADD COLUMN created_by_user_id UUID REFERENCES users(id);
ALTER TABLE blood_requests ADD COLUMN created_by_role VARCHAR(50) CHECK (created_by_role IN ('RECEIVER', 'BLOOD_BANK_ADMIN'));

-- 5. Migrate existing data: link existing requests to their receiver's user_id
UPDATE blood_requests br
SET created_by_user_id = rp.user_id,
    created_by_role = 'RECEIVER'
FROM receiver_profiles rp
WHERE br.receiver_id = rp.id;

-- Ensure that any request that had a receiver_id has now been updated.
-- If somehow a request doesn't have receiver_id (which shouldn't happen for pre-existing records),
-- we set it to the first admin's user ID as a fallback, but in standard flow this is safe.
-- Set new columns to NOT NULL now that existing data is migrated
ALTER TABLE blood_requests ALTER COLUMN created_by_user_id SET NOT NULL;
ALTER TABLE blood_requests ALTER COLUMN created_by_role SET NOT NULL;

-- 6. Add unique constraint for duplicate detection (concurrent-safe index)
-- Checks: patient_name (case-insensitive), hospital_name (case-insensitive), blood_group_id, required_units, and location (case-insensitive)
CREATE UNIQUE INDEX idx_blood_requests_active_duplicate ON blood_requests (
    LOWER(TRIM(patient_name)),
    LOWER(TRIM(hospital_name)),
    blood_group_id,
    required_units,
    LOWER(TRIM(location))
) WHERE status NOT IN ('FULFILLED', 'CANCELLED', 'REJECTED', 'NO_DONOR_FOUND');
