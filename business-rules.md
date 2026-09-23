# Business Rules — Hospital Management System

> Extracted from the project report "Hospital Management System" (BCSE302P — Database Systems Project Work Report, VIT), including its abstract, scope, and the actual `CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` statements shown in the report. Rule mechanisms (constraint, trigger, procedure) are stated exactly as the report states them. Where the report describes a behavior (e.g., "automatic discharge for unsettled balances", the discharge billing procedure, the ward/physician view) without giving the trigger/procedure/view a name, this is marked **"documented behavior — name not given in report."**

---

## Legend

| Type | Meaning |
|---|---|
| **Constraint-based** | Enforced by a PostgreSQL PK/FK/UNIQUE/CHECK constraint shown in the report's SQL |
| **Trigger-based** | Enforced by a database trigger (per report abstract; specific trigger name/definition not shown) |
| **Stored-procedure-based** | Executed via a stored procedure (per report abstract; specific procedure name/definition not shown) |
| **Application-level** | Enforced in the React/TypeScript frontend, not the database |
| **Documented behavior — name not given in report** | The report states the behavior exists but does not show the implementing object's name or code |

---

## 1. Department Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-D01 | Every department has a unique `dept_id`, a name, and a floor. | `departments` | Constraint-based (`dept_id SERIAL PRIMARY KEY`, `dept_name`/`floor` `NOT NULL`) | `dept_id=1, dept_name='Cardiology', floor=3` | Establishes department as a base entity for organizing doctors and wards. |
| BR-D02 | A department may designate a head doctor via `head_doctor_id`, added as a foreign key to `doctors(doctor_id)` after both tables exist. | `departments`, `doctors` | Constraint-based (`ALTER TABLE departments ADD CONSTRAINT fk_head_doctor FOREIGN KEY (head_doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL`) | Cardiology's `head_doctor_id` is set to `doctor_id = 7`. | Tracks departmental leadership while keeping the schema creatable (doctors table depends on departments, so the head-doctor FK is added afterward). |
| BR-D03 | If the doctor referenced as a department's head doctor is deleted, the department is **not** deleted — only the reference is cleared. | `departments`, `doctors` | Constraint-based (`ON DELETE SET NULL` on `fk_head_doctor`) | Deleting `doctor_id = 7` sets `departments.head_doctor_id` to `NULL` for the department they headed. | Preserves the department record independent of staffing changes (SET NULL test case). |

---

## 2. Doctor Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-DOC01 | Every doctor may be linked to a department via `dept_id`. | `doctors`, `departments` | Constraint-based (`dept_id INT REFERENCES departments(dept_id) ON DELETE SET NULL`) | A doctor's `dept_id` references an existing department. | Associates doctors with organizational units. |
| BR-DOC02 | If a doctor's department is deleted, the doctor record is preserved and `dept_id` is set to NULL rather than the doctor being deleted. | `doctors`, `departments` | Constraint-based (`ON DELETE SET NULL`) | Deleting the Cardiology department sets `dept_id = NULL` for all doctors who belonged to it. | Doctor profiles are independent entities that should outlive a department reorganization (SET NULL test case). |
| BR-DOC03 | A doctor's consultation fee must be strictly greater than 0. | `doctors` | Constraint-based (`fee NUMERIC(10,2) CHECK (fee > 0)`) | Inserting a doctor with `fee = 0` or `fee = -50` fails. | Prevents invalid/free consultation fee data (Invalid Fee test case). |
| BR-DOC04 | A doctor requires a first name and last name. | `doctors` | Constraint-based (`NOT NULL`) | Omitting `first_name` fails the insert. | Basic identity completeness. |

---

## 3. Patient Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-P01 | A patient record requires a first name and last name; date of birth, gender, blood group, and contact are optional/free-form fields. | `patients` | Constraint-based (`NOT NULL` on names only) | A patient with only `first_name`/`last_name` set is valid. | Minimal mandatory identity data; demographic fields are supplementary. |
| BR-P02 | Patients have no outbound foreign keys — a patient is the independent root of the clinical relationships (appointments, admissions). | `patients` | Constraint-based (schema shows `Foreign Keys: None` for `patients`) | The `patients` table stores demographic data only, with `appointments` and `admissions` referencing it. | Patients are a standalone entity per the report's table/constraint summary. |
| BR-P03 | If a patient record is deleted, all of that patient's admissions are deleted as well (and, transitively, prescription items and invoices tied to those admissions). | `patients`, `admissions`, `prescription_items`, `invoices` | Constraint-based (`admissions.patient_id ... ON DELETE CASCADE`, cascading further via `prescription_items.admission_id ... ON DELETE CASCADE` and `invoices.admission_id ... ON DELETE CASCADE`) | Deleting a patient removes their admission history, prescriptions, and invoices. | Admission/clinical/billing records have no meaning without the patient they belong to (Cascading Delete test case). |
| BR-P04 | If a patient record is deleted, all of that patient's appointments are deleted as well. | `patients`, `appointments` | Constraint-based (`appointments.patient_id ... ON DELETE CASCADE`) | Deleting a patient removes their scheduled/past appointments. | Appointments have no meaning without the patient. |

---

## 4. Appointment Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-A01 | A doctor cannot be double-booked: no two appointments may share the same `doctor_id`, `appt_date`, and `time_slot`. | `appointments` | **Constraint-based** — `CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appt_date, time_slot)` | Booking Dr. X for 2026-10-01 at "10:00 AM" twice fails on the second attempt. | Database-level prevention of outpatient scheduling conflicts, as stated in the project scope (Duplicate Appointment Prevention test case). |
| BR-A02 | An appointment must reference an existing patient and doctor. | `appointments`, `patients`, `doctors` | Constraint-based (`patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE`, `doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE`) | An appointment with a non-existent `doctor_id` is rejected. | Referential integrity for scheduling data (Foreign Key Violation test case). |
| BR-A03 | Appointment status must be one of `'Scheduled'`, `'Completed'`, or `'Cancelled'`, and defaults to `'Scheduled'`. | `appointments` | Constraint-based (`status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled','Completed','Cancelled'))`) | Setting `status = 'InProgress'` fails. | Restricts status to a controlled vocabulary (Invalid Status test case). |
| BR-A04 | If either the referenced patient or doctor is deleted, the appointment is deleted (not orphaned or preserved with a NULL reference). | `appointments` | Constraint-based (`ON DELETE CASCADE` on both `patient_id` and `doctor_id`) | Deleting a doctor removes all of their appointment rows. | Appointments are dependent records with no standalone meaning. |

---

## 5. Bed Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-B01 | Every bed has a room number, a ward type, a daily rate, and a status; it has no foreign keys of its own. | `rooms_beds` | Constraint-based (column definitions; `Foreign Keys: None` per report) | `room_no='204A', ward_type='ICU', daily_rate=4500.00, status='Vacant'` | Beds are a standalone resource entity referenced by admissions. |
| BR-B02 | Ward type must be one of `'ICU'`, `'General'`, or `'Private'`. | `rooms_beds` | Constraint-based (`ward_type VARCHAR(20) NOT NULL CHECK (ward_type IN ('ICU', 'General', 'Private'))`) | Setting `ward_type = 'VIP'` fails. | Matches the report's stated ward types for the Inpatient & Bed Management module. |
| BR-B03 | Daily rate must be strictly greater than 0. | `rooms_beds` | Constraint-based (`daily_rate NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0)`) | Inserting `daily_rate = -100` fails. | Prevents invalid billing inputs at the source (Invalid Fee test case). |
| BR-B04 | Bed status must be one of `'Vacant'`, `'Occupied'`, or `'Sanitizing'`, and defaults to `'Vacant'`. | `rooms_beds` | Constraint-based (`status VARCHAR(20) NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Vacant', 'Occupied', 'Sanitizing'))`) | Setting `status = 'Reserved'` fails. | Controlled vocabulary for bed lifecycle state (Invalid Status test case). |

---

## 6. Admission Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-AD01 | An admission requires an existing patient, bed, and doctor. | `admissions`, `patients`, `rooms_beds`, `doctors` | Constraint-based (`patient_id ... REFERENCES patients(patient_id) ON DELETE CASCADE`, `bed_id ... REFERENCES rooms_beds(bed_id)`, `doctor_id ... REFERENCES doctors(doctor_id)`, all `NOT NULL`) | An admission row references all three real entities. | Models the real-world relationship of an inpatient stay. |
| BR-AD02 | `admission_date` defaults to the current timestamp; `discharge_date` is NULL until the patient is discharged. | `admissions` | Constraint-based (`admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW()`, `discharge_date TIMESTAMPTZ` nullable) | A newly created admission has `discharge_date = NULL`. | Distinguishes active admissions from completed ones; supports the partial index `idx_admissions_active` (`WHERE discharge_date IS NULL`). |
| BR-AD03 | Deleting a bed or doctor referenced by an existing admission is restricted (no `ON DELETE` clause is specified for `bed_id`/`doctor_id`, so PostgreSQL's default `NO ACTION` applies). | `admissions`, `rooms_beds`, `doctors` | Constraint-based (default `ON DELETE NO ACTION` on `admissions.bed_id` and `admissions.doctor_id`) | Attempting to delete a bed that is currently referenced by an admission fails until the admission is removed/reassigned. | Prevents silently orphaning or destroying active admission linkage to a physical bed or attending doctor. |
| BR-AD04 | Upon patient discharge, a stored procedure calculates the length of stay and the associated billing costs (room, doctor's fee, and medication usage) for the stay. | `admissions`, `rooms_beds`, `doctors`, `prescription_items`, `medications`, `invoices` | **Stored-procedure-based** — name/definition not given in report (report states: *"a special procedure was created that, upon a patient's discharge, calculates the length of stay and billing costs, including room types, doctor's fees, and medication usage"*) | Discharging a patient triggers computation of `room_charge`, `doctor_charge`, `pharmacy_charge`, and `total_amount` for the resulting invoice. | Automates and standardizes billing derived from an inpatient stay, per the Automated Billing module. |
| BR-AD05 | Inpatients who fail to settle their balance are automatically discharged. | `admissions`, `invoices` | **Trigger-based** — name/definition not given in report (report abstract: *"medical units have to be automatically discharged if they fail to settle their balances"*) | An admission with an unpaid invoice past its expected settlement point is automatically closed out by the system. | Prevents indefinite occupation of hospital resources by unresolved billing (business rule stated in the abstract; exact triggering condition/timing not detailed in the report). |

---

## 7. Medication Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-M01 | Every medication has a name, a unit price, a stock quantity, and a minimum threshold (defaulting to 15). | `medications` | Constraint-based (column definitions; `min_threshold INT NOT NULL DEFAULT 15`) | `med_name='Paracetamol 500mg', unit_price=2.50, stock_qty=200, min_threshold=15` | Enables stock tracking and low-stock detection per the Pharmacy & Inventory module. |
| BR-M02 | Unit price must be strictly greater than 0. | `medications` | Constraint-based (`unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0)`) | Inserting `unit_price = 0` fails. | Prevents invalid pricing data (Invalid Fee test case). |
| BR-M03 | Stock quantity must never be negative. | `medications` | Constraint-based (`stock_qty INT NOT NULL CHECK (stock_qty >= 0)`) | An update that would drive `stock_qty` below 0 fails. | Prevents impossible inventory states (Invalid Stock Quantity test case). |
| BR-M04 | A medication is considered low on stock when `stock_qty` falls at or below `min_threshold`. | `medications` | Documented behavior — name not given in report (mechanism, e.g. view/query vs. trigger flag, not specified; report states inventory supports "minimum stock threshold management") | `stock_qty = 10`, `min_threshold = 15` → flagged low stock. | Supports proactive restocking decisions (Low Stock Condition test case). |

---

## 8. Prescription Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-PR01 | A prescription item connects an admission with a medication and requires a positive quantity. | `prescription_items`, `admissions`, `medications` | Constraint-based (`admission_id ... REFERENCES admissions(admission_id) ON DELETE CASCADE`, `med_id ... REFERENCES medications(med_id)`, `quantity INT NOT NULL CHECK (quantity > 0)`) | A prescription item with `quantity = 0` fails; a valid item references a real admission and medication. | Ties dispensed medication to a specific inpatient stay (Prescription Creation, Invalid Stock Quantity test cases). |
| BR-PR02 | Issuing a prescription decrements the corresponding medication's stock quantity ("inventory decrement upon prescription issuance"). | `prescription_items`, `medications` | Trigger-based or stored-procedure-based — exact mechanism/name not given in report (stated in Project Scope: *"inventory decrement upon prescription issuance"*) | Prescribing 10 units of a medication decreases `medications.stock_qty` by 10. | Keeps inventory synchronized with dispensation (Medication Stock Update test case). |
| BR-PR03 | If the parent admission is deleted, its prescription items are deleted as well. | `prescription_items`, `admissions` | Constraint-based (`admission_id ... ON DELETE CASCADE`) | Deleting an admission removes all associated `prescription_items` rows. | Prescription items have no meaning without their admission (Cascading Delete test case). |
| BR-PR04 | Deleting a medication that is referenced by existing prescription items is restricted (no `ON DELETE` clause specified for `med_id`, so `NO ACTION` applies). | `prescription_items`, `medications` | Constraint-based (default `ON DELETE NO ACTION`) | Attempting to delete a medication still referenced by a prescription item fails. | Preserves historical prescription records' link to the medication actually dispensed. |

---

## 9. Inventory Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-I01 | Inventory (`medications.stock_qty`) is adjusted as part of prescription issuance (see BR-PR02). | `medications`, `prescription_items` | Trigger-based or stored-procedure-based — exact mechanism/name not given in report | See BR-PR02. | Same rule, viewed from the inventory-management side of the Pharmacy & Inventory module. |
| BR-I02 | Stock quantity can never be reduced below zero, even under concurrent prescription issuance. | `medications` | Constraint-based (`CHECK (stock_qty >= 0)`), combined with correct transactional handling of the decrement operation | Two concurrent prescriptions that would together exceed available stock: the operation that would drive `stock_qty` negative is rejected. | Preserves inventory accuracy under concurrent access — see Concurrency Testing in `testing.md`. |

---

## 10. Billing Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-BI01 | An invoice requires an existing admission, and is deleted automatically if that admission is deleted. | `invoices`, `admissions` | Constraint-based (`admission_id INT NOT NULL REFERENCES admissions(admission_id) ON DELETE CASCADE`) | Deleting an admission removes its invoice. | An invoice has no meaning without the admission it bills (Cascading Delete test case). |
| BR-BI02 | An invoice aggregates room charge, doctor charge, and pharmacy (medication) charge into a total amount. | `invoices` | Constraint-based (columns `room_charge`, `doctor_charge`, `pharmacy_charge`, `total_amount`, each `NUMERIC(10,2) NOT NULL DEFAULT 0`); computed by the discharge stored procedure (BR-AD04) | `room_charge=13500.00 (3 days × 4500), doctor_charge=800.00, pharmacy_charge=125.00, total_amount=14425.00` | Produces a consolidated invoice upon discharge, per the Automated Billing module. |
| BR-BI03 | Invoice status must be `'Pending'` or `'Paid'`, defaulting to `'Pending'`. | `invoices` | Constraint-based (`status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid'))`) | Setting `status = 'Overdue'` fails. | Controlled vocabulary for invoice lifecycle (Invalid Status test case). |
| BR-BI04 | Every invoice records its creation timestamp. | `invoices` | Constraint-based (`created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()`) | An invoice's `created_at` is set automatically at insert time. | Supports auditing/reporting of billing events. |

---

## 11. Referential Integrity Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-R01 | `ON DELETE CASCADE` is used wherever the child record is meaningless without its parent: `admissions.patient_id`, `appointments.patient_id`, `appointments.doctor_id`, `prescription_items.admission_id`, `invoices.admission_id`. | `admissions`, `appointments`, `prescription_items`, `invoices` | Constraint-based | Deleting a patient cascades to delete their admissions and appointments; deleting an admission cascades to delete its prescription items and invoice. | As the report states: *"Deleting a dependent entity record automatically deletes child records (e.g., deleting an admission removes invoices/prescriptions)."* |
| BR-R02 | `ON DELETE SET NULL` is used wherever the referencing entity should persist independently: `doctors.dept_id`, `departments.head_doctor_id`. | `doctors`, `departments` | Constraint-based | Deleting a department sets `dept_id = NULL` for its doctors rather than deleting them; deleting a doctor sets `head_doctor_id = NULL` on the department they headed. | As the report states: *"Deleting an independent entity record preserves referenced entities by NULLifying foreign keys (e.g., deleting a department retains the doctor profile but sets their dept_id to NULL)."* |
| BR-R03 | `admissions.bed_id`, `admissions.doctor_id`, and `prescription_items.med_id` have no `ON DELETE` clause, so PostgreSQL's default `NO ACTION` (effectively restrict) applies. | `admissions`, `prescription_items`, `rooms_beds`, `doctors`, `medications` | Constraint-based | Deleting a bed, doctor, or medication currently referenced by an admission/prescription item fails. | Prevents silently breaking active operational links (not explicitly discussed in the report's prose, but follows directly from the SQL shown, which specifies no cascade/null behavior for these three FKs). |
| BR-R04 | All foreign keys reference existing rows at all times; violations are rejected outright. | All FK relationships listed above | Constraint-based | Any INSERT/UPDATE creating a dangling reference is rejected with a foreign-key-violation error (Foreign Key Violation test case). | Baseline relational integrity, explicitly named "Referential Integrity (3NF)" in the report. |
| BR-R05 | CHECK constraints enforce numerical and status validity across the schema. | `doctors` (`fee`), `rooms_beds` (`ward_type`, `daily_rate`, `status`), `appointments` (`status`), `medications` (`unit_price`, `stock_qty`), `prescription_items` (`quantity`), `invoices` (`status`) | Constraint-based | Negative fees, negative stock, and invalid status strings are all rejected. | As the report states: *"Domain/Check Constraints: Enforces numerical logic (e.g., fee > $0, stock_qty >= 0) and utilizes restricted vocabularies for status fields."* |
| BR-R06 | The composite `UNIQUE (doctor_id, appt_date, time_slot)` constraint (`uq_doctor_slot`) prevents outpatient scheduling conflicts at the database level. | `appointments` | Constraint-based | See BR-A01. | As the report states: *"A composite UNIQUE (doctor_id, appt_date, time_slot) prevents outpatient scheduling conflicts at a database level."* |

---

## 12. Transaction Rules

| BR-ID | Rule | Affected Tables | Classification | Example | Reason |
|---|---|---|---|---|---|
| BR-T01 | The discharge process (length-of-stay + billing calculation + invoice creation) is executed as a single logical unit consistent with ACID principles. | `admissions`, `invoices`, `rooms_beds`, `doctors`, `prescription_items`, `medications` | Documented behavior — implementation detail not shown, but the report explicitly states the project "was consistent with the objectives of DBMS, including following ACID principles, implementing constraints, triggers, and transactions." | If invoice creation fails after discharge_date is set, the operation should not leave the admission "discharged" without a corresponding invoice. | Prevents inconsistent partial states across the billing workflow. |
| BR-T02 | Prescription issuance (inserting the `prescription_items` row and decrementing `medications.stock_qty`) should be executed as a single atomic transaction. | `prescription_items`, `medications` | Documented behavior — implementation detail not shown | If the stock decrement fails (e.g., insufficient stock per the `stock_qty >= 0` CHECK), the prescription item insert should also not persist. | Prevents a prescription record existing without a corresponding inventory adjustment. |
| BR-T03 | The system relies on PostgreSQL's ACID properties (Atomicity, Consistency, Isolation, Durability) for all state-changing operations. | All tables | Documented behavior (platform-level guarantee of PostgreSQL, explicitly cited as a project objective in the abstract) | A failed appointment booking transaction leaves no partial appointment row behind. | Ensures data correctness under failure or concurrent access. |

---

## Supporting Database Objects Mentioned in the Report (Not Fully Detailed)

- **Decision-support view(s):** The report states the database "can also support decision-making processes by providing decision-makers with a view that contains day rates and physician lists for wards," and that "the views are partially indexed using B-trees." No view name or exact column list is given in the report excerpt available.
- **Indexes actually shown in the report:**
  - `idx_doctors_dept` on `doctors(dept_id)`
  - `idx_admissions_patient` on `admissions(patient_id)`
  - `idx_admissions_bed` on `admissions(bed_id)`
  - `idx_admissions_doctor` on `admissions(doctor_id)`
  - `idx_admissions_active` on `admissions(bed_id) WHERE discharge_date IS NULL` (partial index)
  - `idx_appointments_doctor` on `appointments(doctor_id, appt_date)`
  - `idx_appointments_patient` on `appointments(patient_id)`
  - `idx_prescription_admission` on `prescription_items(admission_id)`
  - `idx_invoices_admission` on `invoices(admission_id)`
- **Triggers and stored procedures:** The report's abstract confirms the use of triggers (auto-discharge on unsettled balance) and a stored procedure (discharge → length of stay + billing calculation), but does not include their SQL definitions in the excerpt available. These should be added verbatim to this document once the definitions are available.
