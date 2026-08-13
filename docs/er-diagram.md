# Gift of Life - Entity Relationship Diagram

This document contains the Entity Relationship (ER) diagram for the Gift of Life blood donation management system database. The diagram is written using Mermaid syntax and matches the database schema exactly.

## Mermaid ER Diagram

```mermaid
erDiagram
    users {
        uuid id PK "Note: UUID or BIGINT PK unresolved"
        varchar name
        varchar email UK
        varchar phone UK
        varchar password_hash
        varchar status
        timestamptz created_at
        timestamptz updated_at
        timestamptz last_login_at
    }

    user_roles {
        uuid id PK
        uuid user_id FK
        varchar role
        timestamptz created_at
    }

    blood_groups {
        int id PK
        varchar code UK
        varchar name
    }

    donor_profiles {
        uuid id PK
        uuid user_id FK,UK
        int blood_group_id FK
        date date_of_birth
        varchar gender
        varchar phone
        text address
        varchar area
        varchar district
        varchar state
        varchar pincode
        date last_donation_date
        varchar availability_status
        varchar eligibility_status
        date deferred_until "added after review"
        timestamptz created_at
        timestamptz updated_at
    }

    receiver_profiles {
        uuid id PK
        uuid user_id FK,UK
        varchar name
        varchar phone
        text address
        varchar area
        varchar district
        varchar state
        varchar pincode
        varchar receiver_type
        varchar verification_status "PROPOSED"
        timestamptz created_at
        timestamptz updated_at
    }

    coordinator_profiles {
        uuid id PK
        uuid user_id FK,UK
        varchar area
        varchar district
        varchar state
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    blood_requests {
        uuid id PK
        uuid receiver_id FK
        int blood_group_id FK
        int required_units
        varchar patient_name
        varchar hospital_name
        text hospital_address
        varchar location
        timestamptz required_date_time
        varchar urgency_level
        varchar status "SRS: PENDING/APPROVED/REJECTED/FULFILLED"
        text description
        timestamptz created_at
        timestamptz updated_at
        timestamptz closed_at
    }

    donor_responses {
        uuid id PK
        uuid request_id FK
        uuid donor_id FK
        varchar response_status
        timestamptz responded_at
        text notes
        timestamptz created_at
        timestamptz updated_at
    }

    request_assignments {
        uuid id PK
        uuid request_id FK
        uuid coordinator_id FK
        timestamptz assigned_at
        varchar status
        timestamptz completed_at
        text notes
    }

    donations {
        uuid id PK
        uuid donor_id FK
        uuid request_id FK "nullable"
        int blood_group_id FK
        date donation_date
        int units
        varchar status
        uuid verified_by FK "nullable"
        timestamptz created_at
        timestamptz updated_at
    }

    notifications {
        uuid id PK
        uuid user_id FK
        uuid request_id FK "nullable"
        varchar type
        varchar channel
        varchar title
        text message
        varchar status
        timestamptz sent_at
        timestamptz created_at
    }

    blood_camps {
        uuid id PK
        varchar name
        varchar organizer
        text description
        date date
        time start_time
        time end_time
        varchar venue
        text address
        varchar area
        varchar district
        varchar state
        varchar contact_name
        varchar contact_phone
        varchar status
        uuid created_by FK
        timestamptz created_at
        timestamptz updated_at
    }

    blood_inventory {
        uuid id PK
        int blood_group_id FK
        varchar component
        varchar blood_bank_location
        int units
        date collection_date
        date expiration_date
        varchar status
        timestamptz created_at
        timestamptz updated_at
    }

    %% Relationships
    users ||--o{ user_roles : "has roles"
    users ||--o| donor_profiles : "has profile"
    users ||--o| receiver_profiles : "has profile"
    users ||--o| coordinator_profiles : "has profile"
    users ||--o{ notifications : "receives"
    users ||--o{ donations : "verifies"
    users ||--o{ blood_camps : "creates"

    blood_groups ||--o{ donor_profiles : "defines"
    blood_groups ||--o{ blood_requests : "defines"
    blood_groups ||--o{ donations : "defines"
    blood_groups ||--o{ blood_inventory : "defines"

    receiver_profiles ||--o{ blood_requests : "submits"

    blood_requests ||--o{ donor_responses : "receives responses"
    donor_profiles ||--o{ donor_responses : "responds to"

    blood_requests ||--o{ request_assignments : "assigned via"
    coordinator_profiles ||--o{ request_assignments : "manages"

    blood_requests ||--o{ donations : "completed via"
    donor_profiles ||--o{ donations : "gives"

    blood_requests ||--o{ notifications : "triggered by"
```

## Key Architectural Relationships

1. **Multi-Role Accounts:** `users` is the master identity record. If a person acts as a `DONOR` and a `RECEIVER`, they hold records in both `donor_profiles` and `receiver_profiles` pointing back to the same `users.id` via their respective `user_id` columns.
2. **Normalized Blood Groups:** All blood-type strings are stored inside `blood_groups` and referenced through a Foreign Key. This ensures query consistency and prevents typographical errors in blood types.
3. **Decoupled Responses:** Donor alerts and feedback are separated into `donor_responses` to support matching multiple potential donors to a single request without modifying the `blood_requests` row.
4. **Historical Request Assignments:** Rather than a simple foreign key linking `blood_requests` to a single coordinator, `request_assignments` tracks the full lifecycle of coordinator assignments for auditing purposes.
