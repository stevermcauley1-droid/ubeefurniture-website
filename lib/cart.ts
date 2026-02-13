/**
 * Cart operations via Shopify Storefront API.
 * Cart ID is stored in cookie; checkout handoff = redirect to cart.checkoutUrl.
 */

import { storefrontFetch } from './shopify';

const CART_FRAGMENT = `
  fragment CartFields on Cart {
    id
    checkoutUrl
    lines(first: 50) {
      edges {
        node {
          id
          quantity
          merchandise {
            ... on ProductVariant {
              id
              title
              price {
                amount
                currencyCode
              }
              product {
                id
                handle
                title
                featuredImage {
                  url
                  altText
                  width
                  height
                }
              }
            }
          }
        }
      }
    }
  }
`;

const CART_CREATE = `
  mutation cartCreate($input: CartInput) {
    cartCreate(input: $input) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_LINES_ADD = `
  mutation cartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
    cartLinesAdd(cartId: $cartId, lines: $lines) {
      cart { ...CartFields }
      userErrors { field message }
    }
  }
  ${CART_FRAGMENT}
`;

const CART_QUERY = `
  query getCart($cartId: ID!) {
    cart(id: $cartId) {
      ...CartFields
    }
  }
  ${CART_FRAGMENT}
`;

export interface CartLine {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: { amount: string; currencyCode: string };
    product: {
      id: string;
      handle: string;
      title: string;
      featuredImage: { url: string; altText: string | null; width: number; height: number } | null;
    };
  };
}

export interface Cart {
  id: string;
  checkoutUrl: string;
  lines: { edges: { node: CartLine }[] };
}

interface CartCreatePayload {
  cartCreate: { cart: Cart | null; userErrors: { field: string[]; message: string }[] };
}

interface CartLinesAddPayload {
  cartLinesAdd: { cart: Cart | null; userErrors: { field: string[]; message: string }[] };
}

interface CartQueryPayload {
  cart: Cart | null;
}

export async function cartCreate(lines?: { merchandiseId: string; quantity: number }[]): Promise<Cart | null> {
  const input = lines?.length ? { lines: lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity })) } : {};
  const data = await storefrontFetch<CartCreatePayload>(CART_CREATE, { input });
  const { cart, userErrors } = data.cartCreate;
  if (userErrors?.length) throw new Error(userErrors.map((e) => e.message).join('; '));
  return cart ?? null;
}

export async function cartLinesAdd(
  cartId: string,
  lines: { merchandiseId: string; quantity: number }[]
): Promise<Cart | null> {
  const data = await storefrontFetch<CartLinesAddPayload>(CART_LINES_ADD, {
    cartId,
    lines: lines.map((l) => ({ merchandiseId: l.merchandiseId, quantity: l.quantity })),
  });
  const { cart, userErrors } = data.cartLinesAdd;
  if (userErrors?.length) throw new Error(userErrors.map((e) => e.message).join('; '));
  return cart ?? null;
}

export async function getCart(cartId: string): Promise<Cart | null> {
  const data = await storefrontFetch<CartQueryPayload>(CART_QUERY, { cartId });
  return data.cart ?? null;
}

export const CART_COOKIE_NAME = 'ubeefurniture_cart_id';
