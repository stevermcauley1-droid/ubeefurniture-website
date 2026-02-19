'use client';

import { useState, useTransition } from 'react';

type ActionResult = {
  ok: boolean;
  message: string;
  portalLink?: string;
  catalogueLink?: string;
};

type Props = {
  action: (formData: FormData) => Promise<ActionResult>;
};

export default function AgentOnboardingForm({ action }: Props) {
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionResult | null>(null);

  return (
    <div className="mx-auto max-w-3xl rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <h1 className="text-2xl font-semibold text-zinc-900">Agent onboarding</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Create your white-label catalogue profile and receive your private portal access link.
      </p>

      <form
        className="mt-6 grid gap-4 md:grid-cols-2"
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.currentTarget);
          startTransition(async () => {
            const data = await action(formData);
            setResult(data);
          });
        }}
      >
        <input name="name" required placeholder="Your name" className="rounded-lg border border-zinc-300 px-3 py-2" />
        <input name="agencyName" required placeholder="Agency name" className="rounded-lg border border-zinc-300 px-3 py-2" />
        <input name="email" required type="email" placeholder="Email" className="rounded-lg border border-zinc-300 px-3 py-2" />
        <input name="phone" placeholder="Phone (optional)" className="rounded-lg border border-zinc-300 px-3 py-2" />
        <input name="slug" required placeholder="Catalogue slug (e.g. smith-lettings)" className="rounded-lg border border-zinc-300 px-3 py-2 md:col-span-2" />
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Default markup type</label>
          <select name="markupType" className="w-full rounded-lg border border-zinc-300 px-3 py-2">
            <option value="PERCENT">Percent</option>
            <option value="FIXED">Fixed</option>
          </select>
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-zinc-700">Default markup value</label>
          <input name="markupValue" required type="number" min="0" step="0.01" defaultValue="10" className="w-full rounded-lg border border-zinc-300 px-3 py-2" />
        </div>
        <button
          type="submit"
          disabled={pending}
          className="md:col-span-2 rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-4 py-2 font-semibold text-zinc-900 disabled:opacity-60"
        >
          {pending ? 'Creating profile...' : 'Create agent profile'}
        </button>
      </form>

      {result && (
        <div className={`mt-6 rounded-lg border p-4 text-sm ${result.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-900' : 'border-rose-200 bg-rose-50 text-rose-900'}`}>
          <p>{result.message}</p>
          {result.ok && result.portalLink && result.catalogueLink ? (
            <div className="mt-3 space-y-2">
              <div>
                <p className="font-medium">Portal link</p>
                <div className="flex gap-2">
                  <input readOnly value={result.portalLink} className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-800" />
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-1"
                    onClick={() => navigator.clipboard.writeText(result.portalLink!)}
                  >
                    Copy
                  </button>
                </div>
              </div>
              <div>
                <p className="font-medium">Public catalogue link</p>
                <div className="flex gap-2">
                  <input readOnly value={result.catalogueLink} className="w-full rounded border border-zinc-300 bg-white px-2 py-1 text-zinc-800" />
                  <button
                    type="button"
                    className="rounded border border-zinc-300 px-3 py-1"
                    onClick={() => navigator.clipboard.writeText(result.catalogueLink!)}
                  >
                    Copy
                  </button>
                </div>
              </div>
            </div>
          ) : null}
        </div>
      )}
    </div>
  );
}

