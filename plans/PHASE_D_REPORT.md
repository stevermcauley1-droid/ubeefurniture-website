# Phase D: Vercel deployment & Lighthouse baseline

## 1. Git

| Item | Value |
|------|--------|
| **Commit hash** | `1bafa2f` |
| **Repo URL** | https://github.com/stevermcauley1-droid/ubeefurniture-website |
| **Branch pushed** | `main` |
| **`.env.local` committed?** | No (ignored via `.env*.local` in `.gitignore`) |

---

## 2. Vercel deploy checklist

- [x] **Import project**: Vercel Dashboard → Add New → Project → Import `stevermcauley1-droid/ubeefurniture-website`.
- [x] **Framework**: Next.js (auto-detected).
- [ ] **Environment variables** (set for **Production** and **Preview**):

| Name | Value | Notes |
|------|--------|--------|
| `SHOPIFY_STORE_DOMAIN` | `ubee-furniture.myshopify.com` | |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | *(your Storefront API token)* | From Shopify Admin → Apps → Develop apps → Storefront API integration |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | `ubee-furniture.myshopify.com` | |
| `NEXT_PUBLIC_SITE_URL` | `https://ubeefurniture-website.vercel.app` | **Set this** for Production + Preview (see § 2b below) |

- [x] Trigger deploy (or redeploy after adding vars).

### 2b. Vercel env parity (recommended hardening)

**Action:** In Vercel → Project → Settings → Environment Variables, set:

- **Name:** `NEXT_PUBLIC_SITE_URL`
- **Value:** `https://ubeefurniture-website.vercel.app`
- **Environments:** Production + Preview

The app has a code fallback (`http://localhost:3000`) so it works without this, but setting the env var is recommended for canonical URLs, sitemaps, and future features. After adding/updating, trigger a redeploy.

---

## 3. Production URL

| Item | Value |
|------|--------|
| **Vercel production URL** | **https://ubeefurniture-website.vercel.app** |

---

## 4. Production route verification

| Route | Expected | Actual |
|-------|----------|--------|
| `/` (home) | 200, home loads | ✓ Loads |
| `/collections/frontpage` | 200, real Shopify collection title (e.g. "Home page") | ✓ Loads, shows "Home page" |
| `/collections/beds` | 404 (no such collection in Shopify) | ✓ 404 (expected) |

**Confirmation:** All three route checks passed.

---

## 5. Lighthouse mobile baseline

**Target:** Mobile Performance ≥ 90.

### 5a. How to run (Chrome DevTools)

1. Open **https://ubeefurniture-website.vercel.app** in Chrome.
2. Open DevTools (F12 or right‑click → Inspect).
3. Open the **Lighthouse** tab (you may need to click **>>** or the chevron to see it).
4. Settings:
   - **Mode:** Navigation
   - **Device:** Mobile
   - **Categories:** Performance, Accessibility, Best Practices, SEO
5. Click **Analyze page load**.
6. When the run finishes, copy the scores (and, if Performance < 90, the top 3 opportunities) into the table below (or paste them here for the next optimization pass).

### 5b. Scores table

| Category | Score (0–100) |
|----------|----------------|
| Performance | *(paste after running Lighthouse)* |
| Accessibility | |
| Best Practices | |
| SEO | |

### 5c. Top 3 opportunities (if Performance < 90)

*(Copy exact text from Lighthouse “Opportunities” and paste below.)*

1. 
2. 
3. 

---

## 6. Optional: CLI Lighthouse

Run from project root:

```bash
npx lighthouse https://ubeefurniture-website.vercel.app --preset=mobile --output=json --output-path=./docs/lighthouse-mobile-report.json
```

**Extract scores from the JSON:**

- Open `docs/lighthouse-mobile-report.json`.
- Find `categories`. Each category has a `score` (0–1). Multiply by 100 for 0–100:
  - `categories.performance.score`
  - `categories.accessibility.score`
  - `categories["best-practices"].score`
  - `categories.seo.score`

Example (Node): `node -e "const r=require('./docs/lighthouse-mobile-report.json'); ['performance','accessibility','best-practices','seo'].forEach(c=>console.log(c+':', Math.round((r.categories[c]?.score??0)*100)));"`

---

## Checklist for you

- [ ] **Set Vercel env:** `NEXT_PUBLIC_SITE_URL=https://ubeefurniture-website.vercel.app` (Production + Preview), then redeploy if needed.
- [ ] **Run Lighthouse** (Chrome DevTools steps in § 5a) on **https://ubeefurniture-website.vercel.app**.
- [ ] **Paste scores** (and top 3 opportunities if Performance < 90) into § 5b and § 5c above.
- [ ] If you want optimization next: save this file (with scores filled in) and say “optimize from Lighthouse report”; we can use the opportunities to propose changes.
