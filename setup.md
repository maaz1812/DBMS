# Developer Setup Guide — Hospital Management System

> Based on the technology stack documented in the *Project Resource Requirements* section of the BCSE302P Hospital Management System project report:
> PostgreSQL 16 (hosted on Supabase), Supabase (managed Postgres, instant REST API, and authentication), React 19, TypeScript 5, Vite 8, Tailwind CSS v4, `@supabase/supabase-js`, Node.js 18+ and npm, Visual Studio Code, and a modern browser (Chrome, Edge, or Firefox).
>
> The report documents the schema (tables, constraints, indexes) but does not include a repository structure, specific SQL migration filenames, or a Supabase project reference. Wherever such project-specific detail is required below and is not in the report, it is marked as a **placeholder** you must supply.

---

## 1. Prerequisites

- A computer running Windows, macOS, or Linux
- Node.js **18 or later** and npm (bundled with Node.js)
- Visual Studio Code (or any editor of your choice)
- A modern browser: Chrome, Edge, or Firefox
- A free [Supabase](https://supabase.com) account
- Basic familiarity with the command line

## 2. Node.js Installation

Download and install Node.js 18+ from [nodejs.org](https://nodejs.org) (LTS or newer), or use a version manager:

```bash
# Using nvm (macOS/Linux)
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
nvm install 18
nvm use 18
```

```powershell
# Windows: download the installer from nodejs.org, or use nvm-windows
nvm install 18.20.0
nvm use 18.20.0
```

## 3. npm Verification

Confirm Node.js and npm installed correctly:

```bash
node -v      # should print v18.x.x or later
npm -v       # should print an npm version, e.g. 9.x.x or 10.x.x
```

If either command is not found, revisit Step 2 and ensure Node.js was added to your system `PATH`.

## 4. Creating the React/Vite Project

The report specifies **React 19** with **Vite 8** as the build tool and **TypeScript 5**. Scaffold the project:

```bash
npm create vite@latest hospital-management-system -- --template react-ts
cd hospital-management-system
```

> **Placeholder note:** the report does not specify an exact project/repository name. `hospital-management-system` is a suggested name — replace it with your team's actual repository name if one exists.

## 5. Installing Dependencies

Install base dependencies, then add the Supabase client library named in the report:

```bash
npm install
npm install @supabase/supabase-js
```

Verify versions align with what's documented (React 19, TypeScript 5):

```bash
npm list react react-dom typescript
```

If Vite scaffolded older major versions, update explicitly:

```bash
npm install react@^19 react-dom@^19
npm install -D typescript@^5
```

## 6. Tailwind CSS Setup

The report specifies **Tailwind CSS v4**. Install and configure it for Vite:

```bash
npm install tailwindcss @tailwindcss/vite
```

Add the Tailwind Vite plugin in `vite.config.ts`:

```ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

In your main CSS file (e.g. `src/index.css`), add:

```css
@import "tailwindcss";
```

Then import that CSS file from your app's entry point (e.g. `src/main.tsx`) if it isn't already.

## 7. Supabase Project Setup

1. Go to [supabase.com](https://supabase.com) and sign in or create an account.
2. Click **New Project**, choose an organization, and set:
   - **Project name** — e.g. `hospital-management-system` (placeholder; choose your own)
   - **Database password** — generate and store securely; you will need it for direct Postgres access
   - **Region** — choose one close to your users
3. Wait for provisioning to complete (a few minutes).
4. Once created, note the following from **Project Settings → API**:
   - **Project URL** (e.g. `https://<project-ref>.supabase.co`)
   - **anon public API key**
   - **service_role key** (keep this secret — server-side use only)

The report identifies this managed Postgres/Supabase project as the database and API layer; it does not specify a particular Supabase project name or region, so these are choices you make.

## 8. PostgreSQL Database Setup

The report specifies **PostgreSQL 16**, hosted by Supabase — you do not need to install PostgreSQL locally unless you want a local development copy.

- Supabase provisions PostgreSQL 16 automatically when the project is created (Step 7); no separate installation is required for the hosted database.
- **Optional (local development):** install PostgreSQL 16 directly if you want to test schema changes offline before applying them to Supabase:

```bash
# macOS (Homebrew)
brew install postgresql@16

# Ubuntu/Debian
sudo apt update
sudo apt install postgresql-16
```

## 9. Database Schema Setup

The report's *Tables and Constraints* section documents the full schema: `departments`, `doctors`, `patients`, `rooms_beds`, `admissions`, `appointments`, `medications`, `prescription_items`, and `invoices`, along with their constraints and indexes.

> **Placeholder note:** the report does not name a specific `.sql` migration file (e.g., no `schema.sql` or `migrations/001_init.sql` filename is given). Save the CREATE TABLE statements from the report into a SQL file of your own choosing, for example:

```bash
mkdir -p db
touch db/schema.sql
# Paste the CREATE TABLE / ALTER TABLE / CREATE INDEX statements
# from the report's "Tables and Constraints" section into this file.
```

Apply it to your Supabase database using the Supabase SQL Editor (Dashboard → **SQL Editor** → paste and run), or via `psql` if you have the connection string from Step 7:

```bash
psql "postgresql://postgres:<password>@<host>:5432/postgres" -f db/schema.sql
```

Run statements in this order to satisfy foreign-key dependencies, consistent with the report's table definitions: `departments` → `doctors` → (add `fk_head_doctor` constraint) → `patients` → `rooms_beds` → `admissions` → `appointments` → `medications` → `prescription_items` → `invoices` → indexes.

## 10. Environment Variables

Create a `.env` file at the project root (and add it to `.gitignore`):

```env
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<anon-public-key>
```

```bash
echo ".env" >> .gitignore
```

> The `service_role` key should **not** go in this frontend `.env` file — it is not needed for a client-only React app and must never be shipped in the browser bundle. The report does not document any server-side component that would need it.

## 11. Supabase Client Configuration

Create a client module, e.g. `src/lib/supabaseClient.ts`:

```ts
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables. Check your .env file.')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

Import `supabase` from this module anywhere you need to query the database, e.g.:

```ts
import { supabase } from './lib/supabaseClient'

const { data, error } = await supabase.from('patients').select('*')
```

## 12. Running the Development Server

```bash
npm run dev
```

Vite will print a local URL (typically `http://localhost:5173`) — open it in Chrome, Edge, or Firefox as specified in the report's resource list.

## 13. Connecting Frontend to Supabase

With the client configured (Step 11), verify the connection from within a component:

```tsx
import { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'

function DepartmentsList() {
  const [departments, setDepartments] = useState<any[]>([])

  useEffect(() => {
    supabase
      .from('departments')
      .select('*')
      .then(({ data, error }) => {
        if (error) console.error(error)
        else setDepartments(data ?? [])
      })
  }, [])

  return (
    <ul>
      {departments.map((d) => (
        <li key={d.dept_id}>{d.dept_name}</li>
      ))}
    </ul>
  )
}

export default DepartmentsList
```

## 14. Testing Database Connectivity

- **From the frontend:** run the app (Step 12) and confirm data from a table such as `departments` renders without console errors.
- **From the Supabase Dashboard:** go to **Table Editor** and confirm the tables from Step 9 exist with the expected columns.
- **From the command line (optional):**

```bash
psql "postgresql://postgres:<password>@<host>:5432/postgres" -c "\dt"
```

This should list all tables documented in the report (`departments`, `doctors`, `patients`, `rooms_beds`, `admissions`, `appointments`, `medications`, `prescription_items`, `invoices`).

## 15. Common Errors

| Error | Likely cause |
|---|---|
| `Missing Supabase environment variables` | `.env` file missing or variables not prefixed with `VITE_` |
| `relation "patients" does not exist` | Schema (Step 9) not yet applied to the Supabase database |
| `permission denied for table ...` | Row Level Security enabled with no policy allowing the request (RLS is not part of the report's documented schema, but may apply if enabled manually) |
| CORS or network errors calling Supabase | Incorrect `VITE_SUPABASE_URL`, or project paused/inactive on the free tier |
| `violates check constraint` | Input data does not satisfy a documented `CHECK` constraint (e.g., `fee > 0`, `stock_qty >= 0`) |
| `violates unique constraint "uq_doctor_slot"` | Attempted to book a doctor for a date/time slot already taken — expected behavior per the report's conflict-prevention design |

## 16. Troubleshooting

- **Blank page after `npm run dev`:** check the browser console for import errors; confirm `main.tsx` imports your Tailwind CSS file.
- **Environment variables undefined at runtime:** Vite only exposes variables prefixed `VITE_`; restart the dev server after editing `.env` (Vite does not hot-reload env changes).
- **Foreign key violations when seeding data:** insert rows in dependency order — `departments` and `doctors` before `admissions`/`appointments`, `rooms_beds` before `admissions`, `medications` before `prescription_items`, `admissions` before `invoices`.
- **Supabase project paused:** free-tier Supabase projects pause after a period of inactivity; resume it from the Supabase Dashboard before testing connectivity.
- **TypeScript type errors on Supabase queries:** consider generating types from your schema with the Supabase CLI (`supabase gen types typescript`) — this is a general Supabase capability, not something described in the report.

## 17. Production Build

Build the optimized frontend bundle:

```bash
npm run build
```

Preview the production build locally before deploying:

```bash
npm run preview
```

Deploy the contents of the generated `dist/` folder to any static hosting provider (e.g., Vercel, Netlify, or Supabase's own hosting options if used). Ensure the same `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` environment variables are configured in your hosting provider's dashboard — the report does not specify a particular deployment target, so this step is left generic.

---

*This guide follows the technology stack exactly as listed in the report's Project Resource Requirements section. Any file names, commands, or configuration values not found verbatim in the report are marked as placeholders or general best practice, not claims about the actual project repository.*
