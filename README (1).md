# Hospital Management System (HMS)

A centralized relational database system for managing hospital administrative, patient, appointment, inpatient, pharmacy, inventory, and billing processes.

> Originally developed as a Database Systems (BCSE302P) lab project at VIT, School of Computer Science and Engineering, by Anweshika Mehta and Drishti Priya.

---

## 1. Project Overview

Traditional, fragmented hospital operations are prone to double-booked appointments, inaccurate inventory tracking, and delayed billing. This project digitizes and integrates these processes into a single relational system built on PostgreSQL 16, hosted via Supabase, with a React-based frontend.

The database is normalized to Third Normal Form (3NF) and uses constraints, triggers, and stored procedures to enforce data integrity and automate multi-step clinical/administrative workflows (bed allocation, inventory decrement, discharge billing).

---

## 2. Features

- Department and doctor administration, including department head assignment.
- Patient registration with demographic and contact information.
- Outpatient appointment scheduling with **database-enforced** conflict prevention (a doctor cannot be double-booked for the same date and time slot).
- Inpatient admission and bed management across ICU, General, and Private wards, with bed status tracking.
- Pharmacy inventory management, including stock levels and minimum-threshold tracking, with stock decrementing on prescription issuance.
- Automated, consolidated invoice generation on discharge, aggregating room, doctor, and medication charges.
- Referential integrity enforced throughout via foreign keys, with cascading deletes and NULL-preserving deletes used deliberately depending on the relationship.

---

## 3. Technology Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite 8, Tailwind CSS v4 |
| Backend/Data | Supabase (managed PostgreSQL, REST API, authentication), PostgreSQL 16 |
| Client library | `@supabase/supabase-js` |
| Runtime | Node.js 18+, npm |
| Development | Visual Studio Code, a modern browser (Chrome, Edge, or Firefox) |

---

## 4. System Architecture

The frontend (React + TypeScript, built with Vite) communicates directly with Supabase using `@supabase/supabase-js`, which provides an instant REST API over the underlying PostgreSQL 16 database. There is no custom backend server in this design — Supabase serves as the API and authentication layer, and PostgreSQL enforces data integrity through constraints, triggers, and stored procedures.

See **[architecture.md](./architecture.md)** for a detailed architectural breakdown.

---

## 5. Modules

- **Administrative Management** — departments and doctor profiles (specialization, consultation fee).
- **Patient Management** — demographic, contact, and blood group registration.
- **Appointment Scheduling** — outpatient visit booking with exclusive database-level conflict resolution.
- **Inpatient & Bed Management** — ward-specific (ICU, General, Private) bed availability and the admission/discharge lifecycle.
- **Pharmacy & Inventory** — medication catalog, stock tracking, minimum-threshold management, and inventory decrement on prescription issuance.
- **Automated Billing** — consolidated invoices on discharge, aggregating bed, doctor, and medication costs for the stay.

---

## 6. Database Overview

Nine core tables, normalized to 3NF:

| Table | Purpose |
|---|---|
| `departments` | Hospital departments (name, floor, optional head doctor) |
| `doctors` | Doctor profiles (department, specialization, fee) |
| `patients` | Patient demographic and contact records |
| `rooms_beds` | Physical beds (room number, ward type, daily rate, status) |
| `admissions` | Inpatient stays linking a patient, bed, and doctor |
| `appointments` | Outpatient bookings linking a patient and doctor |
| `medications` | Pharmacy catalog with stock and pricing |
| `prescription_items` | Medications prescribed during a given admission |
| `invoices` | Consolidated billing per admission |

**Key database features:**
- 3NF normalization; `SERIAL` primary keys on every table.
- Foreign keys throughout, with `ON DELETE CASCADE` for records that have no meaning without their parent (e.g., an admission's invoice), and `ON DELETE SET NULL` where the referencing record should persist independently (e.g., a doctor after their department is removed).
- A composite `UNIQUE (doctor_id, appt_date, time_slot)` constraint preventing appointment double-booking at the database level.
- `CHECK` constraints enforcing numeric validity (fees, rates, stock, quantities all required to be positive/non-negative) and restricted status vocabularies (bed status, appointment status, invoice status).
- Indexes (including a partial index on active admissions) supporting common lookup patterns.
- Triggers and a stored procedure, per the project's design, for automatic discharge on unsettled balances and for discharge-time length-of-stay/billing calculation.

Full details: **[database.md](./database.md)**.

---

## 7. Repository Structure

> The exact repository layout is not enumerated in the project report. Refer to **[setup.md](./setup.md)** and the project's own source tree for the authoritative structure once available.

---

## 8. Setup

See **[setup.md](./setup.md)** for full setup instructions. At a minimum:

- Node.js 18+ and npm installed.
- A Supabase project provisioned (see [database.md](./database.md) and [backend.md](./backend.md)).
- Repository cloned and dependencies installed with `npm install`.

---

## 9. Running the Project

```bash
npm install
npm run dev      # start the Vite development server
npm run build    # produce a production build
```

See **[setup.md](./setup.md)** for environment configuration required before running the project.

---

## 10. Database Configuration

The database schema (tables, constraints, indexes, triggers, and stored procedures) is deployed to a Supabase-hosted PostgreSQL 16 instance. See **[database.md](./database.md)** for the schema and **[deployment.md](./deployment.md)** for how it is deployed and configured across environments.

---

## 11. Environment Variables

The frontend requires the Supabase project URL and public (anon) API key, exposed via Vite's `VITE_`-prefixed environment variables:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

See **[deployment.md](./deployment.md)** (§3, §10) for full details, including what must **not** be placed in a frontend environment variable (the Supabase service role key).

---

## 12. Documentation Index

| Document | Contents |
|---|---|
| [architecture.md](./architecture.md) | System architecture and component interaction |
| [frontend.md](./frontend.md) | Frontend structure, components, and conventions |
| [backend.md](./backend.md) | Supabase configuration and backend/API behavior |
| [database.md](./database.md) | Full schema, constraints, indexes, triggers, and procedures |
| [orchestration.md](./orchestration.md) | How modules/workflows coordinate across the stack |
| [api.md](./api.md) | Data access patterns via `@supabase/supabase-js` |
| [authentication.md](./authentication.md) | Authentication and access control |
| [workflows.md](./workflows.md) | End-to-end operational workflows (admission, discharge, billing, etc.) |
| [setup.md](./setup.md) | Local development setup instructions |
| [business-rules.md](./business-rules.md) | Business rules extracted from the project report, by module |
| [database-queries.md](./database-queries.md) | Categorized PostgreSQL query reference |
| [testing.md](./testing.md) | Recommended testing strategy and test case catalog |
| [deployment.md](./deployment.md) | Provider-neutral deployment guide |

> Some documents listed above (architecture, frontend, backend, orchestration, api, authentication, workflows, setup) are referenced as part of the intended documentation set but are not produced in this pass — see [testing.md](./testing.md), [deployment.md](./deployment.md), [business-rules.md](./business-rules.md), and [database-queries.md](./database-queries.md) for the documents covered here.

---

## 13. Testing

No automated test suite is described as existing in the project report. A recommended testing strategy — covering unit, component, integration, database, constraint, trigger, stored procedure, transaction, API, end-to-end, error handling, security, and performance testing, plus a full test case catalog — is documented in **[testing.md](./testing.md)**.

---

## 14. Deployment

The project has no stated hosting provider or CI/CD pipeline. A provider-neutral deployment guide — covering the frontend build process, environment variables, Supabase configuration, database schema deployment, environment separation, secrets management, database security, monitoring, backups, rollback strategy, and a production checklist — is documented in **[deployment.md](./deployment.md)**.

---

## 15. Future Improvements

The following are natural extensions beyond what the project report describes, not commitments or existing plans:

- Formalize and document the exact trigger and stored procedure definitions referenced in the report's abstract (auto-discharge on unsettled balance; discharge length-of-stay/billing calculation).
- Document the decision-support view(s) mentioned in the report (day rates and physician lists per ward) with their exact definitions.
- Establish an automated test suite per `testing.md`.
- Establish CI/CD and a concrete hosting choice per `deployment.md`.
- Define and document Row Level Security policies for production use, given the system's handling of patient data.
