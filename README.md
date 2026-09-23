# 🏥 Hospital Management System (HMS)

![HMS Banner](https://images.unsplash.com/photo-1519494026892-80bbd2d6fd0d?q=80&w=2053&auto=format&fit=crop)

A fully digitized, **database-first** Hospital Management System designed to streamline administrative, clinical, and financial operations. Built in accordance with strict **Third Normal Form (3NF)** database principles, this system leverages advanced PostgreSQL triggers and stored procedures to automate complex workflows like patient discharge, billing, and pharmacy inventory management.

---

## ✨ Key Features

- **🛡️ Database-First Integrity:** Conflict resolution (like preventing double-booking of doctors) is handled strictly at the database level using composite unique constraints.
- **🛏️ Inpatient & Bed Management:** Real-time tracking of ICU, General, and Private wards. Automatic toggling of bed statuses upon admission and discharge.
- **💊 Pharmacy & Inventory:** Automated stock decrementing when prescriptions are issued via PostgreSQL triggers.
- **🧾 Automated Billing:** A robust stored procedure automatically calculates length of stay, room charges, doctor fees, and pharmacy costs to instantly generate a consolidated invoice upon patient discharge.
- **👨‍⚕️ Administrative Controls:** Secure interfaces for managing hospital departments, registering doctors, and handling patient demographics.

---

## 🛠️ Technology Stack

**Frontend:**
- ⚛️ **React 19**
- ⚡ **Vite 8**
- 📘 **TypeScript 5**
- 🎨 **Tailwind CSS v4**

**Backend & Database:**
- 🐘 **PostgreSQL 16** (Hosted on Supabase)
- 🔗 **Supabase JS Client** for direct, secure API interactions
- ⚙️ **Stored Procedures & Triggers** for serverless business logic

---

## 🏗️ Architecture

This project eliminates the traditional middle-tier (like Node.js/Express) in favor of a modern **Backend-as-a-Service (BaaS)** architecture. 
React communicates directly with Supabase, relying on PostgreSQL to serve as the ultimate source of truth. Business rules—such as preventing negative inventory or generating billing math—are mathematically enforced inside the database engine, ensuring `ACID` compliance and eliminating race conditions.

---

## 🚀 Getting Started

Want to run this project locally? Follow these steps:

### 1. Database Setup
Create a new project on [Supabase](https://supabase.com/).
Navigate to the **SQL Editor** in your Supabase dashboard and run the entire contents of `db/schema.sql`. This will scaffold the tables, relationships, triggers, and the discharge function.

### 2. Environment Variables
Clone this repository and create a `.env` file in the root directory:
```bash
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```
*(Ensure you have "Confirm Email" turned off in Supabase Authentication settings if you want immediate login access during testing).*

### 3. Install & Run
Install the dependencies and start the Vite development server:
```bash
npm install
npm run dev
```
Open `http://localhost:5173` in your browser and sign up to create your first admin account!

---

## 🗄️ Database Schema Overview

The relational model includes 9 core tables interconnected to handle the hospital lifecycle:
* `departments` & `doctors`
* `patients` & `appointments`
* `rooms_beds` & `admissions`
* `medications`, `prescription_items`, & `invoices`

**Highlight:** The `discharge_patient()` RPC automatically aggregates costs from `rooms_beds`, `doctors`, and `prescription_items` to write a finalized record to `invoices` while simultaneously freeing up the hospital bed.

---

*This project was developed as a comprehensive Database Systems (DBMS) implementation.*
