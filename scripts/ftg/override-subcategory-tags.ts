import { config } from "dotenv";
import { getAdminAccessToken } from "../../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

// Controlled, explicit override list for currently empty tabs.
const OVERRIDES: Record<string, string[]> = {
  "ftg_subcat:kids-desks": [
    "angel-3-drawer-desk-4218062",
    "fribo-desk-2-drawer-in-golden-ribbeck-oak-40w610553",
    "fribo-desk-2-drawer-in-alpine-white-40w610657",
    "tezaur-black-gaming-desk-with-colour-changing-led-801tzrb225b3-z113",
  ],
  "ftg_subcat:mattresses": [
    "angel-single-bed-with-underbed-drawer-inc-slats-4219062",
    "naia-single-bed-3ft-90-x-190-in-black-matt-70275211gmgm",
    "naia-single-bed-3ft-90-x-190-in-white-high-gloss-70275211uuuu",
  ],
};

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
  for (const [tag, handles] of Object.entries(OVERRIDES)) {
    for (const handle of handles) {
      const lookup = await gql<{
        products: { edges: Array<{ node: { id: string; handle: string; tags: string[] } }> };
      }>(
        `query($query: String!) {
          products(first: 1, query: $query) {
            edges { node { id handle tags } }
          }
        }`,
        { query: `handle:${handle}` }
      );

      const node = lookup.products.edges[0]?.node;
      if (!node) {
        console.log(`missing: ${handle}`);
        continue;
      }

      const tags = new Set(node.tags || []);
      tags.add(tag);

      await gql(
        `mutation($input: ProductInput!) {
          productUpdate(input: $input) { userErrors { message } }
        }`,
        { input: { id: node.id, tags: [...tags] } }
      );

      console.log(`tagged ${node.handle} -> ${tag}`);
    }
  }
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : String(e));
  process.exit(1);
});

