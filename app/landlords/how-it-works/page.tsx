import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'How It Works | Landlord Hub | uBee Furniture',
  description: 'How uBee Furniture works for landlords: order bundles, delivery, assembly and trade terms.',
};

export default function HowItWorksPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">How it works</h1>
      <p className="mt-4 text-zinc-700">
        Choose your room bundles or individual items, place your order, and we handle delivery and assembly.
        We can remove packaging and like-for-like takeaway to keep void turnarounds fast.
      </p>
      <p className="mt-3 text-zinc-700">
        Trade accounts get access to 30-day payment terms, VAT invoices, and priority stock where available.
      </p>
      <div className="mt-8 flex flex-wrap gap-4">
        <Link
          href="/landlords/catalogue"
          className="rounded-lg bg-[var(--ubee-yellow,#F7C600)] px-4 py-2 font-semibold text-zinc-900 hover:opacity-95"
        >
          Get the catalogue
        </Link>
        <Link
          href="/contact"
          className="rounded-lg border border-zinc-300 px-4 py-2 font-semibold text-zinc-900 hover:bg-zinc-50"
        >
          Contact us
        </Link>
      </div>
      <p className="mt-8 text-sm text-zinc-500">
        <Link href="/landlords" className="hover:underline">Landlord Hub</Link>
      </p>
    </main>
  );
}
