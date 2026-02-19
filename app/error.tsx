'use client';

import { useEffect } from 'react';
import Link from 'next/link';

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error('Route error:', error);
  }, [error]);

  return (
    <main className="max-w-lg mx-auto px-4 py-12 text-center">
      <h1 className="text-xl font-semibold text-[var(--ubee-black)] mb-2">Something went wrong</h1>
      <p className="text-[var(--ubee-gray)] mb-6">We could not load this page.</p>
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        <button type="button" onClick={reset} className="px-4 py-2 bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] font-semibold rounded">
          Try again
        </button>
        <Link href="/" className="px-4 py-2 border border-[var(--ubee-black)] text-[var(--ubee-black)] font-semibold rounded hover:bg-gray-100">
          Go to home
        </Link>
      </div>
    </main>
  );
}
