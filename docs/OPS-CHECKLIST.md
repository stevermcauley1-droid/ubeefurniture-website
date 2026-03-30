# Ops Checklist – Landlord Catalogue Funnel

Use this checklist when deploying or verifying the landlord catalogue funnel.

## 1. Environment variables

- [ ] Set `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Set `SUPABASE_SERVICE_ROLE_KEY` (server-only, never exposed to client)
- [ ] Set `ADMIN_DASH_TOKEN` (for `/admin/leads?token=...`)

## 2. Supabase database setup

- [ ] In Supabase **SQL** editor, run `supabase/migrations/create_catalogue_leads.sql`
- [ ] In Supabase **SQL** editor, run `supabase/migrations/secure_catalogue_leads.sql`
- [ ] Confirm table `catalogue_leads` exists with expected columns
- [ ] Confirm RLS is enabled and no public access is allowed

See `docs/SUPABASE-SETUP-CATALOGUE-LEADS.md` for details.

## 3. Application checks

- [ ] Ensure `public/landlord-catalogue.pdf` exists (real PDF or placeholder)
- [ ] Start app: `npm run dev` (or production start)
- [ ] Visit `/landlords/catalogue` and submit a test lead
  - Confirm API response `{ ok: true, mode: "supabase" }` in network tab
  - Confirm server logs show `mode=supabase` (no PII)
- [ ] Visit `/admin/leads?token=YOUR_ADMIN_DASH_TOKEN`
  - Confirm page shows *Admin – Leads*
  - Confirm your test lead appears in the table
- [ ] Visit `/landlord-catalogue.pdf` and confirm the PDF downloads

## 4. Verify leads in Supabase (manual)

In Supabase Dashboard → **SQL Editor**, run:

```sql
SELECT * FROM catalogue_leads ORDER BY created_at DESC LIMIT 5;
```

Confirm the latest test lead row exists (name, email, persona, created_at, etc.).

