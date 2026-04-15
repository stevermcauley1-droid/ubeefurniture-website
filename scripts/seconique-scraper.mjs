#!/usr/bin/env node
/**
 * Seconique Furniture (Magento 2) — public Storefront GraphQL catalog → Shopify JSON.
 *
 * Source: https://seconique.co.uk/ — category tree under Default Category (id 2).
 * Guest GraphQL returns GBP price 0.0 for many SKUs; this script applies banded fallbacks
 * (same idea as wholesale beds) so nothing leaves with £0.00.
 *
 * Usage:
 *   node scripts/seconique-scraper.mjs
 *   node scripts/seconique-scraper.mjs --out=data/seconique/shopify-products.json
 *   node scripts/seconique-scraper.mjs --delay-ms=600 --limit=50
 *
 * Download PDF catalogues (optional):
 *   node scripts/seconique/download-catalogues.mjs
 *
 * Import:
 *   node scripts/heartlands-import-to-shopify.mjs --dry-run --file=data/seconique/shopify-products.json
 *   node scripts/heartlands-import-to-shopify.mjs --apply --publish --file=data/seconique/shopify-products.json
 */

import fs from "fs";
import path from "path";

const BASE = "https://seconique.co.uk";
const GRAPHQL = `${BASE}/graphql`;
const DEFAULT_OUT = path.join("data", "seconique", "shopify-products.json");
const PAGE_SIZE = 50;
const UA = "Mozilla/5.0 (compatible; UbeeCatalogBot/1.0; +https://ubeefurniture.co.uk)";

const SUPPLIER_TAGS = ["seconique", "supplier-seconique", "featured"];

/** Skip internal / non-retail buckets. */
const SKIP_URL_PATH = new Set([
  "damaged",
  "count-variance",
  "product-failure",
  "spares-component-parts",
  /** Roll-ups duplicate the same SKUs as leaf categories. */
  "all-bedroom",
  "all-beds",
  "all-dining-room",
  "all-living-room",
  "all-seating",
  "all-garden-furniture",
]);

function arg(name, def = null) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function categoryUidFromNumericId(id) {
  return Buffer.from(String(id), "utf8").toString("base64");
}

function hashSku(sku) {
  const s = String(sku || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

function pickRange(sku, min, max) {
  const span = max - min;
  const t = (hashSku(sku) % 10001) / 10000;
  let v = min + t * span;
  v = Math.floor(v) + 0.99;
  if (v > max) v = Math.floor(max) + 0.99;
  if (v < min) v = min;
  return v.toFixed(2);
}

/** Title + optional Magento category name for hints. */
function fallbackPriceGbp(sku, title, categoryName) {
  const text = `${title || ""} ${categoryName || ""}`.toLowerCase();
  if (/\bmattresses?\b|\bmattress\b/.test(text)) return pickRange(sku, 99.99, 249.99);
  if (/\bwardrobes?\b|\bwardrobe\b/.test(text)) return pickRange(sku, 249.99, 499.99);
  if (/\bsofa\b|\bsuite\b|\brecliner\b|\btub chair\b/.test(text)) return pickRange(sku, 299.99, 899.99);
  if (/\bdining\b|\btable\b|\bchair\b|\bsideboard\b/.test(text)) return pickRange(sku, 149.99, 599.99);
  if (/\bbed\b|\bdivan\b|\bbunk\b|\bmid sleeper\b/.test(text)) return pickRange(sku, 199.99, 599.99);
  return pickRange(sku, 99.99, 499.99);
}

function classifyTitle(title) {
  const t = String(title || "").toLowerCase();
  if (/\bmattress(es)?\b/.test(t)) {
    return { productType: "Mattresses", tag: "mattress" };
  }
  if (/\bsofa\b|\bsettee\b|\bcouch\b|\bsuite\b/.test(t)) {
    return { productType: "Sofas", tag: "sofa" };
  }
  if (/\bwardrobe\b/.test(t)) {
    return { productType: "Wardrobes", tag: "wardrobe" };
  }
  if (/\boffice\b|\bdesk\b|\bcomputer\b/.test(t)) {
    return { productType: "Office", tag: "office" };
  }
  if (/\bdining\b|\bdining table\b|\bkitchen table\b/.test(t)) {
    return { productType: "Dining", tag: "dining" };
  }
  if (/\btable\b/.test(t) && !/\bcoffee\b|\bconsole\b|\blend\b|\blamp\b|\bbedside\b/.test(t)) {
    return { productType: "Dining", tag: "dining" };
  }
  if (/\bbed\b/.test(t) && !/\bbedside\b|\bbedding\b|\bheadboard\b/.test(t)) {
    return { productType: "Beds", tag: "bed" };
  }
  if (/\bheadboard\b/.test(t)) {
    return { productType: "Beds", tag: "bed" };
  }
  return null;
}

function hintFromCategoryName(categoryName) {
  const n = String(categoryName || "").toLowerCase();
  if (/\bmattress/.test(n)) return { productType: "Mattresses", tag: "mattress" };
  if (/\bwardrobe/.test(n)) return { productType: "Wardrobes", tag: "wardrobe" };
  if (/\bsofa|suite|seating|recliner|tub chair/.test(n)) return { productType: "Sofas", tag: "sofa" };
  if (/\bdining|bar chair|bar stool|sideboard|display/.test(n)) return { productType: "Dining", tag: "dining" };
  if (/\bbed|divan|bunk|mid sleeper|day bed/.test(n)) return { productType: "Beds", tag: "bed" };
  if (/\bcoffee|lamp table|nest|console|tv unit|bookcase|living|occasional|garden/.test(n)) {
    return { productType: "Furniture", tag: "living-room" };
  }
  if (/\bchest|bedside|blanket|dressing|bedroom|mirror/.test(n)) {
    return { productType: "Bedroom Furniture", tag: "bedroom" };
  }
  return null;
}

function applyTagsAndType(title, categoryName) {
  const set = new Set(SUPPLIER_TAGS);
  const fromTitle = classifyTitle(title);
  if (fromTitle) {
    set.add(fromTitle.tag);
    return { tags: [...set], productType: fromTitle.productType };
  }
  const fromCat = hintFromCategoryName(categoryName);
  if (fromCat) {
    set.add(fromCat.tag);
    return { tags: [...set], productType: fromCat.productType };
  }
  return { tags: [...set], productType: "Furniture" };
}

function stripCacheSegment(url) {
  const s = String(url || "").trim();
  if (!s) return s;
  return s.replace(/\/cache\/[a-f0-9]{20,}\//i, "/");
}

function collectImages(item) {
  const out = [];
  const seen = new Set();
  const add = (u) => {
    const x = stripCacheSegment(u);
    if (!x || !/^https?:\/\//i.test(x) || seen.has(x)) return;
    seen.add(x);
    out.push({ src: x });
  };
  add(item?.image?.url);
  const gal = item?.media_gallery || [];
  for (const g of gal) {
    if (!g?.disabled) add(g.url);
  }
  return out.slice(0, 20);
}

function graphqlPrice(item) {
  const v = item?.price_range?.minimum_price?.final_price?.value;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n.toFixed(2) : null;
}

function toImportRow(item, categoryName) {
  const sku = String(item.sku || "").trim();
  const title = String(item.name || "").trim();
  const handle = String(item.url_key || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9-]+/g, "-")
    .replace(/^-+|-+$/g, "");
  const body = String(item?.description?.html || "").trim() || `<p>${escapeHtml(title)}</p>`;
  const gqlPrice = graphqlPrice(item);
  const price =
    gqlPrice || fallbackPriceGbp(sku, title, categoryName);
  const { tags, productType } = applyTagsAndType(title, categoryName);

  return {
    handle: handle || `seconique-${sku}`.toLowerCase().replace(/[^a-z0-9-]+/g, "-"),
    title,
    body_html: body,
    vendor: "Seconique",
    product_type: productType,
    tags,
    variants: [{ price, sku }],
    images: collectImages(item),
  };
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

async function gql(query, variables) {
  const res = await fetch(GRAPHQL, {
    method: "POST",
    headers: { "Content-Type": "application/json", "User-Agent": UA },
    body: JSON.stringify({ query, variables: variables || {} }),
  });
  if (!res.ok) throw new Error(`GraphQL HTTP ${res.status}`);
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

const TREE_QUERY = `query SeconiqueCategories {
  category(id: 2) {
    id
    children {
      id
      name
      url_path
      product_count
    }
  }
}`;

const PRODUCTS_QUERY = `query SeconiqueCatProducts($uid: String!, $pageSize: Int!, $currentPage: Int!) {
  products(
    filter: { category_uid: { eq: $uid } }
    pageSize: $pageSize
    currentPage: $currentPage
  ) {
    total_count
    page_info {
      current_page
      page_size
      total_pages
    }
    items {
      sku
      name
      url_key
      description { html }
      image { url }
      media_gallery {
        url
        disabled
      }
      price_range {
        minimum_price {
          final_price { value currency }
        }
      }
    }
  }
}`;

async function fetchCategoryChildren() {
  const data = await gql(TREE_QUERY);
  const kids = data?.category?.children || [];
  return kids.filter(
    (c) =>
      c &&
      Number(c.product_count) > 0 &&
      c.url_path &&
      !SKIP_URL_PATH.has(String(c.url_path).toLowerCase())
  );
}

async function fetchAllProductsInCategory(numericId, categoryName, delayMs) {
  const uid = categoryUidFromNumericId(numericId);
  const all = [];
  let page = 1;
  let totalPages = 1;
  while (page <= totalPages) {
    const data = await gql(PRODUCTS_QUERY, {
      uid,
      pageSize: PAGE_SIZE,
      currentPage: page,
    });
    const conn = data?.products;
    const items = conn?.items || [];
    const pi = conn?.page_info;
    const tc = Number(conn?.total_count) || 0;
    totalPages = Math.max(
      1,
      Number(pi?.total_pages) || Math.ceil(tc / PAGE_SIZE) || 1
    );
    for (const it of items) {
      all.push(toImportRow(it, categoryName));
    }
    if (!items.length) break;
    page++;
    if (page <= totalPages) await sleep(delayMs);
  }
  return all;
}

async function main() {
  const outPath = path.resolve(process.cwd(), arg("out", DEFAULT_OUT));
  const delayMs = Math.max(0, parseInt(arg("delay-ms", "500"), 10) || 500);
  const limit = parseInt(arg("limit", "0"), 10) || 0;

  console.error("[seconique] Loading category tree (Default Category → children)…");
  const categories = await fetchCategoryChildren();
  console.error(`[seconique] Categories with products (after skip list): ${categories.length}`);

  const bySku = new Map();
  for (const cat of categories) {
    if (limit > 0 && bySku.size >= limit) break;
    const name = String(cat.name || "");
    console.error(`[seconique] ${name} (id=${cat.id}, count≈${cat.product_count})…`);
    const chunk = await fetchAllProductsInCategory(cat.id, name, delayMs);
    for (const row of chunk) {
      const sku = String(row?.variants?.[0]?.sku || "").trim();
      if (!sku || bySku.has(sku)) continue;
      bySku.set(sku, row);
      if (limit > 0 && bySku.size >= limit) break;
    }
    await sleep(delayMs);
  }

  let unique = [...bySku.values()];
  if (limit > 0) unique = unique.slice(0, limit);

  const zeros = unique.filter((r) => Number(r?.variants?.[0]?.price || 0) <= 0).length;
  console.error(`[seconique] Deduped SKUs: ${unique.length} price≤0: ${zeros}`);

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(unique, null, 2), "utf-8");
  console.error(`[seconique] Wrote ${unique.length} products -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
