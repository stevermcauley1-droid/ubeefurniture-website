# Shopify env setup (collections & products)

To load **collections** and **product** data from Shopify:

1. **Copy the template**  
   Use `docs/env.local.phase2.template` — copy the variables into `.env.local` in the project root.

2. **Set your store domain**  
   - `SHOPIFY_STORE_DOMAIN` and `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`  
   - Example: `ubee-furniture.myshopify.com`

3. **Add a Storefront API token**  
   - In Shopify Admin: **Headless** → **Storefront API** → **Create access token**  
   - Put the token in `SHOPIFY_STOREFRONT_ACCESS_TOKEN` in `.env.local`  
   - Do **not** use an app secret (`shpss_...`); use the Storefront token from that page.

4. **Restart the dev server** after changing `.env.local`.

Without these, the site still runs: the homepage and nav work, but **Collections** and **Products** show a friendly “configure Storefront API” message instead of 500 errors.
