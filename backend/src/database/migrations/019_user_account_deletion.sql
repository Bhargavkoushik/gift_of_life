-- Migration: 019_user_account_deletion
-- Purpose: Add support for user-requested account deactivation / deletion, audit columns, and constraint updates

-- 1. Add deleted_at and deletion_reason columns to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE DEFAULT NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS deletion_reason TEXT DEFAULT NULL;

-- 2. Update status constraint to include DEACTIVATED
ALTER TABLE users DROP CONSTRAINT IF EXISTS chk_user_status;
ALTER TABLE users ADD CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED', 'DEACTIVATED'));

-- 3. Create index for efficient querying of non-deactivated active users
CREATE INDEX IF NOT EXISTS idx_users_status_deleted ON users(status, deleted_at);
