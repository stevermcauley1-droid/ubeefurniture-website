import Link from 'next/link';

export default function LandlordPackagesPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">Landlord Packages</h1>
      <p className="text-gray-600 mb-6">
        Studio, 1 bed, 2 bed, HMO and student let packages — browse Shopify-backed package collections and request a tailored quote on the landlord hub.
      </p>
      <div className="flex flex-wrap gap-4 items-center">
        <Link
          href="/landlord"
          className="inline-block px-5 py-2.5 rounded-md bg-[var(--ubee-yellow)] hover:bg-[var(--ubee-yellow-hover)] text-[var(--ubee-black)] font-semibold transition-colors"
        >
          View packages and request a quote
        </Link>
        <Link href="/landlord-solutions" className="font-medium hover:underline text-[var(--ubee-gray)]">
          Back to Landlord Solutions
        </Link>
      </div>
    </main>
  );
}
