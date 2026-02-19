import Link from 'next/link';
import { isGAEnabled } from '@/lib/analytics';

/**
 * Conversion Dashboard — Phase 6
 * 
 * This page provides guidance on tracking conversion metrics.
 * For actual data visualization, connect GA4 to Looker Studio or use GA4's built-in reports.
 */

export default function AnalyticsDashboard() {
  const gaEnabled = isGAEnabled();

  return (
    <main style={{ maxWidth: 1200, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/admin" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Admin</Link>
      
      <h1>Conversion Dashboard</h1>
      
      {!gaEnabled && (
        <div style={{ padding: '1rem', background: '#fff3cd', borderRadius: 8, marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>⚠️ GA4 not configured</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
            Add NEXT_PUBLIC_GA4_MEASUREMENT_ID to .env.local to enable analytics tracking.
          </p>
        </div>
      )}

      {gaEnabled && (
        <div style={{ padding: '1rem', background: '#d4edda', borderRadius: 8, marginBottom: '1.5rem' }}>
          <p style={{ margin: 0, fontWeight: 600 }}>✅ GA4 is enabled</p>
          <p style={{ margin: '0.5rem 0 0', fontSize: '0.875rem' }}>
            View your data in{' '}
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
              Google Analytics
            </a>
            {' '}or connect to Looker Studio for custom dashboards.
          </p>
        </div>
      )}

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Tracked Events</h2>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.9375rem' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ddd', textAlign: 'left' }}>
              <th style={{ padding: '0.75rem 0.5rem' }}>Event</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>When</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Where</th>
              <th style={{ padding: '0.75rem 0.5rem' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>view_item</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>User views product page</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>Product page</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>
                <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Active</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>add_to_cart</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>User adds to cart</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>AddToCartButton</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>
                <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Active</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>begin_checkout</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>User clicks checkout</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>Cart page</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>
                <span style={{ color: '#28a745', fontWeight: 600 }}>✅ Active</span>
              </td>
            </tr>
            <tr style={{ borderBottom: '1px solid #eee' }}>
              <td style={{ padding: '0.75rem 0.5rem', fontWeight: 600 }}>purchase</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>Order completed</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>Shopify webhook</td>
              <td style={{ padding: '0.75rem 0.5rem' }}>
                <span style={{ color: '#ffc107', fontWeight: 600 }}>⚠️ Setup required</span>
              </td>
            </tr>
          </tbody>
        </table>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Weekly Metrics to Track</h2>
        <ul style={{ listStyle: 'none', padding: 0 }}>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>Sessions</strong> — Total site visits (GA4)
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>Conversion Rate</strong> — Purchases / Sessions (or begin_checkout / Sessions as proxy)
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>AOV (Average Order Value)</strong> — Total revenue / Orders (Shopify or GA4)
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>Cart Events</strong> — add_to_cart and begin_checkout counts
          </li>
          <li style={{ padding: '0.5rem 0', borderBottom: '1px solid #eee' }}>
            <strong>Traffic Sources</strong> — Top channels, bounce rate
          </li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem', padding: '1rem', background: '#f8f9fa', borderRadius: 8 }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>Setup Instructions</h2>
        
        <h3 style={{ fontSize: '1rem', marginTop: '1rem', marginBottom: '0.5rem' }}>1. Purchase Event Tracking</h3>
        <ol style={{ marginLeft: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.8 }}>
          <li>In Shopify Admin → Settings → Notifications → Webhooks</li>
          <li>Create webhook: <strong>Order creation</strong>, JSON format</li>
          <li>URL: <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>https://yourdomain.com/api/shopify-webhook</code></li>
          <li>Add <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>SHOPIFY_WEBHOOK_SECRET</code> to .env.local</li>
          <li>Get GA4 API Secret from GA4 Admin → Data Streams → Measurement Protocol</li>
          <li>Add <code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>GA4_API_SECRET</code> to .env.local</li>
        </ol>

        <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>2. Heatmaps & Session Replay</h3>
        <p style={{ fontSize: '0.9375rem', marginBottom: '0.5rem' }}>
          Optional: Add to .env.local:
        </p>
        <ul style={{ marginLeft: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.8 }}>
          <li><code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>NEXT_PUBLIC_HOTJAR_ID</code> (for Hotjar)</li>
          <li><code style={{ background: '#fff', padding: '0.125rem 0.25rem', borderRadius: 3 }}>NEXT_PUBLIC_CLARITY_ID</code> (for Microsoft Clarity)</li>
        </ul>

        <h3 style={{ fontSize: '1rem', marginTop: '1.5rem', marginBottom: '0.5rem' }}>3. View Data</h3>
        <ul style={{ marginLeft: '1.5rem', fontSize: '0.9375rem', lineHeight: 1.8 }}>
          <li>
            <a href="https://analytics.google.com" target="_blank" rel="noopener noreferrer">
              Google Analytics 4
            </a>
            {' '}— Built-in reports
          </li>
          <li>
            <a href="https://datastudio.google.com" target="_blank" rel="noopener noreferrer">
              Looker Studio
            </a>
            {' '}— Connect GA4 for custom dashboards
          </li>
        </ul>
      </section>

      <section style={{ marginTop: '2rem' }}>
        <h2 style={{ fontSize: '1.25rem', marginBottom: '1rem' }}>A/B Testing</h2>
        <p style={{ fontSize: '0.9375rem', marginBottom: '1rem' }}>
          A/B testing infrastructure is ready. See{' '}
          <Link href="/admin/ab-tests" style={{ color: '#0066cc', textDecoration: 'underline' }}>
            A/B Tests
          </Link>
          {' '}for active tests and results.
        </p>
      </section>
    </main>
  );
}
