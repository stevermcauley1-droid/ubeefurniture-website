/**
 * Update Shopify variant prices from the FTG price CSV:
 *   - Parse `FTG-Price-List-2026-02-17.csv` (or FTG_PRICE_CSV_PATH / FTG_CSV_PATH)
 *   - For each SKU, find the matching Shopify ProductVariant ID
 *   - Compute sell price using lib/pricing/ftgPricing (currently cost * 1.30)
 *   - Call Shopify Admin API `productVariantUpdate` to set `price`
 *
 * No database required.
 *
 * Usage:
 *   node scripts/ftg/update-shopify-variant-prices-from-ftg.ts --limit=50
 *   node scripts/ftg/update-shopify-variant-prices-from-ftg.ts --all
 *
 * Requires:
 *   SHOPIFY_STORE_DOMAIN
 *   SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN)
 *   FTG-Price-List-2026-02-17.csv in project root
 *
 * Shopify scopes:
 *   - read_products (to find variants by SKU)
 *   - write_products (to update prices)
 */

import fs from "fs";
import path from "path";
import { parseFtgPrice } from "./parse-ftg-price";
import { computeSellPrice } from "../../lib/pricing/ftgPricing";
import { normalizeSku } from "./sku";

import { createRequire } from "module";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(process.cwd());
require("dotenv").config({ path: path.join(projectRoot, ".env.local") });
require("dotenv").config({ path: path.join(projectRoot, ".env") });

type ShopifyAdminToken = string | undefined;

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const adminToken: ShopifyAdminToken =
  process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;

// productVariantsBulkUpdate is more consistently available on newer API versions.
const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function adminGraphql<T>(
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  if (!adminToken) throw new Error("Missing SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN)");

  const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": adminToken,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    throw new Error(`Admin API HTTP ${res.status}: ${res.statusText}${t ? ` - ${t.slice(0, 300)}` : ""}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return json.data as T;
}

async function findVariantIdBySku(sku: string): Promise<string | null> {
  const data = await adminGraphql<{
    productVariants: { nodes: Array<{ id: string; sku: string }> };
  }>(
    `query FindVariantBySku($query: String!) {
      productVariants(first: 1, query: $query) {
        nodes { id sku }
      }
    }`,
    { query: `sku:${sku}` }
  );
  return data?.productVariants?.nodes?.[0]?.id ?? null;
}

async function updateVariantPrice(
  productId: string,
  variantId: string,
  price: number
): Promise<void> {
  const data = await adminGraphql<{
    productVariantsBulkUpdate?: {
      userErrors: Array<{ field?: string[]; message: string }>;
    };
  }>(
    `mutation UpdateVariantPriceInBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors { field message }
      }
    }`,
    {
      productId,
      variants: [
        {
          id: variantId,
          price: price.toFixed(2),
        },
      ],
    }
  );

  const errs = data?.productVariantsBulkUpdate?.userErrors?.filter((e) => e.message) ?? [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

function getArgValue(flag: string): string | null {
  const hit = process.argv.find((a) => a.startsWith(flag + "="));
  if (!hit) return null;
  return hit.split("=", 2)[1] ?? null;
}

function loadImportResultsMap(
  resultsPath: string
): Map<string, { productId: string; variantId: string }> {
  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Missing results file: ${resultsPath}`);
  }
  const lines = fs.readFileSync(resultsPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const bySku = new Map<string, { productId: string; variantId: string }>();
  for (const line of lines) {
    try {
      const row = JSON.parse(line) as {
        sku?: string;
        shopify_product_id?: string | null;
        variant_id?: string | null;
        action?: string | null;
      };
      const sku = row.sku;
      const variantId = row.variant_id ?? null;
      const productId = row.shopify_product_id ?? null;
      if (!sku || !variantId || !productId) continue;
      const key = normalizeSku(String(sku));
      if (!key) continue;
      // Prefer the last successful entry for a given sku.
      bySku.set(key, { productId: String(productId), variantId: String(variantId) });
    } catch {
      // ignore invalid json lines
    }
  }
  return bySku;
}

async function main() {
  const all = process.argv.includes("--all");
  const limitStr = getArgValue("--limit");
  const singleSku = getArgValue("--sku");
  const limit = all ? Number.MAX_SAFE_INTEGER : limitStr ? Math.max(0, parseInt(limitStr, 10)) : 50;

  const pricingRows = parseFtgPrice({ includeRaw: false });
  console.log(`FTG pricing rows: ${pricingRows.length}`);

  let updated = 0;
  let skipped = 0;
  let failed = 0;

  const resultsPath =
    getArgValue("--results") ||
    path.join(process.cwd(), "data", "ftg", "shopify-import-results.jsonl");

  const variantIdBySku = loadImportResultsMap(resultsPath);
  const skusInResults = Array.from(variantIdBySku.keys());

  // Compute sell prices for SKUs we have in Shopify import results.
  const sellPriceBySku = new Map<string, number>();
  for (const r of pricingRows) {
    if (!r.sku) continue;
    const sku = normalizeSku(String(r.sku));
    if (!sku || !variantIdBySku.has(sku)) continue;
    const cost = r.costPrice;
    const rrp = r.rrp ?? null;
    if (cost == null || !Number.isFinite(cost) || (cost as number) <= 0) continue;
    const { sellPrice } = computeSellPrice({ cost, rrp });
    if (sellPrice == null || sellPrice <= 0) continue;
    sellPriceBySku.set(sku, sellPrice);
  }

  let skusToProcess = skusInResults.slice(0, limit);
  if (singleSku) {
    const key = normalizeSku(singleSku);
    if (!variantIdBySku.has(key)) {
      console.error(`No shopify-import-results.jsonl entry for --sku=${singleSku} (normalized key=${key})`);
      process.exit(1);
    }
    skusToProcess = [key];
    console.log(`Single SKU mode: ${singleSku} → ${key}`);
  } else {
    console.log(`Import results SKUs: ${skusInResults.length}`);
    console.log(`Will update up to: ${skusToProcess.length} variant(s)`);
  }

  for (let i = 0; i < skusToProcess.length; i++) {
    const sku = skusToProcess[i];
    const ids = variantIdBySku.get(sku);
    const sellPrice = sellPriceBySku.get(sku);

    if (!ids) {
      skipped++;
      continue;
    }
    if (sellPrice == null || !Number.isFinite(sellPrice)) {
      skipped++;
      if (i < 10) console.warn(`[price] No computed price for sku: ${sku}`);
      continue;
    }
    try {
      await updateVariantPrice(ids.productId, ids.variantId, sellPrice);
      updated++;
    } catch (e) {
      failed++;
      const msg = e instanceof Error ? e.message : String(e);
      if (i < 20) console.error(`[price] Failed SKU ${sku}:`, msg);
    }

    // Gentle throttle to avoid Shopify rate limiting
    if ((i + 1) % 5 === 0) await sleep(400);
  }

  console.log("\n--- Price sync summary ---");
  console.log(`Updated: ${updated}`);
  console.log(`Skipped: ${skipped}`);
  console.log(`Failed: ${failed}`);
}

main().catch((err) => {
  console.error("update-shopify-variant-prices-from-ftg failed:", err?.message || err);
  process.exit(1);
});

