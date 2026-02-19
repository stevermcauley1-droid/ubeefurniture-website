import Link from 'next/link';

export default function LandlordPackagesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Landlord Packages</h1>
      <p className="text-gray-600 mb-6">Studio, 1 bed, 2 bed, HMO and student let packages.</p>
      <Link href="/landlord-solutions" className="font-medium hover:underline" style={{ color: 'var(--ubee-yellow)' }}>Back to Landlord Solutions</Link>
    </main>
  );
}
