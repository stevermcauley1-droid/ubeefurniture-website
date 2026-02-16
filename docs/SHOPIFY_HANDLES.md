# Shopify Handles (Source of Truth)

Generated: 2026-02-16T12:34:13.032Z

## Collections

**Note:** Collections are now fetched dynamically at runtime. The navigation menu (`MegaMenu`) uses real Shopify collections via `getCollections()` API.

To fetch current handles, run:
```bash
node scripts/shopify/fetch-handles.mjs
```

## Products

**Note:** Products are fetched dynamically. Use the Storefront API queries in `lib/shopify.ts`:
- `getProducts()` - List products
- `getProductByHandle(handle)` - Get single product

---

**Architecture:** Navigation no longer uses hardcoded handles. All collection/product links are generated from Shopify data at runtime.
