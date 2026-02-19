# Quick Setup: Create Collections via API

## Prerequisites

1. **Admin API Access Token** with `write_products` scope
   - Go to: https://ubee-furniture.myshopify.com/admin/settings/apps/development
   - Create a custom app or use an existing one
   - Enable `write_products` scope
   - Copy the Admin API access token (starts with `shpat_`)

2. **Add to `.env.local`:**
   ```bash
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_your_token_here
   ```

## Run the Script

```bash
npm run collections:create
```

## What It Creates

The script will create 8 automated collections:

1. **Sofas** - Products tagged with "sofa"
2. **Beds** - Products tagged with "bed"
3. **Mattresses** - Products tagged with "mattress"
4. **Wardrobes** - Products tagged with "wardrobe"
5. **Dining** - Products tagged with "dining"
6. **Package Deals** - Products tagged with "package"
7. **Landlord Packs** - Products tagged with "landlord"
8. **Sale** - Products with compare at price set (IS_PRICE_REDUCED)

## Collection Rules

- All collections use **OR logic** (any matching rule includes the product)
- Collections are automatically **published to Online Store**
- Duplicate collections are skipped (checks by title/handle)

## Verification

After running the script:

1. **Check in Shopify Admin:**
   - https://ubee-furniture.myshopify.com/admin/collections

2. **Verify via script:**
   ```bash
   npm run collections:verify
   ```

3. **Check on website:**
   - http://localhost:3001/collections

## Notes

- The **Sale** collection uses `IS_PRICE_REDUCED` rule, which matches products where `compareAtPrice` is set (typically means on sale)
- Products synced via `npm run ftg:sync:shopify` will automatically get tags like "sofa", "bed", etc., so they'll appear in the correct collections
- If a product has `compareAtPrice > price`, it will appear in the Sale collection automatically
