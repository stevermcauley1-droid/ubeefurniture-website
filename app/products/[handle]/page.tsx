import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify';
import { ProductForm } from '@/app/components/ProductForm';
import { ProductStructuredData } from '@/app/components/StructuredData';
import { TrackViewItem } from '@/app/components/TrackViewItem';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.com';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const { product } = await getProductByHandle(handle);
  if (!product) return { title: 'Product' };
  return {
    title: product.title,
    description: product.description?.slice(0, 160) ?? product.title,
    alternates: { canonical: `${BASE}/products/${handle}` },
  };
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  const { product } = await getProductByHandle(handle);
  if (!product) notFound();

  const [firstVariant] = product.variants.edges;
  const price = firstVariant?.node?.price;
  const images = product.images?.edges?.map((e) => e.node) ?? [];
  const displayImages = product.featuredImage
    ? [product.featuredImage, ...images.filter((img) => img.url !== product.featuredImage?.url)]
    : images;
  const isLandlordTagged =
    product.tags?.some((t) => t.toLowerCase().includes('landlord') || t.toLowerCase().includes('rental')) ?? false;
  const priceAmount = price ? parseFloat(price.amount) : 0;
  const priceCurrency = price?.currencyCode ?? 'GBP';

  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <TrackViewItem productId={product.id} productName={product.title} price={priceAmount} currency={priceCurrency} />
      <ProductStructuredData product={product} />
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '2rem', alignItems: 'start' }}>
        {/* Gallery */}
        <div>
          {displayImages.length > 0 ? (
            <div>
              <Image
                src={displayImages[0].url}
                alt={displayImages[0].altText ?? product.title}
                width={displayImages[0].width ?? 800}
                height={displayImages[0].height ?? 800}
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
                style={{ width: '100%', borderRadius: 8 }}
              />
              {displayImages.length > 1 && (
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                  {displayImages.slice(1, 6).map((img, i) => (
                    <Image
                      key={i}
                      src={img.url}
                      alt={img.altText ?? `${product.title} ${i + 2}`}
                      width={80}
                      height={80}
                      style={{ width: 80, height: 80, objectFit: 'cover', borderRadius: 4 }}
                    />
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div style={{ aspectRatio: '1', background: '#f0f0f0', borderRadius: 8 }} />
          )}
        </div>

        <div>
          <h1>{product.title}</h1>
          {price && (
            <p style={{ fontSize: '1.25rem', marginTop: '0.5rem' }}>
              {price.currencyCode} {price.amount}
            </p>
          )}
          <p style={{ marginTop: '1rem', whiteSpace: 'pre-wrap' }}>{product.description}</p>

          <div style={{ marginTop: '1.5rem' }}>
            <ProductForm product={product} priceAmount={priceAmount} priceCurrency={priceCurrency} />
          </div>

          {/* Delivery / lead time */}
          <p style={{ marginTop: '1.25rem', fontSize: '0.875rem', color: '#555' }}>
            <strong>Delivery:</strong> Standard delivery to most UK addresses. Lead times vary by item; we will confirm after order.
          </p>

          {/* Why this suits rentals — only if landlord-tagged */}
          {isLandlordTagged && (
            <div style={{ marginTop: '1.25rem', padding: '1rem', background: '#f8f8f8', borderRadius: 8 }}>
              <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Why this suits rentals</h3>
              <p style={{ fontSize: '0.875rem', margin: 0 }}>
                Durable and easy to maintain — ideal for furnished lets. Popular with landlords for quality and value.
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Specs placeholder — can be wired to metafields later */}
      <section style={{ marginTop: '2rem', paddingTop: '1.5rem', borderTop: '1px solid #eee' }}>
        <h2 style={{ fontSize: '1.125rem' }}>Details</h2>
        <p style={{ fontSize: '0.875rem', color: '#555' }}>
          Dimensions and full specs can be added via Shopify product metafields and displayed here.
        </p>
      </section>

      {/* FAQ placeholder */}
      <section style={{ marginTop: '1.5rem' }}>
        <h2 style={{ fontSize: '1.125rem' }}>FAQ</h2>
        <ul style={{ listStyle: 'none', padding: 0, fontSize: '0.875rem' }}>
          <li style={{ marginBottom: '0.5rem' }}><strong>Delivery time?</strong> We confirm after order.</li>
          <li style={{ marginBottom: '0.5rem' }}><strong>Returns?</strong> See our refund policy.</li>
        </ul>
      </section>
    </main>
  );
}
