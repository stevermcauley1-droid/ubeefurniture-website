# Conversion dashboard (Phase 6)

Use this as your baseline for a weekly conversion rhythm. Recreate in Google Sheets, Looker Studio, or your BI tool.

## GA4 events

| Event | When | Where |
|-------|------|--------|
| view_item | User views product page | Product page |
| add_to_cart | User adds to cart | AddToCartButton |
| begin_checkout | User clicks Proceed to checkout | Cart page |
| purchase | Order completed | Shopify thank-you (link GA4 or Shopify integration) |

Purchase fires on Shopify Checkout. Link GA4 to Shopify or use measurement protocol so purchases attribute to the same site.

## Weekly metrics

- Sessions (GA4)
- Conversion rate (purchases / sessions, or begin_checkout / sessions as proxy)
- AOV (Shopify or GA4)
- add_to_cart and begin_checkout counts
- Top traffic sources, bounce rate

Review weekly vs baseline in SCOPE-AND-KPI.md. Optional: Hotjar or Clarity for heatmaps and session replay.
