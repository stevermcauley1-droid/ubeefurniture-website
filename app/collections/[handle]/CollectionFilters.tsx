'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useTransition } from 'react';

interface CollectionFiltersProps {
  handle: string;
  products: Array<{
    id: string;
    variants?: { edges: Array<{ node: { price: { amount: string }; availableForSale: boolean } }> };
    tags?: string[];
  }>;
  onMobileClose?: () => void;
}

export function CollectionFilters({ handle, products, onMobileClose }: CollectionFiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const minPrice = searchParams.get('minPrice') ?? '';
  const maxPrice = searchParams.get('maxPrice') ?? '';
  const availability = searchParams.get('availability') ?? 'all';
  const tagFilter = searchParams.get('tag') ?? '';

  // Extract unique tags from products
  const availableTags = Array.from(
    new Set(products.flatMap((p) => p.tags ?? []).filter(Boolean))
  ).sort();

  // Calculate price range from products
  const prices = products
    .flatMap((p) => p.variants?.edges.map((e) => parseFloat(e.node.price.amount)) ?? [])
    .filter((p) => !isNaN(p));
  const minProductPrice = prices.length > 0 ? Math.min(...prices) : 0;
  const maxProductPrice = prices.length > 0 ? Math.max(...prices) : 1000;

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        if (!value || value === 'all' || value === '') {
          next.delete(key);
        } else {
          next.set(key, value);
        }
      });
      startTransition(() => {
        router.push(`/collections/${handle}?${next.toString()}`);
        onMobileClose?.();
      });
    },
    [router, searchParams, handle, onMobileClose]
  );

  return (
    <div className="space-y-6">
      {/* Price Range */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ubee-black)] mb-3">Price Range</h3>
        <div className="flex gap-2 items-center">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => updateParams({ minPrice: e.target.value })}
            min={0}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)]"
          />
          <span className="text-gray-500">to</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => updateParams({ maxPrice: e.target.value })}
            min={0}
            className="w-24 px-3 py-2 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)]"
          />
        </div>
        <p className="text-xs text-[var(--ubee-gray)] mt-2">
          Range: {minProductPrice.toFixed(0)} - {maxProductPrice.toFixed(0)}
        </p>
      </div>

      {/* Availability */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--ubee-black)] mb-3">Availability</h3>
        <div className="space-y-2">
          {[
            { value: 'all', label: 'All products' },
            { value: 'in-stock', label: 'In stock only' },
          ].map((opt) => (
            <label key={opt.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="availability"
                value={opt.value}
                checked={availability === opt.value}
                onChange={(e) => updateParams({ availability: e.target.value })}
                className="w-4 h-4 text-[var(--ubee-yellow)] focus:ring-[var(--ubee-yellow)]"
              />
              <span className="text-sm text-[var(--ubee-gray)]">{opt.label}</span>
            </label>
          ))}
        </div>
      </div>

      {/* Tags */}
      {availableTags.length > 0 && (
        <div>
          <h3 className="text-sm font-semibold text-[var(--ubee-black)] mb-3">Tags</h3>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="radio"
                name="tag"
                value=""
                checked={tagFilter === ''}
                onChange={(e) => updateParams({ tag: e.target.value })}
                className="w-4 h-4 text-[var(--ubee-yellow)] focus:ring-[var(--ubee-yellow)]"
              />
              <span className="text-sm text-[var(--ubee-gray)]">All tags</span>
            </label>
            {availableTags.map((tag) => (
              <label key={tag} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="tag"
                  value={tag}
                  checked={tagFilter === tag}
                  onChange={(e) => updateParams({ tag: e.target.value })}
                  className="w-4 h-4 text-[var(--ubee-yellow)] focus:ring-[var(--ubee-yellow)]"
                />
                <span className="text-sm text-[var(--ubee-gray)] capitalize">{tag}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {/* Clear filters */}
      {(minPrice || maxPrice || availability !== 'all' || tagFilter) && (
        <button
          type="button"
          onClick={() => updateParams({ minPrice: '', maxPrice: '', availability: 'all', tag: '' })}
          className="w-full px-4 py-2 text-sm font-medium text-[var(--ubee-black)] border border-gray-300 rounded hover:bg-gray-50 transition-colors"
        >
          Clear all filters
        </button>
      )}
    </div>
  );
}
