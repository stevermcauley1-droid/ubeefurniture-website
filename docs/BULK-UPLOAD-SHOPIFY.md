# Bulk upload products, images, and prices to Shopify

This doc describes how **uBee / Ubee Automation** and Shopify work together for bulk product uploads.

## Overview

1. **Source data**: Furniture To Go (FTG) product CSV (and optional Dropbox image base URL).
2. **Pipeline**: Normalize → Build Shopify payloads → Import to Shopify (create/update products, attach images, optionally publish to channels).
3. **Result**: Products appear in Shopify and, when published, on your Headless storefront and Online Store.

## Prerequisites

- **`.env.local`** (never commit):
  - `SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com`
  - `SHOPIFY_ADMIN_API_TOKEN=<your Admin API token>` (from Develop apps → Ubee Automation → API credentials)
  - Optional: `FTG_DROPBOX_BASE_URL=<Dropbox folder URL>` for product images (e.g. `https://www.dropbox.com/scl/fo/.../000%20Dining%20Sets`). If omitted, products are created without images; you can add images later or set this and re-run.

- **FTG product CSV**: Place your FTG details CSV in the project root (e.g. `Product Details for ALL PRODUCTS.csv`) or set `FTG_DETAILS_CSV_PATH` / `FTG_CSV_PATH` in `.env.local`.

## One-command bulk upload

From the project root:

```bash
npm run ftg:import:dropbox
```

This runs:

1. **Normalize** – Reads the FTG CSV, detects headers, normalizes columns (SKU, title, description, dimensions, categories, image URLs). Outputs `data/ftg/ftg-normalized.jsonl`.
2. **Build** – Converts normalized data into Shopify-ready product/variant/image payloads. If `FTG_DROPBOX_BASE_URL` is set, image URLs are built as `{base}/{SKU}_1.jpg?raw=1`, etc. Outputs `data/ftg/shopify-products.jsonl`, `shopify-variants.jsonl`, `shopify-images.jsonl`.
3. **Import** – Creates or updates products in Shopify (by SKU/handle), attaches images from the build step, and **publishes each product to Headless and Online Store** so they show in your storefront and in the Products list with channels > 0.

Results are written to `data/ftg/shopify-import-results.jsonl` and `shopify-import-report.md`.

## Step-by-step (more control)

```bash
# 1. Normalize FTG CSV
npm run ftg:normalize

# 2. Build Shopify payloads (optional: set FTG_DROPBOX_BASE_URL for images)
npm run ftg:build-shopify

# 3. Dry-run import (no writes)
npm run ftg:import:dry

# 4. Apply import (with optional publish to Headless + Online Store)
node scripts/import/ftg/import-to-shopify.mjs --apply --limit=0 --publish
```

- Use `--limit=50` or `--limit=250` to process a subset; use `--offset=250` to skip the first 250.
- Omit `--publish` if you only want to create/update products without publishing to sales channels.

## Images

- **With Dropbox**: Set `FTG_DROPBOX_BASE_URL` to the folder URL that contains images named `{SKU}_1.jpg`, `{SKU}_2.jpg`, etc. The builder will generate image URLs and the importer will attach them via `productCreateMedia`.
- **Without Dropbox**: Leave `FTG_DROPBOX_BASE_URL` unset. Products are created/updated without media; you can add images later in Shopify Admin or run a future import with the env var set.

## Prices

- Variant **price** is not set by the current import (Shopify’s product create input in use does not accept variant price in the same mutation). To set prices in bulk you can:
  - Use Shopify Admin → Products → Edit each product, or
  - Use a separate script or CSV import that updates variant prices via the Admin API (e.g. `productVariantsBulkUpdate` where available), or
  - Use the FTG price feed and a custom step that maps SKU → price and calls the API.

## Publishing (Channels)

- The importer’s **`--publish`** flag publishes each created/updated product to **Headless** and **Online Store** so they appear in your storefront and in the Products table with channels > 0.
- Your Admin API token must have **`write_publications`** scope (Develop apps → Ubee Automation → Configuration → Admin API integration).

## Troubleshooting

| Issue | What to do |
|-------|------------|
| "Missing SHOPIFY_ADMIN_API_TOKEN" | Add the token from Develop apps → Ubee Automation → API credentials to `.env.local`. |
| "Access denied" / 401 on import | Ensure the token has `read_products`, `write_products`, and for publish: `read_publications`, `write_publications`. Regenerate the token after changing scopes. |
| Products created but "Channels: 0" | Run the import with `--publish`, or in Shopify Admin manually add products to the Headless (and Online Store) channel. |
| No images on products | Set `FTG_DROPBOX_BASE_URL` to the folder URL; image filenames must be `{SKU}_1.jpg`, `{SKU}_2.jpg`, etc. If Dropbox shared links show broken images in Shopify, use **direct** links (e.g. `https://dl.dropboxusercontent.com/...`) or host images on a CDN and put that base URL in env. Re-run normalize → build → import. |
| Collections show 0 products | Smart collections use "Product type is equal to X" and "Product tag is equal to Y". The builder now sets `product_type` and tags from FTG categories (e.g. Dining, Beds, Sofas). Re-run **build** then **import** so updated product_type/tags are pushed to Shopify. In Shopify Admin, ensure each collection is assigned to the right sales channel. |
| Prices all £0.00 | Use Shopify Admin or a separate price-update script; see Prices above. |

## Files reference

| Path | Purpose |
|------|--------|
| `data/ftg/ftg-normalized.jsonl` | Normalized FTG rows (one JSON object per line). |
| `data/ftg/shopify-products.jsonl` | Product-level payloads for Shopify. |
| `data/ftg/shopify-variants.jsonl` | Variant-level payloads (SKU, etc.). |
| `data/ftg/shopify-images.jsonl` | Image URL + position per SKU. |
| `data/ftg/shopify-import-results.jsonl` | Per-SKU result of last import (created/updated/error). |
| `data/ftg/shopify-import-report.md` | Summary (processed, created, updated, published, failed). |
