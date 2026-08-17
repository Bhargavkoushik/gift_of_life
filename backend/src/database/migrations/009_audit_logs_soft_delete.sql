-- Migration: 009_audit_logs_soft_delete
-- Add soft-delete columns to audit_logs table for administrative accountability.

ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
ALTER TABLE audit_logs ADD COLUMN IF NOT EXISTS status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE' CHECK (status IN ('ACTIVE', 'DELETED'));

-- Create index on status to optimize filtering deleted logs
CREATE INDEX IF NOT EXISTS idx_audit_logs_status ON audit_logs(status);
