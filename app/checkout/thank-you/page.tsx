'use client';

import { Suspense, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { trackPurchase } from '@/lib/analytics';

/**
 * Order Confirmation / Thank You page.
 * Tracks purchase event when order is completed.
 * 
 * Expected URL params:
 * - order_id: Shopify order ID
 * - total: Order total
 * - items: JSON stringified array of items (optional, can parse from URL)
 * 
 * Or can be called from Shopify checkout redirect with order details.
 */
function ThankYouContent() {
  const searchParams = useSearchParams();
  const hasTracked = useRef(false);

  useEffect(() => {
    // Prevent duplicate firing
    if (hasTracked.current) return;

    const orderId = searchParams.get('order_id') || searchParams.get('orderId');
    const total = searchParams.get('total');
    const currency = searchParams.get('currency') || 'GBP';
    const itemsParam = searchParams.get('items');

    if (!orderId || !total) {
      if (process.env.NODE_ENV === 'development') {
        console.warn('[GA4] Missing order_id or total in URL params. Purchase event not tracked.');
      }
      return;
    }

    hasTracked.current = true;

    // Parse items from URL or use empty array
    let items: { id: string; name: string; price: number; quantity: number; category?: string }[] = [];
    
    if (itemsParam) {
      try {
        items = JSON.parse(decodeURIComponent(itemsParam));
      } catch (error) {
        if (process.env.NODE_ENV === 'development') {
          console.error('[GA4] Failed to parse items from URL:', error);
        }
      }
    }

    // Track purchase event
    trackPurchase(
      orderId,
      parseFloat(total),
      currency,
      items
    );
  }, [searchParams]);

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem', textAlign: 'center' }}>
      <h1 style={{ fontSize: '2rem', marginBottom: '1rem' }}>Thank you for your order!</h1>
      <p style={{ fontSize: '1.125rem', color: '#555', marginBottom: '2rem' }}>
        Your order has been received and is being processed.
      </p>
      <p style={{ marginBottom: '2rem' }}>
        You will receive an email confirmation shortly with your order details.
      </p>
      <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
        <Link
          href="/"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#000',
            color: '#fff',
            borderRadius: 4,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          Continue Shopping
        </Link>
        <Link
          href="/collections"
          style={{
            padding: '0.75rem 1.5rem',
            background: '#f0f0f0',
            color: '#000',
            borderRadius: 4,
            fontWeight: 600,
            textDecoration: 'none',
          }}
        >
          View Collections
        </Link>
      </div>
    </main>
  );
}

export default function ThankYouPage() {
  return (
    <Suspense fallback={null}>
      <ThankYouContent />
    </Suspense>
  );
}
