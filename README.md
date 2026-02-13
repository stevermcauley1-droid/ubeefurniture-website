# Ubee Furniture — Headless Shopify + Next.js

Tier 1 scope and build plan: [docs/SCOPE-AND-KPI.md](docs/SCOPE-AND-KPI.md).  
Shopify setup: [docs/SHOPIFY-SETUP-RUNBOOK.md](docs/SHOPIFY-SETUP-RUNBOOK.md).

## Setup

1. Copy `.env.example` to `.env` and set:
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` — e.g. `your-store.myshopify.com`
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` — Storefront API token from Shopify admin
2. `npm install`
3. Run `npm run shopify:smoke` to verify your token
4. `npm run dev` — open [http://localhost:3000](http://localhost:3000)

## Shopify tokens: Storefront vs Admin vs app secret

| Token type | Format | Where to get it | Use case |
|------------|--------|-----------------|----------|
| **Storefront API** | Long string (or `shpat_` from custom app) | Custom App → Storefront API integration → reveal Storefront access token | Products, cart, checkout (recommended) |
| **Admin API** | From OAuth or client credentials | Custom App → Admin API credentials | Backend/admin only; optional fallback for catalog |
| **App secret** | `shpss_...` | Custom App → Client secret | **Never paste in .env** — used for OAuth only |

**Fast path:** Create a Custom App (Settings → Apps → Develop apps → Create app). In its **Storefront API integration** section, reveal the Storefront access token. Paste it into `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in `.env.local`.

**Do not paste `shpss_` (app secret) anywhere.** That is not a Storefront token and will cause errors.

## Smoke test

Run `npm run shopify:smoke` to diagnose token issues. It will tell you:
- If Storefront token is OK
- If you pasted the wrong token type (e.g. app secret)
- Exact next steps if something is missing

## Deploy to Vercel

1. Push this repo to GitHub (or connect Vercel to your Git provider).
2. In Vercel: New Project → Import this repo.
3. Add environment variables: `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN`.
4. Deploy. Every branch gets a preview URL; production uses the main branch.

**Phase 2 proof:** After deploy, open the live URL. The homepage should show products and collections from your Shopify store. If you see an error panel, run `npm run shopify:smoke` locally and follow the output.
