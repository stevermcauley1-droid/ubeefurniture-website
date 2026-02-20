import { NextResponse } from 'next/server';
import { Prisma } from '@prisma/client';
import { getPrisma } from '@/lib/db/prisma';
import { slugify, validateAgentToken } from '@/src/lib/agent/server';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const accessToken = String(body?.token || '').trim();
    const authedAgent = await validateAgentToken(accessToken);
    if (!authedAgent) {
      return NextResponse.json(
        { message: 'Access token expired. Re-open your portal link.' },
        { status: 401 }
      );
    }

    const prisma = getPrisma();
    const logoUrl = String(body?.logoUrl || '').trim();
    const primaryColor = String(body?.primaryColor || '').trim();
    const slug = slugify(String(body?.slug || '').trim());
    const markupType = String(body?.markupType || 'PERCENT') as 'PERCENT' | 'FIXED';
    const markupValue = Number(body?.markupValue || 0);

    if (!Number.isFinite(markupValue) || markupValue < 0) {
      return NextResponse.json(
        { message: 'Markup value must be a valid positive number.' },
        { status: 400 }
      );
    }

    await prisma.agent.update({
      where: { id: authedAgent.id },
      data: {
        brandingLogoUrl: logoUrl || null,
        brandingPrimaryColor: primaryColor || null,
        markupType,
        markupValue: new Prisma.Decimal(markupValue),
      },
    });

    if (slug) {
      const existing = await prisma.agentCatalogue.findUnique({ where: { slug } });
      if (existing && existing.agentId !== authedAgent.id) {
        return NextResponse.json(
          { message: 'That slug is already in use. Please choose another.' },
          { status: 409 }
        );
      }

      const current = await prisma.agentCatalogue.findFirst({
        where: { agentId: authedAgent.id, isActive: true },
        orderBy: { createdAt: 'asc' },
      });

      if (current) {
        await prisma.agentCatalogue.update({
          where: { id: current.id },
          data: { slug, title: `${authedAgent.agencyName} Landlord Catalogue` },
        });
      } else {
        await prisma.agentCatalogue.create({
          data: {
            agentId: authedAgent.id,
            slug,
            title: `${authedAgent.agencyName} Landlord Catalogue`,
            isActive: true,
          },
        });
      }
    }

    return NextResponse.json({ message: 'Settings saved.' });
  } catch (error) {
    console.error('[agent-settings] update failed', error);
    return NextResponse.json(
      { message: 'Unable to save settings right now.' },
      { status: 500 }
    );
  }
}

