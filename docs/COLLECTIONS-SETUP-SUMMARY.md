# Collections Setup Summary

## ✅ What's Done

### Code Changes

1. **`app/collections/page.tsx`**
   - ✅ Filters out "frontpage" collection automatically
   - ✅ Shows empty state message when no collections exist
   - ✅ Renders all other collections with images and titles
   - ✅ Added logging for debugging

2. **`scripts/ftg/sync-ftg-to-shopify.ts`**
   - ✅ Auto-generates tags based on product name/range
   - ✅ Sets productType based on detected category
   - ✅ Tags include: `sofa`, `bed`, `mattress`, `wardrobe`, `dining`, `package`, `landlord`, `rental`
   - ✅ Product types: `Sofas`, `Beds`, `Mattresses`, `Wardrobes`, `Dining`, `Packages`, `Landlord Packs`

3. **`lib/shopify.ts`**
   - ✅ Added comprehensive logging for collections queries
   - ✅ Logs GraphQL responses, errors, and collection counts

---

## 📋 What You Need to Do

### Step 1: Create Collections in Shopify Admin

**Quick checklist:** See `docs/COLLECTIONS-CHECKLIST.md` for a step-by-step checklist.

**Detailed guide:** See `docs/SHOPIFY-COLLECTIONS-SETUP.md` for full instructions.

**8 Collections to Create:**
1. Sofas
2. Beds
3. Mattresses
4. Wardrobes
5. Dining
6. Packages
7. Landlord Packs
8. Sale

**For each collection:**
- Type: **Automated** (not Manual)
- Conditions: Use **OR** logic ("Any of the following conditions")
- Rules: Based on product tags and product types (see checklist)
- Sales channel: Ensure **Online Store** is enabled

---

### Step 2: Verify Collections Appear

After creating collections:

1. **Visit:** http://localhost:3001/collections
2. **Check:** All 8 collections should appear (excluding "frontpage")
3. **Click:** Each collection to verify it loads

---

### Step 3: Sync FTG Products (Optional)

Once collections are created, sync FTG products:

```bash
npm run ftg:sync:shopify --limit=50
```

Products will automatically appear in collections based on their tags/product types.

---

## 🔍 How It Works

### Automated Collections

- **Shopify Admin** → Create Automated Collection → Set rules (tag contains "sofa", product type contains "Sofas", etc.)
- **Products sync** → FTG sync script adds tags/product types to products
- **Automatic matching** → Shopify automatically adds products to collections when they match rules
- **Website display** → `/collections` page fetches and displays all collections (except "frontpage")

### Tag Generation Logic

The sync script (`sync-ftg-to-shopify.ts`) analyzes product names and ranges to add tags:

- Name contains "sofa" → adds tag `sofa`, sets productType `Sofas`
- Name contains "bed" → adds tag `bed`, sets productType `Beds`
- Name contains "dining" → adds tag `dining`, sets productType `Dining`
- etc.

---

## 📁 Files Changed

1. **`app/collections/page.tsx`**
   - Added frontpage filter
   - Added empty state
   - Added logging

2. **`scripts/ftg/sync-ftg-to-shopify.ts`**
   - Added tag generation logic
   - Added productType assignment
   - Tags/products now match collection rules

3. **`lib/shopify.ts`**
   - Added debug logging for collections queries

4. **`docs/SHOPIFY-COLLECTIONS-SETUP.md`** (NEW)
   - Complete setup guide with rules

5. **`docs/COLLECTIONS-CHECKLIST.md`** (NEW)
   - Quick checklist for creating collections

---

## ✅ Verification Checklist

After creating collections:

- [ ] Visit http://localhost:3001/collections
- [ ] See all 8 collections listed (not just "frontpage")
- [ ] Each collection has a title
- [ ] Collections with images show images
- [ ] Collections without images show placeholder
- [ ] Clicking a collection navigates to `/collections/{handle}`
- [ ] Server logs show `[CollectionsListPage]` with collection count > 0

---

## 🐛 Troubleshooting

**Q: Collections don't appear on /collections**
- Check collections are published and available on "Online Store" sales channel
- Verify Storefront API token has correct scopes
- Check server logs for `[getCollections]` output

**Q: Products don't appear in collections**
- Ensure products have matching tags or product types
- Check collection rules use "contains" (not "equals") for flexible matching
- Verify products are published and available for sale
- Run `npm run ftg:sync:shopify` to sync products with tags

**Q: Only "frontpage" shows**
- This is normal if no other collections exist
- Create collections using the checklist
- The code automatically filters out "frontpage"

---

**Next:** Follow `docs/COLLECTIONS-CHECKLIST.md` to create the 8 collections in Shopify Admin.
