import Link from 'next/link';

export interface CollectionQueryState {
  sort?: string;
  minPrice?: string;
  maxPrice?: string;
  availability?: string;
  tag?: string;
  after?: string;
}

function buildHref(handle: string, state: CollectionQueryState, patch: Partial<CollectionQueryState>) {
  const next: Record<string, string> = {};
  const merged = { ...state, ...patch };
  for (const [k, v] of Object.entries(merged)) {
    if (v === undefined || v === '') continue;
    next[k] = v;
  }
  const p = new URLSearchParams(next);
  const q = p.toString();
  return `/collections/${handle}${q ? `?${q}` : ''}`;
}

interface CollectionPaginationProps {
  handle: string;
  query: CollectionQueryState;
  hasNextPage: boolean;
  endCursor: string | null;
}

/**
 * Cursor-based next page (Shopify). "First page" clears `after` (browser back covers deeper history).
 */
export function CollectionPagination({ handle, query, hasNextPage, endCursor }: CollectionPaginationProps) {
  const onLaterPage = Boolean(query.after);
  if (!hasNextPage && !onLaterPage) return null;

  return (
    <nav className="mt-8 flex flex-wrap items-center gap-3 border-t border-gray-200 pt-6" aria-label="Collection pagination">
      {onLaterPage && (
        <Link
          href={buildHref(handle, query, { after: undefined })}
          className="px-4 py-2 text-sm font-medium rounded-md border border-gray-300 text-[var(--ubee-black)] hover:bg-gray-50 transition-colors"
        >
          First page
        </Link>
      )}
      {hasNextPage && endCursor && (
        <Link
          href={buildHref(handle, query, { after: endCursor })}
          className="px-4 py-2 text-sm font-semibold rounded-md bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] transition-colors"
        >
          Next page
        </Link>
      )}
    </nav>
  );
}
