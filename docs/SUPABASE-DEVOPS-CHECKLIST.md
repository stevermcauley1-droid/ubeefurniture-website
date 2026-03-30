# Supabase DevOps Checklist — ubeefurniture-website

Use this for local and Vercel production setup. No secrets in code or commits.

---

## 1) Local env (`.env.local`)

- **Location:** Project root: `.env.local` (gitignored).
- **Required variables:**

| Variable | Example / note |
|----------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nlrkpsdxekgklvcqumhm.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Paste anon key from Supabase → Project Settings → API |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste service_role key (server-only; for catalogue-leads insert) |

- **Where to paste keys:** Open `.env.local` in the project root. Fill in the two key values (leave no spaces around `=`).
- **Check:** `.gitignore` must contain `.env.local` (it does).
- **Validate:** Run `npm run dev`, open the app, submit the catalogue form at `/landlords/catalogue`. Check terminal for “missing env” warnings; if none and form succeeds, local Supabase is configured.

---

## 2) Vercel env (Production + Preview)

1. Open **Vercel** → project **ubeefurniture-website** → **Settings** → **Environment Variables**.
2. Add or edit:

| Key | Value | Environments |
|-----|--------|----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `https://nlrkpsdxekgklvcqumhm.supabase.co` | Production, Preview |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Paste full anon key | Production, Preview |
| `SUPABASE_SERVICE_ROLE_KEY` | Paste service_role key | Production, Preview |

3. Mark `SUPABASE_SERVICE_ROLE_KEY` as **Sensitive** if the UI offers it.
4. **Save**, then **Redeploy:** Deployments → ⋮ on latest → **Redeploy** (so new vars apply).

---

## 3) Supabase table `catalogue_leads`

- **Project:** `nlrkpsdxekgklvcqumhm` (URL above).
- **If the table is missing:** In Supabase Dashboard → **SQL Editor**, run the SQL from **docs/SETUP-ENV-AND-ADMIN.md** section E, or from **supabase/migrations/create_catalogue_leads.sql**, then **supabase/migrations/secure_catalogue_leads.sql** (RLS). Inserts from the app use the **service role**, which bypasses RLS.

---

## 4) Verification

### Local

1. `npm run dev`
2. Open the site (e.g. http://localhost:3000).
3. No “missing env” errors in terminal or browser console.
4. Go to **Landlords → Catalogue** (or `/landlords/catalogue`), submit the lead form.
5. In Supabase → **Table Editor** → `catalogue_leads`, confirm a new row.

### Production

1. Open production URL (e.g. `https://ubeefurniture-website.vercel.app`).
2. **Health:** Open `https://ubeefurniture-website.vercel.app/api/health/supabase` → expect JSON with `"ok": true` (or clear error message).
3. **Debug banner:** Open `https://ubeefurniture-website.vercel.app/?debug=supabase` → expect “Supabase: OK” (or “Supabase: FAIL” with message).
4. Submit the catalogue form again; confirm a new row in `catalogue_leads`.

---

## 5) Security (verified)

- **Service role key** is used only in server-only code: `app/api/catalogue-leads/route.ts`, `src/lib/env.server.ts`, `src/lib/supabase/server.ts`, `app/admin/leads/page.tsx` (server component). No `"use client"` file uses it.
- **Client-side** Supabase uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` (e.g. `lib/supabase/client.ts`, `src/lib/supabase/browser.ts`).
- **Secrets** are not committed; `.env.local` is gitignored.
