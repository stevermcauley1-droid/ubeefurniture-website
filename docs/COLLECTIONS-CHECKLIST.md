# Collections Setup Checklist

**Quick reference for creating 8 automated collections in Shopify Admin.**

---

## ✅ Step-by-Step Checklist

### For EACH collection (repeat 8 times):

- [ ] **1. Go to:** https://ubee-furniture.myshopify.com/admin/collections
- [ ] **2. Click:** "Create collection" button (top right)
- [ ] **3. Enter Title:** (see list below)
- [ ] **4. Select:** "Automated" (not Manual)
- [ ] **5. Add Conditions:** (see rules below for each collection)
  - Select **"Any of the following conditions"** (OR logic) when adding multiple conditions
- [ ] **6. Check:** "Online Store" sales channel is enabled
- [ ] **7. Click:** "Save"

---

## Collection List & Rules

### 1. Sofas
**Title:** `Sofas`
**Conditions (add each as separate condition, use OR):**
- Product tag **contains** `sofa`
- Product tag **contains** `sofa-bed`
- Product type **contains** `Sofa`
- Product type **contains** `Sofas`

---

### 2. Beds
**Title:** `Beds`
**Conditions:**
- Product tag **contains** `bed`
- Product tag **contains** `bedroom`
- Product type **contains** `Bed`
- Product type **contains** `Beds`

---

### 3. Mattresses
**Title:** `Mattresses`
**Conditions:**
- Product tag **contains** `mattress`
- Product type **contains** `Mattress`
- Product type **contains** `Mattresses`

---

### 4. Wardrobes
**Title:** `Wardrobes`
**Conditions:**
- Product tag **contains** `wardrobe`
- Product tag **contains** `closet`
- Product type **contains** `Wardrobe`
- Product type **contains** `Storage`

---

### 5. Dining
**Title:** `Dining`
**Conditions:**
- Product tag **contains** `dining`
- Product tag **contains** `table`
- Product tag **contains** `chair`
- Product type **contains** `Dining`
- Product type **contains** `Table`

---

### 6. Packages
**Title:** `Packages` (or "Package Deals")
**Conditions:**
- Product tag **contains** `package`
- Product tag **contains** `bundle`
- Product tag **contains** `deal`
- Product type **contains** `Package`

---

### 7. Landlord Packs
**Title:** `Landlord Packs`
**Conditions:**
- Product tag **contains** `landlord`
- Product tag **contains** `rental`
- Product tag **contains** `furnished`
- Product tag **contains** `crib5`
- Product type **contains** `Landlord`

---

### 8. Sale
**Title:** `Sale`
**Conditions:**
- Product tag **equals** `sale`
- Product tag **equals** `Sale`
- Product tag **equals** `clearance`

---

## After Creating All Collections

- [ ] Visit: http://localhost:3001/collections
- [ ] Verify all 8 collections appear (excluding "frontpage")
- [ ] Click each collection to verify it loads
- [ ] Products will appear automatically once synced from FTG

---

## Notes

- Use **"contains"** (not "equals") for flexible matching
- Use **OR** logic between conditions (products matching ANY condition appear)
- Collections update automatically when products match rules
- The `/collections` page automatically filters out "frontpage"

---

**Time estimate:** ~15-20 minutes to create all 8 collections
