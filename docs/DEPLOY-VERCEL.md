# Deploy to Vercel

## 1. Push to GitHub

```bash
# Create repo on GitHub, then:
git remote add origin https://github.com/YOUR_USERNAME/ubeefurniture-website.git
git branch -M main
git push -u origin main
```

## 2. Connect Vercel

1. Go to [vercel.com](https://vercel.com) → New Project
2. Import your GitHub repo
3. Add environment variables:
   - `SHOPIFY_STORE_DOMAIN` = ubee-furniture.myshopify.com
   - `SHOPIFY_STOREFRONT_ACCESS_TOKEN` = (your token)
   - `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` = ubee-furniture.myshopify.com
   - `NEXT_PUBLIC_SITE_URL` = https://www.ubeefurniture.co.uk (or Vercel URL until custom domain is connected)
4. Deploy

## 3. Verify

- Production URL loads
- Products from Shopify display
- Cart and checkout work
