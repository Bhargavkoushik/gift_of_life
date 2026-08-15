-- Migration: 004_admin_invitation_lifecycle
-- Adds tracking columns to internal_invitations and user login monitoring fields.

-- Drop old check constraint on status column if exists
ALTER TABLE internal_invitations DROP CONSTRAINT IF EXISTS internal_invitations_status_check;

-- Add EMAIL_FAILED to allowed status list
ALTER TABLE internal_invitations ADD CONSTRAINT chk_internal_invitations_status 
CHECK (status IN ('INVITED', 'EMAIL_FAILED', 'VERIFICATION_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED'));

-- Add invitation email delivery tracking columns
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS email_status VARCHAR(50) NOT NULL DEFAULT 'NOT_SENT' 
CHECK (email_status IN ('NOT_SENT', 'SENDING', 'SENT', 'FAILED'));

ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS sent_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS failed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS failure_reason TEXT;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS provider_message_id VARCHAR(255);

-- Add lifecycle milestone columns
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS link_opened_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS accepted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS reviewed_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS reviewed_by UUID REFERENCES users(id);
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS activated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS activated_by UUID REFERENCES users(id);
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS revoked_by UUID REFERENCES users(id);
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS deactivated_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS deactivated_by UUID REFERENCES users(id);
ALTER TABLE internal_invitations ADD COLUMN IF NOT EXISTS rejection_reason TEXT;

-- Add user login monitoring fields
ALTER TABLE users ADD COLUMN IF NOT EXISTS first_login_at TIMESTAMP WITH TIME ZONE;
