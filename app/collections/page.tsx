import Link from 'next/link';
import { getCollections } from '@/lib/shopify';

export default async function CollectionsListPage() {
  const { collections } = await getCollections(20);
  const list = collections.edges.map((e) => e.node);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>
      <h1>Collections</h1>
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
    </main>
  );
}
