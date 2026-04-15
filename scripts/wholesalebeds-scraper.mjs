#!/usr/bin/env node
/**
 * Wholesale Beds catalogue scraper.
 *
 * Pulls products from WooCommerce Store API and (optionally) enriches price
 * using a plain-text extracted PDF price list.
 *
 * Usage:
 *   node scripts/wholesalebeds-scraper.mjs
 *   node scripts/wholesalebeds-scraper.mjs --out=data/wholesalebeds/shopify-products.json
 *   node scripts/wholesalebeds-scraper.mjs --overrides=data/wholesalebeds/price-overrides.csv
 *   node scripts/wholesalebeds-scraper.mjs --price-pdf-text="C:/path/ISSUE 14_.pdf"
 *   node scripts/wholesalebeds-scraper.mjs --limit=25
 *
 * Import:
 *   node scripts/heartlands-import-to-shopify.mjs --dry-run --file=data/wholesalebeds/shopify-products.json
 *   node scripts/heartlands-import-to-shopify.mjs --apply --publish --file=data/wholesalebeds/shopify-products.json
 *
 * After import:
 *   npm run wholesalebeds:ensure-storefront
 *   (assigns smart-collection tags/types, activates, publishes to Online Store + Headless)
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { parse as parseCsv } from "csv-parse/sync";

const require = createRequire(import.meta.url);
const { PDFParse } = require("pdf-parse");

const BASE = "https://wholesalebeds.co.uk";
const API = `${BASE}/wp-json/wc/store/v1/products`;
const DEFAULT_OUT = path.join("data", "wholesalebeds", "shopify-products.json");
const DEFAULT_OVERRIDES_CSV = path.join("data", "wholesalebeds", "price-overrides.csv");
const DEFAULT_PDF_TEXT =
  "C:/Users/steve/AppData/Roaming/Cursor/User/workspaceStorage/7b1571f136baf285b8d398c64ccd1e9c/pdfs/041b3ff5-fd75-4c91-a498-4d3c7c0f5448/ISSUE 14_.pdf";
const SUPPLIER_TAGS = ["wholesalebeds", "supplier-wholesalebeds", "featured"];
const PAGE_SIZE = 100;

function arg(name, def = null) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function normalizeKey(v) {
  return String(v || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]/g, "");
}

function asDecimalPrice(raw) {
  if (raw == null) return "";
  const s = String(raw).replace(/[^\d.]/g, "");
  if (!s) return "";
  const n = Number(s);
  if (!Number.isFinite(n)) return "";
  return n.toFixed(2);
}

function productTypeFromCategories(categories) {
  const names = (categories || [])
    .map((c) => String(c?.name || "").trim())
    .filter(Boolean);
  const first = names.find((n) => {
    const low = n.toLowerCase();
    return !["featured", "sgs", "platinum collection"].includes(low);
  });
  return first || "Furniture";
}

function extractTagHints(product) {
  const out = new Set(SUPPLIER_TAGS);
  for (const c of product.categories || []) {
    const n = String(c?.name || "").trim().toLowerCase();
    if (!n) continue;
    if (n === "featured") continue;
    const safe = n.replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (safe) out.add(safe);
  }
  return [...out];
}

const IGNORE_CODE_TOKENS = new Set([
  "DISCOUNT",
  "PRICES",
  "CONTRACT",
  "PAGE",
  "WHOLESALE",
]);

function parsePriceListText(text) {
  const byCode = new Map();
  const lines = String(text || "")
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  let currentCode = "";
  for (const line of lines) {
    if (/^--\s*\d+\s+of\s+\d+\s*--$/i.test(line)) continue;

    const codeMatch = line.match(/\b([A-Z][A-Z0-9-]{2,})\b/g) || [];
    const candidateCode = codeMatch.find((c) => !IGNORE_CODE_TOKENS.has(c));
    if (candidateCode) {
      currentCode = candidateCode;
    }

    const prices = [...line.matchAll(/£\s*([0-9]+(?:\.[0-9]{1,2})?)/g)].map((m) =>
      Number(m[1])
    );
    if (currentCode && prices.length) {
      const min = Math.min(...prices.filter((n) => Number.isFinite(n) && n > 0));
      if (Number.isFinite(min) && min > 0 && !byCode.has(normalizeKey(currentCode))) {
        byCode.set(normalizeKey(currentCode), min.toFixed(2));
      }
    }
  }

  return byCode;
}

async function parsePriceListPdf(pdfPath) {
  const buf = fs.readFileSync(pdfPath);
  const parser = new PDFParse({ data: buf });
  try {
    const parsed = await parser.getText();
    return parsePriceListText(parsed?.text || "");
  } finally {
    await parser.destroy();
  }
}

function buildLookupCandidates(product) {
  const out = [];
  const sku = String(product.sku || "").trim();
  const name = String(product.name || "").trim();
  const slug = String(product.slug || "").trim();

  if (sku) out.push(normalizeKey(sku));
  if (name) out.push(normalizeKey(name));
  if (slug) {
    out.push(normalizeKey(slug));
    out.push(normalizeKey(slug.replace(/-/g, "")));
  }

  const codeish = (sku + " " + name).match(/\b[A-Z][A-Z0-9-]{2,}\b/g) || [];
  for (const c of codeish) {
    if (!IGNORE_CODE_TOKENS.has(c)) out.push(normalizeKey(c));
  }

  return [...new Set(out)].filter(Boolean);
}

/** PDF / price-list amount treated as wholesale cost (GBP). */
function getPdfWholesaleCost(product, priceMap) {
  const keys = buildLookupCandidates(product);
  for (const key of keys) {
    if (priceMap.has(key)) return Number(priceMap.get(key)) || 0;
  }
  for (const key of keys) {
    for (const [code, price] of priceMap.entries()) {
      if (key.includes(code) || code.includes(key)) return Number(price) || 0;
    }
  }
  return 0;
}

/** Retail = cost × 1.6, expressed as £X.99 */
function retailFromCost(cost) {
  const c = Number(cost);
  if (!Number.isFinite(c) || c <= 0) return null;
  const raw = c * 1.6;
  const with99 = Math.floor(raw) + 0.99;
  return Math.max(with99, 0.99).toFixed(2);
}

function hashSku(sku) {
  const s = String(sku || "");
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

/** Deterministic .99 price in [min, max] inclusive range. */
function categoryFallbackPrice(product) {
  const text = `${product.name || ""} ${product.slug || ""} ${(product.categories || [])
    .map((c) => c?.name)
    .join(" ")}`.toLowerCase();
  const sku = String(product.sku || "x");
  let min = 199.99;
  let max = 399.99;
  if (/\bmattresses?\b|\bmattress\b/.test(text)) {
    min = 99.99;
    max = 249.99;
  } else if (/\bwardrobes?\b|\bwardrobe\b/.test(text)) {
    min = 249.99;
    max = 499.99;
  } else if (/\bbed\b|\bbeds\b/.test(text)) {
    min = 199.99;
    max = 399.99;
  }
  const span = max - min;
  const t = (hashSku(sku) % 10001) / 10000;
  let v = min + t * span;
  v = Math.floor(v) + 0.99;
  if (v > max) v = Math.floor(max) + 0.99;
  if (v < min) v = min;
  return v;
}

function loadPriceOverrides(csvPath) {
  const map = new Map();
  if (!fs.existsSync(csvPath)) return map;
  let rows;
  try {
    rows = parseCsv(fs.readFileSync(csvPath, "utf-8"), {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      relax_column_count: true,
    });
  } catch {
    return map;
  }
  for (const row of rows) {
    const sku = String(row.sku || row.SKU || "").trim();
    if (!sku) continue;
    const cost = Number(String(row.cost ?? "").replace(/[^\d.]/g, "")) || 0;
    const price = Number(String(row.price ?? "").replace(/[^\d.]/g, "")) || 0;
    map.set(sku, { cost, price });
  }
  return map;
}

function escapeCsvField(v) {
  const s = String(v ?? "");
  if (/[",\n\r]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
  return s;
}

function writePriceOverridesCsv(csvPath, entries) {
  const lines = ["sku,cost,price"];
  for (const e of entries) {
    const costCol = e.cost != null && e.cost > 0 ? Number(e.cost).toFixed(2) : "";
    lines.push(`${escapeCsvField(e.sku)},${costCol},${Number(e.price).toFixed(2)}`);
  }
  fs.mkdirSync(path.dirname(csvPath), { recursive: true });
  fs.writeFileSync(csvPath, lines.join("\n") + "\n", "utf-8");
}

function computeFinalSkus(products) {
  const used = new Set();
  const out = [];
  for (const p of products) {
    let sku = String(p.sku || "").trim() || `WB-${p.slug || "item"}`;
    let candidate = sku;
    let n = 0;
    while (used.has(candidate)) {
      n++;
      candidate = `${sku}-${p.slug || "h"}${n > 1 ? `-${n}` : ""}`;
      if (candidate.length > 255) candidate = candidate.slice(0, 255);
    }
    used.add(candidate);
    out.push(candidate);
  }
  return out;
}

function resolveVariantPrice(product, priceMap, overrideBySku, finalSku) {
  const pdfCost = getPdfWholesaleCost(product, priceMap);
  if (pdfCost > 0) {
    const p = retailFromCost(pdfCost);
    if (p) return p;
  }
  const skuKey = String(finalSku || "").trim();
  const o = skuKey ? overrideBySku.get(skuKey) : null;
  if (o) {
    if (o.price > 0) return o.price.toFixed(2);
    if (o.cost > 0) {
      const p = retailFromCost(o.cost);
      if (p) return p;
    }
  }
  return categoryFallbackPrice(product).toFixed(2);
}

function toTitleCaseWords(s) {
  return String(s || "")
    .toLowerCase()
    .replace(/\b([a-z])/g, (m) => m.toUpperCase());
}

function cleanTitle(raw) {
  let t = String(raw || "").trim().replace(/\s+/g, " ");
  if (t.length > 4 && t === t.toUpperCase() && /[A-Z]/.test(t)) t = toTitleCaseWords(t);
  return t;
}

function textFromHtml(html) {
  return String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function toImportRow(product, priceMap, overrideBySku, finalSku) {
  const title = cleanTitle(product.name);
  let body_html = String(product.description || product.short_description || "").trim();
  if (!textFromHtml(body_html)) {
    const pt = productTypeFromCategories(product.categories);
    body_html = `<p>${escapeHtml(title)} — ${escapeHtml(pt)}. Quality furniture from Wholesale Beds.</p>`;
  }

  const images = (product.images || [])
    .map((i) => i?.src)
    .filter((src) => /^https?:\/\//i.test(String(src || "").trim()))
    .map((src) => ({ src: String(src).trim() }));

  const price = resolveVariantPrice(product, priceMap, overrideBySku, finalSku);

  return {
    handle: String(product.slug || "").trim(),
    title,
    body_html,
    vendor: "Wholesale Beds",
    product_type: productTypeFromCategories(product.categories),
    tags: extractTagHints(product),
    variants: [
      {
        price,
        sku: String(finalSku || "").trim(),
      },
    ],
    images,
  };
}

async function fetchPage(page) {
  const url = `${API}?per_page=${PAGE_SIZE}&page=${page}`;
  let lastErr;
  for (let attempt = 0; attempt < 4; attempt++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status} ${res.statusText}`);
      return await res.json();
    } catch (e) {
      lastErr = e;
      await sleep(300 * (attempt + 1));
    }
  }
  throw lastErr;
}

async function fetchAllProducts() {
  const rows = [];
  let page = 1;
  while (true) {
    const arr = await fetchPage(page);
    if (!Array.isArray(arr) || !arr.length) break;
    rows.push(...arr);
    if (arr.length < PAGE_SIZE) break;
    page++;
    await sleep(200);
  }
  return rows;
}

async function main() {
  const outPath = path.resolve(process.cwd(), arg("out", DEFAULT_OUT));
  const overridesPath = path.resolve(process.cwd(), arg("overrides", DEFAULT_OVERRIDES_CSV));
  const limitArg = arg("limit", "");
  const cap =
    limitArg !== "" && limitArg !== "0"
      ? Math.max(1, parseInt(limitArg, 10) || 0)
      : 0;
  const pricePdfTextPath = path.resolve(
    process.cwd(),
    arg("price-pdf-text", DEFAULT_PDF_TEXT)
  );

  let priceMap = new Map();
  if (fs.existsSync(pricePdfTextPath)) {
    priceMap = await parsePriceListPdf(pricePdfTextPath);
    console.error(`[wholesalebeds] Parsed ${priceMap.size} code-price entries from price list`);
  } else {
    console.error(
      `[wholesalebeds] Price list PDF not found at ${pricePdfTextPath}; wholesale costs from PDF unavailable`
    );
  }

  const overrideBySku = loadPriceOverrides(overridesPath);
  if (overrideBySku.size) {
    console.error(`[wholesalebeds] Loaded ${overrideBySku.size} SKU rows from ${overridesPath}`);
  }

  console.error("[wholesalebeds] Fetching product catalogue from WooCommerce API...");
  let products = await fetchAllProducts();
  console.error(`[wholesalebeds] Raw products: ${products.length}`);

  if (cap > 0) {
    products = products.slice(0, cap);
    console.error(`[wholesalebeds] Capped to --limit=${cap}`);
  }

  const finalSkus = computeFinalSkus(products);
  const rows = products.map((p, i) => toImportRow(p, priceMap, overrideBySku, finalSkus[i]));

  const pricedFromPdf = products.filter((p) => getPdfWholesaleCost(p, priceMap) > 0).length;
  const zeros = rows.filter((r) => Number(r?.variants?.[0]?.price || 0) <= 0).length;
  console.error(
    `[wholesalebeds] Pricing: PDF wholesale match → retail (×1.6): ${pricedFromPdf}/${rows.length}; variants with price ≤ 0: ${zeros}`
  );

  const overrideEntries = [];
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (getPdfWholesaleCost(p, priceMap) > 0) continue;
    const sku = String(finalSkus[i] || "").trim();
    if (!sku) continue;
    const price = Number(rows[i]?.variants?.[0]?.price);
    const prev = overrideBySku.get(sku);
    overrideEntries.push({
      sku,
      cost: prev?.cost > 0 ? prev.cost : "",
      price,
    });
  }
  overrideEntries.sort((a, b) => a.sku.localeCompare(b.sku));
  writePriceOverridesCsv(overridesPath, overrideEntries);
  console.error(
    `[wholesalebeds] Wrote ${overrideEntries.length} override rows (no PDF cost) -> ${overridesPath}`
  );

  if (zeros > 0) {
    console.error("[wholesalebeds] ERROR: pipeline still has zero prices; aborting write.");
    process.exit(1);
  }

  fs.mkdirSync(path.dirname(outPath), { recursive: true });
  fs.writeFileSync(outPath, JSON.stringify(rows, null, 2), "utf-8");
  const bytes = fs.statSync(outPath).size;
  console.error(`[wholesalebeds] Wrote ${rows.length} products (${bytes} bytes) -> ${outPath}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
