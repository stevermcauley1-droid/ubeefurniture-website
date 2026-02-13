'use client';

import { useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useState } from 'react';

interface SearchFormProps {
  defaultValue?: string;
}

export function SearchForm({ defaultValue = '' }: SearchFormProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [value, setValue] = useState(defaultValue || searchParams.get('q') || '');

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      const q = value.trim();
      if (q) {
        router.push(`/search?q=${encodeURIComponent(q)}`);
      } else {
        router.push('/search');
      }
    },
    [value, router]
  );

  return (
    <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', maxWidth: 400 }}>
      <input
        type="search"
        name="q"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="Search products..."
        aria-label="Search products"
        style={{
          flex: 1,
          padding: '0.625rem 1rem',
          border: '1px solid #ccc',
          borderRadius: 6,
          fontSize: '1rem',
        }}
      />
      <button
        type="submit"
        style={{
          padding: '0.625rem 1.25rem',
          background: '#000',
          color: '#fff',
          border: 'none',
          borderRadius: 6,
          fontWeight: 600,
          cursor: 'pointer',
        }}
      >
        Search
      </button>
    </form>
  );
}
