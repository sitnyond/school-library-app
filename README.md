# School Library App

A web application for managing a school library — book catalog, student loans, overview statistics, and library settings. Built with React, TypeScript, Material UI, and Supabase (Czech UI).

## Features

- **Book catalog** – add, edit, delete, and search books with copy counts and live availability.
- **Loan management** – lend, edit, extend, and return books with overdue tracking. Borrower names are automatically cleared upon return for privacy (GDPR).
- **Overview & statistics** – KPI summary, overdue alerts, loan charts by school year, and top-borrowed book rankings.
- **Admin settings** – manage classes, book types, placements, and default loan/extension durations (restricted to users with the `admin` role).
- **Authentication** – email/password sign-in and password recovery via Supabase Auth.

## Tech Stack

- **Frontend:** React 19, TypeScript, Vite, Material UI (`@mui/material`, `@mui/x-data-grid`, `@mui/x-charts`, `@mui/x-date-pickers`)
- **Backend:** Supabase (PostgreSQL + Auth)
- **Linting:** Oxlint

## Getting Started

1. Install dependencies:
   ```bash
   npm install
   ```

2. Create `.env.local` from `.env.example` and fill in your Supabase credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   VITE_APP_TITLE=School library
   ```

3. Run [`sql/init.sql`](sql/init.sql) in the Supabase SQL Editor to create the database schema and RLS policies.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` – start local dev server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run Oxlint
- `npm test` – run unit tests (Vitest)

## Database

Add admin account by running:
```sql
update auth.users
set raw_app_meta_data = coalesce(raw_app_meta_data, '{}'::jsonb) || '{"role": "admin"}'::jsonb
where email = 'admin@skola.cz';
```

Delete admin account by running:
```sql
update auth.users
set raw_app_meta_data = raw_app_meta_data - 'role'
where email = 'admin@skola.cz';
```

> Note: After changing a user's role, the user must sign out and sign back in for the new role to take effect.