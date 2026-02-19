# How to Get Shopify Admin API Access Token

## Quick Steps

1. **Go to Shopify Admin:**
   - https://ubee-furniture.myshopify.com/admin/settings/apps/development

2. **Create or Use Existing Custom App:**
   - Click "Create an app"
   - Name it: "uBee Collections Manager" (or any name)
   - Click "Create app"

3. **Configure Admin API Scopes:**
   - Click "Configure Admin API scopes"
   - Find and enable: `write_products` (required for creating collections)
   - Optionally enable: `read_products` (for reading collections)
   - Click "Save"

4. **Install App:**
   - Click "Install app" button
   - Review permissions and click "Install"

5. **Copy Admin API Access Token:**
   - After installation, you'll see "Admin API access token"
   - Click "Reveal token once"
   - Copy the token (starts with `shpat_`)

6. **Add to `.env.local`:**
   ```bash
   SHOPIFY_ADMIN_ACCESS_TOKEN=shpat_your_token_here
   ```

7. **Run the script:**
   ```bash
   npm run collections:create
   ```

## Security Note

- Never commit `.env.local` to git (it's already in `.gitignore`)
- Keep your Admin API token secure
- Tokens can be revoked and regenerated in Shopify Admin if needed
