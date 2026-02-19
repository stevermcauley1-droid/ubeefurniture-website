/**
 * Shopify Admin API Authentication (2026 Client Credentials Grant)
 * 
 * Handles token exchange and caching for 24-hour expiring tokens.
 * Tokens are cached in memory and persisted to .shopify-token-cache.json
 */

import { config } from "dotenv";
import * as fs from "fs";
import * as path from "path";

config({ path: ".env.local" });
config({ path: ".env" });

interface TokenCache {
  access_token: string;
  expires_at: number; // Unix timestamp
  scope: string;
}

const CACHE_FILE = path.join(process.cwd(), ".shopify-token-cache.json");
const TOKEN_BUFFER_SECONDS = 300; // Refresh 5 minutes before expiry

function getClientCredentials(): { clientId: string; clientSecret: string; store: string } {
  const clientId = process.env.SHOPIFY_CLIENT_ID;
  const clientSecret = process.env.SHOPIFY_CLIENT_SECRET;
  const store = process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;

  if (!clientId || !clientSecret || !store) {
    throw new Error(
      "Missing Shopify credentials. Set in .env.local:\n" +
      "SHOPIFY_CLIENT_ID=your_client_id\n" +
      "SHOPIFY_CLIENT_SECRET=your_client_secret\n" +
      "SHOPIFY_STORE_DOMAIN=your-store.myshopify.com"
    );
  }

  return { clientId, clientSecret, store };
}

function loadTokenCache(): TokenCache | null {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const content = fs.readFileSync(CACHE_FILE, "utf-8");
      const cache: TokenCache = JSON.parse(content);
      // Verify token is still valid
      if (cache.expires_at > Date.now() / 1000 + TOKEN_BUFFER_SECONDS) {
        return cache;
      }
    }
  } catch (e) {
    // Cache file doesn't exist or is invalid, will fetch new token
  }
  return null;
}

function saveTokenCache(cache: TokenCache): void {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), "utf-8");
  } catch (e) {
    console.warn("Could not save token cache:", e);
  }
}

async function exchangeCredentialsForToken(): Promise<TokenCache> {
  const { clientId, clientSecret, store } = getClientCredentials();

  const url = `https://${store}/admin/oauth/access_token`;
  
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      grant_type: "client_credentials",
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Token exchange failed (${response.status}): ${errorText}\n` +
      `URL: ${url}\n` +
      `Check: Client ID, Client Secret, and Store domain are correct.`
    );
  }

  const data = await response.json() as {
    access_token: string;
    scope: string;
    expires_in: number;
  };

  const expiresAt = Math.floor(Date.now() / 1000) + data.expires_in;

  return {
    access_token: data.access_token,
    expires_at: expiresAt,
    scope: data.scope,
  };
}

/**
 * Get a valid Admin API access token.
 * Uses cached token if available and not expired, otherwise exchanges credentials for a new token.
 */
export async function getAdminAccessToken(): Promise<string> {
  // Try to load from cache
  const cached = loadTokenCache();
  if (cached) {
    return cached.access_token;
  }

  // Exchange credentials for new token
  console.log("Exchanging Client Credentials for Admin API token...");
  const tokenCache = await exchangeCredentialsForToken();
  saveTokenCache(tokenCache);
  
  const expiresIn = Math.floor((tokenCache.expires_at - Date.now() / 1000) / 60);
  console.log(`✅ Token obtained (expires in ${expiresIn} minutes)`);

  return tokenCache.access_token;
}

/**
 * Test the Admin API connection by fetching shop info.
 */
export async function testAdminConnection(): Promise<{ success: boolean; shop?: any; error?: string }> {
  try {
    const token = await getAdminAccessToken();
    const { store } = getClientCredentials();
    
    const url = `https://${store}/admin/api/2024-01/shop.json`;
    const response = await fetch(url, {
      headers: {
        "X-Shopify-Access-Token": token,
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      return {
        success: false,
        error: `API call failed (${response.status}): ${errorText}`,
      };
    }

    const data = await response.json();
    return {
      success: true,
      shop: data.shop,
    };
  } catch (e) {
    return {
      success: false,
      error: e instanceof Error ? e.message : String(e),
    };
  }
}
