import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCollectionByHandle } from '@/lib/shopify';
import type { CollectionSortKey } from '@/lib/shopify';
import { CollectionSort } from './CollectionSort';
import { CollectionFilters } from './CollectionFilters';
import { CollectionFiltersMobile } from './CollectionFiltersMobile';
import { CollectionProducts } from './CollectionProducts';
import { BreadcrumbStructuredData, CollectionFAQStructuredData } from '@/app/components/StructuredData';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

interface PageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string; minPrice?: string; maxPrice?: string; availability?: string; tag?: string }>;
}

const SORT_OPTIONS: { value: string; label: string; sortKey: CollectionSortKey; reverse: boolean }[] = [
  { value: 'default', label: 'Default', sortKey: 'COLLECTION_DEFAULT', reverse: false },
  { value: 'price-asc', label: 'Price: low to high', sortKey: 'PRICE', reverse: false },
  { value: 'price-desc', label: 'Price: high to low', sortKey: 'PRICE', reverse: true },
  { value: 'newest', label: 'Newest', sortKey: 'CREATED', reverse: true },
  { value: 'title', label: 'A–Z', sortKey: 'TITLE', reverse: false },
];

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  try {
    const { collection } = await getCollectionByHandle(handle, 1);
    if (!collection) return { title: 'Collection' };
    return {
      title: collection.title,
      description: `Shop ${collection.title} at Ubee Furniture.`,
      alternates: { canonical: `${baseUrl}/collections/${handle}` },
    };
  } catch {
    return { title: 'Collection' };
  }
}

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const { sort: sortParam } = await searchParams;
  if (!handle || typeof handle !== 'string') notFound();

  const option = SORT_OPTIONS.find((o) => o.value === sortParam) ?? SORT_OPTIONS[0];
  let collection: Awaited<ReturnType<typeof getCollectionByHandle>>['collection'];
  try {
    // Fetch more products to allow client-side filtering
    const result = await getCollectionByHandle(
      handle,
      100,
      option.sortKey,
      option.reverse
    );
    collection = result.collection;
  } catch {
    return (
      <main className="max-w-2xl mx-auto px-4 py-12">
        <Link href="/collections" className="inline-block mb-4 text-[var(--ubee-gray)] hover:text-[var(--ubee-black)]">← All collections</Link>
        <h1 className="text-2xl font-bold mb-4">Collection</h1>
        <p className="text-[var(--ubee-gray)]">
          We could not load this collection. Check that Storefront API is configured in .env.local (see docs/env.local.phase2.template).
        </p>
      </main>
    );
  }
  if (!collection) notFound();

  const products = collection.products.edges.map((e) => e.node);

  const breadcrumbs = [
    { name: 'Home', url: baseUrl },
    { name: 'Collections', url: `${baseUrl}/collections` },
    { name: collection.title, url: `${baseUrl}/collections/${handle}` },
  ];

  return (
    <main className="max-w-7xl mx-auto px-4 py-8">
      <BreadcrumbStructuredData items={breadcrumbs} />
      <CollectionFAQStructuredData collectionTitle={collection.title} />
      <Link href="/collections" className="inline-block mb-4 text-[var(--ubee-gray)] hover:text-[var(--ubee-black)] transition-colors">
        ← All collections
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-[var(--ubee-black)]">{collection.title}</h1>
        {collection.description && (
          <p className="mt-2 text-[var(--ubee-gray)] max-w-3xl">
            {collection.description}
          </p>
        )}
        {collection.image && (
          <div className="mt-4 max-w-md">
            <Image
              src={collection.image.url}
              alt={collection.image.altText ?? collection.title}
              width={collection.image.width ?? 400}
              height={collection.image.height ?? 400}
              sizes="(max-width: 768px) 100vw, 400px"
              priority
              className="w-full rounded-lg"
            />
          </div>
        )}
      </div>

      {/* Mobile filters button */}
      <div className="mb-4 md:hidden">
        <CollectionFiltersMobile handle={handle} products={products} />
      </div>

      {/* Filters + Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-[250px_1fr] gap-6 lg:gap-8">
        {/* Desktop filters sidebar */}
        <aside className="hidden md:block">
          <div className="sticky top-24">
            <CollectionFilters handle={handle} products={products} />
          </div>
        </aside>

        {/* Products + Sort */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <CollectionSort handle={handle} currentSort={option.value} options={SORT_OPTIONS} />
          </div>
          <CollectionProducts products={products} handle={handle} />
        </div>
      </div>

      {/* FAQ section */}
      <section className="mt-12 pt-8 border-t border-gray-200">
        <h2 className="text-xl font-semibold text-[var(--ubee-black)] mb-4">Frequently asked</h2>
        <div className="space-y-4">
          <div>
            <p className="font-semibold text-[var(--ubee-black)] mb-1">What furniture is best for {collection.title.toLowerCase()}?</p>
            <p className="text-sm text-[var(--ubee-gray)]">
              Our {collection.title.toLowerCase()} collection features durable, well-designed pieces suitable for both homes and rental properties. Each product includes detailed specifications and delivery information on its product page.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ubee-black)] mb-1">How do I choose the right {collection.title.toLowerCase()}?</p>
            <p className="text-sm text-[var(--ubee-gray)]">
              Browse our {collection.title.toLowerCase()} collection and use the filters and sort options to find products by price, availability, or tags. Click any product to see full details, variants, and specifications.
            </p>
          </div>
          <div>
            <p className="font-semibold text-[var(--ubee-black)] mb-1">What is the delivery time for {collection.title.toLowerCase()}?</p>
            <p className="text-sm text-[var(--ubee-gray)]">
              Delivery times vary by product. We confirm lead times after order. Standard delivery applies to most UK addresses. See individual product pages for more details.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}
