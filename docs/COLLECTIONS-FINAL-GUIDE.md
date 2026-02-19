# Collections Setup — Complete Guide

**Goal:** Create 8 automated collections in Shopify that automatically include FTG products.

---

## ✅ Code Status

**Current state:**
- ✅ `/collections` page filters out "frontpage" automatically
- ✅ Shows empty state when no collections exist
- ✅ Renders all other collections correctly
- ✅ FTG sync script auto-generates tags and product types
- ✅ Logging added for debugging

**No code changes needed** — everything is ready!

---

## 📋 Shopify Admin Checklist

**Follow this exact checklist:** `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md`

**Quick version:** `docs/COLLECTIONS-CHECKLIST.md`

---

## 🎯 8 Collections to Create

| # | Collection Name | Key Rules |
|---|----------------|-----------|
| 1 | **Sofas** | Tag contains `sofa` OR Product type contains `Sofa` |
| 2 | **Beds** | Tag contains `bed` OR Product type contains `Bed` |
| 3 | **Mattresses** | Tag contains `mattress` OR Product type contains `Mattress` |
| 4 | **Wardrobes** | Tag contains `wardrobe` OR Product type contains `Wardrobe` |
| 5 | **Dining** | Tag contains `dining` OR Product type contains `Dining` |
| 6 | **Package Deals** | Tag contains `package` OR Product type contains `Package` |
| 7 | **Landlord Packs** | Tag contains `landlord` OR Product type contains `Landlord` |
| 8 | **Sale** | Tag equals `sale` OR Tag equals `clearance` |

**Full rules:** See `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md` for complete rule sets.

---

## 🔧 How Automated Collections Work

### 1. Create Collection in Shopify
- Type: **Automated**
- Rules: Product tag contains X OR Product type contains Y
- Logic: **"Any of the following conditions"** (OR)

### 2. Sync FTG Products
- Run: `npm run ftg:sync:shopify`
- Script analyzes product name/range
- Adds tags: `sofa`, `bed`, `mattress`, `wardrobe`, `dining`, `package`, `landlord`, `rental`
- Sets productType: `Sofas`, `Beds`, `Mattresses`, `Wardrobes`, `Dining`, `Packages`, `Landlord Packs`

### 3. Shopify Auto-Matches
- Products with tag `sofa` → automatically appear in "Sofas" collection
- Products with productType `Beds` → automatically appear in "Beds" collection
- No manual assignment needed!

---

## ✅ Verification Steps

### Step 1: Verify Collections Exist

Run the verification script:
```bash
npx tsx scripts/verify-collections.ts
```

Expected output:
```
✅ All required collections are present!
```

### Step 2: Check Website

1. Visit: http://localhost:3001/collections
2. You should see 8 collections (excluding "Home page")
3. Each collection should be clickable

### Step 3: Check Server Logs

In your terminal where `npm run dev` is running, look for:
```
[CollectionsListPage] Received: { edgesLength: 9, ... }
[CollectionsListPage] Mapped list length (after filtering frontpage): 8
```

---

## 📝 Exact Rules Per Collection

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

## 🚀 Quick Start

1. **Open:** https://ubee-furniture.myshopify.com/admin/collections
2. **Follow:** `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md`
3. **Create:** All 8 collections (15-20 minutes)
4. **Verify:** Run `npx tsx scripts/verify-collections.ts`
5. **Test:** Visit http://localhost:3001/collections

---

## 📁 Files Reference

- **Setup Guide:** `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md` (detailed, click-by-click)
- **Quick Checklist:** `docs/COLLECTIONS-CHECKLIST.md` (fast reference)
- **Verification Script:** `scripts/verify-collections.ts` (check collections exist)
- **Code:** `app/collections/page.tsx` (already filters frontpage, shows empty state)

---

**Ready to start?** Open `docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md` and follow the checklist!
