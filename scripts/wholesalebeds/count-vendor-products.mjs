#!/usr/bin/env node
/**
 * Diagnostic: compare data/wholesalebeds/shopify-products.json handles vs
 * Admin products with vendor:"Wholesale Beds", and locate missing handles
 * globally (any vendor) if they exist.
 *
 * Usage: node scripts/wholesalebeds/count-vendor-products.mjs
 */
import path from "path";
import fs from "fs";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

function getConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain: domain || null, token: token || null };
}

async function main() {
  const { domain, token } = getConfig();
  if (!domain || !token) {
    console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN");
    process.exit(1);
  }

  const jsonPath = path.join("data", "wholesalebeds", "shopify-products.json");
  const list = fs.existsSync(jsonPath)
    ? JSON.parse(fs.readFileSync(jsonPath, "utf-8"))
    : [];
  const rows = Array.isArray(list) ? list : [];
  const localCount = rows.length;
  const jsonHandles = new Set(
    rows.map((r) => String(r.handle || "").trim()).filter(Boolean)
  );

  async function fetchAllHandles(queryStr) {
    const query = `query C($q: String!, $c: String) {
      products(first: 250, after: $c, query: $q) {
        pageInfo { hasNextPage endCursor }
        edges { node { id handle vendor } }
      }
    }`;
    const handles = new Map();
    let cursor = null;
    let hasNext = true;
    while (hasNext) {
      const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query, variables: { q: queryStr, c: cursor } }),
      });
      const j = await res.json();
      if (j.errors?.length) {
        console.error(j.errors);
        process.exit(1);
      }
      const conn = j.data?.products;
      for (const e of conn?.edges || []) {
        const n = e?.node;
        if (n?.handle) handles.set(n.handle, n.vendor || "");
      }
      hasNext = conn?.pageInfo?.hasNextPage;
      cursor = conn?.pageInfo?.endCursor || null;
      if (!conn?.edges?.length) break;
    }
    return handles;
  }

  const vendorQ = 'vendor:"Wholesale Beds"';
  const byVendor = await fetchAllHandles(vendorQ);

  const missingInShopify = [...jsonHandles].filter((h) => !byVendor.has(h));

  console.log(`Local JSON rows (${jsonPath}): ${localCount}`);
  console.log(`Shopify Admin (${vendorQ}): ${byVendor.size}`);

  if (missingInShopify.length) {
    console.log(`\nJSON handles not under ${vendorQ} (${missingInShopify.length}):`);
    for (const h of missingInShopify) {
      const row = rows.find((r) => String(r.handle || "").trim() === h);
      const sku = row?.variants?.[0]?.sku ? String(row.variants[0].sku).trim() : "";

      const lookup = `query($q: String!) { products(first: 1, query: $q) { edges { node { handle vendor title } } } }`;
      const r = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-Shopify-Access-Token": token,
        },
        body: JSON.stringify({ query: lookup, variables: { q: `handle:${h}` } }),
      });
      const j = await r.json();
      const node = j.data?.products?.edges?.[0]?.node;
      if (node) {
        console.log(`  ${h} → EXISTS as vendor="${node.vendor}" title="${node.title}"`);
      } else {
        console.log(`  ${h} → NOT FOUND in store`);
      }

      if (sku) {
        const vq = `query($q: String!) {
          productVariants(first: 3, query: $q) {
            nodes { sku product { handle vendor title } }
          }
        }`;
        const qSku = `sku:${sku.replace(/"/g, '\\"')}`;
        const r2 = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": token,
          },
          body: JSON.stringify({ query: vq, variables: { q: qSku } }),
        });
        const j2 = await r2.json();
        const nodes = j2.data?.productVariants?.nodes || [];
        if (nodes.length) {
          console.log(`    SKU "${sku}" → variant(s) on:`, nodes.map((n) => `${n.product?.handle} (${n.product?.vendor})`).join("; "));
        } else {
          console.log(`    SKU "${sku}" → no variant match in Admin search`);
        }
      }
    }
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
