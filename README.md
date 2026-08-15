# Gift of Life (Blood Donation Platform)

An operationally tuned, role-based platform designed to streamline blood donor discovery, regional coordination, clinical screening, and donation fulfillment.

---

## 🩸 About the Project
This platform is specifically tailored for **ASN Raju Charitable Trust / ASN Raju Blood Centre** located in **Bhimavaram**. 

Unlike generic, nationwide blood directories or marketplaces, **Gift of Life** represents a localized physical coordination pipeline. Every request triggers targeted matching, regional coordinator notifications, and coordinates the donor's physical visit to the designated trust location in Bhimavaram.

---

## 🔄 The Blood Donation Lifecycle
The system operates on an atomic state-driven workflow following the real-world operational path:

```
[Receiver creates Blood Request]
               ↓
     [Request becomes Active]
               ↓
[Compatible Donors matched & notified]
               ↓
    [Donor clicks "I Can Help"]  ───────── (donor response recorded)
               ↓
[Auto-assign best matching Coordinator] ── (based on area & availability)
               ↓
     [2-Hour Action Window] ────────────── (system monitors response time)
       ├── No Action → [Admin Alert / Reassign]
       └── Action taken:
               ↓
   [Coordinator contacts Donor] ────────── (status: COORDINATOR_ASSIGNED)
               ↓
     [Donation Visit Confirmed] ────────── (status: DONOR_CONFIRMED)
               ↓
   [Physical Visit to Bhimavaram]
               ↓
     [Clinical Screening] ──────────────── (ELIGIBLE, DEFERRED, or NOT ELIGIBLE)
       ├── Deferred/Ineligible → [Reset Request status to source new matches]
       └── Eligible:
               ↓
     [Donation Completed] ──────────────── (status: FULFILLED)
               ↓
 [Receiver notified of fulfillment]
```

### Key Workflow Rules:
1. **Donor Response First:** Coordinators are not assigned immediately after a request is created. They are automatically assigned and notified only when a donor steps forward and clicks **"I Can Help"**.
2. **Auto-Assignment Matching:** The system matches requests to the closest active Operations Coordinator based on area and availability status.
3. **Response Timeout Alert:** If the assigned coordinator does not start coordination within **2 hours** of donor acceptance, the request is flagged with a `TIMEOUT` warning on the Admin panel for intervention.
4. **Failsafe Screening:** If a donor is found temporarily deferred or medically ineligible during screening at the center, the request status is reset to allow other donors to offer help.
5. **Receiver Privacy:** Receivers see a simple, aggregated timeline progress map and do not see internal staff names, audit logs, or assignment changes.

---

## 📂 Project Structure
* **`backend/`** - Node.js Express server using pg-pool. Employs a module-based structure (Auth, Admin, Coordinators, Donors, Receivers) with routes, controllers, services, and repositories.
* **`frontend/`** - React client bundled with Vite. Organized by role-based workspaces, layouts, services, and styling systems.

---

## 🚀 Quickstart Guide (Clone to Run)

Follow these steps to set up and run the application locally on your machine.

### Prerequisites
* **Node.js** (v16.x or higher)
* **PostgreSQL** (v13.x or higher)

---

### Step 1: Clone the Repository
```bash
git clone https://github.com/Bhargavkoushik/gift_of_life.git
cd gift_of_life
```

---

### Step 2: Database Setup
1. Start your PostgreSQL service.
2. Create a database named `gift_of_life`:
   ```sql
   CREATE DATABASE gift_of_life;
   ```
3. Initialize the database schema and seed data by running the script contents of `backend/src/database/schema.sql`.

---

### Step 3: Configure Environment Variables
Create a file named `.env` in the `backend/` directory:
```env
PORT=5000
JWT_SECRET=supersecretjwtkeyforgift-of-life-app
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/gift_of_life
```
*(Adjust the database connection URL credentials `postgres:postgres` and host/port if necessary)*

---

### Step 4: Run the Backend Server
```bash
cd backend
npm install
npm run dev
```
The server will boot on `http://localhost:5000` and output:
```text
database is connected
Server is running on port 5000
```

---

### Step 5: Run the Frontend Client
Open a new terminal window at the project root directory:
```bash
cd frontend
npm install
npm run dev
```
The client will boot on `http://localhost:5173`. Open this URL in your web browser to access the application.

---

## 👥 Workspace Roles
* **Receivers:** Request blood, specify units/urgency, and track simplified milestones.
* **Donors:** Maintain profiles, specify blood groups/availability, review compatible requests, and view visit coordinates.
* **Coordinators:** Oversee assigned donor check-ins, record clinical screening outcomes, and finalize donations.
* **Administrators:** Oversee user registries, manage audit trails, monitor response timeouts, and override coordinator reassignments.
