'use server';

import { cookies } from 'next/headers';
import { cartCreate, cartLinesAdd, getCart, CART_COOKIE_NAME } from '@/lib/cart';
import { ShopifyTokenError } from '@/lib/shopify';

export interface AddToCartResult {
  success: boolean;
  cartId: string | null;
  checkoutUrl: string | null;
  error?: string;
}

/**
 * Add a variant to the cart. Creates a new cart if none exists.
 * Client should store returned cartId in cookie and optionally redirect to /cart or checkoutUrl.
 */
export async function addToCart(
  variantId: string,
  quantity: number,
  existingCartId: string | null
): Promise<AddToCartResult> {
  try {
    const line = { merchandiseId: variantId, quantity };
    let cart;
    if (existingCartId) {
      cart = await cartLinesAdd(existingCartId, [line]);
    } else {
      cart = await cartCreate([line]);
    }
    if (!cart) return { success: false, cartId: null, checkoutUrl: null, error: 'Failed to update cart' };
    const cookieStore = await cookies();
    cookieStore.set(CART_COOKIE_NAME, cart.id, { path: '/', maxAge: 60 * 60 * 24 * 14, httpOnly: true, sameSite: 'lax' });
    return { success: true, cartId: cart.id, checkoutUrl: cart.checkoutUrl };
  } catch (err) {
    if (err instanceof ShopifyTokenError) {
      return {
        success: false,
        cartId: null,
        checkoutUrl: null,
        error: 'Cart requires Storefront API token. Add SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env. Run: npm run shopify:smoke',
      };
    }
    const message = err instanceof Error ? err.message : 'Unknown error';
    return { success: false, cartId: null, checkoutUrl: null, error: message };
  }
}

/**
 * Get current cart ID from cookie (for client to pass into addToCart or for cart page).
 */
export async function getCartIdFromCookie(): Promise<string | null> {
  const cookieStore = await cookies();
  return cookieStore.get(CART_COOKIE_NAME)?.value ?? null;
}

/**
 * Fetch full cart by ID. Used by cart page.
 */
export async function getCartForPage(cartId: string | null) {
  if (!cartId) return null;
  try {
    return await getCart(cartId);
  } catch {
    return null;
  }
}
