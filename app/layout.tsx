import type { Metadata } from 'next';
import dynamic from 'next/dynamic';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { HeatmapAnalytics } from './components/HeatmapAnalytics';
import { Footer } from './components/Footer';
import { SiteHeaderWrapper } from './components/site/SiteHeaderWrapper';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const baseUrl =
  process.env.NEXT_PUBLIC_SITE_URL ||
  'http://localhost:3000';

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl),
  title: { default: 'Ubee Furniture | Quality Furniture for Home & Rental', template: '%s | Ubee Furniture' },
  description:
    'Furniture for every space. Retail and landlord packages for furnished rentals.',
  openGraph: { type: 'website', url: baseUrl },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <head>
        <link rel="preconnect" href="https://cdn.shopify.com" crossOrigin="anonymous" />
      </head>
      <body style={{ fontFamily: 'var(--font-inter), system-ui, sans-serif' }}>
        <SiteHeaderWrapper />
        <GoogleAnalytics />
        <HeatmapAnalytics />
        {children}
        <Footer />
      </body>
    </html>
  );
}
