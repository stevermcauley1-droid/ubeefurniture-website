# Supabase verification (local and Vercel)

Use this to confirm the app is using Supabase env vars and can reach Supabase in production.

---

## Where env vars should exist

| Variable | Local | Vercel (Production / Preview) |
|----------|------|-------------------------------|
| `NEXT_PUBLIC_SUPABASE_URL` | `.env.local` | Project → Settings → Environment Variables |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `.env.local` | Same |
| `SUPABASE_SERVICE_ROLE_KEY` | `.env.local` (server-only) | Same (mark Sensitive) |

- **Client-side** uses only `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`.
- **Server-side** (e.g. catalogue-leads API) may also use `SUPABASE_SERVICE_ROLE_KEY`; it is never sent to the client.

---

## Health endpoint (no secrets)

**URL:** `GET /api/health/supabase`

Returns JSON:

- `ok`: `true` if Supabase is reachable with current env; `false` otherwise.
- `env`: `{ hasNextPublicUrl, hasNextPublicAnonKey, hasServerUrl, hasServiceRole }` (booleans only).
- `timestamp`: ISO string.
- On failure: `error` and `message` (sanitized; no keys or stack traces).

**Test locally:**

```bash
curl -s http://localhost:3000/api/health/supabase
```

**Test production:**

```bash
curl -s https://YOUR_VERCEL_DOMAIN/api/health/supabase
```

---

## Debug banner (?debug=supabase)

To see a quick “Supabase: OK” or “Supabase: FAIL” on the site:

1. Add `?debug=supabase` to any page URL (e.g. homepage).
2. A small banner appears at the bottom showing status.
3. It calls `/api/health/supabase` and displays the result; it does not expose keys.

**Example:**

- Local: `http://localhost:3000/?debug=supabase`
- Production: `https://YOUR_VERCEL_DOMAIN/?debug=supabase`

Remove the query param to hide the banner.

---

## What “OK” means

- **OK:** The app has `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and a minimal request to Supabase (anon) succeeded. For the health check we query a nonexistent table; “relation does not exist” is treated as success (we reached the DB).

---

## Common errors and fixes

| Symptom | Likely cause | Fix |
|--------|---------------------|-----|
| `env.hasNextPublicUrl: false` or `hasNextPublicAnonKey: false` | Missing env vars | Add them in Vercel (Settings → Environment Variables) and redeploy. |
| `ok: false` with “fetch failed” / network error | Wrong URL or network | Check `NEXT_PUBLIC_SUPABASE_URL` (e.g. `https://xxxx.supabase.co`). |
| `ok: false` with invalid JWT / auth error | Wrong or expired anon key | Copy the **anon (public)** key again from Supabase → Project Settings → API. |
| Catalogue leads still fail while health is OK | Service role missing or wrong | Ensure `SUPABASE_SERVICE_ROLE_KEY` is set in Vercel (and that the catalogue_leads table exists). |

---

## Steps to verify

1. **Local:** Set `.env.local` with the three vars above, run `npm run dev`, then:
   - `curl -s http://localhost:3000/api/health/supabase` → expect `"ok":true`.
   - Open `http://localhost:3000/?debug=supabase` → banner shows “Supabase: OK”.
2. **Vercel:** Add the same vars in Environment Variables (Production + Preview), redeploy, then:
   - `curl -s https://YOUR_VERCEL_DOMAIN/api/health/supabase` → expect `"ok":true`.
   - Open `https://YOUR_VERCEL_DOMAIN/?debug=supabase` → banner shows “Supabase: OK”.
