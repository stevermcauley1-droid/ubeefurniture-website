#!/usr/bin/env node
/**
 * Token is NOT generated via API (storefrontAccessTokenCreate requires elevated access).
 * This script only prints where to create and paste the token.
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

const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

if (token) {
  console.log('Storefront token is already set (masked). Use: npm run shopify:smoke');
  process.exit(0);
}

console.error('No Storefront API token found.\n');
console.error('Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens');
console.error('Then paste the token into .env.local:');
console.error('  SHOPIFY_STOREFRONT_ACCESS_TOKEN=<paste token>');
console.error('\nDo NOT use storefrontAccessTokenCreate (API); use the copyable token from Headless.');
process.exit(1);
