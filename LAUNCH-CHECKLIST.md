## A) Pre-flight (local)

- `npm install`
- `npm run build` (must pass)
- `npm run dev:clean`

## B) Core pages smoke test (local)

- `/estate-agents` -> page loads + CTAs work
- `/agent/onboarding` -> form displays + create agent works
- `/c/demo-agency` -> products visible, NO prices shown, enquiry CTA works
- submit enquiry on `/c/demo-agency` -> success message
- `/landlords/catalogue` -> PDF download works + lead capture works
- `/agent?token=...` -> pricing preview shows base/markup/commission
- `/agent/enquiries?token=...` -> new enquiry appears + status updates persist

## C) Data checks (DB)

- confirm enquiry row exists
- confirm catalogue lead row exists
- confirm agent created row exists

## D) Security checks

- verify `.env.local` not tracked: `git ls-files | findstr /i ".env"`
- verify `.gitignore` has env patterns
- confirm no secrets in repo via grep (names only checks)

## E) Deploy steps (Vercel)

- push to GitHub `main`
- import to Vercel
- set env vars (names only list):
  - `SHOPIFY_STORE_DOMAIN`
  - `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
  - `SHOPIFY_CLIENT_ID`
  - `SHOPIFY_CLIENT_SECRET`
  - `NEXT_PUBLIC_SUPABASE_URL`
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
  - `DATABASE_URL`
  - `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional)
  - `NEXT_PUBLIC_GA_ID` (optional)
  - `GA4_API_SECRET` (optional)
  - `NEXT_PUBLIC_HOTJAR_ID` (optional)
  - `NEXT_PUBLIC_CLARITY_ID` (optional)
  - `UBEE_ADMIN_EMAIL` (if used)
  - `SMTP_HOST` / `SMTP_PORT` / `SMTP_USER` / `SMTP_PASS` / `SMTP_FROM` (if email sending enabled)
- deploy
- run migrations via: `npm run db:deploy` (note: non-interactive)

## F) Post-deploy smoke test (production)

Repeat the Core pages smoke test on production URL.
