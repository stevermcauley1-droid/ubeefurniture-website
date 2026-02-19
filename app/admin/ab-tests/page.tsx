import Link from 'next/link';
import { AB_TESTS } from '@/lib/ab-test';

/**
 * A/B Testing Dashboard — Phase 6
 * 
 * View active tests and manage variants.
 * See docs/AB-TEST-PLAN.md for test plans.
 */

export default function ABTestsPage() {
  return (
    <main style={{ maxWidth: 1000, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Admin</Link>
      
      <h1>A/B Testing</h1>
      <p style={{ color: '#555', marginTop: '0.5rem' }}>
        Manage and monitor A/B tests. See <code>docs/AB-TEST-PLAN.md</code> for detailed test plans.
      </p>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Available Tests</h2>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Test 1: Hero Messaging</h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
              <strong>Hypothesis:</strong> A landlord-first hero will increase clicks to landlord hub and package conversions.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant A (Control):</strong> Current hero — "Quality furniture for your home — and for landlords furnishing rental properties fast."</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant B:</strong> Landlord-first — "Furnish your rental property fast. Quality furniture packages for landlords — and for your home."</p>
              <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                <strong>Metric:</strong> Click-through rate to /landlord or add_to_cart from package collection
              </p>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Status:</strong> <span style={{ color: '#ffc107' }}>Ready to implement</span>
            </p>
          </div>

          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Test 2: Landlord CTA Prominence</h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
              <strong>Hypothesis:</strong> A more prominent landlord CTA on homepage will increase landlord hub visits.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant A (Control):</strong> Current two buttons (Shop furniture / Landlord packages)</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant B:</strong> Single primary CTA "Landlord packages" with secondary "Shop furniture"</p>
              <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                <strong>Metric:</strong> Clicks to /landlord; sessions that include visit to /landlord
              </p>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Status:</strong> <span style={{ color: '#ffc107' }}>Ready to implement</span>
            </p>
          </div>

          <div style={{ padding: '1rem', border: '1px solid #ddd', borderRadius: 8 }}>
            <h3 style={{ fontSize: '1rem', marginBottom: '0.5rem' }}>Test 3: Package Pricing Presentation</h3>
            <p style={{ fontSize: '0.875rem', color: '#666', marginBottom: '0.75rem' }}>
              <strong>Hypothesis:</strong> Showing "From £X" or clear single price on package cards will increase add_to_cart from collection.
            </p>
            <div style={{ fontSize: '0.875rem' }}>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant A (Control):</strong> Current product card (title + price)</p>
              <p style={{ margin: '0.25rem 0' }}><strong>Variant B:</strong> Add "From £X" or "Full package — £X" and short line like "Everything for a 2-bed"</p>
              <p style={{ margin: '0.5rem 0 0', color: '#666' }}>
                <strong>Metric:</strong> add_to_cart from collection pages (filter by collection handle = packages)
              </p>
            </div>
            <p style={{ marginTop: '0.75rem', fontSize: '0.875rem', color: '#666' }}>
              <strong>Status:</strong> <span style={{ color: '#ffc107' }}>Ready to implement</span>
            </p>
          </div>
        </div>
      </section>

      <section style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>How to Implement</h2>
        <ol style={{ marginLeft: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.8 }}>
          <li>Use <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>getABTestVariant()</code> from <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>lib/ab-test.ts</code></li>
          <li>Render variant A or B based on the returned value</li>
          <li>Call <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>trackABTestExposure()</code> to track which variant was shown</li>
          <li>Measure results in GA4 using custom events and dimensions</li>
          <li>Run tests for 1–2 weeks or 100+ conversions per variant before deciding</li>
        </ol>
        <p style={{ marginTop: '1rem', fontSize: '0.875rem', color: '#666' }}>
          <strong>Note:</strong> For production, consider using Vercel Edge Config, LaunchDarkly, or similar for more advanced A/B testing.
        </p>
      </section>
    </main>
  );
}
