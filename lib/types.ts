/**
 * Typed shapes for Shopify Storefront API responses.
 * Align with Storefront API 2024-01; extend as needed for metafields/variants.
 */

export interface StorefrontImage {
  url: string;
  altText: string | null;
  width: number;
  height: number;
}

export interface StorefrontProductVariant {
  id: string;
  title: string;
  availableForSale: boolean;
  price: {
    amount: string;
    currencyCode: string;
  };
  selectedOptions: { name: string; value: string }[];
}

export interface StorefrontProduct {
  id: string;
  handle: string;
  title: string;
  description: string;
  tags?: string[];
  featuredImage: StorefrontImage | null;
  images: { edges: { node: StorefrontImage }[] };
  variants: { edges: { node: StorefrontProductVariant }[] };
  availableForSale: boolean;
}

export interface StorefrontCollection {
  id: string;
  handle: string;
  title: string;
  image: StorefrontImage | null;
  products: {
    edges: { node: StorefrontProduct }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export interface ProductsQueryResult {
  products: {
    edges: { node: StorefrontProduct }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export interface CollectionsQueryResult {
  collections: {
    edges: { node: Omit<StorefrontCollection, 'products'> }[];
    pageInfo: { hasNextPage: boolean; endCursor: string | null };
  };
}

export interface CollectionByHandleResult {
  collection: StorefrontCollection | null;
}
