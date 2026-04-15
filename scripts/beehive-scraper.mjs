#!/usr/bin/env node
/**
 * Beehive Furniture Wholesale — pull catalog from their Shopify portal JSON feed.
 * /collections is login-gated, but /products.json is publicly paginated (same catalog).
 *
 * Usage:
 *   node scripts/beehive-scraper.mjs [--out=data/beehive/shopify-products.json] [--limit=N]
 *
 * Import into your Shopify (same shape as Heartlands importer):
 *   node scripts/heartlands-import-to-shopify.mjs --dry-run --file=data/beehive/shopify-products.json
 *   node scripts/heartlands-import-to-shopify.mjs --apply --publish --file=data/beehive/shopify-products.json
 *
 * After import: npm run beehive:ensure-storefront
 *   (assigns smart-collection tags/types, activates, publishes to Online Store + Headless)
 *
 * SKUs with no images in Beehive JSON: set IMPORT_PLACEHOLDER_IMAGE_URL in .env.local to a full
 * https URL of a hosted placeholder, then npm run beehive:import (adds tag needs-real-image).
 */

import fs from "fs";
import path from "path";

const BASE = "https://portal.beehivefurniture.co.uk";
const DEFAULT_OUT = path.join("data", "beehive", "shopify-products.json");
const PAGE_LIMIT = 250;
const UA =
  "Mozilla/5.0 (compatible; UbeeCatalogBot/1.0; +https://ubeefurniture.co.uk)";

const SUPPLIER_TAGS = ["beehive", "supplier-beehive", "featured"];

/**
 * Align with scripts/create-collections.ts smart rules (TYPE = X OR TAG = lowercase).
 * Beehive sends tag "Sofas" but the store rule is TAG EQUALS "sofa" — without this,
 * products stay type "Furniture" and never appear in /collections/sofas.
 */
function classifyTitle(title) {
  const t = String(title || "").toLowerCase();
  if (/\bmattress(es)?\b/.test(t)) {
    return { productType: "Mattresses", tag: "mattress" };
  }
  if (/\bsofa\b|\bsettee\b|\bcouch\b|\bsofabed\b|\bsofa bed\b/.test(t)) {
    return { productType: "Sofas", tag: "sofa" };
  }
  if (/\bwardrobe\b/.test(t)) {
    return { productType: "Wardrobes", tag: "wardrobe" };
  }
  if (/\boffice\b/.test(t)) {
    return { productType: "Office", tag: "office" };
  }
  if (/\bdining\b|\bdining table\b|\bkitchen table\b/.test(t)) {
    return { productType: "Dining", tag: "dining" };
  }
  if (/\btable\b/.test(t) && !/\bcoffee\b|\bconsole\b|\bend\b|\blamp\b|\bbedside\b/.test(t)) {
    return { productType: "Dining", tag: "dining" };
  }
  if (/\bbed\b/.test(t) && !/\bbedside\b|\bbedding\b/.test(t)) {
    return { productType: "Beds", tag: "bed" };
  }
  return null;
}

/** Map Beehive collection-style tags to create-collections smart-collection tag + type. */
function hintFromVendorTags(tagSet) {
  const lower = new Set([...tagSet].map((x) => String(x).toLowerCase()));
  if (lower.has("sofas")) return { productType: "Sofas", tag: "sofa" };
  if (lower.has("beds")) return { productType: "Beds", tag: "bed" };
  if (lower.has("mattresses") || lower.has("mattress")) {
    return { productType: "Mattresses", tag: "mattress" };
  }
  if (lower.has("dining")) return { productType: "Dining", tag: "dining" };
  if (lower.has("wardrobes") || lower.has("wardrobe")) {
    return { productType: "Wardrobes", tag: "wardrobe" };
  }
  if (lower.has("office")) return { productType: "Office", tag: "office" };
  return null;
}

function applySmartCollectionFields(tags, title) {
  const set = new Set(tags);
  const fromTitle = classifyTitle(title);
  if (fromTitle) {
    set.add(fromTitle.tag);
    return { tags: [...set], productType: fromTitle.productType };
  }
  const fromVendor = hintFromVendorTags(set);
  if (fromVendor) {
    set.add(fromVendor.tag);
    return { tags: [...set], productType: fromVendor.productType };
  }
  return { tags: [...set], productType: null };
}

function arg(name, def = null) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function mergeTags(rawTags) {
  let fromApi = [];
  if (Array.isArray(rawTags)) {
    fromApi = rawTags.map((t) => String(t).trim()).filter(Boolean);
  } else if (typeof rawTags === "string" && rawTags.trim()) {
    fromApi = rawTags.split(",").map((t) => t.trim()).filter(Boolean);
  }
  return [...new Set([...fromApi, ...SUPPLIER_TAGS])];
}

/** One import row per Shopify product (first variant only; matches Heartlands importer). */
function toImportRow(p) {
  const v0 = p.variants?.[0] || {};
  const merged = mergeTags(p.tags);
  const { tags, productType } = applySmartCollectionFields(merged, p.title);
  const finalType =
    productType || (p.product_type?.trim() ? p.product_type.trim() : "Furniture");
  return {
    handle: p.handle,
    title: p.title,
    body_html: p.body_html || "",
    vendor: p.vendor || "Beehive Furniture Wholesale",
    product_type: finalType,
    tags,
    variants: [
      {
        price: v0.price != null ? String(v0.price) : "0.00",
        sku: v0.sku != null ? String(v0.sku).trim() : "",
      },
    ],
    images: (p.images || []).map((img) => ({ src: img.src })).filter((x) => x.src),
  };
}

async function fetchPage(page) {
  const url = `${BASE}/products.json?limit=${PAGE_LIMIT}&page=${page}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, {
        headers: { "User-Agent": UA, Accept: "application/json" },
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(350 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function fetchAllCatalog() {
  const rows = [];
  let page = 1;
  while (true) {
    const data = await fetchPage(page);
    const products = data.products || [];
    if (!products.length) break;
    for (const p of products) {
      rows.push(toImportRow(p));
    }
    if (products.length < PAGE_LIMIT) break;
    page++;
    await sleep(300);
  }
  return rows;
}

async function main() {
  const outPath = path.resolve(process.cwd(), arg("out", DEFAULT_OUT));
  const limitArg = arg("limit", "");
  const cap =
    limitArg !== "" && limitArg !== "0"
      ? Math.max(1, parseInt(limitArg, 10) || 0)
      : 0;

  console.error(`[beehive] Fetching ${BASE}/products.json …`);
  let rows = await fetchAllCatalog();
  console.error(`[beehive] Raw products: ${rows.length}`);

  if (cap > 0) {
    rows = rows.slice(0, cap);
    console.error(`[beehive] Capped to --limit=${cap}`);
  }

  const dir = path.dirname(outPath);
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf-8");
  const bytes = fs.statSync(outPath).size;
  console.error(`[beehive] Wrote ${rows.length} product(s) (${bytes} bytes) → ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
