#!/usr/bin/env node
/**
 * Heartlands Furniture product scraper — URLs only (no image downloads).
 *
 * Usage:
 *   node scripts/heartlands-scraper.mjs
 *   node scripts/heartlands-scraper.mjs --url=https://www.heartlandsfurniture.co.uk/product/slug/
 *   node scripts/heartlands-scraper.mjs --category=https://www.heartlandsfurniture.co.uk/product-category/dining/dining-tables/
 *   node scripts/heartlands-scraper.mjs --category=... --max-pages=3 --delay-ms=400
 *   node scripts/heartlands-scraper.mjs --shopify-json --out=data/heartlands/shopify-products.json
 *     (no --url/--category → full catalogue: discover categories from /shop/ + /, crawl all pages, dedupe)
 *   node scripts/heartlands-scraper.mjs --shopify-json --out=… --max-pages=50 --delay-ms=350 --limit=20
 *   node scripts/heartlands-scraper.mjs --shopify-json --out=… --category=URL   (single category only)
 *
 * Import to Shopify:
 *   node scripts/heartlands-import-to-shopify.mjs --dry-run [--file=…]
 *   node scripts/heartlands-import-to-shopify.mjs --apply --publish [--limit=N]
 */

import axios from "axios";
import { load } from "cheerio";
import fs from "fs";
import path from "path";

const BASE = "https://www.heartlandsfurniture.co.uk";
const DEFAULT_PRODUCT =
  "https://www.heartlandsfurniture.co.uk/product/acodia-dining-table-clear-glass-black/";

/** Fallback if /shop/ discovery finds no category links. */
const DEFAULT_CATEGORY_FOR_BULK =
  "https://www.heartlandsfurniture.co.uk/product-category/dining/dining-tables/";
const DEFAULT_DISCOVER_SEEDS = [`${BASE}/shop/`, `${BASE}/`];
/**
 * Per-category WooCommerce pagination cap.
 * 500 pages × delay can take hours for the first category; default is conservative.
 * Full exhaust: `npm run heartlands:shopify:exhaustive` or `--max-pages=500`.
 */
const DEFAULT_FULL_MAX_PAGES = 100;
const DEFAULT_DELAY_MS = 400;
const FETCH_RETRIES = 4;
const FETCH_RETRY_BASE_MS = 350;

const UA =
  "Mozilla/5.0 (compatible; UbeeCatalogBot/1.0; +https://ubeefurniture.co.uk)";

const client = axios.create({
  timeout: 30000,
  headers: {
    "User-Agent": UA,
    Accept: "text/html,application/xhtml+xml",
  },
  validateStatus: (s) => s >= 200 && s < 400,
});

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function arg(name, def = null) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

/** WordPress/WooCommerce: strip all -WxH segments before file extension. */
function stripWpImageSizeSuffixes(pathname) {
  let p = pathname;
  let prev;
  do {
    prev = p;
    p = p.replace(/-\d+x\d+(?=\.[a-z0-9]+(?:\?.*)?$)/i, "");
  } while (p !== prev);
  return p;
}

/** WordPress/WooCommerce: resolve URL and drop thumbnail dimensions. */
export function normalizeImageUrl(raw, baseUrl = BASE) {
  if (!raw || typeof raw !== "string") return null;
  let u = raw.trim();
  if (!u) return null;
  if (u.startsWith("//")) u = "https:" + u;
  else if (u.startsWith("/")) u = baseUrl.replace(/\/$/, "") + u;
  try {
    const url = new URL(u);
    url.pathname = stripWpImageSizeSuffixes(url.pathname);
    url.search = "";
    return url.toString();
  } catch {
    return u;
  }
}

function collectGalleryImageUrls($) {
  const seen = new Set();
  const add = (src) => {
    const n = normalizeImageUrl(src);
    if (n && !seen.has(n)) seen.add(n);
  };

  $(".woocommerce-product-gallery img").each((_, el) => {
    const $el = $(el);
    add($el.attr("data-large_image"));
    add($el.attr("data-src"));
    add($el.attr("data-lazy-src"));
    add($el.attr("srcset")?.split(",")[0]?.trim().split(/\s+/)[0]);
    add($el.attr("src"));
  });

  $(".woocommerce-product-gallery a").each((_, el) => {
    add($(el).attr("href"));
    add($(el).attr("data-large_image"));
  });

  return [...seen].filter(Boolean);
}

function extractSku($, html) {
  const fromClass = $(".sku").first().text().trim();
  if (fromClass) return fromClass;

  const metaSku = $('meta[itemprop="sku"]').attr("content")?.trim();
  if (metaSku) return metaSku;

  const m = html.match(/SKU:\s*<\/span>\s*<span[^>]*>([^<]+)/i) || html.match(/SKU:\s*([A-Z0-9][A-Z0-9_-]*)/i);
  if (m) return m[1].trim();

  return "";
}

function extractDescriptionHtml($) {
  const panels = $(".woocommerce-Tabs-panel");
  if (panels.length) {
    return panels
      .map((_, el) => $.html(el))
      .get()
      .join("\n");
  }
  const desc = $("#tab-description");
  if (desc.length) return $.html(desc);
  return "";
}

export async function scrapeProductPage(productUrl) {
  const html = await fetchHtmlWithRetry(productUrl, `product`);
  const $ = load(html);

  const title =
    $("h1.product_title").first().text().trim() ||
    $("h1.entry-title").first().text().trim() ||
    $("h1").first().text().trim();

  const images = collectGalleryImageUrls($);
  const description = extractDescriptionHtml($);
  const sku = extractSku($, html);
  const price = parsePriceText($, html) || "";

  return {
    title,
    sku,
    description,
    images,
    price,
    supplier: "Heartlands",
    sourceUrl: productUrl,
  };
}

function handleFromUrl(productUrl) {
  try {
    const p = new URL(productUrl).pathname.replace(/\/+$/, "");
    const seg = p.split("/").filter(Boolean);
    const i = seg.indexOf("product");
    if (i >= 0 && seg[i + 1]) return seg[i + 1];
    return seg[seg.length - 1] || "product";
  } catch {
    return "product";
  }
}

/** Strip to decimal price string (WooCommerce / Astra / JSON-LD). */
function parsePriceText($, html) {
  const selectors = [
    ".summary .price .woocommerce-Price-amount bdi",
    ".entry-summary .price .woocommerce-Price-amount bdi",
    ".price .woocommerce-Price-amount.amount bdi",
    ".price ins .woocommerce-Price-amount bdi",
    "p.price .woocommerce-Price-amount",
    "span.woocommerce-Price-amount bdi",
    ".woocommerce-Price-amount",
  ];
  for (const sel of selectors) {
    const t = $(sel).first().text().replace(/[^\d.]/g, "");
    if (t) return t;
  }
  const m = html.match(/"price"\s*:\s*"([\d.]+)"/i) || html.match(/£\s*([\d,.]+)/);
  if (m) return m[1].replace(/,/g, "");

  const ldScripts = $('script[type="application/ld+json"]');
  for (let i = 0; i < ldScripts.length; i++) {
    try {
      const j = JSON.parse($(ldScripts[i]).html() || "{}");
      const graph = j["@graph"] || [j];
      for (const node of graph) {
        const off = node.offers;
        const p = Array.isArray(off) ? off[0]?.price : off?.price;
        if (p) return String(p).replace(/[^\d.]/g, "");
      }
    } catch {
      /* skip */
    }
  }
  return "";
}

export function toShopifyProduct(record, priceOverride = "") {
  const handle = handleFromUrl(record.sourceUrl);
  const price = priceOverride || record.price || "0.00";

  return {
    handle,
    title: record.title,
    body_html: record.description || "",
    vendor: "Heartlands",
    product_type: "",
    variants: [{ price, sku: record.sku || undefined }],
    images: record.images.map((src) => ({ src })),
  };
}

/** First scrape wins (stable URL order). */
function dedupeRecordsByHandle(records) {
  const m = new Map();
  for (const rec of records) {
    const h = handleFromUrl(rec.sourceUrl);
    if (!m.has(h)) m.set(h, rec);
  }
  return [...m.values()];
}

async function fetchHtml(url) {
  const res = await client.get(url);
  return res.data;
}

async function fetchHtmlWithRetry(url, label = "") {
  let lastErr;
  for (let attempt = 0; attempt < FETCH_RETRIES; attempt++) {
    try {
      const res = await client.get(url);
      return res.data;
    } catch (e) {
      lastErr = e;
      const msg = e?.message || String(e);
      console.error(
        `[heartlands] fetch fail ${attempt + 1}/${FETCH_RETRIES} ${label || url.slice(0, 72)}… — ${msg}`
      );
      if (attempt < FETCH_RETRIES - 1) {
        await sleep(FETCH_RETRY_BASE_MS * (attempt + 1));
      }
    }
  }
  throw lastErr;
}

/** Listing / menu links to WooCommerce product-category archives. */
export function extractProductCategoryLinks(html, base = BASE) {
  const $ = load(html);
  const out = new Set();
  $("a[href*='/product-category/']").each((_, el) => {
    let href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("/")) href = base.replace(/\/$/, "") + href;
    try {
      const u = new URL(href);
      if (!u.hostname.includes("heartlandsfurniture.co.uk")) return;
      const p = u.pathname.replace(/\/+$/, "") + "/";
      out.add(u.origin + p);
    } catch {
      /* skip */
    }
  });
  return [...out];
}

export async function discoverCategoryUrls(seeds = DEFAULT_DISCOVER_SEEDS, delayMs = DEFAULT_DELAY_MS) {
  const categories = new Set();
  for (const seed of seeds) {
    try {
      const html = await fetchHtmlWithRetry(seed, `discover:${seed}`);
      for (const u of extractProductCategoryLinks(html)) {
        categories.add(u);
      }
      console.error(`[heartlands] Discovered ${categories.size} unique category URLs (after ${seed})`);
    } catch (e) {
      console.error(`[heartlands] discover failed ${seed}:`, e.message || e);
    }
    if (delayMs) await sleep(delayMs);
  }
  const list = [...categories].sort();
  if (!list.length) {
    console.error("[heartlands] No categories from discovery; using fallback dining-tables URL");
    return [DEFAULT_CATEGORY_FOR_BULK];
  }
  return list;
}

/** Product links from a WooCommerce listing page. */
export function extractProductLinksFromCategoryHtml(html, base = BASE) {
  const $ = load(html);
  const out = new Set();

  $('a[href*="/product/"]').each((_, el) => {
    let href = $(el).attr("href");
    if (!href) return;
    if (href.startsWith("/")) href = base.replace(/\/$/, "") + href;
    if (!href.includes("/product/")) return;
    try {
      const u = new URL(href);
      if (!u.hostname.includes("heartlandsfurniture.co.uk")) return;
      const path = u.pathname.replace(/\/+$/, "");
      if (/\/product\/[^/]+\/?$/.test(path)) out.add(u.origin + path + "/");
    } catch {
      /* skip */
    }
  });

  return [...out];
}

function nextCategoryPageUrl(html, currentUrl) {
  const $ = load(html);
  const cur = new URL(currentUrl);

  let next = $(".woocommerce-pagination a.next").attr("href");
  if (next) {
    if (next.startsWith("/")) next = BASE + next;
    return next;
  }

  const page = Number(cur.searchParams.get("page") || "1") + 1;
  cur.searchParams.set("page", String(page));
  return cur.toString();
}

export async function crawlCategoryProductUrls(categoryUrl, options = {}) {
  const maxPages = options.maxPages ?? 50;
  const delayMs = options.delayMs ?? 300;
  const seenPages = new Set();
  const productUrls = new Set();
  let pageUrl = categoryUrl.split("#")[0];
  let pages = 0;
  let stagnantPages = 0;

  while (pageUrl && pages < maxPages && !seenPages.has(pageUrl)) {
    seenPages.add(pageUrl);
    pages++;
    const sizeBefore = productUrls.size;
    const html = await fetchHtmlWithRetry(pageUrl, `category p${pages}`);
    for (const u of extractProductLinksFromCategoryHtml(html)) {
      productUrls.add(u);
    }
    if (productUrls.size === sizeBefore) stagnantPages++;
    else stagnantPages = 0;
    if (pages % 10 === 0 || pages === 1) {
      console.error(
        `[heartlands]   listing page ${pages}/${maxPages} → ${productUrls.size} product URLs`
      );
    }
    if (stagnantPages >= 3) {
      console.error(
        `[heartlands]   stop: no new product URLs for ${stagnantPages} pages (pagination likely ended)`
      );
      break;
    }
    const next = nextCategoryPageUrl(html, pageUrl);
    if (!next || seenPages.has(next) || next === pageUrl) break;
    pageUrl = next;
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }

  return [...productUrls];
}

function hasExplicitArg(name) {
  return process.argv.some((a) => a.startsWith(`--${name}=`));
}

async function main() {
  const outPath = arg("out", "");
  const shopifyJson = hasFlag("shopify-json");
  const useDefaultBulk =
    shopifyJson &&
    outPath &&
    !hasExplicitArg("category") &&
    !hasExplicitArg("url");

  const url = arg("url", DEFAULT_PRODUCT);
  const categoryArg = arg("category", "");
  const maxPages = Number(
    arg(
      "max-pages",
      useDefaultBulk ? String(DEFAULT_FULL_MAX_PAGES) : categoryArg ? "50" : "5"
    )
  );
  const delayMs = Number(arg("delay-ms", String(DEFAULT_DELAY_MS)));
  const limit = arg("limit", "");

  let records = [];

  if (useDefaultBulk) {
    const categories = await discoverCategoryUrls(DEFAULT_DISCOVER_SEEDS, delayMs);
    console.error(
      `[heartlands] Full catalogue: ${categories.length} categories, max ${maxPages} pages each, delay ${delayMs}ms`
    );
    const productUrls = new Set();
    for (let c = 0; c < categories.length; c++) {
      const cat = categories[c];
      try {
        const beforeU = productUrls.size;
        const urls = await crawlCategoryProductUrls(cat, { maxPages, delayMs });
        for (const u of urls) productUrls.add(u);
        const newU = productUrls.size - beforeU;
        console.error(
          `[heartlands] [${c + 1}/${categories.length}] ${cat} → +${newU} new (${urls.length} raw) → unique ${productUrls.size}`
        );
      } catch (e) {
        console.error(`[heartlands] Category crawl failed ${cat}:`, e.message || e);
      }
      if (delayMs && c < categories.length - 1) await sleep(delayMs);
    }
    let list = [...productUrls];
    list.sort();
    console.error(`[heartlands] Unique product URLs: ${list.length}`);
    const cap =
      limit === "" ? 0 : Number(limit);
    if (Number.isFinite(cap) && cap > 0) {
      list = list.slice(0, cap);
      console.error(`[heartlands] Capped scrape to first ${cap} URLs (--limit)`);
    }
    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      try {
        const rec = await scrapeProductPage(u);
        records.push(rec);
        console.error(`[heartlands] ${i + 1}/${list.length} ${rec.title || u}`);
      } catch (e) {
        console.error(`[heartlands] FAIL ${u}`, e.message || e);
      }
      if (delayMs && i < list.length - 1) await sleep(delayMs);
    }
  } else if (categoryArg) {
    console.error(
      `[heartlands] Crawling category (max ${maxPages} pages, delay ${delayMs}ms)…`
    );
    let urls;
    try {
      urls = await crawlCategoryProductUrls(categoryArg, {
        maxPages,
        delayMs,
      });
    } catch (e) {
      console.error("[heartlands] Category crawl failed:", e.message);
      process.exit(1);
    }
    console.error(`[heartlands] Found ${urls.length} product URLs`);
    let list = urls;
    const capSingle =
      limit === "" ? 0 : Number(limit);
    if (Number.isFinite(capSingle) && capSingle > 0) {
      list = list.slice(0, capSingle);
    }

    for (let i = 0; i < list.length; i++) {
      const u = list[i];
      try {
        const rec = await scrapeProductPage(u);
        records.push(rec);
        console.error(`[heartlands] ${i + 1}/${list.length} ${rec.title || u}`);
      } catch (e) {
        console.error(`[heartlands] FAIL ${u}`, e.message);
      }
      if (delayMs && i < list.length - 1) await sleep(delayMs);
    }
  } else {
    const rec = await scrapeProductPage(url);
    records = [rec];
  }

  const quietRaw =
    shopifyJson && outPath && records.length > 1;

  if (!quietRaw) {
    if (records.length === 1) {
      console.log(JSON.stringify(records[0], null, 2));
    } else {
      console.log(JSON.stringify(records, null, 2));
    }
  } else {
    console.error(
      `[heartlands] Scraped ${records.length} products (raw JSON omitted; use stdout without --out to print)`
    );
  }

  if (shopifyJson) {
    const deduped = dedupeRecordsByHandle(records);
    if (deduped.length !== records.length) {
      console.error(
        `[heartlands] Deduped by handle: ${records.length} → ${deduped.length}`
      );
    }
    const shopify = deduped.map((r) => toShopifyProduct(r));

    const payload = { products: shopify };
    const json = JSON.stringify(payload, null, 2);

    if (outPath) {
      const dir = path.dirname(outPath);
      if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
      const tmpPath = `${outPath}.tmp.${process.pid}`;
      fs.writeFileSync(tmpPath, json, "utf8");
      fs.renameSync(tmpPath, outPath);
      const bytes = fs.statSync(outPath).size;
      console.error(
        `[heartlands] Wrote Shopify JSON (${shopify.length} products, ${bytes} bytes) → ${outPath}`
      );
    } else {
      console.log("\n--- Shopify import shape ---\n");
      console.log(json);
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
