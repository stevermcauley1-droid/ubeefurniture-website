'use client';

import Link from 'next/link';
import { LANDLORD_MENU } from './landlordMenu';

interface MegaMenuLandlordProps {
  isOpen: boolean;
  onClose: () => void;
}

export function MegaMenuLandlord({ isOpen, onClose }: MegaMenuLandlordProps) {
  if (!isOpen) return null;
  return (
    <div className="absolute left-0 top-full w-full bg-white border-t border-gray-200 shadow-lg z-50" onMouseLeave={onClose} role="menu" aria-label="Landlord Solutions menu">
      <div className="max-w-7xl mx-auto px-6 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {LANDLORD_MENU.map((column, index) => (
            <div key={index}>
              <h3 className="font-semibold text-[var(--ubee-black)] mb-3 text-sm uppercase tracking-wide">{column.title}</h3>
              <ul className="space-y-2">
                {column.items.map((item) => (
                  <li key={item.href}>
                    <Link href={item.href} className="block py-1.5 text-gray-700 hover:text-[var(--ubee-yellow-hover)] hover:underline" role="menuitem" onClick={onClose}>{item.label}</Link>
                    {item.description && <p className="text-xs text-gray-500 mt-0.5">{item.description}</p>}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <div className="mt-6 pt-6 border-t border-gray-200">
          <Link href="/landlord-solutions" className="font-semibold text-[var(--ubee-black)] hover:text-[var(--ubee-yellow-hover)] hover:underline" onClick={onClose}>View All Landlord Solutions →</Link>
        </div>
      </div>
    </div>
  );
}
