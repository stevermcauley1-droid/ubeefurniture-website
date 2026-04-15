#!/usr/bin/env node
/**
 * Import Heartlands-shaped JSON (from heartlands-scraper --shopify-json) into Shopify Admin.
 *
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN (or SHOPIFY_ADMIN_API_TOKEN)
 *   Must be an Admin API token (Settings → Apps → your custom app), not the Storefront API token.
 * Loads .env.local via dotenv.
 *
 * Usage:
 *   node scripts/heartlands-import-to-shopify.mjs --dry-run [--file=…] [--limit=N]
 *   node scripts/heartlands-import-to-shopify.mjs --apply [--publish] [--limit=N]
 *   Omit --limit or --limit=0 to import every row (JSON deduped by SKU, else handle). Existing products are matched by handle first, then by exact variant SKU (Admin SKU search can return inexact matches).
 *
 * No images in JSON (e.g. some Beehive SKUs): use a temporary public image URL so the product still imports:
 *   --placeholder-image=https://your-cdn.com/placeholder.jpg
 *   or env IMPORT_PLACEHOLDER_IMAGE_URL (must be http(s) absolute URL).
 *   Tag "needs-real-image" is added when the placeholder is used (filter in Admin to replace later).
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
  /* optional */
}

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
const DEFAULT_FILE = path.join("data", "heartlands", "shopify-products.json");

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

function getConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain: domain || null, token: token || null };
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
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

/**
 * Admin variant search can return non-exact matches (e.g. sku:MDFSKID Bed matching
 * MDFSKID-BESPOKE Bed). Only accept a variant whose sku equals the requested value.
 */
async function findProductBySku(domain, token, sku) {
  if (!sku) return null;
  const want = String(sku).trim();
  const data = await adminGraphql(
    domain,
    token,
    `query FindBySku($query: String!) {
      productVariants(first: 25, query: $query) {
        nodes { id sku product { id handle } }
      }
    }`,
    { query: `sku:${want}` }
  );
  const nodes = data?.productVariants?.nodes || [];
  const node = nodes.find((n) => String(n?.sku || "").trim() === want);
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

async function createProduct(domain, token, payload) {
  const tags = Array.isArray(payload.tags) && payload.tags.length
    ? payload.tags
    : ["heartlands", "supplier-heartlands"];
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
        title: payload.title,
        descriptionHtml: payload.body_html || "<p></p>",
        vendor: payload.vendor || "Heartlands",
        productType: payload.product_type || "Furniture",
        handle: payload.handle,
        tags,
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

async function updateProduct(domain, token, productId, payload) {
  const tags = Array.isArray(payload.tags) && payload.tags.length
    ? payload.tags
    : ["heartlands", "supplier-heartlands"];
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
        title: payload.title,
        descriptionHtml: payload.body_html || "<p></p>",
        vendor: payload.vendor || "Heartlands",
        productType: payload.product_type || "Furniture",
        tags,
      },
    }
  );
  const out = data?.productUpdate;
  const errs = out?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function updateVariant(domain, token, productId, variantId, { price, sku }) {
  const variant = { id: variantId };
  if (price != null && String(price).trim() !== "") {
    variant.price = String(price).replace(/[^\d.]/g, "") || "0.00";
  }
  if (sku) variant.inventoryItem = { sku: String(sku) };
  const data = await adminGraphql(
    domain,
    token,
    `mutation VariantBulk($productId: ID!, $variants: [ProductVariantsBulkInput!]!) {
      productVariantsBulkUpdate(productId: $productId, variants: $variants) {
        userErrors { field message }
      }
    }`,
    { productId, variants: [variant] }
  );
  const errs =
    data?.productVariantsBulkUpdate?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function createMedia(domain, token, productId, imageUrls) {
  let ok = 0;
  let fail = 0;
  const urls = (imageUrls || []).filter((u) => u && /^https?:\/\//i.test(String(u)));
  for (const url of urls) {
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
      console.warn(`[heartlands-import] media fail: ${url.slice(0, 80)}… — ${lastErr}`);
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
        edges { node { id name } }
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
      }
    }`,
    { id: productId, input: inputs }
  );
  const errs = data?.publishablePublish?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

function normalizePayload(raw) {
  const v0 = raw.variants?.[0] || {};
  const imageUrls = (raw.images || []).map((i) => (typeof i === "string" ? i : i.src)).filter(Boolean);
  return {
    handle: raw.handle,
    title: raw.title,
    body_html: raw.body_html || "",
    vendor: raw.vendor || "Heartlands",
    product_type: raw.product_type || "Furniture",
    tags: raw.tags?.length ? raw.tags : ["heartlands", "supplier-heartlands"],
    variants: [
      {
        price: v0.price != null ? String(v0.price) : "0.00",
        sku: v0.sku || "",
      },
    ],
    _imageUrls: imageUrls,
  };
}

async function main() {
  const dryRun = process.argv.includes("--dry-run");
  const apply = process.argv.includes("--apply");
  const doPublish = process.argv.includes("--publish");
  const filePath = path.resolve(process.cwd(), arg("file", DEFAULT_FILE));
  const limitArg = arg("limit", "");
  const limitParsed = limitArg !== "" ? parseInt(limitArg, 10) : NaN;
  const limit =
    limitArg === "" || limitArg === "0" || (Number.isFinite(limitParsed) && limitParsed <= 0)
      ? 0
      : Math.max(0, limitParsed);

  if (!dryRun && !apply) {
    console.error("Use --dry-run or --apply.");
    process.exit(1);
  }

  if (!fs.existsSync(filePath)) {
    console.error(`Missing ${filePath}. Run: npm run heartlands:shopify (or scraper with --shopify-json --out=…)`);
    process.exit(1);
  }

  let parsed;
  try {
    parsed = JSON.parse(fs.readFileSync(filePath, "utf-8"));
  } catch (e) {
    console.error("Invalid JSON:", e.message);
    process.exit(1);
  }

  const list = Array.isArray(parsed)
    ? parsed
    : Array.isArray(parsed.products)
      ? parsed.products
      : [];
  if (!list.length) {
    console.error(
      'No products in file (expected [ … ] or { "products": [ … ] }).'
    );
    process.exit(1);
  }

  const seenKeys = new Set();
  const deduped = [];
  for (const row of list) {
    const v0 = row?.variants?.[0];
    const sku = v0?.sku != null ? String(v0.sku).trim() : "";
    const handle = row?.handle != null ? String(row.handle).trim() : "";
    const key = sku ? `sku:${sku.toLowerCase()}` : `h:${handle.toLowerCase()}`;
    if (!key || key === "h:") {
      deduped.push(row);
      continue;
    }
    if (seenKeys.has(key)) continue;
    seenKeys.add(key);
    deduped.push(row);
  }
  if (deduped.length !== list.length) {
    console.error(
      `[heartlands-import] Deduped JSON rows: ${list.length} → ${deduped.length} (by SKU, else handle)`
    );
  }

  const slice = limit > 0 ? deduped.slice(0, limit) : deduped;
  const { domain, token } = getConfig();

  const placeholderImageUrl = (
    arg("placeholder-image", "") ||
    process.env.IMPORT_PLACEHOLDER_IMAGE_URL ||
    ""
  ).trim();
  const placeholderOk =
    placeholderImageUrl.length > 0 && /^https?:\/\//i.test(placeholderImageUrl);
  if (placeholderImageUrl && !placeholderOk) {
    console.error(
      "[heartlands-import] --placeholder-image / IMPORT_PLACEHOLDER_IMAGE_URL must be an absolute http(s) URL."
    );
    process.exit(1);
  }
  if (placeholderOk) {
    console.error(
      `[heartlands-import] Placeholder image enabled (${placeholderImageUrl.slice(0, 64)}…); tag needs-real-image added when used.`
    );
  }

  if (apply && (!domain || !token)) {
    console.error(
      "Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN (or SHOPIFY_ADMIN_API_TOKEN) for --apply."
    );
    process.exit(1);
  }

  let publicationIds = { headlessIds: [], onlineStoreId: null };
  if (apply && doPublish && domain && token) {
    try {
      publicationIds = await getPublicationIds(domain, token);
    } catch (e) {
      console.warn("Could not load publications:", e.message);
    }
  }

  let created = 0;
  let updated = 0;
  let published = 0;
  let failed = 0;
  let skipped = 0;

  for (let i = 0; i < slice.length; i++) {
    const p = normalizePayload(slice[i]);
    const sku = p.variants[0]?.sku || "";
    const price = p.variants[0]?.price || "0.00";
    let images = [...p._imageUrls];
    let usedPlaceholder = false;
    if (!images.length && placeholderOk) {
      images = [placeholderImageUrl];
      usedPlaceholder = true;
    }

    if (!p.handle || !p.title) {
      console.warn(`[${i + 1}] skip: missing handle or title`);
      skipped++;
      continue;
    }
    if (!images.length) {
      console.warn(
        `[${i + 1}] skip ${p.handle}: no image URLs (optional: --placeholder-image= or IMPORT_PLACEHOLDER_IMAGE_URL)`
      );
      skipped++;
      continue;
    }

    const writePayload = usedPlaceholder
      ? {
          ...p,
          tags: [...new Set([...(p.tags || []), "needs-real-image"])],
        }
      : p;

    try {
      if (dryRun) {
        if (!domain || !token) {
          console.log(
            `[dry-run] ${p.handle} sku=${sku || "(none)"} images=${images.length}${usedPlaceholder ? " (placeholder)" : ""} (add Admin token to detect create vs update)`
          );
          created++;
          continue;
        }
        try {
          let found = await findProductByHandle(domain, token, p.handle);
          if (!found && sku) found = await findProductBySku(domain, token, sku);
          console.log(
            `[dry-run] ${found ? "update" : "create"} ${p.handle} sku=${sku || "(none)"} images=${images.length}${usedPlaceholder ? " (placeholder)" : ""}`
          );
          if (found) updated++;
          else created++;
        } catch (e) {
          console.log(
            `[dry-run] ${p.handle} sku=${sku || "(none)"} images=${images.length}${usedPlaceholder ? " (placeholder)" : ""} (lookup: ${e.message})`
          );
          created++;
        }
        continue;
      }

      let found = await findProductByHandle(domain, token, p.handle);
      if (!found && sku) found = await findProductBySku(domain, token, sku);

      let productId;
      let variantId;

      if (found) {
        productId = found.productId;
        variantId = found.variantId;
        await updateProduct(domain, token, productId, writePayload);
        if (variantId) {
          await updateVariant(domain, token, productId, variantId, { price, sku });
        }
        const m = await createMedia(domain, token, productId, images);
        if (doPublish) {
          await publishProduct(domain, token, productId, publicationIds);
          published++;
        }
        console.log(
          `[${i + 1}/${slice.length}] updated ${p.handle} media_ok=${m.ok} fail=${m.fail}${usedPlaceholder ? " placeholder" : ""}`
        );
        updated++;
      } else {
        const cr = await createProduct(domain, token, writePayload);
        productId = cr.productId;
        variantId = cr.variantId;
        if (variantId) {
          await updateVariant(domain, token, productId, variantId, { price, sku });
        }
        const m = await createMedia(domain, token, productId, images);
        if (doPublish) {
          await publishProduct(domain, token, productId, publicationIds);
          published++;
        }
        console.log(
          `[${i + 1}/${slice.length}] created ${p.handle} media_ok=${m.ok} fail=${m.fail}${usedPlaceholder ? " placeholder" : ""}`
        );
        created++;
      }
      if ((i + 1) % 5 === 0) await sleep(400);
    } catch (e) {
      failed++;
      console.error(`[${i + 1}] ${p.handle}:`, e.message || e);
    }
  }

  console.log(
    `\nDone (${dryRun ? "dry-run" : "apply"}). created=${created} updated=${updated} published=${published} failed=${failed} skipped=${skipped}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
