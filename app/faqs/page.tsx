import Link from 'next/link';

export default function FAQsPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">FAQs</h1>
      <p className="text-gray-600 mb-6">Frequently asked questions.</p>
      <Link href="/" className="font-medium hover:underline" style={{ color: 'var(--ubee-yellow)' }}>Back to Home</Link>
    </main>
  );
}
