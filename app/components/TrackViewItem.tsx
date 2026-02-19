'use client';

import { useEffect, useRef } from 'react';
import { trackViewItem } from '@/lib/analytics';

interface TrackViewItemProps {
  productId: string;
  productName: string;
  price: number;
  currency: string;
  category?: string;
}

/**
 * Track view_item event on product page.
 * Fires once only on first mount (prevents double-firing on re-render).
 * Uses useRef to ensure single execution per product.id.
 */
export function TrackViewItem({ productId, productName, price, currency, category }: TrackViewItemProps) {
  const hasTracked = useRef<string | null>(null);

  useEffect(() => {
    // Only fire once per product.id (prevents double-firing on re-render)
    if (hasTracked.current === productId) {
      return;
    }

    hasTracked.current = productId;

    trackViewItem({
      id: productId,
      name: productName,
      price,
      currency,
      quantity: 1,
      category,
    });
  }, [productId, productName, price, currency, category]);

  return null;
}
