#!/usr/bin/env node

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

function log(msg) {
  process.stdout.write(`${msg}\n`);
}

function ensureEnv() {
  const missing = [];
  if (!process.env.SHOPIFY_STORE_DOMAIN) missing.push("SHOPIFY_STORE_DOMAIN");
  if (
    !process.env.SHOPIFY_ADMIN_API_TOKEN &&
    !process.env.SHOPIFY_ADMIN_ACCESS_TOKEN
  ) {
    missing.push("SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN");
  }
  if (missing.length) {
    throw new Error(
      `Missing required env vars: ${missing.join(
        ", "
      )}. Set them in .env.local before running.`
    );
  }
}

function run(cmd) {
  log(`\n$ ${cmd}`);
  execSync(cmd, {
    stdio: "inherit",
    cwd: process.cwd(),
    env: process.env,
  });
}

function main() {
  ensureEnv();

  const dataDir = path.resolve(process.cwd(), "data", "ftg");
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true });
  }

  // 1) Normalize FTG CSV (uses existing normalize-ftg.mjs)
  run('node scripts/import/ftg/normalize-ftg.mjs');

  // 2) Build Shopify payloads, now with Dropbox image URLs from SKU
  run('node scripts/import/ftg/build-shopify-products.mjs');

  // 3) Import into Shopify (full catalogue, idempotent), then publish to Headless + Online Store
  run('node scripts/import/ftg/import-to-shopify.mjs --apply --limit=0 --publish');

  // 4) Print summary from report
  const reportPath = path.join(dataDir, "shopify-import-report.md");
  if (fs.existsSync(reportPath)) {
    const lines = fs.readFileSync(reportPath, "utf-8").split(/\r?\n/);
    const summary = lines.slice(
      lines.findIndex((l) => l.startsWith("## Summary")),
      lines.length
    );
    log("\n=== FTG → Shopify Import Summary ===");
    summary.forEach((l) => log(l));
  } else {
    log("shopify-import-report.md not found; import may have failed earlier.");
  }
}

main();

