# Supabase Setup – `catalogue_leads`

This configures the landlord catalogue lead table and locks it down with RLS.

## 1. Create the table

In the Supabase project for uBee:

1. Go to **SQL** in the left sidebar.
2. Click **New query**.
3. Paste the contents of:

   `supabase/migrations/create_catalogue_leads.sql`

4. Click **Run**.

This will create the `catalogue_leads` table with the required columns:

- `id`, `created_at`, `name`, `email`, `phone`, `postcode`, `company`, `persona`, `consent`, `source`.

## 2. Lock down with RLS

With the same Supabase project:

1. Create another **New query**.
2. Paste the contents of:

   `supabase/migrations/secure_catalogue_leads.sql`

3. Click **Run**.

This will:

- **Enable RLS** on `catalogue_leads`.
- Add policies that **deny all access** for the `public` role (`anon` / `authenticated`).

The **service role key** bypasses RLS, which is what the server-side API will use for inserts and reads.

## 3. Environment variables required

Make sure these are set (e.g. in `.env.local` / production env):

- `NEXT_PUBLIC_SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` (do **not** expose this to the browser)

After this, the `/api/catalogue-leads` API route can insert and read leads securely via the service role, while the public app cannot query the table directly.

