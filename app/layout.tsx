import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { MegaMenu } from './components/navigation/MegaMenu';
import { Footer } from './components/Footer';

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
        <MegaMenu />
        <GoogleAnalytics />
        {children}
        <Footer />
      </body>
    </html>
  );
}
