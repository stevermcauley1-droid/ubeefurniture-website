#!/usr/bin/env node
/**
 * Re-process SKUs that failed in data/ftg/shopify-import-results.jsonl
 *
 * Usage (from repo root):
 *   node scripts/import/ftg/retry-failed-imports.mjs
 *
 * Requires fresh SHOPIFY_ADMIN_API_TOKEN (npm run shopify:admin-token).
 *
 * Steps:
 *  1) Collect unique SKUs where action === "error" or errors is set
 *  2) For each: import --apply --publish --sku=... --append-results --no-sync-price
 *  3) Deduplicate JSONL by SKU (last line wins)
 *  4) npx tsx scripts/ftg/update-shopify-variant-prices-from-ftg.ts --all
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

const root = process.cwd();
const resultsPath = path.join(root, "data", "ftg", "shopify-import-results.jsonl");
const summaryPath = path.join(root, "data", "ftg", "pipeline-recovery-summary.json");

function loadFailedSkus() {
  if (!fs.existsSync(resultsPath)) {
    throw new Error(`Missing ${resultsPath}`);
  }
  const lines = fs.readFileSync(resultsPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const out = [];
  for (const line of lines) {
    try {
      const o = JSON.parse(line);
      if (o.action === "error" || o.errors) {
        if (o.sku) out.push(String(o.sku));
      }
    } catch {
      // skip
    }
  }
  return [...new Set(out)];
}

function mergeResultsBySku() {
  const lines = fs.readFileSync(resultsPath, "utf-8").split(/\r?\n/).filter(Boolean);
  const map = new Map();
  for (const line of lines) {
    try {
      const o = JSON.parse(line);
      if (o.sku) map.set(String(o.sku), line);
    } catch {
      // skip bad lines
    }
  }
  fs.writeFileSync(resultsPath, [...map.values()].join("\n") + "\n", "utf-8");
  return map.size;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const failed = loadFailedSkus();
  console.log(`Found ${failed.length} unique failed SKU(s) in results file.`);

  let recovered = 0;
  let stillFailed = 0;

  for (let i = 0; i < failed.length; i++) {
    const sku = failed[i];
    const label = `[retry ${i + 1}/${failed.length}] ${sku}`;
    try {
      execSync(
        `node scripts/import/ftg/import-to-shopify.mjs --apply --publish --limit=99999 --sku=${sku} --append-results --no-sync-price`,
        {
          cwd: root,
          stdio: "inherit",
          shell: true,
        }
      );
      recovered++;
    } catch {
      stillFailed++;
      console.error(`${label} → subprocess exited non-zero`);
    }
    await sleep(350);
  }

  const uniqueAfter = mergeResultsBySku();
  console.log(`\nMerged shopify-import-results.jsonl → ${uniqueAfter} unique SKU row(s).`);

  console.log("\nRunning bulk price sync (--all)…");
  try {
    execSync("npx tsx scripts/ftg/update-shopify-variant-prices-from-ftg.ts --all", {
      cwd: root,
      stdio: "inherit",
    });
  } catch {
    console.warn("Price sync exited with error; check Admin token and CSV.");
  }

  const summary = {
    at: new Date().toISOString(),
    failedSkusInput: failed.length,
    retrySubprocessOk: recovered,
    retrySubprocessFail: stillFailed,
    uniqueRowsAfterMerge: uniqueAfter,
  };
  fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2), "utf-8");
  console.log("\nWrote", summaryPath);
  console.log("Recovery:", JSON.stringify(summary, null, 2));
}

main().catch((e) => {
  console.error(e.message || e);
  process.exit(1);
});
