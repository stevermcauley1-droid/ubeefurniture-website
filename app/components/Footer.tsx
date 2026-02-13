import Link from 'next/link';
import { SUPPLIERS } from '@/lib/suppliers';

export function Footer() {
  return (
    <footer
      style={{
        marginTop: '3rem',
        padding: '2rem 1rem',
        background: '#1a1a1a',
        color: '#ccc',
        fontSize: '0.875rem',
      }}
    >
      <div style={{ maxWidth: 1200, margin: '0 auto' }}>
        <div style={{ marginBottom: '1.5rem' }}>
          <h3 style={{ color: '#fff', fontSize: '0.9375rem', marginBottom: '0.75rem', fontWeight: 600 }}>
            Our suppliers
          </h3>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexWrap: 'wrap', gap: '0.5rem 1rem' }}>
            {SUPPLIERS.map((s) => (
              <li key={s.name}>
                {s.url ? (
                  <a
                    href={s.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#aaa', textDecoration: 'none' }}
                  >
                    {s.name}
                  </a>
                ) : (
                  <span style={{ color: '#888' }}>{s.name}</span>
                )}
              </li>
            ))}
          </ul>
        </div>
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
