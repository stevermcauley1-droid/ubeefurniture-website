import fs from "fs";
import path from "path";
import { config } from "dotenv";
import { getAdminAccessToken } from "../../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

const RANGE_OVERRIDES: Record<string, string> = {
  "4-kids": "4kids",
  "4-you": "4you",
  /** Single nav collection for two FTG range names */
  dice: "dice-mice",
  mice: "dice-mice",
};

function toRangeHandle(range: string): string {
  const base = String(range || "")
    .toLowerCase()
    .replace(/\(new\)/gi, "")
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return RANGE_OVERRIDES[base] || base;
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  const token = await getAdminAccessToken();
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(`Admin API error: ${res.status} ${JSON.stringify(json.errors || json).slice(0, 300)}`);
  }
  return json.data as T;
}

async function main() {
  const root = process.cwd();
  const normalizedPath = path.join(root, "data", "ftg", "ftg-normalized.jsonl");
  const resultsPath = path.join(root, "data", "ftg", "shopify-import-results.jsonl");
  if (!fs.existsSync(normalizedPath) || !fs.existsSync(resultsPath)) {
    throw new Error("Missing ftg-normalized or shopify-import-results file");
  }

  const skuToRange = new Map<string, string>();
  for (const line of fs.readFileSync(normalizedPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const o = JSON.parse(line);
    const sku = String(o.sku || "").trim();
    const range = String(o.range || "").trim();
    if (!sku || !range) continue;
    skuToRange.set(sku, toRangeHandle(range));
  }

  const updates: Array<{ productId: string; rangeHandle: string }> = [];
  for (const line of fs.readFileSync(resultsPath, "utf8").split(/\r?\n/).filter(Boolean)) {
    const o = JSON.parse(line);
    const sku = String(o.sku || "").trim();
    const productId = String(o.shopify_product_id || "").trim();
    if (!sku || !productId) continue;
    const rangeHandle = skuToRange.get(sku);
    if (!rangeHandle) continue;
    updates.push({ productId, rangeHandle });
  }

  const byProduct = new Map<string, string>();
  for (const u of updates) {
    if (!byProduct.has(u.productId)) byProduct.set(u.productId, u.rangeHandle);
  }

  let touched = 0;
  for (const [productId, rangeHandle] of byProduct.entries()) {
    const q = await gql<{
      product: { id: string; tags: string[] } | null;
    }>(
      `query($id: ID!) { product(id: $id) { id tags } }`,
      { id: productId }
    );
    if (!q.product) continue;
    const tags = new Set(q.product.tags || []);
    tags.add(`ftg_range:${rangeHandle}`);
    await gql(
      `mutation($input: ProductInput!) { productUpdate(input: $input) { userErrors { message } } }`,
      { input: { id: productId, tags: [...tags] } }
    );
    touched++;
    if (touched % 100 === 0) console.log(`tagged ${touched} products...`);
  }

  console.log(`Done. range tags applied to ${touched} products.`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

