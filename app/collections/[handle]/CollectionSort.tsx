'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

interface Option {
  value: string;
  label: string;
}

interface CollectionSortProps {
  handle: string;
  currentSort: string;
  options: Option[];
}

export function CollectionSort({ handle, currentSort, options }: CollectionSortProps) {
  const searchParams = useSearchParams();

  const buildUrl = (sortValue: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (sortValue === 'default') {
      params.delete('sort');
    } else {
      params.set('sort', sortValue);
    }
    const query = params.toString();
    return `/collections/${handle}${query ? `?${query}` : ''}`;
  };

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <span className="text-sm font-semibold text-[var(--ubee-black)]">Sort:</span>
      {options.map((opt) => (
        <Link
          key={opt.value}
          href={buildUrl(opt.value)}
          className={`px-3 py-1.5 text-sm rounded transition-colors ${
            currentSort === opt.value
              ? 'bg-[var(--ubee-black)] text-white'
              : 'bg-gray-100 text-[var(--ubee-black)] hover:bg-gray-200'
          }`}
        >
          {opt.label}
        </Link>
      ))}
    </div>
  );
}
