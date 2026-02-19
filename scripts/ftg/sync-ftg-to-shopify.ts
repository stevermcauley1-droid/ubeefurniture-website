/**
 * Sync FTG products (details + pricing) to Shopify.
 * Creates products with computed sell price and SKU; stores Shopify product ID on SupplierProduct.
 *
 * Requires: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN (Admin API, write_products).
 * Usage: npx tsx scripts/ftg/sync-ftg-to-shopify.ts [--limit=N] [--all]
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { computeSellPrice } from "../../lib/pricing/ftgPricing";

config({ path: ".env.local" });
config({ path: ".env" });

const domain = () =>
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const adminToken = () => process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const API_VERSION = "2024-01";

async function adminGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const d = domain();
  const t = adminToken();
  if (!d || !t) {
    throw new Error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN (Admin API, write_products).");
  }
  const url = `https://${d}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": t,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return json.data as T;
}

function slugify(s: string): string {
  const slug = s.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return slug || "product";
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const args = process.argv.slice(2);
  const allFlag = args.includes("--all");
  const limitArg = args.find((a) => a.startsWith("--limit="));
  const limit = limitArg ? parseInt(limitArg.split("=")[1], 10) : 50;
  const maxProducts = allFlag ? 10000 : Number.isFinite(limit) && limit > 0 ? limit : 50;

  const connectionString = process.env.DATABASE_URL;
  if (!connectionString) throw new Error("DATABASE_URL is not set");
  let url = connectionString;
  if (!url.includes("sslmode=")) {
    url += url.includes("?") ? "&" : "?";
    url += "sslmode=no-verify";
  }
  const pool = new Pool({ connectionString: url });
  const adapter = new PrismaPg(pool);
  const prisma = new PrismaClient({ adapter });

  const products = await prisma.supplierProduct.findMany({
    where: { supplier: "FTG" },
    take: maxProducts,
    orderBy: { sku: "asc" },
  });

  const pricingRows = await prisma.supplierProductPricing.findMany({
    where: { supplier: "FTG" },
  });
  const pricingBySku = new Map<string, { costPrice: number | null; rrp: number | null }>();
  for (const p of pricingRows) {
    pricingBySku.set(p.sku, {
      costPrice: p.costPrice != null ? Number(p.costPrice) : null,
      rrp: p.rrp != null ? Number(p.rrp) : null,
    });
  }

  let created = 0;
  let skipped = 0;
  let failed = 0;

  for (const prod of products) {
    if (prod.shopifyProductId) {
      skipped++;
      continue;
    }

    const pricing = pricingBySku.get(prod.sku);
    const cost = pricing?.costPrice ?? null;
    const rrp = pricing?.rrp ?? null;
    const { sellPrice } = computeSellPrice({ cost, rrp });
    if (sellPrice == null || sellPrice <= 0) {
      skipped++;
      continue;
    }

    const title = (prod.name || prod.sku).slice(0, 255);
    const descriptionHtml =
      (prod.description || "").replace(/\n/g, "<br>") || "<p>Furniture from FTG.</p>";
    const handle = slugify(prod.sku) + "-" + prod.sku.slice(-6);

    // Generate tags based on FTG categories and range for automated collections
    const tags: string[] = ["FTG"];
    const nameLower = (prod.name || "").toLowerCase();
    const rangeLower = (prod.range || "").toLowerCase();
    const categories = (prod.categoriesJson || {}) as Record<string, boolean>;
    
    // Category-based tags (from FTG category flags C1-C19)
    // Map categories to collection tags based on your collection rules
    if (nameLower.includes("sofa") || nameLower.includes("settee") || rangeLower.includes("sofa")) {
      tags.push("sofa");
    }
    if (nameLower.includes("bed") || nameLower.includes("bedroom") || rangeLower.includes("bed")) {
      tags.push("bed");
    }
    if (nameLower.includes("mattress")) {
      tags.push("mattress");
    }
    if (nameLower.includes("wardrobe") || nameLower.includes("closet") || nameLower.includes("storage")) {
      tags.push("wardrobe");
    }
    if (nameLower.includes("dining") || nameLower.includes("table") || nameLower.includes("chair") || rangeLower.includes("dining")) {
      tags.push("dining");
    }
    if (nameLower.includes("package") || nameLower.includes("bundle") || nameLower.includes("deal")) {
      tags.push("package");
    }
    if (nameLower.includes("landlord") || nameLower.includes("rental") || nameLower.includes("furnished") || nameLower.includes("crib5")) {
      tags.push("landlord");
      tags.push("rental");
    }
    
    // Add product type based on name/range for better collection matching
    let productType: string | undefined = undefined;
    if (tags.includes("sofa")) productType = "Sofas";
    else if (tags.includes("bed")) productType = "Beds";
    else if (tags.includes("mattress")) productType = "Mattresses";
    else if (tags.includes("wardrobe")) productType = "Wardrobes";
    else if (tags.includes("dining")) productType = "Dining";
    else if (tags.includes("package")) productType = "Packages";
    else if (tags.includes("landlord")) productType = "Landlord Packs";

    try {
      const createRes = await adminGraphql<{
        productCreate?: {
          userErrors: { field: string; message: string }[];
          product?: { id: string; variants: { nodes: { id: string }[] } };
        };
      }>(
        `mutation CreateProduct($product: ProductCreateInput!) {
          productCreate(product: $product) {
            userErrors { field message }
            product { id variants(first: 1) { nodes { id } } }
          }
        }`,
        {
          product: {
            title,
            descriptionHtml,
            vendor: "FTG",
            status: "ACTIVE",
            handle,
            tags: tags.length > 0 ? tags : undefined,
            productType: productType,
          },
        }
      );

      const payload = createRes?.productCreate;
      const errs = payload?.userErrors?.filter((e) => e.message) || [];
      if (errs.length) {
        console.error(`SKU ${prod.sku}:`, errs.map((e) => e.message).join("; "));
        failed++;
        continue;
      }

      const productId = payload?.product?.id;
      const variantId = payload?.product?.variants?.nodes?.[0]?.id;
      if (!productId || !variantId) {
        console.error(`SKU ${prod.sku}: no product or variant id returned`);
        failed++;
        continue;
      }

      const updateRes = await adminGraphql<{
        productVariantUpdate?: {
          userErrors: { field: string; message: string }[];
        };
      }>(
        `mutation UpdateVariant($input: ProductVariantInput!) {
          productVariantUpdate(input: $input) {
            userErrors { field message }
          }
        }`,
        {
          input: {
            id: variantId,
            price: sellPrice.toFixed(2),
            sku: prod.sku,
          },
        }
      );

      const updateErrs = updateRes?.productVariantUpdate?.userErrors?.filter((e) => e.message) || [];
      if (updateErrs.length) {
        console.error(`SKU ${prod.sku} variant:`, updateErrs.map((e) => e.message).join("; "));
      }

      await prisma.supplierProduct.update({
        where: { id: prod.id },
        data: { shopifyProductId: productId },
      });
      created++;
      if (created % 10 === 0) console.log(`  created ${created}…`);
    } catch (e) {
      console.error(`SKU ${prod.sku}:`, e);
      failed++;
    }

    await sleep(400);
  }

  console.log("\n--- Sync summary ---");
  console.log(`Created in Shopify: ${created}`);
  console.log(`Skipped (already synced or no price): ${skipped}`);
  console.log(`Failed: ${failed}`);
  await pool.end();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
