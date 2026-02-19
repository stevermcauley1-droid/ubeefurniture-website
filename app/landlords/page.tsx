import Link from 'next/link';

export default function LandlordsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Landlords</h1>
      <p className="text-gray-600 mb-6">Furnish your rental properties quickly with our landlord packages.</p>
      <Link href="/landlord-solutions" className="text-[var(--ubee-yellow)] hover:underline font-medium">View Landlord Solutions</Link>
    </main>
  );
}
