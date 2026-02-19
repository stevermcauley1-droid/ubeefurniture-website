'use client';

import { useSearchParams } from 'next/navigation';
import { useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/types';

interface CollectionProductsProps {
  products: StorefrontProduct[];
  handle: string;
}

export function CollectionProducts({ products, handle }: CollectionProductsProps) {
  const searchParams = useSearchParams();

  const filteredProducts = useMemo(() => {
    let filtered = [...products];

    // Price filter
    const minPrice = searchParams.get('minPrice');
    const maxPrice = searchParams.get('maxPrice');
    if (minPrice || maxPrice) {
      filtered = filtered.filter((p) => {
        const price = p.variants?.edges?.[0]?.node?.price;
        if (!price) return false;
        const amount = parseFloat(price.amount);
        if (minPrice && amount < parseFloat(minPrice)) return false;
        if (maxPrice && amount > parseFloat(maxPrice)) return false;
        return true;
      });
    }

    // Availability filter
    const availability = searchParams.get('availability');
    if (availability === 'in-stock') {
      filtered = filtered.filter((p) => {
        return p.variants?.edges.some((e) => e.node.availableForSale) ?? false;
      });
    }

    // Tag filter
    const tagFilter = searchParams.get('tag');
    if (tagFilter) {
      filtered = filtered.filter((p) => {
        return p.tags?.some((t) => t.toLowerCase() === tagFilter.toLowerCase()) ?? false;
      });
    }

    return filtered;
  }, [products, searchParams]);

  if (filteredProducts.length === 0) {
    return (
      <div className="py-12 text-center">
        <p className="text-[var(--ubee-gray)] mb-4">No products match your filters.</p>
        <Link
          href={`/collections/${handle}`}
          className="text-sm font-medium text-[var(--ubee-black)] hover:underline"
        >
          Clear filters
        </Link>
      </div>
    );
  }

  return (
    <>
      <div className="mb-4 text-sm text-[var(--ubee-gray)]">
        Showing {filteredProducts.length} {filteredProducts.length === 1 ? 'product' : 'products'}
      </div>
      <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 list-none p-0">
        {filteredProducts.map((p, i) => {
          const price = p.variants?.edges?.[0]?.node?.price;
          return (
            <li key={p.id} className="group">
              <Link href={`/products/${p.handle}`} className="block">
                <div className="relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2">
                  {p.featuredImage ? (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      fill
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                      priority={i < 8}
                      className="object-cover group-hover:opacity-90 transition-opacity"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                      No image
                    </div>
                  )}
                </div>
                <h3 className="font-semibold text-sm text-[var(--ubee-black)] mb-1 line-clamp-2">
                  {p.title}
                </h3>
                {price && (
                  <p className="text-sm text-[var(--ubee-gray)]">
                    {price.currencyCode} {price.amount}
                  </p>
                )}
                {p.variants?.edges.every((e) => !e.node.availableForSale) && (
                  <p className="text-xs text-red-600 mt-1">Sold out</p>
                )}
              </Link>
            </li>
          );
        })}
      </ul>
    </>
  );
}
