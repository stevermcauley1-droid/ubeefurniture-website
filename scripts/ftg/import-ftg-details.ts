/**
 * FTG Product Details importer.
 * Parses CSV and upserts into SupplierProduct.
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { parseFtgDetails } from "./parse-ftg-details";
import type { FtgProductDetail } from "./types";

config({ path: ".env.local" });
config({ path: ".env" });

const csvPath = process.env.FTG_DETAILS_CSV_PATH || process.env.FTG_CSV_PATH || undefined;

function main() {
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

  const details = parseFtgDetails({ csvPath });
  console.log(`Parsed ${details.length} FTG product(s).`);

  let upserted = 0;
  let failed = 0;

  async function upsertOne(d: FtgProductDetail) {
    await prisma.supplierProduct.upsert({
      where: {
        supplier_sku: { supplier: "FTG", sku: d.sku },
      },
      create: {
        supplier: d.supplier,
        sku: d.sku,
        productId: d.productId ?? undefined,
        ean: d.ean ?? undefined,
        commodityCode: d.commodityCode ?? undefined,
        range: d.range ?? undefined,
        name: d.name ?? undefined,
        description: d.description ?? undefined,
        finish: d.finish ?? undefined,
        assembledJson: d.assembled ? (d.assembled as object) : undefined,
        boxesJson: d.boxes.length ? (d.boxes as object[]) : undefined,
        imagesJson: d.images.length ? d.images : undefined,
        categoriesJson: Object.keys(d.categories).length ? (d.categories as object) : undefined,
        frFabricUrl: d.compliance.frFabricUrl ?? undefined,
        frFoamUrl: d.compliance.frFoamUrl ?? undefined,
      },
      update: {
        productId: d.productId ?? undefined,
        ean: d.ean ?? undefined,
        commodityCode: d.commodityCode ?? undefined,
        range: d.range ?? undefined,
        name: d.name ?? undefined,
        description: d.description ?? undefined,
        finish: d.finish ?? undefined,
        assembledJson: d.assembled ? (d.assembled as object) : undefined,
        boxesJson: d.boxes.length ? (d.boxes as object[]) : undefined,
        imagesJson: d.images.length ? d.images : undefined,
        categoriesJson: Object.keys(d.categories).length ? (d.categories as object) : undefined,
        frFabricUrl: d.compliance.frFabricUrl ?? undefined,
        frFoamUrl: d.compliance.frFoamUrl ?? undefined,
      },
    });
    upserted++;
  }

  return (async () => {
    for (const d of details) {
      try {
        await upsertOne(d);
        if (upserted % 100 === 0 && upserted > 0) console.log(`  upserted ${upserted}…`);
      } catch (e) {
        failed++;
        console.error(`Failed SKU ${d.sku}:`, e);
      }
    }
    console.log(`Done. Upserted: ${upserted}, Failed: ${failed}.`);
    await pool.end();
  })();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
