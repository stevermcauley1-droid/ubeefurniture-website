'use client';

import { useState } from 'react';
import Link from 'next/link';

type TabKey = 'catalogue' | 'services';

export function LandlordTabs() {
  const [tab, setTab] = useState<TabKey>('catalogue');

  return (
    <section className="mt-8 rounded-xl border border-gray-200 bg-white shadow-sm overflow-hidden">
      <div className="px-5 pt-5 pb-3 border-b border-gray-100">
        <h2 className="text-xl font-semibold text-[var(--ubee-black)]">Landlord Hub</h2>
        <p className="text-sm text-[var(--ubee-gray)] mt-1">
          Furnish properties faster with a clear catalogue and landlord-focused services.
        </p>
      </div>

      <div className="px-5 pt-4">
        <div className="inline-flex rounded-lg border border-gray-200 p-1 bg-gray-50">
          <button
            type="button"
            onClick={() => setTab('catalogue')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              tab === 'catalogue'
                ? 'bg-[var(--ubee-yellow)] text-[var(--ubee-black)]'
                : 'text-[var(--ubee-gray)] hover:text-[var(--ubee-black)]'
            }`}
          >
            Landlord Catalogue
          </button>
          <button
            type="button"
            onClick={() => setTab('services')}
            className={`px-4 py-2 text-sm font-semibold rounded-md transition-colors ${
              tab === 'services'
                ? 'bg-[var(--ubee-yellow)] text-[var(--ubee-black)]'
                : 'text-[var(--ubee-gray)] hover:text-[var(--ubee-black)]'
            }`}
          >
            Services
          </button>
        </div>
      </div>

      <div className="p-5">
        {tab === 'catalogue' && (
          <div className="grid md:grid-cols-[1fr_auto] gap-4 items-center">
            <div>
              <h3 className="text-lg font-semibold text-[var(--ubee-black)]">Download Landlord Catalogue</h3>
              <p className="text-sm text-[var(--ubee-gray)] mt-1">
                Product ranges, package options, and practical furnishing choices for rental properties.
              </p>
            </div>
            <Link
              href="/landlords/catalogue"
              className="inline-block px-5 py-2.5 rounded-md bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] font-semibold transition-colors"
            >
              Download PDF
            </Link>
          </div>
        )}

        {tab === 'services' && (
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <Link href="/landlord-solutions/packages" className="rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-[var(--ubee-black)] text-sm">Landlord Packages</p>
              <p className="text-xs text-[var(--ubee-gray)] mt-1">Ready-made furnishing bundles</p>
            </Link>
            <Link href="/landlords#quote" className="rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-[var(--ubee-black)] text-sm">Request a Quote</p>
              <p className="text-xs text-[var(--ubee-gray)] mt-1">Fast turnaround for projects</p>
            </Link>
            <Link href="/landlord-solutions/bulk-delivery" className="rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-[var(--ubee-black)] text-sm">Delivery & Assembly</p>
              <p className="text-xs text-[var(--ubee-gray)] mt-1">Install support available</p>
            </Link>
            <Link href="/contact#aftercare" className="rounded-lg border border-gray-200 p-3 hover:border-gray-300 hover:bg-gray-50 transition-colors">
              <p className="font-semibold text-[var(--ubee-black)] text-sm">Aftercare / Repairs</p>
              <p className="text-xs text-[var(--ubee-gray)] mt-1">Ongoing support for tenants</p>
            </Link>
          </div>
        )}
      </div>
    </section>
  );
}

