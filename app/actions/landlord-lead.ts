'use server';

import { getPrisma } from '@/lib/db/prisma';
import { revalidatePath } from 'next/cache';

export interface LandlordLeadSubmission {
  name: string;
  email: string;
  property?: string;
  message?: string;
}

export interface LandlordLeadResult {
  success: boolean;
  error?: string;
  clientId?: string;
}

/**
 * Submit a landlord lead form. Creates a Client, ClientContact, and Deal record.
 * This captures leads from the landlord hub quote request form.
 */
export async function submitLandlordLead(
  data: LandlordLeadSubmission
): Promise<LandlordLeadResult> {
  try {
    const prisma = getPrisma();

    // Create or find client by email
    let client = await prisma.client.findFirst({
      where: {
        contacts: {
          some: {
            email: data.email,
          },
        },
      },
      include: {
        contacts: true,
      },
    });

    if (!client) {
      // Create new client with default landlord profile
      client = await prisma.client.create({
        data: {
          clientType: 'LANDLORD',
          volumeTier: 'MICRO', // Default, can be updated later
          budgetBand: 'STANDARD', // Default
          urgencyLevel: 'NORMAL', // Default
          complianceRequirement: 'NONE', // Default
          relationshipStage: 'LEAD',
          displayName: data.name,
          contacts: {
            create: {
              name: data.name,
              email: data.email,
              isPrimary: true,
            },
          },
        },
        include: {
          contacts: true,
        },
      });
    } else {
      // Update existing client if needed
      if (!client.displayName) {
        await prisma.client.update({
          where: { id: client.id },
          data: { displayName: data.name },
        });
      }

      // Add contact if email doesn't exist
      const hasEmail = client.contacts.some((c) => c.email === data.email);
      if (!hasEmail) {
        await prisma.clientContact.create({
          data: {
            clientId: client.id,
            name: data.name,
            email: data.email,
            isPrimary: client.contacts.length === 0,
          },
        });
      }
    }

    // Create a Deal for this lead
    const deal = await prisma.deal.create({
      data: {
        clientId: client.id,
        stage: 'DISCOVERY',
        source: 'WEBSITE',
        notes: [
          data.property && `Property: ${data.property}`,
          data.message && `Message: ${data.message}`,
          `Submitted via landlord hub quote form`,
        ]
          .filter(Boolean)
          .join('\n\n'),
      },
    });

    // Optionally create a Property record if property info provided
    if (data.property) {
      await prisma.property.create({
        data: {
          clientId: client.id,
          propertyType: 'FLAT', // Default, can be inferred from text or updated manually
          propertyStatus: 'VACANT', // Default assumption
          addressLine1: data.property,
        },
      });
    }

    revalidatePath('/landlord');

    return {
      success: true,
      clientId: client.id,
    };
  } catch (err) {
    console.error('Error submitting landlord lead:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Failed to submit lead',
    };
  }
}
