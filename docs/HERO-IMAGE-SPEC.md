# Hero image asset spec

The homepage hero uses a **clean** image (no baked-in buttons or UI).

## Current file

- **Path:** `public/hero-clean.png`
- **URL:** `/hero-clean.png`
- **In use:** Clean living-room hero (no baked-in buttons); Next.js serves WebP/AVIF when supported.

## Specs (for future replacements)

| Property    | Value |
|------------|--------|
| Format     | PNG or WebP |
| Max width  | 1920px |
| Quality    | 80 (export/source); Next.js uses quality 80 in code |
| Target size| 250–450 KB (do not overly compress) |
| Content    | Clean furnished-room/property imagery; **no baked-in buttons or text** (CTAs are overlaid in HTML). |
