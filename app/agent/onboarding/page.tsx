import { headers } from 'next/headers';
import { Prisma } from '@prisma/client';
import AgentOnboardingForm from '@/src/components/agent/AgentOnboardingForm';
import { getPrisma } from '@/lib/db/prisma';
import { ensureUniqueCatalogueSlug, generateAccessToken } from '@/src/lib/agent/server';

function getBaseUrl() {
  const envBase = process.env.NEXT_PUBLIC_SITE_URL;
  if (envBase) return envBase.replace(/\/$/, '');
  const h = headers();
  const host = h.get('x-forwarded-host') || h.get('host') || 'localhost:3000';
  const proto = h.get('x-forwarded-proto') || (host.includes('localhost') ? 'http' : 'https');
  return `${proto}://${host}`;
}

export default function AgentOnboardingPage() {
  async function createAgent(formData: FormData) {
    'use server';

    const prisma = getPrisma();
    const name = String(formData.get('name') || '').trim();
    const agencyName = String(formData.get('agencyName') || '').trim();
    const email = String(formData.get('email') || '').trim().toLowerCase();
    const phone = String(formData.get('phone') || '').trim();
    const requestedSlug = String(formData.get('slug') || '').trim();
    const markupType = String(formData.get('markupType') || 'PERCENT') as 'PERCENT' | 'FIXED';
    const markupValueNum = Number(formData.get('markupValue') || 0);

    if (!name || !agencyName || !email || !requestedSlug || !Number.isFinite(markupValueNum)) {
      return { ok: false, message: 'Please complete all required fields.' };
    }

    const uniqueSlug = await ensureUniqueCatalogueSlug(requestedSlug);
    let agent = await prisma.agent.findUnique({ where: { email } });

    if (!agent) {
      agent = await prisma.agent.create({
        data: {
          name,
          agencyName,
          email,
          phone: phone || null,
          markupType,
          markupValue: new Prisma.Decimal(markupValueNum),
        },
      });
    } else {
      agent = await prisma.agent.update({
        where: { id: agent.id },
        data: {
          name,
          agencyName,
          phone: phone || null,
          markupType,
          markupValue: new Prisma.Decimal(markupValueNum),
        },
      });
    }

    const existingCatalogue = await prisma.agentCatalogue.findFirst({
      where: { agentId: agent.id, isActive: true },
      orderBy: { createdAt: 'asc' },
    });
    const catalogue = existingCatalogue
      ? await prisma.agentCatalogue.update({
          where: { id: existingCatalogue.id },
          data: { slug: uniqueSlug, title: `${agencyName} Landlord Catalogue`, isActive: true },
        })
      : await prisma.agentCatalogue.create({
          data: {
            agentId: agent.id,
            slug: uniqueSlug,
            title: `${agencyName} Landlord Catalogue`,
            isActive: true,
          },
        });

    const token = generateAccessToken();
    await prisma.agentAccessToken.create({
      data: {
        agentId: agent.id,
        token,
        expiresAt: new Date(Date.now() + 1000 * 60 * 60 * 24 * 30),
      },
    });

    await prisma.lead.create({
      data: {
        name,
        agencyName,
        email,
        phone: phone || null,
        source: 'agent_onboarding',
        notes: 'Created from /agent/onboarding',
      },
    });

    const base = getBaseUrl();
    return {
      ok: true,
      message: 'Agent profile created successfully.',
      portalLink: `${base}/agent?token=${token}`,
      catalogueLink: `${base}/c/${catalogue.slug}`,
    };
  }

  return (
    <main className="bg-zinc-50 px-4 py-10">
      <AgentOnboardingForm action={createAgent} />
    </main>
  );
}

