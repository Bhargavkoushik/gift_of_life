-- Migration: 001_initial_schema
-- Authoritative Schema Definition for PostgreSQL 18
-- Targets: UUID primary keys generated natively via gen_random_uuid()

--------------------------------------------------------------------------------
-- 1. BLOOD GROUPS (Lookup reference table)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_groups (
    id SERIAL PRIMARY KEY,
    code VARCHAR(5) UNIQUE NOT NULL,
    name VARCHAR(50) NOT NULL
);

-- Seed standard blood groups (Idempotent seed run)
INSERT INTO blood_groups (code, name) VALUES
('A+', 'A Positive'),
('A-', 'A Negative'),
('B+', 'B Positive'),
('B-', 'B Negative'),
('AB+', 'AB Positive'),
('AB-', 'AB Negative'),
('O+', 'O Positive'),
('O-', 'O Negative')
ON CONFLICT (code) DO NOTHING;

--------------------------------------------------------------------------------
-- 2. USERS (Core Accounts)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    phone VARCHAR(50) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'ACTIVE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_user_status CHECK (status IN ('ACTIVE', 'INACTIVE', 'SUSPENDED'))
);

--------------------------------------------------------------------------------
-- 3. USER ROLES (Allows multiple roles per user account)
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_user_role UNIQUE (user_id, role),
    CONSTRAINT chk_user_role CHECK (role IN ('DONOR', 'RECEIVER', 'COORDINATOR', 'ADMIN'))
);

CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id);

--------------------------------------------------------------------------------
-- 4. DONOR PROFILES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donor_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    blood_group_id INT NOT NULL REFERENCES blood_groups(id),
    date_of_birth DATE NOT NULL,
    gender VARCHAR(50) NOT NULL,
    phone VARCHAR(50),
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    last_donation_date DATE,
    availability_status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    eligibility_status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    deferred_until DATE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_donor_availability CHECK (availability_status IN ('AVAILABLE', 'NOT_AVAILABLE')),
    CONSTRAINT chk_donor_eligibility CHECK (eligibility_status IN ('PENDING', 'ELIGIBLE', 'TEMPORARILY_DEFERRED', 'NOT_ELIGIBLE'))
);

-- Optimized index for donor matching (combines blood group, location, availability, and eligibility)
CREATE INDEX IF NOT EXISTS idx_donor_profiles_matching ON donor_profiles(blood_group_id, district, area, availability_status, eligibility_status);

--------------------------------------------------------------------------------
-- 5. RECEIVER PROFILES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS receiver_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    name VARCHAR(255) NOT NULL,
    phone VARCHAR(50) NOT NULL,
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    receiver_type VARCHAR(50) NOT NULL DEFAULT 'INDIVIDUAL',
    verification_status VARCHAR(50) NOT NULL DEFAULT 'PENDING', -- PROPOSED / AWAITING CONFIRMATION
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_receiver_type CHECK (receiver_type IN ('INDIVIDUAL', 'PATIENT_ATTENDANT', 'HOSPITAL')),
    CONSTRAINT chk_receiver_verification CHECK (verification_status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

--------------------------------------------------------------------------------
-- 6. COORDINATOR PROFILES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS coordinator_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_coordinator_status CHECK (status IN ('PENDING', 'ACTIVE', 'INACTIVE'))
);

CREATE INDEX IF NOT EXISTS idx_coordinator_profiles_region ON coordinator_profiles(district, area);

--------------------------------------------------------------------------------
-- 7. BLOOD REQUESTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_requests (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    receiver_id UUID NOT NULL REFERENCES receiver_profiles(id),
    blood_group_id INT NOT NULL REFERENCES blood_groups(id),
    required_units INT NOT NULL,
    patient_name VARCHAR(255) NOT NULL,
    hospital_name VARCHAR(255) NOT NULL,
    hospital_address TEXT NOT NULL,
    location VARCHAR(255) NOT NULL,
    required_date_time TIMESTAMP WITH TIME ZONE NOT NULL,
    urgency_level VARCHAR(50) NOT NULL DEFAULT 'NORMAL',
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    description TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    closed_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT chk_required_units CHECK (required_units > 0),
    CONSTRAINT chk_urgency_level CHECK (urgency_level IN ('NORMAL', 'URGENT', 'EMERGENCY')),
    CONSTRAINT chk_request_status CHECK (status IN (
        'PENDING', 'APPROVED', 'REJECTED', 'FULFILLED', -- Core SRS Statuses
        'DONORS_ALERTED', 'DONOR_RESPONDED', 'COORDINATOR_ASSIGNED', 'DONOR_CONFIRMED', 'CANCELLED', 'NO_DONOR_FOUND' -- Proposed operational statuses
    ))
);

-- Indexes for request searches, urgency, and deadlines
CREATE INDEX IF NOT EXISTS idx_blood_requests_urgency_status ON blood_requests(urgency_level, status);
CREATE INDEX IF NOT EXISTS idx_blood_requests_required_date ON blood_requests(required_date_time);
CREATE INDEX IF NOT EXISTS idx_blood_requests_match ON blood_requests(blood_group_id, status);

--------------------------------------------------------------------------------
-- 8. DONOR RESPONSES
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donor_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    donor_id UUID NOT NULL REFERENCES donor_profiles(id) ON DELETE CASCADE,
    response_status VARCHAR(50) NOT NULL DEFAULT 'NO_RESPONSE',
    responded_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_request_donor UNIQUE (request_id, donor_id),
    CONSTRAINT chk_response_status CHECK (response_status IN ('ACCEPTED', 'REJECTED', 'NO_RESPONSE'))
);

CREATE INDEX IF NOT EXISTS idx_donor_responses_request ON donor_responses(request_id);

--------------------------------------------------------------------------------
-- 9. REQUEST ASSIGNMENTS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS request_assignments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    request_id UUID NOT NULL REFERENCES blood_requests(id) ON DELETE CASCADE,
    coordinator_id UUID NOT NULL REFERENCES coordinator_profiles(id),
    assigned_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    status VARCHAR(50) NOT NULL DEFAULT 'ASSIGNED',
    completed_at TIMESTAMP WITH TIME ZONE,
    notes TEXT,
    CONSTRAINT chk_assignment_status CHECK (status IN ('ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'REASSIGNED'))
);

CREATE INDEX IF NOT EXISTS idx_request_assignments_coordinator ON request_assignments(coordinator_id);
CREATE INDEX IF NOT EXISTS idx_request_assignments_request ON request_assignments(request_id);

--------------------------------------------------------------------------------
-- 10. DONATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS donations (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    donor_id UUID NOT NULL REFERENCES donor_profiles(id),
    request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
    blood_group_id INT NOT NULL REFERENCES blood_groups(id),
    donation_date DATE NOT NULL,
    units INT NOT NULL DEFAULT 1,
    status VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    verified_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_donation_units CHECK (units > 0),
    CONSTRAINT chk_donation_status CHECK (status IN ('SCHEDULED', 'COMPLETED', 'CANCELLED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_donations_donor ON donations(donor_id);
CREATE INDEX IF NOT EXISTS idx_donations_date ON donations(donation_date);

--------------------------------------------------------------------------------
-- 11. NOTIFICATIONS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS notifications (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    request_id UUID REFERENCES blood_requests(id) ON DELETE SET NULL,
    type VARCHAR(50) NOT NULL,
    channel VARCHAR(50) NOT NULL,
    title VARCHAR(255) NOT NULL,
    message TEXT NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    sent_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_notification_type CHECK (type IN ('EMERGENCY_REQUEST', 'REQUEST_STATUS', 'DONATION_REMINDER', 'BLOOD_CAMP', 'SYSTEM')),
    CONSTRAINT chk_notification_channel CHECK (channel IN ('SMS', 'WHATSAPP', 'PUSH', 'EMAIL', 'IN_APP')),
    CONSTRAINT chk_notification_status CHECK (status IN ('PENDING', 'SENT', 'FAILED', 'READ'))
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_unread ON notifications(user_id, status);

--------------------------------------------------------------------------------
-- 12. BLOOD CAMPS
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_camps (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    organizer VARCHAR(255) NOT NULL,
    description TEXT,
    date DATE NOT NULL,
    start_time TIME NOT NULL,
    end_time TIME NOT NULL,
    venue VARCHAR(255) NOT NULL,
    address TEXT NOT NULL,
    area VARCHAR(100) NOT NULL,
    district VARCHAR(100) NOT NULL,
    state VARCHAR(100) NOT NULL,
    contact_name VARCHAR(255) NOT NULL,
    contact_phone VARCHAR(50) NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'UPCOMING',
    created_by UUID NOT NULL REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_camp_status CHECK (status IN ('UPCOMING', 'ACTIVE', 'COMPLETED', 'CANCELLED'))
);

CREATE INDEX IF NOT EXISTS idx_blood_camps_date_location ON blood_camps(date, district, area);

--------------------------------------------------------------------------------
-- 13. BLOOD INVENTORY
--------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS blood_inventory (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blood_group_id INT NOT NULL REFERENCES blood_groups(id),
    component VARCHAR(100) NOT NULL,
    blood_bank_location VARCHAR(255) NOT NULL,
    units INT NOT NULL,
    collection_date DATE NOT NULL,
    expiration_date DATE NOT NULL,
    status VARCHAR(50) NOT NULL DEFAULT 'AVAILABLE',
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT chk_inventory_units CHECK (units >= 0),
    CONSTRAINT chk_inventory_component CHECK (component IN ('WHOLE_BLOOD', 'RED_CELLS', 'PLATELETS', 'PLASMA')),
    CONSTRAINT chk_inventory_status CHECK (status IN ('AVAILABLE', 'RESERVED', 'EXPIRED', 'DISPOSED'))
);

CREATE INDEX IF NOT EXISTS idx_blood_inventory_expiry ON blood_inventory(expiration_date);
CREATE INDEX IF NOT EXISTS idx_blood_inventory_lookup ON blood_inventory(blood_group_id, component, status);
