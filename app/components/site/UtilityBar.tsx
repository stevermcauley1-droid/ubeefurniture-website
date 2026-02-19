'use client';

import Link from 'next/link';

const UTILITY_LINKS = [
  { label: 'Estate Agents', href: '/estate-agents' },
  { label: 'Landlords', href: '/landlords' },
  { label: 'Social Housing', href: '/social-housing' },
  { label: 'Login', href: '/login' },
  { label: 'Register', href: '/register' },
];

export function UtilityBar() {
  return (
    <div className="bg-gray-100 border-b border-gray-200" role="navigation" aria-label="Utility links">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-end items-center h-8 gap-4 text-xs">
          {UTILITY_LINKS.map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="text-[var(--ubee-gray)] hover:text-[var(--ubee-black)] transition-colors font-medium focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded px-1"
            >
                {l.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
