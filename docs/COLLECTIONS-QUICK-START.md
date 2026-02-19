# Collections Quick Start Guide

**Goal:** Create 8 automated collections in Shopify Admin.

**Time:** 15-20 minutes

---

## 🎯 What You'll Create

1. Sofas
2. Beds
3. Mattresses
4. Wardrobes
5. Dining
6. Package Deals
7. Landlord Packs
8. Sale

---

## 📋 Step-by-Step (Repeat 8 Times)

### For Each Collection:

1. **Go to:** https://ubee-furniture.myshopify.com/admin/collections
2. **Click:** "Create collection" (top right)
3. **Enter Title:** (collection name from list above)
4. **Select:** "Automated" (not Manual)
5. **Set Logic:** "Any of the following conditions" (OR)
6. **Add Conditions:** (see rules below for each collection)
   - Click "Add condition"
   - Select "Product tag" or "Product type"
   - Select "contains" (or "equals" for Sale)
   - Enter value (e.g., "sofa", "bed")
   - Repeat for each condition
7. **Check:** "Online Store" sales channel enabled
8. **Click:** "Save"

---

## 📝 Rules Per Collection

### Sofas
- Product tag **contains** `sofa` OR
- Product tag **contains** `sofa-bed` OR
- Product tag **contains** `settee` OR
- Product type **contains** `Sofa` OR
- Product type **contains** `Sofas`

### Beds
- Product tag **contains** `bed` OR
- Product tag **contains** `bedroom` OR
- Product tag **contains** `bed-frame` OR
- Product type **contains** `Bed` OR
- Product type **contains** `Beds`

### Mattresses
- Product tag **contains** `mattress` OR
- Product tag **contains** `mattresses` OR
- Product type **contains** `Mattress` OR
- Product type **contains** `Mattresses`

### Wardrobes
- Product tag **contains** `wardrobe` OR
- Product tag **contains** `closet` OR
- Product tag **contains** `storage` OR
- Product tag **contains** `cupboard` OR
- Product type **contains** `Wardrobe` OR
- Product type **contains** `Wardrobes` OR
- Product type **contains** `Storage`

### Dining
- Product tag **contains** `dining` OR
- Product tag **contains** `table` OR
- Product tag **contains** `chair` OR
- Product tag **contains** `dining-table` OR
- Product tag **contains** `dining-chair` OR
- Product type **contains** `Dining` OR
- Product type **contains** `Table` OR
- Product type **contains** `Dining Table`

### Package Deals
- Product tag **contains** `package` OR
- Product tag **contains** `bundle` OR
- Product tag **contains** `deal` OR
- Product tag **contains** `pack` OR
- Product type **contains** `Package` OR
- Product type **contains** `Packages` OR
- Product type **contains** `Bundle`

### Landlord Packs
- Product tag **contains** `landlord` OR
- Product tag **contains** `rental` OR
- Product tag **contains** `furnished` OR
- Product tag **contains** `crib5` OR
- Product tag **contains** `landlord-pack` OR
- Product type **contains** `Landlord` OR
- Product type **contains** `Landlord Pack` OR
- Product type **contains** `Rental`

### Sale
- Product tag **equals** `sale` OR
- Product tag **equals** `Sale` OR
- Product tag **equals** `clearance` OR
- Product tag **equals** `Clearance` OR
- Product tag **equals** `discount`

**Note:** Sale uses "equals" (not "contains") to avoid false matches.

---

## ✅ Verification

### After Creating All Collections:

1. **Run verification:**
   ```bash
   npm run collections:verify
   ```
   Should show: ✅ All required collections are present!

2. **Check website:**
   - Visit: http://localhost:3001/collections
   - You should see 8 collections (excluding "Home page")
   - Each collection is clickable

3. **Check server logs:**
   - Look for: `[CollectionsListPage] Mapped list length (after filtering frontpage): 8`

---

## 🔗 Full Documentation

- **Detailed guide:** `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md` (click-by-click)
- **Quick checklist:** `docs/COLLECTIONS-CHECKLIST.md`
- **Complete guide:** `docs/COLLECTIONS-FINAL-GUIDE.md`

---

## 💡 How It Works

1. **You create collections** in Shopify Admin with automated rules
2. **FTG sync script** (`npm run ftg:sync:shopify`) adds tags/product types to products
3. **Shopify automatically** adds products to collections when they match rules
4. **Your website** (`/collections`) displays all collections (except "frontpage")

---

**Start now:** Open https://ubee-furniture.myshopify.com/admin/collections and create your first collection!
