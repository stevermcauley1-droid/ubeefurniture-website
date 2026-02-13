import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getCollections, ShopifyTokenError } from '@/lib/shopify';
import { ShopifyTokenErrorPanel } from '@/app/components/ShopifyTokenErrorPanel';

/**
 * Homepage — conversion-focused: hero (landlord + retail), category entry,
 * landlord packages highlight, trust strip, featured collections.
 */
export default async function HomePage() {
  let products: Awaited<ReturnType<typeof getProducts>>['products']['edges'];
  let collections: Awaited<ReturnType<typeof getCollections>>['collections']['edges'];
  let error: string | null = null;
  let tokenErrorStatus: 'domain_ok' | 'token_missing' | 'token_invalid' | 'wrong_type' | null = null;

  try {
    const [productsRes, collectionsRes] = await Promise.all([
      getProducts(8),
      getCollections(10),
    ]);
    products = productsRes.products.edges;
    collections = collectionsRes.collections.edges;
  } catch (err) {
    if (err instanceof ShopifyTokenError) {
      tokenErrorStatus = err.code === 'WRONG_TYPE' ? 'wrong_type' : err.code === 'INVALID' ? 'token_invalid' : 'token_missing';
      error = err.message;
    } else {
      error = err instanceof Error ? err.message : 'Could not load data';
    }
    products = [];
    collections = [];
  }

  const packageCollection = collections.find(
    (c) =>
      c.node.handle.toLowerCase().includes('package') ||
      c.node.title.toLowerCase().includes('package')
  );
  const otherCollections = collections.filter((c) => c.node.id !== packageCollection?.node.id);

  return (
    <main>
      {/* Hero — furnished room imagery with landlord-focused CTAs */}
      <section style={{ position: 'relative', minHeight: 400, overflow: 'hidden' }}>
        <Image
          src="/images/hero.png"
          alt="Complete property furniture packages for landlords — furnished living room"
          width={1920}
          height={1080}
          priority
          style={{
            width: '100%',
            height: 'auto',
            minHeight: 400,
            objectFit: 'cover',
            objectPosition: 'center',
          }}
        />
        <div
          style={{
            position: 'absolute',
            bottom: '2rem',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: '0.75rem',
            width: '100%',
            maxWidth: 400,
            padding: '0 1rem',
          }}
        >
          <Link
            href="/landlord#quote"
            style={{
              display: 'block',
              width: '100%',
              padding: '0.875rem 1.5rem',
              background: '#F5C518',
              color: '#1a1a1a',
              borderRadius: 6,
              fontWeight: 700,
              textAlign: 'center',
            }}
          >
            Get a Fast Furnishing Quote
          </Link>
          <Link
            href="/landlord"
            style={{
              display: 'block',
              width: '100%',
              padding: '0.875rem 1.5rem',
              background: '#fff',
              color: '#1a1a1a',
              border: '2px solid #1a1a1a',
              borderRadius: 6,
              fontWeight: 600,
              textAlign: 'center',
            }}
          >
            View Landlord Packages
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section style={{ padding: '1rem', background: '#f0f0f0', fontSize: '0.875rem', textAlign: 'center' }}>
        <p style={{ margin: 0 }}>
          Trusted by landlords and homeowners · UK delivery · Quality assured
        </p>
      </section>

      {/* Category entry + featured collections */}
      <section style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Shop by category</h2>
        <ul style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', listStyle: 'none', padding: 0 }}>
          {otherCollections.slice(0, 6).map((c) => (
            <li key={c.node.id}>
              <Link
                href={`/collections/${c.node.handle}`}
                style={{
                  padding: '0.5rem 1rem',
                  background: '#eee',
                  borderRadius: 4,
                  display: 'inline-block',
                }}
              >
                {c.node.title}
              </Link>
            </li>
          ))}
        </ul>

        {/* Landlord packages highlight */}
        {packageCollection && (
          <div style={{ marginTop: '2rem', padding: '1.5rem', background: '#f8f8f8', borderRadius: 8 }}>
            <h2 style={{ fontSize: '1.25rem', marginBottom: '0.5rem' }}>Landlord packages</h2>
            <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '1rem' }}>
              Furnish a property fast with our ready-made packages.
            </p>
            <Link
              href={`/collections/${packageCollection.node.handle}`}
              style={{
                padding: '0.5rem 1rem',
                background: '#000',
                color: '#fff',
                borderRadius: 4,
                fontWeight: 600,
                display: 'inline-block',
              }}
            >
              View packages
            </Link>
          </div>
        )}

        {/* Featured products */}
        <h2 style={{ fontSize: '1.25rem', marginTop: '2rem', marginBottom: '1rem' }}>Featured</h2>
        {tokenErrorStatus && (
          <ShopifyTokenErrorPanel status={tokenErrorStatus} message={error ?? undefined} />
        )}
        {error && !tokenErrorStatus && (
          <p style={{ color: 'crimson' }}>{error}</p>
        )}
        <ul
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '1rem',
            listStyle: 'none',
            padding: 0,
          }}
        >
          {products.map((e, i) => (
            <li key={e.node.id} style={{ minHeight: 0 }}>
              <Link href={`/products/${e.node.handle}`}>
                {e.node.featuredImage && (
                  <Image
                    src={e.node.featuredImage.url}
                    alt={e.node.featuredImage.altText ?? e.node.title}
                    width={e.node.featuredImage.width ?? 400}
                    height={e.node.featuredImage.height ?? 400}
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                    priority={i < 4}
                    style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                  />
                )}
                <strong style={{ display: 'block', marginTop: '0.5rem' }}>{e.node.title}</strong>
                {e.node.variants?.edges?.[0]?.node?.price && (
                  <span style={{ fontSize: '0.875rem', color: '#555' }}>
                    {e.node.variants.edges[0].node.price.currencyCode} {e.node.variants.edges[0].node.price.amount}
                  </span>
                )}
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </main>
  );
}
