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
 *     (no --url/--category → crawls dining tables category, up to 10 products)
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

/** Used when --shopify-json --out=… and no --category / --url (mini catalog for import). */
const DEFAULT_CATEGORY_FOR_BULK =
  "https://www.heartlandsfurniture.co.uk/product-category/dining/dining-tables/";
const DEFAULT_BULK_LIMIT = 10;
const DEFAULT_BULK_MAX_PAGES = 3;

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
  const res = await client.get(productUrl);
  const html = res.data;
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

async function fetchHtml(url) {
  const res = await client.get(url);
  return res.data;
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

  while (pageUrl && pages < maxPages && !seenPages.has(pageUrl)) {
    seenPages.add(pageUrl);
    pages++;
    const html = await fetchHtml(pageUrl);
    for (const u of extractProductLinksFromCategoryHtml(html)) {
      productUrls.add(u);
    }
    const next = nextCategoryPageUrl(html, pageUrl);
    if (!next || seenPages.has(next) || next === pageUrl) break;
    pageUrl = next;
    if (delayMs) await new Promise((r) => setTimeout(r, delayMs));
  }

  return [...productUrls];
}

async function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
  const category = useDefaultBulk
    ? DEFAULT_CATEGORY_FOR_BULK
    : arg("category", "");
  const maxPages = Number(
    arg("max-pages", useDefaultBulk ? String(DEFAULT_BULK_MAX_PAGES) : "5")
  );
  const delayMs = Number(arg("delay-ms", "400"));
  const limit = arg(
    "limit",
    useDefaultBulk ? String(DEFAULT_BULK_LIMIT) : ""
  );

  let records = [];

  if (category) {
    console.error(
      `[heartlands] Crawling category (max ${maxPages} pages, delay ${delayMs}ms)…`
    );
    let urls;
    try {
      urls = await crawlCategoryProductUrls(category, {
        maxPages,
        delayMs,
      });
    } catch (e) {
      console.error("[heartlands] Category crawl failed:", e.message);
      process.exit(1);
    }
    console.error(`[heartlands] Found ${urls.length} product URLs`);
    let list = urls;
    if (limit) list = list.slice(0, Number(limit));

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
    const shopify = records.map((r) => toShopifyProduct(r));

    const payload = { products: shopify };
    const json = JSON.stringify(payload, null, 2);

    if (outPath) {
      const dir = path.dirname(outPath);
      if (dir && dir !== ".") fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(outPath, json, "utf8");
      console.error(`[heartlands] Wrote Shopify JSON (${shopify.length} products) → ${outPath}`);
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
