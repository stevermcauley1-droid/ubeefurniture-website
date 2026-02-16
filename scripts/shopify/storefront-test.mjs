#!/usr/bin/env node
/**
 * Verify static Storefront API token.
 * Run: npm run shopify:test
 * Never logs full token. Uses token from .env.local.
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

const SHOP = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const TOKEN = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

const STOREFRONT_API_VERSION = '2024-01';

function maskToken(t) {
  if (!t || t.length < 8) return '(empty)';
  return '****' + t.slice(-4);
}

function fail(msg) {
  console.error(msg);
  process.exit(1);
}

async function main() {
  if (!SHOP) fail('Missing SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN');

  if (!TOKEN) {
    console.error('Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN (or SHOPIFY_STOREFRONT_TOKEN).');
    console.error('Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens');
    console.error('Then add to .env.local: SHOPIFY_STOREFRONT_ACCESS_TOKEN=<token>');
    process.exit(1);
  }

  const url = `https://${SHOP}/api/${STOREFRONT_API_VERSION}/graphql.json`;

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({ query: '{ shop { name } }' }),
  });

  if (res.status === 401 || res.status === 403) {
    console.error('Storefront API returned', res.status);
    console.error('Token (masked):', maskToken(TOKEN));
    console.error('');
    console.error('Check token created in Headless → Storefront API → Access tokens and correct scopes.');
    process.exit(1);
  }

  if (!res.ok) {
    const text = await res.text();
    fail(`Storefront API error (${res.status}): ${text.slice(0, 200)}`);
  }

  const data = await res.json();
  const shopName = data?.data?.shop?.name;

  if (!shopName) {
    const err = data?.errors?.[0]?.message || JSON.stringify(data).slice(0, 200);
    fail(`No shop name in response: ${err}`);
  }

  console.log(`OK: ${shopName}`);

  // Smoke-test collection fetch (first collection handle)
  const collRes = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': TOKEN,
    },
    body: JSON.stringify({
      query: `query { collections(first: 1) { edges { node { handle title } } } }`,
    }),
  });
  if (!collRes.ok) {
    console.error('Collection smoke test failed:', collRes.status);
    process.exit(1);
  }
  const collData = await collRes.json();
  const firstColl = collData?.data?.collections?.edges?.[0]?.node;
  if (firstColl) {
    console.log(`Collection: "${firstColl.title}" (handle: ${firstColl.handle})`);
  } else {
    console.log('No collections returned (store may have none).');
  }
}

main().catch((err) => {
  console.error(err.message);
  process.exit(1);
});
