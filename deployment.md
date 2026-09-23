# Deployment Guide — Hospital Management System

> The project report does not specify a frontend hosting provider, nor does it describe an existing CI/CD pipeline. This document is written **provider-neutral**: any mention of a specific provider (Vercel, Netlify, AWS, Railway, etc.) is an illustrative example only, not a claim about what this project currently uses.

**Technology stack (as documented in the project report):**

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript 5, Vite 8, Tailwind CSS v4 |
| Backend/Data | Supabase (managed PostgreSQL, instant REST API, authentication), PostgreSQL 16 |
| Client library | `@supabase/supabase-js` |
| Runtime | Node.js 18+, npm |

---

## 1. Deployment Overview

The system has two independently deployable parts:

1. **The Supabase project** — a managed PostgreSQL 16 database plus Supabase's auto-generated REST/API layer and authentication service. This is provisioned and configured directly in Supabase (or via the Supabase CLI), not built as a Node.js server.
2. **The frontend** — a React 19 + TypeScript 5 single-page application built with Vite 8, styled with Tailwind CSS v4, and compiled to static assets (HTML/CSS/JS). Once built, it is a set of static files that can be served by any static-file-capable host.

The frontend communicates with Supabase directly from the browser via `@supabase/supabase-js`, using the Supabase project's URL and public (anon) API key. There is no custom backend server described in the report — Supabase serves that role.

---

## 2. Frontend Build Process

Standard Vite build flow:

```bash
npm install
npm run build
```

This produces a `dist/` directory (Vite's default output folder) containing static HTML, CSS, and JS assets, with Tailwind's utility classes purged/compiled in. This `dist/` folder is what gets deployed to a static host.

For local development:

```bash
npm run dev
```

starts Vite's development server with hot module replacement.

> The exact npm scripts (`build`, `dev`, etc.) should match whatever is defined in the project's own `package.json`; the commands above reflect Vite's conventional defaults.

---

## 3. Environment Variables

The frontend needs, at minimum, the Supabase project URL and its public (anon) API key to initialize `@supabase/supabase-js`. Following Vite's convention, environment variables exposed to client-side code must be prefixed `VITE_`:

```
VITE_SUPABASE_URL=https://<project-ref>.supabase.co
VITE_SUPABASE_ANON_KEY=<public-anon-key>
```

These are read in code via `import.meta.env.VITE_SUPABASE_URL` / `import.meta.env.VITE_SUPABASE_ANON_KEY`.

**Important:** Only the **anon/public** key belongs in frontend environment variables. The Supabase **service role** key (which bypasses Row Level Security) must never be placed in a `VITE_`-prefixed variable or otherwise shipped to the browser, since anything with that prefix is bundled into the client-side JavaScript and is publicly visible.

---

## 4. Supabase Configuration

1. Create a Supabase project (via the Supabase dashboard or `supabase projects create` with the CLI).
2. Note the project's URL and anon key from the project's API settings — these become the frontend's environment variables (§3).
3. Configure authentication providers/settings in the Supabase dashboard as required by the application's access model (the report does not detail specific auth requirements beyond noting Supabase provides "instant REST API and authentication").
4. Configure Row Level Security (RLS) policies on each table appropriate to who should be able to read/write patient, clinical, and billing data. The report does not specify RLS policies, so these should be defined based on the application's actual access requirements before handling real patient data.

---

## 5. PostgreSQL Database Deployment

Because PostgreSQL 16 is hosted on Supabase, there is no separate database server to provision or patch — Supabase manages the underlying PostgreSQL instance, backups (see §13), and version upgrades. Deployment work here is limited to:

- Selecting an appropriate Supabase project region (ideally close to the majority of expected users/staff).
- Selecting an appropriate compute/plan tier based on expected load — the report does not specify a tier.

---

## 6. Database Schema Deployment

The schema (tables, constraints, indexes, and any triggers/procedures/views referenced in the report) should be deployed as version-controlled SQL migration files rather than applied ad hoc through the dashboard, so schema changes are reproducible across environments:

- Use the Supabase CLI's migration workflow (`supabase migration new <name>`, `supabase db push`) or a general-purpose SQL migration tool.
- Each `CREATE TABLE` / `ALTER TABLE` / `CREATE INDEX` statement shown in the report should live in a migration file, applied in dependency order (e.g., `departments` and `doctors` before the `fk_head_doctor` `ALTER TABLE`, since that constraint references `doctors` from `departments`).
- Any triggers or stored procedures referenced in the report's abstract (auto-discharge on unsettled balance, the discharge/billing procedure) and any decision-support views should be added as their own migrations once their definitions are finalized.

---

## 7. Production Build

The production artifact is the static `dist/` output of `npm run build` (§2). Before shipping it:

- Confirm environment variables (§3) are set for the **production** Supabase project, not a development/staging one.
- Confirm the build has no development-only code paths left enabled (e.g., verbose logging of Supabase responses).

---

## 8. Hosting Considerations

Since the frontend build output is a set of static files, it can be hosted on any static-hosting-capable platform — for example (illustrative only, not a stated choice): a static hosting provider (Vercel, Netlify, Cloudflare Pages), a cloud storage + CDN combination (S3 + CloudFront, or equivalent), or a traditional web server (Nginx) serving the `dist/` folder. Requirements to check for whichever host is chosen:

- Support for single-page-application routing (serving `index.html` for unmatched paths, if client-side routing is used).
- HTTPS by default, since the app communicates with Supabase over HTTPS and should itself be served over HTTPS.
- The ability to set the build-time environment variables described in §3.

---

## 9. Environment Separation

A minimum of two environments is recommended:

- **Development/staging:** its own Supabase project, its own database, seeded with non-real test data (patients, doctors, appointments) for safe testing of schema changes, triggers, and procedures.
- **Production:** a separate Supabase project containing real data, with stricter RLS policies and no direct developer write access outside of reviewed migrations.

Each environment gets its own `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY` pair (§3), so the same frontend build process can target either environment via its environment configuration.

---

## 10. Secrets Management

- Frontend environment variables (§3) are not truly "secret" once built — anything prefixed `VITE_` is embedded in the shipped JavaScript bundle. Only the anon key, which is designed to be public and constrained by RLS, should go here.
- Any genuinely sensitive credential (a Supabase service role key, third-party API keys used only for privileged operations) must live outside the frontend build entirely — for example, in a server-side function/edge function's environment, or a CI/CD secret store — never in the React app's bundle.
- Store environment variables in your hosting platform's environment-variable configuration (or CI/CD secret manager), not committed to source control. A `.env.example` file (with placeholder values) is a reasonable convention for documenting which variables are required.

---

## 11. Database Security

- Enable and configure Row Level Security (RLS) on every table containing patient, clinical, or billing data before any production use, since the frontend talks to Supabase directly with a public anon key — RLS is the primary access-control mechanism in this architecture.
- Restrict the service role key to server-side/administrative contexts only (see §10).
- Review the CHECK/FK constraints documented in `business-rules.md` as a data-integrity baseline; RLS governs *who* can act, constraints govern *what* valid data looks like — both are needed.
- Ensure Supabase project-level settings (allowed auth providers, API access) match the intended user base (hospital staff) rather than defaulting to fully open sign-up, unless that is an intended design.

---

## 12. Monitoring

- Supabase provides built-in project-level logging and metrics (database logs, API request logs, auth logs) through its dashboard — these should be reviewed regularly, especially for failed constraint violations (which may indicate either application bugs or attempted invalid operations) and slow queries (candidates for additional indexing beyond the nine indexes already documented in the report).
- Frontend error monitoring (e.g., capturing unhandled exceptions or failed Supabase calls) should be added at the application level; the report does not describe an existing monitoring/observability setup.

---

## 13. Backup Considerations

- Supabase manages automated backups of the underlying PostgreSQL database as part of its managed offering; the specific backup frequency/retention depends on the Supabase plan tier selected for the project (not specified in the report).
- Regardless of Supabase's managed backups, periodic exported/downloaded backups (e.g., via `pg_dump` against the Supabase connection string) are a reasonable additional safeguard for a system holding patient and billing data, and should be stored securely and separately from the primary project.
- Backup/restore procedures should be tested (restoring into a scratch project) rather than assumed to work, particularly before relying on them for real patient data.

---

## 14. Rollback Strategy

- **Frontend:** since the deployed artifact is a static build, rollback is typically a matter of re-deploying the previous build output (most static hosts keep prior deployments available for instant rollback) or reverting to a previous Git commit and rebuilding.
- **Database schema:** because the schema is deployed via versioned migrations (§6), a rollback strategy should pair every forward migration with a corresponding down-migration (or documented manual reversal), particularly for destructive changes. This is not described as already existing in the report and should be established as a practice going forward.
- **Data:** for any migration that transforms or deletes existing data, take an explicit backup immediately beforehand (see §13), since some schema rollbacks cannot fully undo data-level changes.

---

## 15. Production Checklist

- [ ] Production Supabase project created, separate from development/staging.
- [ ] All schema migrations (tables, constraints, indexes, and any triggers/procedures/views) applied to the production database.
- [ ] Row Level Security enabled and policies defined for every table containing patient, clinical, or billing data.
- [ ] Frontend built with production `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`.
- [ ] Only the anon key is present anywhere in the frontend bundle; no service role key exposed.
- [ ] Hosting platform configured for HTTPS and (if applicable) SPA routing.
- [ ] Backup/restore procedure verified at least once against a scratch project.
- [ ] Rollback plan documented for both frontend deploys and database migrations.
- [ ] Basic monitoring/error visibility in place for both the Supabase project and the frontend.
