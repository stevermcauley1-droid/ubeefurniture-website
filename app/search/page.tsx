import Link from 'next/link';
import Image from 'next/image';
import { searchProducts } from '@/lib/shopify';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

interface SearchPageProps {
  searchParams: Promise<{ q?: string }>;
}

export async function generateMetadata({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  return {
    title: query ? `Search: ${query} | Ubee Furniture` : 'Search | Ubee Furniture',
    description: query
      ? `Search results for "${query}" at Ubee Furniture.`
      : 'Search furniture and landlord packages.',
    alternates: { canonical: `${baseUrl}/search${query ? `?q=${encodeURIComponent(query)}` : ''}` },
  };
}

export default async function SearchPage({ searchParams }: SearchPageProps) {
  const { q } = await searchParams;
  const query = q?.trim() ?? '';
  const { products } = await searchProducts(query, 24);
  const results = products.edges.map((e) => e.node);

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>
        ← Home
      </Link>

      <form action="/search" method="GET" style={{ marginBottom: '1.5rem', display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
        <input
          type="search"
          name="q"
          defaultValue={query}
          placeholder="Search products..."
          style={{
            padding: '0.5rem 0.75rem',
            border: '1px solid #ddd',
            borderRadius: 4,
            fontSize: '1rem',
            minWidth: 200,
            flex: 1,
          }}
        />
        <button
          type="submit"
          style={{
            padding: '0.5rem 1.25rem',
            background: '#000',
            color: '#fff',
            border: 'none',
            borderRadius: 4,
            fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          Search
        </button>
      </form>

      <h1 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>
        {query ? `Search results for "${query}"` : 'Search'}
      </h1>

      {!query ? (
        <p style={{ color: '#555' }}>
          Enter a search term in the navigation bar to find products.
        </p>
      ) : results.length === 0 ? (
        <p style={{ color: '#555' }}>
          No products found for &quot;{query}&quot;. Try a different term or{' '}
          <Link href="/collections">browse collections</Link>.
        </p>
      ) : (
        <>
          <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '1rem' }}>
            {results.length} product{results.length !== 1 ? 's' : ''} found
          </p>
          <ul
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
              gap: '1rem',
              listStyle: 'none',
              padding: 0,
            }}
          >
            {results.map((p) => (
              <li key={p.id}>
                <Link href={`/products/${p.handle}`}>
                  {p.featuredImage && (
                    <Image
                      src={p.featuredImage.url}
                      alt={p.featuredImage.altText ?? p.title}
                      width={p.featuredImage.width ?? 400}
                      height={p.featuredImage.height ?? 400}
                      sizes="(max-width: 640px) 50vw, 200px"
                      style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                    />
                  )}
                  <strong style={{ display: 'block', marginTop: '0.5rem' }}>{p.title}</strong>
                  {p.variants?.edges?.[0]?.node?.price && (
                    <span style={{ fontSize: '0.875rem', color: '#555' }}>
                      {p.variants.edges[0].node.price.currencyCode} {p.variants.edges[0].node.price.amount}
                    </span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </>
      )}
    </main>
  );
}
