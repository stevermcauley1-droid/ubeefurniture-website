import { getCollection } from "@/lib/shopify/getCollection";
import type { StorefrontProduct } from "@/lib/types";
import {
  PACKAGE_COLLECTION_MAP,
  PACKAGE_ROLE_LABELS,
  packages,
  type PackageCollectionKey,
  type PackageSlug,
} from "./config";

export interface GeneratedPackageItem {
  id: string;
  handle: string;
  title: string;
  image: string;
  roleLabel: string;
  originalPrice: number;
  adjustedPrice: number;
}

export interface GeneratedPackage {
  slug: PackageSlug;
  name: string;
  description: string;
  items: GeneratedPackageItem[];
  totals: {
    original: number;
    packagePrice: number;
    individualTotal: number;
    savings: number;
  };
}

const FETCH_BUFFER = 6;
const DEFAULT_MARGIN = 1.08;
const INDIVIDUAL_PRICE_FACTOR = 1.12;

function pickImage(product: StorefrontProduct): string | null {
  return product.featuredImage?.url ?? product.images?.edges?.[0]?.node?.url ?? null;
}

function pickBasePrice(product: StorefrontProduct): number | null {
  const prices = (product.variants?.edges ?? [])
    .map((edge) => Number(edge.node?.price?.amount))
    .filter((price): price is number => Number.isFinite(price) && price > 0);
  return prices.length ? Math.min(...prices) : null;
}

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

async function fetchCategoryProducts(collectionHandle: string, first: number): Promise<StorefrontProduct[]> {
  const { collection } = await getCollection(collectionHandle, first);
  return collection?.products?.edges?.map((edge) => edge.node) ?? [];
}

function selectProductsForCategory(
  key: PackageCollectionKey,
  products: StorefrontProduct[],
  requiredCount: number,
  usedHandles: Set<string>,
  marginMultiplier: number
): GeneratedPackageItem[] {
  const out: GeneratedPackageItem[] = [];

  for (const product of products) {
    if (out.length >= requiredCount) break;
    if (usedHandles.has(product.handle)) continue;
    const price = pickBasePrice(product);
    const image = pickImage(product);
    if (!price || !image) continue;

    usedHandles.add(product.handle);
    out.push({
      id: product.id,
      handle: product.handle,
      title: product.title,
      image,
      roleLabel: PACKAGE_ROLE_LABELS[key],
      originalPrice: round2(price),
      adjustedPrice: round2(price * marginMultiplier),
    });
  }

  return out;
}

export async function generatePackage(slug: PackageSlug, marginMultiplier = DEFAULT_MARGIN): Promise<GeneratedPackage> {
  const config = packages[slug];
  if (!config) {
    throw new Error("PACKAGE_NOT_FOUND");
  }

  const usedHandles = new Set<string>();
  const items: GeneratedPackageItem[] = [];

  for (const [key, count] of Object.entries(config.items) as Array<[PackageCollectionKey, number]>) {
    if (!count) continue;
    const collectionHandle = PACKAGE_COLLECTION_MAP[key];
    const first = Math.max(count * FETCH_BUFFER, 24);
    const products = await fetchCategoryProducts(collectionHandle, first);
    const selected = selectProductsForCategory(key, products, count, usedHandles, marginMultiplier);
    items.push(...selected);
  }

  const requiredTotal = Object.values(config.items).reduce((sum, value) => sum + value, 0);
  if (items.length < requiredTotal) {
    console.error("PACKAGE_BLOCKED_BY_DATA", {
      slug,
      requiredTotal,
      selected: items.length,
      selectedHandles: items.map((item) => item.handle),
    });
    throw new Error("PACKAGE_BLOCKED_BY_DATA");
  }

  const original = round2(items.reduce((sum, item) => sum + item.originalPrice, 0));
  const packagePrice = round2(items.reduce((sum, item) => sum + item.adjustedPrice, 0));
  const individualTotal = round2(packagePrice * INDIVIDUAL_PRICE_FACTOR);
  const savings = round2(Math.max(individualTotal - packagePrice, 0));

  return {
    slug,
    name: config.name,
    description: config.description,
    items,
    totals: { original, packagePrice, individualTotal, savings },
  };
}

