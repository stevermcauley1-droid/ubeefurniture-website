import Link from 'next/link';
import Image from 'next/image';
import { getProducts, getCollections, ShopifyTokenError } from '@/lib/shopify';
import { ShopifyTokenErrorPanel } from '@/app/components/ShopifyTokenErrorPanel';
import { TrackQuoteClick } from '@/app/components/TrackQuoteClick';

/** Revalidate homepage every 60s (ISR). */
export const revalidate = 60;

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
    // Add timeout wrapper to prevent hanging (12s total timeout)
    const timeoutPromise = new Promise<never>((_, reject) => 
      setTimeout(() => reject(new Error('Shopify API request timeout after 12s')), 12000)
    );
    
    const apiCalls = Promise.all([
      getProducts(8),
      getCollections(10),
    ]);
    
    const [productsRes, collectionsRes] = await Promise.race([
      apiCalls,
      timeoutPromise,
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

  const otherCollections = collections.filter((c) => c.node.handle !== 'frontpage');

  return (
    <main>
      {/* Hero — landlord + retail CTAs (LCP-optimized) */}
      <section className="relative min-h-[400px] overflow-hidden">
        <div className="relative w-full aspect-video min-h-[400px]">
          <Image
            src="/hero-clean.webp"
            alt="Complete Property Furniture Packages"
            fill
            priority
            quality={80}
            sizes="100vw"
            className="object-cover"
          />
        </div>
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 w-full max-w-[400px] px-4">
          <TrackQuoteClick
            href="/landlords#quote"
            className="block w-full py-3.5 px-6 rounded-md font-bold text-center bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] transition-colors"
          >
            Get a Fast Furnishing Quote
          </TrackQuoteClick>
          <Link
            href="/landlord-solutions/packages"
            className="block w-full py-3.5 px-6 rounded-md font-semibold text-center bg-white text-[var(--ubee-black)] border-2 border-[var(--ubee-black)] hover:bg-gray-50 transition-colors"
          >
            View Landlord Packages
          </Link>
          <Link
            href="/landlords/catalogue"
            className="block w-full py-2.5 px-6 rounded-md text-sm font-medium text-center text-[var(--ubee-black)] underline hover:no-underline"
          >
            Download Landlord Catalogue (PDF)
          </Link>
        </div>
      </section>

      {/* Trust strip */}
      <section className="py-4 bg-gray-100 text-sm text-center">
        <p className="m-0 text-[var(--ubee-gray)]">
          Trusted by landlords and homeowners · UK delivery · Quality assured
        </p>
      </section>

      {/* Category entry + featured collections */}
      <section className="max-w-6xl mx-auto px-4 py-8">
        <h2 className="text-xl font-semibold text-[var(--ubee-black)] mb-4">Shop by category</h2>
        <ul className="flex flex-wrap gap-2 list-none p-0">
          {otherCollections.slice(0, 6).map((c) => (
            <li key={c.node.id}>
              <Link
                href={`/collections/${c.node.handle}`}
                className="inline-block py-2 px-4 bg-gray-200 rounded text-[var(--ubee-black)] font-medium hover:bg-[var(--ubee-yellow)] transition-colors"
              >
                {c.node.title}
              </Link>
            </li>
          ))}
        </ul>

        {/* Featured products */}
        <h2 className="text-xl font-semibold text-[var(--ubee-black)] mt-8 mb-4">Featured</h2>
        {tokenErrorStatus && (
          <ShopifyTokenErrorPanel status={tokenErrorStatus} message={error ?? undefined} />
        )}
        {error && !tokenErrorStatus && (
          <p className="text-red-600">{error}</p>
        )}
        <ul className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4 list-none p-0">
          {products.map((e, i) => (
            <li key={e.node.id} className="min-h-0">
              <Link href={`/products/${e.node.handle}`} className="block group">
                {e.node.featuredImage && (
                  <span className="block w-full aspect-square overflow-hidden rounded-lg bg-gray-100">
                    <Image
                      src={e.node.featuredImage.url}
                      alt={e.node.featuredImage.altText ?? e.node.title}
                      width={e.node.featuredImage.width ?? 400}
                      height={e.node.featuredImage.height ?? 400}
                      sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                      priority={i < 2}
                      className="w-full h-full object-cover group-hover:opacity-95 transition-opacity"
                    />
                  </span>
                )}
                <strong className="block mt-2 text-[var(--ubee-black)]">{e.node.title}</strong>
                {e.node.variants?.edges?.[0]?.node?.price && (
                  <span className="text-sm text-[var(--ubee-gray)]">
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
