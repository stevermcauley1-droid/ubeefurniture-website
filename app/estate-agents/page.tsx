import Link from 'next/link';

export default function EstateAgentsPage() {
  return (
    <main className="mx-auto max-w-5xl px-4 py-12">
      <section className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm">
        <h1 className="text-3xl font-bold text-zinc-900">Estate Agents</h1>
        <p className="mt-3 max-w-2xl text-zinc-600">
          Partner with uBee Furniture for furnished rental solutions and a white-label branded catalogue experience.
        </p>
      </section>

      <section className="mt-8 rounded-2xl border border-zinc-200 bg-zinc-50 p-8">
        <h2 className="text-2xl font-semibold text-zinc-900">White-Label Portal Preview</h2>
        <p className="mt-2 max-w-3xl text-zinc-600">
          Give landlords a branded, professional product catalogue with your agency identity and pricing.
        </p>

        <div className="mt-6 flex flex-wrap gap-3">
          <Link
            href="/c/example-agent"
            className="rounded-lg bg-zinc-900 px-5 py-3 text-sm font-semibold text-white"
          >
            See an Example Branded Catalogue
          </Link>
          <Link
            href="/agent/onboarding"
            className="rounded-lg bg-[var(--ubee-yellow)] px-5 py-3 text-sm font-semibold text-zinc-900"
          >
            Register as an Agent
          </Link>
        </div>
      </section>
    </main>
  );
}
