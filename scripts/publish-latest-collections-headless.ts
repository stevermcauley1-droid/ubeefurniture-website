import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

const TARGET_HANDLES = new Set([
  "sofas-4",
  "beds-4",
  "mattresses-4",
  "wardrobes-4",
  "dining-4",
  "package-deals-4",
  "landlord-packs-4",
  "sale-1",
]);

type GqlResp<T> = { data?: T; errors?: Array<{ message: string }> };

async function adminGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
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
  const json = (await res.json()) as GqlResp<T>;
  if (!res.ok || json.errors?.length) {
    throw new Error(
      `Admin API error: ${res.status} ${res.statusText} ${JSON.stringify(json.errors || json)}`
    );
  }
  return json.data as T;
}

async function main() {
  const pubs = await adminGraphql<{
    publications: { edges: Array<{ node: { id: string; name: string } }> };
  }>(`query { publications(first: 25) { edges { node { id name } } } }`);

  const names = pubs.publications.edges.map((e) => e.node.name);
  const headless =
    pubs.publications.edges.find((e) => e.node.name.toLowerCase() === "headless") ||
    pubs.publications.edges.find((e) => e.node.name.toLowerCase().includes("headless"));
  if (!headless?.node?.id) {
    throw new Error(`Could not find a publication containing 'headless'. Seen: ${names.join(", ")}`);
  }

  const collections = await adminGraphql<{
    collections: {
      edges: Array<{
        node: {
          id: string;
          handle: string;
          title: string;
          resourcePublicationsV2: {
            edges: Array<{ node: { publication: { id: string; name: string } } }>;
          };
        };
      }>;
    };
  }>(
    `query {
      collections(first: 100) {
        edges {
          node {
            id
            handle
            title
            resourcePublicationsV2(first: 25) {
              edges {
                node {
                  publication { id name }
                }
              }
            }
          }
        }
      }
    }`
  );

  let updated = 0;
  let already = 0;
  let missing = 0;

  for (const edge of collections.collections.edges) {
    const c = edge.node;
    if (!TARGET_HANDLES.has(c.handle)) continue;
    const hasHeadless = c.resourcePublicationsV2.edges.some(
      (p) => p.node.publication.name.toLowerCase() === "headless"
    );
    if (hasHeadless) {
      already++;
      console.log(`Already on Headless: ${c.title} (${c.handle})`);
      continue;
    }

    const out = await adminGraphql<{
      publishablePublish: { userErrors: Array<{ message: string }> };
    }>(
      `mutation PublishCollection($id: ID!, $publicationId: ID!) {
        publishablePublish(id: $id, input: { publicationId: $publicationId }) {
          userErrors { message }
        }
      }`,
      { id: c.id, publicationId: headless.node.id }
    );

    if (out.publishablePublish.userErrors.length) {
      missing++;
      console.log(
        `Failed publish: ${c.title} (${c.handle}) -> ${out.publishablePublish.userErrors
          .map((e) => e.message)
          .join("; ")}`
      );
      continue;
    }
    updated++;
    console.log(`Published to Headless: ${c.title} (${c.handle})`);
  }

  console.log(`\nSummary: updated=${updated} already=${already} failed=${missing}`);
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

