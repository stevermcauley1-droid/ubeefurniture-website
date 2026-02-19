/**
 * FTG Price/Stock import.
 * Parses price CSV and upserts SupplierProductPricing; reports match with SupplierProduct.
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";
import { parseFtgPrice } from "./parse-ftg-price";
import type { FtgPriceRow } from "./price-types";

config({ path: ".env.local" });
config({ path: ".env" });

const csvPath =
  process.env.FTG_PRICE_CSV_PATH ||
  process.env.FTG_CSV_PATH ||
  undefined;

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

  const rows = parseFtgPrice({ csvPath });
  console.log(`Price CSV: ${rows.length} row(s) read.`);

  let upserted = 0;
  const missingDetails: string[] = [];
  const matchedSkus = new Set<string>();

  async function run() {
    for (const r of rows) {
      try {
        await prisma.supplierProductPricing.upsert({
          where: {
            supplier_sku: { supplier: "FTG", sku: r.sku },
          },
          create: {
            supplier: r.supplier,
            sku: r.sku,
            currency: "GBP",
            costPrice: r.costPrice ?? undefined,
            tradePrice: r.tradePrice ?? undefined,
            rrp: r.rrp ?? undefined,
            vatRate: r.vatRate ?? undefined,
            stockQty: r.stockQty ?? undefined,
            availabilityStatus: r.availabilityStatus ?? undefined,
            leadTimeDays: r.leadTimeDays ?? undefined,
            discontinued: r.discontinued ?? undefined,
          },
          update: {
            costPrice: r.costPrice ?? undefined,
            tradePrice: r.tradePrice ?? undefined,
            rrp: r.rrp ?? undefined,
            vatRate: r.vatRate ?? undefined,
            stockQty: r.stockQty ?? undefined,
            availabilityStatus: r.availabilityStatus ?? undefined,
            leadTimeDays: r.leadTimeDays ?? undefined,
            discontinued: r.discontinued ?? undefined,
          },
        });
        upserted++;

        const hasDetails = await prisma.supplierProduct.findUnique({
          where: { supplier_sku: { supplier: "FTG", sku: r.sku } },
          select: { sku: true },
        });
        if (hasDetails) matchedSkus.add(r.sku);
        else missingDetails.push(r.sku);
      } catch (e) {
        console.error(`Failed SKU ${r.sku}:`, e);
      }
    }

    console.log("\n--- Summary ---");
    console.log(`Rows read:        ${rows.length}`);
    console.log(`Total SKUs matched to SupplierProduct (have details): ${matchedSkus.size}`);
    console.log(`SKUs missing details: ${missingDetails.length}`);
    console.log(`Rows upserted:    ${upserted}`);
    const matchedList = Array.from(matchedSkus);
    if (matchedList.length > 0) {
      console.log("\nExample matched SKUs (first 15):");
      matchedList.slice(0, 15).forEach((sku) => console.log(`  ${sku}`));
      if (matchedList.length > 15) {
        console.log(`  ... and ${matchedList.length - 15} more.`);
      }
    }
    if (missingDetails.length > 0) {
      console.log("\nMissing details (first 50):");
      missingDetails.slice(0, 50).forEach((sku) => console.log(`  ${sku}`));
      if (missingDetails.length > 50) {
        console.log(`  ... and ${missingDetails.length - 50} more.`);
      }
    }
    await pool.end();
  }

  return run();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
