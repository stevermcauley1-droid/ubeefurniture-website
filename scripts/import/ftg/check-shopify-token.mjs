#!/usr/bin/env node
/**
 * Check Shopify Admin API token: can we read products and productVariants?
 * Uses .env.local (SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN).
 * Does NOT print any secret values.
 */

import { createRequire } from "module";
import path from "path";
const require = createRequire(import.meta.url);
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {}

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2024-01";

if (!domain || !token) {
  console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_ADMIN_API_TOKEN in .env.local");
  process.exit(1);
}

const url = `https://${domain.replace(/^https?:\/\//, "").split("/")[0]}/admin/api/${API_VERSION}/graphql.json`;

async function run() {
  // Test 1: products (read_products)
  const res1 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: "{ products(first: 1) { edges { node { id } } } }",
    }),
  });
  const json1 = await res1.json();

  if (json1.errors && json1.errors.length) {
    const msg = json1.errors.map((e) => e.message).join("; ");
    console.log("products query:", msg);
    if (msg.includes("Access denied") || msg.includes("productVariants")) {
      console.log("\n→ Fix: In Shopify Admin go to Settings → Apps and sales channels → Develop apps → your app → Configuration → Admin API integration → Edit. Add Read products and Write products, Save, then regenerate the token and update .env.local.");
    }
    process.exit(1);
  }

  const productCount = json1.data?.products?.edges?.length ?? 0;
  console.log("products (read_products): OK, sampled", productCount, "product(s)");

  // Test 2: productVariants (needed for import lookup by SKU)
  const res2 = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({
      query: "{ productVariants(first: 1) { nodes { id sku } } }",
    }),
  });
  const json2 = await res2.json();

  if (json2.errors && json2.errors.length) {
    const msg = json2.errors.map((e) => e.message).join("; ");
    console.log("productVariants query:", msg);
    if (msg.includes("Access denied")) {
      console.log("\n→ Fix: Same as above – add Read products (and Write products) under Admin API integration, Save, then regenerate the token and update .env.local. See docs/FTG-SHOPIFY-SCOPES.md.");
    }
    process.exit(1);
  }

  console.log("productVariants (required for import): OK");
  console.log("\nToken OK – you can run: npm run ftg:import");
}

run().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
