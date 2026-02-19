/**
 * uBee Furniture — Client Intelligence seed
 * 10 clients, 20 properties, 15 deals, 8 orders
 */

import { config } from "dotenv";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "@prisma/client";

// Load .env.local then .env so DATABASE_URL is available
config({ path: ".env.local" });
config({ path: ".env" });

let connectionString = process.env.DATABASE_URL;
if (!connectionString) throw new Error("DATABASE_URL is not set");
// Supabase/cloud Postgres often use certs that Node rejects; relax SSL verification for seed
if (!connectionString.includes("sslmode=")) {
  connectionString += connectionString.includes("?") ? "&" : "?";
  connectionString += "sslmode=no-verify";
}

const pool = new Pool({ connectionString });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

async function main() {
  // Packages
  console.log("Seeding: Packages…");
  const packages = await Promise.all([
    prisma.package.upsert({
      where: { slug: 'crib5-2bed' },
      create: {
        slug: 'crib5-2bed',
        name: 'CRIB5 2-Bed Package',
        price: 2499,
        isCrib5: true,
        isExpress: false,
      },
      update: {},
    }),
    prisma.package.upsert({
      where: { slug: 'express-1bed' },
      create: {
        slug: 'express-1bed',
        name: 'Express 1-Bed Install',
        price: 1899,
        isCrib5: false,
        isExpress: true,
      },
      update: {},
    }),
    prisma.package.upsert({
      where: { slug: 'standard-2bed' },
      create: {
        slug: 'standard-2bed',
        name: 'Standard 2-Bed Package',
        price: 2199,
        isCrib5: false,
        isExpress: false,
      },
      update: {},
    }),
  ]);
  console.log("Seeding: Clients…");
  // Clients (10)
  const clients = await Promise.all([
    prisma.client.create({
      data: {
        clientType: 'LETTING_AGENT',
        volumeTier: 'MEDIUM',
        budgetBand: 'STANDARD',
        urgencyLevel: 'URGENT',
        complianceRequirement: 'CRIB5',
        relationshipStage: 'QUALIFIED',
        region: 'South Wales',
        companyName: 'Cardiff Lettings Ltd',
        displayName: 'Cardiff Lettings',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'LANDLORD',
        volumeTier: 'SMALL',
        budgetBand: 'BUDGET',
        urgencyLevel: 'IMMEDIATE',
        complianceRequirement: 'NONE',
        relationshipStage: 'ACTIVE',
        region: 'Bristol',
        companyName: null,
        displayName: 'John Smith',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'SOCIAL_HOUSING',
        volumeTier: 'LARGE',
        budgetBand: 'STANDARD',
        urgencyLevel: 'NORMAL',
        complianceRequirement: 'FULL_COMPLIANCE',
        relationshipStage: 'LEAD',
        region: 'Swansea',
        companyName: 'Housing Association Wales',
        displayName: 'HA Wales',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'LETTING_AGENT',
        volumeTier: 'SMALL',
        budgetBand: 'PREMIUM',
        urgencyLevel: 'URGENT',
        complianceRequirement: 'FIRE_SAFETY',
        relationshipStage: 'ACTIVE',
        region: 'Cardiff',
        companyName: 'Bay Lettings',
        displayName: 'Bay Lettings',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'LANDLORD',
        volumeTier: 'MICRO',
        budgetBand: 'BUDGET',
        urgencyLevel: 'PLANNED',
        complianceRequirement: 'NONE',
        relationshipStage: 'PROSPECT',
        region: 'Newport',
        companyName: null,
        displayName: 'Sarah Jones',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'SOCIAL_HOUSING',
        volumeTier: 'ENTERPRISE',
        budgetBand: 'STANDARD',
        urgencyLevel: 'IMMEDIATE',
        complianceRequirement: 'CRIB5',
        relationshipStage: 'QUALIFIED',
        region: 'South Wales',
        companyName: 'Gwent Housing',
        displayName: 'Gwent Housing',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'RETAIL',
        volumeTier: 'MICRO',
        budgetBand: 'STANDARD',
        urgencyLevel: 'NORMAL',
        complianceRequirement: 'NONE',
        relationshipStage: 'ACTIVE',
        region: 'Cardiff',
        companyName: null,
        displayName: 'Home Mover - Retail',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'LANDLORD',
        volumeTier: 'MEDIUM',
        budgetBand: 'PREMIUM',
        urgencyLevel: 'URGENT',
        complianceRequirement: 'NONE',
        relationshipStage: 'CHURNED',
        region: 'Bristol',
        companyName: null,
        displayName: 'Portfolio Landlord Ltd',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'LETTING_AGENT',
        volumeTier: 'LARGE',
        budgetBand: 'STANDARD',
        urgencyLevel: 'NORMAL',
        complianceRequirement: 'CRIB5',
        relationshipStage: 'ACTIVE',
        region: 'South Wales',
        companyName: 'Valleys Property',
        displayName: 'Valleys Property',
      },
    }),
    prisma.client.create({
      data: {
        clientType: 'SOCIAL_HOUSING',
        volumeTier: 'MEDIUM',
        budgetBand: 'BUDGET',
        urgencyLevel: 'IMMEDIATE',
        complianceRequirement: 'FULL_COMPLIANCE',
        relationshipStage: 'LEAD',
        region: 'Swansea',
        companyName: 'Coastal Housing',
        displayName: 'Coastal Housing',
      },
    }),
  ]);
  console.log("Seeding: Properties…");
  // Properties (20) — spread across clients
  const properties = [];
  for (let i = 0; i < 20; i++) {
    const client = clients[i % clients.length];
    const prop = await prisma.property.create({
      data: {
        clientId: client.id,
        propertyType: ['FLAT', 'HOUSE', 'HMO', 'FLAT', 'HOUSE'][i % 5] as any,
        propertyStatus: ['VACANT', 'TENANTED', 'REFURBISHMENT', 'VACANT', 'NEW_BUILD'][i % 5] as any,
        postcodeArea: ['CF', 'BS', 'SA', 'NP', 'CF'][i % 5] + (10 + (i % 10)),
        addressLine1: `${100 + i} High Street`,
        unitCount: i % 3 === 0 ? 4 : 1,
      },
    });
    properties.push(prop);
  }
  console.log("Seeding: Deals…");
  // Deals (15)
  const dealStages: Array<'DISCOVERY' | 'QUOTE_SENT' | 'NEGOTIATION' | 'WON' | 'LOST'> = [
    'DISCOVERY', 'QUOTE_SENT', 'NEGOTIATION', 'WON', 'WON', 'LOST', 'QUOTE_SENT', 'NEGOTIATION',
    'DISCOVERY', 'WON', 'QUOTE_SENT', 'NEGOTIATION', 'WON', 'LOST', 'DISCOVERY',
  ];
  const deals = [];
  for (let i = 0; i < 15; i++) {
    const client = clients[i % clients.length];
    const prop = properties[i % properties.length];
    const deal = await prisma.deal.create({
      data: {
        clientId: client.id,
        propertyId: prop.id,
        stage: dealStages[i] as any,
        source: ['WEBSITE', 'REFERRAL', 'COLD_OUTREACH', 'WEBSITE', 'PARTNERSHIP'][i % 5] as any,
        value: 1500 + (i * 300),
        nextActionAt: i < 10 ? new Date(Date.now() + (i + 1) * 24 * 60 * 60 * 1000) : null,
        notes: `Deal ${i + 1} notes`,
      },
    });
    deals.push(deal);
  }
  console.log("Seeding: Orders…");
  // Orders (8)
  const orders = [];
  for (let i = 0; i < 8; i++) {
    const client = clients[i % clients.length];
    const deal = deals[i % deals.length];
    const order = await prisma.order.create({
      data: {
        clientId: client.id,
        dealId: deal.id,
        total: 1800 + (i * 250),
        paymentTerms: i % 3 === 0 ? 'Net 30' : 'Immediate',
        paidAt: i % 4 !== 0 ? new Date(Date.now() - i * 24 * 60 * 60 * 1000) : null,
      },
    });
    orders.push(order);
  }
  console.log("Seeding: Client contacts…");
  // Client contacts (2–3 per first 5 clients)
  for (let c = 0; c < 5; c++) {
    await prisma.clientContact.create({
      data: {
        clientId: clients[c].id,
        name: `Contact ${c + 1}A`,
        email: `contact${c + 1}a@example.com`,
        phone: `07${100000000 + c * 111111}`,
        role: 'Property Manager',
        isPrimary: true,
      },
    });
    if (c < 3) {
      await prisma.clientContact.create({
        data: {
          clientId: clients[c].id,
          name: `Contact ${c + 1}B`,
          email: `contact${c + 1}b@example.com`,
          isPrimary: false,
        },
      });
    }
  }
  console.log("Seeding: Interactions…");
  // Interactions (sample)
  for (let i = 0; i < 12; i++) {
    await prisma.interaction.create({
      data: {
        clientId: clients[i % clients.length].id,
        type: ['CALL', 'EMAIL', 'WHATSAPP', 'CALL'][i % 4] as any,
        summary: `Interaction ${i + 1}`,
        direction: i % 2 === 0 ? 'inbound' : 'outbound',
      },
    });
  }
  console.log("Seeding: Quotes…");
  // Quotes (linked to deals)
  for (let i = 0; i < 6; i++) {
    const deal = deals[i];
    await prisma.quote.create({
      data: {
        clientId: deal.clientId,
        propertyId: deal.propertyId,
        dealId: deal.id,
        total: 2000 + (i * 200),
        validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
        status: i % 2 === 0 ? 'sent' : 'draft',
      },
    });
  }

  console.log("Seeding: Example agent catalogue…");
  const exampleAgent = await prisma.agent.upsert({
    where: { email: "example-agent@ubeefurniture.com" },
    create: {
      name: "Example Agent",
      agencyName: "Example Lettings",
      email: "example-agent@ubeefurniture.com",
      phone: "07000000000",
      brandingPrimaryColor: "#F7C600",
      markupType: "PERCENT",
      markupValue: 12,
    },
    update: {
      name: "Example Agent",
      agencyName: "Example Lettings",
      phone: "07000000000",
      brandingPrimaryColor: "#F7C600",
      markupType: "PERCENT",
      markupValue: 12,
    },
  });

  await prisma.agentCatalogue.upsert({
    where: { slug: "example-agent" },
    create: {
      agentId: exampleAgent.id,
      slug: "example-agent",
      title: "Example Lettings Landlord Catalogue",
      isActive: true,
    },
    update: {
      agentId: exampleAgent.id,
      title: "Example Lettings Landlord Catalogue",
      isActive: true,
    },
  });

  await prisma.agentCatalogue.upsert({
    where: { slug: "demo-agency" },
    create: {
      agentId: exampleAgent.id,
      slug: "demo-agency",
      title: "Demo Agency Landlord Catalogue",
      isActive: true,
    },
    update: {
      agentId: exampleAgent.id,
      title: "Demo Agency Landlord Catalogue",
      isActive: true,
    },
  });

  console.log('Seed complete:', {
    clients: clients.length,
    properties: properties.length,
    deals: deals.length,
    orders: orders.length,
    packages: packages.length,
  });
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
