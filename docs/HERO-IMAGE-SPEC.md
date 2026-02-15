# Hero image asset spec

The homepage hero uses a **clean** image (no baked-in buttons or UI).

## Required file

- **Path:** `public/hero-clean.webp`
- **URL:** `/hero-clean.webp`

## Specs (quality-preserving)

| Property    | Value |
|------------|--------|
| Format     | WebP |
| Max width  | 1920px |
| Quality    | 80 (export/source); Next.js will also use quality 80 |
| Target size| 250–450 KB (do not overly compress) |
| Content    | Clean furnished-room/property imagery; **no baked-in buttons or text** (CTAs are overlaid in HTML). |

## How to add

1. Export or save your hero image as WebP (max width 1920px, quality ~80, 250–450 KB).
2. Save it as `public/hero-clean.webp` in this repo.
3. Redeploy or refresh; the homepage will use it automatically.

If the file is missing, the hero image request will 404 until the file is added.
