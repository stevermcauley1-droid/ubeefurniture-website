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
  missing: 'Go to Shopify Admin → Settings → Apps → Develop apps → [Your app] → Storefront API integration → reveal Storefront access token.',
  wrongType: 'You pasted an app secret (shpss_...). That is NOT a Storefront token. Find Storefront access token under Storefront API integration.',
  troubleshooting: 'Run: npm run shopify:smoke',
} as const;
