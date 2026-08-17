-- Migration: 008_audit_logs_nullable_actor
-- Drop the NOT NULL constraint on actor_id in the audit_logs table to support anonymous/system events.
ALTER TABLE audit_logs ALTER COLUMN actor_id DROP NOT NULL;

-- Add index on created_at descending on audit_logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_created_at ON audit_logs(created_at DESC);

-- Add index on action to speed up filter queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);

-- Add index on entity_type to speed up filter queries
CREATE INDEX IF NOT EXISTS idx_audit_logs_entity_type ON audit_logs(entity_type);
