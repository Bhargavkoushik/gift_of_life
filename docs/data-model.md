# Gift of Life - Database Data Model

This document describes the database design for the Gift of Life blood donation management system. The design is structured to support multi-role accounts (e.g., a person can be both a donor and receiver) and ensures data normalization, integrity, privacy, and query optimization.

---

## Database Overview & Schema Pattern

Instead of storing roles directly in the `users` table or using separate tables per role (which would force duplicate accounts for users who are both donors and receivers), we utilize a unified `users` table alongside a `user_roles` join table. Detailed role-specific medical, contact, or operational data is stored in separate profile tables (`donor_profiles`, `receiver_profiles`, `coordinator_profiles`) linked via 1-to-1 relationships to the `users` table.

### Key Architectural Decisions

- **Primary Keys (Unresolved Technical Decision):** The current schema layout is drafted using UUIDs (v4) for distributed scaling, API security, and prevention of ID enumeration. However, this is a **technical design choice, not an SRS requirement**. The decision to use UUIDs vs. sequential BigInts (`SERIAL`/`BIGINT`) remains unresolved and open for developer review.
- **Blood Inventory Integration (Awaiting Confirmation):** The proposed `blood_inventory` table is structured to support tracking available units by blood type, location, component, and expiration. However, **this workflow has not yet been confirmed by ASN Raju**. The system must not assume this table automatically replaces their existing manual Excel spreadsheet process. Automated inventory updates or integrations are out of scope until confirmed.

---

## Entity Details

### 1. `users`
Represents the core user account for authentication and general contact.
- **Primary Key:** `id` (UUID / BIGINT - Unresolved technical decision)
- **Relationships:**
  - 1:N with `user_roles`
  - 1:1 with `donor_profiles` (Optional)
  - 1:1 with `receiver_profiles` (Optional)
  - 1:1 with `coordinator_profiles` (Optional)
  - 1:N with `notifications`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key (Drafted as UUID; PK strategy is unresolved). |
| `name` | VARCHAR(255) | No | - | Full name of the user. |
| `email` | VARCHAR(255) | No | - | Unique email address. |
| `phone` | VARCHAR(50) | No | - | Unique phone number. |
| `password_hash` | VARCHAR(255) | No | - | Bcrypt hash of the user's password (never plain text). |
| `status` | VARCHAR(50) | No | `'ACTIVE'` | Account status: `ACTIVE`, `INACTIVE`, `SUSPENDED`. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Account creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Last account update timestamp. |
| `last_login_at` | TIMESTAMP TZ | Yes | NULL | Last login timestamp. |

---

### 2. `user_roles`
Associates roles with user accounts. A user can have multiple active roles.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `user_id` -> `users.id` (ON DELETE CASCADE)

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `user_id` | UUID | No | - | Foreign Key to `users`. |
| `role` | VARCHAR(50) | No | - | Role code. Check constraint: `DONOR`, `RECEIVER`, `COORDINATOR`, `ADMIN`. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Role assignment timestamp. |

- **Constraints:**
  - UNIQUE constraint on `(user_id, role)` to prevent duplicate role assignments.

---

### 3. `blood_groups`
A lookup reference table for standard blood groups. Seeded during database initialization.
- **Primary Key:** `id` (INT / SERIAL)
- **Relationships:**
  - 1:N with `donor_profiles`
  - 1:N with `blood_requests`
  - 1:N with `donations`
  - 1:N with `blood_inventory`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | INT | No | Auto-increment | Primary Key. |
| `code` | VARCHAR(5) | No | - | Unique short code: `A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`. |
| `name` | VARCHAR(50) | No | - | Human-readable name: `A Positive`, `O Negative`, etc. |

---

### 4. `donor_profiles`
Maintains medical and contact details for users registered as blood donors.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `user_id` -> `users.id` (ON DELETE CASCADE, enforce UNIQUE for 1:1)
  - Foreign Key: `blood_group_id` -> `blood_groups.id`
  - 1:N with `donor_responses`
  - 1:N with `donations`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `user_id` | UUID | No | - | Foreign Key to `users`. Unique to enforce 1:1 relationship. |
| `blood_group_id` | INT | No | - | Foreign Key to `blood_groups`. |
| `date_of_birth` | DATE | No | - | Date of birth for age eligibility checks. |
| `gender` | VARCHAR(50) | No | - | Gender of the donor. |
| `phone` | VARCHAR(50) | Yes | NULL | Optional secondary contact phone number. |
| `address` | TEXT | No | - | Residential address. |
| `area` | VARCHAR(100) | No | - | Neighborhood/area name. |
| `district` | VARCHAR(100) | No | - | Administrative district (essential for matches). |
| `state` | VARCHAR(100) | No | - | State/region. |
| `pincode` | VARCHAR(20) | No | - | Postal PIN code. |
| `last_donation_date` | DATE | Yes | NULL | Date of last blood donation. Used for eligibility timing. |
| `availability_status` | VARCHAR(50) | No | `'AVAILABLE'` | Status: `AVAILABLE`, `NOT_AVAILABLE`. |
| `eligibility_status` | VARCHAR(50) | No | `'PENDING'` | Status: `PENDING`, `ELIGIBLE`, `TEMPORARILY_DEFERRED`, `NOT_ELIGIBLE`. |
| `deferred_until` | DATE | Yes | NULL | **SRS Review Addition:** Expiration date of temporary deferrals. Required when `eligibility_status` is `TEMPORARILY_DEFERRED`. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile modification timestamp. |

---

### 5. `receiver_profiles`
Maintains coordinator-approved or self-registered profiles for receiver accounts.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `user_id` -> `users.id` (ON DELETE CASCADE, enforce UNIQUE for 1:1)
  - 1:N with `blood_requests`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `user_id` | UUID | No | - | Foreign Key to `users`. Unique to enforce 1:1 relationship. |
| `name` | VARCHAR(255) | No | - | Name of the receiver organization or primary coordinator contact. |
| `phone` | VARCHAR(50) | No | - | Main contact phone number for request verification. |
| `address` | TEXT | No | - | Physical address. |
| `area` | VARCHAR(100) | No | - | Neighborhood/area. |
| `district` | VARCHAR(100) | No | - | District (crucial for locating local requests). |
| `state` | VARCHAR(100) | No | - | State/region. |
| `pincode` | VARCHAR(20) | No | - | Postal PIN code. |
| `receiver_type` | VARCHAR(50) | No | `'INDIVIDUAL'` | Category of receiver: `INDIVIDUAL`, `PATIENT_ATTENDANT`, `HOSPITAL`. |
| `verification_status` | VARCHAR(50) | No | `'PENDING'` | **PROPOSED / AWAITING ASN RAJU CONFIRMATION:** Verification status (`PENDING`, `APPROVED`, `REJECTED`). Authenticated receiver registration may or may not require manual blood-bank/coordinator approval. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile modification timestamp. |

---

### 6. `coordinator_profiles`
Details for coordinators who manage requests, matching, and donation verification in districts.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `user_id` -> `users.id` (ON DELETE CASCADE, enforce UNIQUE for 1:1)
  - 1:N with `request_assignments`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `user_id` | UUID | No | - | Foreign Key to `users`. Unique to enforce 1:1 relationship. |
| `area` | VARCHAR(100) | No | - | Target area of administration. |
| `district` | VARCHAR(100) | No | - | Target district of administration. |
| `state` | VARCHAR(100) | No | - | Target state of administration. |
| `status` | VARCHAR(50) | No | `'PENDING'` | Status: `PENDING`, `ACTIVE`, `INACTIVE`. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Profile modification timestamp. |

---

### 7. `blood_requests`
Central requests for blood units.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `receiver_id` -> `receiver_profiles.id`
  - Foreign Key: `blood_group_id` -> `blood_groups.id`
  - 1:N with `donor_responses`
  - 1:N with `request_assignments`
  - 1:N with `donations` (via nullable request reference)

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `receiver_id` | UUID | No | - | Foreign Key to `receiver_profiles`. |
| `blood_group_id` | INT | No | - | Foreign Key to `blood_groups`. |
| `required_units` | INT | No | - | Must be positive (CHECK: `required_units > 0`). |
| `patient_name` | VARCHAR(255) | No | - | Name of the patient in need. |
| `hospital_name` | VARCHAR(255) | No | - | Hospital where blood is needed. |
| `hospital_address` | TEXT | No | - | Physical location details. |
| `location` | VARCHAR(255) | No | - | Area/district descriptor of the hospital. |
| `required_date_time` | TIMESTAMP TZ | No | - | Targeted date/time for blood delivery. |
| `urgency_level` | VARCHAR(50) | No | `'NORMAL'` | Urgency: `NORMAL`, `URGENT`, `EMERGENCY`. |
| `status` | VARCHAR(50) | No | `'PENDING'` | State indicator. Stricly partitioned as:<br>• **SRS-Supported Statuses:** `PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`<br>• **Proposed Workflow Statuses (Awaiting ASN Raju Confirmation):** `DONORS_ALERTED`, `DONOR_RESPONDED`, `COORDINATOR_ASSIGNED`, `DONOR_CONFIRMED`, `CANCELLED`, `NO_DONOR_FOUND`. |
| `description` | TEXT | Yes | NULL | Notes / medical conditions. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Request creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Request modification timestamp. |
| `closed_at` | TIMESTAMP TZ | Yes | NULL | Timestamp when resolved or closed. |

---

### 8. `donor_responses`
Tracks when individual matched donors are alerted and their response states.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `request_id` -> `blood_requests.id` (ON DELETE CASCADE)
  - Foreign Key: `donor_id` -> `donor_profiles.id` (ON DELETE CASCADE)

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `request_id` | UUID | No | - | Foreign Key to `blood_requests`. |
| `donor_id` | UUID | No | - | Foreign Key to `donor_profiles`. |
| `response_status` | VARCHAR(50) | No | `'NO_RESPONSE'` | State: `ACCEPTED`, `REJECTED`, `NO_RESPONSE`. |
| `responded_at` | TIMESTAMP TZ | Yes | NULL | Timestamp when donor updated status. |
| `notes` | TEXT | Yes | NULL | Message or constraints from the donor. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Alert logged timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Status updated timestamp. |

- **Constraints:**
  - UNIQUE constraint on `(request_id, donor_id)` to prevent duplicating alerts/responses for a single donor on a single request.

---

### 9. `request_assignments`
Preserves history of which coordinator was assigned to manage/verify a blood request.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `request_id` -> `blood_requests.id` (ON DELETE CASCADE)
  - Foreign Key: `coordinator_id` -> `coordinator_profiles.id`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `request_id` | UUID | No | - | Foreign Key to `blood_requests`. |
| `coordinator_id` | UUID | No | - | Foreign Key to `coordinator_profiles`. |
| `assigned_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Timestamp when assigned. |
| `status` | VARCHAR(50) | No | `'ASSIGNED'` | Assignment status: `ASSIGNED`, `IN_PROGRESS`, `COMPLETED`, `REASSIGNED`. |
| `completed_at` | TIMESTAMP TZ | Yes | NULL | Timestamp when coordinator task resolved. |
| `notes` | TEXT | Yes | NULL | Handover details or notes. |

---

### 10. `donations`
Logs donation events. Can be tied directly to a request or stand alone (voluntary donation).
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `donor_id` -> `donor_profiles.id`
  - Foreign Key: `request_id` -> `blood_requests.id` (ON DELETE SET NULL, Nullable)
  - Foreign Key: `blood_group_id` -> `blood_groups.id`
  - Foreign Key: `verified_by` -> `users.id` (ON DELETE SET NULL, Nullable)

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `donor_id` | UUID | No | - | Foreign Key to `donor_profiles`. |
| `request_id` | UUID | Yes | NULL | Optional Foreign Key to `blood_requests`. |
| `blood_group_id` | INT | No | - | Foreign Key to `blood_groups`. |
| `donation_date` | DATE | No | - | Date of donation. |
| `units` | INT | No | `1` | Quantity donated. Must be positive (CHECK: `units > 0`). |
| `status` | VARCHAR(50) | No | `'SCHEDULED'` | Status: `SCHEDULED`, `COMPLETED`, `CANCELLED`, `REJECTED`. |
| `verified_by` | UUID | Yes | NULL | ID of coordinator/admin user who verified the donation. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Record creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Record update timestamp. |

---

### 11. `notifications`
Single generic table logging outbound alerts.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `user_id` -> `users.id` (ON DELETE CASCADE)
  - Foreign Key: `request_id` -> `blood_requests.id` (ON DELETE SET NULL, Nullable)

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `user_id` | UUID | No | - | Recipient. Foreign Key to `users`. |
| `request_id` | UUID | Yes | NULL | Associated request. Foreign Key to `blood_requests`. |
| `type` | VARCHAR(50) | No | - | Type: `EMERGENCY_REQUEST`, `REQUEST_STATUS`, `DONATION_REMINDER`, `BLOOD_CAMP`, `SYSTEM`. |
| `channel` | VARCHAR(50) | No | - | Delivery: `SMS`, `WHATSAPP`, `PUSH`, `EMAIL`, `IN_APP`. |
| `title` | VARCHAR(255) | No | - | Title/Subject. |
| `message` | TEXT | No | - | Notification body text. |
| `status` | VARCHAR(50) | No | `'PENDING'` | Delivery Status: `PENDING`, `SENT`, `FAILED`, `READ`. |
| `sent_at` | TIMESTAMP TZ | Yes | NULL | Dispatch timestamp. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Created timestamp. |

---

### 12. `blood_camps`
Public donation camp schedules managed by organizers/admins.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `created_by` -> `users.id`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `name` | VARCHAR(255) | No | - | Name of the camp (e.g. "Rotary Club Blood Drive"). |
| `organizer` | VARCHAR(255) | No | - | Organizing body name. |
| `description` | TEXT | Yes | NULL | Operational guidelines or description. |
| `date` | DATE | No | - | Scheduled date. |
| `start_time` | TIME | No | - | Start hours. |
| `end_time` | TIME | No | - | Closing hours. |
| `venue` | VARCHAR(255) | No | - | Specific venue name (e.g., "City Hall"). |
| `address` | TEXT | No | - | Address of the venue. |
| `area` | VARCHAR(100) | No | - | Neighborhood. |
| `district` | VARCHAR(100) | No | - | District name. |
| `state` | VARCHAR(100) | No | - | State name. |
| `contact_name` | VARCHAR(255) | No | - | Contact person's name. |
| `contact_phone` | VARCHAR(50) | No | - | Contact phone number. |
| `status` | VARCHAR(50) | No | `'UPCOMING'` | Camp status: `UPCOMING`, `ACTIVE`, `COMPLETED`, `CANCELLED`. |
| `created_by` | UUID | No | - | Foreign Key to `users` (organizer/admin account). |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Camp entry creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Camp entry update timestamp. |

---

### 13. `blood_inventory`
Tracks stored blood products, locations, and components in various centers.
- **Primary Key:** `id` (UUID / BIGINT)
- **Relationships:**
  - Foreign Key: `blood_group_id` -> `blood_groups.id`

| Field Name | Data Type | Nullable | Default | Constraints / Description |
| :--- | :--- | :--- | :--- | :--- |
| `id` | UUID | No | `uuid_generate_v4()` | Primary Key. |
| `blood_group_id` | INT | No | - | Foreign Key to `blood_groups`. |
| `component` | VARCHAR(100) | No | - | Type of component: `WHOLE_BLOOD`, `RED_CELLS`, `PLATELETS`, `PLASMA`. |
| `blood_bank_location` | VARCHAR(255) | No | - | Storage center name or location description. |
| `units` | INT | No | - | Quantity of units. (CHECK: `units >= 0`). |
| `collection_date` | DATE | No | - | Collection date. |
| `expiration_date` | DATE | No | - | Expiration date. |
| `status` | VARCHAR(50) | No | `'AVAILABLE'` | Inventory status: `AVAILABLE`, `RESERVED`, `EXPIRED`, `DISPOSED`. |
| `created_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Record creation timestamp. |
| `updated_at` | TIMESTAMP TZ | No | `CURRENT_TIMESTAMP` | Record update timestamp. |

---

## Critical Indexes for Performance

The database indexes are designed around the primary queries used by coordinators, donors, and system matchers:

1. **Donor Matching Search Index:**
   - Index: `idx_donor_profiles_matching` on `donor_profiles(blood_group_id, district, area, availability_status, eligibility_status)`
   - Purpose: **Optimized Index.** Directly satisfies the exact donor search query filtering by group, district, neighborhood area, availability, and eligibility, eliminating multi-index lookup merges.
2. **Coordinator Assignments:**
   - Index: `idx_coordinator_profiles_region` on `coordinator_profiles(district, area)`
   - Purpose: Locating local coordinators to assign incoming requests.
3. **Emergency Requests Query:**
   - Index: `idx_blood_requests_urgency_status` on `blood_requests(urgency_level, status)`
   - Purpose: Power dashboards listing active high-urgency requests.
4. **Blood Requests Sorting:**
   - Index: `idx_blood_requests_required_date` on `blood_requests(required_date_time)`
   - Purpose: Sort active requests by upcoming deadline.
5. **Donor Responses Lookup:**
   - Index: `idx_donor_responses_request` on `donor_responses(request_id)`
   - Purpose: Track how many matched donors have accepted or rejected a specific request.
6. **Coordinator Caseloads:**
   - Index: `idx_request_assignments_coordinator` on `request_assignments(coordinator_id)`
   - Purpose: Allow coordinators to fetch their historical or active caseload.
7. **Notification Lookup:**
   - Index: `idx_notifications_user_unread` on `notifications(user_id, status)`
   - Purpose: Fetch unread alerts quickly for the logged-in user.
8. **Blood Camps Lookup:**
   - Index: `idx_blood_camps_date_location` on `blood_camps(date, district, area)`
   - Purpose: Display upcoming drives in a user's vicinity.
9. **Blood Inventory Expiry & Matching:**
   - Index: `idx_blood_inventory_expiry` on `blood_inventory(expiration_date)`
   - Index: `idx_blood_inventory_lookup` on `blood_inventory(blood_group_id, component, status)`
   - Purpose: Track expired stock and locate matches for hospital requests.
