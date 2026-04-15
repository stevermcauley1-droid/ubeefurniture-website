import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Terms | Landlord Hub | uBee Furniture',
  description: 'Trade terms for landlords: 30-day payment option, VAT invoices and ordering terms.',
};

export default function TermsPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Terms</h1>
      <p className="mt-4 text-zinc-700">
        A <strong>30-day payment option</strong> is available for qualifying trade accounts. Payment terms
        are agreed when you set up your account. VAT invoices are provided for all orders.
      </p>
      <p className="mt-3 text-zinc-700">
        Orders are subject to availability. Delivery and assembly options, plus any surcharges (e.g. mattress
        removal), will be confirmed at checkout or with your order.
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
        <Link href="/landlord" className="hover:underline">Landlord Hub</Link>
      </p>
    </main>
  );
}
