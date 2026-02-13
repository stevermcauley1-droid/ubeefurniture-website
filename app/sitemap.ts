import { getProducts, getCollections } from '@/lib/shopify';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.com';

export const revalidate = 3600; // 1 hour

export default async function sitemap() {
  const staticRoutes: { url: string; lastModified: Date }[] = [
    { url: BASE, lastModified: new Date() },
    { url: `${BASE}/collections`, lastModified: new Date() },
    { url: `${BASE}/cart`, lastModified: new Date() },
    { url: `${BASE}/landlord`, lastModified: new Date() },
    { url: `${BASE}/blog`, lastModified: new Date() },
  ];

  let collections: { handle: string }[] = [];
  let products: { handle: string }[] = [];
  try {
    const [colRes, prodRes] = await Promise.all([getCollections(100), getProducts(250)]);
    collections = colRes.collections.edges.map((e) => ({ handle: e.node.handle }));
    products = prodRes.products.edges.map((e) => ({ handle: e.node.handle }));
  } catch {
    // env missing or API error
  }

  const collectionUrls = collections.map((c) => ({
    url: `${BASE}/collections/${c.handle}`,
    lastModified: new Date(),
  }));
  const productUrls = products.map((p) => ({
    url: `${BASE}/products/${p.handle}`,
    lastModified: new Date(),
  }));

  const blogSlugs = [
    'furniture-for-rental-properties',
    'landlord-furnishing-guide',
    'best-sofas-for-rentals',
    'furnished-let-checklist',
    'buy-to-let-furniture-tips',
    'quick-furnish-rental',
    'durable-furniture-rentals',
    'landlord-packages-explained',
    'vat-on-furniture-landlords',
    'furnished-vs-unfurnished',
  ];
  const blogUrls = blogSlugs.map((slug) => ({
    url: `${BASE}/blog/${slug}`,
    lastModified: new Date(),
  }));

  return [...staticRoutes, ...collectionUrls, ...productUrls, ...blogUrls];
}
