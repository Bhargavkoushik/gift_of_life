-- Migration: 006_deleted_invitation_status
-- Adds 'DELETED' status constraint and soft-deletion tracking columns.

ALTER TABLE internal_invitations DROP CONSTRAINT IF EXISTS chk_internal_invitations_status;

ALTER TABLE internal_invitations ADD CONSTRAINT chk_internal_invitations_status 
CHECK (status IN ('INVITED', 'EMAIL_FAILED', 'VERIFICATION_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED', 'DELETED'));

ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS deleted_by UUID REFERENCES users(id);
