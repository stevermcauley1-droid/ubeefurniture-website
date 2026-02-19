/**
 * Shopify webhook handler for order completion.
 * Tracks purchase events in GA4 via Measurement Protocol.
 *
 * Setup:
 * 1. In Shopify Admin → Settings → Notifications → Webhooks
 * 2. Create webhook: Order creation, JSON format
 * 3. URL: https://yourdomain.com/api/shopify-webhook
 * 4. Add SHOPIFY_WEBHOOK_SECRET to .env.local
 */

import { NextRequest, NextResponse } from 'next/server';
import { trackPurchase } from '@/lib/analytics';

const WEBHOOK_SECRET = process.env.SHOPIFY_WEBHOOK_SECRET;
const GA_MEASUREMENT_ID = process.env.NEXT_PUBLIC_GA4_MEASUREMENT_ID || process.env.NEXT_PUBLIC_GA_ID;
const GA_API_SECRET = process.env.GA4_API_SECRET; // Get from GA4 Admin → Data Streams → Measurement Protocol API secrets

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret (basic check)
    const authHeader = request.headers.get('x-shopify-hmac-sha256');
    if (WEBHOOK_SECRET && authHeader !== WEBHOOK_SECRET) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const order = await request.json();

    // Extract order data
    const transactionId = order.order_number?.toString() || order.id?.toString() || `order_${Date.now()}`;
    const total = parseFloat(order.total_price || '0');
    const currency = order.currency || 'GBP';
    const items =
      order.line_items?.map((item: any) => ({
        id: item.product_id?.toString() || item.variant_id?.toString() || '',
        name: item.name || '',
        price: parseFloat(item.price || '0'),
        quantity: parseInt(item.quantity || '1', 10),
      })) || [];

    // Track purchase in GA4 via Measurement Protocol (server-side)
    if (GA_MEASUREMENT_ID && GA_API_SECRET) {
      await trackPurchaseViaMeasurementProtocol(transactionId, total, currency, items);
    }

    // Also log for debugging
    console.log('[Webhook] Purchase tracked:', {
      transactionId,
      value: total,
      currency,
      itemCount: items.length,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('[Webhook] Error processing purchase:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

/**
 * Track purchase via GA4 Measurement Protocol (server-side).
 * This ensures purchases are tracked even if user doesn't return to site.
 */
async function trackPurchaseViaMeasurementProtocol(
  transactionId: string,
  value: number,
  currency: string,
  items: { id: string; name: string; price: number; quantity: number }[]
) {
  if (!GA_MEASUREMENT_ID || !GA_API_SECRET) return;

  const clientId = `webhook_${Date.now()}`; // Generate a client ID for server-side tracking

  const payload = {
    client_id: clientId,
    events: [
      {
        name: 'purchase',
        params: {
          transaction_id: transactionId,
          value,
          currency,
          items: items.map((i) => ({
            item_id: i.id,
            item_name: i.name,
            price: i.price,
            quantity: i.quantity,
          })),
        },
      },
    ],
  };

  try {
    const response = await fetch(
      `https://www.google-analytics.com/mp/collect?measurement_id=${GA_MEASUREMENT_ID}&api_secret=${GA_API_SECRET}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      }
    );

    if (!response.ok) {
      console.error('[GA4] Measurement Protocol error:', response.status, await response.text());
    }
  } catch (error) {
    console.error('[GA4] Measurement Protocol request failed:', error);
  }
}
