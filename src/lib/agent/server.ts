import crypto from 'crypto';
import { getPrisma } from '@/lib/db/prisma';
import { applyMarkup, type MarkupType } from './pricing';
import { getProducts } from '@/lib/shopify';

const DEMO_PRICING_PRODUCTS = [
  { id: 'demo-1', handle: 'studio-double-bed', title: 'Studio Double Bed', benefitLine: 'Hard-wearing frame ideal for rental turnovers.', baseTradePrice: 189.0 },
  { id: 'demo-2', handle: 'orthopaedic-mattress', title: 'Orthopaedic Mattress', benefitLine: 'Supportive comfort suitable for long-term lets.', baseTradePrice: 129.0 },
  { id: 'demo-3', handle: 'three-seater-sofa', title: 'Three Seater Sofa', benefitLine: 'Durable upholstery with wipe-clean finish.', baseTradePrice: 249.0 },
  { id: 'demo-4', handle: 'oak-effect-wardrobe', title: 'Oak Effect Wardrobe', benefitLine: 'Practical storage for furnished bedrooms.', baseTradePrice: 159.0 },
  { id: 'demo-5', handle: 'compact-dining-set', title: 'Compact Dining Set', benefitLine: 'Space-saving dining solution for apartments.', baseTradePrice: 139.0 },
  { id: 'demo-6', handle: 'work-from-home-desk', title: 'Work-From-Home Desk', benefitLine: 'Simple desk setup for modern tenant needs.', baseTradePrice: 99.0 },
  { id: 'demo-7', handle: 'two-drawer-bedside', title: 'Two Drawer Bedside', benefitLine: 'Matches bedroom packs and easy to maintain.', baseTradePrice: 49.0 },
  { id: 'demo-8', handle: 'landlord-package-lounge', title: 'Landlord Lounge Pack', benefitLine: 'Coordinated living room essentials bundle.', baseTradePrice: 329.0 },
] as const;

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48);
}

export async function ensureUniqueCatalogueSlug(base: string): Promise<string> {
  const prisma = getPrisma();
  let slug = slugify(base) || 'agent-catalogue';
  let i = 1;
  while (await prisma.agentCatalogue.findUnique({ where: { slug } })) {
    slug = `${slugify(base)}-${i++}`;
  }
  return slug;
}

export function generateAccessToken(): string {
  return crypto.randomBytes(24).toString('hex');
}

export async function validateAgentToken(token: string) {
  const prisma = getPrisma();
  const access = await prisma.agentAccessToken.findUnique({
    where: { token },
    include: { agent: true },
  });
  if (!access) return null;
  if (access.expiresAt < new Date()) return null;
  return access.agent;
}

export async function getAgentCatalogueBySlug(slug: string) {
  const prisma = getPrisma();
  return prisma.agentCatalogue.findFirst({
    where: { slug, isActive: true },
    include: { agent: true },
  });
}

export async function getCatalogueProductsWithMarkup(markupType: MarkupType, markupValue: number) {
  const res = await getProducts(12);
  return res.products.edges.map(({ node }) => {
    const first = node.variants?.edges?.[0]?.node;
    const base = first ? parseFloat(first.price.amount) : 0;
    const displayPrice = applyMarkup(base, markupType, markupValue);
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      image: node.featuredImage,
      displayPrice,
      currencyCode: first?.price.currencyCode ?? 'GBP',
      benefitLine: 'Durable, rental-ready furniture for furnished properties.',
    };
  });
}

export async function getCatalogueProductsPublic() {
  const res = await getProducts(12);
  const products = res.products.edges.map(({ node }) => ({
    id: node.id,
    handle: node.handle,
    title: node.title,
    image: node.featuredImage,
    benefitLine: 'Durable, rental-ready furniture for furnished properties.',
  }));
  if (products.length >= 8) return products;
  return DEMO_PRICING_PRODUCTS.map((item) => ({
    id: item.id,
    handle: item.handle,
    title: item.title,
    image: null,
    benefitLine: item.benefitLine,
  }));
}

export async function getCatalogueProductsForAgent(markupType: MarkupType, markupValue: number) {
  const res = await getProducts(12);
  const priced = res.products.edges
    .map(({ node }) => {
    const first = node.variants?.edges?.[0]?.node;
    const baseTradePrice = first ? parseFloat(first.price.amount) : 0;
      if (!Number.isFinite(baseTradePrice) || baseTradePrice <= 0) return null;
    const agentMarkupPrice = applyMarkup(baseTradePrice, markupType, markupValue);
    const commissionDifference = Math.round((agentMarkupPrice - baseTradePrice) * 100) / 100;
    return {
      id: node.id,
      handle: node.handle,
      title: node.title,
      image: node.featuredImage,
      benefitLine: 'Durable, rental-ready furniture for furnished properties.',
      baseTradePrice,
      agentMarkupPrice,
      commissionDifference,
      currencyCode: first?.price.currencyCode ?? 'GBP',
    };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));

  if (priced.length >= 8) return priced;

  return DEMO_PRICING_PRODUCTS.map((item) => {
    const agentMarkupPrice = applyMarkup(item.baseTradePrice, markupType, markupValue);
    return {
      id: item.id,
      handle: item.handle,
      title: item.title,
      image: null,
      benefitLine: item.benefitLine,
      baseTradePrice: item.baseTradePrice,
      agentMarkupPrice,
      commissionDifference: Math.round((agentMarkupPrice - item.baseTradePrice) * 100) / 100,
      currencyCode: 'GBP',
    };
  });
}

