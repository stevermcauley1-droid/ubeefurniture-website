/**
 * Shopify token errors — actionable messages, never log secrets.
 */

export class ShopifyTokenError extends Error {
  constructor(
    message: string,
    public readonly code: 'MISSING' | 'WRONG_TYPE' | 'INVALID'
  ) {
    super(message);
    this.name = 'ShopifyTokenError';
  }
}

export const TOKEN_GUIDANCE = {
  missing: 'Create token in Shopify Admin → Headless → Storefront API → Manage → Access tokens. Paste into SHOPIFY_STOREFRONT_ACCESS_TOKEN in .env.local.',
  wrongType: 'You pasted an app secret (shpss_...). That is NOT a Storefront token. Use the token from Headless → Storefront API → Access tokens.',
  troubleshooting: 'Run: npm run shopify:smoke',
} as const;
