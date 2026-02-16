# Hero Image — Ship to Production Report

## Phase 1 — Asset verification

| Check | Result |
|-------|--------|
| **File** | `public/hero-clean.webp` |
| **Exists** | ✅ Yes |
| **Size** | ~122 KB (124,810 bytes) |
| **Committed** | ✅ Yes (commit `50974d2`) |

---

## Phase 2 — Commit & push

| Step | Result |
|------|--------|
| **Asset commit** | `50974d2` — *Add clean hero image asset* |
| **Page update commit** | `cffb0d1` — *Use hero-clean.webp for LCP (production)* |
| **Push** | ✅ Successful to `origin main` |
| **Merge conflicts** | ✅ None |

**Latest commit hash:** `cffb0d1`

---

## Phase 3 — Vercel deployment verification

| Check | Result |
|-------|--------|
| **Production URL** | https://ubeefurniture-website.vercel.app |
| **Hero asset URL** | https://ubeefurniture-website.vercel.app/hero-clean.webp |
| **HTTP status** | ✅ 200 |
| **Content-Type** | ✅ image/webp |
| **Homepage loads** | ✅ Yes; hero image and overlay CTAs present |

---

## Phase 4 — Production Lighthouse (Mobile)

**Run in Incognito:** https://ubeefurniture-website.vercel.app

1. Open Chrome DevTools → Lighthouse tab.
2. Mode: **Navigation** · Device: **Mobile**.
3. Categories: Performance, Accessibility, Best Practices, SEO.
4. Click **Analyze page load**.

### Scores (fill after run)

| Metric | Baseline (previous) | Current | Target |
|--------|----------------------|---------|--------|
| **Performance** | ~29–36 | *(fill after run)* | ≥ 70 |
| **LCP** | — | *(fill after run)* | < 2.5s |
| **TBT** | — | *(fill after run)* | < 200ms |
| **CLS** | — | *(fill after run)* | < 0.1 |

**LCP element:** Hero image (`/hero-clean.webp`) — confirmed as primary LCP candidate (priority, above-the-fold, largest image).

---

## Phase 5 — Summary

| Item | Value |
|------|--------|
| **Commit hash** | `cffb0d1` |
| **Deployment URL** | https://ubeefurniture-website.vercel.app |
| **Hero in production** | ✅ Yes — `/hero-clean.webp` returns 200, image/webp |
| **LCP element** | Hero image (next/image, priority, fill, quality 80, sizes 100vw) |

### If Performance < 70 — next optimization plan

1. **JS reduction:** MegaMenu client bundle — consider static nav or lazy hydration.
2. **Hydration trimming:** Defer non-critical client components (e.g. GA already lazyOnload).
3. **Script deferral:** Ensure no render-blocking third-party scripts; audit Script strategy.

---

## Definition of done

- [x] Asset committed
- [x] Production serving optimized hero (200, image/webp)
- [ ] Lighthouse production re-tested *(run and paste scores above)*
- [x] Metrics document (this file)
