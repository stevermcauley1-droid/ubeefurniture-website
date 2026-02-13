'use client';

import { trackBeginCheckout } from '@/lib/analytics';

interface CheckoutButtonProps {
  checkoutUrl: string;
  cartValue?: number;
  cartCurrency?: string;
  cartItems?: { id: string; name: string; price: number; quantity: number }[];
}

export function CheckoutButton({ checkoutUrl, cartValue = 0, cartCurrency = 'GBP', cartItems = [] }: CheckoutButtonProps) {
  function handleClick() {
    if (cartItems.length > 0) {
      trackBeginCheckout(cartValue, cartCurrency, cartItems);
    }
  }
  return (
    <a
      href={checkoutUrl}
      onClick={handleClick}
      style={{
        display: 'inline-block',
        padding: '0.75rem 1.5rem',
        background: '#000',
        color: '#fff',
        borderRadius: 4,
        fontWeight: 600,
      }}
    >
      Proceed to checkout
    </a>
  );
}
