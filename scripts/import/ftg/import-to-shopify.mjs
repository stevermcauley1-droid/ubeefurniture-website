#!/usr/bin/env node
/**
 * FTG → Shopify Import Engine v1
 *
 * Reads shopify-products.jsonl, shopify-variants.jsonl, shopify-images.jsonl
 * (or builds them from ftg-normalized.jsonl if missing) and creates/updates
 * products in Shopify via Admin GraphQL API.
 *
 * Security: Credentials from env only. Never log tokens.
 *   SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN
 *   SHOPIFY_STORE_DOMAIN (e.g. ubee-furniture.myshopify.com)
 *
 * Usage:
 *   node scripts/import/ftg/import-to-shopify.mjs --dry-run [--limit N]
 *   node scripts/import/ftg/import-to-shopify.mjs --apply [--limit N] [--publish] [--sync-price]
 *   --sku=SKU: only process that SKU (must exist in built JSONL slice)
 *   --publish: publish product to all Headless publications + Online Store
 *   --sync-price: after run, one bulk npx tsx …/update-shopify-variant-prices-from-ftg.ts --all
 *   --no-sync-price: skip bulk price sync even if --sync-price would apply
 *   --append-results: append to shopify-import-results.jsonl instead of truncating
 *
 * Outputs:
 *   data/ftg/shopify-import-results.jsonl
 *   data/ftg/shopify-import-report.md
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { execSync } from "child_process";
import { normalizeDropboxImageUrl } from "./lib/dropbox-url.mjs";

const require = createRequire(import.meta.url);

// Load .env.local (no secrets in logs)
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  // dotenv optional
}

const DATA_FTG = path.resolve(process.cwd(), "data", "ftg");
const PRODUCTS_JSONL = path.join(DATA_FTG, "shopify-products.jsonl");
const VARIANTS_JSONL = path.join(DATA_FTG, "shopify-variants.jsonl");
const IMAGES_JSONL = path.join(DATA_FTG, "shopify-images.jsonl");
const NORMALIZED_JSONL = path.join(DATA_FTG, "ftg-normalized.jsonl");
const API_VERSION = "2024-01";
const BATCH_SIZE = 10;

function getConfig() {
  const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain: domain || null, token: token || null };
}

function ensureBuildFiles() {
  if (fs.existsSync(PRODUCTS_JSONL) && fs.existsSync(VARIANTS_JSONL)) {
    return;
  }
  if (!fs.existsSync(NORMALIZED_JSONL)) {
    throw new Error(
      `Missing ${NORMALIZED_JSONL}. Run ftg:normalize first, or place shopify-products.jsonl and shopify-variants.jsonl in data/ftg/`
    );
  }
  console.log("Building shopify-products/variants/images from ftg-normalized.jsonl…");
  const { execSync } = require("child_process");
  execSync("node scripts/import/ftg/build-shopify-products.mjs", {
    stdio: "inherit",
    cwd: process.cwd(),
  });
}

function loadLines(filePath) {
  if (!fs.existsSync(filePath)) return [];
  return fs
    .readFileSync(filePath, "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0)
    .map((line) => {
      try {
        return JSON.parse(line);
      } catch {
        return null;
      }
    })
    .filter(Boolean);
}

function loadImagesBySku() {
  const lines = loadLines(IMAGES_JSONL);
  const bySku = new Map();
  for (const row of lines) {
    const sku = row.sku;
    const url = normalizeDropboxImageUrl(row.image_url);
    // Only keep obviously valid image URLs to avoid Shopify "Image URL is invalid" errors
    if (!sku || !url || !/^https?:\/\//i.test(url)) continue;
    if (!bySku.has(sku)) bySku.set(sku, []);
    bySku.get(sku).push({ url, position: row.position });
  }
  for (const arr of bySku.values()) {
    arr.sort((a, b) => (a.position || 0) - (b.position || 0));
  }
  return bySku;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function adminGraphql(domain, token, query, variables = {}) {
  const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Admin API HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors && json.errors.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

async function findProductBySku(domain, token, sku) {
  const data = await adminGraphql(
    domain,
    token,
    `query FindBySku($query: String!) {
      productVariants(first: 1, query: $query) {
        nodes {
          id
          sku
          product { id title handle }
        }
      }
    }`,
    { query: `sku:${sku}` }
  );
  const node = data?.productVariants?.nodes?.[0];
  if (!node) return null;
  return {
    variantId: node.id,
    productId: node.product?.id,
    handle: node.product?.handle,
  };
}

async function findProductByHandle(domain, token, handle) {
  const data = await adminGraphql(
    domain,
    token,
    `query FindByHandle($query: String!) {
      products(first: 1, query: $query) {
        nodes {
          id
          handle
          variants(first: 1) { nodes { id } }
        }
      }
    }`,
    { query: `handle:${handle}` }
  );
  const node = data?.products?.nodes?.[0];
  if (!node) return null;
  return {
    productId: node.id,
    variantId: node.variants?.nodes?.[0]?.id,
    handle: node.handle,
  };
}

async function createProduct(domain, token, productPayload, variantPayload) {
  const data = await adminGraphql(
    domain,
    token,
    `mutation CreateProduct($product: ProductCreateInput!) {
      productCreate(product: $product) {
        userErrors { field message }
        product { id handle variants(first: 1) { nodes { id } } }
      }
    }`,
    {
      product: {
        title: productPayload.title,
        descriptionHtml: productPayload.body_html || "<p></p>",
        vendor: productPayload.vendor || "Furniture To Go",
        productType: productPayload.product_type,
        handle: productPayload.handle,
        tags: productPayload.tags?.length ? productPayload.tags : undefined,
        status: "ACTIVE",
      },
    }
  );
  const out = data?.productCreate;
  const errs = out?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
  const product = out?.product;
  if (!product?.id) throw new Error("productCreate returned no product id");
  return {
    productId: product.id,
    variantId: product.variants?.nodes?.[0]?.id,
  };
}

async function updateProduct(domain, token, productId, productPayload) {
  const data = await adminGraphql(
    domain,
    token,
    `mutation UpdateProduct($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
        product { id }
      }
    }`,
    {
      input: {
        id: productId,
        title: productPayload.title,
        descriptionHtml: productPayload.body_html || "<p></p>",
        vendor: productPayload.vendor || "Furniture To Go",
        productType: productPayload.product_type,
        tags: productPayload.tags?.length ? productPayload.tags : undefined,
      },
    }
  );
  const out = data?.productUpdate;
  const errs = out?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function createMedia(domain, token, productId, imageUrls, sku) {
  let ok = 0;
  let fail = 0;
  if (!imageUrls?.length) return { ok, fail };
  const onlyValid = imageUrls
    .map((u) => normalizeDropboxImageUrl(u))
    .filter((u) => u && /^https?:\/\//i.test(u));
  for (const url of onlyValid) {
    let lastErr = null;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const media = [{ mediaContentType: "IMAGE", originalSource: url }];
        const data = await adminGraphql(
          domain,
          token,
          `mutation CreateMedia($productId: ID!, $media: [CreateMediaInput!]!) {
            productCreateMedia(productId: $productId, media: $media) {
              mediaUserErrors { field message }
              media { id }
            }
          }`,
          { productId, media }
        );
        const out = data?.productCreateMedia;
        const errs = out?.mediaUserErrors?.filter((e) => e.message) || [];
        if (errs.length) {
          lastErr = errs.map((e) => e.message).join("; ");
          if (attempt < 2) await sleep(400 * (attempt + 1));
          continue;
        }
        ok++;
        lastErr = null;
        break;
      } catch (err) {
        lastErr = err.message || String(err);
        if (attempt < 2) await sleep(400 * (attempt + 1));
      }
    }
    if (lastErr) {
      fail++;
      console.warn(
        `[createMedia] sku=${sku} failed after retries (${url.slice(0, 72)}…): ${lastErr}`
      );
    }
  }
  return { ok, fail };
}

async function getPublicationIds(domain, token) {
  const data = await adminGraphql(
    domain,
    token,
    `query GetPublications {
      publications(first: 20) {
        edges {
          node {
            id
            name
          }
        }
      }
    }`
  );
  const edges = data?.publications?.edges || [];
  const headlessIds = edges
    .filter((e) => String(e.node.name || "").toLowerCase().includes("headless"))
    .map((e) => e.node.id);
  const onlineStore = edges.find((e) => e.node.name === "Online Store");
  return {
    headlessIds,
    onlineStoreId: onlineStore?.node?.id ?? null,
  };
}

async function publishProduct(domain, token, productId, publicationIds) {
  const inputs = [];
  for (const hid of publicationIds.headlessIds || []) {
    if (hid) inputs.push({ publicationId: hid });
  }
  if (publicationIds.onlineStoreId) {
    inputs.push({ publicationId: publicationIds.onlineStoreId });
  }
  if (!inputs.length) return;
  const data = await adminGraphql(
    domain,
    token,
    `mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
        publishable { __typename }
      }
    }`,
    { id: productId, input: inputs }
  );
  const out = data?.publishablePublish;
  const errs = out?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) {
    throw new Error(errs.map((e) => e.message).join("; "));
  }
}

async function main() {
  const args = process.argv.slice(2);
  const dryRun = args.includes("--dry-run");
  const apply = args.includes("--apply");
  const doPublish = args.includes("--publish");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const offsetArg = args.find((a) => a.startsWith("--offset="));
  const skuFilterArg = args.find((a) => a.startsWith("--sku="))?.split("=", 2)[1]?.trim();
  const appendResults = args.includes("--append-results");
  const syncPrice =
    args.includes("--sync-price") && !args.includes("--no-sync-price");
  const limit = limitArg
    ? Math.max(0, parseInt(limitArg.split("=")[1], 10))
    : 10;
  const offset = offsetArg
    ? Math.max(0, parseInt(offsetArg.split("=")[1], 10))
    : 0;

  if (!dryRun && !apply) {
    console.error("Use --dry-run or --apply.");
    process.exit(1);
  }

  ensureBuildFiles();

  const products = loadLines(PRODUCTS_JSONL);
  const variants = loadLines(VARIANTS_JSONL);
  const imagesBySku = loadImagesBySku();

  if (products.length !== variants.length) {
    console.warn(
      `Product count (${products.length}) and variant count (${variants.length}) differ; using min.`
    );
  }
  const totalAvailable = Math.min(products.length, variants.length);
  const startIndex = Math.min(offset, totalAvailable);
  const endIndex =
    limit > 0 ? Math.min(startIndex + limit, totalAvailable) : totalAvailable;
  let toProcess = [];
  for (let i = startIndex; i < endIndex; i++) {
    const p = products[i];
    const v = variants[i];
    if (!p || !v || !v.sku) continue;
    if (String(v.sku).toUpperCase() === "SKU") continue; // skip header row
    toProcess.push({
      product: p,
      variant: v,
      images: (imagesBySku.get(v.sku) || []).map((x) => x.url),
    });
  }

  if (skuFilterArg) {
    const before = toProcess.length;
    toProcess = toProcess.filter((row) => String(row.variant.sku) === skuFilterArg);
    if (toProcess.length === 0) {
      console.error(
        `No product row matches --sku=${skuFilterArg} (checked ${before} row(s) in current slice).`
      );
      process.exit(1);
    }
    console.log(`Filtered to single SKU: ${skuFilterArg} (${toProcess.length} row)`);
  }

  const { domain, token } = getConfig();
  if (apply && (!domain || !token)) {
    console.error("SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN) must be set for --apply.");
    process.exit(1);
  }

  let publicationIds = { headlessIds: [], onlineStoreId: null };
  if (apply && doPublish && domain && token) {
    try {
      publicationIds = await getPublicationIds(domain, token);
      const hc = publicationIds.headlessIds?.length || 0;
      if (hc || publicationIds.onlineStoreId) {
        console.log(
          `Publish to channels: Headless publications=${hc}, Online Store=${!!publicationIds.onlineStoreId}`
        );
      } else {
        console.warn("No Headless or Online Store publication found; --publish will be a no-op.");
      }
    } catch (e) {
      console.warn("Could not fetch publication IDs:", e.message);
    }
  }

  if (!fs.existsSync(DATA_FTG)) fs.mkdirSync(DATA_FTG, { recursive: true });
  const resultsPath = path.join(DATA_FTG, "shopify-import-results.jsonl");
  const resultsStream = fs.createWriteStream(resultsPath, {
    flags: appendResults ? "a" : "w",
  });
  if (appendResults) {
    console.log("[import] Appending to", resultsPath);
  }

  let created = 0;
  let updated = 0;
  let published = 0;
  let failed = 0;

  for (let i = 0; i < toProcess.length; i++) {
    const { product, variant, images } = toProcess[i];
    const sku = variant.sku;
    const handle = product.handle;

    const result = {
      sku,
      action: null,
      shopify_product_id: null,
      variant_id: null,
      errors: null,
      media_ok: 0,
      media_fail: 0,
    };

    try {
      if (dryRun) {
        const bySku = domain && token ? await findProductBySku(domain, token, sku) : null;
        result.action = bySku ? "would_update" : "would_create";
        result.shopify_product_id = bySku?.productId ?? null;
        result.variant_id = bySku?.variantId ?? null;
        if (bySku) updated++;
        else created++;
      } else {
        if (!images.length) {
          throw new Error(
            "VALIDATION: no image URLs for SKU (rebuild with ftg:build-shopify or fix source data)"
          );
        }
        const pt = product.product_type && String(product.product_type).trim();
        const tags = Array.isArray(product.tags) ? product.tags.filter(Boolean) : [];
        if (!pt) {
          throw new Error("VALIDATION: missing product_type");
        }
        if (!tags.length) {
          throw new Error("VALIDATION: missing tags[]");
        }

        let productId, variantId;
        let found = await findProductBySku(domain, token, sku);
        if (!found) found = await findProductByHandle(domain, token, handle);

        if (found) {
          productId = found.productId;
          variantId = found.variantId;
          await updateProduct(domain, token, productId, product);
          if (images.length) {
            const m = await createMedia(domain, token, productId, images, sku);
            result.media_ok = m.ok;
            result.media_fail = m.fail;
          }
          if (
            doPublish &&
            ((publicationIds.headlessIds && publicationIds.headlessIds.length) ||
              publicationIds.onlineStoreId)
          ) {
            await publishProduct(domain, token, productId, publicationIds);
            published++;
          }
          result.action = "updated";
          result.shopify_product_id = productId;
          result.variant_id = variantId;
          updated++;
        } else {
          const createdRes = await createProduct(domain, token, product, variant);
          productId = createdRes.productId;
          variantId = createdRes.variantId;
          if (images.length) {
            const m = await createMedia(domain, token, productId, images, sku);
            result.media_ok = m.ok;
            result.media_fail = m.fail;
          }
          if (
            doPublish &&
            ((publicationIds.headlessIds && publicationIds.headlessIds.length) ||
              publicationIds.onlineStoreId)
          ) {
            await publishProduct(domain, token, productId, publicationIds);
            published++;
          }
          result.action = "created";
          result.shopify_product_id = productId;
          result.variant_id = variantId;
          created++;
        }
      }
    } catch (err) {
      result.action = dryRun ? "would_error" : "error";
      result.errors = err.message || String(err);
      failed++;
    }

    resultsStream.write(JSON.stringify(result) + "\n");
    if (apply && (i + 1) % 50 === 0) {
      console.log(
        `[import] ${i + 1}/${toProcess.length} (ok: ${created + updated}, failed: ${failed})`
      );
    }
    if (apply && (i + 1) % BATCH_SIZE === 0) await sleep(500);
  }

  await new Promise((resolve, reject) => {
    resultsStream.once("finish", resolve);
    resultsStream.once("error", reject);
    resultsStream.end();
  });

  if (apply && syncPrice && domain && token && toProcess.length > 0) {
    console.log("\n[sync-price] Running bulk FTG price sync (all SKUs in shopify-import-results.jsonl)…");
    try {
      execSync("npx tsx scripts/ftg/update-shopify-variant-prices-from-ftg.ts --all", {
        stdio: "inherit",
        cwd: process.cwd(),
      });
    } catch {
      console.warn("[sync-price] Bulk price sync failed (check Admin token and FTG price CSV).");
    }
  }

  const reportPath = path.join(DATA_FTG, "shopify-import-report.md");
  const reportLines = [
    "# FTG → Shopify import report",
    "",
    "## How to run",
    "",
    "```bash",
    "npm run ftg:import:dry   # dry-run, limit 10",
    "npm run ftg:import      # apply, limit 10",
    "node scripts/import/ftg/import-to-shopify.mjs --apply --limit=50 [--publish] [--sync-price] [--sku=…]",
    "```",
    "",
    "Outputs:",
    "- `data/ftg/shopify-import-results.jsonl`",
    "- `data/ftg/shopify-import-report.md`",
    "",
    "## Summary",
    "",
    `- Total processed: ${toProcess.length}`,
    `- Created: ${created}`,
    `- Updated: ${updated}`,
    `- Published to channel(s): ${published}`,
    `- Failed: ${failed}`,
    `- Mode: ${dryRun ? "dry-run" : "apply"}${doPublish ? " (with --publish)" : ""}${syncPrice ? " (with --sync-price)" : ""}${appendResults ? " (append-results)" : ""}`,
    "",
  ];
  fs.writeFileSync(reportPath, reportLines.join("\n"), "utf-8");

  console.log(`Processed ${toProcess.length}; created ${created}, updated ${updated}, published ${published}, failed ${failed}.`);
  console.log(`Results: ${resultsPath}`);
  console.log(`Report:  ${reportPath}`);
}

main().catch((err) => {
  console.error("import-to-shopify failed:", err.message || err);
  process.exit(1);
});
