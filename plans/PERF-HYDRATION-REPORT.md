# Reduce Hydration & JS Overhead — Report

**Target:** Lighthouse Mobile 67 → 85+

## Phase 1 — Client components

- **Converted to Server Component (removed "use client"):**
  - `app/collections/[handle]/CollectionSort.tsx` — Links only, no hooks.
  - `app/components/ShopifyTokenErrorPanel.tsx` — Static UI from props, no hooks.
- All other "use client" files require interactivity (MegaMenu, SearchForm, GA, ProductForm, cart, landlord form, admin) and were left as client.

## Phase 2 — Homepage

- `app/page.tsx`: No "use client"; hero 100% server-rendered; CTAs are `<Link>` only; no hooks.

## Phase 3 — Below-the-fold

- Error panel and CollectionSort are now server components (no client JS). No `ssr: false` lazy sections added to avoid layout shift.

## Phase 4 — Dev overhead

- No console.log in app/ or lib/; no large test JSON on homepage; Shopify queries (getProducts, getCollections) both used.

## Phase 5 — Fonts

- Already using `next/font` (Inter, display: 'swap'); no external font link.

## Phase 6 — Build

- Local build failed with EPERM on `.next/trace`. After stopping Node and deleting `.next`, run `npm run build` then `npm run start`. Run Lighthouse (Mobile, Incognito) for scores.

## Definition of done

- [x] Homepage server-rendered
- [x] Minimal client components (only those that need interactivity)
- [x] CollectionSort & ShopifyTokenErrorPanel now server
- [ ] Mobile performance ≥ 80 — verify after build/deploy
