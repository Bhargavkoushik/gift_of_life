-- Migration: 007_notifications_enhancements
-- Enhances notifications table with soft deletion, priorities, assignment relations, and new categories.

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_status;
ALTER TABLE notifications ADD CONSTRAINT chk_notification_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ', 'DELETED'));

ALTER TABLE notifications DROP CONSTRAINT IF EXISTS chk_notification_type;
ALTER TABLE notifications ADD CONSTRAINT chk_notification_type CHECK (type IN (
  'REQUEST_RECEIVED',
  'COORDINATOR_ASSIGNED',
  'COORDINATOR_ACTION_REQUIRED',
  'COORDINATOR_ACTION_OVERDUE',
  'DONOR_RESPONSE',
  'DONATION_COMPLETED',
  'REQUEST_FULFILLED',
  'REQUEST_CANCELLED',
  'REQUEST_REJECTED',
  'REMINDER_SENT',
  'EMERGENCY_ESCALATION',
  'SYSTEM_ERROR',
  'DELIVERY_FAILURE',
  -- Legacy categories for backward compatibility
  'EMERGENCY_REQUEST',
  'REQUEST_STATUS',
  'DONATION_REMINDER',
  'BLOOD_CAMP',
  'SYSTEM'
));

ALTER TABLE notifications ADD COLUMN IF NOT EXISTS priority VARCHAR(20) DEFAULT 'NORMAL';
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS related_assignment_id UUID REFERENCES request_assignments(id) ON DELETE SET NULL;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS read_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMP WITH TIME ZONE;
ALTER TABLE notifications ADD COLUMN IF NOT EXISTS event_key VARCHAR(255) UNIQUE;
