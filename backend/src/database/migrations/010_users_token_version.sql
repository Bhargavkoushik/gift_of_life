-- Migration: 010_users_token_version
-- Add token_version to users table to support session invalidation upon password change.
ALTER TABLE users ADD COLUMN IF NOT EXISTS token_version INT NOT NULL DEFAULT 1;
