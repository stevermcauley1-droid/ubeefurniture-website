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

- [ ] **Import project**: Vercel Dashboard → Add New → Project → Import `stevermcauley1-droid/ubeefurniture-website`.
- [ ] **Framework**: Next.js (auto-detected).
- [ ] **Environment variables** (set for **Production** and **Preview**):

| Name | Value | Notes |
|------|--------|--------|
| `SHOPIFY_STORE_DOMAIN` | `ubee-furniture.myshopify.com` | |
| `SHOPIFY_STOREFRONT_ACCESS_TOKEN` | *(your Storefront API token)* | From Shopify Admin → Apps → Develop apps → Storefront API integration |
| `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN` | `ubee-furniture.myshopify.com` | |
| `NEXT_PUBLIC_SITE_URL` | *(your Vercel URL)* | After first deploy: e.g. `https://ubeefurniture-website.vercel.app` then redeploy |

- [ ] Trigger deploy (or redeploy after adding vars).
- [ ] **Production URL** (fill after deploy): _________________________________

---

## 3. Production URL

| Item | Value |
|------|--------|
| **Vercel production URL** | *(fill after first deploy)* |

---

## 4. Production route verification

After deploy, verify:

| Route | Expected | Result (✓/✗) |
|-------|----------|----------------|
| `/` (home) | 200, home loads | |
| `/collections/frontpage` | 200, real Shopify collection title (e.g. "Home page") | |
| `/collections/beds` | 404 (no such collection in Shopify) | |

**Confirmation:** All three route checks passed: ___________

---

## 5. Lighthouse mobile baseline

**How to run:** Chrome → DevTools → Lighthouse → Mobile → Performance, Accessibility, Best Practices, SEO → Analyze page load.

**Target:** Mobile Performance ≥ 90.

| Category | Score (0–100) |
|----------|----------------|
| Performance | |
| Accessibility | |
| Best Practices | |
| SEO | |

### Top 3 opportunities (if Performance < 90)

1. 
2. 
3. 

*(Run the audit on the production URL and paste scores + top 3 opportunities above.)*

---

## Optional: CLI Lighthouse against production

After setting `NEXT_PUBLIC_SITE_URL` / knowing production URL:

```bash
npx lighthouse https://YOUR_VERCEL_URL --output=json --output-path=./docs/lighthouse-mobile-report.json --preset=perf --form-factor=mobile --chrome-flags="--headless"
```

Then open `docs/lighthouse-mobile-report.json` and read `categories.performance.score`, etc. (× 100 for 0–100).
