# Testing Strategy — Hospital Management System

> **Status note:** The project report does not describe an existing automated or manual test suite. Everything in this document is a **recommended testing strategy** to be implemented against the schema shown in the report (BCSE302P — Database Systems Project Work Report), not a record of tests already run.

**Stack under test:** React 19 + TypeScript 5 (frontend), Vite 8, Tailwind CSS v4, Supabase (`@supabase/supabase-js`), PostgreSQL 16.

**Schema reference (from the report):**
`departments(dept_id, dept_name, floor, head_doctor_id)` · `doctors(doctor_id, dept_id, first_name, last_name, specialization, fee, phone)` · `patients(patient_id, first_name, last_name, dob, gender, blood_group, contact)` · `rooms_beds(bed_id, room_no, ward_type, daily_rate, status)` · `admissions(admission_id, patient_id, bed_id, doctor_id, admission_date, discharge_date, notes)` · `appointments(appointment_id, patient_id, doctor_id, appt_date, time_slot, status)` · `medications(med_id, med_name, unit_price, stock_qty, min_threshold)` · `prescription_items(item_id, admission_id, med_id, quantity, dosage_instructions)` · `invoices(invoice_id, admission_id, room_charge, doctor_charge, pharmacy_charge, total_amount, status, created_at)`

---

## 1. Testing Objectives

1. Verify all core clinical/administrative workflows — department, doctor, patient, appointment, admission, prescription, discharge, billing — behave correctly end to end.
2. Verify the schema enforces every constraint shown in the report: primary keys, the five documented foreign keys with their exact `ON DELETE` behaviors, `UNIQUE (doctor_id, appt_date, time_slot)`, and all `CHECK` constraints (`fee > 0`, `daily_rate > 0`, `ward_type IN (...)`, `status IN (...)` on beds/appointments/invoices, `unit_price > 0`, `stock_qty >= 0`, `quantity > 0`).
3. Verify the discharge stored procedure correctly computes length of stay and aggregates room/doctor/pharmacy charges into an invoice.
4. Verify the auto-discharge-on-unsettled-balance trigger (per the report's abstract) fires under the intended condition.
5. Verify ACID compliance for prescription issuance (stock decrement) and discharge/billing.
6. Verify correct behavior under concurrent access, particularly appointment booking and medication stock decrement.
7. Verify the application layer converts database constraint errors into clear, non-crashing user feedback.
8. Validate basic security posture (Supabase key scoping, RLS if configured) and acceptable performance as data volume grows, aided by the nine indexes shown in the report.

---

## 2. Unit Testing

**Scope:** Pure TypeScript functions — fee/invoice total calculations, length-of-stay calculation, low-stock comparison (`stock_qty <= min_threshold`), form validators.

**Tooling:** Vitest (pairs naturally with Vite 8) or Jest with `ts-jest`.

**Practices:**
- Mock the Supabase client entirely; no live database in unit tests.
- Cover boundary values explicitly matched to the schema's CHECK constraints: `fee = 0` vs `fee = 0.01`, `stock_qty = 0` vs `stock_qty = -1`, `quantity = 0` vs `quantity = 1`.

---

## 3. Component Testing

**Scope:** Individual React components — the patient/doctor/department/appointment/admission/prescription forms, the bed-availability view, the low-stock list, the invoice view.

**Tooling:** React Testing Library + Vitest/Jest, `@testing-library/user-event`.

**Practices:**
- Confirm forms enforce client-side validation mirroring the database CHECK constraints before submission (e.g., reject a negative daily rate before it ever reaches Supabase).
- Confirm the ward-type selector only offers `'ICU'`, `'General'`, `'Private'`; the bed-status and appointment-status displays only show the defined enum values.
- Mock `@supabase/supabase-js` at the component boundary.

---

## 4. Integration Testing

**Scope:** Component + Supabase-client interaction — e.g., submitting the "New Appointment" form invokes an insert against `appointments` with the correct `patient_id`, `doctor_id`, `appt_date`, `time_slot`.

**Tooling:** Vitest/Jest + React Testing Library + MSW (Mock Service Worker) or a real Supabase test project.

**Practices:**
- Verify that a rejected insert (e.g., a `23505` unique violation from `uq_doctor_slot`) is caught and turned into a "this slot is already booked" UI message rather than an unhandled promise rejection.
- Verify the admission form correctly submits `patient_id`, `bed_id`, `doctor_id` together and reflects the resulting bed status change in the UI.

---

## 5. Database Testing

**Scope:** Direct testing of the PostgreSQL schema, independent of the frontend.

**Tooling:** `pgTAP`, or plain SQL test scripts run via `psql`/Supabase CLI against a local/staging Postgres 16 instance seeded from the report's `CREATE TABLE` statements.

**Practices:**
- Run the schema DDL (as shown in the report) against a clean database and verify every table, constraint, and index in the "Schema reference" above is present.
- Never test against the production Supabase project — use a separate Supabase project or local Supabase stack, reset/truncated between test runs.

---

## 6. Constraint Testing

Every constraint documented in `business-rules.md` §11 should have a direct test. Key ones from the report's SQL:

- `doctors.fee CHECK (fee > 0)` — attempt `fee = 0` and `fee = -1`.
- `rooms_beds.ward_type CHECK (ward_type IN ('ICU','General','Private'))` — attempt `'VIP'`.
- `rooms_beds.daily_rate CHECK (daily_rate > 0)` — attempt `0` and negative values.
- `rooms_beds.status CHECK (status IN ('Vacant','Occupied','Sanitizing'))` — attempt `'Reserved'`.
- `appointments.status CHECK (status IN ('Scheduled','Completed','Cancelled'))` — attempt `'InProgress'`.
- `appointments` `UNIQUE (doctor_id, appt_date, time_slot)` — attempt a duplicate triple.
- `medications.unit_price CHECK (unit_price > 0)` and `stock_qty CHECK (stock_qty >= 0)`.
- `prescription_items.quantity CHECK (quantity > 0)`.
- `invoices.status CHECK (status IN ('Pending','Paid'))`.
- Every `NOT NULL` on required identity columns (`dept_name`, `floor`, doctor/patient names, bed `room_no`, medication `med_name`).

Document the PostgreSQL error codes expected: `23503` (foreign key), `23505` (unique), `23514` (check), `23502` (not null).

---

## 7. Trigger Testing

**Scope:** The auto-discharge-on-unsettled-balance behavior stated in the report's abstract ("medical units have to be automatically discharged if they fail to settle their balances"). No trigger name or firing condition (e.g., time-based, or discharge-attempt-based) is given in the report excerpt available.

**Practices (to apply once the trigger definition is available):**
- Create an admission with an associated `invoices.status = 'Pending'` and confirm the trigger's stated condition correctly transitions the admission (`discharge_date` set, bed released) without manual intervention.
- Confirm the trigger does not fire for admissions with `invoices.status = 'Paid'`.
- Test the trigger's behavior inside a transaction that is later rolled back — the side effect must roll back too.
- **This section is a template pending the trigger's SQL definition; do not assume a specific column or timing beyond what the abstract states.**

---

## 8. Stored Procedure Testing

**Scope:** The discharge procedure that "calculates the length of stay and billing costs, including room types, doctor's fees, and medication usage" (per the report's abstract). Name/signature not given in the report excerpt available.

**Practices (template pending the procedure's SQL definition):**
- Call the procedure with a valid `admission_id` and confirm: `admissions.discharge_date` is set, length of stay is computed correctly from `admission_date` to `discharge_date`, and an `invoices` row is created with `room_charge` = `rooms_beds.daily_rate × length of stay`, `doctor_charge` reflecting `doctors.fee`, and `pharmacy_charge` reflecting the sum of `prescription_items.quantity × medications.unit_price` for that admission.
- Test edge cases: an admission with no prescriptions (pharmacy_charge should be 0, matching the column's `DEFAULT 0`), a same-day discharge (length of stay boundary), and an already-discharged admission (should not double-bill).
- Confirm the procedure is transactional — any failure partway through leaves no partial invoice or discharge state.

---

## 9. Transaction Testing

**Scope:** Multi-statement operations that must succeed or fail as a unit.

**Practices:**
- **Discharge + billing:** simulate a failure after `admissions.discharge_date` is set but before the `invoices` row is written; confirm the whole operation rolls back (admission remains "active", no partial invoice).
- **Prescription + stock decrement:** simulate a failure after the `prescription_items` insert but before `medications.stock_qty` is decremented; confirm rollback leaves neither row committed.
- **Admission + bed status change:** simulate a failure after the `admissions` insert but before `rooms_beds.status` is updated to `'Occupied'`; confirm rollback.

---

## 10. API / Data Access Testing

**Scope:** The `@supabase/supabase-js` data-access layer.

**Practices:**
- Test that each data-access function issues the expected query against the expected table with expected filters (mock the client, assert on call args).
- Test that a Supabase error response (e.g., constraint violation) is converted to a typed result/error the UI can safely branch on.
- If Supabase Row Level Security (RLS) policies are configured, test data access under different simulated roles.

---

## 11. End-to-End Testing

**Tooling:** Playwright or Cypress, against an isolated Supabase test project.

**Suggested scenarios:**
- Create a department → create a doctor in it → book an appointment → confirm it appears correctly and a duplicate booking attempt is rejected.
- Admit a patient to a specific bed → confirm bed status becomes `'Occupied'` → prescribe medication → discharge → confirm invoice totals (room/doctor/pharmacy) and bed status returning to `'Vacant'`.
- Delete a department that has a head doctor and confirm the doctor record persists with `dept_id` (or `head_doctor_id` reference) nulled, not deleted.

---

## 12. Error Handling Testing

- For each constraint in §6, confirm the UI surfaces a clear message (e.g., "This time slot is already booked for this doctor" for `uq_doctor_slot` violations; "Fee must be greater than 0" for the `fee` CHECK).
- Test Supabase network/timeout failures degrade gracefully (retry option, clear error banner) rather than an indefinite loading state.

---

## 13. Security Testing

- Verify Supabase RLS policies (if configured) correctly restrict row access by role.
- Verify only the anon/public Supabase key is present in the frontend bundle; no service-role key exposed client-side.
- Verify all queries go through `supabase-js`'s parameterized query builder rather than raw string-concatenated SQL/RPC calls, to avoid injection risk.
- Verify sensitive operations (deleting a patient, issuing an invoice) are gated behind appropriate authorization, to the extent roles are defined in the system.

---

## 14. Performance Testing

- Verify the nine indexes shown in the report (`idx_doctors_dept`, `idx_admissions_patient`, `idx_admissions_bed`, `idx_admissions_doctor`, `idx_admissions_active`, `idx_appointments_doctor`, `idx_appointments_patient`, `idx_prescription_admission`, `idx_invoices_admission`) are actually used (via `EXPLAIN ANALYZE`) by the queries they were designed for — especially `idx_admissions_active` for "currently occupied beds" lookups and `idx_appointments_doctor` for per-doctor schedule queries.
- Load-test high-contention operations: concurrent appointment booking for the same slot, and concurrent prescription issuance against the same medication.
- Measure response times for list views (patient list, appointment calendar, low-stock report) as seeded data volume grows.

---

## ACID Testing

- **Atomicity:** Discharge/billing and prescription/stock-decrement operations either complete fully or leave no partial trace. Inject a failure into the second step of each and confirm rollback of the first.
- **Consistency:** Attempting an operation that would violate a CHECK/FK/UNIQUE constraint mid-transaction rolls back the entire transaction, leaving prior state untouched.
- **Isolation:** Run two transactions concurrently against the same row(s) (e.g., two discharges of admissions sharing a bed's status update, or two prescriptions against the same medication) under PostgreSQL's default `READ COMMITTED`, and confirm neither observes the other's uncommitted intermediate state.
- **Durability:** Once a discharge/invoice or appointment-booking transaction commits, confirm its effects survive a subsequent connection drop or process restart — this is generally guaranteed by PostgreSQL/Supabase; the check here is that the application only reports success after a genuine commit acknowledgment.

---

## Concurrency Testing

### Appointment Booking Concurrency
**Risk:** Two users simultaneously book the same doctor for the same `appt_date` + `time_slot`.
**Test approach:** Fire concurrent INSERTs with identical `(doctor_id, appt_date, time_slot)`. Expected: `uq_doctor_slot` guarantees exactly one succeeds; all others fail with `23505`, regardless of timing — verify under repeated rapid-fire concurrent attempts (e.g., 10–50 simultaneous attempts), and confirm the UI interprets the failure as "slot no longer available."

### Inventory (Medication Stock) Concurrency
**Risk:** Two concurrent prescriptions against the same `med_id` cause a lost update if implemented as a naive read-then-write.
**Test approach:** Seed a known `stock_qty`; fire two (or more) concurrent prescription-issuance operations against the same medication. Expected: final `stock_qty` reflects all decrements (e.g., start 100, two concurrent prescriptions of 10 units each → final 80, not 90). If a lost update occurs, the decrement should be rewritten as an atomic `UPDATE medications SET stock_qty = stock_qty - :qty WHERE med_id = :id AND stock_qty >= :qty` (or use `SELECT ... FOR UPDATE`) rather than a split read-modify-write. Also test the boundary case where concurrent prescriptions would together exceed available stock — confirm `CHECK (stock_qty >= 0)` correctly rejects the overdraft rather than allowing negative stock.

---

## Test Case Catalog

Pass/Fail is left blank — these are cases to execute, not recorded results.

| Test ID | Feature | Precondition | Input | Expected Result | Database Behavior | Pass/Fail |
|---|---|---|---|---|---|---|
| TC-01 | Patient creation | None | Valid `first_name`, `last_name` (optional `dob`, `gender`, `blood_group`, `contact`) | Patient created | New row in `patients`; `patient_id` auto-generated via `SERIAL` | ☐ |
| TC-02 | Doctor creation | A department exists (optional — `dept_id` is nullable) | Valid `first_name`, `last_name`, `fee > 0`, existing `dept_id` | Doctor created and linked to department | New row in `doctors`; `dept_id` FK satisfied | ☐ |
| TC-03 | Department creation | None | Valid `dept_name`, `floor` | Department created | New row in `departments`; `head_doctor_id` NULL by default | ☐ |
| TC-04 | Appointment creation | Patient and doctor exist | Valid `patient_id`, `doctor_id`, `appt_date`, `time_slot` | Appointment booked with `status = 'Scheduled'` | New row in `appointments`; `uq_doctor_slot` not violated | ☐ |
| TC-05 | Duplicate appointment prevention | An appointment exists for a given `doctor_id` + `appt_date` + `time_slot` | Same `doctor_id` + `appt_date` + `time_slot` submitted again | Booking rejected with a clear conflict message | INSERT fails: unique violation (`23505`) on `uq_doctor_slot` | ☐ |
| TC-06 | Admission | Patient, doctor, and a `'Vacant'` bed exist | `patient_id`, `bed_id`, `doctor_id` | Admission created; bed becomes unavailable | New row in `admissions` (`admission_date` defaults to `NOW()`, `discharge_date` NULL); `rooms_beds.status` transitions per discharge/admission workflow | ☐ |
| TC-07 | Bed allocation | A bed with `status = 'Vacant'` exists | Allocate that bed via a new admission | Bed status becomes `'Occupied'` | `rooms_beds.status` updated from `'Vacant'` to `'Occupied'` | ☐ |
| TC-08 | Prescription creation | An active admission and a medication with `stock_qty >= quantity` exist | `admission_id`, `med_id`, `quantity > 0` | Prescription item created | New row in `prescription_items`; associated stock decrement (BR-PR02) | ☐ |
| TC-09 | Medication stock update | A medication exists with known `stock_qty` | A prescription is issued for that medication | `stock_qty` decreases by the prescribed quantity | `medications.stock_qty` updated atomically with the prescription insert | ☐ |
| TC-10 | Low stock condition | `stock_qty` above `min_threshold` (default 15) | `stock_qty` decremented (via prescription) to at or below `min_threshold` | Medication is surfaced in the low-stock view/report | `stock_qty <= min_threshold` becomes true | ☐ |
| TC-11 | Discharge | Patient currently admitted (`discharge_date IS NULL`) | Discharge action submitted | `discharge_date` set; length of stay computed; bed released | `admissions.discharge_date` updated; `rooms_beds.status` reverts to `'Vacant'` (or `'Sanitizing'`); length of stay = `discharge_date - admission_date` | ☐ |
| TC-12 | Billing | Admission has been discharged | Discharge procedure computes billing | `room_charge`, `doctor_charge`, `pharmacy_charge` computed correctly | `room_charge = daily_rate × length of stay`; `doctor_charge` from `doctors.fee`; `pharmacy_charge` = Σ(`quantity × unit_price`) over that admission's `prescription_items` | ☐ |
| TC-13 | Invoice generation | Billing calculated for a discharged admission | Discharge procedure generates invoice | Invoice created with correct `total_amount`, `status = 'Pending'` | New row in `invoices`; `admission_id` FK satisfied; `total_amount = room_charge + doctor_charge + pharmacy_charge` | ☐ |
| TC-14 | Foreign key violation | None | Insert a `doctors` row with a non-existent `dept_id` | Insert rejected | Foreign-key violation `23503`; no row inserted | ☐ |
| TC-15 | Invalid fee | None | Insert a doctor with `fee = 0` or negative, or a bed with `daily_rate <= 0` | Operation rejected | CHECK violation `23514` on `fee > 0` / `daily_rate > 0`; no row inserted | ☐ |
| TC-16 | Invalid stock quantity | A medication exists | Update `stock_qty` to a negative value (directly or via over-decrement) | Operation rejected | CHECK violation `23514` on `stock_qty >= 0`; stock remains at prior valid value | ☐ |
| TC-17 | Invalid status | An appointment, bed, or invoice record exists | Set `status` to a value outside its defined set (e.g., appointment `'InProgress'`, bed `'Reserved'`, invoice `'Overdue'`) | Operation rejected | CHECK violation `23514`; status unchanged | ☐ |
| TC-18 | Cascading delete | A patient with at least one admission (and that admission has prescription items and an invoice) exists | Delete the patient | Patient, their admissions, prescription items, and invoices are all removed | `ON DELETE CASCADE` propagates from `admissions.patient_id` through `prescription_items.admission_id` and `invoices.admission_id` | ☐ |
| TC-19 | SET NULL behavior | A department has `head_doctor_id` set to an existing doctor | Delete that doctor | Department row persists; `head_doctor_id` becomes NULL | `fk_head_doctor ... ON DELETE SET NULL` clears the reference without deleting `departments` row | ☐ |
| TC-19b | SET NULL behavior (doctor↔department) | A doctor has `dept_id` set to an existing department | Delete that department | Doctor row persists; `dept_id` becomes NULL | `doctors.dept_id ... ON DELETE SET NULL` clears the reference without deleting the `doctors` row | ☐ |

---

## Recommended Execution Order

1. Database/constraint/trigger/procedure tests against a clean test database (foundation for everything else).
2. Unit tests for pure logic.
3. Component tests for UI building blocks.
4. Integration tests (component + Supabase client).
5. End-to-end tests for full workflows (run least frequently, e.g., on merge to main).
6. Concurrency and performance tests periodically (e.g., before releases).
