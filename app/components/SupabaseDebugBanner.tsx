'use client';

import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type Status = 'idle' | 'loading' | 'ok' | 'fail';

export function SupabaseDebugBanner() {
  const searchParams = useSearchParams();
  const [status, setStatus] = useState<Status>('idle');
  const [message, setMessage] = useState<string>('');

  const show = searchParams.get('debug') === 'supabase';

  useEffect(() => {
    if (!show) return;
    setStatus('loading');
    fetch('/api/health/supabase')
      .then((res) => res.json())
      .then((data) => {
        if (data.ok) {
          setStatus('ok');
          setMessage('');
        } else {
          setStatus('fail');
          setMessage(data.message || data.error || 'Unknown');
        }
      })
      .catch(() => {
        setStatus('fail');
        setMessage('Request failed');
      });
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="fixed bottom-4 left-4 right-4 z-50 mx-auto max-w-md rounded border bg-white px-4 py-2 shadow-lg sm:left-auto sm:right-4"
      role="status"
      aria-live="polite"
    >
      {status === 'loading' && (
        <span className="text-sm text-gray-600">Supabase: checking…</span>
      )}
      {status === 'ok' && (
        <span className="text-sm font-medium text-green-700">Supabase: OK</span>
      )}
      {status === 'fail' && (
        <div>
          <span className="text-sm font-medium text-red-700">Supabase: FAIL</span>
          {message && <p className="mt-0.5 text-xs text-red-600">{message}</p>}
        </div>
      )}
    </div>
  );
}
