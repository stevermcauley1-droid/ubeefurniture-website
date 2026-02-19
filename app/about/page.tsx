import Link from 'next/link';

export default function AboutPage() {
  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-2xl font-bold mb-4">About Us</h1>
      <p className="text-gray-600 mb-6">Learn about uBee Furniture.</p>
      <Link href="/" className="text-[var(--ubee-yellow)] hover:underline font-medium">Back to Home</Link>
    </main>
  );
}
