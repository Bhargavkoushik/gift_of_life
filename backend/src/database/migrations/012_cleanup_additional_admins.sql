-- Clean up additional administrator roles and convert them to BLOOD_BANK_ADMIN
UPDATE user_roles
SET role = 'BLOOD_BANK_ADMIN'
WHERE role = 'ADMIN' AND user_id != (SELECT id FROM users WHERE email = 'admin@gift-of-life.org' LIMIT 1);
