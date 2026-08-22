-- Migration: 016_account_verification
-- Purpose: Add account-level verification tracking

-- 1. Add verification flag to users table
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_verified BOOLEAN NOT NULL DEFAULT FALSE;

-- 2. Mark all existing users as verified to prevent locking out developer test accounts
UPDATE users SET is_verified = TRUE;

-- 3. Create user_verifications table for OTP tracking
CREATE TABLE IF NOT EXISTS user_verifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    method VARCHAR(10) NOT NULL CHECK (method IN ('EMAIL', 'SMS')),
    otp_hash VARCHAR(255) NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
    attempts INT DEFAULT 0,
    sent_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    cooldown_until TIMESTAMP WITH TIME ZONE NOT NULL
);

-- 4. Create optimized index for quick user verification record lookups
CREATE INDEX IF NOT EXISTS idx_user_verifications_user_id ON user_verifications(user_id);
