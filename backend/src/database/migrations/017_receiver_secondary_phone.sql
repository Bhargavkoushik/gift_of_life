-- Migration: Add secondary_phone to receiver_profiles
ALTER TABLE receiver_profiles ADD COLUMN secondary_phone VARCHAR(50) DEFAULT NULL;
