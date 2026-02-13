import Link from 'next/link';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { getCollectionByHandle } from '@/lib/shopify';
import type { CollectionSortKey } from '@/lib/shopify';
import { CollectionSort } from './CollectionSort';
import { BreadcrumbStructuredData } from '@/app/components/StructuredData';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.com';

interface PageProps {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ sort?: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  const { collection } = await getCollectionByHandle(handle, 1);
  if (!collection) return { title: 'Collection' };
  return {
    title: collection.title,
    description: `Shop ${collection.title} at Ubee Furniture.`,
    alternates: { canonical: `${BASE}/collections/${handle}` },
  };
}

const SORT_OPTIONS: { value: string; label: string; sortKey: CollectionSortKey; reverse: boolean }[] = [
  { value: 'default', label: 'Default', sortKey: 'COLLECTION_DEFAULT', reverse: false },
  { value: 'price-asc', label: 'Price: low to high', sortKey: 'PRICE', reverse: false },
  { value: 'price-desc', label: 'Price: high to low', sortKey: 'PRICE', reverse: true },
  { value: 'newest', label: 'Newest', sortKey: 'CREATED', reverse: true },
  { value: 'title', label: 'A–Z', sortKey: 'TITLE', reverse: false },
];

export default async function CollectionPage({ params, searchParams }: PageProps) {
  const { handle } = await params;
  const { sort: sortParam } = await searchParams;
  const option = SORT_OPTIONS.find((o) => o.value === sortParam) ?? SORT_OPTIONS[0];
  const { collection } = await getCollectionByHandle(
    handle,
    24,
    option.sortKey,
    option.reverse
  );
  if (!collection) notFound();

  const products = collection.products.edges.map((e) => e.node);

  const breadcrumbs = [
    { name: 'Home', url: BASE },
    { name: 'Collections', url: `${BASE}/collections` },
    { name: collection.title, url: `${BASE}/collections/${handle}` },
  ];

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <BreadcrumbStructuredData items={breadcrumbs} />
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>
      <h1>{collection.title}</h1>
      {collection.image && (
        <Image
          src={collection.image.url}
          alt={collection.image.altText ?? collection.title}
          width={collection.image.width ?? 400}
          height={collection.image.height ?? 400}
          sizes="(max-width: 768px) 100vw, 400px"
          priority
          style={{ maxWidth: 400, marginTop: '0.5rem', borderRadius: 8 }}
        />
      )}
      <CollectionSort handle={handle} currentSort={option.value} options={SORT_OPTIONS} />
      <ul style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', listStyle: 'none', marginTop: '1rem' }}>
        {products.map((p, i) => (
          <li key={p.id}>
            <Link href={`/products/${p.handle}`}>
              {p.featuredImage && (
                <Image
                  src={p.featuredImage.url}
                  alt={p.featuredImage.altText ?? p.title}
                  width={p.featuredImage.width ?? 400}
                  height={p.featuredImage.height ?? 400}
                  sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 200px"
                  priority={i < 4}
                  style={{ width: '100%', aspectRatio: '1', objectFit: 'cover', borderRadius: 8 }}
                />
              )}
              <strong>{p.title}</strong>
              {p.variants?.edges?.[0]?.node?.price && (
                <span> — {p.variants.edges[0].node.price.currencyCode} {p.variants.edges[0].node.price.amount}</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
