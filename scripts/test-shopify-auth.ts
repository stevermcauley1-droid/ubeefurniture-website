/**
 * Test Shopify Admin API authentication
 * Run: npx tsx scripts/test-shopify-auth.ts
 */

import { testAdminConnection, getAdminAccessToken } from "../lib/shopify-auth";

async function main() {
  console.log("=== Testing Shopify Admin API Authentication ===\n");

  try {
    // Test token exchange
    console.log("1. Testing token exchange...");
    const token = await getAdminAccessToken();
    console.log(`   ✅ Token obtained: ${token.substring(0, 20)}...\n`);

    // Test API connection
    console.log("2. Testing API connection...");
    const result = await testAdminConnection();
    
    if (result.success && result.shop) {
      console.log("   ✅ Connection successful!");
      console.log(`   Store: ${result.shop.name}`);
      console.log(`   Domain: ${result.shop.domain}`);
      console.log(`   Email: ${result.shop.email}`);
      console.log("\n✅ Authentication is working correctly!");
    } else {
      console.error("   ❌ Connection failed:");
      console.error(`   ${result.error}`);
      process.exit(1);
    }
  } catch (error) {
    console.error("\n❌ Error:", error instanceof Error ? error.message : String(error));
    process.exit(1);
  }
}

main();
