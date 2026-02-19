'use client';

import { useState, useTransition } from 'react';
import PrintButton from './PrintButton';
import ProductCard from './ProductCard';

type CatalogueProduct = {
  id: string;
  handle: string;
  title: string;
  benefitLine: string;
  image?: { url: string; altText: string | null } | null;
};

type Props = {
  catalogueSlug: string;
  catalogueTitle: string;
  agencyName: string;
  agentName: string;
  logoUrl: string | null;
  primaryColor: string | null;
  products: CatalogueProduct[];
};

export default function BrandedCatalogueView({
  catalogueSlug,
  catalogueTitle,
  agencyName,
  agentName,
  logoUrl,
  primaryColor,
  products,
}: Props) {
  const [open, setOpen] = useState(false);
  const [itemsInterestedIn, setItemsInterestedIn] = useState('');
  const [responseMessage, setResponseMessage] = useState('');
  const [pending, startTransition] = useTransition();
  const accent = primaryColor || '#F7C600';

  function openModalForItem(itemTitle: string) {
    setItemsInterestedIn(itemTitle);
    setResponseMessage('');
    setOpen(true);
  }

  return (
    <div className="mx-auto max-w-6xl p-6 print:p-0">
      <style>{`
        @media print {
          .no-print { display: none !important; }
          .print-card { break-inside: avoid; }
        }
      `}</style>
      <header className="mb-6 rounded-2xl border border-zinc-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            {logoUrl ? (
              <img src={logoUrl} alt={`${agencyName} logo`} className="h-14 w-auto rounded" />
            ) : (
              <div className="grid h-14 w-14 place-items-center rounded font-bold text-zinc-900" style={{ backgroundColor: accent }}>
                {agencyName.slice(0, 1)}
              </div>
            )}
            <div>
              <h1 className="text-2xl font-semibold text-zinc-900">{catalogueTitle}</h1>
              <p className="text-sm text-zinc-600">Prepared for landlords by {agentName}</p>
              <p className="mt-1 text-sm text-zinc-700">
                Prices available through your letting agent. Request a quote below.
              </p>
            </div>
          </div>
          <div className="no-print">
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => openModalForItem('General catalogue enquiry')}
                className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-900"
                style={{ backgroundColor: accent }}
              >
                Request Quote Through Your Agent
              </button>
              <PrintButton />
            </div>
          </div>
        </div>
      </header>

      <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {products.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            accentColor={accent}
            onRequestQuote={openModalForItem}
          />
        ))}
      </section>
      {products.length === 0 ? (
        <div className="mt-4 rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700">
          No products are currently published in this catalogue.
        </div>
      ) : null}

      {open ? (
        <div className="fixed inset-0 z-50 bg-black/50 p-4">
          <div className="mx-auto mt-10 max-w-xl rounded-2xl bg-white p-6 shadow-xl">
            <h2 className="text-xl font-semibold text-zinc-900">Request Quote Through Your Agent</h2>
            <form
              className="mt-4 space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                const form = e.currentTarget;
                const formData = new FormData(form);
                startTransition(async () => {
                  const payload = {
                    slug: catalogueSlug,
                    name: String(formData.get('name') || '').trim(),
                    email: String(formData.get('email') || '').trim(),
                    propertyAddress: String(formData.get('propertyAddress') || '').trim(),
                    itemsInterestedIn: String(formData.get('itemsInterestedIn') || '').trim(),
                    message: String(formData.get('message') || '').trim(),
                  };
                  const response = await fetch('/api/enquiries', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                  });
                  const result = await response.json();
                  setResponseMessage(result.message || 'Unable to submit enquiry right now.');
                  if (response.ok) {
                    form.reset();
                    setItemsInterestedIn('');
                  }
                });
              }}
            >
              <input name="name" required placeholder="Name" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
              <input name="email" type="email" required placeholder="Email" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
              <input name="propertyAddress" required placeholder="Property address" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
              <input
                name="itemsInterestedIn"
                required
                value={itemsInterestedIn}
                onChange={(e) => setItemsInterestedIn(e.target.value)}
                placeholder="Items interested in"
                className="w-full rounded-lg border border-zinc-300 px-3 py-2"
              />
              <textarea name="message" placeholder="Message" rows={4} className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={pending}
                  className="rounded-lg px-4 py-2 text-sm font-semibold text-zinc-900 disabled:opacity-60"
                  style={{ backgroundColor: accent }}
                >
                  {pending ? 'Submitting...' : 'Submit enquiry'}
                </button>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="rounded-lg border border-zinc-300 px-4 py-2 text-sm"
                >
                  Close
                </button>
              </div>
              {responseMessage ? <p className="text-sm text-zinc-700">{responseMessage}</p> : null}
            </form>
          </div>
        </div>
      ) : null}

      <footer className="mt-8 border-t border-zinc-200 pt-4 text-xs text-zinc-500">
        Powered by uBee Furniture
      </footer>
    </div>
  );
}

