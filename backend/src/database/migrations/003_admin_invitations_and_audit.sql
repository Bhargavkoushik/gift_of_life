-- Migration: 003_admin_invitations_and_audit
-- Create internal_invitations and audit_logs tables to support trust-managed staff verification and activation flow.

CREATE TABLE IF NOT EXISTS internal_invitations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('ADMIN', 'COORDINATOR')),
    status VARCHAR(50) NOT NULL DEFAULT 'INVITED' CHECK (status IN ('INVITED', 'VERIFICATION_SUBMITTED', 'UNDER_REVIEW', 'APPROVED', 'REJECTED', 'REVOKED', 'EXPIRED')),
    token_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    accepted_by UUID REFERENCES users(id),
    verification_data JSONB, -- stores staff ID, affiliation details, ID document name, etc.
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_internal_invitations_token_hash ON internal_invitations(token_hash);

CREATE TABLE IF NOT EXISTS audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    actor_id UUID NOT NULL REFERENCES users(id),
    action VARCHAR(255) NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    metadata JSONB,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_actor_id ON audit_logs(actor_id);
