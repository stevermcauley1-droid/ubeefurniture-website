'use client';

import { useState } from 'react';
import { addToCart, getCartIdFromCookie } from '@/app/actions/cart';
import { trackAddToCart } from '@/lib/analytics';

interface AddToCartButtonProps {
  variantId: string;
  quantity?: number;
  label?: string;
  redirectToCart?: boolean;
  disabled?: boolean;
  /** For GA4 add_to_cart event */
  productId?: string;
  productName?: string;
  price?: number;
  currency?: string;
}

export function AddToCartButton({
  variantId,
  quantity = 1,
  label = 'Add to cart',
  redirectToCart = true,
  disabled = false,
  productId,
  productName,
  price,
  currency,
}: AddToCartButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const cartId = await getCartIdFromCookie();
      const result = await addToCart(variantId, quantity, cartId);
      if (!result.success) {
        setError(result.error ?? 'Could not add to cart');
        return;
      }
      if (productId && productName != null && price != null && currency) {
        trackAddToCart({ id: productId, name: productName, price, currency, quantity });
      }
      if (redirectToCart && result.cartId) {
        window.location.href = '/cart';
        return;
      }
      if (result.checkoutUrl && !redirectToCart) {
        window.location.href = result.checkoutUrl;
        return;
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      <button type="submit" disabled={loading || disabled} style={{ padding: '0.5rem 1rem', cursor: loading || disabled ? 'not-allowed' : 'pointer' }}>
        {loading ? 'Adding…' : label}
      </button>
      {error && <p style={{ color: 'crimson', marginTop: '0.25rem', fontSize: '0.875rem' }}>{error}</p>}
    </form>
  );
}
