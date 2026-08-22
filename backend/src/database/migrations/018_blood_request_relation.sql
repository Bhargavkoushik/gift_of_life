-- Migration: 018_blood_request_relation
-- Purpose: Add request-level relation_type to blood_requests

ALTER TABLE blood_requests ADD COLUMN relation_type VARCHAR(50) DEFAULT 'SOMEONE_ELSE';
ALTER TABLE blood_requests ADD CONSTRAINT chk_relation_type CHECK (relation_type IN ('MYSELF', 'SOMEONE_ELSE'));
