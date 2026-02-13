# Phase 1 — Shopify Foundation Runbook

Use this checklist so the store is the **source of truth** for products, inventory, and checkout. Proof of done: create a test cart in Shopify and complete a test checkout.

---

## 1. Store setup

- [ ] Create or confirm Shopify store (Standard plan is fine for headless MVP; Plus not required).
- [ ] Store is live and accessible.

---

## 2. Product model (minimum viable, correct)

### Collections

- [ ] Create collections, e.g.:
  - Sofas
  - Beds
  - Dining
  - Packages (for landlord bundles)
- [ ] At least one collection has at least one product (required for Phase 2 proof).

### Product variants

- [ ] Where needed: options for fabric, colour, size (or equivalent).
- [ ] Variants have correct pricing and SKU/inventory if used.

### Metafields (Shopify admin: Settings → Custom data)

- [ ] **Product metafields** (for specs, landlord tagging, delivery):
  - Dimensions (e.g. `product.specs.dimensions` — single line or JSON).
  - Landlord tag / “suits rentals” (e.g. `product.attributes.landlord_suitable` — boolean or single line).
  - Delivery / lead time (e.g. `product.shipping.lead_time` — single line).
- [ ] Metafield definitions created and attached to products where needed.

---

## 3. Policies, shipping, taxes, payments

- [ ] **Policies:** Refunds, privacy, terms of service (and shipping if applicable) created and linked.
- [ ] **Shipping:** Zones and rates configured (or “free shipping” / flat rate as needed).
- [ ] **Taxes / VAT:** Tax settings correct for your region (e.g. VAT-inclusive or -exclusive).
- [ ] **Payments:** Shopify Payments or alternative enabled; test mode available for staging.

---

## 4. Accelerated checkouts

- [ ] **Shop Pay** enabled (if available in your region).
- [ ] **Apple Pay** enabled (if available).
- [ ] Any other express checkouts you need are enabled.

---

## 5. Storefront API (required for headless)

- [ ] In Shopify admin: **Settings → Apps and sales channels → Develop apps** (or “Develop apps for your store”).
- [ ] Create an app (e.g. “Headless storefront”) or use an existing custom app.
- [ ] Configure **Storefront API** access:
  - [ ] Enable “Read product listings and collections”, “Read product inventory”, “Read checkouts”, “Write checkouts”, “Read customer information” (if needed), “Read and write cart” (if using cart transform).
  - [ ] Or enable the **Storefront API** scopes your headless app will use: at minimum read products/collections, write/read checkouts.
- [ ] Install the app on the store (or use a custom app that’s already installed).
- [ ] Copy the **Storefront API access token** (starts with `shpat_` or similar). Keep it secret.
- [ ] Note your **store domain** (e.g. `your-store.myshopify.com`).

---

## 6. Proof of Phase 1 done

- [ ] Create a test cart in Shopify (add a product, go to checkout).
- [ ] Complete a test checkout (use a test payment method if available).
- [ ] Storefront API token and store domain are saved in a secure place (e.g. password manager or env template); they will be used in Phase 2 as `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` and `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (or similar).

---

*Next: Phase 2 — use the store domain and Storefront token in the Next.js app env and GraphQL client.*
