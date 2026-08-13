# Gift of Life - Database Decisions Log

This document records the confirmed schema decisions, proposed technical choices, and active items that require confirmation from ASN Raju and the operational product team.

---

## 1. Confirmed Decisions

The following architectural patterns have been established according to project specifications and safety requirements:

- **Database Platform:** PostgreSQL 18.
- **Node Driver:** `pg` (version `^8.23.0`).
- **Primary Key Strategy:** UUID primary keys natively generated on insert via standard `gen_random_uuid()` (PostgreSQL 13+ native default).
- **Migration Approach:** Authoritative schema migrations managed via a transaction-safe custom SQL runner (`backend/src/database/migrate.js`) tracking executed files in a `migrations` table.
- **Single Authentication Table (Unified Accounts):** A single table `users` handles user accounts, emails, phones, and passwords. Separate role-based authentication tables (e.g. `donor_users`, `receiver_users`) are **banned**.
- **Multi-Role Support:** Roles are separated into a dedicated join table `user_roles` (`user_id`, `role`), which enables a single user to hold multiple roles (such as both a `DONOR` and a `RECEIVER`).
- **Profile Decoupling:** Role-specific details are held in separate profiles (`donor_profiles`, `receiver_profiles`, `coordinator_profiles`) with strict `UNIQUE` constraints on their `user_id` columns to enforce 1-to-1 mappings with the primary `users` record.
- **Role Assignment Restrictions:** Self-registration is allowed for `DONOR` and `RECEIVER` profiles. Privilege allocation for `COORDINATOR` and `ADMIN` is strictly reserved and cannot be freely self-assigned.
- **Normalized Reference for Blood Groups:** A single lookup table `blood_groups` handles the standard 8 groups (`A+`, `A-`, `B+`, `B-`, `AB+`, `AB-`, `O+`, `O-`). All related tables store a reference ID rather than raw strings to ensure referential integrity.
- **Audit trail for Request Assignments:** Assignments to coordinators are logged in a historic join table `request_assignments` rather than being overwritten in a simple foreign key on the request itself.
- **Decoupled Donor Matches:** Matching and alerts are tracked in `donor_responses` (1:N relationship with requests), avoiding the store of a single `donor_id` column on the request.
- **Donation Verification:** Donations are verified by authorized users, logged in `donations.verified_by` referencing `users(id)` (to allow coordinator or admin verification).
- **Temporary Deferral Tracking:** Added `deferred_until` (DATE, nullable) to `donor_profiles` to track when a temporary deferral expires.

---

## 3. Proposed Decisions (Awaiting Operational Confirmation)

These items represent proposed features or workflow states that must be confirmed by ASN Raju or the business team before locking them into production code:

### A. Blood Inventory Management Workflow
- **Proposal:** A `blood_inventory` table tracking available units by blood type, location, component, and expiration.
- **Status:** **Proposed / Awaiting Confirmation.** Do not assume this table automatically replaces their existing manual Excel spreadsheet. Automated updates or integrations with blood-bank software are postponed until confirmed.

### B. Blood Request Status Lifecycle
- **SRS-Supported Statuses:** `PENDING`, `APPROVED`, `REJECTED`, `FULFILLED`.
- **Proposed Operational Workflow Statuses:** `DONORS_ALERTED`, `DONOR_RESPONDED`, `COORDINATOR_ASSIGNED`, `DONOR_CONFIRMED`, `CANCELLED`, `NO_DONOR_FOUND`.
- **Status:** The proposed transition statuses are for operational tracking. They must be validated with ASN Raju before being locked into the application code.

### C. Receiver Verification Status
- **Proposal:** Added a `verification_status` field (`PENDING`, `APPROVED`, `REJECTED`) to `receiver_profiles`.
- **Status:** **Proposed / Awaiting Confirmation.** The registration flow for authenticated receivers (whether they require manual approval by an admin or blood-bank coordinator) must be validated with the product stakeholders.

### D. Notification Delivery Channels
- **Proposal:** `SMS`, `WHATSAPP`, `PUSH`, `EMAIL`, `IN_APP`.
- **Status:** **Proposed / Awaiting Confirmation.** Choose third-party API providers (e.g. Twilio, SendGrid) when the integration phase begins.

---

## 4. Query Indexing Choices

The indexes have been refined to support critical queries while minimizing write penalties:

- **Donor Match Query:** Optimized matching by creating a single, wide composite index `idx_donor_profiles_matching` on `(blood_group_id, district, area, availability_status, eligibility_status)`. This index covers the search filters used to match emergency requests with eligible/available donors, eliminating index merge overhead.
- **Coordinator Assignment History:** `idx_request_assignments_coordinator` and `idx_request_assignments_request` to query coordinators' workloads and request audits.
- **Notification Unread Badges:** `idx_notifications_user_unread` on `(user_id, status)` for fast load times.
- **Inventory matching:** `idx_blood_inventory_lookup` on `(blood_group_id, component, status)` for checking bank levels.
