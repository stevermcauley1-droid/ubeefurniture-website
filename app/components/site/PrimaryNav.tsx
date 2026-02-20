'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';

type MenuKey = 'collections' | 'landlord' | 'living' | 'dining' | 'bedroom' | 'kids' | 'office' | 'sofas';

const PRIMARY_TABS: Array<{ label: string; href: string; menuKey?: MenuKey }> = [
  { label: 'NEW IN', href: '/collections' },
  { label: 'ON SALE AND END OF LINE', href: '/sale' },
  { label: 'COLLECTIONS', href: '/collections', menuKey: 'collections' },
  { label: 'LANDLORD HUB', href: '/landlords', menuKey: 'landlord' },
  { label: 'LIVING', href: '/collections/living-room', menuKey: 'living' },
  { label: 'DINING', href: '/collections/dining', menuKey: 'dining' },
  { label: 'BEDROOM', href: '/collections/bedroom-furniture', menuKey: 'bedroom' },
  { label: 'PACKAGES', href: '/landlord-solutions/packages' },
  { label: 'KIDS', href: '/collections/kids', menuKey: 'kids' },
  { label: 'OFFICE', href: '/collections/office', menuKey: 'office' },
  { label: 'SOFAS', href: '/collections/sofas', menuKey: 'sofas' },
];

const COLLECTIONS_SUBTABS: Array<{ label: string; href: string }> = [
  { label: '4Kids', href: '/collections/4kids' },
  { label: '4You', href: '/collections/4you' },
  { label: 'Albany', href: '/collections/albany' },
  { label: 'A-Line', href: '/collections/a-line' },
  { label: 'Alisma', href: '/collections/alisma' },
  { label: 'Angel', href: '/collections/angel' },
  { label: 'Angus', href: '/collections/angus' },
  { label: 'Arundel', href: '/collections/arundel' },
  { label: 'Avenale (NEW)', href: '/collections/avenale' },
  { label: 'Bailey', href: '/collections/bailey' },
  { label: 'Barcelona', href: '/collections/barcelona' },
  { label: 'Barlow', href: '/collections/barlow' },
  { label: 'Basic', href: '/collections/basic' },
  { label: 'Best Chest', href: '/collections/best-chest' },
  { label: 'Bohol', href: '/collections/bohol' },
  { label: 'Brande', href: '/collections/brande' },
  { label: 'Brolo', href: '/collections/brolo' },
  { label: 'Brooke', href: '/collections/brooke' },
  { label: 'Brooklyn', href: '/collections/brooklyn' },
  { label: 'Calasetta', href: '/collections/calasetta' },
  { label: 'Celesto', href: '/collections/celesto' },
  { label: 'Century', href: '/collections/century' },
  { label: 'Cestino', href: '/collections/cestino' },
  { label: 'Chelsea', href: '/collections/chelsea' },
  { label: 'Corona', href: '/collections/corona' },
  { label: 'Cortina', href: '/collections/cortina' },
  { label: 'Cumbria', href: '/collections/cumbria' },
  { label: 'Darwin', href: '/collections/darwin' },
  { label: 'Denim', href: '/collections/denim' },
  { label: 'Dice & Mice', href: '/collections/dice-mice' },
  { label: 'Essential', href: '/collections/essential' },
  { label: 'Fribo', href: '/collections/fribo' },
  { label: 'Function Plus', href: '/collections/function-plus' },
  { label: 'Fur', href: '/collections/fur' },
  { label: 'Genoa', href: '/collections/genoa' },
  { label: 'Grafton', href: '/collections/grafton' },
  { label: 'Heaven', href: '/collections/heaven' },
  { label: 'High Rock', href: '/collections/high-rock' },
  { label: 'Ikast', href: '/collections/ikast' },
  { label: 'Ilopa', href: '/collections/ilopa' },
  { label: 'Imperial', href: '/collections/imperial' },
  { label: 'Jaipur (NEW)', href: '/collections/jaipur' },
  { label: 'Karon Coffee Table', href: '/collections/karon-coffee-table' },
  { label: 'Kendall', href: '/collections/kendall' },
  { label: 'Klara', href: '/collections/klara' },
  { label: 'Langley', href: '/collections/langley' },
  { label: 'Lazio', href: '/collections/lazio' },
  { label: 'Line', href: '/collections/line' },
  { label: 'Linley', href: '/collections/linley' },
  { label: 'Lusaka (NEW)', href: '/collections/lusaka' },
  { label: 'Lyon', href: '/collections/lyon' },
  { label: 'Madrid', href: '/collections/madrid' },
  { label: 'Malta', href: '/collections/malta' },
  { label: 'Marte', href: '/collections/marte' },
  { label: 'Match', href: '/collections/match' },
  { label: 'Mauro', href: '/collections/mauro' },
  { label: 'May', href: '/collections/may' },
  { label: 'Maze', href: '/collections/maze' },
  { label: 'Media', href: '/collections/media' },
  { label: 'Midfield (NEW)', href: '/collections/midfield' },
  { label: 'Montreux', href: '/collections/montreux' },
  { label: 'Naia', href: '/collections/naia' },
  { label: 'Newcastle', href: '/collections/newcastle' },
  { label: 'Next (NEW)', href: '/collections/next' },
  { label: 'Nikomedes', href: '/collections/nikomedes' },
  { label: 'Nova', href: '/collections/nova' },
  { label: 'Novi', href: '/collections/novi' },
  { label: 'Omaha (NEW)', href: '/collections/omaha' },
  { label: 'Oslo', href: '/collections/oslo' },
  { label: 'Paris', href: '/collections/paris' },
  { label: 'Pepe', href: '/collections/pepe' },
  { label: 'Prima Professional Office', href: '/collections/prima-professional-office' },
  { label: 'Rapallo', href: '/collections/rapallo' },
  { label: 'Rome', href: '/collections/rome' },
  { label: 'Roomers', href: '/collections/roomers' },
  { label: 'Roxby', href: '/collections/roxby' },
  { label: 'Ry', href: '/collections/ry' },
  { label: 'Sali', href: '/collections/sali' },
  { label: 'Seaford', href: '/collections/seaford' },
  { label: 'Shetland', href: '/collections/shetland' },
  { label: 'Shoes', href: '/collections/shoes' },
  { label: 'Sienna', href: '/collections/sienna' },
  { label: 'Sofia', href: '/collections/sofia' },
  { label: 'Soli (NEW)', href: '/collections/soli' },
  { label: 'Southampton (NEW)', href: '/collections/southampton' },
  { label: 'Space', href: '/collections/space' },
  { label: 'Steens For Kids', href: '/collections/steens-for-kids' },
  { label: 'Strington', href: '/collections/strington' },
  { label: 'Stubbe', href: '/collections/stubbe' },
  { label: 'Tezaur Gaming Desks', href: '/collections/tezaur-gaming-desks' },
  { label: 'Toronto', href: '/collections/toronto' },
  { label: 'Uppsala', href: '/collections/uppsala' },
  { label: 'Wensley', href: '/collections/wensley' },
  { label: 'Westham (NEW)', href: '/collections/westham' },
  { label: 'Zingaro', href: '/collections/zingaro' },
  { label: 'Cabinet Light', href: '/collections/cabinet-light' },
];

const DROPDOWNS: Record<MenuKey, Array<{ label: string; href: string }>> = {
  collections: COLLECTIONS_SUBTABS,
  landlord: [
    { label: 'Download Landlord Catalogue (PDF)', href: '/landlords/catalogue' },
    { label: 'Landlord Packages', href: '/landlord-solutions/packages' },
    { label: 'Request a Quote', href: '/landlords#quote' },
    { label: 'Delivery & Assembly', href: '/landlord-solutions/bulk-delivery' },
    { label: 'Aftercare / Repairs', href: '/contact#aftercare' },
  ],
  living: [
    { label: 'Coffee Tables', href: '/collections/living-room' },
    { label: 'TV Units', href: '/collections/living-room' },
    { label: 'Sideboards', href: '/collections/living-room' },
    { label: 'Cabinets', href: '/collections/living-room' },
    { label: 'Lounge Chairs', href: '/collections/living-room' },
    { label: 'Console Tables', href: '/collections/living-room' },
    { label: 'Side Tables', href: '/collections/living-room' },
    { label: 'Nest of Tables', href: '/collections/living-room' },
    { label: 'Cube Shelves', href: '/collections/living-room' },
    { label: 'Bookcases', href: '/collections/living-room' },
    { label: 'Mirrors', href: '/collections/living-room' },
    { label: 'Coat Racks', href: '/collections/living-room' },
    { label: 'Shoe Storage Cabinets', href: '/collections/living-room' },
    { label: 'Wall Shelves', href: '/collections/living-room' },
    { label: 'Cabinet Lights', href: '/collections/living-room' },
    { label: 'Accessories', href: '/collections/living-room' },
  ],
  dining: [
    { label: 'Dining Sets', href: '/collections/dining' },
    { label: 'Dining Chairs', href: '/collections/dining' },
    { label: 'Dining Tables', href: '/collections/dining' },
    { label: 'Sideboards', href: '/collections/dining' },
    { label: 'Cabinets', href: '/collections/dining' },
    { label: 'Bar Desks', href: '/collections/dining' },
    { label: 'Bar and Counter Stools', href: '/collections/dining' },
    { label: 'Cabinet Lights', href: '/collections/dining' },
  ],
  bedroom: [
    { label: 'Beds', href: '/collections/beds' },
    { label: 'Mattresses', href: '/collections/mattresses' },
    { label: 'Wardrobes', href: '/collections/wardrobes' },
    { label: 'Bedside Cabinets', href: '/collections/bedroom-furniture' },
    { label: 'Chest of Drawers', href: '/collections/bedroom-furniture' },
    { label: 'Console Tables', href: '/collections/bedroom-furniture' },
    { label: 'Sliding Wardrobes', href: '/collections/wardrobes' },
    { label: 'Shoe Storage Cabinets', href: '/collections/bedroom-furniture' },
    { label: 'Ottoman Storage', href: '/collections/bedroom-furniture' },
    { label: 'Bed Slats', href: '/collections/bedroom-furniture' },
    { label: 'Cabinet Lights', href: '/collections/bedroom-furniture' },
  ],
  kids: [
    { label: 'Kids Beds', href: '/collections/kids' },
    { label: 'Kids Accessories', href: '/collections/kids' },
    { label: 'Kids Wardrobes', href: '/collections/kids' },
    { label: 'Kids Cabinets', href: '/collections/kids' },
    { label: 'Kids Chest of Drawers', href: '/collections/kids' },
    { label: 'Kids Desks', href: '/collections/kids' },
    { label: 'Kids Gaming Desks', href: '/collections/kids' },
    { label: 'Kids Wall Shelves', href: '/collections/kids' },
    { label: 'Kids Bookcases', href: '/collections/kids' },
    { label: 'Kids Cube Shelves', href: '/collections/kids' },
    { label: 'Kids Toy Storage', href: '/collections/kids' },
  ],
  office: [
    { label: 'Desks', href: '/collections/office' },
    { label: 'Gaming Desks', href: '/collections/office' },
    { label: 'Desk Chairs', href: '/collections/office' },
    { label: 'Cabinets', href: '/collections/office' },
    { label: 'Bookcases', href: '/collections/office' },
    { label: 'Cube Shelves', href: '/collections/office' },
    { label: 'Wall Shelves', href: '/collections/office' },
    { label: 'Professional Office', href: '/collections/office' },
  ],
  sofas: [
    { label: 'All Sofas', href: '/collections/sofas' },
    { label: '2 Seater Sofas', href: '/collections/sofas' },
    { label: '3 Seater Sofas', href: '/collections/sofas' },
    { label: 'Corner Sofas', href: '/collections/sofas' },
    { label: 'Lounge Chairs', href: '/collections/sofas' },
  ],
};

export function PrimaryNav() {
  const [openMenu, setOpenMenu] = useState<MenuKey | null>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!openMenu) return;
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpenMenu(null);
    };
    const onOutside = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) {
        setOpenMenu(null);
      }
    };
    document.addEventListener('keydown', onEscape);
    document.addEventListener('mousedown', onOutside);
    return () => {
      document.removeEventListener('keydown', onEscape);
      document.removeEventListener('mousedown', onOutside);
    };
  }, [openMenu]);

  return (
    <nav className="bg-white border-y border-gray-200" role="navigation" aria-label="Primary navigation">
      <div ref={wrapperRef} className="max-w-7xl mx-auto px-4 relative">
        <div className="hidden md:flex items-center gap-2 flex-wrap">
          {PRIMARY_TABS.map((item) => (
            <Link
              key={item.label}
              href={item.href}
              onMouseEnter={() => setOpenMenu(item.menuKey ?? null)}
              className="px-2 py-3 text-[11px] font-semibold tracking-wide text-[var(--ubee-black)] hover:text-[var(--ubee-yellow-hover)] focus:outline-none focus:ring-2 focus:ring-[var(--ubee-yellow)] rounded"
              aria-haspopup={!!item.menuKey}
              aria-expanded={item.menuKey ? openMenu === item.menuKey : undefined}
            >
              {item.label}
              {item.menuKey && <span className="ml-1 text-[10px]">▼</span>}
            </Link>
          ))}
        </div>

        {openMenu && (
          <div
            className="hidden md:block absolute left-0 right-0 top-full bg-white border-t border-gray-200 shadow-lg z-50"
            onMouseLeave={() => setOpenMenu(null)}
          >
            <div className="max-w-7xl mx-auto px-6 py-6 grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
              {DROPDOWNS[openMenu].map((item) => (
                <Link
                  key={item.label + item.href}
                  href={item.href}
                  className="text-sm text-[var(--ubee-gray)] hover:text-[var(--ubee-black)] hover:underline"
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        )}
      </div>

      <MobileNav />
    </nav>
  );
}

function MobileNav() {
  const [open, setOpen] = useState(false);
  const [expanded, setExpanded] = useState<MenuKey | null>(null);

  return (
    <div className="md:hidden">
      <button
        type="button"
        className="flex items-center justify-between w-full px-4 py-3 text-sm font-medium text-gray-700 bg-gray-50 border-t border-gray-200"
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Toggle menu"
      >
        Menu
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          {open ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />}
        </svg>
      </button>
      {open && (
        <div className="border-t border-gray-200 bg-white">
          <div className="px-4 py-2 border-b border-gray-100 text-sm text-gray-600">
            <Link href="/estate-agents" className="block py-1.5" onClick={() => setOpen(false)}>Estate Agents</Link>
            <Link href="/landlords" className="block py-1.5" onClick={() => setOpen(false)}>Landlords</Link>
            <Link href="/social-housing" className="block py-1.5" onClick={() => setOpen(false)}>Social Housing</Link>
            <Link href="/login" className="block py-1.5" onClick={() => setOpen(false)}>Login</Link>
            <Link href="/register" className="block py-1.5" onClick={() => setOpen(false)}>Register</Link>
          </div>
          {PRIMARY_TABS.map((tab) => (
            <div key={tab.label}>
              {tab.menuKey ? (
                <>
                  <button
                    type="button"
                    className="w-full flex items-center justify-between px-4 py-3 text-left text-sm font-medium text-gray-700 hover:bg-gray-50"
                    onClick={() => setExpanded(expanded === tab.menuKey ? null : tab.menuKey!)}
                    aria-expanded={expanded === tab.menuKey}
                  >
                    {tab.label}
                    <svg className={`w-5 h-5 ${expanded === tab.menuKey ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" /></svg>
                  </button>
                  {expanded === tab.menuKey && (
                    <div className="bg-gray-50 px-4 py-2">
                      {DROPDOWNS[tab.menuKey].map((item) => (
                        <Link key={item.label + item.href} href={item.href} className="block py-2 text-sm" onClick={() => setOpen(false)}>
                          {item.label}
                        </Link>
                      ))}
                    </div>
                  )}
                </>
              ) : (
                <Link href={tab.href} className="block px-4 py-3 text-sm font-medium text-gray-700 hover:bg-gray-50" onClick={() => setOpen(false)}>
                  {tab.label}
                </Link>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
