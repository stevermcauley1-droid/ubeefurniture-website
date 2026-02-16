'use client';

import Link from 'next/link';
import { useState } from 'react';
import { SearchBar } from './SearchBar';

interface MegaMenuProps {
  collections?: Array<{ handle: string; title: string }>;
}

export function MegaMenu({ collections = [] }: MegaMenuProps) {
  const [mobileOpen, setMobileOpen] = useState<string | null>(null);
  const [hovered, setHovered] = useState<string | null>(null);

  // Build Room nav items from real collections (max 6, then "All collections")
  const roomChildren = collections.slice(0, 6).map((c) => ({
    label: c.title,
    href: `/collections/${c.handle}`,
  }));
  if (collections.length > 0) {
    roomChildren.push({ label: 'All collections', href: '/collections' });
  } else {
    // Fallback if no collections: just show "All collections"
    roomChildren.push({ label: 'All collections', href: '/collections' });
  }

  const NAV_ITEMS = [
    {
      label: 'Room',
      href: '/collections',
      ariaLabel: 'Shop by room',
      children: roomChildren,
    },
  {
    label: 'Package',
    href: '/landlord',
    ariaLabel: 'Landlord packages',
    children: [
      { label: 'View packages', href: '/landlord' },
      { label: 'All collections', href: '/collections' },
    ],
  },
  {
    label: 'Landlord',
    href: '/landlord',
    ariaLabel: 'Landlord hub',
    children: [
      { label: 'Furnish a property fast', href: '/landlord' },
      { label: 'Request a quote', href: '/landlord#quote' },
    ],
  },
  {
    label: 'Sale',
    href: '/collections',
    ariaLabel: 'Sale items',
    children: [
      { label: 'Shop sale', href: '/collections' },
    ],
  },
  ];

  return (
    <nav
      role="navigation"
      aria-label="Main navigation"
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 50,
        background: '#fff',
        borderBottom: '1px solid #eee',
        boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
      }}
    >
      <div
        style={{
          maxWidth: 1200,
          margin: '0 auto',
          padding: '0.75rem 1rem',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '0.5rem',
        }}
      >
        <Link
          href="/"
          style={{
            fontSize: '1.25rem',
            fontWeight: 700,
            color: '#000',
          }}
        >
          Ubee Furniture
        </Link>

        <div className="mega-menu-desktop" style={{ marginLeft: 'auto', marginRight: '0.5rem' }}>
          <SearchBar />
        </div>

        {/* Desktop: horizontal nav with hover dropdowns */}
        <ul
          className="mega-menu-desktop"
          style={{
            display: 'none',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: '0.5rem',
            alignItems: 'center',
          }}
        >
          {NAV_ITEMS.map((item) => (
            <li
              key={item.label}
              style={{ position: 'relative' }}
              onMouseEnter={() => setHovered(item.label)}
              onMouseLeave={() => setHovered(null)}
            >
              <Link
                href={item.href}
                aria-haspopup="true"
                aria-expanded={hovered === item.label}
                aria-label={item.ariaLabel}
                style={{
                  display: 'block',
                  padding: '0.5rem 0.75rem',
                  fontWeight: 600,
                  color: '#333',
                  borderRadius: 4,
                }}
              >
                {item.label}
              </Link>
              {item.children.length > 0 && hovered === item.label && (
                <div
                  role="menu"
                  aria-label={`${item.label} submenu`}
                  style={{
                    position: 'absolute',
                    top: '100%',
                    left: 0,
                    minWidth: 180,
                    marginTop: 2,
                    padding: '0.5rem 0',
                    background: '#fff',
                    border: '1px solid #eee',
                    borderRadius: 8,
                    boxShadow: '0 4px 12px rgba(0,0,0,0.1)',
                  }}
                >
                  {item.children.map((child) => (
                    <Link
                      key={child.href + child.label}
                      href={child.href}
                      role="menuitem"
                      style={{
                        display: 'block',
                        padding: '0.5rem 1rem',
                        color: '#333',
                        fontSize: '0.9375rem',
                      }}
                    >
                      {child.label}
                    </Link>
                  ))}
                </div>
              )}
            </li>
          ))}
        </ul>

        <div className="mega-menu-mobile" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid #eee' }}>
          <SearchBar />
        </div>

        {/* Mobile: accordion */}
        <ul
          className="mega-menu-mobile"
          style={{
            display: 'flex',
            flexDirection: 'column',
            width: '100%',
            listStyle: 'none',
            margin: 0,
            padding: 0,
            gap: 0,
          }}
        >
          {NAV_ITEMS.map((item) => (
            <li key={item.label} style={{ borderBottom: '1px solid #eee' }}>
              <button
                type="button"
                onClick={() => setMobileOpen(mobileOpen === item.label ? null : item.label)}
                aria-expanded={mobileOpen === item.label}
                aria-controls={`mega-${item.label.toLowerCase()}`}
                id={`mega-trigger-${item.label.toLowerCase()}`}
                style={{
                  width: '100%',
                  padding: '0.75rem 1rem',
                  textAlign: 'left',
                  background: 'none',
                  border: 'none',
                  fontSize: '1rem',
                  fontWeight: 600,
                  cursor: 'pointer',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}
              >
                {item.label}
                <span aria-hidden style={{ fontSize: '0.75rem' }}>
                  {mobileOpen === item.label ? '−' : '+'}
                </span>
              </button>
              <div
                id={`mega-${item.label.toLowerCase()}`}
                role="region"
                aria-labelledby={`mega-trigger-${item.label.toLowerCase()}`}
                style={{
                  display: mobileOpen === item.label ? 'block' : 'none',
                  padding: '0 1rem 0.75rem',
                  background: '#f9f9f9',
                }}
              >
                <Link
                  href={item.href}
                  style={{
                    display: 'block',
                    padding: '0.5rem 0',
                    fontWeight: 600,
                    color: '#000',
                  }}
                >
                  View all {item.label}
                </Link>
                {item.children.map((child) => (
                  <Link
                    key={child.href + child.label}
                    href={child.href}
                    style={{
                      display: 'block',
                      padding: '0.35rem 0',
                      fontSize: '0.9375rem',
                      color: '#555',
                    }}
                  >
                    {child.label}
                  </Link>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
