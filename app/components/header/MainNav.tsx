'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SearchBar } from '../navigation/SearchBar';
import { Logo } from './Logo';
import { MegaMenuProducts } from './MegaMenuProducts';
import { MegaMenuLandlord } from './MegaMenuLandlord';
import { CartIcon } from './CartIcon';
import { LANDLORD_MENU } from './landlordMenu';

interface MainNavProps {
  collections: Array<{ handle: string; title: string }>;
}

const NAV_ITEMS = [
  { label: 'Home', href: '/', megaKey: null },
  { label: 'Products', href: '/collections', megaKey: 'products' },
  { label: 'Landlord Solutions', href: '/landlord-solutions', megaKey: 'landlord', highlight: true },
  { label: 'About Us', href: '/about', megaKey: null },
  { label: 'Blog', href: '/blog', megaKey: null },
  { label: 'FAQs', href: '/faqs', megaKey: null },
  { label: 'Contact', href: '/contact', megaKey: null },
];

export function MainNav({ collections }: MainNavProps) {
  const [hoveredNav, setHoveredNav] = useState<string | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileExpanded, setMobileExpanded] = useState<string | null>(null);

  return (
    <nav className="sticky top-0 z-50 bg-white border-b border-gray-200 shadow-sm" role="navigation" aria-label="Main navigation">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Logo />
          <div className="hidden md:flex items-center flex-1 justify-center gap-1">
            {NAV_ITEMS.map((item) => (
              <div key={item.label} className="relative" onMouseEnter={() => item.megaKey && setHoveredNav(item.megaKey)} onMouseLeave={() => setHoveredNav(null)}>
                <Link href={item.href} className={'px-4 py-2 text-sm font-medium relative ' + (item.highlight ? 'text-[var(--ubee-black)] after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-[var(--ubee-yellow)]' : 'text-gray-700 hover:text-gray-900')} aria-haspopup={!!item.megaKey} aria-expanded={hoveredNav === item.megaKey}>
                  {item.label}
                  {item.highlight && <span className="ml-1.5 text-xs text-[var(--ubee-yellow)] font-normal">Most Popular</span>}
                </Link>
              </div>
            ))}
          </div>
          <div className="hidden md:flex items-center gap-4">
            <SearchBar />
            <CartIcon />
          </div>
          <button type="button" className="md:hidden p-2 text-gray-700" onClick={() => setMobileOpen(!mobileOpen)} aria-expanded={mobileOpen} aria-label="Toggle menu">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">{mobileOpen ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}</svg>
          </button>
        </div>
      </div>
      <div className="hidden md:block relative">
        <MegaMenuProducts collections={collections} isOpen={hoveredNav === 'products'} onClose={() => setHoveredNav(null)} />
        <MegaMenuLandlord isOpen={hoveredNav === 'landlord'} onClose={() => setHoveredNav(null)} />
      </div>
      {mobileOpen && (
        <div className="md:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-2 flex items-center gap-4">
            <div className="flex-1"><SearchBar /></div>
            <CartIcon />
          </div>
          <div className="border-t border-gray-200">
            {NAV_ITEMS.map((item) => (
              <div key={item.label}>
                {item.megaKey ? (
                  <>
                    <button type="button" className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileExpanded(mobileExpanded === item.megaKey ? null : item.megaKey)} aria-expanded={mobileExpanded === item.megaKey} aria-controls={'mobile-' + item.megaKey}>
                      <span>{item.label}{item.highlight && <span className="ml-1.5 text-xs text-[var(--ubee-yellow)]">Most Popular</span>}</span>
                      <svg className={'w-5 h-5 ' + (mobileExpanded === item.megaKey ? 'rotate-180' : '')} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                    </button>
                    {mobileExpanded === item.megaKey && (
                      <div id={'mobile-' + item.megaKey} className="bg-gray-50 px-4 py-2">
                        {item.megaKey === 'products' && (
                          <>
                            {collections.slice(0, 10).map((c) => (
                              <Link key={c.handle} href={'/collections/' + c.handle} className="block py-2 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>{c.title}</Link>
                            ))}
                            <Link href="/collections" className="block py-2 text-sm font-medium text-gray-900" onClick={() => setMobileOpen(false)}>View All Collections</Link>
                          </>
                        )}
                        {item.megaKey === 'landlord' && (
                          <>
                            {LANDLORD_MENU.map((col) => (
                              <div key={col.title}>
                                <h4 className="font-semibold text-xs uppercase text-gray-500 mb-2">{col.title}</h4>
                                {col.items.map((sub) => (
                                  <Link key={sub.href} href={sub.href} className="block py-1.5 text-sm text-gray-600 hover:text-gray-900" onClick={() => setMobileOpen(false)}>{sub.label}</Link>
                                ))}
                              </div>
                            ))}
                            <Link href="/landlord-solutions" className="block py-2 text-sm font-medium text-gray-900 mt-4" onClick={() => setMobileOpen(false)}>View All Landlord Solutions</Link>
                          </>
                        )}
                      </div>
                    )}
                  </>
                ) : (
                  <Link href={item.href} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setMobileOpen(false)}>{item.label}</Link>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
}
