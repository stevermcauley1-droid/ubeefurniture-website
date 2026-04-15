/**
 * Shopify Storefront API client (with optional Admin fallback for catalog).
 * Uses env: SHOPIFY_STORE_DOMAIN or NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
 * SHOPIFY_STOREFRONT_ACCESS_TOKEN (or SHOPIFY_STOREFRONT_TOKEN as fallback).
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
/** Prefer SHOPIFY_STOREFRONT_ACCESS_TOKEN; fallback to SHOPIFY_STOREFRONT_TOKEN for compatibility. */
const storefrontToken = () =>
  process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN || process.env.SHOPIFY_STOREFRONT_TOKEN;
const adminToken = () =>
  process.env.SHOPIFY_ADMIN_ACCESS_TOKEN || process.env.SHOPIFY_ADMIN_API_TOKEN;
const dataMode = () => process.env.SHOPIFY_DATA_MODE || 'storefront';

function validateStorefrontToken(): void {
  const token = storefrontToken();
  if (!token) {
    throw new ShopifyTokenError(
      `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
      'MISSING'
    );
  }
  // shpss_ = app secret (wrong). shpat_ can be Headless Storefront private token (OK).
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

const FETCH_TIMEOUT_MS = 10000; // Reduced from 15s to 10s for faster failure

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
  // Private tokens (Headless shpat_...) use Shopify-Storefront-Private-Token; public use X-Shopify-Storefront-Access-Token
  const isPrivateToken = config.token.startsWith('shpat_');
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(isPrivateToken
      ? { 'Shopify-Storefront-Private-Token': config.token }
      : { 'X-Shopify-Storefront-Access-Token': config.token }),
  };
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const res = await fetch(getStorefrontUrl(), {
    method: 'POST',
    headers,
    body: JSON.stringify({ query, variables }),
    next: { revalidate: 60 },
    signal: controller.signal,
  });
  clearTimeout(timeoutId);
  if (res.status === 401 || res.status === 403) {
    throw new ShopifyTokenError(
      'Storefront token invalid or wrong type. Check token from Headless → Storefront API → Access tokens and correct scopes.',
      'INVALID'
    );
  }
  if (!res.ok) {
    throw new Error(`Storefront API error: ${res.status} ${res.statusText}`);
  }
  const json = await res.json();
  
  // Debug logging for collections queries
  if (query.includes('collections') || query.includes('Collections')) {
    console.log('[storefrontFetch] Collections query response:', {
      url: getStorefrontUrl(),
      status: res.status,
      hasErrors: !!json.errors?.length,
      errors: json.errors,
      dataKeys: json.data ? Object.keys(json.data) : null,
      collectionsCount: json.data?.collections?.edges?.length ?? 0,
    });
  }
  
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join('; '));
  }
  return json.data as T;
}

// --- Admin API fallback (catalog only, no cart/checkout) ---
async function adminFetch<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const d = domain();
  // Try to get admin token from Client Credentials Grant if available
  let t = adminToken();
  if (!t) {
    try {
      const { getAdminAccessToken } = await import('./shopify-auth');
      t = await getAdminAccessToken();
    } catch (e) {
      // If shopify-auth not available or fails, fall back to env var
    }
  }
  if (!d || !t) throw new Error('Admin fallback requires SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_ACCESS_TOKEN (or Client Credentials)');
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
          resourcePublicationsV2(first: 10) {
            edges {
              node {
                publication {
                  id
                  name
                }
              }
            }
          }
        }
      }
      pageInfo { hasNextPage endCursor }
    }
  }
`;

const ADMIN_COLLECTION_BY_HANDLE = `
  query Collection($handle: String!, $first: Int!, $after: String) {
    collection(handle: $handle) {
      id
      handle
      title
      descriptionHtml
      image { url altText width height }
      products(first: $first, after: $after) {
        edges {
          node {
            id
            handle
            title
            description
            tags
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
  tags?: string[];
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
    tags: Array.isArray(adminNode.tags) ? adminNode.tags : undefined,
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

async function hasAdminAccess(): Promise<boolean> {
  // Check for direct admin token
  if (adminToken()) return true;
  
  // Check for Client Credentials Grant (2026 method)
  try {
    const { getAdminAccessToken } = await import('./shopify-auth');
    await getAdminAccessToken(); // This will throw if credentials are missing
    return true;
  } catch {
    return false;
  }
}

function shouldUseAdminFallback(): boolean {
  return dataMode() === 'admin' || (!getStorefrontConfig() && !!adminToken());
}

// --- Public API ---

export async function getProducts(first = 12): Promise<ProductsQueryResult> {
  if (storefrontToken()?.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
  if (shouldUseAdminFallback()) {
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
  console.log('[getCollections] Starting fetch:', {
    first,
    hasStorefrontToken: !!storefrontToken(),
    tokenPrefix: storefrontToken()?.substring(0, 6),
    shouldUseAdminFallback: shouldUseAdminFallback(),
    hasStorefrontConfig: !!getStorefrontConfig(),
    domain: domain(),
  });
  
  if (storefrontToken()?.startsWith('shpss_')) {
    throw new ShopifyTokenError(TOKEN_GUIDANCE.wrongType, 'WRONG_TYPE');
  }
  
  // Try Storefront API first, but fall back to Admin API if collections aren't visible yet
  if (getStorefrontConfig()) {
    try {
      console.log('[getCollections] Using Storefront API');
      const result = await storefrontFetch<CollectionsQueryResult>(COLLECTIONS_FIRST_PAGE, { first });
      const collectionsCount = result.collections?.edges?.length ?? 0;
      console.log('[getCollections] Storefront API returned:', {
        collectionsCount,
        collections: result.collections?.edges?.map((e) => ({ id: e.node.id, handle: e.node.handle, title: e.node.title })) ?? [],
      });

      // If Storefront only returns the default "frontpage" collection, it usually means
      // Headless channel visibility hasn't propagated yet for those collections.
      // In that case, fall back to Admin so the UI still shows real collections.
      const edges = result.collections?.edges ?? [];
      const nonFrontpageEdges = edges.filter((e) => e.node.handle !== 'frontpage');
      if (nonFrontpageEdges.length === 0) {
        console.log('[getCollections] Storefront returned only frontpage; using Admin API fallback for collections list.');
      } else {
        return result;
      }
    } catch (e) {
      // If Storefront fails or only returns frontpage, try Admin API
      const hasAdmin = await hasAdminAccess();
      if (hasAdmin) {
        console.log('[getCollections] Falling back to Admin API');
      } else {
        throw e;
      }
    }
  }
  
  // Use Admin API fallback for collections if we have admin access
  const hasAdmin = await hasAdminAccess();
  if (shouldUseAdminFallback() || hasAdmin || adminToken()) {
    console.log('[getCollections] Using Admin API fallback');
    const data = await adminFetch<{ collections: { edges: { node: { id: string; handle: string; title: string; image?: { url: string; altText?: string; width?: number; height?: number } | null; resourcePublicationsV2?: { edges?: Array<{ node: { publication: { name: string } } }> } } }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } }>(ADMIN_COLLECTIONS, { first });
    
    // Filter to only collections published to Online Store (or any publication)
    const publishedCollections = data.collections.edges.filter((e) => {
      const pubs = e.node.resourcePublicationsV2?.edges || [];
      const publicationNames = pubs.map((p) => p.node.publication.name);
      const isPublished = pubs.length > 0;
      
      // Debug: Log publication status for each collection
      if (!isPublished) {
        console.log(`[getCollections] Collection "${e.node.title}" (${e.node.handle}) is NOT published`);
      } else {
        console.log(`[getCollections] Collection "${e.node.title}" (${e.node.handle}) published to:`, publicationNames.join(', '));
      }
      
      return isPublished; // Only include published collections
    });
    
    console.log('[getCollections] Admin API returned:', {
      totalCollections: data.collections?.edges?.length ?? 0,
      publishedCollections: publishedCollections.length,
      collections: publishedCollections.map((e) => {
        const pubs = e.node.resourcePublicationsV2?.edges || [];
        return {
          id: e.node.id,
          handle: e.node.handle,
          title: e.node.title,
          publications: pubs.map((p) => p.node.publication.name),
        };
      }) ?? [],
    });
    
    return {
      collections: {
        edges: publishedCollections.map((e) => ({
          node: {
            id: e.node.id,
            handle: e.node.handle,
            title: e.node.title,
            image: e.node.image ? { url: e.node.image.url, altText: e.node.image.altText ?? null, width: e.node.image.width || 0, height: e.node.image.height || 0 } : null,
          },
        })),
        pageInfo: data.collections.pageInfo,
      },
    };
  }
  
  if (!getStorefrontConfig()) {
    console.log('[getCollections] No Storefront config, returning empty');
    if (domain() && !storefrontToken()) {
      throw new ShopifyTokenError(
        `Missing SHOPIFY_STOREFRONT_ACCESS_TOKEN. ${TOKEN_GUIDANCE.missing}`,
        'MISSING'
      );
    }
    return { collections: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
  }
  
  // Should not reach here, but return empty as fallback
  return { collections: { edges: [], pageInfo: { hasNextPage: false, endCursor: null } } };
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
  query CollectionByHandle($handle: String!, $firstProducts: Int!, $after: String, $sortKey: ProductCollectionSortKeys, $reverse: Boolean) {
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
      products(first: $firstProducts, after: $after, sortKey: $sortKey, reverse: $reverse) {
        edges {
          node {
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
  reverse?: boolean,
  after?: string | null
): Promise<CollectionByHandleResult> {
  const cursor = after?.trim() || null;
  if (shouldUseAdminFallback()) {
    const data = await adminFetch<{ collection: { id: string; handle: string; title: string; descriptionHtml?: string | null; image?: { url: string; altText?: string; width?: number; height?: number } | null; products: { edges: { node: unknown }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } } } | null }>(ADMIN_COLLECTION_BY_HANDLE, { handle, first: firstProducts, after: cursor });
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
  try {
    const storefrontResult = await storefrontFetch<CollectionByHandleResult>(COLLECTION_BY_HANDLE, {
      handle,
      firstProducts,
      after: cursor,
      sortKey: sortKey ?? 'COLLECTION_DEFAULT',
      reverse: reverse ?? false,
    });
    if (storefrontResult.collection) return storefrontResult;

    // Storefront succeeded but collection is null -> try Admin.
    const hasAdmin = await hasAdminAccess();
    if (hasAdmin) {
      console.log(`[getCollectionByHandle] Storefront returned null for ${handle}; falling back to Admin.`);
      const data = await adminFetch<{
        collection: {
          id: string;
          handle: string;
          title: string;
          descriptionHtml?: string | null;
          image?: { url: string; altText?: string | null; width?: number; height?: number } | null;
          products: { edges: { node: unknown }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
        } | null;
      }>(ADMIN_COLLECTION_BY_HANDLE, { handle, first: firstProducts, after: cursor });
      if (!data.collection) return { collection: null };
      return {
        collection: {
          id: data.collection.id,
          handle: data.collection.handle,
          title: data.collection.title,
          description: data.collection.descriptionHtml ?? null,
          image: data.collection.image
            ? { url: data.collection.image.url, altText: data.collection.image.altText ?? null, width: data.collection.image.width || 0, height: data.collection.image.height || 0 }
            : null,
          products: {
            edges: data.collection.products.edges.map((e) => ({ node: mapAdminProduct(e.node as Parameters<typeof mapAdminProduct>[0]) })),
            pageInfo: data.collection.products.pageInfo,
          },
        },
      };
    }
    return storefrontResult;
  } catch (e) {
    // If Storefront can't see the collection yet, fall back to Admin so the page doesn't 404.
    const hasAdmin = await hasAdminAccess();
    if (hasAdmin) {
      console.log(`[getCollectionByHandle] Storefront failed for ${handle}; falling back to Admin.`);
      const data = await adminFetch<{
        collection: {
          id: string;
          handle: string;
          title: string;
          descriptionHtml?: string | null;
          image?: { url: string; altText?: string | null; width?: number; height?: number } | null;
          products: { edges: { node: unknown }[]; pageInfo: { hasNextPage: boolean; endCursor: string | null } };
        } | null;
      }>(ADMIN_COLLECTION_BY_HANDLE, { handle, first: firstProducts, after: cursor });
      if (!data.collection) return { collection: null };
      return {
        collection: {
          id: data.collection.id,
          handle: data.collection.handle,
          title: data.collection.title,
          description: data.collection.descriptionHtml ?? null,
          image: data.collection.image
            ? { url: data.collection.image.url, altText: data.collection.image.altText ?? null, width: data.collection.image.width || 0, height: data.collection.image.height || 0 }
            : null,
          products: {
            edges: data.collection.products.edges.map((e) => ({ node: mapAdminProduct(e.node as Parameters<typeof mapAdminProduct>[0]) })),
            pageInfo: data.collection.products.pageInfo,
          },
        },
      };
    }
    throw e;
  }
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
  if (shouldUseAdminFallback()) {
    const data = await adminFetch<{ product: Parameters<typeof mapAdminProduct>[0] | null }>(ADMIN_PRODUCT_BY_HANDLE, { handle });
    return { product: data.product ? mapAdminProduct(data.product) : null };
  }
  if (!getStorefrontConfig()) {
    return { product: null };
  }
  return storefrontFetch<ProductByHandleResult>(PRODUCT_BY_HANDLE, { handle });
}

export { ShopifyTokenError, TOKEN_GUIDANCE };
