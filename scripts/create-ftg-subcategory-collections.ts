import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

type Def = { title: string; handle: string };

const DEFS: Def[] = [
  { title: "Living Room Sets", handle: "living-room-sets" },
  { title: "Living Sideboards", handle: "living-sideboards" },
  { title: "Living Cabinets", handle: "living-cabinets" },
  { title: "TV Units", handle: "tv-units" },
  { title: "Lounge Chairs", handle: "lounge-chairs" },
  { title: "Console Tables", handle: "console-tables" },
  { title: "Coffee Tables", handle: "coffee-tables" },
  { title: "Side Tables", handle: "side-tables" },
  { title: "Nest of Tables", handle: "nest-of-tables" },
  { title: "Cube Shelves", handle: "cube-shelves" },
  { title: "Bookcases", handle: "bookcases" },
  { title: "Mirrors", handle: "mirrors" },
  { title: "Coat Racks", handle: "coat-racks" },
  { title: "Shoe Storage Cabinets", handle: "shoe-storage-cabinets" },
  { title: "Wall Shelves", handle: "wall-shelves" },
  { title: "Cabinet Lights", handle: "cabinet-lights" },
  { title: "Accessories", handle: "accessories" },
  { title: "Dining Sets", handle: "dining-sets" },
  { title: "Dining Tables", handle: "dining-tables" },
  { title: "Dining Chairs", handle: "dining-chairs" },
  { title: "Dining Sideboards", handle: "dining-sideboards" },
  { title: "Dining Cabinets", handle: "dining-cabinets" },
  { title: "Bar Desks", handle: "bar-desks" },
  { title: "Bar and Counter Stools", handle: "bar-counter-stools" },
  { title: "Bedroom Sets", handle: "bedroom-sets" },
  { title: "Bedside Cabinets", handle: "bedside-cabinets" },
  { title: "Chest of Drawers", handle: "chest-of-drawers" },
  { title: "Sliding Wardrobes", handle: "sliding-wardrobes" },
  { title: "Ottoman Storage", handle: "ottoman-storage" },
  { title: "Bed Slats", handle: "bed-slats" },
  { title: "Kids Room Sets", handle: "kids-room-sets" },
  { title: "Kids Beds", handle: "kids-beds" },
  { title: "Kids Accessories", handle: "kids-accessories" },
  { title: "Kids Wardrobes", handle: "kids-wardrobes" },
  { title: "Kids Cabinets", handle: "kids-cabinets" },
  { title: "Kids Chest of Drawers", handle: "kids-chest-of-drawers" },
  { title: "Kids Desks", handle: "kids-desks" },
  { title: "Kids Gaming Desks", handle: "kids-gaming-desks" },
  { title: "Kids Wall Shelves", handle: "kids-wall-shelves" },
  { title: "Kids Bookcases", handle: "kids-bookcases" },
  { title: "Kids Cube Shelves", handle: "kids-cube-shelves" },
  { title: "Kids Toy Storage", handle: "kids-toy-storage" },
  { title: "Desks", handle: "desks" },
  { title: "Gaming Desks", handle: "gaming-desks" },
  { title: "Desk Chairs", handle: "desk-chairs" },
  { title: "Office Cabinets", handle: "office-cabinets" },
  { title: "Professional Office", handle: "professional-office" },
  { title: "2 Seater Sofas", handle: "sofas-2-seater" },
  { title: "3 Seater Sofas", handle: "sofas-3-seater" },
  { title: "Corner Sofas", handle: "corner-sofas" },
];

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
  const pubs = await gql<{ publications: { edges: Array<{ node: { id: string; name: string } }> } }>(
    `query { publications(first: 25) { edges { node { id name } } } }`
  );
  const pubIds = pubs.publications.edges
    .map((e) => e.node)
    .filter((p) => p.name === "Online Store" || p.name.toLowerCase().includes("headless"))
    .map((p) => p.id);

  const existing = await gql<{ collections: { edges: Array<{ node: { id: string; handle: string } }> } }>(
    `query { collections(first: 250) { edges { node { id handle } } } }`
  );
  const byHandle = new Map(existing.collections.edges.map((e) => [e.node.handle, e.node.id]));

  for (const d of DEFS) {
    const input = {
      title: d.title,
      handle: d.handle,
      ruleSet: {
        appliedDisjunctively: false,
        rules: [{ column: "TAG", relation: "EQUALS", condition: `ftg_subcat:${d.handle}` }],
      },
    };

    const existingId = byHandle.get(d.handle);
    let id = existingId;
    if (existingId) {
      const out = await gql<{ collectionUpdate: { collection?: { id: string }; userErrors: Array<{ message: string }> } }>(
        `mutation($input: CollectionInput!) { collectionUpdate(input: $input) { collection { id } userErrors { message } } }`,
        { input: { id: existingId, ...input } }
      );
      if (out.collectionUpdate.userErrors.length) {
        console.log(`update failed ${d.handle}: ${out.collectionUpdate.userErrors.map((e) => e.message).join("; ")}`);
        continue;
      }
      id = out.collectionUpdate.collection?.id || existingId;
      console.log(`updated: ${d.handle}`);
    } else {
      const out = await gql<{ collectionCreate: { collection?: { id: string }; userErrors: Array<{ message: string }> } }>(
        `mutation($input: CollectionInput!) { collectionCreate(input: $input) { collection { id } userErrors { message } } }`,
        { input }
      );
      if (out.collectionCreate.userErrors.length) {
        console.log(`create failed ${d.handle}: ${out.collectionCreate.userErrors.map((e) => e.message).join("; ")}`);
        continue;
      }
      id = out.collectionCreate.collection?.id || null;
      if (!id) continue;
      console.log(`created: ${d.handle}`);
    }

    for (const pubId of pubIds) {
      await gql(
        `mutation($id: ID!, $publicationId: ID!) { publishablePublish(id: $id, input: { publicationId: $publicationId }) { userErrors { message } } }`,
        { id, publicationId: pubId }
      );
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

