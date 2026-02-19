#!/usr/bin/env node
/**
 * Check if products exist in Shopify store.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

config({ path: join(rootDir, '.env.local') });

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

if (!domain || !token) {
  console.error('❌ Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN');
  process.exit(1);
}

const API_VERSION = '2024-01';
const url = `https://${domain}/api/${API_VERSION}/graphql.json`;

const query = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          availableForSale
          featuredImage {
            url
          }
        }
      }
    }
  }
`;

async function checkProducts() {
  try {
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Storefront-Access-Token': token,
      },
      body: JSON.stringify({ query, variables: { first: 10 } }),
    });

    if (!res.ok) {
      throw new Error(`API error: ${res.status} ${res.statusText}`);
    }

    const json = await res.json();
    
    if (json.errors?.length) {
      console.error('❌ GraphQL errors:');
      json.errors.forEach((e) => console.error('  -', e.message));
      process.exit(1);
    }

    const products = json.data?.products?.edges || [];
    
    console.log(`\n📦 Products in store: ${products.length}\n`);

    if (products.length === 0) {
      console.log('⚠️  No products found in your Shopify store.');
      console.log('\n📝 Next steps:');
      console.log('   1. Go to: https://ubee-furniture.myshopify.com/admin');
      console.log('   2. Navigate to Products → Add product');
      console.log('   3. Add at least 2-3 products for testing');
      console.log('   4. Make sure products are set to "Active" status');
      console.log('   5. Run this script again to verify\n');
      process.exit(0);
    }

    console.log('✅ Products found:\n');
    products.forEach(({ node }, i) => {
      console.log(`   ${i + 1}. ${node.title}`);
      console.log(`      Handle: ${node.handle}`);
      console.log(`      Available: ${node.availableForSale ? '✅ Yes' : '❌ No'}`);
      console.log(`      URL: http://localhost:3000/products/${node.handle}`);
      console.log('');
    });

    console.log('💡 To test view_item event:');
    console.log(`   Visit: http://localhost:3000/products/${products[0].node.handle}\n`);

  } catch (error) {
    console.error('❌ Error checking products:', error.message);
    process.exit(1);
  }
}

checkProducts();
