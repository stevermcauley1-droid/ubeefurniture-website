'use client';

import { useState } from 'react';

export function LandlordLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    await new Promise((r) => setTimeout(r, 500));
    setSubmitted(true);
    setLoading(false);
  }

  if (submitted) {
    return (
      <p style={{ padding: '1rem', background: '#e8f5e9', borderRadius: 6 }}>
        Thanks — we will be in touch shortly with a quote.
      </p>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}
    >
      <label>
        <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Name</span>
        <input type="text" name="name" required style={{ width: '100%', padding: '0.5rem' }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Email</span>
        <input type="email" name="email" required style={{ width: '100%', padding: '0.5rem' }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Property (e.g. 2-bed flat)</span>
        <input type="text" name="property" style={{ width: '100%', padding: '0.5rem' }} />
      </label>
      <label>
        <span style={{ display: 'block', fontSize: '0.875rem', marginBottom: '0.25rem' }}>Message</span>
        <textarea name="message" rows={3} style={{ width: '100%', padding: '0.5rem' }} />
      </label>
      <button
        type="submit"
        disabled={loading}
        style={{
          padding: '0.5rem 1rem',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 4,
          fontWeight: 600,
          cursor: loading ? 'wait' : 'pointer',
        }}
      >
        {loading ? 'Sending…' : 'Send request'}
      </button>
    </form>
  );
}
