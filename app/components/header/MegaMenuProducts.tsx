'use client';

import Link from 'next/link';

interface Collection {
  handle: string;
  title: string;
}

interface MegaMenuProductsProps {
  collections: Collection[];
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenuProducts({ collections, isOpen, onClose }: MegaMenuProductsProps) {
  if (!isOpen) return null;
  const maxPerColumn = Math.max(1, Math.ceil(collections.length / 3));
  const columns = [
    collections.slice(0, maxPerColumn),
    collections.slice(maxPerColumn, maxPerColumn * 2),
    collections.slice(maxPerColumn * 2),
  ].filter((col) => col.length > 0);

  return (
    <div className="absolute left-0 top-full w-full bg-white border-t border-gray-200 shadow-lg z-50" onMouseLeave={onClose} role="menu" aria-label="Products menu">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {columns.map((column, colIndex) => (
            <div key={colIndex}>
              {column.map((c) => (
                <Link key={c.handle} href={`/collections/${c.handle}`} className="block py-2 text-gray-700 hover:text-[var(--ubee-black)] hover:underline" role="menuitem" onClick={onClose}>{c.title}</Link>
              ))}
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/collections" className="font-semibold text-[var(--ubee-black)] hover:text-[var(--ubee-yellow-hover)] hover:underline" onClick={onClose}>View All Collections →</Link>
        </div>
      </div>
    </div>
  );
}
