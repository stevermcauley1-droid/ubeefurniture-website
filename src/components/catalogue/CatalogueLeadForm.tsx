'use client';

import { useState, useTransition } from 'react';

export default function CatalogueLeadForm() {
  const [pending, startTransition] = useTransition();
  const [message, setMessage] = useState('');

  return (
    <form
      className="mt-6 space-y-3 rounded-xl border border-zinc-200 bg-white p-5"
      onSubmit={(event) => {
        event.preventDefault();
        const form = event.currentTarget;
        const formData = new FormData(form);
        const payload = {
          name: String(formData.get('name') || '').trim(),
          email: String(formData.get('email') || '').trim(),
          role: String(formData.get('role') || '').trim(),
        };

        startTransition(async () => {
          const response = await fetch('/api/catalogue-leads', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
          const data = await response.json();
          setMessage(data.message || 'Unable to submit right now.');
          if (response.ok) form.reset();
        });
      }}
    >
      <h2 className="text-lg font-semibold text-zinc-900">Email me the catalogue</h2>
      <input
        name="name"
        required
        placeholder="Name"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
      <input
        name="email"
        type="email"
        required
        placeholder="Email"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2"
      />
      <select
        name="role"
        required
        defaultValue="landlord"
        className="w-full rounded-lg border border-zinc-300 px-3 py-2"
      >
        <option value="landlord">Landlord</option>
        <option value="estate-agent">Estate Agent</option>
      </select>
      <button
        type="submit"
        disabled={pending}
        className="rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-4 py-2 font-semibold text-zinc-900 disabled:opacity-60"
      >
        {pending ? 'Submitting...' : 'Send me the catalogue'}
      </button>
      {message ? <p className="text-sm text-zinc-700">{message}</p> : null}
    </form>
  );
}

