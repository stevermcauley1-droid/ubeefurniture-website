import Link from 'next/link';

export default function CollectionNotFound() {
  return (
    <main className="max-w-2xl mx-auto px-4 py-12">
      <Link
        href="/collections"
        className="inline-block mb-6 text-[var(--ubee-gray)] hover:text-[var(--ubee-black)] transition-colors"
      >
        ← All collections
      </Link>
      <h1 className="text-2xl font-bold text-[var(--ubee-black)] mb-2">
        Collection not found
      </h1>
      <p className="text-[var(--ubee-gray)] mb-6">
        This collection doesn&apos;t exist yet or isn&apos;t available on this channel.
        Create it in Shopify Admin and add it to the Headless sales channel to show it here.
      </p>
      <Link
        href="/collections"
        className="inline-block px-4 py-2 bg-[var(--ubee-black)] text-white rounded hover:opacity-90 transition-opacity"
      >
        Browse all collections
      </Link>
    </main>
  );
}
