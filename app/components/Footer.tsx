import Link from 'next/link';
import { SUPPLIERS } from '@/lib/suppliers';

export function Footer() {
  const supplierCount = SUPPLIERS.length;

  return (
    <footer
      data-supplier-count={supplierCount}
      style={{
        marginTop: '3rem',
        padding: '2rem 1rem',
        background: '#1a1a1a',
        color: '#ccc',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ borderTop: '1px solid #333', paddingTop: '1rem', color: '#888' }}>
          <Link href="/" style={{ color: '#aaa', marginRight: '1rem' }}>
            Home
          </Link>
          <Link href="/collections" style={{ color: '#aaa', marginRight: '1rem' }}>
            Collections
          </Link>
          <Link href="/landlord" style={{ color: '#aaa', marginRight: '1rem' }}>
            Landlord
          </Link>
          <Link href="/blog" style={{ color: '#aaa' }}>
            Blog
          </Link>
          <p style={{ marginTop: '1rem', marginBottom: 0 }}>
            © {new Date().getFullYear()} Ubee Furniture. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
