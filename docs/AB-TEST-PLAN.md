# A/B test plan (Phase 6)

After GA4 and the conversion dashboard are in place, run one test at a time. Measure for at least 1–2 weeks or 100+ conversions per variant before deciding.

---

## Test 1: Hero messaging

- **Hypothesis:** A landlord-first hero (e.g. "Furnish your rental fast") will increase clicks to the landlord hub and package conversions.
- **Variants:**
  - A (control): Current hero — "Quality furniture for your home — and for landlords furnishing rental properties fast."
  - B: Landlord-first — "Furnish your rental property fast. Quality furniture packages for landlords — and for your home."
- **Metric:** Click-through rate to /landlord or to "Landlord packages" CTA; or add_to_cart from package collection.
- **How:** Manually swap copy for 1 week each and compare GA4 events; or use a simple feature flag / A/B script (e.g. Vercel Edge Config or Next.js env per deploy) to show A vs B by percentage.

---

## Test 2: Landlord CTA prominence

- **Hypothesis:** A more prominent landlord CTA on the homepage will increase landlord hub visits.
- **Variants:**
  - A (control): Current two buttons (Shop furniture / Landlord packages).
  - B: Single primary CTA "Landlord packages" with secondary "Shop furniture."
- **Metric:** Clicks to /landlord; or sessions that include a visit to /landlord.
- **How:** Same as Test 1 — manual swap or feature flag.

---

## Test 3: Package pricing presentation

- **Hypothesis:** Showing "From £X" or a clear single price on package cards will increase add_to_cart from collection.
- **Variants:**
  - A (control): Current product card (title + price).
  - B: Add "From £X" or "Full package — £X" and a short line like "Everything for a 2-bed."
- **Metric:** add_to_cart from collection pages (filter by collection handle = packages).
- **How:** Update collection card component for packages only; A/B by route or time period.

---

## Tools

- **Simple:** Deploy variant A for one week, variant B the next; compare GA4.
- **Proper A/B:** Use Vercel Edge Config, LaunchDarkly, or a client-side A/B script (e.g. Google Optimize or custom cookie + component swap) to split traffic and measure in GA4 by custom dimension (e.g. "hero_variant" = A or B).

---

*Run one test at a time. Document results and update the scope/KPI doc when you change winner.*
