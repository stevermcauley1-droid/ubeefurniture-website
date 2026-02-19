import Link from 'next/link';
import { getCollections } from '@/lib/shopify';
import { ShopifyTokenError } from '@/lib/shopify-errors';

export default async function CollectionsListPage() {
  let list: Array<{ id: string; handle: string; title: string; image: { url: string; altText: string | null; width: number; height: number } | null }> = [];
  let apiError: string | null = null;

  try {
    const result = await getCollections(20);
    const { collections } = result;
    const allCollections = collections.edges
      .map((e) => e.node)
      .filter((c) => c.handle !== 'frontpage');
    const uniqueCollections = new Map<string, (typeof allCollections)[0]>();
    allCollections.forEach((c) => {
      const existing = uniqueCollections.get(c.title);
      if (!existing || c.handle.localeCompare(existing.handle) > 0) {
        uniqueCollections.set(c.title, c);
      }
    });
    list = Array.from(uniqueCollections.values());
  } catch (err) {
    if (err instanceof ShopifyTokenError) {
      apiError = 'Store connection not configured. Add SHOPIFY_STOREFRONT_ACCESS_TOKEN to .env.local.';
    } else {
      apiError = err instanceof Error ? err.message : 'Could not load collections.';
    }
  }

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>
      <h1>Collections</h1>

      {apiError && (
        <div style={{ padding: '1.5rem', background: '#fef2f2', borderRadius: 8, marginTop: '1rem', color: '#991b1b' }}>
          <p style={{ margin: 0 }}>{apiError}</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
            Configure Storefront API in .env.local to show collections here.
          </p>
        </div>
      )}

      {!apiError && list.length === 0 && (
        <div style={{ padding: '2rem', textAlign: 'center', background: '#f8f8f8', borderRadius: 8, marginTop: '1rem' }}>
          <p style={{ margin: 0, color: '#666' }}>
            No collections available. Create collections in{' '}
            <a href={`https://${process.env.SHOPIFY_STORE_DOMAIN || 'your-store'}.myshopify.com/admin/collections`} target="_blank" rel="noopener noreferrer" style={{ color: '#0066cc' }}>
              Shopify Admin
            </a>
            .
          </p>
        </div>
      )}

      {!apiError && list.length > 0 && (
        <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: '1rem', listStyle: 'none', padding: 0, marginTop: '1rem' }}>
          {list.map((c) => (
            <li key={c.id}>
              <Link href={`/collections/${c.handle}`} style={{ display: 'block' }}>
                {c.image && (
                  <img
                    src={c.image.url}
                    alt={c.image.altText ?? c.title}
                    width={c.image.width}
                    height={c.image.height}
                    loading="lazy"
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                {!c.image && (
                  <div style={{ width: '100%', aspectRatio: '1', background: '#eee', borderRadius: 8 }} />
                )}
                <strong style={{ display: 'block', marginTop: '0.5rem' }}>{c.title}</strong>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
