# movie.triamudomfamily.org

Seat-booking portal for Triam Udom Suksa school movie events. Staff scan student
QR codes and assign seats; admins have full override and analytics.

## Stack

- Next.js 16 (App Router) + React 19 + TypeScript
- Tailwind CSS v4 + shadcn-style UI primitives
- Supabase Postgres (data) + Supabase Realtime (broadcast only)
- Prisma 6 ORM
- Better Auth (username plugin for staff/admin, Google OAuth for students)
- `qrcode` for ticket QR generation, `html5-qrcode` for camera scanning
- `recharts` for admin analytics

## One-time setup

1. **Install dependencies**:

   ```bash
   yarn install
   ```

2. **Create `.env.local`** by copying `.env.example` and filling in the values:

   ```bash
   cp .env.example .env.local
   ```

   You need:
   - A Supabase project — copy the pooled (`?pgbouncer=true`) and direct
     connection strings into `DATABASE_URL` and `DIRECT_URL`.
   - The Supabase URL and anon key for `NEXT_PUBLIC_SUPABASE_*`. The service
     role key is only used server-side to broadcast on the `seats` channel.
   - A Google OAuth client (Web). Whitelist
     `<BETTER_AUTH_URL>/api/auth/callback/google` as the redirect URI.
   - `BETTER_AUTH_SECRET=$(openssl rand -hex 32)`

3. **Run the database migration and seed**:

   ```bash
   yarn db:push        # creates the tables on Supabase
   yarn db:seed        # seats + default admin (admin / admin123)
   ```

   Change the admin password immediately after first login from
   **/admin/staff** → "Reset password".

4. **Start the dev server**:

   ```bash
   yarn dev
   ```

## Routes

| Route                | Audience          | Purpose                                  |
| -------------------- | ----------------- | ---------------------------------------- |
| `/`                  | any               | Redirects to the right home for the role |
| `/login`             | staff / admin     | Username + password login                |
| `/register`          | student           | Google OAuth + registration form         |
| `/register/how-to`   | student           | Movie-day walkthrough                    |
| `/register/ticket`   | student           | QR ticket + assigned seat                |
| `/staff`             | staff / admin     | Live seat map                            |
| `/staff/scan`        | staff / admin     | QR scanner (single + multi mode)         |
| `/admin`             | admin             | Dashboard + interactive map              |
| `/admin/scan`        | admin             | Scanner with override capability         |
| `/admin/staff`       | admin             | Staff account CRUD                       |
| `/admin/logs`        | admin             | Filterable booking log + CSV export      |

## Realtime

When a seat changes status, the server publishes a single
`{ seat, status }` payload on the `seats` Supabase Realtime channel
(`event: seat-update`). Every connected seat-map updates in place, no refetch.

No personal data ever crosses the realtime channel.

## Seat layout

The theater layout is defined declaratively in
`src/lib/seat-layout.ts` and seeded into the database from
`prisma/seed.ts`. Adjust the row specs there if the actual hall layout
differs from the reference image. The seed script is idempotent
(`upsert`) so it can be re-run.

Seat IDs follow `{ROW}-{NUMBER}`, numbered left-to-right per row.

## Notes / deviations from the spec

- The `User` model has `email` (required) — Better Auth requires it. Staff
  accounts get a synthetic `<username>@staff.local` email; students use
  their real `@student.triamudom.ac.th` email.
- The `Student` model is linked to the Better Auth `User` via `userId` for
  cleaner joins; `googleId` is still stored from the OAuth account.
- Password hashing uses Better Auth's built-in scrypt rather than direct
  bcrypt — same security goal, avoids running two hashing libraries
  side by side.
- The `STUDENT` role was added to the `Role` enum so that all three user
  types share the same Better Auth `User` table.
- Prisma was pinned to 6.x because Prisma 7 deprecated the in-schema
  `url`/`directUrl` syntax that the spec uses.
