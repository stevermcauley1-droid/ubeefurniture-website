# Phase 2 — DO THIS NOW (Storefront token + verify)

Security: never commit `.env.local`. Never paste the token into chat or docs. Scripts show token **masked** only.

---

## Required env keys (used by Storefront client)

| Key | Purpose |
|-----|--------|
| `SHOPIFY_STORE_DOMAIN` | Store domain (no https) |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | Same, for client-side if needed |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | **Token from Headless** (preferred) |
| `SHOPIFY_STOREFRONT_TOKEN` | Fallback key; app reads this if ACCESS_TOKEN not set |

**Storefront client** (`lib/shopify.ts`) reads: `SHOPIFY_STOREFRONT_ACCESS_TOKEN` **or** `SHOPIFY_STOREFRONT_TOKEN`.

---

## 1. Get the token (exact human steps)

1. Open **Shopify Admin**: https://ubee-furniture.myshopify.com/admin
2. Go to **Apps and sales channels** → **Headless**.
3. Select **"Ubee Furniture Headless"** (or the Headless app for this store).
4. Click **Manage API access**.
5. Under **Storefront API**, click **Manage** → **Create access token** (or **Access tokens** → **Create**).
6. Ensure these scopes are ticked (minimum):
   - `unauthenticated_read_product_listings`
   - `unauthenticated_read_product_inventory`
   - `unauthenticated_write_checkouts`
   - `unauthenticated_read_checkouts`
7. Click **Create** → **Copy token** (copy once; you may not see it again).

---

## 2. Prepare `.env.local` (never commit)

- `.env.local` is in `.gitignore` and is **not** committed.
- In the **project root**, open or create **`.env.local`** and add or ensure these lines (replace the placeholder with your token):

```
SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
# Paste token from Shopify Admin → Headless → Storefront API → Create access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=__PASTE_TOKEN_HERE__
```

Replace `__PASTE_TOKEN_HERE__` with the token you copied. Save the file.

---

## 3. Verification commands (run after pasting token)

**3.1** Stop any running dev server (Ctrl+C in the terminal where `npm run dev` is running).

**3.2** Smoke test:
```
npm run shopify:smoke
```
Or: `npm run shopify:test`

**3.3** Start dev server:
```
npm run dev
```

**3.4** Confirm success:
- Smoke output shows: **Storefront token: present** (masked).
- Smoke output shows: **Storefront API query: OK** (shop name or product count).
- In the browser: homepage or collections load products with no 401/403.

---

## 4. If something fails — checklist

| Symptom | What to check |
|--------|----------------|
| **401 or 403** | Wrong token or missing scopes. In Headless → Storefront API, recreate the token with all four scopes. Paste the **new** token into `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in `.env.local`. |
| **Domain mismatch** | In `.env.local`, use exactly: `SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com` (no https, no path). |
| **Empty token / Missing** | Use **SHOPIFY_STOREFRONT_ACCESS_TOKEN** in `.env.local`. Restart terminal / dev server after editing. |
| **Wrong token type** | Do not use `shpss_` or `shpat_`. Use only the **Storefront** token from Headless → Storefront API → Create access token. |

---

## DO THIS NOW (short version)

1. **Get token:** Shopify Admin → Headless → (Ubee Furniture Headless) → Manage API access → Storefront API → Manage → Create access token → tick the four scopes → Create → Copy token.

2. **Paste into `.env.local`:** In project root, set `SHOPIFY_STOREFRONT_ACCESS_TOKEN=<your token>`. Keep `SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com` and `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com` if not already set.

3. **Run:** `npm run shopify:smoke` then `npm run dev`.

4. **Confirm:** Smoke shows "Storefront token: present" and "Storefront API query: OK"; site loads products with no 401/403.

No secrets in logs; token is only ever shown masked.
