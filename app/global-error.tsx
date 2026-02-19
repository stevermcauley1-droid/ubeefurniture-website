'use client';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body style={{ fontFamily: 'system-ui, sans-serif', padding: '2rem', maxWidth: 600, margin: '0 auto' }}>
        <h1 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Something went wrong</h1>
        <p style={{ color: '#666', marginBottom: '1.5rem' }}>
          The app hit an error. Try refreshing or going back to the home page.
        </p>
        <button
          type="button"
          onClick={() => reset()}
          style={{
            padding: '0.5rem 1rem',
            background: '#facc15',
            color: '#1a1a1a',
            border: 'none',
            borderRadius: 6,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Try again
        </button>
        <a
          href="/"
          style={{
            display: 'inline-block',
            marginLeft: '0.75rem',
            padding: '0.5rem 1rem',
            border: '1px solid #1a1a1a',
            borderRadius: 6,
            color: '#1a1a1a',
            textDecoration: 'none',
            fontWeight: 600,
          }}
        >
          Go to home
        </a>
      </body>
    </html>
  );
}
