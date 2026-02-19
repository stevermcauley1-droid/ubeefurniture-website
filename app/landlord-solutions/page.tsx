import Link from 'next/link';

export default function LandlordSolutionsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Landlord Solutions</h1>
      <p className="text-gray-600 mb-6">Packages, essentials, and business tools for landlords.</p>
      <Link href="/landlord-solutions/packages" className="font-medium hover:underline" style={{ color: 'var(--ubee-yellow)' }}>Packages</Link>
      <span className="mx-2">|</span>
      <Link href="/landlord-solutions/essentials" className="font-medium hover:underline" style={{ color: 'var(--ubee-yellow)' }}>Essentials</Link>
    </main>
  );
}
