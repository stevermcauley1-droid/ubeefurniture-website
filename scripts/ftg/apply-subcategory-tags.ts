import { config } from "dotenv";
import { getAdminAccessToken } from "../../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

type ProductNode = {
  id: string;
  handle: string;
  title: string;
  productType: string;
  descriptionHtml: string | null;
  tags: string[];
};

function hasAny(text: string, needles: string[]): boolean {
  const t = text.toLowerCase();
  return needles.some((n) => t.includes(n));
}

function classifySubcats(p: ProductNode): string[] {
  const title = String(p.title || "").toLowerCase();
  const type = String(p.productType || "").toLowerCase();
  const desc = String(p.descriptionHtml || "").toLowerCase();
  const tags = (p.tags || []).map((t) => t.toLowerCase());
  const all = `${title} ${type} ${desc} ${tags.join(" ")}`;
  const out = new Set<string>();

  const isKids = hasAny(all, ["kids", "4kids", "kid "]);
  const isSofa = hasAny(all, ["sofa", "seater", "chaise", "corner sofa", "loveseat"]);
  const isDining = hasAny(all, ["dining", "bar stool", "counter stool"]);
  /** Matches Shopify product_type from FTG builder (see build-shopify-products.mjs). */
  const isOfficeType =
    String(p.productType || "")
      .trim()
      .toLowerCase() === "desks & office";
  const isOffice =
    isOfficeType ||
    hasAny(all, ["gaming desk", "professional office", "desk chair", "office chair"]) ||
    (hasAny(all, ["desk"]) &&
      !isKids &&
      !isDining &&
      !hasAny(all, ["bar desk", "bedside"]));
  const isBedroom = hasAny(all, ["bed", "wardrobe", "chest of drawers", "bedside", "mattress", "bed slat", "sliding wardrobe"]);
  const cubeShelfTextSignals = [
    "cube shelf",
    "cube shelves",
    "cube shelving",
    "cube storage shelving",
    "open storage cubes",
    "cube open storage",
  ];

  // Top tabs — office bookcases / wall units are not living-room (FTG splits Office vs Living)
  if (
    isSofa ||
    hasAny(all, ["coffee table", "tv unit", "sideboard", "mirror"]) ||
    (!isOfficeType &&
      (hasAny(all, ["bookcase", "bookshelf", "wall shelf", "floating shelf"]) ||
        tags.includes("bookcases") ||
        tags.includes("wall-shelves")))
  ) {
    out.add("living-room");
  }
  if (isDining) out.add("dining");
  if (isBedroom) out.add("bedroom-furniture");
  if (isKids) out.add("kids");
  if (isOffice) out.add("office");
  if (isSofa) out.add("sofas");

  // Living subtabs
  if (hasAny(all, ["set of", "set "]) && isSofa) out.add("living-room-sets");
  if (hasAny(all, ["sideboard"])) out.add("living-sideboards");
  if (hasAny(all, [" cabinet "]) || tags.includes("cabinets")) out.add("living-cabinets");
  if (hasAny(all, ["tv unit", "tv cabinet", "tv stand", "media unit"]) || tags.includes("tv-cabinets")) out.add("tv-units");
  if (hasAny(all, ["lounge chair", "armchair"])) out.add("lounge-chairs");
  if (hasAny(all, ["console table"])) out.add("console-tables");
  if (hasAny(all, ["coffee table"]) || tags.includes("coffee-tables")) out.add("coffee-tables");
  if (hasAny(all, ["side table"])) out.add("side-tables");
  if (hasAny(all, ["nest of tables"])) out.add("nest-of-tables");
  if (hasAny(all, cubeShelfTextSignals)) out.add("cube-shelves");
  if (hasAny(all, ["bookcase", "bookshelf"]) || tags.includes("bookcases")) out.add("bookcases");
  if (hasAny(all, ["mirror"]) || tags.includes("mirrors")) out.add("mirrors");
  if (hasAny(all, ["coat rack"])) out.add("coat-racks");
  if (hasAny(all, ["shoe storage", "shoe cabinet", "shoe rack"])) out.add("shoe-storage-cabinets");
  if (hasAny(all, ["wall shelf", "floating shelf"]) || tags.includes("wall-shelves")) out.add("wall-shelves");
  if (hasAny(all, ["cabinet light"]) || hasAny(all, ["lighting"])) out.add("cabinet-lights");

  // Dining subtabs
  if (isDining && hasAny(all, ["included", "set of"])) out.add("dining-sets");
  if (hasAny(all, ["dining table"]) && !hasAny(all, ["included"])) out.add("dining-tables");
  if (hasAny(all, ["dining chair"]) && !hasAny(all, ["included"])) out.add("dining-chairs");
  if (isDining && hasAny(all, ["sideboard"])) out.add("dining-sideboards");
  if (isDining && hasAny(all, [" cabinet "])) out.add("dining-cabinets");
  if (hasAny(all, ["bar desk"]) || tags.includes("bar-tables")) out.add("bar-desks");
  if (hasAny(all, ["bar stool", "counter stool"])) out.add("bar-counter-stools");

  // Bedroom subtabs
  if (hasAny(all, ["bedroom"]) && hasAny(all, ["set"])) out.add("bedroom-sets");
  if (hasAny(all, ["bedside", "nightstand"]) && !isKids) out.add("bedside-cabinets");
  if (hasAny(all, ["chest of drawers"]) || tags.includes("chests")) out.add("chest-of-drawers");
  if (hasAny(all, ["wardrobe"])) out.add("wardrobes");
  if (hasAny(all, ["sliding wardrobe"])) out.add("sliding-wardrobes");
  if ((hasAny(all, [" bed "]) || hasAny(all, ["single bed", "double bed", "king bed"])) && !hasAny(all, ["bedside"])) out.add("beds");
  if (hasAny(all, ["ottoman"])) out.add("ottoman-storage");
  if (hasAny(all, ["bed slat", "slats"])) out.add("bed-slats");
  if (hasAny(all, ["mattress"])) out.add("mattresses");

  // Kids subtabs (strict: must include kids signal)
  if (isKids && hasAny(all, ["set"])) out.add("kids-room-sets");
  if (isKids && hasAny(all, [" bed "])) out.add("kids-beds");
  if (isKids && hasAny(all, ["accessor"])) out.add("kids-accessories");
  if (isKids && hasAny(all, ["wardrobe"])) out.add("kids-wardrobes");
  if (isKids && hasAny(all, [" cabinet "])) out.add("kids-cabinets");
  if (isKids && hasAny(all, ["chest"])) out.add("kids-chest-of-drawers");
  if (isKids && hasAny(all, ["desk"]) && !hasAny(all, ["chair"])) out.add("kids-desks");
  if (isKids && hasAny(all, ["gaming desk"])) out.add("kids-gaming-desks");
  if (isKids && hasAny(all, ["wall shelf"])) out.add("kids-wall-shelves");
  if (isKids && hasAny(all, ["bookcase"])) out.add("kids-bookcases");
  if (isKids && hasAny(all, cubeShelfTextSignals)) out.add("kids-cube-shelves");
  if (isKids && hasAny(all, ["toy storage"])) out.add("kids-toy-storage");

  // Office subtabs (align with FTG Office menu: desks, gaming, chairs, cabinets, bookcases, cubes, walls, professional)
  if (hasAny(all, ["gaming desk"])) out.add("gaming-desks");
  if (
    isOffice &&
    hasAny(all, ["desk"]) &&
    !hasAny(all, ["gaming desk"]) &&
    !hasAny(all, ["chair"])
  ) {
    out.add("desks");
  }
  if (hasAny(all, ["desk chair", "office chair"])) out.add("desk-chairs");
  if (
    isOffice &&
    (hasAny(all, [" cabinet "]) || (isOfficeType && hasAny(all, ["cabinet", "mobile cabinet"])))
  ) {
    out.add("office-cabinets");
  }
  if (hasAny(all, ["professional office"]) || (isOfficeType && hasAny(all, ["prima"]))) {
    out.add("professional-office");
  }
  if (isOfficeType && (hasAny(all, ["bookcase", "bookshelf"]) || tags.includes("bookcases"))) {
    out.add("bookcases");
  }
  if (isOfficeType && (hasAny(all, ["wall shelf", "floating shelf"]) || tags.includes("wall-shelves"))) {
    out.add("wall-shelves");
  }

  // Sofa subtabs
  if (isSofa) out.add("sofas");
  if (isSofa && hasAny(all, ["2 seater sofa", "2-seater sofa"])) out.add("sofas-2-seater");
  if (isSofa && hasAny(all, ["3 seater sofa", "3-seater sofa"])) out.add("sofas-3-seater");
  if (isSofa && hasAny(all, ["corner", "chaise"])) out.add("corner-sofas");

  return Array.from(out).sort();
}

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  const token = await getAdminAccessToken();
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": token },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(`Admin API error: ${res.status} ${JSON.stringify(json.errors || json).slice(0, 300)}`);
  }
  return json.data as T;
}

async function main() {
  let after: string | null = null;
  let updated = 0;
  let seen = 0;

  while (true) {
    const data: {
      products: {
        pageInfo: { hasNextPage: boolean; endCursor: string | null };
        edges: Array<{ node: ProductNode }>;
      };
    } = await gql(
      
      `query($first: Int!, $after: String) {
        products(first: $first, after: $after, sortKey: ID) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              handle
              title
              productType
              descriptionHtml
              tags
            }
          }
        }
      }`,
      { first: 100, after }
    );

    for (const edge of data.products.edges) {
      const p = edge.node;
      seen++;
      const subcats = classifySubcats(p).map((s) => `ftg_subcat:${s}`);
      const keep = (p.tags || []).filter((t) => !t.startsWith("ftg_subcat:"));
      const nextTags = Array.from(new Set([...keep, ...subcats]));
      const currentNormalized = Array.from(new Set(p.tags || [])).sort().join("|");
      const nextNormalized = Array.from(new Set(nextTags)).sort().join("|");
      const same = currentNormalized === nextNormalized;
      if (same) continue;

      await gql(
        `mutation($input: ProductInput!) {
          productUpdate(input: $input) {
            userErrors { message }
          }
        }`,
        { input: { id: p.id, tags: nextTags } }
      );
      updated++;
      if (updated % 50 === 0) {
        console.log(`updated tags on ${updated} products...`);
      }
    }

    if (!data.products.pageInfo.hasNextPage) break;
    after = data.products.pageInfo.endCursor;
    if (!after) break;
  }

  console.log(`Done. seen=${seen}, updated=${updated}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

