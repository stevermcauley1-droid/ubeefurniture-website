#!/usr/bin/env node
/**
 * Create a new Shopify Admin API access token (OAuth client_credentials grant)
 * using client id + secret from .env.local (or .env.shopify.credentials).
 *
 * Reads (first match wins for aliases):
 *   SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN
 *   SHOPIFY_CLIENT_ID or SHOPIFY_API_CLIENT_ID or SHOPIFY_ADMIN_CLIENT_ID
 *   SHOPIFY_CLIENT_SECRET or SHOPIFY_API_CLIENT_SECRET or SHOPIFY_ADMIN_CLIENT_SECRET
 *
 * Writes into .env.local (creates file if missing):
 *   SHOPIFY_ADMIN_API_TOKEN
 *   SHOPIFY_ADMIN_ACCESS_TOKEN
 * (same value — scripts in this repo check either name.)
 *
 * Does not print tokens.
 *
 * Run: npm run shopify:admin-token
 *
 * Note: Client-credentials tokens often expire in ~24h; re-run this script or use
 * a long-lived Admin token from the app install in Shopify Admin if you prefer.
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
const projectRoot = path.resolve(process.cwd());
const envPath = path.join(projectRoot, ".env.local");
const credsPath = path.join(projectRoot, ".env.shopify.credentials");

require("dotenv").config({ path: envPath });
require("dotenv").config({ path: path.join(projectRoot, ".env") });
if (fs.existsSync(credsPath)) {
  require("dotenv").config({ path: credsPath });
}

const domain =
  process.env.SHOPIFY_STORE_DOMAIN ||
  process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const clientId =
  process.env.SHOPIFY_CLIENT_ID ||
  process.env.SHOPIFY_API_CLIENT_ID ||
  process.env.SHOPIFY_ADMIN_CLIENT_ID;
const clientSecret =
  process.env.SHOPIFY_CLIENT_SECRET ||
  process.env.SHOPIFY_API_CLIENT_SECRET ||
  process.env.SHOPIFY_ADMIN_CLIENT_SECRET;

if (!domain || !clientId || !clientSecret) {
  console.error(
    "Missing store domain or client credentials. Set in .env.local (or .env.shopify.credentials):"
  );
  console.error(
    "  SHOPIFY_STORE_DOMAIN=your-store.myshopify.com"
  );
  console.error(
    "  SHOPIFY_CLIENT_ID=…   (or SHOPIFY_API_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_ID)"
  );
  console.error(
    "  SHOPIFY_CLIENT_SECRET=…   (or SHOPIFY_API_CLIENT_SECRET / SHOPIFY_ADMIN_CLIENT_SECRET)"
  );
  process.exit(1);
}

/**
 * @returns {{ access_token: string, expires_in?: number, scope?: string }}
 */
async function exchangeClientCredentials(oauthUrl, clientId, clientSecret) {
  const formBody = new URLSearchParams({
    grant_type: "client_credentials",
    client_id: clientId,
    client_secret: clientSecret,
  }).toString();

  let res = await fetch(oauthUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: formBody,
  });
  let text = await res.text();

  if (!res.ok) {
    res = await fetch(oauthUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "client_credentials",
        client_id: clientId,
        client_secret: clientSecret,
      }),
    });
    text = await res.text();
  }

  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error("OAuth response not JSON:", res.status, text.slice(0, 200));
    process.exit(1);
  }

  if (!res.ok) {
    console.error("OAuth failed:", res.status, json?.error || text.slice(0, 300));
    process.exit(1);
  }

  return json;
}

function upsertEnvVar(content, key, value) {
  const newLine = `${key}=${value}`;
  const re = new RegExp(`^${key}=[^\\r\\n]*`, "gm");
  if (content.includes(`${key}=`)) {
    return content.replace(re, newLine);
  }
  const suffix = content.endsWith("\n") || content.length === 0 ? "" : "\n";
  return content + suffix + `${newLine}\n`;
}

const oauthUrl = `https://${domain}/admin/oauth/access_token`;
const json = await exchangeClientCredentials(oauthUrl, clientId, clientSecret);

const accessToken = json.access_token;
if (!accessToken) {
  console.error("No access_token in OAuth response");
  process.exit(1);
}

let content = "";
if (fs.existsSync(envPath)) {
  content = fs.readFileSync(envPath, "utf-8");
} else {
  content = `SHOPIFY_STORE_DOMAIN=${domain}\n`;
  console.log("Created .env.local with store domain + Admin token keys.");
}

content = upsertEnvVar(content, "SHOPIFY_ADMIN_API_TOKEN", accessToken);
content = upsertEnvVar(content, "SHOPIFY_ADMIN_ACCESS_TOKEN", accessToken);

fs.writeFileSync(envPath, content, "utf-8");
console.log(
  "Updated .env.local: SHOPIFY_ADMIN_API_TOKEN and SHOPIFY_ADMIN_ACCESS_TOKEN (values not printed)."
);
if (json.expires_in != null) {
  console.log(`Token expires_in (seconds): ${json.expires_in}`);
}
if (json.scope) {
  console.log(`Scope: ${json.scope}`);
}
