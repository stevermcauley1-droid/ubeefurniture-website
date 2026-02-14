import Link from 'next/link';
import { getCollections } from '@/lib/shopify';
import { LandlordLeadForm } from './LandlordLeadForm';

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

export async function generateMetadata() {
  return {
    title: 'Landlord packages',
    description: 'Furnish a property fast with furniture packages for landlords. Request a quote or shop packages.',
    alternates: { canonical: `${baseUrl}/landlord` },
  };
}

/**
 * Landlord Hub — "Furnish a property fast", packages list, lead capture / quote request.
 * Packages = Option A: packages as Shopify products (e.g. collection "Packages").
 */
export default async function LandlordHubPage() {
  const { collections } = await getCollections(20);
  const packageCollections = collections.edges
    .map((e) => e.node)
    .filter(
      (c) =>
        c.handle.toLowerCase().includes('package') ||
        c.title.toLowerCase().includes('package')
    );
  const hasPackages = packageCollections.length > 0;

  return (
    <main style={{ maxWidth: 800, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>

      <section style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: 'clamp(1.5rem, 3vw, 2rem)', marginBottom: '0.5rem' }}>
          Furnish a property fast
        </h1>
        <p style={{ fontSize: '1.125rem', color: '#555', lineHeight: 1.6 }}>
          We help landlords get rental properties ready quickly with curated furniture packages.
          Choose a package or shop individual items — all with straightforward delivery and optional VAT invoices for your records.
        </p>
      </section>

      {hasPackages && (
        <section style={{ marginBottom: '2rem' }}>
          <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Packages</h2>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            {packageCollections.map((c) => (
              <li key={c.id} style={{ marginBottom: '0.75rem' }}>
                <Link
                  href={`/collections/${c.handle}`}
                  style={{
                    display: 'inline-block',
                    padding: '0.75rem 1.25rem',
                    background: '#f0f0f0',
                    borderRadius: 6,
                    fontWeight: 600,
                  }}
                >
                  {c.title} →
                </Link>
              </li>
            ))}
          </ul>
          <p style={{ fontSize: '0.875rem', color: '#555', marginTop: '0.5rem' }}>
            Each package is a single product you can add to cart and checkout as usual. Need a custom quote? Use the form below.
          </p>
        </section>
      )}

      {!hasPackages && (
        <section style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f8f8', borderRadius: 8 }}>
          <p style={{ margin: 0 }}>
            Create a &quot;Packages&quot; collection in Shopify and add package products to it — they will appear here.
            Meanwhile, <Link href="/collections">browse all collections</Link>.
          </p>
        </section>
      )}

      {/* AEO-style Q&A — answer-first for AI answer engines */}
      <section style={{ marginBottom: '2rem', padding: '1rem', background: '#f8f8f8', borderRadius: 8 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Frequently asked</h2>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>How do I furnish a rental property quickly?</p>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#444' }}>
              Choose one of our landlord packages (each is a single product you add to cart) or shop individual items. We deliver to most UK addresses and can confirm lead times after order.
            </p>
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>Can I get a VAT invoice?</p>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#444' }}>
              Yes. Enter your company name and VAT number at checkout. We use this for invoice generation. See our VAT/Invoice guide for details.
            </p>
          </div>
          <div>
            <p style={{ fontWeight: 600, marginBottom: '0.25rem' }}>What is included in a landlord package?</p>
            <p style={{ margin: 0, fontSize: '0.9375rem', color: '#444' }}>
              Each package is a bundle described on the product page (e.g. 2-bed package). Add the package to cart and checkout once; we handle the rest.
            </p>
          </div>
        </div>
      </section>

      <section id="quote">
        <h2 style={{ fontSize: '1.25rem', marginBottom: '0.75rem' }}>Request a quote</h2>
        <p style={{ fontSize: '0.9375rem', color: '#555', marginBottom: '1rem' }}>
          Tell us about your property and we’ll get back with a tailored package or quote.
        </p>
        <LandlordLeadForm />
      </section>
    </main>
  );
}
