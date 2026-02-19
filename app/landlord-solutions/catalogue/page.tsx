import Link from 'next/link';

export default function LandlordCataloguePage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Download Landlord Catalogue (PDF)</h1>
      <p className="text-gray-600 mb-6">Complete product guide. PDF download coming soon.</p>
      <Link href="/landlord-solutions" className="font-medium hover:underline" style={{ color: 'var(--ubee-yellow)' }}>Back to Landlord Solutions</Link>
    </main>
  );
}
