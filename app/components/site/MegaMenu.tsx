'use client';

import { useEffect, useRef } from 'react';
import Link from 'next/link';
import {
  PRODUCT_CATEGORIES,
  LANDLORD_HUB_ITEMS,
  LANDLORD_CATALOGUE_HREF,
} from './navData';

type MegaMenuVariant = 'products' | 'landlord';

interface MegaMenuProps {
  variant: MegaMenuVariant;
  isOpen: boolean;
  onClose: () => void;
  anchorRef: React.RefObject<HTMLElement | null>;
}

export function MegaMenu({ variant, isOpen, onClose, anchorRef }: MegaMenuProps) {
  const panelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      if (
        anchorRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      )
        return;
      onClose();
    };
    document.addEventListener('keydown', handleEscape);
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen, onClose, anchorRef]);

  if (!isOpen) return null;

  return (
    <div
      ref={panelRef}
      className="absolute left-0 top-full w-full bg-white border-t border-gray-200 shadow-lg z-50"
      onMouseLeave={onClose}
      role="menu"
      aria-label={variant === 'products' ? 'Products menu' : 'Landlord Hub menu'}
    >
      <div className="max-w-7xl mx-auto px-6 py-8">
        {variant === 'products' && (
          <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-7 gap-6">
            {PRODUCT_CATEGORIES.map((cat) => (
              <Link
                key={cat.href}
                href={cat.href}
                className="block py-2 text-gray-700 hover:text-[var(--ubee-black)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded"
                role="menuitem"
                onClick={onClose}
              >
                {cat.label}
              </Link>
            ))}
          </div>
        )}
        {variant === 'landlord' && (
          <>
            <div className="mb-6">
              <Link
                href={LANDLORD_CATALOGUE_HREF}
                className="inline-block px-5 py-2.5 bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] font-semibold rounded focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[var(--ubee-yellow)]"
                onClick={onClose}
              >
                Download Landlord Catalogue (PDF)
              </Link>
            </div>
            <ul className="space-y-2">
              {LANDLORD_HUB_ITEMS.map((item) => (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    className="block py-1.5 text-gray-700 hover:text-[var(--ubee-black)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded"
                    role="menuitem"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </>
        )}
        <div className="mt-6 pt-6 border-t border-gray-200">
          {variant === 'products' && (
            <Link
              href="/collections"
              className="font-semibold text-[var(--ubee-black)] hover:text-[var(--ubee-yellow-hover)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded"
              onClick={onClose}
            >
              View All Collections →
            </Link>
          )}
          {variant === 'landlord' && (
            <Link
              href="/landlords"
              className="font-semibold text-[var(--ubee-black)] hover:text-[var(--ubee-yellow-hover)] hover:underline focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded"
              onClick={onClose}
            >
              View Landlord Hub →
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
