import { getCollectionByHandle } from '../shopify';
import type { CollectionSortKey } from '../shopify';
import type { CollectionByHandleResult } from '../types';

/**
 * Load a collection by handle via Storefront API (`collectionByHandle` query).
 */
export async function getCollection(
  handle: string,
  firstProducts = 48,
  sortKey?: CollectionSortKey,
  reverse?: boolean,
  after?: string | null
): Promise<CollectionByHandleResult> {
  return getCollectionByHandle(handle, firstProducts, sortKey, reverse, after);
}
