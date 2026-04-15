'use client';

import { useEffect } from 'react';

/**
 * Canonical hub is /landlord (packages + quote form). Preserve #quote and other hashes from old links.
 */
export default function LandlordsToLandlordRedirect() {
  useEffect(() => {
    const hash = typeof window !== 'undefined' ? window.location.hash || '' : '';
    window.location.replace(`/landlord${hash}`);
  }, []);

  return (
    <main className="max-w-lg mx-auto px-4 py-16 text-center text-[var(--ubee-gray)] text-sm">
      Redirecting to landlord hub…
    </main>
  );
}
