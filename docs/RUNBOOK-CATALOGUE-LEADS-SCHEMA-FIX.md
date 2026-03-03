# Runbook: Fix production catalogue_leads schema (missing columns)

**Symptom:** Form shows "Unable to save lead right now." API returns:
`Could not find the 'company' column of 'catalogue_leads' in the schema cache`

**Cause:** Table `public.catalogue_leads` in Supabase is missing columns expected by the API.

**Project:** `nlrkpsdxekgklvcqumhm`  
**Dashboard:** https://supabase.com/dashboard/project/nlrkpsdxekgklvcqumhm

---

## Step 1 — Run schema patch

1. Open **Supabase Dashboard** → project above → **SQL Editor** → **New Query**.
2. Paste and run this (idempotent; safe to run multiple times):

```sql
alter table public.catalogue_leads
  add column if not exists phone text,
  add column if not exists postcode text,
  add column if not exists company text,
  add column if not exists persona text,
  add column if not exists consent boolean default false,
  add column if not exists source text default 'landlord_catalogue';
```

3. Click **Run**. Expect "Success. No rows returned."

---

## Step 2 — Verify columns

- **Table Editor** → **catalogue_leads** → check **Columns** (or table definition).
- Confirm: `phone`, `postcode`, `company`, `persona`, `consent`, `source` exist.
- If schema cache is stale: **Database** → **Settings** → **Reset API cache** (or wait a short time).

---

## Step 3 — Production validation

1. Open production form: `https://ubeefurniture-website.vercel.app/landlords/catalogue`
2. Submit a test entry (name, email, persona, consent; optional: company, phone, postcode).
3. Confirm: success state, PDF unlock, no error in console.

---

## Step 4 — Data check

- **Table Editor** → **catalogue_leads** → confirm new row with `company`, `persona`, `consent`, `source` populated.

---

## RLS note

The app inserts via **service role** (server-side). Do **not** add an `anon` INSERT policy for public lead capture; RLS denying anon is correct. Service role bypasses RLS.

---

**Migration file in repo:** `supabase/migrations/20260301000000_add_catalogue_leads_columns.sql`

---

## Harden: drop `role` column + enable RLS

After leads are saving, run once in Supabase SQL Editor to remove unused `role` and lock down with RLS (service role bypasses; anon denied):

**File:** `supabase/migrations/20260304000000_harden_catalogue_leads.sql`

Then run the smoke test (health only, no lead insert):

```bash
node scripts/smoke-health.mjs
node scripts/smoke-health.mjs https://ubeefurniture-website.vercel.app
```
