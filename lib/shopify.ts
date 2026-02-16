/**
 * Shopify Storefront API client (with optional Admin fallback for catalog).
 * Uses env: NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN, SHOPIFY_STOREFRONT_ACCESS_TOKEN
 */

import { ShopifyTokenError, TOKEN_GUIDANCE } from './shopify-errors';
import type {
  ProductsQueryResult,
  CollectionsQueryResult,
  CollectionByHandleResult,
  StorefrontProduct,
} from './types';

const API_VERSION = '2024-01';

const domain = () =>
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const storefrontToken = () => process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN;
const adminToken = () => process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
const dataMode = () => process.env.SHOPIFY_DATA_MODE || 'storefront';

function validateStorefrontToken(): void {
  const token = storefrontToken();
  if (!token) {
    throw new ShopifyTokenError(
      `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
      'MISSING'
    );
  }
  if (token.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
}

function getStorefrontConfig(): { domain: string; token: string } | null {
  const d = domain();
  const t = storefrontToken();
  if (!d || !t) return null;
  if (t.startsWith('shpss_')) return null; // Force error when used
  return { domain: d, token: t };
}

function getStorefrontUrl(): string {
  const d = domain();
  if (!d) throw new ShopifyTokenError(`Missing SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN. ${TOKEN_GUIDANCE.missing}`, 'MISSING');
  const config = getStorefrontConfig();
  if (!config) {
    if (storefrontToken()?.startsWith('shpss_')) {
      throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
    }
    throw new ShopifyTokenError(
      `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
      'MISSING'
    );
  }
  return `https://${config.domain}/api/${API_VERSION}/graphql.json`;
}

const FETCH_TIMEOUT_MS = 15000;

export async function storefrontFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const config = getStorefrontConfig();
  if (!config) {
    if (storefrontToken()?.startsWith('shpss_')) {
      throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
    }
    throw new ShopifyTokenError(
      `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
      'MISSING'
    );
  }
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const res = await fetch(getStorefrontUrl(), {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Storefront-Access-Token': config.token,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (res.status === 401 || res.status === 403) {
    throw new ShopifyTokenError(
      'Storefront token invalid or wrong type. You likely pasted an Admin token or app secret. Get the correct token from Custom App > Storefront API integration.',
      'INVALID'
    );
  }
  if (!res.ok) {
    throw new Error(`Storefront API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  }
  return json.data as T;
}

// --- Admin API fallback (catalog only, no cart/checkout) ---
async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const d = domain();
  const t = adminToken();
  if (!d || !t) throw new Error('Admin fallback requires SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN');
  const url = `https://${d}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Shopify-Access-Token': t,
    },
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
  });
  if (!res.ok) throw new Error(`Admin API error: ${res.status} ${res.statusText}`);
  const json = await res.json();
  if (json.errors?.length) throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  return json.data as T;
}

const ADMIN_PRODUCTS = `
  query Products($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage { url altText width height }
          images(first: 10) {
            edges { node { url altText width height } }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                availableForSale
                price
                selectedOptions { name value }
              }
            }
          }
          status
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const ADMIN_COLLECTIONS = `
  query Collections($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          image { url altText width height }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const ADMIN_COLLECTION_BY_HANDLE = `
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      image { url altText width height }
      products(first: $first) {
        edges {
          node {
            id
            handle
            title
            description
            featuredImage { url altText width height }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price
                  selectedOptions { name value }
                }
              }
            }
            status
          }
        }
        pageInfo { hasNextPage endCursor }
      }
    }
  }
`;

const ADMIN_PRODUCT_BY_HANDLE = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      featuredImage { url altText width height }
      images(first: 10) {
        edges { node { url altText width height } }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price
            selectedOptions { name value }
          }
        }
      }
      status
    }
  }
`;

function mapAdminPrice(p: { amount: string; currencyCode: string } | string): { amount: string; currencyCode: string } {
  if (typeof p === 'string') {
    return { amount: p, currencyCode: 'GBP' };
  }
  return { amount: String(p.amount), currencyCode: p.currencyCode || 'GBP' };
}

function mapAdminProduct(adminNode: {
  id: string;
  handle: string;
  title: string;
  description: string;
  featuredImage?: { url: string; altText?: string; width?: number; height?: number } | null;
  images?: { edges: { node: { url: string; altText?: string; width?: number; height?: number } }[] };
  variants?: { edges: { node: { id: string; title: string; availableForSale: boolean; price: string | { amount: string; currencyCode: string }; selectedOptions?: { name: string; value: string }[] } }[] };
  status?: string;
}): StorefrontProduct {
  const vEdges = adminNode.variants?.edges || [];
  return {
    id: adminNode.id,
    handle: adminNode.handle,
    title: adminNode.title,
    description: adminNode.description || '',
    featuredImage: adminNode.featuredImage ? { url: adminNode.featuredImage.url, altText: adminNode.featuredImage.altText ?? null, width: adminNode.featuredImage.width || 0, height: adminNode.featuredImage.height || 0 } : null,
    images: adminNode.images ? {
      edges: adminNode.images.edges.map((e) => ({
        node: {
          url: e.node.url,
          altText: e.node.altText ?? null,
          width: e.node.width ?? 0,
          height: e.node.height ?? 0,
        },
      })),
    } : { edges: [] },
    variants: {
      edges: vEdges.map((e) => ({
        node: {
          id: e.node.id,
          title: e.node.title,
          availableForSale: e.node.availableForSale ?? false,
          price: mapAdminPrice(e.node.price as { amount: string; currencyCode: string }),
          selectedOptions: e.node.selectedOptions || [],
        },
      })),
    },
    availableForSale: adminNode.status === 'ACTIVE',
  };
}

function useAdminFallback(): boolean {
  return dataMode() === 'admin' || (!getStorefrontConfig() && !!adminToken());
}

// --- Public API ---

export async function getProducts(first = 12): Promise<ProductsQueryResult> {
  if (storefrontToken()?.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
  if (useAdminFallback()) {
    const data = await adminFetch<{ products: { edges: { node: unknown }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(ADMIN_PRODUCTS, { first });
    return {
      products: {
        edges: data.products.edges.map((e) => ({ node: mapAdminProduct(e.node as Parameters<typeof mapAdminProduct>[0]) })),
        pageInfo: data.products.pageInfo,
      },
    };
  }
  if (!getStorefrontConfig()) {
    if (domain() && !storefrontToken()) {
      throw new ShopifyTokenError(
        `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
        'MISSING'
      );
    }
    return { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
  }
  return storefrontFetch<ProductsQueryResult>(PRODUCTS_FIRST_PAGE, { first });
}

const PRODUCTS_FIRST_PAGE = `
  query ProductsFirst($first: Int!) {
    products(first: $first) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            url
            altText
            width
            height
          }
          images(first: 10) {
            edges {
              node {
                url
                altText
                width
                height
              }
            }
          }
          variants(first: 20) {
            edges {
              node {
                id
                title
                availableForSale
                price {
                  amount
                  currencyCode
                }
                selectedOptions {
                  name
                  value
                }
              }
            }
          }
          availableForSale
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const PRODUCTS_SEARCH = `
  query ProductsSearch($first: Int!, $query: String!) {
    products(first: $first, query: $query) {
      edges {
        node {
          id
          handle
          title
          description
          featuredImage {
            url
            altText
            width
            height
          }
          variants(first: 1) {
            edges {
              node {
                id
                price {
                  amount
                  currencyCode
                }
              }
            }
          }
          availableForSale
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

const COLLECTIONS_FIRST_PAGE = `
  query CollectionsFirst($first: Int!) {
    collections(first: $first) {
      edges {
        node {
          id
          handle
          title
          image {
            url
            altText
            width
            height
          }
          products(first: 0) {
            pageInfo { hasNextPage endCursor }
          }
        }
      }
      pageInfo {
        hasNextPage
        endCursor
      }
    }
  }
`;

export async function getCollections(first = 10): Promise<CollectionsQueryResult> {
  if (storefrontToken()?.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
  if (useAdminFallback()) {
    const data = await adminFetch<{ collections: { edges: { node: { id: string; handle: string; title: string; image?: { url: string; altText?: string; width?: number; height?: number } | null } }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(ADMIN_COLLECTIONS, { first });
    return {
      collections: {
        edges: data.collections.edges.map((e) => ({
          node: {
            ...e.node,
            image: e.node.image ? { url: e.node.image.url, altText: e.node.image.altText ?? null, width: e.node.image.width || 0, height: e.node.image.height || 0 } : null,
          },
        })),
        pageInfo: data.collections.pageInfo,
      },
    };
  }
  if (!getStorefrontConfig()) {
    if (domain() && !storefrontToken()) {
      throw new ShopifyTokenError(
        `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
        'MISSING'
      );
    }
    return { collections: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
  }
  return storefrontFetch<CollectionsQueryResult>(COLLECTIONS_FIRST_PAGE, { first });
}

export async function searchProducts(query: string, first = 24): Promise<ProductsQueryResult> {
  if (storefrontToken()?.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
  if (!getStorefrontConfig()) {
    return { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
  }
  const trimmed = String(query || '').trim();
  if (!trimmed) {
    return { products: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
  }
  return storefrontFetch<ProductsQueryResult>(PRODUCTS_SEARCH, { first, query: trimmed });
}

export type CollectionSortKey = 'PRICE' | 'CREATED' | 'BEST_SELLING' | 'TITLE' | 'MANUAL' | 'COLLECTION_DEFAULT';

const COLLECTION_BY_HANDLE = `
  query CollectionByHandle($handle: String!, $firstProducts: Int!, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
    collection(handle: $handle) {
      id
      handle
      title
      description
      image {
        url
        altText
        width
        height
      }
      products(first: $firstProducts, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
            id
            handle
            title
            description
            featuredImage {
              url
              altText
              width
              height
            }
            images(first: 5) {
              edges {
                node {
                  url
                  altText
                  width
                  height
                }
              }
            }
            variants(first: 20) {
              edges {
                node {
                  id
                  title
                  availableForSale
                  price {
                    amount
                    currencyCode
                  }
                  selectedOptions { name value }
                }
              }
            }
            availableForSale
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }
  }
`;

export async function getCollectionByHandle(
  handle: string,
  firstProducts = 24,
  sortKey?: CollectionSortKey,
  reverse?: boolean
): Promise<CollectionByHandleResult> {
  if (useAdminFallback()) {
    const data = await adminFetch<{ collection: { id: string; handle: string; title: string; descriptionHtml?: string | null; image?: { url: string; altText?: string; width?: number; height?: number } | null; products: { edges: { node: unknown }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null }>(ADMIN_COLLECTION_BY_HANDLE, { handle, first: firstProducts });
    if (!data.collection) return { collection: null };
    return {
      collection: {
        id: data.collection.id,
        handle: data.collection.handle,
        title: data.collection.title,
        description: data.collection.descriptionHtml ?? null,
        image: data.collection.image ? { url: data.collection.image.url, altText: data.collection.image.altText ?? null, width: data.collection.image.width || 0, height: data.collection.image.height || 0 } : null,
        products: {
          edges: data.collection.products.edges.map((e) => ({ node: mapAdminProduct(e.node as Parameters<typeof mapAdminProduct>[0]) })),
          pageInfo: data.collection.products.pageInfo,
        },
      },
    };
  }
  if (!getStorefrontConfig()) {
    return { collection: null };
  }
  return storefrontFetch<CollectionByHandleResult>(COLLECTION_BY_HANDLE, {
    handle,
    firstProducts,
    sortKey: sortKey ?? 'COLLECTION_DEFAULT',
    reverse: reverse ?? false,
  });
}

export interface ProductByHandleResult {
  product: StorefrontProduct | null;
}

const PRODUCT_BY_HANDLE = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      handle
      title
      description
      tags
      featuredImage {
        url
        altText
        width
        height
      }
      images(first: 10) {
        edges {
          node {
            url
            altText
            width
            height
          }
        }
      }
      variants(first: 50) {
        edges {
          node {
            id
            title
            availableForSale
            price {
              amount
              currencyCode
            }
            selectedOptions {
              name
              value
            }
          }
        }
      }
      availableForSale
    }
  }
`;

export async function getProductByHandle(handle: string): Promise<ProductByHandleResult> {
  if (useAdminFallback()) {
    const data = await adminFetch<{ product: Parameters<typeof mapAdminProduct>[0] | null }>(ADMIN_PRODUCT_BY_HANDLE, { handle });
    return { product: data.product ? mapAdminProduct(data.product) : null };
  }
  if (!getStorefrontConfig()) {
    return { product: null };
  }
  return storefrontFetch<ProductByHandleResult>(PRODUCT_BY_HANDLE, { handle });
}

export { ShopifyTokenError, TOKEN_GUIDANCE };
