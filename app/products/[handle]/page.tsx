import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProductByHandle } from '@/lib/shopify';
import { ProductForm } from '@/app/components/ProductForm';
import { ProductGallery } from '@/app/components/ProductGallery';
import { ProductFAQ } from '@/app/components/ProductFAQ';
import { ProductStructuredData } from '@/app/components/StructuredData';
import { TrackViewItem } from '@/app/components/TrackViewItem';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

interface PageProps {
  params: Promise<{ handle: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  try {
    const { product } = await getProductByHandle(handle);
    if (!product) return { title: 'Product' };
    return {
      title: product.title,
      description: product.description?.slice(0, 160) ?? product.title,
      alternates: { canonical: `${baseUrl}/products/${handle}` },
    };
  } catch {
    return { title: 'Product' };
  }
}

export default async function ProductPage({ params }: PageProps) {
  const { handle } = await params;
  let product: Awaited<ReturnType<typeof getProductByHandle>>['product'];
  try {
    const result = await getProductByHandle(handle);
    product = result.product;
  } catch {
    return (
      <main style={{ maxWidth: 600, margin: '0 auto', padding: '2rem 1rem' }}>
        <Link href="/collections" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Collections</Link>
        <h1>Product</h1>
        <p style={{ color: '#666' }}>
          We could not load this product. Check that Storefront API is configured in .env.local (see docs/env.local.phase2.template).
        </p>
      </main>
    );
  }
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
  
  // Extract category from product tags or use default
  const productCategory = product.tags?.find((t) => 
    ['sofa', 'bed', 'dining', 'package', 'furniture'].some(cat => t.toLowerCase().includes(cat))
  ) || 'Furniture';

  return (
    <main className="max-w-6xl mx-auto px-4 py-8">
      <TrackViewItem 
        productId={product.id} 
        productName={product.title} 
        price={priceAmount} 
        currency={priceCurrency}
        category={productCategory}
      />
      <ProductStructuredData product={product} />
      <Link href="/collections" className="inline-block mb-4 text-[var(--ubee-gray)] hover:text-[var(--ubee-black)] transition-colors">
        ← Back to Collections
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12 items-start">
        {/* Gallery */}
        <div>
          <ProductGallery images={displayImages} productTitle={product.title} />
        </div>

        {/* Product info */}
        <div className="space-y-4">
          <h1 className="text-2xl md:text-3xl font-bold text-[var(--ubee-black)]">{product.title}</h1>
          
          {price && (
            <p className="text-xl font-semibold text-[var(--ubee-black)]">
              {price.currencyCode} {price.amount}
            </p>
          )}

          {product.description && (
            <div className="prose prose-sm max-w-none text-[var(--ubee-gray)] whitespace-pre-wrap">
              {product.description}
            </div>
          )}

          {/* Variants & Add to cart */}
          <div className="pt-4 border-t border-gray-200">
            <ProductForm product={product} priceAmount={priceAmount} priceCurrency={priceCurrency} />
          </div>

          {/* Delivery info */}
          <div className="pt-4 border-t border-gray-200">
            <h3 className="text-sm font-semibold text-[var(--ubee-black)] mb-2">Delivery & Lead Time</h3>
            <p className="text-sm text-[var(--ubee-gray)]">
              Standard delivery to most UK addresses. Lead times vary by product; we confirm after order. Assembly available on request.
            </p>
          </div>

          {/* Landlord block — enhanced */}
          {isLandlordTagged && (
            <div className="pt-4 border-t border-gray-200">
              <div className="p-4 bg-[var(--ubee-yellow)] bg-opacity-10 border-l-4 border-[var(--ubee-yellow)] rounded">
                <h3 className="text-base font-semibold text-[var(--ubee-black)] mb-2">Perfect for Rental Properties</h3>
                <p className="text-sm text-[var(--ubee-gray)] mb-3">
                  Durable and easy to maintain — ideal for furnished lets. Popular with landlords for quality and value.
                </p>
                <Link
                  href="/landlords/catalogue"
                  className="inline-block text-sm font-semibold text-[var(--ubee-black)] hover:underline"
                >
                  Download Landlord Catalogue →
                </Link>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Specs section — ready for metafields */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-[var(--ubee-black)] mb-4">Product Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <p className="text-[var(--ubee-gray)] mb-2">
              <strong className="text-[var(--ubee-black)]">Dimensions:</strong> Available on request
            </p>
            <p className="text-[var(--ubee-gray)] mb-2">
              <strong className="text-[var(--ubee-black)]">Materials:</strong> See product description
            </p>
            <p className="text-[var(--ubee-gray)]">
              <strong className="text-[var(--ubee-black)]">Care instructions:</strong> Included with delivery
            </p>
          </div>
          <div>
            <p className="text-[var(--ubee-gray)] mb-2">
              <strong className="text-[var(--ubee-black)]">Warranty:</strong> Standard manufacturer warranty applies
            </p>
            <p className="text-[var(--ubee-gray)] mb-2">
              <strong className="text-[var(--ubee-black)]">Assembly:</strong> Available on request
            </p>
            <p className="text-[var(--ubee-gray)]">
              <strong className="text-[var(--ubee-black)]">Returns:</strong> 30-day returns policy applies
            </p>
          </div>
        </div>
        <p className="text-xs text-[var(--ubee-gray)] mt-4 italic">
          Full specifications can be added via Shopify product metafields and will display here automatically.
        </p>
      </section>

      {/* FAQ section */}
      <section className="mt-8 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-[var(--ubee-black)] mb-4">Frequently Asked Questions</h2>
        <ProductFAQ productTitle={product.title} />
      </section>
    </main>
  );
}
