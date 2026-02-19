import Link from 'next/link';

export default function BulkDeliveryPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold text-[var(--ubee-black)] mb-4">Book Bulk Delivery</h1>
      <p className="text-gray-600 mb-6">Schedule large orders and bulk delivery. Booking form coming soon.</p>
      <Link href="/landlord-solutions" className="text-[var(--ubee-yellow)] hover:underline font-medium">← Landlord Solutions</Link>
    </main>
  );
}
