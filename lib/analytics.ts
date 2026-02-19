/**
 * GA4 analytics — conditionally loads only if measurement ID exists.
 * Prevents console errors when NEXT_PUBLIC_GA_MEASUREMENT_ID is not set.
 */

export const GA_MEASUREMENT_ID =
  process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID || '';

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

/**
 * Safe gtag wrapper with error handling and dev logging.
 * Silently fails in production if GA not loaded.
 */
function safeGtag(...args: unknown[]) {
  if (typeof window === 'undefined') return;
  
  if (typeof window.gtag === 'function') {
    try {
      window.gtag(...args);
      
      // Dev-only console logging
      if (process.env.NODE_ENV === 'development') {
        const [eventName, params] = args as [string, Record<string, unknown>];
        console.log(`[GA4] Event fired: ${eventName}`, params);
      }
    } catch (error) {
      // Silent fail in production
      if (process.env.NODE_ENV === 'development') {
        console.error('[GA4] Error firing event:', error);
      }
    }
  } else if (process.env.NODE_ENV === 'development') {
    console.warn('[GA4] gtag not available. Ensure GoogleAnalytics component is mounted.');
  }
}

/**
 * Generic GA4 event tracking function.
 * Supports any event name and parameters following GA4 Enhanced Ecommerce schema.
 * 
 * @param eventName - GA4 event name (e.g., 'view_item', 'purchase')
 * @param params - Event parameters object
 */
export function trackEvent(eventName: string, params: Record<string, unknown> = {}) {
  safeGtag('event', eventName, params);
}

/**
 * Track product view (GA4 standard event: view_item)
 * Enhanced Ecommerce schema with item_category support.
 */
export function trackViewItem(item: { 
  id: string; 
  name: string; 
  price: number; 
  currency: string; 
  quantity: number;
  category?: string;
}) {
  trackEvent('view_item', {
    currency: item.currency,
    value: item.price * item.quantity,
    items: [{
      item_id: item.id,
      item_name: item.name,
      ...(item.category && { item_category: item.category }),
      price: item.price,
      quantity: item.quantity,
    }],
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

/**
 * Track purchase (GA4 standard event: purchase)
 * Enhanced Ecommerce schema with full item details.
 * Includes sessionStorage guard to prevent duplicate firing.
 */
export function trackPurchase(
  transactionId: string,
  value: number,
  currency: string,
  items: { 
    id: string; 
    name: string; 
    price: number; 
    quantity: number;
    category?: string;
  }[]
) {
  // Prevent duplicate firing using sessionStorage
  if (typeof window !== 'undefined') {
    const storageKey = `purchase_tracked_${transactionId}`;
    if (sessionStorage.getItem(storageKey)) {
      if (process.env.NODE_ENV === 'development') {
        console.log(`[GA4] Purchase event already tracked for transaction ${transactionId}, skipping.`);
      }
      return;
    }
    sessionStorage.setItem(storageKey, 'true');
  }

  trackEvent('purchase', {
    transaction_id: transactionId,
    currency,
    value,
    items: items.map((i) => ({
      item_id: i.id,
      item_name: i.name,
      ...(i.category && { item_category: i.category }),
      price: i.price,
      quantity: i.quantity,
    })),
  });
}

/**
 * Track lead form submission (GA4 standard event: generate_lead)
 * Use when a user submits a quote request or lead form.
 */
export function trackLeadSubmit(value?: number, currency: string = 'GBP') {
  safeGtag('event', 'generate_lead', {
    currency,
    ...(value !== undefined && { value }),
  });
}

/**
 * Track quote button click (custom event for landlord quote CTA)
 * Fires when user clicks "Get a Fast Furnishing Quote" button.
 */
export function trackQuoteClick() {
  safeGtag('event', 'quote_click', {
    event_category: 'engagement',
    event_label: 'landlord_quote_cta',
  });
}
