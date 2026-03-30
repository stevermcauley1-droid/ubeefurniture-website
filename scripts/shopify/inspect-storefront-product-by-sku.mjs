#!/usr/bin/env node
/**
 * Inspect Storefront API for a product by SKU search.
 * Usage:
 *   node scripts/shopify/inspect-storefront-product-by-sku.mjs --sku=4050221
 *   node scripts/shopify/inspect-storefront-product-by-sku.mjs --collection=sofas-4
 *
 * Prints:
 *   - product handle/title
 *   - featuredImage url (if any)
 *   - images urls (up to 3)
 *
 * No secrets are logged.
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const args = process.argv.slice(2);
const skuArg = args.find((a) => a.startsWith("--sku="))?.split("=", 2)[1];
const sku = skuArg || "4050221";
const collectionArg = args.find((a) => a.startsWith("--collection="))?.split("=", 2)[1];
const collectionHandle = collectionArg || null;

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;
const apiVersion = "2024-01";

if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN in .env.local");
if (!token) throw new Error("Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local");

const escapeGql = (s) => String(s).replace(/\\/g, "\\\\").replace(/"/g, '\\"');

/** Storefront `products(query: "sku:…")` is unreliable; align variant + product JSONL by row index. */
function handleForSkuFromBuildFiles(targetSku) {
  const root = process.cwd();
  const variantsPath = path.join(root, "data", "ftg", "shopify-variants.jsonl");
  const productsPath = path.join(root, "data", "ftg", "shopify-products.jsonl");
  if (!fs.existsSync(variantsPath) || !fs.existsSync(productsPath)) return null;
  const vLines = fs.readFileSync(variantsPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const pLines = fs.readFileSync(productsPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const want = String(targetSku || "").trim();
  for (let i = 0; i < vLines.length; i++) {
    try {
      const v = JSON.parse(vLines[i]);
      if (String(v.sku || "").trim() !== want) continue;
      const p = JSON.parse(pLines[i]);
      return typeof p.handle === "string" ? p.handle : null;
    } catch {
      // skip bad line
    }
  }
  return null;
}

let query;
let useProductByHandle = false;
if (collectionHandle) {
  query = `query {
    collection(handle: "${escapeGql(collectionHandle)}") {
      products(first: 1) {
        edges {
          node {
            handle
            title
            featuredImage { url }
            images(first: 3) { edges { node { url } } }
            variants(first: 5) { edges { node { sku price { amount currencyCode } } } }
          }
        }
      }
    }
  }`;
} else {
  const handle = handleForSkuFromBuildFiles(sku);
  if (handle) {
    useProductByHandle = true;
    query = `query {
      product(handle: "${escapeGql(handle)}") {
        handle
        title
        featuredImage { url }
        images(first: 3) { edges { node { url } } }
        variants(first: 10) { edges { node { sku price { amount currencyCode } } } }
      }
    }`;
  } else {
    console.warn(
      "[inspect] No handle in data/ftg shopify JSONL for SKU; falling back to products(search) (may be wrong)."
    );
    query = `query {
    products(first: 1, query: "sku:${escapeGql(sku)}") {
      edges {
        node {
          handle
          title
          featuredImage { url }
          images(first: 3) { edges { node { url } } }
          variants(first: 10) { edges { node { sku price { amount currencyCode } } } }
        }
      }
    }
  }`;
  }
}

const res = await fetch(`https://${domain}/api/${apiVersion}/graphql.json`, {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    // For private storefront tokens (shpat_...), Shopify expects this header.
    "Shopify-Storefront-Private-Token": token,
  },
  body: JSON.stringify({ query }),
});

const json = await res.json();
if (!res.ok || json.errors?.length) {
  console.error("Storefront API error:", res.status, json.errors || json);
  process.exit(1);
}

const node = collectionHandle
  ? json.data?.collection?.products?.edges?.[0]?.node
  : useProductByHandle
    ? json.data?.product
    : json.data?.products?.edges?.[0]?.node;

const variants =
  node?.variants?.edges?.map((e) => e.node).filter(Boolean) || [];

const variantsPreview = variants.slice(0, 5).map((v) => ({
  sku: v.sku,
  price:
    v?.price?.amount != null ? String(v.price.amount) : null,
  currencyCode: v?.price?.currencyCode || null,
}));

const matchedVariant = variants
  .find((v) => String(v?.sku || "").trim() === String(sku || "").trim()) ||
  null;

const matchedVariantPrice =
  matchedVariant?.price?.amount != null
    ? `${matchedVariant.price.amount} ${matchedVariant.price.currencyCode || ""}`.trim()
    : null;

console.log(
  JSON.stringify(
    collectionHandle
      ? {
          collection: collectionHandle,
          handle: node?.handle,
          title: node?.title,
          variantsPreview,
          matchedVariantPrice,
        }
      : {
          sku,
          handle: node?.handle,
          title: node?.title,
          variantsPreview,
          matchedVariantPrice,
        },
    null,
    2
  )
);

const featured = node?.featuredImage?.url;
console.log("featuredImage:", featured);

const images = node?.images?.edges?.map((e) => e.node?.url).filter(Boolean) || [];
console.log("images:", images);

function host(u) {
  try {
    return new URL(u).host;
  } catch {
    return null;
  }
}
console.log("image hosts:", images.map(host));

