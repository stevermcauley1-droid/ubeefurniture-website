const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.co.uk';

export default function robots() {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: ['/api/', '/cart'],
    },
    sitemap: `${BASE}/sitemap.xml`,
  };
}
