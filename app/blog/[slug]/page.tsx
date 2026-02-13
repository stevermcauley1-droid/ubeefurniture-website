import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getPostBySlug, BLOG_POSTS } from '@/lib/blog-content';

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.co.uk';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: 'Post' };
  return {
    title: post.title,
    description: post.description,
    alternates: { canonical: `${BASE}/blog/${slug}` },
  };
}

export default async function BlogPostPage({ params }: PageProps) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <main style={{ maxWidth: 720, margin: '0 auto', padding: '2rem 1rem' }}>
      <Link href="/blog" style={{ display: 'inline-block', marginBottom: '1rem' }}>← Blog</Link>
      <article>
        <h1 style={{ marginBottom: '0.5rem' }}>{post.title}</h1>
        <p style={{ color: '#555', fontSize: '0.9375rem', marginBottom: '1.5rem' }}>
          {post.description}
        </p>
        <div
          style={{ lineHeight: 1.7 }}
          dangerouslySetInnerHTML={{ __html: post.body.trim() }}
        />
      </article>
    </main>
  );
}
