-- 1. Migrate any active ADMIN role mappings to SUPER_ADMIN
UPDATE user_roles SET role = 'SUPER_ADMIN' WHERE role = 'ADMIN';

-- 2. Drop the old check constraint
ALTER TABLE user_roles DROP CONSTRAINT chk_user_role;

-- 3. Create the final check constraint excluding ADMIN
ALTER TABLE user_roles ADD CONSTRAINT chk_user_role 
CHECK (role IN ('DONOR', 'RECEIVER', 'COORDINATOR', 'BLOOD_BANK_ADMIN', 'SUPER_ADMIN'));
