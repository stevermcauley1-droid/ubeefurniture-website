# Shopify tokens: static Storefront setup

This project uses a **static** Storefront API access token. No token generation or Admin OAuth is used.

## Required environment variables

| Variable | Where to get it |
|----------|-----------------|
| `SHOPIFY_STORE_DOMAIN` | Your store domain (e.g. `ubee-furniture.myshopify.com`) |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | Custom App → Storefront API integration → reveal token |

## Where the token is used

The token is sent as `X-Shopify-Storefront-Access-Token` when calling the Storefront GraphQL API at:

`https://{SHOPIFY_STORE_DOMAIN}/api/2024-01/graphql.json`

## Commands

- **`npm run shopify:test`** — Verifies the Storefront token. Prints `OK: <shop name>` on success.
- **`npm run shopify:smoke`** — Full smoke test (domain, token, etc.).

## Security

- Never commit `.env` or `.env.local`.
- Never log `SHOPIFY_STOREFRONT_ACCESS_TOKEN` to the console.
- Do not paste the app secret (`shpss_`) or Admin token — use only the Storefront API token.
