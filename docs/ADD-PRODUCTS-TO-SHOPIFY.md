# Adding Products to Shopify Store

## Current Status

Your Shopify store (`ubee-furniture.myshopify.com`) currently has **0 products**. You need to add products before you can test the e-commerce flow.

---

## How to Add Products to Shopify

### Step 1: Access Shopify Admin

1. Go to: `https://ubee-furniture.myshopify.com/admin`
2. Log in with your Shopify account

### Step 2: Add a Product

1. In Shopify Admin, go to **Products** → **Add product**
2. Fill in:
   - **Title:** e.g., "Modern Sofa"
   - **Description:** Product description
   - **Price:** e.g., £299.99
   - **Images:** Upload product images
   - **Variants:** Add variants if needed (fabric, color, size)
   - **Status:** Set to **Active** (important!)
   - **Visibility:** Make sure it's visible on your storefront

### Step 3: Add to Collection (Optional but Recommended)

1. Go to **Products** → **Collections**
2. Create collections like:
   - **Sofas**
   - **Beds**
   - **Dining**
   - **Packages** (for landlord packages)
3. Add products to collections

### Step 4: Verify Products Are Available

After adding products, verify they're accessible:

```bash
npm run shopify:smoke
```

Should show: `at least X product(s) reachable` (where X > 0)

---

## Quick Test Products to Add

For testing purposes, add at least 2-3 products:

1. **Modern Sofa**
   - Price: £299.99
   - Collection: Sofas
   - Tags: sofa, furniture

2. **Comfortable Bed**
   - Price: £399.99
   - Collection: Beds
   - Tags: bed, furniture

3. **Dining Table Set**
   - Price: £199.99
   - Collection: Dining
   - Tags: dining, furniture

---

## After Adding Products

Once products are added:

1. **Refresh homepage:** `http://localhost:3000`
   - Should see products in "Featured" section

2. **Test view_item event:**
   - Click any product
   - Check Console for `[GA4] Event fired: view_item`

3. **Test add_to_cart:**
   - Add product to cart
   - Check Console for `[GA4] Event fired: add_to_cart`

4. **Test checkout flow:**
   - Go to cart
   - Click "Proceed to checkout"
   - Complete checkout on Shopify
   - Purchase event will fire via webhook

---

## Troubleshooting

### Products Not Showing?

1. **Check product status:** Must be **Active** (not Draft)
2. **Check visibility:** Must be visible on storefront
3. **Check collections:** Products should be in at least one collection
4. **Verify API access:** Run `npm run shopify:smoke` to check connection

### Still Not Working?

1. **Clear Next.js cache:**
   ```bash
   rm -rf .next
   npm run dev
   ```

2. **Check browser console:** Look for Shopify API errors

3. **Verify token:** Ensure `SHOPIFY_STOREFRONT_ACCESS_TOKEN` is correct

---

**Once products are added to Shopify, your website will automatically display them!** 🎉
