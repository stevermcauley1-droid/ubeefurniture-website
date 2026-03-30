'use client';

import { useState, useTransition } from 'react';
import Link from 'next/link';
import { trackLeadSubmit, trackEvent } from '@/lib/analytics';

const PERSONA_OPTIONS = [
  { value: 'landlord', label: 'Landlord' },
  { value: 'letting_agent', label: 'Letting Agent' },
  { value: 'social_housing', label: 'Social Housing' },
  { value: 'other', label: 'Other' },
];

const CATALOGUE_PDF_PATH = '/landlord-catalogue.pdf';

export default function CatalogueLeadForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
      {success ? (
        <>
          <div className="rounded-lg bg-green-50 p-4 text-green-800">
            <p className="font-semibold">Thanks — your catalogue is ready.</p>
            <p className="mt-1 text-sm">Check your email for the link, or download directly below.</p>
          </div>
          <div className="mt-6 flex flex-col gap-3 sm:flex-row">
            <a
              href={CATALOGUE_PDF_PATH}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-6 py-3 font-semibold text-zinc-900 hover:opacity-95"
              onClick={() => trackEvent('file_download', { file_name: 'landlord-catalogue.pdf', link_url: CATALOGUE_PDF_PATH })}
            >
              Download catalogue (PDF)
            </a>
            <Link
              href="/contact"
              className="inline-flex items-center justify-center rounded-lg border border-zinc-300 bg-white px-6 py-3 font-semibold text-zinc-900 hover:bg-zinc-50"
            >
              Speak to a Trade Advisor
            </Link>
          </div>
          <p className="mt-4 text-sm text-zinc-500">
            Can&apos;t see the PDF? We&apos;ll send it to your email. Catalogue coming this week if the file isn&apos;t live yet.
          </p>
        </>
      ) : (
        <>
          <h2 className="text-xl font-bold text-zinc-900">Unlock Download</h2>
          <p className="mt-1 text-zinc-600">Enter your details to get the Landlord Fast-Furnish Catalogue.</p>
          <form
            className="mt-6 space-y-4"
            onSubmit={(e) => {
              e.preventDefault();
              setError('');
              const form = e.currentTarget;
              const formData = new FormData(form);
              const payload = {
                name: String(formData.get('name') ?? '').trim(),
                company: String(formData.get('company') ?? '').trim() || undefined,
                email: String(formData.get('email') ?? '').trim(),
                phone: String(formData.get('phone') ?? '').trim() || undefined,
                postcode: String(formData.get('postcode') ?? '').trim() || undefined,
                persona: String(formData.get('persona') ?? ''),
                consent: formData.get('consent') === 'on',
              };
              const endpoint = '/api/catalogue-leads';
              startTransition(async () => {
                try {
                  const ac = new AbortController();
                  const timeoutId = setTimeout(() => ac.abort(), 10000);
                  const res = await fetch(endpoint, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload),
                    signal: ac.signal,
                  });
                  clearTimeout(timeoutId);

                  const raw = await res.text();
                  let data: { ok?: boolean; error?: string; message?: string } | null = null;
                  try {
                    data = raw ? JSON.parse(raw) : null;
                  } catch {
                    // Non-JSON or empty; leave data null
                  }

                  if (!res.ok) {
                    const message =
                      (data && typeof data === 'object' && data.message) ||
                      `Request failed (${res.status}). Please try again.`;
                    setError(String(message));
                    console.log('[CatalogueLeadForm] error', { status: res.status, raw: raw.slice(0, 200), endpoint });
                    return;
                  }

                  if (!data || !data.ok) {
                    const message =
                      (data && typeof data === 'object' && data.message) ||
                      'Unexpected empty response from server';
                    setError(String(message));
                    if (!data) {
                      console.log('[CatalogueLeadForm] error', { status: res.status, raw: raw.slice(0, 200), endpoint });
                    }
                    return;
                  }

                  trackLeadSubmit(undefined, 'GBP');
                  setSuccess(true);
                  form.reset();
                } catch (err) {
                  const message =
                    err instanceof Error && err.name === 'AbortError'
                      ? 'Request timed out. Please try again.'
                      : err instanceof Error
                        ? err.message
                        : 'Unable to submit right now. Please try again.';
                  setError(message);
                  console.log('[CatalogueLeadForm] error', {
                    status: 'network',
                    raw: String(err).slice(0, 200),
                    endpoint,
                  });
                }
              });
            }}
          >
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Full name *</span>
                <input
                  name="name"
                  type="text"
                  required
                  placeholder="Your name"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Company (optional)</span>
                <input
                  name="company"
                  type="text"
                  placeholder="Company name"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Email *</span>
              <input
                name="email"
                type="email"
                required
                placeholder="you@example.com"
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
              />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Phone (optional)</span>
                <input
                  name="phone"
                  type="tel"
                  placeholder="Phone number"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-zinc-700">Postcode (optional)</span>
                <input
                  name="postcode"
                  type="text"
                  placeholder="e.g. CF11 0JL"
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
                />
              </label>
            </div>
            <label className="block">
              <span className="text-sm font-medium text-zinc-700">Are you a: *</span>
              <select
                name="persona"
                required
                className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2 text-zinc-900 focus:border-[var(--ubee-yellow)] focus:outline-none focus:ring-1 focus:ring-[var(--ubee-yellow)]"
              >
                {PERSONA_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="flex items-start gap-3">
              <input
                name="consent"
                type="checkbox"
                required
                className="mt-1 h-4 w-4 rounded border-zinc-300 text-[var(--ubee-yellow)] focus:ring-[var(--ubee-yellow)]"
              />
              <span className="text-sm text-zinc-700">
                I agree to be contacted about landlord packages and offers.
              </span>
            </label>
            {error && <p className="text-sm text-red-600">{error}</p>}
            <button
              type="submit"
              disabled={pending}
              className="w-full rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-5 py-3 font-semibold text-zinc-900 hover:opacity-95 disabled:opacity-60 sm:w-auto"
            >
              {pending ? 'Submitting...' : 'Unlock Download'}
            </button>
          </form>
          <p className="mt-4 text-sm text-zinc-500">
            Already have the catalogue?{' '}
            <Link href="/contact" className="font-medium text-zinc-700 hover:underline">
              Speak to a Trade Advisor
            </Link>
          </p>
        </>
      )}
    </div>
  );
}
