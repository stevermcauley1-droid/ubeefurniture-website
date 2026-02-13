# Ubee Furniture — Tier 1 Scope & KPI Baseline

**One-page scope (launch-critical only). Baseline metrics to prevent feature sprawl.**

---

## Phase 0 — Strategic lock-in (locked)

**Primary buyer archetypes:**
- **Landlords** — bulk, speed, price certainty
- **Home movers** — visual confidence, inspiration

**Core value prop (one-line, non-negotiable):**
> Furnished fast. Priced right. Built for rentals.

**Exit gate:** Metrics documented below. No build without this.

---

## Tier 1 scope (in scope for MVP)

| # | Deliverable | Definition of done |
|---|-------------|--------------------|
| 1 | **Homepage** | Hero (landlord + retail), category entry, landlord packages highlight, reviews/trust strip, featured collections. |
| 2 | **Collection pages** | Filters + sort (basic), fast grid, lazy loading. |
| 3 | **Product page** | Gallery, variants, specs, delivery clarity, “Why this suits rentals” if landlord-tagged, FAQ + reviews. |
| 4 | **Cart** | Upsells (“You may also like”), clear delivery/lead time note. |
| 5 | **Checkout handoff** | Use Shopify Checkout only; create checkout via Storefront API and redirect. No custom checkout. |
| 6 | **Landlord hub** | Single page: “Furnish a property fast”, packages list, lead capture / quote request. |
| 7 | **Package landing pages** | 1–3 package landing pages (packages as Shopify products — Option A). |
| 8 | **Core SEO + schema** | Clean URLs, sitemap, robots, canonicals, Product/Breadcrumb/FAQ structured data. |
| 9 | **Analytics baseline** | GA4 with e‑commerce events; one conversion dashboard. |

**Source of truth:** Products, inventory, and checkout live in Shopify. Front end is read + cart/checkout handoff only.

---

## Out of scope for MVP (Phase 7+)

- Custom checkout (we use Shopify Checkout only).
- “Build a package” UI (Option B) — only after Option A is live and validated.
- AR / 3D (best-selling SKUs first, after MVP is selling).
- AI personalisation (recommendations, segments, abandoned cart).
- Omnichannel (Click & Collect, virtual showroom, WhatsApp commerce).
- Loyalty + customer accounts (retention).
- Any feature not listed in Tier 1 above.

---

## KPI baseline (record here or in linked sheet/dashboard)

Capture once at project start. Update weekly once live.

| Metric | Baseline (pre-launch / current) | Target (post-MVP) | Notes |
|--------|---------------------------------|-------------------|-------|
| Conversion rate | _____% | _____% | |
| AOV | £_____ | £_____ | |
| Bounce rate | _____% | _____% | |
| Top traffic sources | 1. _____ 2. _____ 3. _____ | — | |
| Mobile speed (LCP / CLS) | _____ ms / _____ | — | e.g. PageSpeed Insights |

**Place to track:** This table, or a Google Sheet / Looker Studio dashboard linked here: _______________

---

*Last updated: [Date]. Every feature must tie back to Tier 1; no Phase 7+ work until MVP is selling.*
