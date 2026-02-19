/**
 * Check collections via Admin API to verify they exist and are published
 */

import { getAdminAccessToken } from "../lib/shopify-auth";
import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const token = await getAdminAccessToken();
  const store = process.env.SHOPIFY_STORE_DOMAIN;
  
  const query = `
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            handle
            title
            ruleSet {
              appliedDisjunctively
              rules {
                column
                relation
                condition
              }
            }
            resourcePublicationsV2(first: 10) {
              edges {
                node {
                  publication {
                    id
                    name
                  }
                }
              }
            }
          }
        }
      }
    }
  `;

  const url = `https://${store}/admin/api/2024-01/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables: { first: 50 } }),
  });

  const json = await res.json();
  
  if (json.errors) {
    console.error("Errors:", json.errors);
    return;
  }

  const collections = json.data?.collections?.edges || [];
  console.log(`\n=== Admin API Collections (${collections.length} total) ===\n`);
  
  const required = ["Sofas", "Beds", "Mattresses", "Wardrobes", "Dining", "Package Deals", "Landlord Packs", "Sale"];
  
  collections.forEach((e: any) => {
    const c = e.node;
    const pubs = c.resourcePublicationsV2?.edges || [];
    const publishedTo = pubs.map((p: any) => p.node.publication.name).join(", ") || "NOT PUBLISHED";
    const isSmart = c.ruleSet !== null;
    
    console.log(`${c.title} (${c.handle})`);
    console.log(`  Smart: ${isSmart ? "Yes" : "No"}`);
    console.log(`  Published to: ${publishedTo}`);
    console.log(`  Rules: ${c.ruleSet?.rules?.length || 0}`);
    console.log("");
  });
  
  const foundTitles = collections.map((e: any) => e.node.title);
  console.log("\n=== Required Collections Status ===");
  required.forEach((req) => {
    const found = foundTitles.some((t: string) => t.toLowerCase() === req.toLowerCase());
    console.log(`${found ? "✅" : "❌"} ${req}`);
  });
}

main().catch(console.error);
