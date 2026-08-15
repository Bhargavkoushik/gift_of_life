-- Migration: 005_coordinator_availability
-- Adds operational availability status and last active timestamp to coordinator profiles.

ALTER TABLE coordinator_profiles ADD COLUMN IF NOT EXISTS availability_status VARCHAR(50) NOT NULL DEFAULT 'OFFLINE'
CHECK (availability_status IN ('AVAILABLE', 'BUSY', 'OFFLINE'));

ALTER TABLE coordinator_profiles ADD COLUMN IF NOT EXISTS last_active_at TIMESTAMP WITH TIME ZONE;
