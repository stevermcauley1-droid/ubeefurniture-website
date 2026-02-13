import type { StorefrontProduct } from '@/lib/types';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.com';

interface ProductStructuredDataProps {
  product: StorefrontProduct;
}

export function ProductStructuredData({ product }: ProductStructuredDataProps) {
  const [firstVariant] = product.variants.edges;
  const price = firstVariant?.node?.price;
  const image = product.featuredImage?.url;

  const productSchema = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    description: product.description?.slice(0, 500) ?? product.title,
    ...(image && { image: [image] }),
    ...(price && {
      offers: {
        '@type': 'Offer',
        price: price.amount,
        priceCurrency: price.currencyCode,
        availability: product.availableForSale
          ? 'https://schema.org/InStock'
          : 'https://schema.org/OutOfStock',
      },
    }),
    url: `${BASE}/products/${product.handle}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: BASE },
      { '@type': 'ListItem', position: 2, name: product.title, item: `${BASE}/products/${product.handle}` },
    ],
  };

  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: 'What is the delivery time?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'We confirm delivery time after order. Standard delivery applies to most UK addresses.',
        },
      },
      {
        '@type': 'Question',
        name: 'What is your returns policy?',
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'See our refund and returns policy on the website.',
        },
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
      />
    </>
  );
}

interface BreadcrumbStructuredDataProps {
  items: { name: string; url: string }[];
}

export function BreadcrumbStructuredData({ items }: BreadcrumbStructuredDataProps) {
  const schema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: item.name,
      item: item.url.startsWith('http') ? item.url : `${BASE}${item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}
