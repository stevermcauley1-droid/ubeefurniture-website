#!/usr/bin/env node
/**
 * Lists Beehive JSON rows with no image URLs (same set the Shopify importer skips).
 *
 *   node scripts/beehive/report-missing-images.mjs
 *   node scripts/beehive/report-missing-images.mjs --json > missing.json
 *
 * Beehive often has no media on these SKUs in products.json — a PDF catalogue does not
 * automatically map to Shopify; add images in Admin or ask Beehive to attach media on the portal.
 */

import fs from "fs";
import path from "path";

const root = path.resolve(process.cwd(), "data", "beehive", "shopify-products.json");
const asJson = process.argv.includes("--json");

if (!fs.existsSync(root)) {
  console.error("Missing", root, "— run: npm run beehive:fetch");
  process.exit(1);
}

const list = JSON.parse(fs.readFileSync(root, "utf-8"));
const missing = list.filter((p) => !p.images?.length);

const rows = missing.map((p) => ({
  handle: p.handle,
  sku: p.variants?.[0]?.sku ?? "",
  title: p.title,
}));

if (asJson) {
  console.log(JSON.stringify(rows, null, 2));
  process.exit(0);
}

console.error(`Products with no image URLs in Beehive feed: ${rows.length}\n`);
for (const r of rows) {
  console.log(`${r.sku || r.handle}\t${r.handle}\t${r.title}`);
}
