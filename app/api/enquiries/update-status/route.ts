import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { validateAgentToken } from '@/src/lib/agent/server';

const ALLOWED_STATUSES = new Set(['NEW', 'IN_PROGRESS', 'WON', 'LOST']);

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const token = String(body?.token || '').trim();
    const id = String(body?.id || '').trim();
    const status = String(body?.status || '').trim().toUpperCase();

    if (!id || !ALLOWED_STATUSES.has(status)) {
      return NextResponse.json({ message: 'Invalid enquiry id or status.' }, { status: 400 });
    }

    const agent = await validateAgentToken(token);
    if (!agent) {
      return NextResponse.json({ message: 'Invalid or expired token.' }, { status: 401 });
    }

    const prisma = getPrisma();
    const updated = await prisma.enquiry.updateMany({
      where: { id, agentId: agent.id },
      data: { status },
    });

    if (updated.count === 0) {
      return NextResponse.json({ message: 'Enquiry not found.' }, { status: 404 });
    }

    const enquiry = await prisma.enquiry.findFirst({
      where: { id, agentId: agent.id },
    });

    return NextResponse.json({ enquiry });
  } catch (error) {
    console.error('[enquiry-status] update failed', error);
    return NextResponse.json({ message: 'Unable to update status.' }, { status: 500 });
  }
}

