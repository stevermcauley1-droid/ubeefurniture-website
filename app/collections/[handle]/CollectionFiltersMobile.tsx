'use client';

import { useState } from 'react';
import { CollectionFilters } from './CollectionFilters';

interface CollectionFiltersMobileProps {
  handle: string;
  products: Array<{
    id: string;
    variants?: { edges: Array<{ node: { price: { amount: string }; availableForSale: boolean } }> };
    tags?: string[];
  }>;
}

export function CollectionFiltersMobile({ handle, products }: CollectionFiltersMobileProps) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="md:hidden w-full px-4 py-2 text-sm font-medium text-[var(--ubee-black)] border border-gray-300 rounded flex items-center justify-between"
      >
        <span>Filters</span>
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
        </svg>
      </button>

      {isOpen && (
        <>
          <div
            className="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-y-0 left-0 w-80 bg-white z-50 md:hidden overflow-y-auto p-6 shadow-xl">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-lg font-semibold text-[var(--ubee-black)]">Filters</h2>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="p-2 text-gray-500 hover:text-gray-700"
                aria-label="Close filters"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <CollectionFilters handle={handle} products={products} onMobileClose={() => setIsOpen(false)} />
          </div>
        </>
      )}
    </>
  );
}
