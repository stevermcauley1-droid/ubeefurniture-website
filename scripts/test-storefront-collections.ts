/**
 * Test Storefront API collections query directly
 */

import { config } from "dotenv";

config({ path: ".env.local" });

async function main() {
  const store = process.env.SHOPIFY_STORE_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
  
  if (!store || !token) {
    console.error("Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN");
    process.exit(1);
  }

  const query = `
    query CollectionsFirst($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            handle
            title
            image {
              url
              altText
              width
              height
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  `;

  const url = `https://${store}/api/2024-01/graphql.json`;
  
  console.log("Querying Storefront API...");
  console.log(`URL: ${url}`);
  console.log(`Token: ${token.substring(0, 10)}...\n`);

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token,
      },
      body: JSON.stringify({ query, variables: { first: 50 } }),
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);
    
    console.log(`Status: ${res.status} ${res.statusText}`);
    
    const json = await res.json();
    
    if (json.errors) {
      console.error("Errors:", JSON.stringify(json.errors, null, 2));
    }
    
    if (json.data) {
      const collections = json.data.collections?.edges || [];
      console.log(`\nFound ${collections.length} collections:\n`);
      collections.forEach((e: any) => {
        const c = e.node;
        console.log(`- ${c.title} (${c.handle})`);
      });
    }
  } catch (e) {
    if (e instanceof Error && e.name === 'AbortError') {
      console.error("Request timed out after 10 seconds");
    } else {
      console.error("Error:", e);
    }
  }
}

main();
