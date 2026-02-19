# Shopify Collections Setup Guide

This guide walks you through creating automated collections in Shopify Admin that will automatically include FTG products based on tags and product types.

## Required Collections

Create these 8 collections:

1. **Sofas**
2. **Beds**
3. **Mattresses**
4. **Wardrobes**
5. **Dining**
6. **Packages** (or "Package Deals")
7. **Landlord Packs**
8. **Sale**

---

## Step-by-Step: Create an Automated Collection

### For each collection, follow these steps:

1. **Go to Shopify Admin:**
   - Open: https://ubee-furniture.myshopify.com/admin
   - Log in if needed

2. **Navigate to Collections:**
   - Click **Products** in the left sidebar
   - Click **Collections**

3. **Create New Collection:**
   - Click the **Create collection** button (top right)

4. **Collection Details:**
   - **Title:** Enter the collection name (e.g., "Sofas")
   - **Description:** Optional (e.g., "Browse our range of sofas")
   - **Collection image:** Optional (upload an image if you have one)
   - **Search engine listing:** Optional (for SEO)

5. **Set Collection Type:**
   - Select **Automated** (not Manual)
   - This makes products automatically appear based on rules

6. **Set Conditions (Rules):**
   - Use the rules specified below for each collection
   - Click **Add condition** for each rule
   - Use **OR** logic (products matching ANY condition will appear)
   - In Shopify Admin, when you add multiple conditions, select "Any of the following conditions" (OR)

7. **Sales Channels:**
   - Ensure **Online Store** is checked/enabled
   - This makes the collection visible on your website

8. **Save:**
   - Click **Save** (bottom right)

---

## Automated Collection Rules

### 1. Sofas

**Conditions (use AND):**
- Product tag **contains** `sofa` **OR**
- Product tag **contains** `sofa-bed` **OR**
- Product type **contains** `Sofa` **OR**
- Product type **contains** `Sofas`

**Why:** FTG products with "sofa" in tags or product type will appear here.

---

### 2. Beds

**Conditions (use AND):**
- Product tag **contains** `bed` **OR**
- Product tag **contains** `bedroom` **OR**
- Product type **contains** `Bed` **OR**
- Product type **contains** `Beds`

**Why:** Catches beds, bed frames, bedroom furniture.

---

### 3. Mattresses

**Conditions (use AND):**
- Product tag **contains** `mattress` **OR**
- Product type **contains** `Mattress` **OR**
- Product type **contains** `Mattresses`

**Why:** Specifically for mattresses.

---

### 4. Wardrobes

**Conditions (use AND):**
- Product tag **contains** `wardrobe` **OR**
- Product tag **contains** `closet` **OR**
- Product type **contains** `Wardrobe` **OR**
- Product type **contains** `Storage`

**Why:** Wardrobes, closets, storage furniture.

---

### 5. Dining

**Conditions (use AND):**
- Product tag **contains** `dining` **OR**
- Product tag **contains** `table` **OR**
- Product tag **contains** `chair` **OR**
- Product type **contains** `Dining` **OR**
- Product type **contains** `Table`

**Why:** Dining tables, chairs, dining sets.

---

### 6. Packages (or "Package Deals")

**Conditions (use AND):**
- Product tag **contains** `package` **OR**
- Product tag **contains** `bundle` **OR**
- Product tag **contains** `deal` **OR**
- Product type **contains** `Package`

**Why:** Package deals, bundles, multi-item offers.

---

### 7. Landlord Packs

**Conditions (use AND):**
- Product tag **contains** `landlord` **OR**
- Product tag **contains** `rental` **OR**
- Product tag **contains** `furnished` **OR**
- Product tag **contains** `crib5` **OR**
- Product type **contains** `Landlord`

**Why:** Products specifically for landlords/rental properties.

---

### 8. Sale

**Conditions (use AND):**
- Product tag **equals** `sale` **OR**
- Product tag **equals** `Sale` **OR**
- Product tag **equals** `clearance`

**Why:** Products on sale or clearance.

---

## Quick Reference: Collection Rules Summary

| Collection | Rule Type | Value |
|------------|-----------|-------|
| Sofas | Tag contains | `sofa` OR `sofa-bed` |
| Sofas | Product type contains | `Sofa` OR `Sofas` |
| Beds | Tag contains | `bed` OR `bedroom` |
| Beds | Product type contains | `Bed` OR `Beds` |
| Mattresses | Tag contains | `mattress` |
| Mattresses | Product type contains | `Mattress` |
| Wardrobes | Tag contains | `wardrobe` OR `closet` |
| Wardrobes | Product type contains | `Wardrobe` OR `Storage` |
| Dining | Tag contains | `dining` OR `table` OR `chair` |
| Dining | Product type contains | `Dining` OR `Table` |
| Packages | Tag contains | `package` OR `bundle` OR `deal` |
| Packages | Product type contains | `Package` |
| Landlord Packs | Tag contains | `landlord` OR `rental` OR `furnished` OR `crib5` |
| Landlord Packs | Product type contains | `Landlord` |
| Sale | Tag equals | `sale` OR `Sale` OR `clearance` |

---

## After Creating Collections

1. **Verify in Shopify Admin:**
   - Go to **Products** → **Collections**
   - Check each collection shows product count (may be 0 until products are synced)

2. **Test on Website:**
   - Visit: http://localhost:3001/collections
   - You should see all 8 collections listed
   - Click each collection to see products (once FTG products are synced)

3. **Sync FTG Products:**
   - Run: `npm run ftg:sync:shopify` (after setting up Admin API token)
   - Products will automatically appear in collections based on their tags/product types

---

## Notes

- **Automated collections** update automatically when products match the rules
- **Manual collections** require you to add products one by one (not recommended for FTG imports)
- Collections must be **published** and available on **Online Store** sales channel to appear on your website
- The `/collections` page filters out the special "frontpage" collection automatically

---

## Troubleshooting

**Q: Collections don't appear on /collections page**
- Check collections are published and available on "Online Store" sales channel
- Verify Storefront API token has `unauthenticated_read_product_listings` scope
- Check browser console and server logs for errors

**Q: Products don't appear in collections**
- Ensure products have matching tags or product types
- Check collection rules use "contains" (not "equals") for flexible matching
- Verify products are published and available for sale

**Q: Only "frontpage" collection shows**
- This is normal if no other collections exist yet
- Create collections using the steps above
- The code automatically filters out "frontpage"
