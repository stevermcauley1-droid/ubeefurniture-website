#!/usr/bin/env node
/**
 * Shopify Storefront token smoke test.
 * Run: npm run shopify:smoke
 * Never logs secrets; prints domain, masked token, and runs a minimal Storefront API query.
 */

import { readFileSync, existsSync } from 'fs';
import { join } from 'path';

const root = process.cwd();

function loadEnv(path) {
  if (!existsSync(path)) return;
  const content = readFileSync(path, 'utf8');
  for (const line of content.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const m = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
    if (m) {
      const value = m[2].replace(/^["']|["']$/g, '').trim();
      if (!process.env[m[1]]) process.env[m[1]] = value;
    }
  }
}

loadEnv(join(root, '.env'));
loadEnv(join(root, '.env.local'));

const DOMAIN = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;
const STOREFRONT_API_VERSION = '2024-01';

function maskToken(t) {
  if (!t || typeof t !== 'string') return '(empty)';
  if (t.startsWith('shpss_')) return 'shpss_**** (app secret — not Storefront)';
  if (t.startsWith('shpat_')) return 'shpat_**** (Admin token — use Headless token)';
  if (t.length <= 8) return '****';
  return t.slice(0, 4) + '****' + t.slice(-4);
}

async function main() {
  console.log('--- Shopify Storefront smoke test ---\n');
  console.log('Domain:', DOMAIN || '(missing)');
  console.log('Storefront token:', TOKEN ? `present (${maskToken(TOKEN)})` : '(missing)');
  console.log('');

  if (!DOMAIN) {
    console.error('Missing SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN.');
    console.error('Add to .env.local: SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com');
    process.exit(1);
  }

  if (!TOKEN) {
    console.error('Missing Storefront token. Set SHOPIFY_STOREFRONT_ACCESS_TOKEN or SHOPIFY_STOREFRONT_TOKEN in .env.local.');
    console.error('Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens');
    process.exit(1);
  }

  if (TOKEN.startsWith('shpss_')) {
    console.error('Wrong token type: app secret (shpss_) is not a Storefront token.');
    console.error('Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens');
    process.exit(1);
  }

  const url = `https://${DOMAIN}/api/${STOREFRONT_API_VERSION}/graphql.json`;

  const shopRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });

  if (shopRes.status === 401 || shopRes.status === 403) {
    console.error('Storefront API returned', shopRes.status);
    console.error('Check token created in Headless → Storefront API → Access tokens and correct scopes.');
    process.exit(1);
  }

  if (!shopRes.ok) {
    const text = await shopRes.text();
    console.error('Storefront API error:', shopRes.status, text.slice(0, 200));
    process.exit(1);
  }

  const shopData = await shopRes.json();
  const shopName = shopData?.data?.shop?.name;

  if (!shopName) {
    const err = shopData?.errors?.[0]?.message || JSON.stringify(shopData).slice(0, 150);
    console.error('Storefront API query failed:', err);
    process.exit(1);
  }

  console.log('Storefront API query: OK (shop name:', shopName + ')');

  const productsRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      query: 'query { products(first: 1) { edges { node { id } } } }',
    }),
  });

  if (productsRes.ok) {
    const productsData = await productsRes.json();
    const count = productsData?.data?.products?.edges?.length ?? 0;
    console.log('Storefront API query: OK (at least', count, 'product(s) reachable)');
  }

  console.log('\n✅ Smoke test passed.');
  process.exit(0);
}

main().catch((err) => {
  console.error('Error:', err.message);
  process.exit(1);
});
