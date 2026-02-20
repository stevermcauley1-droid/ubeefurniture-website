import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const role = String(body?.role || '').trim().toLowerCase();

    if (!name || !email || !role || !['landlord', 'estate-agent'].includes(role)) {
      return NextResponse.json(
        { message: 'Please provide name, email, and role.' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    await prisma.catalogueLead.create({
      data: {
        name,
        email,
        role,
        source: 'landlords-catalogue',
      },
    });

    return NextResponse.json({ message: 'Thanks. We will email the catalogue shortly.' });
  } catch (error) {
    console.error('[catalogue-leads] failed to save lead', error);
    return NextResponse.json(
      { message: 'Unable to submit right now. Please try again.' },
      { status: 500 }
    );
  }
}

