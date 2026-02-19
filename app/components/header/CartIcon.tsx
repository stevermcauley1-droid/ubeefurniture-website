'use client';

import Link from 'next/link';

interface CartIconProps {
  itemCount?: number;
}

export function CartIcon({ itemCount }: CartIconProps) {
  return (
    <Link href="/cart" className="relative p-2 text-gray-700 hover:text-gray-900 transition-colors" aria-label={`Shopping cart${itemCount ? ` with ${itemCount} item${itemCount !== 1 ? 's' : ''}` : ''}`}>
      <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
      {itemCount !== undefined && itemCount > 0 && (
        <span className="absolute -top-1 -right-1 flex items-center justify-center w-5 h-5 text-xs font-bold text-white bg-[var(--ubee-yellow)] rounded-full" aria-hidden="true">
          {itemCount > 99 ? '99+' : itemCount}
        </span>
      )}
    </Link>
  );
}
