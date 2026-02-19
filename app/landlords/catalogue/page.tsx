import type { Metadata } from 'next';
import CatalogueLeadForm from '@/src/components/catalogue/CatalogueLeadForm';

export const metadata: Metadata = {
  title: 'Landlord Catalogue PDF | uBee Furniture',
  description:
    'Download the latest landlord furniture catalogue and request tailored landlord-ready package support.',
};

export default function LandlordsCataloguePage() {
  return (
    <main className="mx-auto max-w-3xl px-4 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6">
        <h1 className="text-3xl font-bold text-[var(--ubee-black)]">Download Landlord Catalogue (PDF)</h1>
        <p className="mt-2 text-zinc-600">
          View our latest landlord-ready ranges and furnishing options.
        </p>
        <ul className="mt-4 list-disc space-y-1 pl-6 text-sm text-zinc-700">
          <li>Landlord-ready packages</li>
          <li>Delivery & assembly available</li>
          <li>Fast turnaround for void properties</li>
        </ul>
        <div className="mt-5 flex flex-wrap gap-3">
          <a
            href="/catalogues/landlord-catalogue-2025.pdf"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-block rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
          >
            Download PDF
          </a>
          <a
            href="/agent/onboarding"
            className="inline-block rounded-lg border border-zinc-300 bg-white px-5 py-3 text-sm font-semibold text-zinc-900"
          >
            Request a trade account
          </a>
        </div>
      </section>

      <CatalogueLeadForm />
    </main>
  );
}
