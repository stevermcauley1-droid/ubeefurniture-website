import type { StorefrontProduct } from '@/lib/types';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

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
    url: `${baseUrl}/products/${product.handle}`,
  };

  const breadcrumbSchema = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Home', item: baseUrl },
      { '@type': 'ListItem', position: 2, name: product.title, item: `${baseUrl}/products/${product.handle}` },
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
      item: item.url.startsWith('http') ? item.url : `${baseUrl}${item.url}`,
    })),
  };
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(schema) }}
    />
  );
}

interface CollectionFAQStructuredDataProps {
  collectionTitle: string;
}

export function CollectionFAQStructuredData({ collectionTitle }: CollectionFAQStructuredDataProps) {
  const faqSchema = {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: [
      {
        '@type': 'Question',
        name: `What furniture is best for ${collectionTitle.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Our ${collectionTitle.toLowerCase()} collection features durable, well-designed pieces suitable for both homes and rental properties. Each product includes detailed specifications and delivery information on its product page.`,
        },
      },
      {
        '@type': 'Question',
        name: `How do I choose the right ${collectionTitle.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: `Browse our ${collectionTitle.toLowerCase()} collection and use the sort options to filter by price, newest, or title. Click any product to see full details, variants, and specifications.`,
        },
      },
      {
        '@type': 'Question',
        name: `What is the delivery time for ${collectionTitle.toLowerCase()}?`,
        acceptedAnswer: {
          '@type': 'Answer',
          text: 'Delivery times vary by product. We confirm lead times after order. Standard delivery applies to most UK addresses. See individual product pages for more details.',
        },
      },
    ],
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }}
    />
  );
}
