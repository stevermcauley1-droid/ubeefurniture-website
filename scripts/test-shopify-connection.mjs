#!/usr/bin/env node
/**
 * Raw Storefront API smoke test (collections list + optional collection by handle).
 * Loads .env.local; matches lib/shopify.ts token header rules (shpat_ → Private-Token).
 *
 * Usage:
 *   node scripts/test-shopify-connection.mjs
 *   node scripts/test-shopify-connection.mjs office
 */

import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token =
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
  process.env.SHOPIFY_STOREFRONT_TOKEN;
const apiVersion = "2024-01";

if (!domain) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN in .env.local"
  );
  process.exit(1);
}
if (!token) {
  console.error("Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local");
  process.exit(1);
}

const url = `https://${domain}/api/${apiVersion}/graphql.json`;
const isPrivateToken = token.startsWith("shpat_");
const headers = {
  "Content-Type": "application/json",
  ...(isPrivateToken
    ? { "Shopify-Storefront-Private-Token": token }
    : { "X-Shopify-Storefront-Access-Token": token }),
};

const listQuery = `
  query CollectionsSmoke {
    collections(first: 5) {
      edges {
        node {
          title
          handle
        }
      }
    }
  }
`;

const handleArg = process.argv[2];
const byHandleQuery = `
  query CollectionByHandle($handle: String!) {
    collection(handle: $handle) {
      title
      handle
      products(first: 5) {
        edges {
          node {
            handle
            title
          }
        }
      }
    }
  }
`;

async function post(body) {
  const res = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
  const json = await res.json();
  return { status: res.status, ok: res.ok, json };
}

console.log("Storefront URL:", url);
console.log("Token type:", isPrivateToken ? "private (shpat_…)" : "public storefront");
console.log("--- collections(first: 5) ---");
const list = await post({ query: listQuery });
console.log(JSON.stringify(list.json, null, 2));

if (handleArg) {
  console.log(`--- collection(handle: "${handleArg}") ---`);
  const one = await post({
    query: byHandleQuery,
    variables: { handle: handleArg },
  });
  console.log(JSON.stringify(one.json, null, 2));
}
