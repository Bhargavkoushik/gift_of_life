-- 1. Drop existing user role constraint
ALTER TABLE user_roles DROP CONSTRAINT chk_user_role;

-- 2. Add updated constraint containing SUPER_ADMIN
ALTER TABLE user_roles ADD CONSTRAINT chk_user_role 
CHECK (role IN ('DONOR', 'RECEIVER', 'COORDINATOR', 'ADMIN', 'BLOOD_BANK_ADMIN', 'SUPER_ADMIN'));

-- 3. Enforce one-and-only-one Super Admin at database level
CREATE UNIQUE INDEX uq_super_admin_role ON user_roles(role) WHERE (role = 'SUPER_ADMIN');
