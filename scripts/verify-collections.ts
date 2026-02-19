/**
 * Verify collections are set up correctly.
 * Run: npx tsx scripts/verify-collections.ts
 */

import { config } from "dotenv";
import { getCollections } from "../lib/shopify";

config({ path: ".env.local" });
config({ path: ".env" });

const REQUIRED_COLLECTIONS = [
  "Sofas",
  "Beds",
  "Mattresses",
  "Wardrobes",
  "Dining",
  "Package Deals",
  "Landlord Packs",
  "Sale",
];

async function verifyCollections() {
  console.log("=== Collections Verification ===\n");

  try {
    const result = await getCollections(50);
    const allCollections = result.collections.edges.map((e) => e.node);
    const filtered = allCollections.filter((c) => c.handle !== "frontpage");

    console.log(`Total collections from API: ${allCollections.length}`);
    console.log(`After filtering 'frontpage': ${filtered.length}\n`);

    console.log("Collections found:");
    filtered.forEach((c, i) => {
      console.log(`  ${i + 1}. ${c.title} (handle: ${c.handle})`);
    });

    console.log("\nRequired collections:");
    const foundHandles = filtered.map((c) => c.title.toLowerCase());
    const missing: string[] = [];

    REQUIRED_COLLECTIONS.forEach((req) => {
      const found = foundHandles.some(
        (h) => h === req.toLowerCase() || h.includes(req.toLowerCase())
      );
      if (found) {
        console.log(`  ✅ ${req}`);
      } else {
        console.log(`  ❌ ${req} (MISSING)`);
        missing.push(req);
      }
    });

    if (missing.length === 0) {
      console.log("\n✅ All required collections are present!");
      console.log("\nNext steps:");
      console.log("1. Visit: http://localhost:3001/collections");
      console.log("2. Verify all collections appear");
      console.log("3. Sync FTG products: npm run ftg:sync:shopify");
    } else {
      console.log(`\n⚠️  Missing ${missing.length} collection(s): ${missing.join(", ")}`);
      console.log("\nCreate missing collections in Shopify Admin:");
      console.log("https://ubee-furniture.myshopify.com/admin/collections");
      console.log("\nSee: docs/SHOPIFY-COLLECTIONS-EXACT-STEPS.md for instructions");
    }
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    console.error("\nCheck:");
    console.error("1. Storefront API token is set in .env.local");
    console.error("2. Dev server is running (npm run dev)");
    console.error("3. Collections exist in Shopify Admin");
  }
}

verifyCollections();
