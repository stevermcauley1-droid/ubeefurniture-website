import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

type Rule = { column: "TAG" | "TYPE"; relation: "EQUALS"; condition: string };
type TargetCollection = { title: string; handle: string; rules: Rule[] };

const TARGETS: TargetCollection[] = [
  {
    title: "Sofas",
    handle: "sofas",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Sofas" },
      { column: "TAG", relation: "EQUALS", condition: "sofa" },
    ],
  },
  {
    title: "Beds",
    handle: "beds",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Beds" },
      { column: "TAG", relation: "EQUALS", condition: "bed" },
    ],
  },
  {
    title: "Mattresses",
    handle: "mattresses",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Mattresses" },
      { column: "TAG", relation: "EQUALS", condition: "mattress" },
    ],
  },
  {
    title: "Dining",
    handle: "dining",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Dining" },
      { column: "TAG", relation: "EQUALS", condition: "dining" },
    ],
  },
  {
    title: "Living Room",
    handle: "living-room",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "sofa" },
      { column: "TAG", relation: "EQUALS", condition: "coffee-tables" },
      { column: "TAG", relation: "EQUALS", condition: "tv-cabinets" },
      { column: "TAG", relation: "EQUALS", condition: "sideboards" },
      { column: "TAG", relation: "EQUALS", condition: "bookcases" },
      { column: "TAG", relation: "EQUALS", condition: "cabinets" },
      { column: "TAG", relation: "EQUALS", condition: "lighting" },
      { column: "TAG", relation: "EQUALS", condition: "mirrors" },
      { column: "TAG", relation: "EQUALS", condition: "wall-shelves" },
      { column: "TAG", relation: "EQUALS", condition: "ottomans" },
    ],
  },
  {
    title: "Bedroom Furniture",
    handle: "bedroom-furniture",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "bed" },
      { column: "TAG", relation: "EQUALS", condition: "wardrobe" },
      { column: "TAG", relation: "EQUALS", condition: "chests" },
      { column: "TAG", relation: "EQUALS", condition: "dressing-tables" },
      { column: "TAG", relation: "EQUALS", condition: "mattress" },
    ],
  },
  {
    title: "Office",
    handle: "office",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "ftg_subcat:office" },
      { column: "TAG", relation: "EQUALS", condition: "desks" },
    ],
  },
  {
    title: "Kids",
    handle: "kids",
    rules: [
      { column: "TAG", relation: "EQUALS", condition: "ftg_subcat:kids" },
      { column: "TAG", relation: "EQUALS", condition: "kids" },
    ],
  },
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
    throw new Error(`Admin API error: ${res.status} ${JSON.stringify(json.errors || json).slice(0, 500)}`);
  }
  return json.data as T;
}

async function publications() {
  return gql<{ publications: { edges: Array<{ node: { id: string; name: string } }> } }>(
    `query { publications(first: 25) { edges { node { id name } } } }`
  );
}

async function ensureCollection(target: TargetCollection, onlineId: string | null, headlessId: string) {
  const found = await gql<{
    collections: { edges: Array<{ node: { id: string; handle: string } }> };
  }>(
    `query($q: String!) {
      collections(first: 5, query: $q) { edges { node { id handle } } }
    }`,
    { q: `handle:${target.handle}` }
  );

  const existing = found.collections.edges.find((e) => e.node.handle === target.handle)?.node || null;
  const input = {
    title: target.title,
    handle: target.handle,
    ruleSet: { appliedDisjunctively: true, rules: target.rules },
  };

  let id: string;
  if (existing) {
    const out = await gql<{
      collectionUpdate: { collection?: { id: string }; userErrors: Array<{ message: string }> };
    }>(
      `mutation($input: CollectionInput!) {
        collectionUpdate(input: $input) { collection { id } userErrors { message } }
      }`,
      { input: { id: existing.id, ...input } }
    );
    if (out.collectionUpdate.userErrors.length) {
      throw new Error(`collectionUpdate ${target.handle}: ${out.collectionUpdate.userErrors.map((e) => e.message).join("; ")}`);
    }
    id = out.collectionUpdate.collection!.id;
    console.log(`Updated collection ${target.handle}`);
  } else {
    const out = await gql<{
      collectionCreate: { collection?: { id: string }; userErrors: Array<{ message: string }> };
    }>(
      `mutation($input: CollectionInput!) {
        collectionCreate(input: $input) { collection { id } userErrors { message } }
      }`,
      { input }
    );
    if (out.collectionCreate.userErrors.length) {
      throw new Error(`collectionCreate ${target.handle}: ${out.collectionCreate.userErrors.map((e) => e.message).join("; ")}`);
    }
    id = out.collectionCreate.collection!.id;
    console.log(`Created collection ${target.handle}`);
  }

  const publishMutation = `mutation($id: ID!, $publicationId: ID!) {
    publishablePublish(id: $id, input: { publicationId: $publicationId }) { userErrors { message } }
  }`;

  if (onlineId) await gql(publishMutation, { id, publicationId: onlineId });
  await gql(publishMutation, { id, publicationId: headlessId });
}

async function publishProductsFor(handle: string, headlessName: string, headlessId: string) {
  const out = await gql<{
    collections: {
      edges: Array<{
        node: {
          handle: string;
          products: {
            edges: Array<{
              node: {
                id: string;
                resourcePublicationsV2: { edges: Array<{ node: { publication: { name: string } } }> };
              };
            }>;
          };
        };
      }>;
    };
  }>(
    `query($q: String!) {
      collections(first: 5, query: $q) {
        edges {
          node {
            handle
            products(first: 250) {
              edges {
                node {
                  id
                  resourcePublicationsV2(first: 25) { edges { node { publication { name } } } }
                }
              }
            }
          }
        }
      }
    }`,
    { q: `handle:${handle}` }
  );

  const col = out.collections.edges.find((e) => e.node.handle === handle)?.node;
  if (!col) {
    console.log(`Skip products publish; collection missing: ${handle}`);
    return;
  }

  let published = 0;
  let already = 0;
  for (const e of col.products.edges) {
    const p = e.node;
    const has = p.resourcePublicationsV2.edges.some(
      (x) => x.node.publication.name.toLowerCase() === headlessName.toLowerCase()
    );
    if (has) {
      already++;
      continue;
    }
    await gql(
      `mutation($id: ID!, $publicationId: ID!) {
        publishablePublish(id: $id, input: { publicationId: $publicationId }) { userErrors { message } }
      }`,
      { id: p.id, publicationId: headlessId }
    );
    published++;
  }
  console.log(`${handle}: products published_now=${published}, already=${already}, total=${col.products.edges.length}`);
}

async function main() {
  const pubs = await publications();
  const online = pubs.publications.edges.find((e) => e.node.name === "Online Store")?.node || null;
  const headless = pubs.publications.edges.find((e) => e.node.name.toLowerCase().includes("headless"))?.node;
  if (!headless) throw new Error("No headless publication found");
  console.log(`Using headless publication: ${headless.name}`);

  for (const t of TARGETS) {
    await ensureCollection(t, online?.id || null, headless.id);
  }
  for (const t of TARGETS) {
    await publishProductsFor(t.handle, headless.name, headless.id);
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

