# Storefront API token — human steps (Phase 2)

Get a **Storefront API** access token from Shopify Admin **Headless** (no Admin API, no passwords).  
Use it only in `.env.local`; never commit or log it.

---

## DO THIS NOW

**1. Get the token (exact path)**  
Shopify Admin → **Headless** → select **Ubee Furniture Headless** → **Manage API access** → **Storefront API** → **Manage** → **Create access token**.  
Tick these scopes (minimum):  
`unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`  
→ **Create** → **Copy token**.

**2. Paste into `.env.local`**  
In the project root, open `.env.local` and ensure these lines exist (add if missing). Replace `__PASTE_TOKEN_HERE__` with the token you copied:

```
SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
# Paste token from Shopify Admin → Headless → Storefront API → Create access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=__PASTE_TOKEN_HERE__
```

**3. Run these commands (in order)**  
Stop any running dev server, then:

```bash
npm run shopify:smoke
npm run dev
```

**4. Confirm success**  
- Smoke output shows: **Storefront token: present** (masked) and **Storefront API query: OK** (shop name or product count).  
- Open http://localhost:3000 (or 3001 if 3000 is in use). Homepage/collections load products with **no 401/403** errors.

**Required env keys used by the Storefront client:**  
`SHOPIFY_STORE_DOMAIN`, `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`, `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (or fallback `SHOPIFY_STOREFRONT_TOKEN`). Never commit `.env.local`; scripts only show the token masked.

---

## 1. Exact UI path (click sequence)

**Shopify Admin** → **Headless** → (select **Ubee Furniture Headless**) → **Manage API access** → **Storefront API** → **Manage** → **Create access token**

Step by step:

1. Log in to **Shopify Admin**: `https://ubee-furniture.myshopify.com/admin`
2. Go to **Apps and sales channels** → **Headless**
3. Select **Ubee Furniture Headless** (or the Headless app for this store)
4. Click **Manage API access**
5. Under **Storefront API**, click **Manage** → **Access tokens** → **Create access token** (or **Reveal** / **Copy** existing)

---

## 2. Create or reveal the token

- If no token exists: click **Create token** (or equivalent).
- If a token exists: **Reveal** / **Copy** (you may only see it once).
- **Required scopes** for this app (Headless usually grants these by default):
  - `unauthenticated_read_product_listings`
  - `unauthenticated_read_product_inventory`
  - `unauthenticated_write_checkouts`
  - `unauthenticated_read_checkouts`
  - Optional: `unauthenticated_read_product_tags` (for product tags)

If the UI shows scope checkboxes, ensure at least the first four are enabled so products and checkout work. Do **not** use Admin API token creation (`storefrontAccessTokenCreate`) — create the token in this UI only.

---

## 3. Copy the token once

- Copy the **Storefront API access token** (long string; not the app secret `shpss_` and not an Admin token `shpat_`).
- Paste it **only** into `.env.local` in the project root (see below).
- Never paste it into git, docs, or logs.

---

## 4. Paste into .env.local (never commit)

In the project root, create or edit **`.env.local`** (this file is in `.gitignore` and must not be committed). Ensure these lines exist (add the comment so you know where the token comes from):

```
SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
# Paste token from Shopify Admin → Headless → Storefront API → Create access token
SHOPIFY_STOREFRONT_ACCESS_TOKEN=__PASTE_TOKEN_HERE__
```

Replace `__PASTE_TOKEN_HERE__` with the token you copied.

Use the **exact** key: **SHOPIFY_STOREFRONT_ACCESS_TOKEN**.  
(Alternatively the app accepts **SHOPIFY_STOREFRONT_TOKEN** as a fallback.)

---

## 5. Verify (no secrets in logs)

Stop any running dev server (e.g. Ctrl+C in the terminal where `npm run dev` is running). Then run in the project root:

```
npm run shopify:smoke
```

Then:

```
npm run dev
```

**Success:** Smoke shows "Storefront token: present" (masked) and "Storefront API query: OK". Homepage/collections load products with no 401/403.  
If you see **401** or **403**, use the diagnosis checklist below.

---

## If verification fails (401/403 or empty products)

| Check | Action |
|--------|--------|
| **Wrong token** | Use the **Storefront** token from **Headless → Storefront API → Access tokens**. Do not use app secret (`shpss_`) or Admin API token (`shpat_`). |
| **Missing scopes** | In Headless, **recreate** the access token and tick: `unauthenticated_read_product_listings`, `unauthenticated_read_product_inventory`, `unauthenticated_write_checkouts`, `unauthenticated_read_checkouts`. Then paste the new token into `.env.local`. |
| **Domain mismatch** | In `.env.local`, set `SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com` and `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com` (no `https://`, no path). |
| **Empty token / env key** | Ensure the key is exactly `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (or `SHOPIFY_STOREFRONT_TOKEN`). No spaces around `=`. Restart terminal and run `npm run shopify:smoke` again. |

---

## Security

- Do not put the token in any tracked file or in git.
- Scripts only show the token **masked** (e.g. first 4 + last 4 characters); never the full value.

---

## Quick reference (after you have the token)

**Paste token into `.env.local` as:**

```bash
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<token>
```

**Then run:**

```bash
npm run shopify:smoke
npm run dev
```

If you see **401** or **403**, use the diagnosis checklist in the section above.
