import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

const HANDLES = [
  "sofas",
  "beds",
  "mattresses",
  "dining",
  "living-room",
  "bedroom-furniture",
  "office",
  "kids",
  "sofas-4",
  "beds-4",
  "mattresses-4",
  "dining-4",
];

async function gql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  if (!domain) throw new Error("Missing SHOPIFY_STORE_DOMAIN");
  const token = await getAdminAccessToken();
  const res = await fetch(`https://${domain}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  const json = await res.json();
  if (!res.ok || json.errors?.length) {
    throw new Error(
      `Admin API error: ${res.status} ${JSON.stringify(json.errors || json).slice(0, 400)}`
    );
  }
  return json.data as T;
}

async function main() {
  const pubs = await gql<{
    publications: { edges: Array<{ node: { id: string; name: string } }> };
  }>(`query { publications(first: 25) { edges { node { id name } } } }`);

  const headlessPubs = pubs.publications.edges
    .map((e) => e.node)
    .filter((p) => p.name.toLowerCase().includes("headless"));

  if (!headlessPubs.length) {
    throw new Error("No headless publications found");
  }
  console.log("Headless publications:", headlessPubs.map((p) => p.name).join(", "));

  const cols = await gql<{
    collections: { edges: Array<{ node: { id: string; handle: string; title: string } }> };
  }>(`query { collections(first: 100) { edges { node { id handle title } } } }`);

  const byHandle = new Map(cols.collections.edges.map((e) => [e.node.handle, e.node]));

  for (const handle of HANDLES) {
    const c = byHandle.get(handle);
    if (!c) {
      console.log(`Missing collection: ${handle}`);
      continue;
    }
    for (const pub of headlessPubs) {
      const out = await gql<{
        publishablePublish: { userErrors: Array<{ message: string }> };
      }>(
        `mutation($id: ID!, $publicationId: ID!) {
          publishablePublish(id: $id, input: { publicationId: $publicationId }) {
            userErrors { message }
          }
        }`,
        { id: c.id, publicationId: pub.id }
      );
      const errs = out.publishablePublish.userErrors;
      if (errs.length) {
        console.log(`${handle} -> ${pub.name}: ${errs.map((e) => e.message).join("; ")}`);
      } else {
        console.log(`${handle} -> ${pub.name}: ok`);
      }
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

