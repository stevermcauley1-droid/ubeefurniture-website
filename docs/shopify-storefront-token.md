# Shopify Storefront API token (Phase 2 — Live URL fetching products)

This guide completes **Phase 2** of the Ubee Furniture Build Plan: **Live URL fetching products**.  
Static Storefront API token from the **Headless** sales channel. No Admin API token generation (`storefrontAccessTokenCreate` is not used).

---

## Step A — Create token in Headless sales channel

1. In **Shopify Admin**, go to **Apps and sales channels** → **Headless**.
2. Open **Storefront API** → **Manage** → **Access tokens**.
3. Create or reveal a token and copy it.  
   - Use the **Storefront** access token (copyable from the Headless channel).  
   - Do **not** use app secret (`shpss_`) or Admin API token (`shpat_`).

**Screenshot guidance (no secrets):**  
Navigate to **Headless** → **Storefront API** → **Access tokens**. Take a screenshot of the page layout only; do **not** include the token value in any screenshot or log.

---

## Step B — Paste into .env.local

In the project root, create or edit `.env.local` (this file is never committed):

```env
SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<paste token>
```

**Supported env keys:**  
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (preferred)  
- `SHOPIFY_STOREFRONT_TOKEN` (fallback)

Optional: `SHOPIFY_ADMIN_CLIENT_ID` / `SHOPIFY_ADMIN_CLIENT_SECRET` are not required for the Storefront flow and do not block it.

---

## Step C — Verify and run

**1. Smoke test (env + token + API):**

```bash
npm run shopify:smoke
```

Expected output:

- `Domain: ubee-furniture.myshopify.com`
- `Storefront token: present (masked)`
- `Storefront API query: OK (shop name: …)`
- `Storefront API query: OK (at least N product(s) reachable)`
- `✅ Smoke test passed.`

**2. Storefront test:**

```bash
npm run shopify:test
```

Expected: `OK: <shop name>` and optionally a collection handle.

**3. Dev server:**

```bash
npm run dev
```

The live URL should fetch products/collections server-side without token errors.

---

## Troubleshooting

| Issue | Action |
|-------|--------|
| Token missing | Create token in **Headless → Storefront API → Manage → Access tokens**; add to `.env.local`. |
| 401 / 403 | Check token from **Headless → Storefront API → Access tokens** and correct scopes. |
| Wrong type | Do not use `shpss_` or `shpat_`. Use the Storefront token from Headless only. |
| Endpoint | Storefront uses `https://<store>/api/2024-01/graphql.json` (not Admin API). |

---

## Security

- Do not log or commit the token. Scripts show masked values only.
- Do not use `storefrontAccessTokenCreate`; use the copyable token from Headless.
- Keep `.env.local` in `.gitignore` and never commit it.
