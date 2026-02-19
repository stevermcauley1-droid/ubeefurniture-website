import { NextResponse } from 'next/server';
import { getPrisma } from '@/lib/db/prisma';
import { sendEnquiryNotifications } from '@/src/lib/agent/notifications';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const slug = String(body?.slug || '').trim();
    const name = String(body?.name || '').trim();
    const email = String(body?.email || '').trim().toLowerCase();
    const propertyAddress = String(body?.propertyAddress || '').trim();
    const itemsInterestedIn = String(body?.itemsInterestedIn || '').trim();
    const message = String(body?.message || '').trim();

    if (!slug || !name || !email || !propertyAddress || !itemsInterestedIn) {
      return NextResponse.json(
        { message: 'Please complete all required fields.' },
        { status: 400 }
      );
    }

    const prisma = getPrisma();
    const catalogue = await prisma.agentCatalogue.findFirst({
      where: { slug, isActive: true },
      include: { agent: true },
    });

    if (!catalogue || !catalogue.agent) {
      return NextResponse.json({ message: 'Catalogue not found.' }, { status: 404 });
    }

    await prisma.enquiry.create({
      data: {
        agentId: catalogue.agentId,
        catalogueId: catalogue.id,
        customerName: name,
        customerEmail: email,
        propertyAddress,
        itemsInterestedIn,
        message: message || null,
        status: 'NEW',
      },
    });

    await sendEnquiryNotifications({
      agentEmail: catalogue.agent.email,
      agentName: catalogue.agent.name,
      agencyName: catalogue.agent.agencyName,
      customerName: name,
      customerEmail: email,
      propertyAddress,
      itemsInterestedIn,
      message,
      catalogueSlug: catalogue.slug,
    });

    return NextResponse.json({ message: 'Thanks. Your enquiry has been sent to your agent.' });
  } catch (error) {
    console.error('[enquiries-api] Failed to submit enquiry', error);
    return NextResponse.json(
      { message: 'Unable to submit enquiry right now. Please try again.' },
      { status: 500 }
    );
  }
}

