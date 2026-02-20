import Link from 'next/link';
import { headers } from 'next/headers';
import AgentDashboard from '@/src/components/agent/AgentDashboard';
import { getPrisma } from '@/lib/db/prisma';
import { getCatalogueProductsForAgent, validateAgentToken } from '@/src/lib/agent/server';

export const dynamic = 'force-dynamic';

function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export default async function AgentDashboardPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = String(searchParams.token || '').trim();
  if (!token) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Agent Portal</h1>
        <p className="mt-2 text-zinc-600">This route is protected. Open your magic link token or create an account.</p>
        <Link href="/agent/onboarding" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
          Register as an Agent
        </Link>
      </main>
    );
  }

  const prisma = getPrisma();
  const agent = await validateAgentToken(token);
  if (!agent) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Invalid or expired access link</h1>
        <p className="mt-2 text-zinc-600">Please request a new access link from onboarding.</p>
        <Link href="/agent/onboarding" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
          Go to onboarding
        </Link>
      </main>
    );
  }

  const activeCatalogue = await prisma.agentCatalogue.findFirst({
    where: { agentId: agent.id, isActive: true },
    orderBy: { createdAt: 'asc' },
  });
  const initialSlug = activeCatalogue?.slug || 'example-agent';
  const base = getBaseUrl();
  const catalogueUrl = `${base}/c/${initialSlug}`;
  const pricedProducts = await getCatalogueProductsForAgent(
    agent.markupType,
    Number(agent.markupValue.toString())
  );
  if (process.env.NODE_ENV !== 'production') {
    console.info('[agent-pricing-preview] priced products count:', pricedProducts.length);
  }

  return (
    <main className="mx-auto max-w-6xl bg-zinc-50 px-4 py-10">
      <AgentDashboard
        agentName={agent.name}
        agencyName={agent.agencyName}
        email={agent.email}
        initialLogoUrl={agent.brandingLogoUrl}
        initialPrimaryColor={agent.brandingPrimaryColor}
        initialMarkupType={agent.markupType}
        initialMarkupValue={agent.markupValue.toString()}
        initialSlug={initialSlug}
        catalogueUrl={catalogueUrl}
        pricedProducts={pricedProducts}
        token={token}
      />
    </main>
  );
}

