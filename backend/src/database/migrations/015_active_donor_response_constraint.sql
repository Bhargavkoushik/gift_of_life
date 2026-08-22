-- Clean up any existing duplicate ACCEPTED responses per request, keeping the latest updated one
WITH ranked_responses AS (
    SELECT id, request_id,
           ROW_NUMBER() OVER (PARTITION BY request_id ORDER BY updated_at DESC) as rn
    FROM donor_responses
    WHERE response_status = 'ACCEPTED'
)
UPDATE donor_responses
SET response_status = 'REJECTED', updated_at = CURRENT_TIMESTAMP
WHERE id IN (
    SELECT id FROM ranked_responses WHERE rn > 1
);

-- Create a partial unique index ensuring only one active ACCEPTED response exists per request
CREATE UNIQUE INDEX uq_active_donor_response ON donor_responses (request_id) WHERE (response_status = 'ACCEPTED');
