#!/usr/bin/env node
/**
 * Shopify token smoke test.
 * Run: npm run shopify:smoke
 * Never logs secrets.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = join(__dirname, '..');
config({ path: join(root, '.env') });
config({ path: join(root, '.env.local') });

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const STOREFRONT_TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const ADMIN_TOKEN = process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const ADMIN_API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || '2024-01';

function mask(t) {
  if (!t || typeof t !== 'string') return '(empty)';
  if (t.startsWith('shpss_')) return 'shpss_**** (app secret - WRONG)';
  if (t.startsWith('shpat_')) return 'shpat_****';
  return t.slice(0, 8) + '****';
}

async function testStorefront() {
  const url = `https://${DOMAIN}/api/${ADMIN_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': STOREFRONT_TOKEN,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });
  return res;
}

async function testAdmin() {
  const url = `https://${DOMAIN}/admin/api/${ADMIN_API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': ADMIN_TOKEN,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });
  return res;
}

async function main() {
  console.log('\n--- Shopify token smoke test ---\n');
  console.log('Domain:', DOMAIN || '(missing)');
  console.log('Storefront token:', mask(STOREFRONT_TOKEN));
  console.log('Admin token:', mask(ADMIN_TOKEN));
  console.log('');

  if (!DOMAIN) {
    console.log('❌ Missing SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');
    console.log('\nNext steps:');
    console.log('  1. Add to .env: SHOPIFY_STORE_DOMAIN=your-store.myshopify.com');
    console.log('  2. Add to .env: SHOPIFY_STOREFRONT_ACCESS_TOKEN=<your token>');
    console.log('  3. Token must come from: Custom App > Storefront API integration > Storefront access token');
    console.log('\nDo NOT paste shpss_ (app secret) anywhere. That is a different token.');
    process.exit(1);
  }

  if (STOREFRONT_TOKEN?.startsWith('shpss_')) {
    console.log('❌ Wrong token type: You pasted an app secret (shpss_...).');
    console.log('   That is NOT a Storefront token. Find Storefront access token under:');
    console.log('   Shopify Admin → Settings → Apps → Develop apps → [Your app] → Storefront API integration');
    process.exit(1);
  }

  if (STOREFRONT_TOKEN) {
    const res = await testStorefront();
    if (res.ok) {
      const json = await res.json();
      const shopName = json?.data?.shop?.name || 'Shop';
      console.log('✅ Storefront token OK —', shopName);
    } else if (res.status === 401 || res.status === 403) {
      console.log('❌ Storefront token invalid or wrong type.');
      console.log('   You likely pasted an Admin token or app secret.');
      console.log('   Get the correct token from: Custom App > Storefront API integration > Storefront access token');
      process.exit(1);
    } else {
      console.log('❌ Storefront API error:', res.status, res.statusText);
      process.exit(1);
    }
  } else if (ADMIN_TOKEN) {
    const res = await testAdmin();
    if (res.ok) {
      const json = await res.json();
      const shopName = json?.data?.shop?.name || 'Shop';
      console.log('⚠️  Storefront token missing. Admin token OK —', shopName);
      console.log('   Catalog may work (Admin fallback) but cart/checkout require Storefront token.');
      console.log('\nTo get Storefront token:');
      console.log('  Shopify Admin → Settings → Apps → Develop apps → [Your app] → Storefront API integration');
    } else if (res.status === 401 || res.status === 403) {
      console.log('❌ Admin token invalid.');
      process.exit(1);
    } else {
      console.log('❌ Admin API error:', res.status, res.statusText);
      process.exit(1);
    }
  } else {
    console.log('❌ No tokens found (SHOPIFY_STOREFRONT_ACCESS_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN)');
    console.log('\nNext steps:');
    console.log('  1. Paste Storefront API token into SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env');
    console.log('  2. Token must come from: Custom App > Storefront API integration > Storefront access token');
    console.log('  3. Restart dev server after editing .env');
    console.log('\nDo NOT paste shpss_ (app secret). That is not a Storefront token.');
    process.exit(1);
  }

  console.log('');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
