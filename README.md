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

3. Apply the SQL migrations from `sql/` to your Supabase database in numbered order.

4. Start the development server:
   ```bash
   npm run dev
   ```

## Scripts

- `npm run dev` – start local dev server
- `npm run build` – type-check and build for production
- `npm run preview` – preview the production build locally
- `npm run lint` – run Oxlint
