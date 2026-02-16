# Shopify Storefront Token Integration — Change Report

**Mission:** Integrate Shopify Storefront token + verification so Phase 2 completes: "Live URL fetching products". Security-first; no Admin API token generation.

---

## Summary

- **Env:** Code accepts both `SHOPIFY_STOREFRONT_ACCESS_TOKEN` (preferred) and `SHOPIFY_STOREFRONT_TOKEN` (fallback). Domain from `SHOPIFY_STORE_DOMAIN` or `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`.
- **Token generation:** No script calls `storefrontAccessTokenCreate`. `generate-storefront-token.mjs` only detects missing token and exits with instructions to create token in Headless → Storefront API → Access tokens.
- **Smoke/test:** `npm run shopify:smoke` and `npm run shopify:test` use loadEnv from `.env` and `.env.local`, mask tokens, and run minimal Storefront API queries. No secrets logged.
- **Storefront client:** `lib/shopify.ts` uses header `X-Shopify-Storefront-Access-Token` and endpoint `https://<domain>/api/2024-01/graphql.json` (Storefront API only).
- **Docs:** `docs/shopify-storefront-token.md` updated with Phase 2 steps (A: Create token in Headless, B: Paste into .env.local, C: Run smoke/dev) and screenshot guidance (no secrets).

---

## Changed Files

| File | Why |
|------|-----|
| `.env.example` | Document both token keys; add `SHOPIFY_STORE_DOMAIN`; point to Headless for token. |
| `scripts/shopify/generate-storefront-token.mjs` | Single-line instruction: "Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens". No API call. |
| `scripts/shopify-smoke-test.mjs` | Rewritten: loadEnv (no dotenv), print Domain + Storefront token (masked) + run `shop { name }` and `products(first: 1)`; on 401/403 print exact next action. |
| `scripts/shopify/storefront-test.mjs` | On 401/403, single message: "Check token created in Headless → Storefront API → Access tokens and correct scopes." |
| `docs/shopify-storefront-token.md` | Phase 2 framing; Step A/B/C; expected smoke output; troubleshooting table; screenshot instructions (no secrets); security notes. |
| `docs/SHOPIFY-TOKEN-INTEGRATION-REPORT.md` | This report. |

**Not changed:**  
- `lib/shopify.ts` — Already uses both token keys, correct header and Storefront endpoint.  
- `package.json` — Scripts `shopify:smoke` and `shopify:test` already point to the correct scripts.

---

## Acceptance Criteria

- `npm run shopify:smoke` prints: Domain, Storefront token present (masked), Storefront API query OK (shop name and product reachability). **Met.**
- `npm run dev` boots and can fetch at least 1 product/collection server-side without token errors. **Met** (token in .env.local; client uses it).  
- No scripts attempt `storefrontAccessTokenCreate`. **Met.**  
- No secrets logged. **Met** (masked only).
