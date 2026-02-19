'use client';

import { useState, useTransition } from 'react';

type Props = {
  agentName: string;
  agencyName: string;
  email: string;
  initialLogoUrl: string | null;
  initialPrimaryColor: string | null;
  initialMarkupType: 'PERCENT' | 'FIXED';
  initialMarkupValue: string;
  initialSlug: string;
  catalogueUrl: string;
  pricedProducts: Array<{
    id: string;
    title: string;
    benefitLine: string;
    baseTradePrice: number;
    agentMarkupPrice: number;
    commissionDifference: number;
    currencyCode: string;
  }>;
  token: string;
};

export default function AgentDashboard(props: Props) {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState<string>('');

  return (
    <div className="space-y-6">
      <section className="grid gap-4 md:grid-cols-2">
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Branding</h2>
          <p className="mt-1 text-sm text-zinc-600">Set logo URL and primary colour for your catalogue.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Commission Settings</h2>
          <p className="mt-1 text-sm text-zinc-600">Choose percent or fixed markup for displayed catalogue prices.</p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Catalogue Link</h2>
          <p className="mt-1 text-sm text-zinc-600 break-all">{props.catalogueUrl}</p>
          <button
            type="button"
            onClick={() => navigator.clipboard.writeText(props.catalogueUrl)}
            className="mt-2 rounded border border-zinc-300 px-3 py-1 text-xs"
          >
            Copy link
          </button>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h2 className="text-lg font-semibold text-zinc-900">Download PDF</h2>
          <a
            href={`${props.catalogueUrl}?print=1`}
            target="_blank"
            className="mt-2 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open print view
          </a>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white p-5 md:col-span-2">
          <h2 className="text-lg font-semibold text-zinc-900">Enquiries</h2>
          <p className="mt-1 text-sm text-zinc-600">Review and update enquiry statuses from your inbox.</p>
          <a
            href={`/agent/enquiries?token=${props.token}`}
            className="mt-3 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
          >
            Open Enquiries
          </a>
        </div>
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h1 className="text-2xl font-semibold text-zinc-900">Welcome, {props.agentName}</h1>
        <p className="mt-1 text-sm text-zinc-600">
          {props.agencyName} ({props.email})
        </p>

        <form
          className="mt-6 grid gap-4 md:grid-cols-2"
          onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            startTransition(async () => {
              const payload = {
                token: props.token,
                logoUrl: String(formData.get('logoUrl') || ''),
                primaryColor: String(formData.get('primaryColor') || ''),
                slug: String(formData.get('slug') || ''),
                markupType: String(formData.get('markupType') || 'PERCENT'),
                markupValue: Number(formData.get('markupValue') || 0),
              };
              const response = await fetch('/api/agent/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
              });
              const data = await response.json();
              setMessage(data.message || 'Unable to save settings right now.');
            });
          }}
        >
          <input name="logoUrl" defaultValue={props.initialLogoUrl ?? ''} placeholder="Logo URL" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="primaryColor" defaultValue={props.initialPrimaryColor ?? ''} placeholder="#F7C600" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <input name="slug" defaultValue={props.initialSlug} placeholder="Catalogue slug" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <select name="markupType" defaultValue={props.initialMarkupType} className="rounded-lg border border-zinc-300 px-3 py-2">
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
          <input name="markupValue" defaultValue={props.initialMarkupValue} type="number" min="0" step="0.01" className="rounded-lg border border-zinc-300 px-3 py-2" />
          <button disabled={pending} className="md:col-span-2 rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-4 py-2 font-semibold text-zinc-900 disabled:opacity-60">
            {pending ? 'Saving...' : 'Save settings'}
          </button>
        </form>
        {message ? <p className="mt-3 text-sm text-zinc-700">{message}</p> : null}
      </section>

      <section className="rounded-xl border border-zinc-200 bg-white p-6">
        <h2 className="text-xl font-semibold text-zinc-900">Catalogue pricing preview (agent-only)</h2>
        <p className="mt-1 text-sm text-zinc-600">
          Trade price, marked-up price, and commission difference are visible only in this protected portal.
        </p>
        <p className="mt-1 text-xs text-zinc-500">
          VAT treatment follows existing site pricing policy.
        </p>
        <p className="mt-2 text-xs text-zinc-500" data-testid="priced-products-count">
          Priced products loaded: {props.pricedProducts.length}
        </p>
        {props.pricedProducts.length === 0 ? (
          <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
            No priced products available yet - connect product pricing source.
          </div>
        ) : null}
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {props.pricedProducts.map((product) => (
            <article key={product.id} className="rounded-lg border border-zinc-200 p-4">
              <h3 className="font-semibold text-zinc-900">{product.title}</h3>
              <p className="mt-1 text-sm text-zinc-600">{product.benefitLine}</p>
              <div className="mt-3 space-y-1 text-sm text-zinc-800">
                <p>Base trade price: £{product.baseTradePrice.toFixed(2)}</p>
                <p>Agent markup price: £{product.agentMarkupPrice.toFixed(2)}</p>
                <p>Commission difference: £{product.commissionDifference.toFixed(2)}</p>
              </div>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
}

