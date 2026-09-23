-- Hospital Management System (HMS)
-- Database Schema as per dbmsreport.pdf

-- 1. Departments Table
CREATE TABLE departments (
  dept_id SERIAL PRIMARY KEY,
  dept_name VARCHAR(100) NOT NULL,
  floor INT NOT NULL,
  head_doctor_id INT
);

-- 2. Doctors Table
CREATE TABLE doctors (
  doctor_id SERIAL PRIMARY KEY,
  dept_id INT REFERENCES departments(dept_id) ON DELETE SET NULL,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  specialization VARCHAR(100),
  fee NUMERIC(10,2) CHECK (fee > 0),
  phone VARCHAR(20)
);

-- Foreign Key from Departments to Doctors
ALTER TABLE departments
  ADD CONSTRAINT fk_head_doctor
  FOREIGN KEY (head_doctor_id) REFERENCES doctors(doctor_id) ON DELETE SET NULL;

-- 3. Patients Table
CREATE TABLE patients (
  patient_id SERIAL PRIMARY KEY,
  first_name VARCHAR(50) NOT NULL,
  last_name VARCHAR(50) NOT NULL,
  dob DATE,
  gender VARCHAR(10),
  blood_group VARCHAR(5),
  contact VARCHAR(20)
);

-- 4. Rooms and Beds Table
CREATE TABLE rooms_beds (
  bed_id SERIAL PRIMARY KEY,
  room_no VARCHAR(10) NOT NULL,
  ward_type VARCHAR(20) NOT NULL CHECK (ward_type IN ('ICU', 'General', 'Private')),
  daily_rate NUMERIC(10,2) NOT NULL CHECK (daily_rate > 0),
  status VARCHAR(20) NOT NULL DEFAULT 'Vacant' CHECK (status IN ('Vacant', 'Occupied', 'Sanitizing'))
);

-- 5. Admissions Table
CREATE TABLE admissions (
  admission_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  bed_id INT NOT NULL REFERENCES rooms_beds(bed_id),
  doctor_id INT NOT NULL REFERENCES doctors(doctor_id),
  admission_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  discharge_date TIMESTAMPTZ,
  notes TEXT
);

-- 6. Appointments Table
CREATE TABLE appointments (
  appointment_id SERIAL PRIMARY KEY,
  patient_id INT NOT NULL REFERENCES patients(patient_id) ON DELETE CASCADE,
  doctor_id INT NOT NULL REFERENCES doctors(doctor_id) ON DELETE CASCADE,
  appt_date DATE NOT NULL,
  time_slot VARCHAR(20) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'Scheduled' CHECK (status IN ('Scheduled', 'Completed', 'Cancelled')),
  CONSTRAINT uq_doctor_slot UNIQUE (doctor_id, appt_date, time_slot)
);

-- 7. Medications Table
CREATE TABLE medications (
  med_id SERIAL PRIMARY KEY,
  med_name VARCHAR(100) NOT NULL,
  unit_price NUMERIC(10,2) NOT NULL CHECK (unit_price > 0),
  stock_qty INT NOT NULL CHECK (stock_qty >= 0),
  min_threshold INT NOT NULL DEFAULT 15
);

-- 8. Prescription Items Table
CREATE TABLE prescription_items (
  item_id SERIAL PRIMARY KEY,
  admission_id INT NOT NULL REFERENCES admissions(admission_id) ON DELETE CASCADE,
  med_id INT NOT NULL REFERENCES medications(med_id),
  quantity INT NOT NULL CHECK (quantity > 0),
  dosage_instructions TEXT
);

-- 9. Invoices Table
CREATE TABLE invoices (
  invoice_id SERIAL PRIMARY KEY,
  admission_id INT NOT NULL REFERENCES admissions(admission_id) ON DELETE CASCADE,
  room_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  doctor_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  pharmacy_charge NUMERIC(10,2) NOT NULL DEFAULT 0,
  total_amount NUMERIC(10,2) NOT NULL DEFAULT 0,
  status VARCHAR(20) NOT NULL DEFAULT 'Pending' CHECK (status IN ('Pending', 'Paid')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_doctors_dept ON doctors(dept_id);
CREATE INDEX idx_admissions_patient ON admissions(patient_id);
CREATE INDEX idx_admissions_bed ON admissions(bed_id);
CREATE INDEX idx_admissions_doctor ON admissions(doctor_id);
CREATE INDEX idx_admissions_active ON admissions(bed_id) WHERE discharge_date IS NULL;
CREATE INDEX idx_appointments_doctor ON appointments(doctor_id, appt_date);
CREATE INDEX idx_appointments_patient ON appointments(patient_id);
CREATE INDEX idx_prescription_admission ON prescription_items(admission_id);
CREATE INDEX idx_invoices_admission ON invoices(admission_id);

-- TRIGGERS AND PROCEDURES

-- Trigger 1: Inventory Decrement upon Prescription Issuance
CREATE OR REPLACE FUNCTION decrement_inventory()
RETURNS TRIGGER AS $$
BEGIN
  -- Attempt to decrement the stock
  UPDATE medications
  SET stock_qty = stock_qty - NEW.quantity
  WHERE med_id = NEW.med_id;
  
  -- The CHECK constraint on stock_qty >= 0 will automatically abort the transaction if there is insufficient stock
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_decrement_inventory
AFTER INSERT ON prescription_items
FOR EACH ROW
EXECUTE FUNCTION decrement_inventory();

-- Procedure 1: Discharge Patient (calculates lengths of stay, billing, updates bed state)
CREATE OR REPLACE FUNCTION discharge_patient(p_admission_id INT)
RETURNS VOID AS $$
DECLARE
  v_patient_id INT;
  v_bed_id INT;
  v_doctor_id INT;
  v_admission_date TIMESTAMPTZ;
  v_discharge_date TIMESTAMPTZ := NOW();
  
  v_daily_rate NUMERIC(10,2);
  v_doctor_fee NUMERIC(10,2);
  v_pharmacy_total NUMERIC(10,2) := 0;
  
  v_days_stayed INT;
  v_room_charge NUMERIC(10,2);
  v_total_amount NUMERIC(10,2);
BEGIN
  -- 1. Fetch admission details
  SELECT patient_id, bed_id, doctor_id, admission_date, discharge_date
  INTO v_patient_id, v_bed_id, v_doctor_id, v_admission_date
  FROM admissions
  WHERE admission_id = p_admission_id;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Admission ID % not found', p_admission_id;
  END IF;
  
  IF v_discharge_date IS NOT NULL THEN
    RAISE EXCEPTION 'Admission ID % is already discharged', p_admission_id;
  END IF;

  -- 2. Fetch related rates
  SELECT daily_rate INTO v_daily_rate FROM rooms_beds WHERE bed_id = v_bed_id;
  SELECT COALESCE(fee, 0) INTO v_doctor_fee FROM doctors WHERE doctor_id = v_doctor_id;
  
  -- 3. Calculate Pharmacy Charges
  SELECT COALESCE(SUM(pi.quantity * m.unit_price), 0)
  INTO v_pharmacy_total
  FROM prescription_items pi
  JOIN medications m ON pi.med_id = m.med_id
  WHERE pi.admission_id = p_admission_id;
  
  -- 4. Calculate Length of Stay and Room Charge
  v_days_stayed := EXTRACT(DAY FROM (v_discharge_date - v_admission_date));
  IF v_days_stayed = 0 THEN
    v_days_stayed := 1; -- Minimum 1 day charge
  END IF;
  v_room_charge := v_days_stayed * v_daily_rate;
  
  -- 5. Calculate Total
  v_total_amount := v_room_charge + v_doctor_fee + v_pharmacy_total;
  
  -- 6. Update Admission
  UPDATE admissions SET discharge_date = v_discharge_date WHERE admission_id = p_admission_id;
  
  -- 7. Generate Invoice
  INSERT INTO invoices (admission_id, room_charge, doctor_charge, pharmacy_charge, total_amount)
  VALUES (p_admission_id, v_room_charge, v_doctor_fee, v_pharmacy_total, v_total_amount);
  
  -- 8. Free the Bed (Set to Sanitizing, typically)
  UPDATE rooms_beds SET status = 'Sanitizing' WHERE bed_id = v_bed_id;
  
END;
$$ LANGUAGE plpgsql;

-- Trigger 2: Prevent duplicate beds being occupied
CREATE OR REPLACE FUNCTION check_bed_availability()
RETURNS TRIGGER AS $$
DECLARE
  v_status VARCHAR;
BEGIN
  SELECT status INTO v_status FROM rooms_beds WHERE bed_id = NEW.bed_id;
  IF v_status != 'Vacant' THEN
    RAISE EXCEPTION 'Bed % is not vacant', NEW.bed_id;
  END IF;
  
  UPDATE rooms_beds SET status = 'Occupied' WHERE bed_id = NEW.bed_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_check_bed_availability
BEFORE INSERT ON admissions
FOR EACH ROW
EXECUTE FUNCTION check_bed_availability();
