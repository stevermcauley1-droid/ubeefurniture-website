'use client';

import { useEffect } from 'react';
import { trackViewItem } from '@/lib/analytics';

interface TrackViewItemProps {
  productId: string;
  productName: string;
  price: number;
  currency: string;
}

export function TrackViewItem({ productId, productName, price, currency }: TrackViewItemProps) {
  useEffect(() => {
    trackViewItem({
      id: productId,
      name: productName,
      price,
      currency,
      quantity: 1,
    });
  }, [productId, productName, price, currency]);
  return null;
}
