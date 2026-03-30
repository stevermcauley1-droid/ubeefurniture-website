# Setup: Env vars, Supabase service role, and admin token

Use this guide to enable Supabase lead storage, protect the admin leads page, and avoid connection issues.

---

## A) Server-only env vars (never expose to browser)

| Variable | Where used | Secret? |
|----------|------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | Client + server | No (public) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client + server | No (public anon key) |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** (API route) | **Yes — never in client code** |
| `ADMIN_DASH_TOKEN` | **Server only** (admin page guard) | **Yes — never in client code** |

- **Verify:** `.env.local` is in `.gitignore` (it is). Never commit `.env.local`. No code should `console.log` or expose these two secret values.

---

## B) How to get SUPABASE_SERVICE_ROLE_KEY

1. Open **Supabase Dashboard**: https://supabase.com/dashboard
2. Select your **project** (uBee / catalogue_leads).
3. Go to **Project Settings** (gear icon in left sidebar) → **API**.
4. Under **Project API keys**, find the key labeled **service_role** (not "anon" / "public").
5. Click **Reveal** (or copy) and copy the full **service_role** value.

**Warning:** Treat this key like a password. Never put it in client-side code. Only use it in server env (API routes, server components). Never commit it to git.

**Add to `.env.local`:**

```
SUPABASE_SERVICE_ROLE_KEY=<paste the service_role key here>
```

**Confirm these exist in `.env.local`** (same Supabase **Project Settings → API** page):

- **Project URL** → `NEXT_PUBLIC_SUPABASE_URL=https://xxxxx.supabase.co`
- **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...`

Restart the dev server after editing `.env.local`.

---

## C) How to create ADMIN_DASH_TOKEN (local)

1. In a terminal, run:

   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```

2. Copy the 64-character hex string printed.
3. Add to `.env.local`:

   ```
   ADMIN_DASH_TOKEN=<that hex value>
   ```

4. Restart the dev server.

Use this same value in the admin URL:  
`http://localhost:PORT/admin/leads?token=YOUR_ADMIN_DASH_TOKEN`

---

## D) Set env vars in Vercel (production + preview)

**Where to add them:** Vercel Dashboard → your project → **Settings** → **Environment Variables**.

| Key (exact name) | Required for | Environments | Secret? |
|------------------|---------------|--------------|--------|
| `NEXT_PUBLIC_SUPABASE_URL` | API + client | Production, Preview | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Client (optional for catalogue API) | Production, Preview | No |
| `SUPABASE_SERVICE_ROLE_KEY` | **Catalogue leads API (insert)** | Production, Preview | **Yes** |
| `ADMIN_DASH_TOKEN` | View `/admin/leads` | Production, Preview | Yes |

**Steps:**

1. Open **Vercel** → select project → **Settings** → **Environment Variables**.
2. For each variable above, click **Add New** (or edit existing):
   - **Key:** use the exact name (e.g. `SUPABASE_SERVICE_ROLE_KEY`).
   - **Value:** paste the value (from Supabase Dashboard → Project Settings → API for URL and keys).
   - **Environments:** check **Production** and **Preview** so both use the same config.
   - **Sensitive:** enable for `SUPABASE_SERVICE_ROLE_KEY` and `ADMIN_DASH_TOKEN` so they are masked in logs.
3. **Redeploy** after changing env vars: **Deployments** → ⋮ on latest → **Redeploy** (or push a new commit).

If any of these are missing, the catalogue API may fall back to file storage or return 500; Vercel function logs will show `[catalogue-leads] env present: { hasUrl, hasServiceRole }`.

---

## E) Supabase table + RLS

If the table does not exist, run this in **Supabase Dashboard** → **SQL Editor**:

```sql
-- Catalogue lead capture for landlord PDF download.
create table if not exists catalogue_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  postcode text,
  company text,
  persona text,
  consent boolean default false,
  source text default 'landlord_catalogue'
);

create index if not exists idx_catalogue_leads_created_at on catalogue_leads (created_at desc);
create index if not exists idx_catalogue_leads_email on catalogue_leads (email);
```

Then run the RLS migration (or paste this in SQL Editor):

```sql
alter table catalogue_leads enable row level security;

create policy "no_public_select_on_catalogue_leads"
  on catalogue_leads for select to public using (false);

create policy "no_public_insert_on_catalogue_leads"
  on catalogue_leads for insert to public with check (false);
```

Inserts from the API use the **service role** key, so they bypass RLS and succeed. The anon key is not used for inserts.

---

## F) "This site can't be reached" / connection refused

- **Always use the exact URL printed by `npm run dev`** (e.g. `http://localhost:3000` or `http://localhost:3001`). The port can change if 3000 is in use.
- If the browser still can't connect:
  - **PowerShell:** `netstat -ano | findstr :3000` and `findstr :3001` to see which process holds the port.
  - Kill a stale Node process: `taskkill /PID <PID> /F` (use the PID from the last column).
  - Run `npm run dev` again and use the URL it prints.

---

## Network debug (when form shows "Unable to save lead")

If the form shows "Unable to save lead right now. Please try again.":

1. Open **DevTools** (F12) → **Network** tab.
2. Submit the catalogue form again.
3. Click the **POST** request to **`/api/catalogue-leads`**.
4. Note:
   - **Status code** (e.g. 200, 500).
   - **Response** tab → response body (JSON with `ok`, `error`, `message`).
5. In the **terminal where `npm run dev` is running**, look for:
   - `[catalogue-leads] SUPABASE_SERVICE_ROLE_KEY missing` or `NEXT_PUBLIC_SUPABASE_URL missing` → fix `.env.local`.
   - `[catalogue-leads] Supabase insert error:` → object with `message`, `code`, `details`, `hint` (use this to fix table/RLS or schema).

The API always returns JSON; the `error` field in the response body contains the server-side error message to help debug.

---

## Verification checklist

Use your actual port (e.g. **3000** or **3001**) and your real `ADMIN_DASH_TOKEN` value.

| # | Step | URL / action | Expected result |
|---|------|--------------|-----------------|
| 1 | Start dev server | `npm run dev` | Terminal shows `Local: http://localhost:PORT` |
| 2 | Open catalogue form | `http://localhost:PORT/landlords/catalogue` | Page loads, no red overlay |
| 3 | Submit form | Fill name, email, persona, consent → Submit | No crash; success message and download CTA |
| 4 | Check network | DevTools → Network → POST `/api/catalogue-leads` | Status **200**, body JSON with `ok: true` |
| 5 | With Supabase configured | Same submit | Response has `mode: "supabase"`; row appears in Supabase **Table Editor** → `catalogue_leads` |
| 6 | Admin without token | `http://localhost:PORT/admin/leads` | **403 Forbidden**, no lead data |
| 7 | Admin with token | `http://localhost:PORT/admin/leads?token=YOUR_ADMIN_DASH_TOKEN` | "Admin – Leads" page and leads table; if Supabase not configured, amber banner "Showing fallback storage" |
| 8 | No secrets in repo | `git status` / `git diff` | No `.env.local` or secret values in staged files |

**Exact URLs to test locally (replace PORT and token):**

- Catalogue form: **http://localhost:PORT/landlords/catalogue**
- Admin (with token): **http://localhost:PORT/admin/leads?token=YOUR_ADMIN_DASH_TOKEN**
- Admin (no token): **http://localhost:PORT/admin/leads**

---

## Production verification (Vercel + Supabase)

Replace `https://your-app.vercel.app` with your real Vercel deployment URL.

**Test the API with curl:**

```bash
# Bash / Git Bash (replace with your Vercel URL)
curl -s -X POST "https://your-app.vercel.app/api/catalogue-leads" \
  -H "Content-Type: application/json" \
  -d "{\"name\":\"Test Lead\",\"email\":\"test-$(date +%s)@example.com\",\"persona\":\"landlord\",\"consent\":true}"
```

```powershell
# PowerShell (replace with your Vercel URL)
$body = '{"name":"Test Lead","email":"test-' + [DateTimeOffset]::UtcNow.ToUnixTimeSeconds() + '@example.com","persona":"landlord","consent":true}'
Invoke-RestMethod -Uri "https://your-app.vercel.app/api/catalogue-leads" -Method POST -Body $body -ContentType "application/json"
```

**Expected success response (JSON):** `{"ok":true,"mode":"supabase","id":"..."}` or `{"ok":true,"mode":"supabase"}`.

**Or use the Node script (local or production):**

```bash
# Test local (default http://localhost:3000)
node scripts/test-catalogue-lead.mjs

# Test production
node scripts/test-catalogue-lead.mjs https://your-app.vercel.app
```

**Checklist:**

| # | Check | How to verify |
|---|--------|----------------|
| (a) | API returns JSON 200 | Run curl or script; response has `"ok":true` and status 200. |
| (b) | Row appears in Supabase | Supabase Dashboard → **Table Editor** → `catalogue_leads` → new row with same email. |
| (c) | Form success state appears | In browser: submit form at `/landlords/catalogue`; success message and download CTA show. |
| (d) | Admin page shows the lead | Open `https://YOUR_VERCEL_DOMAIN/admin/leads?token=YOUR_ADMIN_DASH_TOKEN`; new lead appears in the table (no "Showing fallback storage" banner if Supabase is configured). |

**Production logs (when something fails):** Vercel → your project → **Deployments** → click a deployment → **Functions** (or **Logs**). Filter or search for `[catalogue-leads]` to see `env present: { hasUrl, hasServiceRole }` and the Supabase insert error details.
