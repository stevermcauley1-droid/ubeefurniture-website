import type { StorefrontProduct, StorefrontProductVariant } from "@/lib/types";
import { isValidProduct } from "../filters/validProducts";

export type OneBedBundleKind =
  | "sofa"
  | "bed"
  | "mattress"
  | "wardrobe"
  | "chest"
  | "coffee_table";

const ROLE_DISPLAY: Record<OneBedBundleKind, string> = {
  sofa: "Sofa",
  bed: "Bed",
  mattress: "Mattress",
  wardrobe: "Wardrobe",
  chest: "Chest of drawers",
  coffee_table: "Coffee table",
};

const RULES: Record<
  OneBedBundleKind,
  { include: string[]; exclude?: string[]; prefer?: string[] }
> = {
  sofa: { include: ["sofa", "couch"] },
  bed: {
    include: ["bed"],
    exclude: ["bedside", "headboard", "daybed", "slats"],
    prefer: ["double", "king", "single"],
  },
  mattress: { include: ["mattress"] },
  wardrobe: { include: ["wardrobe"] },
  chest: {
    include: ["chest"],
    exclude: ["bedside"],
    prefer: ["drawer"],
  },
  coffee_table: { include: ["coffee table"], prefer: ["coffee"] },
};

export interface OneBedBundleItem {
  title: string;
  price: number;
  image: string;
  handle: string;
  /** Stable slot label for landlords (matches pack definition). */
  roleLabel: string;
}

export interface OneBedBundle {
  items: OneBedBundleItem[];
  totalCost: number;
}

const STOREFRONT_QUERY = `
query BundleProducts($first: Int!, $query: String) {
  products(first: $first, query: $query) {
    edges {
      node {
        id
        handle
        title
        description
        featuredImage {
          url
          altText
          width
          height
        }
        images(first: 10) {
          edges {
            node {
              url
              altText
              width
              height
            }
          }
        }
        variants(first: 25) {
          edges {
            node {
              id
              title
              availableForSale
              price {
                amount
                currencyCode
              }
              selectedOptions {
                name
                value
              }
            }
          }
        }
        availableForSale
      }
    }
  }
}
`;

async function fetchStorefrontProducts(
  first: number,
  queryText?: string
): Promise<StorefrontProduct[]> {
  const domain =
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN || process.env.SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    throw new Error("MISSING_STOREFRONT_ENV");
  }

  const headers: Record<string, string> = {
    "Content-Type": "application/json",
    ...(token.startsWith("shpat_")
      ? { "Shopify-Storefront-Private-Token": token }
      : { "X-Shopify-Storefront-Access-Token": token }),
  };

  for (let attempt = 1; attempt <= 2; attempt++) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 30000);
    try {
      const response = await fetch(`https://${domain}/api/2024-01/graphql.json`, {
        method: "POST",
        headers,
        body: JSON.stringify({
          query: STOREFRONT_QUERY,
          variables: { first, query: queryText || null },
        }),
        cache: "no-store",
        signal: controller.signal,
      });
      clearTimeout(timeout);
      const payload = await response.json();
      if (!response.ok || payload.errors?.length) {
        throw new Error(payload.errors?.[0]?.message || `HTTP_${response.status}`);
      }
      return (payload.data?.products?.edges || []).map(
        (e: { node: StorefrontProduct }) => e.node
      );
    } catch (error) {
      clearTimeout(timeout);
      if (attempt === 2) throw error;
    }
  }

  return [];
}

function hasImage(product: StorefrontProduct): string | null {
  return (
    product.featuredImage?.url ||
    product.images?.edges?.[0]?.node?.url ||
    null
  );
}

function toNumberPrice(variant: StorefrontProductVariant): number | null {
  const amount = Number(variant?.price?.amount);
  return Number.isFinite(amount) ? amount : null;
}

function getLowestVariantPrice(product: StorefrontProduct): number | null {
  const prices = (product.variants?.edges || [])
    .map((edge) => toNumberPrice(edge.node))
    .filter((n): n is number => n !== null && n > 0);
  if (!prices.length) return null;
  return Math.min(...prices);
}

function matchesKind(title: string, kind: OneBedBundleKind): boolean {
  const t = title.toLowerCase();
  if (kind === "chest") {
    if (t.includes("bedside")) return false;
    return (
      (t.includes("chest") && (t.includes("drawer") || t.includes("drawers"))) ||
      t.includes("chest of drawers")
    );
  }
  if (kind === "coffee_table") {
    if (t.includes("coffee machine")) return false;
    return t.includes("coffee table") || (t.includes("coffee") && t.includes("table"));
  }
  const rule = RULES[kind];
  if (!rule.include.some((k) => t.includes(k))) return false;
  if (rule.exclude?.some((k) => t.includes(k))) return false;
  return true;
}

function rankForKind(title: string, kind: OneBedBundleKind): number {
  const t = title.toLowerCase();
  const prefer = RULES[kind].prefer || [];
  for (let i = 0; i < prefer.length; i++) {
    if (t.includes(prefer[i])) return i;
  }
  return prefer.length + 1;
}

function toItem(product: StorefrontProduct, roleLabel: string): OneBedBundleItem | null {
  const image = hasImage(product);
  const price = getLowestVariantPrice(product);
  const images = [
    ...(product.featuredImage?.url ? [product.featuredImage.url] : []),
    ...((product.images?.edges || [])
      .map((e) => e.node?.url)
      .filter((u): u is string => !!u)),
  ];
  if (price === null || !isValidProduct({ price, images })) return null;
  if (!image) return null;
  return {
    title: product.title,
    price,
    image,
    handle: product.handle,
    roleLabel,
  };
}

export async function getOneBedBundle(): Promise<OneBedBundle> {
  const used = new Set<string>();
  const items: OneBedBundleItem[] = [];
  const FETCH = 220;

  const order: OneBedBundleKind[] = [
    "sofa",
    "bed",
    "mattress",
    "wardrobe",
    "chest",
    "coffee_table",
  ];
  for (const kind of order) {
    const searches = RULES[kind].include;
    let candidates: StorefrontProduct[] = [];
    for (const term of searches) {
      const batch = await fetchStorefrontProducts(FETCH, term);
      candidates = candidates.concat(batch);
    }
    // Fallback to an unfiltered pull if keyword search is sparse/transient.
    if (candidates.length === 0) {
      const fallback = await fetchStorefrontProducts(FETCH);
      candidates = candidates.concat(fallback);
    }
    const seen = new Set<string>();
    const ranked = candidates
      .filter((p) => {
        if (seen.has(p.handle)) return false;
        seen.add(p.handle);
        return true;
      })
      .filter((p) => !used.has(p.handle))
      .filter((p) => matchesKind(p.title, kind))
      .filter((p) => !!toItem(p, ROLE_DISPLAY[kind]))
      .sort((a, b) => rankForKind(a.title, kind) - rankForKind(b.title, kind));
    const product = ranked[0];
    if (!product) continue;
    const item = toItem(product, ROLE_DISPLAY[kind]);
    if (!item) continue;
    used.add(product.handle);
    items.push(item);
  }

  if (items.length < 6) {
    const selectedRoles = new Set(items.map((item) => item.roleLabel));
    const missingKinds = order.filter((kind) => !selectedRoles.has(ROLE_DISPLAY[kind]));
    console.error("BUNDLE_BLOCKED_BY_DATA", {
      required: order.length,
      selected: items.length,
      missingKinds,
      selectedHandles: items.map((i) => i.handle),
    });
    throw new Error("BUNDLE_BLOCKED_BY_DATA");
  }

  const totalCost = items.reduce((sum, item) => sum + item.price, 0);
  return { items, totalCost };
}
