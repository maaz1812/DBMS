# Database Query Reference — Hospital Management System

> Built from the schema shown in the project report (BCSE302P — Database Systems Project Work Report). All column names below are taken directly from the report's `CREATE TABLE` statements. Where a query would require a column not present in the documented schema, this is called out explicitly rather than inventing a name.

**Schema:**

```
departments(dept_id PK, dept_name, floor, head_doctor_id FK -> doctors.doctor_id [SET NULL])
doctors(doctor_id PK, dept_id FK -> departments.dept_id [SET NULL], first_name, last_name, specialization, fee, phone)
patients(patient_id PK, first_name, last_name, dob, gender, blood_group, contact)
rooms_beds(bed_id PK, room_no, ward_type, daily_rate, status)
admissions(admission_id PK, patient_id FK -> patients [CASCADE], bed_id FK -> rooms_beds, doctor_id FK -> doctors, admission_date, discharge_date, notes)
appointments(appointment_id PK, patient_id FK -> patients [CASCADE], doctor_id FK -> doctors [CASCADE], appt_date, time_slot, status)
medications(med_id PK, med_name, unit_price, stock_qty, min_threshold)
prescription_items(item_id PK, admission_id FK -> admissions [CASCADE], med_id FK -> medications, quantity, dosage_instructions)
invoices(invoice_id PK, admission_id FK -> admissions [CASCADE], room_charge, doctor_charge, pharmacy_charge, total_amount, status, created_at)
```

All statements are PostgreSQL-compatible.

---

## 1. Basic SELECT

```sql
SELECT * FROM patients;

SELECT doctor_id, first_name, last_name, specialization, fee
FROM doctors;
```

---

## 2. INSERT

```sql
INSERT INTO departments (dept_name, floor)
VALUES ('Cardiology', 3);

INSERT INTO doctors (dept_id, first_name, last_name, specialization, fee, phone)
VALUES (1, 'Anita', 'Rao', 'Cardiologist', 1200.00, '9876543210');

INSERT INTO patients (first_name, last_name, dob, gender, blood_group, contact)
VALUES ('Ravi', 'Kumar', '1990-05-14', 'Male', 'O+', '9123456780');
```

---

## 3. UPDATE

```sql
-- Update a doctor's consultation fee
UPDATE doctors
SET fee = 1500.00
WHERE doctor_id = 1;

-- Mark a bed as under sanitation after discharge
UPDATE rooms_beds
SET status = 'Sanitizing'
WHERE bed_id = 12;

-- Mark an invoice as paid
UPDATE invoices
SET status = 'Paid'
WHERE invoice_id = 45;
```

---

## 4. DELETE

```sql
-- Delete an appointment (patient/doctor references intact)
DELETE FROM appointments
WHERE appointment_id = 30;

-- Delete a patient (cascades to admissions, prescription_items, invoices, appointments)
DELETE FROM patients
WHERE patient_id = 7;
```

---

## 5. WHERE Filtering

```sql
-- Doctors in a given specialization
SELECT * FROM doctors
WHERE specialization = 'Cardiologist';

-- Appointments on a specific date
SELECT * FROM appointments
WHERE appt_date = '2026-10-01';

-- Vacant beds only
SELECT * FROM rooms_beds
WHERE status = 'Vacant';

-- Medications at or below their minimum threshold
SELECT * FROM medications
WHERE stock_qty <= min_threshold;
```

---

## 6. ORDER BY

```sql
-- Patients alphabetically
SELECT * FROM patients
ORDER BY last_name, first_name;

-- Upcoming appointments soonest first
SELECT * FROM appointments
ORDER BY appt_date, time_slot;

-- Most expensive beds first
SELECT * FROM rooms_beds
ORDER BY daily_rate DESC;
```

---

## 7. GROUP BY

```sql
-- Number of doctors per department
SELECT dept_id, COUNT(*) AS doctor_count
FROM doctors
GROUP BY dept_id;

-- Number of beds per ward type
SELECT ward_type, COUNT(*) AS bed_count
FROM rooms_beds
GROUP BY ward_type;

-- Total invoiced amount per status
SELECT status, COUNT(*) AS invoice_count, SUM(total_amount) AS total_billed
FROM invoices
GROUP BY status;
```

---

## 8. Aggregate Functions

```sql
-- Average consultation fee across all doctors
SELECT AVG(fee) AS avg_fee FROM doctors;

-- Highest daily rate among beds
SELECT MAX(daily_rate) AS max_daily_rate FROM rooms_beds;

-- Total stock across all medications
SELECT SUM(stock_qty) AS total_units_in_stock FROM medications;

-- Total revenue collected (paid invoices only)
SELECT SUM(total_amount) AS total_collected
FROM invoices
WHERE status = 'Paid';
```

---

## 9. INNER JOIN

```sql
-- Doctors with their department names
SELECT d.doctor_id, d.first_name, d.last_name, dp.dept_name
FROM doctors d
INNER JOIN departments dp ON d.dept_id = dp.dept_id;

-- Appointments with patient and doctor names
SELECT a.appointment_id, p.first_name AS patient_first, p.last_name AS patient_last,
       doc.first_name AS doctor_first, doc.last_name AS doctor_last,
       a.appt_date, a.time_slot, a.status
FROM appointments a
INNER JOIN patients p ON a.patient_id = p.patient_id
INNER JOIN doctors doc ON a.doctor_id = doc.doctor_id;
```

---

## 10. LEFT JOIN

```sql
-- All departments, including those with no head doctor assigned
SELECT dp.dept_id, dp.dept_name, dp.head_doctor_id, doc.first_name, doc.last_name
FROM departments dp
LEFT JOIN doctors doc ON dp.head_doctor_id = doc.doctor_id;

-- All beds, including ones never yet admitted-to
SELECT rb.bed_id, rb.room_no, rb.ward_type, ad.admission_id
FROM rooms_beds rb
LEFT JOIN admissions ad ON rb.bed_id = ad.bed_id;
```

---

## 11. Multi-Table Joins

```sql
-- Full admission detail: patient, doctor, bed, and invoice
SELECT
    ad.admission_id,
    p.first_name || ' ' || p.last_name AS patient_name,
    doc.first_name || ' ' || doc.last_name AS doctor_name,
    rb.room_no, rb.ward_type,
    ad.admission_date, ad.discharge_date,
    inv.total_amount, inv.status AS invoice_status
FROM admissions ad
JOIN patients p ON ad.patient_id = p.patient_id
JOIN doctors doc ON ad.doctor_id = doc.doctor_id
JOIN rooms_beds rb ON ad.bed_id = rb.bed_id
LEFT JOIN invoices inv ON inv.admission_id = ad.admission_id;
```

---

## 12. Appointment Availability

```sql
-- Check whether a specific doctor/date/time slot is already booked
SELECT EXISTS (
    SELECT 1 FROM appointments
    WHERE doctor_id = 1
      AND appt_date = '2026-10-01'
      AND time_slot = '10:00 AM'
) AS is_booked;

-- All booked slots for a doctor on a given date (to compute free slots in the application layer)
SELECT time_slot
FROM appointments
WHERE doctor_id = 1
  AND appt_date = '2026-10-01'
  AND status != 'Cancelled';
```

---

## 13. Doctor Schedules

```sql
-- A doctor's full upcoming schedule
SELECT a.appt_date, a.time_slot, a.status, p.first_name, p.last_name
FROM appointments a
JOIN patients p ON a.patient_id = p.patient_id
WHERE a.doctor_id = 1
  AND a.appt_date >= CURRENT_DATE
ORDER BY a.appt_date, a.time_slot;
```

---

## 14. Patient Admissions

```sql
-- A given patient's full admission history
SELECT admission_id, admission_date, discharge_date, bed_id, doctor_id, notes
FROM admissions
WHERE patient_id = 7
ORDER BY admission_date DESC;

-- Currently active admissions (not yet discharged)
SELECT * FROM admissions
WHERE discharge_date IS NULL;
```

---

## 15. Available Beds

```sql
-- All vacant beds, by ward type
SELECT bed_id, room_no, ward_type, daily_rate
FROM rooms_beds
WHERE status = 'Vacant'
ORDER BY ward_type, room_no;

-- Count of vacant beds per ward type
SELECT ward_type, COUNT(*) AS vacant_count
FROM rooms_beds
WHERE status = 'Vacant'
GROUP BY ward_type;
```

---

## 16. Medication Stock

```sql
-- Current stock and pricing for all medications
SELECT med_id, med_name, unit_price, stock_qty, min_threshold
FROM medications
ORDER BY med_name;

-- Stock level for one medication
SELECT stock_qty FROM medications WHERE med_id = 5;
```

---

## 17. Low-Stock Medications

```sql
SELECT med_id, med_name, stock_qty, min_threshold
FROM medications
WHERE stock_qty <= min_threshold
ORDER BY stock_qty ASC;
```

---

## 18. Prescription Information

```sql
-- All medications prescribed during a given admission
SELECT pi.item_id, m.med_name, pi.quantity, pi.dosage_instructions, m.unit_price,
       (pi.quantity * m.unit_price) AS line_cost
FROM prescription_items pi
JOIN medications m ON pi.med_id = m.med_id
WHERE pi.admission_id = 20;
```

---

## 19. Patient Billing

```sql
-- Billing summary for a specific patient across all their admissions
SELECT p.patient_id, p.first_name, p.last_name,
       inv.invoice_id, inv.room_charge, inv.doctor_charge, inv.pharmacy_charge,
       inv.total_amount, inv.status
FROM invoices inv
JOIN admissions ad ON inv.admission_id = ad.admission_id
JOIN patients p ON ad.patient_id = p.patient_id
WHERE p.patient_id = 7;
```

---

## 20. Invoice Totals

```sql
-- A single invoice's full breakdown
SELECT invoice_id, room_charge, doctor_charge, pharmacy_charge, total_amount, status, created_at
FROM invoices
WHERE invoice_id = 45;

-- Verify a stored total_amount matches the sum of its components (data-quality check)
SELECT invoice_id,
       (room_charge + doctor_charge + pharmacy_charge) AS computed_total,
       total_amount,
       (room_charge + doctor_charge + pharmacy_charge) = total_amount AS totals_match
FROM invoices;
```

---

## 21. Length of Stay

```sql
-- Length of stay (in days) for a discharged admission
SELECT admission_id,
       admission_date,
       discharge_date,
       EXTRACT(DAY FROM (discharge_date - admission_date)) AS length_of_stay_days
FROM admissions
WHERE admission_id = 20
  AND discharge_date IS NOT NULL;

-- Length of stay for all discharged admissions, used for room-charge calculation
SELECT ad.admission_id,
       rb.daily_rate,
       EXTRACT(DAY FROM (ad.discharge_date - ad.admission_date)) AS length_of_stay_days,
       rb.daily_rate * EXTRACT(DAY FROM (ad.discharge_date - ad.admission_date)) AS computed_room_charge
FROM admissions ad
JOIN rooms_beds rb ON ad.bed_id = rb.bed_id
WHERE ad.discharge_date IS NOT NULL;
```

---

## 22. Department / Doctor Information

```sql
-- Department roster with doctor count and head doctor name
SELECT dp.dept_id, dp.dept_name, dp.floor,
       hd.first_name || ' ' || hd.last_name AS head_doctor,
       COUNT(doc.doctor_id) AS doctor_count
FROM departments dp
LEFT JOIN doctors hd ON dp.head_doctor_id = hd.doctor_id
LEFT JOIN doctors doc ON doc.dept_id = dp.dept_id
GROUP BY dp.dept_id, dp.dept_name, dp.floor, hd.first_name, hd.last_name;
```

---

## 23. Index-Supported Queries

The report documents the following indexes. The queries below are the ones each index is designed to accelerate:

```sql
-- Uses idx_doctors_dept: doctors in a department
SELECT * FROM doctors WHERE dept_id = 1;

-- Uses idx_admissions_patient: a patient's admission history
SELECT * FROM admissions WHERE patient_id = 7;

-- Uses idx_admissions_bed: admission history for a specific bed
SELECT * FROM admissions WHERE bed_id = 12;

-- Uses idx_admissions_doctor: admissions attended by a specific doctor
SELECT * FROM admissions WHERE doctor_id = 1;

-- Uses idx_admissions_active (partial index WHERE discharge_date IS NULL): currently active admissions
SELECT * FROM admissions WHERE discharge_date IS NULL;

-- Uses idx_appointments_doctor (doctor_id, appt_date): a doctor's schedule for a date range
SELECT * FROM appointments WHERE doctor_id = 1 AND appt_date >= CURRENT_DATE;

-- Uses idx_appointments_patient: a patient's appointment history
SELECT * FROM appointments WHERE patient_id = 7;

-- Uses idx_prescription_admission: prescriptions for a given admission
SELECT * FROM prescription_items WHERE admission_id = 20;

-- Uses idx_invoices_admission: invoice for a given admission
SELECT * FROM invoices WHERE admission_id = 20;
```

---

## 24. Constraint Examples

```sql
-- Violates CHECK (fee > 0) -- rejected
INSERT INTO doctors (dept_id, first_name, last_name, fee)
VALUES (1, 'Test', 'Doctor', 0);

-- Violates CHECK (ward_type IN ('ICU','General','Private')) -- rejected
INSERT INTO rooms_beds (room_no, ward_type, daily_rate)
VALUES ('999', 'VIP', 5000);

-- Violates the composite UNIQUE (doctor_id, appt_date, time_slot) -- rejected on 2nd insert
INSERT INTO appointments (patient_id, doctor_id, appt_date, time_slot)
VALUES (7, 1, '2026-10-01', '10:00 AM');

INSERT INTO appointments (patient_id, doctor_id, appt_date, time_slot)
VALUES (8, 1, '2026-10-01', '10:00 AM');  -- fails: unique_violation (23505)

-- Violates CHECK (stock_qty >= 0) -- rejected
UPDATE medications SET stock_qty = stock_qty - 10000 WHERE med_id = 5;

-- Foreign key violation: dept_id does not exist -- rejected
INSERT INTO doctors (dept_id, first_name, last_name, fee)
VALUES (9999, 'Test', 'Doctor', 500);
```

---

## 25. Transaction Examples

```sql
-- Prescription issuance: insert prescription item and decrement stock atomically
BEGIN;

INSERT INTO prescription_items (admission_id, med_id, quantity, dosage_instructions)
VALUES (20, 5, 10, 'Twice daily after meals');

UPDATE medications
SET stock_qty = stock_qty - 10
WHERE med_id = 5
  AND stock_qty >= 10;   -- guards against overdraft under concurrency

COMMIT;
-- If the UPDATE affects 0 rows (insufficient stock), the application should
-- ROLLBACK instead of COMMIT to avoid a prescription with no valid stock deduction.
```

```sql
-- Discharge: set discharge_date and create the invoice atomically
BEGIN;

UPDATE admissions
SET discharge_date = NOW()
WHERE admission_id = 20
  AND discharge_date IS NULL;

INSERT INTO invoices (admission_id, room_charge, doctor_charge, pharmacy_charge, total_amount)
VALUES (
    20,
    4500.00 * 3,   -- daily_rate * length_of_stay, computed by the application or a stored procedure
    800.00,
    125.00,
    (4500.00 * 3) + 800.00 + 125.00
);

COMMIT;
```

> The exact stored procedure that the report says performs this discharge/billing calculation automatically is not included in the report excerpt available; the transaction above illustrates the equivalent manual statements based on the documented columns.

---

## SQL Concepts Demonstrated

| Concept | Where used |
|---|---|
| **Primary keys** | `SERIAL PRIMARY KEY` on every table's ID column |
| **Foreign keys** | `doctors.dept_id`, `departments.head_doctor_id`, `admissions.patient_id/bed_id/doctor_id`, `appointments.patient_id/doctor_id`, `prescription_items.admission_id/med_id`, `invoices.admission_id` |
| **UNIQUE** | `appointments` — `CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appt_date, time_slot)` |
| **CHECK** | `doctors.fee > 0`; `rooms_beds.ward_type IN (...)`, `daily_rate > 0`, `status IN (...)`; `appointments.status IN (...)`; `medications.unit_price > 0`, `stock_qty >= 0`; `prescription_items.quantity > 0`; `invoices.status IN (...)` |
| **ON DELETE CASCADE** | `admissions.patient_id`, `appointments.patient_id`, `appointments.doctor_id`, `prescription_items.admission_id`, `invoices.admission_id` |
| **ON DELETE SET NULL** | `doctors.dept_id`, `departments.head_doctor_id` |
| **Indexes** | The nine indexes listed in §23, including one partial index (`idx_admissions_active`) |
| **Transactions** | §25 above (prescription issuance, discharge/billing) |
| **Views** | The report states a decision-support view exists ("day rates and physician lists for wards"), partially indexed with B-trees, but its exact definition is not included in the report excerpt available — not reproduced here to avoid inventing column/view names |
| **Triggers** | The report's abstract states a trigger auto-discharges admissions with unsettled balances; exact trigger SQL not included in the report excerpt available |
| **Stored procedures** | The report's abstract states a procedure computes length of stay and billing on discharge; exact procedure SQL not included in the report excerpt available |

---

## Notes on Uncertain Items

- The exact SQL for the decision-support view, the auto-discharge trigger, and the discharge/billing stored procedure are referenced in the report's abstract but not shown in the report excerpt available. Queries in §25 illustrate the equivalent logic using only documented columns, rather than guessing at procedure/trigger/view names.
- Time-of-day arithmetic in §21 uses `discharge_date - admission_date` on `TIMESTAMPTZ` columns as documented; if greater precision (hours, not whole days) is needed, `EXTRACT(EPOCH FROM ...)` or `AGE()` can be substituted, but this is an implementation choice not specified in the report.
