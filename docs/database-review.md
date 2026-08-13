# Database Schema Review & Updates

This document contains the review of the Gift of Life database schema design against the Software Requirements Specification (SRS) and project instructions, including updates made following initial feedback.

---

## 1. Requirement Verifications

### A. Multi-Role Support (DONOR & RECEIVER)
*   **Verification:** **PASS**
*   **Detail:** The schema implements a unified `users` table for authentication, which links to a separate `user_roles` table via a Foreign Key (`user_id`). A single user can have multiple rows in `user_roles` (e.g. `DONOR` and `RECEIVER` simultaneously). Role-specific details are held in separate profile tables (`donor_profiles` and `receiver_profiles`) linked via 1-to-1 relationships to `users`, allowing a single account to hold both profiles.

### B. Receiver References in Blood Requests
*   **Verification:** **PASS**
*   **Detail:** In `blood_requests`, the column `receiver_id` references `receiver_profiles(id)` directly, rather than referencing `users(id)` directly. This ensures that a requester must have a completed, valid receiver profile before a request can be posted.

### C. Foreign Key Relationships Analysis
*   **Verification:** **PASS**
*   **Detail:** Every relationship has been mapped with appropriate foreign keys. 
    *   `donations.verified_by` references `users(id)` (ON DELETE SET NULL). This allows coordinators or admin users to verify donations.
    *   `donations.blood_group_id` references `blood_groups(id)`. This records the physical blood group of the unit donated at the time of donation, ensuring standard transactional recording.

### D. Donor Responses Cardinality (1:N & N:1)
*   **Verification:** **PASS**
*   **Detail:** The schema implements `donor_responses` as a join table:
    *   `request_id UUID REFERENCES blood_requests(id)` (Allows one request to be matched to many donors).
    *   `donor_id UUID REFERENCES donor_profiles(id)` (Allows one donor to receive and respond to many requests).
    *   `CONSTRAINT uq_request_donor UNIQUE (request_id, donor_id)` prevents a donor from submitting duplicate response rows for a single request.

### E. Request Assignment History
*   **Verification:** **PASS**
*   **Detail:** The `request_assignments` table acts as a historical join table between `blood_requests` and `coordinator_profiles` to preserve coordinator caseload history over time rather than overwriting records.

### F. Optional Blood Request Association in Donations
*   **Verification:** **PASS**
*   **Detail:** The `donations.request_id` field is explicitly nullable (`UUID REFERENCES blood_requests(id) ON DELETE SET NULL`). This allows voluntary, non-emergency blood donations to be recorded without being tied to an active emergency request.

### G. Notifications Multi-Association
*   **Verification:** **PASS**
*   **Detail:** In the `notifications` table, `user_id` is defined as `NOT NULL` (every message has a recipient), while `request_id` is nullable. This supports both generic system notifications and request-specific alert dispatches.

---

## 2. Inventory & Enums Analysis

### A. Blood Inventory Review
*   **Confirmed by SRS:**
    *   `blood_group_id` (blood type).
    *   `component` (component type).
    *   `blood_bank_location` (storage location).
    *   `expiration_date` (expiration date tracking).
    *   `units` (available units).
*   **Assumed/Proposed Fields:**
    *   `collection_date` (for audit and storage log validation).
    *   `status` (`AVAILABLE`, `RESERVED`, `EXPIRED`, `DISPOSED`) - needed to flag stock state.
*   **Status:** **Awaiting ASN Raju Confirmation.** The inventory workflow must be validated with ASN Raju before locking it into the codebase. The database does not automatically replace their existing Excel tracking process.

### B. Request Status Review
*   **SRS-Supported Statuses:**
    *   `PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`
*   **Proposed Operational Workflow Statuses (Awaiting ASN Raju Confirmation):**
    *   `DONORS_ALERTED` (Alerts dispatched to matched donors).
    *   `DONOR_RESPONDED` (At least one donor accepted or rejected the request).
    *   `COORDINATOR_ASSIGNED` (Coordinator has taken charge of the request).
    *   `DONOR_CONFIRMED` (Donor confirmed arrival/appointment).
    *   `CANCELLED` (Requester withdrew request).
    *   `NO_DONOR_FOUND` (System failed to find an available match in time).

### C. Receiver Types
*   **Confirmed by Project Requirements:**
    *   `INDIVIDUAL`, `PATIENT_ATTENDANT`, and hospital-related requester (`HOSPITAL`).
*   **Assumed Values & Constraints:**
    *   Defaulting to `'INDIVIDUAL'` on profile creation.
    *   Uppercase code string format.

### D. Primary Key Technical Choice
*   **Technical Design Choice:** `UUID` (via `uuid-ossp` default generator `uuid_generate_v4()`).
*   **Status:** **Unresolved Technical Decision.** The decision between using UUIDs vs. sequential BigInts (`BIGINT SERIAL`) remains unresolved and open for developer review. The SRS does not mandate any specific primary key representation.

---

## 3. Database Index Review & Optimizations

An index should only be created if it significantly improves query performance. Over-indexing causes write degradation during insert/update cycles.

| Index Name | Indexed Column(s) | Table | Target Query & Justification | Status |
| :--- | :--- | :--- | :--- | :--- |
| `idx_user_roles_user_id` | `user_id` | `user_roles` | Finding roles assigned to a user during login/auth. | **KEEP** (Crucial FK) |
| `idx_donor_profiles_matching` | `(blood_group_id, district, area, availability_status, eligibility_status)` | `donor_profiles` | **OPTIMIZED COMPOSITE INDEX.** Satisfies donor search filters in a single index scan, matching by blood type, location, availability, and eligibility. | **UPDATED** (Replaced match & status indexes) |
| `idx_coordinator_profiles_region` | `(district, area)` | `coordinator_profiles` | Locating regional coordinators to assign incoming requests. | **KEEP** |
| `idx_blood_requests_urgency_status` | `(urgency_level, status)` | `blood_requests` | Powering dashboard views of active emergency requests. | **KEEP** |
| `idx_blood_requests_required_date` | `required_date_time` | `blood_requests` | Sorting requests by nearest delivery deadline. | **KEEP** |
| `idx_blood_requests_match` | `(blood_group_id, status)` | `blood_requests` | Matching requests with inventory or active donor campaigns. | **KEEP** |
| `idx_donor_responses_request` | `request_id` | `donor_responses` | Pulling responses from alerted donors for a specific request. | **KEEP** (Crucial FK) |
| `idx_request_assignments_coordinator`| `coordinator_id` | `request_assignments`| Caseload queries: displaying requests assigned to a coordinator. | **KEEP** (Crucial FK) |
| `idx_request_assignments_request` | `request_id` | `request_assignments` | Fetching coordinator assignment history for a request. | **KEEP** (Crucial FK) |
| `idx_donations_donor` | `donor_id` | `donations` | Displaying donation history on a donor's profile. | **KEEP** (Crucial FK) |
| `idx_donations_date` | `donation_date` | `donations` | Aggregating donation metrics over time. | **KEEP** |
| `idx_notifications_user_unread` | `(user_id, status)` | `notifications` | Unread badge counts on user dashboards. | **KEEP** |
| `idx_blood_camps_date_location` | `(date, district, area)` | `blood_camps` | Searching upcoming local blood drives. | **KEEP** |
| `idx_blood_inventory_expiry` | `expiration_date` | `blood_inventory` | Background sweeps for expired stock. | **KEEP** |
| `idx_blood_inventory_lookup` | `(blood_group_id, component, status)`| `blood_inventory`| Finding available inventory units matching a specific blood request. | **KEEP** |

### Index Change Detail:
*   **Consolidated Match & Status Indexes:** Replaced the previous `idx_donor_profiles_match` and `idx_donor_profiles_status` with a single, composite index `idx_donor_profiles_matching` on `(blood_group_id, district, area, availability_status, eligibility_status)`. Since query matches filter by all these criteria, a single wide composite index is highly selective and eliminates index merge scans.

---

## 4. Updates Made Based on Design Review

Following the database review feedback, the following design updates have been incorporated:

1.  **Added `deferred_until` Column:** Added `deferred_until DATE` (nullable) to `donor_profiles` to track the expiration date of temporary deferrals.
2.  **Proposed Receiver Verification:** Added `verification_status` to `receiver_profiles` clearly marked as **PROPOSED / AWAITING CONFIRMATION**, noting that manual blood-bank/coordinator approval may or may not be required for registration.
3.  **Partitioned Request Statuses:** Stated and split statuses in DDL/docs into SRS-supported (`PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`) vs. proposed operational workflow statuses.
4.  **Optimized Matching Index:** Integrated the consolidated composite index `idx_donor_profiles_matching` into `schema.sql`.

---

## Summary of Implementation Readiness

> [!IMPORTANT]
> **Readiness Rating: 95% (Awaiting Stakeholder Sign-off)**
> 
> The database schema design has been updated to address all review findings. It is structurally complete, relational, and fully normalized. The remaining 5% involves aligning with ASN Raju on the Excel inventory migration, receiver verification flows, and deciding the primary key representation (UUID vs serial BigInts) with the development team.
