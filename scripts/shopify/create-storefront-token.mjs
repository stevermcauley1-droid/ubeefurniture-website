#!/usr/bin/env node
/**
 * Create a Shopify Storefront API token via Admin GraphQL (storefrontAccessTokenCreate).
 * Reads SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN from .env.local.
 * Writes SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local (add or replace).
 * Never logs tokens.
 */

import fs from 'fs';
import path from 'path';
import { createRequire } from 'module';
const require = createRequire(import.meta.url);

const projectRoot = path.resolve(process.cwd());
const envPath = path.join(projectRoot, '.env.local');

require('dotenv').config({ path: envPath });
require('dotenv').config({ path: path.join(projectRoot, '.env') });
const credsPath = process.env.SHOPIFY_CREDENTIALS_FILE || path.join(projectRoot, 'data', 'ftg', '.env.shopify.credentials');
if (fs.existsSync(credsPath)) {
  require('dotenv').config({ path: credsPath });
}

const domain = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
let adminToken = process.env.SHOPIFY_ADMIN_API_TOKEN || process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

if (!domain) {
  console.error('Missing SHOPIFY_STORE_DOMAIN in .env.local');
  process.exit(1);
}

if (clientId && clientSecret) {
  const oauthUrl = `https://${domain}/admin/oauth/access_token`;
  const oauthBody = new URLSearchParams({
    client_id: clientId,
    client_secret: clientSecret,
    grant_type: 'client_credentials',
  }).toString();
  const oauthRes = await fetch(oauthUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: oauthBody,
  });
  if (!oauthRes.ok) {
    const t = await oauthRes.text();
    console.error('OAuth failed', oauthRes.status, t);
    process.exit(1);
  }
  const oauthJson = await oauthRes.json();
  adminToken = oauthJson.access_token;
}

if (!adminToken) {
  console.error('Set SHOPIFY_CLIENT_ID and SHOPIFY_CLIENT_SECRET (env), or SHOPIFY_ADMIN_API_TOKEN in .env.local');
  process.exit(1);
}

const API_VERSION = '2024-01';
const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;

const mutation = `mutation StorefrontAccessTokenCreate($input: StorefrontAccessTokenInput!) {
  storefrontAccessTokenCreate(input: $input) {
    userErrors { field message }
    storefrontAccessToken { accessToken title }
  }
}`;

const body = JSON.stringify({
  query: mutation,
  variables: { input: { title: 'uBee Headless Storefront' } },
});

const res = await fetch(url, {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'X-Shopify-Access-Token': adminToken,
  },
  body,
});

const json = await res.json();
if (!res.ok) {
  console.error('GraphQL HTTP', res.status, JSON.stringify(json));
  process.exit(1);
}

const create = json?.data?.storefrontAccessTokenCreate;
if (!create) {
  console.error('Unexpected response:', JSON.stringify(json));
  process.exit(1);
}

if (create.userErrors?.length) {
  console.error('userErrors:', create.userErrors.map((e) => e.message).join('; '));
  process.exit(1);
}

const storefrontToken = create.storefrontAccessToken?.accessToken;
if (!storefrontToken) {
  console.error('No accessToken in response');
  process.exit(1);
}

// Update .env.local: set or replace SHOPIFY_STOREFRONT_ACCESS_TOKEN
let content = fs.readFileSync(envPath, 'utf-8');
const key = 'SHOPIFY_STOREFRONT_ACCESS_TOKEN';
const newLine = `${key}=${storefrontToken}`;
if (content.includes(key + '=')) {
  content = content.replace(new RegExp(`${key}=[^\r\n]*(?=\r?\n|$)`, 'm'), newLine);
} else {
  // Remove comment line if present and add token
  content = content.replace(/\n# SHOPIFY_STOREFRONT_ACCESS_TOKEN=\s*\n?/, '\n');
  if (!content.trimEnd().endsWith('\n')) content += '\n';
  content += newLine + '\n';
}
fs.writeFileSync(envPath, content, 'utf-8');
console.log('SHOPIFY_STOREFRONT_ACCESS_TOKEN written to .env.local');
