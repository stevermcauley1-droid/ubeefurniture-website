# Shopify Storefront API token (static)

This project uses a **static** Storefront API access token from a Shopify Custom App. No token generation or Admin OAuth is used.

## Where to get the token

1. Go to **Shopify Admin** → **Settings** → **Apps and sales channels**
2. Click **Develop apps** (or enable custom app development if needed)
3. Create an app or open an existing Custom App
4. Open **Configuration** → **Storefront API integration**
5. Enable Storefront API access and configure scopes (e.g. read products, read/write checkouts)
6. Click **Reveal token once** and copy the token

## Add to .env.local

```
SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com
SHOPIFY_STOREFRONT_ACCESS_TOKEN=<paste token>
```

## Verify

```bash
npm run shopify:test
```

Expected: `OK: ubee furniture` (or your shop name)

## Restart dev server

After editing `.env.local`:

```bash
npm run dev
```

## Troubleshooting

### Storefront 401/403

- **Token missing:** Add `SHOPIFY_STOREFRONT_ACCESS_TOKEN` to `.env.local`
- **Wrong token:** Use the token from Storefront API integration, not the app secret (`shpss_`) or Admin token
- **Wrong endpoint:** Storefront uses `/api/{version}/graphql.json`, not `/admin/api/...`
