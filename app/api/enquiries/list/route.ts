import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { validateAgentToken } from '@/src/lib/agent/server';

export const dynamic = 'force-dynamic';

const ALLOWED_STATUSES = new Set(['NEW', 'IN_PROGRESS', 'WON', 'LOST']);

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const token = String(searchParams.get('token') || '').trim();
    const status = String(searchParams.get('status') || '').trim().toUpperCase();
    const q = String(searchParams.get('q') || '').trim();

    const agent = await validateAgentToken(token);
    if (!agent) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const prisma = getPrisma();
    const enquiries = await prisma.enquiry.findMany({
      where: {
        agentId: agent.id,
        ...(status && status !== 'ALL' && ALLOWED_STATUSES.has(status) ? { status } : {}),
        ...(q
          ? {
              OR: [
                { customerName: { contains: q, mode: 'insensitive' } },
                { customerEmail: { contains: q, mode: 'insensitive' } },
                { propertyAddress: { contains: q, mode: 'insensitive' } },
                { message: { contains: q, mode: 'insensitive' } },
              ],
            }
          : {}),
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ enquiries });
  } catch (error) {
    console.error('[enquiries-list] failed', error);
    return NextResponse.json({ message: 'Unable to load enquiries.' }, { status: 500 });
  }
}

