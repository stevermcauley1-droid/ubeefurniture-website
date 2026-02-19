# Shopify Collections Setup — Exact Step-by-Step Guide

**Goal:** Create 8 automated collections that will automatically include FTG products.

**Time:** ~20 minutes for all 8 collections

---

## Prerequisites

- Access to Shopify Admin: https://ubee-furniture.myshopify.com/admin
- Collections will appear on: http://localhost:3001/collections

---

## General Steps (Repeat for Each Collection)

### Step 1: Navigate to Collections

1. Open: https://ubee-furniture.myshopify.com/admin
2. In the left sidebar, click **"Products"**
3. In the submenu, click **"Collections"**
4. You should see a list of collections (currently just "Home page")

### Step 2: Create New Collection

1. Click the blue **"Create collection"** button (top right)
2. A new page opens: "Create collection"

### Step 3: Fill Collection Details

1. **Title field:** Enter the exact collection name (see list below)
2. **Description field:** Optional — leave blank or add a brief description
3. **Collection image:** Optional — skip for now (can add later)
4. **Search engine listing:** Optional — skip for now

### Step 4: Set Collection Type to Automated

1. Find the section: **"Collection type"**
2. Select the radio button: **"Automated"** (NOT "Manual")
3. This enables the "Conditions" section below

### Step 5: Add Conditions (Rules)

**Important:** Use **"Any of the following conditions"** (OR logic) so products matching ANY rule appear.

1. Find the section: **"Conditions"**
2. Click the dropdown that says **"All of the following conditions"** or **"Any of the following conditions"**
3. Select: **"Any of the following conditions"** (OR logic)
4. Click **"Add condition"** button
5. For each condition (see rules below for each collection):
   - **First dropdown:** Select "Product tag" or "Product type"
   - **Second dropdown:** Select "contains" (NOT "equals")
   - **Text field:** Enter the value (e.g., "sofa", "bed", etc.)
   - Click **"Add condition"** again for the next rule

### Step 6: Enable Online Store Sales Channel

1. Scroll down to **"Sales channels"** section
2. Ensure **"Online Store"** checkbox is checked/enabled
3. If unchecked, click to enable it

### Step 7: Save Collection

1. Scroll to bottom of page
2. Click blue **"Save"** button (bottom right)
3. You'll be redirected to the collection list
4. Verify the new collection appears in the list

---

## Collection 1: Sofas

**Title:** `Sofas`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `sofa`
2. Product tag **contains** `sofa-bed`
3. Product tag **contains** `settee`
4. Product type **contains** `Sofa`
5. Product type **contains** `Sofas`

**Why:** Catches sofas, sofa beds, settees by tag or product type.

---

## Collection 2: Beds

**Title:** `Beds`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `bed`
2. Product tag **contains** `bedroom`
3. Product tag **contains** `bed-frame`
4. Product type **contains** `Bed`
5. Product type **contains** `Beds`
6. Product type **contains** `Bedroom`

**Why:** Catches beds, bed frames, bedroom furniture.

---

## Collection 3: Mattresses

**Title:** `Mattresses`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `mattress`
2. Product tag **contains** `mattresses`
3. Product type **contains** `Mattress`
4. Product type **contains** `Mattresses`

**Why:** Specifically for mattresses.

---

## Collection 4: Wardrobes

**Title:** `Wardrobes`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `wardrobe`
2. Product tag **contains** `closet`
3. Product tag **contains** `storage`
4. Product tag **contains** `cupboard`
5. Product type **contains** `Wardrobe`
6. Product type **contains** `Wardrobes`
7. Product type **contains** `Storage`

**Why:** Wardrobes, closets, storage furniture.

---

## Collection 5: Dining

**Title:** `Dining`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `dining`
2. Product tag **contains** `table`
3. Product tag **contains** `chair`
4. Product tag **contains** `dining-table`
5. Product tag **contains** `dining-chair`
6. Product type **contains** `Dining`
7. Product type **contains** `Table`
8. Product type **contains** `Dining Table`

**Why:** Dining tables, chairs, dining sets.

---

## Collection 6: Package Deals

**Title:** `Package Deals`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `package`
2. Product tag **contains** `bundle`
3. Product tag **contains** `deal`
4. Product tag **contains** `pack`
5. Product type **contains** `Package`
6. Product type **contains** `Packages`
7. Product type **contains** `Bundle`

**Why:** Package deals, bundles, multi-item offers.

---

## Collection 7: Landlord Packs

**Title:** `Landlord Packs`

**Conditions (use "Any of the following conditions"):**
1. Product tag **contains** `landlord`
2. Product tag **contains** `rental`
3. Product tag **contains** `furnished`
4. Product tag **contains** `crib5`
5. Product tag **contains** `landlord-pack`
6. Product type **contains** `Landlord`
7. Product type **contains** `Landlord Pack`
8. Product type **contains** `Rental`

**Why:** Products for landlords/rental properties.

---

## Collection 8: Sale

**Title:** `Sale`

**Conditions (use "Any of the following conditions"):**
1. Product tag **equals** `sale`
2. Product tag **equals** `Sale`
3. Product tag **equals** `clearance`
4. Product tag **equals** `Clearance`
5. Product tag **equals** `discount`

**Note:** For Sale, use **"equals"** (not "contains") to avoid false matches.

**Why:** Products on sale or clearance.

---

## Quick Reference: All Rules at a Glance

| Collection | Condition 1 | Condition 2 | Condition 3 | Condition 4+ |
|------------|-------------|-------------|-------------|--------------|
| **Sofas** | Tag contains `sofa` | Tag contains `sofa-bed` | Tag contains `settee` | Product type contains `Sofa` or `Sofas` |
| **Beds** | Tag contains `bed` | Tag contains `bedroom` | Tag contains `bed-frame` | Product type contains `Bed` or `Beds` |
| **Mattresses** | Tag contains `mattress` | Tag contains `mattresses` | - | Product type contains `Mattress` |
| **Wardrobes** | Tag contains `wardrobe` | Tag contains `closet` | Tag contains `storage` | Product type contains `Wardrobe` |
| **Dining** | Tag contains `dining` | Tag contains `table` | Tag contains `chair` | Product type contains `Dining` or `Table` |
| **Package Deals** | Tag contains `package` | Tag contains `bundle` | Tag contains `deal` | Product type contains `Package` |
| **Landlord Packs** | Tag contains `landlord` | Tag contains `rental` | Tag contains `furnished` | Product type contains `Landlord` |
| **Sale** | Tag equals `sale` | Tag equals `Sale` | Tag equals `clearance` | Tag equals `Clearance` |

---

## Verification Steps

### After Creating All 8 Collections:

1. **In Shopify Admin:**
   - Go to **Products** → **Collections**
   - Verify you see 9 collections total:
     - Home page (frontpage)
     - Sofas
     - Beds
     - Mattresses
     - Wardrobes
     - Dining
     - Package Deals
     - Landlord Packs
     - Sale

2. **On Your Website:**
   - Open: http://localhost:3001/collections
   - You should see 8 collections (excluding "Home page"/"frontpage")
   - Each collection should have:
     - Title visible
     - Image (if uploaded) or placeholder gray box
     - Clickable link to `/collections/{handle}`

3. **Check Server Logs:**
   - In your terminal where `npm run dev` is running
   - Look for: `[CollectionsListPage] Received: { edgesLength: 9, ... }`
   - Look for: `[CollectionsListPage] Mapped list length (after filtering frontpage): 8`

---

## Troubleshooting

### Collections Don't Appear on Website

**Check:**
1. Collections are published (not draft)
2. "Online Store" sales channel is enabled for each collection
3. Storefront API token is valid (check `.env.local`)
4. Dev server is running (`npm run dev`)

**Fix:**
- In Shopify Admin → Collections → Click each collection → Ensure "Online Store" is checked → Save

### Products Don't Appear in Collections

**Check:**
1. Products have matching tags or product types
2. Collection rules use "contains" (not "equals") for flexible matching
3. Collection uses "Any of the following conditions" (OR logic)

**Fix:**
- After syncing FTG products (`npm run ftg:sync:shopify`), products will get tags automatically
- Products matching ANY condition will appear in the collection

### Only "Home page" Collection Shows

**This is normal if:**
- You haven't created the 8 collections yet
- Collections exist but aren't published to "Online Store"
- The code automatically filters out "frontpage" — this is correct behavior

---

## Next Steps After Creating Collections

1. **Sync FTG Products:**
   ```bash
   npm run ftg:sync:shopify --limit=50
   ```
   Products will automatically get tags and appear in collections.

2. **Verify Products in Collections:**
   - In Shopify Admin → Collections → Click "Sofas" → Check product count
   - Products matching rules will appear automatically

3. **Test on Website:**
   - Visit: http://localhost:3001/collections/sofas
   - Products should appear in the collection page

---

**Estimated Time:** 15-20 minutes to create all 8 collections

**Start:** Open https://ubee-furniture.myshopify.com/admin/collections and begin with "Sofas"
