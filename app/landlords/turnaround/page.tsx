import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Turnaround | Landlord Hub | uBee Furniture',
  description: 'Fast turnaround for landlord furniture: 48–72hr options for void properties.',
};

export default function TurnaroundPage() {
  return (
    <main className="mx-auto max-w-2xl px-4 py-10 sm:py-14">
      <h1 className="text-2xl font-bold text-zinc-900 sm:text-3xl">Turnaround</h1>
      <p className="mt-4 text-zinc-700">
        We aim for 48–72 hour turnaround on stock items where possible. Priority lines are kept for fast
        replacement and void refurbs. Delivery and assembly can be scheduled to fit your handover.
      </p>
      <p className="mt-3 text-zinc-700">
        For bulk or non-stock items, we&apos;ll confirm lead times at quote stage.
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
