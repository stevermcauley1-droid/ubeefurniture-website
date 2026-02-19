import Link from 'next/link';
import EnquiriesInbox from '@/src/components/agent/EnquiriesInbox';
import { getPrisma } from '@/lib/db/prisma';
import { validateAgentToken } from '@/src/lib/agent/server';

export default async function AgentEnquiriesPage({
  searchParams,
}: {
  searchParams: { token?: string };
}) {
  const token = String(searchParams.token || '').trim();
  if (!token) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-semibold">Enquiries</h1>
        <p className="mt-2 text-zinc-600">This route is protected. Open your magic link token.</p>
        <Link href="/agent/onboarding" className="mt-4 inline-block rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white">
          Register as an Agent
        </Link>
      </main>
    );
  }

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

  const prisma = getPrisma();
  const enquiries = await prisma.enquiry.findMany({
    where: { agentId: agent.id },
    orderBy: { createdAt: 'desc' },
  });

  return (
    <main className="mx-auto max-w-7xl bg-zinc-50 px-4 py-10">
      <div className="mb-4">
        <Link href={`/agent?token=${token}`} className="text-sm font-medium text-zinc-700 underline">
          Back to Agent Dashboard
        </Link>
      </div>
      <EnquiriesInbox
        token={token}
        initialEnquiries={enquiries.map((item) => ({
          ...item,
          createdAt: item.createdAt.toISOString(),
        }))}
      />
    </main>
  );
}

