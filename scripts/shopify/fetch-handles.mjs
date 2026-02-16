#!/usr/bin/env node
/**
 * Fetch real Shopify collection and product handles.
 * Outputs to terminal and saves to docs/SHOPIFY_HANDLES.md
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
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

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const token = process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;

if (!domain || !token) {
  console.error('Missing SHOPIFY_STORE_DOMAIN or SHOPIFY_STOREFRONT_ACCESS_TOKEN (or SHOPIFY_STOREFRONT_TOKEN)');
  console.error('Set in .env.local or as environment variables');
  process.exit(1);
}

const API_VERSION = '2024-01';
const url = `https://${domain}/api/${API_VERSION}/graphql.json`;

const COLLECTIONS_QUERY = `
  query Collections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`;

const PRODUCTS_QUERY = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          handle
          title
        }
      }
    }
  }
`;

async function fetchGraphQL(query, variables) {
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': token,
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!res.ok) {
    throw new Error(`API error: ${res.status} ${res.statusText}`);
  }

  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join('; '));
  }

  return json.data;
}

async function main() {
  try {
    console.log('Fetching collections...');
    const collectionsData = await fetchGraphQL(COLLECTIONS_QUERY, { first: 20 });
    const collections = collectionsData.collections.edges
      .map((e) => ({
        handle: e.node.handle,
        title: e.node.title,
      }))
      .filter((c) => c.handle !== 'frontpage'); // Exclude frontpage collection

    console.log('Fetching products...');
    const productsData = await fetchGraphQL(PRODUCTS_QUERY, { first: 20 });
    const products = productsData.products.edges.map((e) => ({
      handle: e.node.handle,
      title: e.node.title,
    }));

    console.log('\n=== COLLECTIONS ===');
    collections.forEach((c) => {
      console.log(`  ${c.handle} - ${c.title}`);
    });

    console.log('\n=== PRODUCTS ===');
    products.forEach((p) => {
      console.log(`  ${p.handle} - ${p.title}`);
    });

    // Save to docs/SHOPIFY_HANDLES.md
    const docPath = join(root, 'docs/SHOPIFY_HANDLES.md');
    const docContent = `# Shopify Handles (Source of Truth)

Generated: ${new Date().toISOString()}

## Collections

${collections.map((c) => `- **${c.handle}** - ${c.title}`).join('\n')}

## Products

${products.map((p) => `- **${p.handle}** - ${p.title}`).join('\n')}

---

**Note:** These are real handles from your Shopify store. Use these in navigation links and test URLs.
`;

    writeFileSync(docPath, docContent, 'utf-8');
    console.log(`\n✓ Saved to ${docPath}`);

    // Output first 2 collection handles for easy copy-paste
    if (collections.length >= 2) {
      console.log(`\n💡 Suggested nav handles: ${collections[0].handle}, ${collections[1].handle}`);
    }
  } catch (err) {
    console.error('Error:', err.message);
    process.exit(1);
  }
}

main();
