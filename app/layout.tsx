import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import { GoogleAnalytics } from './components/GoogleAnalytics';
import { MegaMenu } from './components/navigation/MegaMenu';

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  variable: '--font-inter',
});

const BASE = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://www.ubeefurniture.com';

export const metadata: Metadata = {
  metadataBase: new URL(BASE),
  title: { default: 'Ubee Furniture | Quality Furniture for Home & Rental', template: '%s | Ubee Furniture' },
  description:
    'Furniture for every space. Retail and landlord packages for furnished rentals.',
  openGraph: { type: 'website', url: BASE },
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
      </body>
    </html>
  );
}
