import type { Metadata } from 'next';
import CatalogueLeadForm from '@/src/components/catalogue/CatalogueLeadForm';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Landlord Catalogue PDF | uBee Furniture',
  description:
    'Get the Landlord Fast-Furnish Catalogue: room bundles, 48–72hr turnaround, free delivery and assembly, VAT invoices and 30-day terms.',
};

export default function LandlordsCataloguePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:py-14">
      <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">
        Get the Landlord Fast-Furnish Catalogue (Bundles + 48–72hr Turnaround)
      </h1>
      <ul className="mt-6 space-y-2 text-zinc-700">
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ubee-yellow)]" />
          Ready-made room bundles (student / HMO / SA)
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ubee-yellow)]" />
          Free delivery + assembly options
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ubee-yellow)]" />
          VAT invoices + 30-day terms available
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full bg-[var(--ubee-yellow)]" />
          Priority stock lines (fast replacement)
        </li>
      </ul>
      <p className="mt-4 text-sm text-zinc-500">
        Used by landlords and letting agents across South Wales.
      </p>
      <div className="mt-8">
        <CatalogueLeadForm />
      </div>
      <p className="mt-6 text-center text-sm text-zinc-500">
        <Link href="/landlords/how-it-works" className="hover:underline">How it works</Link>
        {' · '}
        <Link href="/landlords/turnaround" className="hover:underline">Turnaround</Link>
        {' · '}
        <Link href="/landlords/terms" className="hover:underline">Terms</Link>
      </p>
    </main>
  );
}
