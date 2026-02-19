/**
 * Test script to debug collections fetching.
 * Run: npx tsx scripts/test-collections.ts
 */

import { config } from 'dotenv';
import { getCollections } from '../lib/shopify';

config({ path: '.env.local' });
config({ path: '.env' });

async function testCollections() {
  console.log('=== Testing Collections Fetch ===\n');
  
  console.log('Environment check:');
  console.log('  SHOPIFY_STORE_DOMAIN:', process.env.SHOPIFY_STORE_DOMAIN || 'NOT SET');
  console.log('  SHOPIFY_STOREFRONT_ACCESS_TOKEN:', process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ? `${process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN.substring(0, 10)}...` : 'NOT SET');
  console.log('  SHOPIFY_STOREFRONT_TOKEN:', process.env.SHOPIFY_STOREFRONT_TOKEN ? `${process.env.SHOPIFY_STOREFRONT_TOKEN.substring(0, 10)}...` : 'NOT SET');
  console.log('  SHOPIFY_ADMIN_ACCESS_TOKEN:', process.env.SHOPIFY_ADMIN_ACCESS_TOKEN ? 'SET' : 'NOT SET');
  console.log('  SHOPIFY_DATA_MODE:', process.env.SHOPIFY_DATA_MODE || 'not set (defaults to storefront)');
  console.log('');

  try {
    console.log('Calling getCollections(20)...\n');
    const result = await getCollections(20);
    
    console.log('=== Result ===');
    console.log('Collections count:', result.collections.edges.length);
    console.log('PageInfo:', result.collections.pageInfo);
    console.log('\nCollections:');
    result.collections.edges.forEach((edge, i) => {
      console.log(`  ${i + 1}. ${edge.node.title} (handle: ${edge.node.handle}, id: ${edge.node.id})`);
    });
    
    if (result.collections.edges.length === 0) {
      console.log('\n⚠️  No collections returned. Possible causes:');
      console.log('  1. No collections exist in Shopify store');
      console.log('  2. Collections exist but are not published');
      console.log('  3. Storefront API token missing required scopes');
      console.log('  4. Using Admin API fallback but no Admin token');
    }
  } catch (error) {
    console.error('\n❌ Error:', error.message);
    console.error('Stack:', error.stack);
  }
}

testCollections();
