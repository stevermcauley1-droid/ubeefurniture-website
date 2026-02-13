/**
 * GA4 analytics — conditionally loads only if measurement ID exists.
 * Prevents console errors when NEXT_PUBLIC_GA4_MEASUREMENT_ID is not set.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '';

export function isGAEnabled(): boolean {
  return !!GA_MEASUREMENT_ID && GA_MEASUREMENT_ID !== 'G-XXXXXXXXXX';
}

export function getGAMeasurementId(): string {
  return GA_MEASUREMENT_ID;
}

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void;
    dataLayer?: unknown[];
  }
}

function safeGtag(...args: unknown[]) {
  if (typeof window !== 'undefined' && typeof window.gtag === 'function') {
    window.gtag(...args);
  }
}

export function trackViewItem(item: { id: string; name: string; price: number; currency: string; quantity: number }) {
  safeGtag('event', 'view_item', {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
}

export function trackAddToCart(item: { id: string; name: string; price: number; currency: string; quantity: number }) {
  safeGtag('event', 'add_to_cart', {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [{ item_id: item.id, item_name: item.name, price: item.price, quantity: item.quantity }],
  });
}

export function trackBeginCheckout(
  value: number,
  currency: string,
  items: { id: string; name: string; price: number; quantity: number }[]
) {
  safeGtag('event', 'begin_checkout', {
    currency,
    value,
    items: items.map((i) => ({ item_id: i.id, item_name: i.name, price: i.price, quantity: i.quantity })),
  });
}
