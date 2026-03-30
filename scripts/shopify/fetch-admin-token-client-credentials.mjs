#!/usr/bin/env node
/**
 * Exchange Shopify Dev Dashboard client_id + client_secret for a short-lived
 * Admin API access token (OAuth client_credentials grant).
 *
 * Reads:
 *   SHOPIFY_STORE_DOMAIN (or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN)
 *   SHOPIFY_CLIENT_ID
 *   SHOPIFY_CLIENT_SECRET
 * from .env.local and optional .env.shopify.credentials (gitignored).
 *
 * Writes SHOPIFY_ADMIN_API_TOKEN into .env.local (replace or append).
 * Does not print tokens.
 *
 * Note: Tokens from this grant typically expire in ~24h; re-run this script
 * or rotate to a static Admin token from the app install if you need longevity.
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
const clientId = process.env.SHOPIFY_CLIENT_ID;
const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;

if (!domain || !clientId || !clientSecret) {
  console.error(
    "Missing SHOPIFY_STORE_DOMAIN, SHOPIFY_CLIENT_ID, or SHOPIFY_CLIENT_SECRET."
  );
  console.error(
    "Set them in .env.shopify.credentials (gitignored) or environment."
  );
  process.exit(1);
}

const oauthUrl = `https://${domain}/admin/oauth/access_token`;
const body = new URLSearchParams({
  grant_type: "client_credentials",
  client_id: clientId,
  client_secret: clientSecret,
}).toString();

const res = await fetch(oauthUrl, {
  method: "POST",
  headers: { "Content-Type": "application/x-www-form-urlencoded" },
  body,
});

const text = await res.text();
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

const accessToken = json.access_token;
if (!accessToken) {
  console.error("No access_token in OAuth response");
  process.exit(1);
}

if (!fs.existsSync(envPath)) {
  console.error(".env.local not found at", envPath);
  process.exit(1);
}

let content = fs.readFileSync(envPath, "utf-8");
const key = "SHOPIFY_ADMIN_API_TOKEN";
const newLine = `${key}=${accessToken}`;
if (content.includes(`${key}=`)) {
  content = content.replace(
    new RegExp(`${key}=[^\\r\\n]*(?=\\r?\\n|$)`, "m"),
    newLine
  );
} else {
  if (!content.endsWith("\n")) content += "\n";
  content += `${newLine}\n`;
}

fs.writeFileSync(envPath, content, "utf-8");
console.log("SHOPIFY_ADMIN_API_TOKEN updated in .env.local (not printed).");
if (json.expires_in != null) {
  console.log(`Token expires_in (seconds): ${json.expires_in}`);
}
