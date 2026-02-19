'use client';

import { useState } from 'react';
import { submitLandlordLead } from '@/app/actions/landlord-lead';
import { trackLeadSubmit } from '@/lib/analytics';

export function LandlordLeadForm() {
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const formData = new FormData(e.currentTarget);
    const data = {
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      property: formData.get('property') as string | undefined,
      message: formData.get('message') as string | undefined,
    };

    const result = await submitLandlordLead(data);

    if (result.success) {
      // Track successful lead submission
      trackLeadSubmit();
      setSubmitted(true);
    } else {
      setError(result.error || 'Failed to submit. Please try again.');
    }

    setLoading(false);
  }

  if (submitted) {
    return (
      <div style={{ padding: '1rem', background: '#e8f5e9', borderRadius: 6 }}>
        <p style={{ margin: 0, fontWeight: 600, marginBottom: '0.5rem' }}>Thank you!</p>
        <p style={{ margin: 0, fontSize: '0.9375rem' }}>
          We've received your request and will be in touch shortly with a quote.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', maxWidth: 400 }}
    >
      {error && (
        <div style={{ padding: '0.75rem', background: '#fee', borderRadius: 4, fontSize: '0.875rem', color: '#c00' }}>
          {error}
        </div>
      )}
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
          background: loading ? '#666' : '#000',
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
