'use client';

import Link from 'next/link';

export function UtilityBar() {
  const links = [
    { label: 'Estate Agents', href: '/estate-agents' },
    { label: 'Landlords', href: '/landlords' },
    { label: 'Trade Login', href: '/trade/login' },
    { label: 'Register', href: '/trade/register' },
  ];

  return (
    <div className="bg-[var(--ubee-black)]">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-end items-center h-8 gap-6 text-sm">
          {links.map((link) => (
            <Link key={link.href} href={link.href} className="text-gray-300 hover:text-[var(--ubee-yellow)] transition-colors font-medium">
              {link.label}
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
