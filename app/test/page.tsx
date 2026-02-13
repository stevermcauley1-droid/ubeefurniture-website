/**
 * Minimal test page — no Shopify, no external fetches.
 * Use to verify the dev server responds: http://localhost:3002/test
 */
export default function TestPage() {
  return (
    <main style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>Server OK</h1>
      <p>If you see this, Next.js is responding. The issue is likely Shopify API or another route.</p>
      <p><a href="/">← Home</a></p>
    </main>
  );
}
