import Link from 'next/link';
import { BLOG_POSTS } from '@/lib/blog-content';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.co.uk';

export const metadata = {
  title: 'Blog',
  description: 'Tips and guides for landlords and furnished rentals.',
  alternates: { canonical: `${BASE}/blog` },
};

export default function BlogIndexPage() {
  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Home</Link>
      <h1>Blog</h1>
      <p style={{ color: '#555', marginTop: '0.5rem' }}>
        Landlord and rental-focused articles.
      </p>
      <ul style={{ listStyle: 'none', padding: 0, marginTop: '1.5rem' }}>
        {BLOG_POSTS.map((post) => (
          <li key={post.slug} style={{ marginBottom: '1.25rem' }}>
            <Link href={`/blog/${post.slug}`}>
              <strong style={{ fontSize: '1.0625rem' }}>{post.title}</strong>
              <p style={{ margin: '0.25rem 0 0', fontSize: '0.875rem', color: '#555' }}>{post.description}</p>
            </Link>
          </li>
        ))}
      </ul>
    </main>
  );
}
