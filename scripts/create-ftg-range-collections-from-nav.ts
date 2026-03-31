import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain =
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

const RANGE_ITEMS: Array<{ label: string; handle: string }> = [
  { label: "4Kids", handle: "4kids" },
  { label: "4You", handle: "4you" },
  { label: "Albany", handle: "albany" },
  { label: "A-Line", handle: "a-line" },
  { label: "Alisma", handle: "alisma" },
  { label: "Angel", handle: "angel" },
  { label: "Angus", handle: "angus" },
  { label: "Arundel", handle: "arundel" },
  { label: "Avenale", handle: "avenale" },
  { label: "Barcelona", handle: "barcelona" },
  { label: "Barlow", handle: "barlow" },
  { label: "Basic", handle: "basic" },
  { label: "Best Chest", handle: "best-chest" },
  { label: "Bohol", handle: "bohol" },
  { label: "Brande", handle: "brande" },
  { label: "Brolo", handle: "brolo" },
  { label: "Brooke", handle: "brooke" },
  { label: "Brooklyn", handle: "brooklyn" },
  { label: "Calasetta", handle: "calasetta" },
  { label: "Celesto", handle: "celesto" },
  { label: "Century", handle: "century" },
  { label: "Cestino", handle: "cestino" },
  { label: "Chelsea", handle: "chelsea" },
  { label: "Corona", handle: "corona" },
  { label: "Cortina", handle: "cortina" },
  { label: "Cumbria", handle: "cumbria" },
  { label: "Darwin", handle: "darwin" },
  { label: "Dice & Mice", handle: "dice-mice" },
  { label: "Essential", handle: "essential" },
  { label: "Fribo", handle: "fribo" },
  { label: "Function Plus", handle: "function-plus" },
  { label: "Genoa", handle: "genoa" },
  { label: "Grafton", handle: "grafton" },
  { label: "Heaven", handle: "heaven" },
  { label: "High Rock", handle: "high-rock" },
  { label: "Ikast", handle: "ikast" },
  { label: "Imperial", handle: "imperial" },
  { label: "Jaipur", handle: "jaipur" },
  { label: "Klara", handle: "klara" },
  { label: "Langley", handle: "langley" },
  { label: "Lazio", handle: "lazio" },
  { label: "Line", handle: "line" },
  { label: "Linley", handle: "linley" },
  { label: "Lusaka", handle: "lusaka" },
  { label: "Lyon", handle: "lyon" },
  { label: "Madrid", handle: "madrid" },
  { label: "Malta", handle: "malta" },
  { label: "Marte", handle: "marte" },
  { label: "Match", handle: "match" },
  { label: "Mauro", handle: "mauro" },
  { label: "May", handle: "may" },
  { label: "Maze", handle: "maze" },
  { label: "Media", handle: "media" },
  { label: "Midfield", handle: "midfield" },
  { label: "Montreux", handle: "montreux" },
  { label: "Naia", handle: "naia" },
  { label: "Newcastle", handle: "newcastle" },
  { label: "Next", handle: "next" },
  { label: "Nikomedes", handle: "nikomedes" },
  { label: "Nova", handle: "nova" },
  { label: "Omaha", handle: "omaha" },
  { label: "Oslo", handle: "oslo" },
  { label: "Paris", handle: "paris" },
  { label: "Pepe", handle: "pepe" },
  { label: "Prima Professional Office", handle: "prima-professional-office" },
  { label: "Rapallo", handle: "rapallo" },
  { label: "Roomers", handle: "roomers" },
  { label: "Roxby", handle: "roxby" },
  { label: "Ry", handle: "ry" },
  { label: "Sali", handle: "sali" },
  { label: "Seaford", handle: "seaford" },
  { label: "Shetland", handle: "shetland" },
  { label: "Shoes", handle: "shoes" },
  { label: "Sienna", handle: "sienna" },
  { label: "Sofia", handle: "sofia" },
  { label: "Soli", handle: "soli" },
  { label: "Southampton", handle: "southampton" },
  { label: "Space", handle: "space" },
  { label: "Strington", handle: "strington" },
  { label: "Tezaur Gaming Desks", handle: "tezaur-gaming-desks" },
  { label: "Toronto", handle: "toronto" },
  { label: "Uppsala", handle: "uppsala" },
  { label: "Wensley", handle: "wensley" },
  { label: "Westham", handle: "westham" },
  { label: "Zingaro", handle: "zingaro" },
  { label: "Cabinet Light", handle: "cabinet-light" },
];

function titleToken(label: string): string {
  return label
    .replace(/\(NEW\)/gi, "")
    .replace(/&/g, " ")
    .replace(/[^\w\s-]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
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
    throw new Error(`Admin API error: ${res.status} ${JSON.stringify(json.errors || json).slice(0, 400)}`);
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

  for (const item of RANGE_ITEMS) {
    const token = titleToken(item.label);
    const rules: Array<{ column: "TAG" | "TITLE"; relation: "EQUALS" | "CONTAINS"; condition: string }> = [
      { column: "TAG", relation: "EQUALS", condition: `ftg_range:${item.handle}` },
    ];
    if (item.handle === "tezaur-gaming-desks") {
      rules.push({ column: "TAG", relation: "EQUALS", condition: "ftg_range:tezaur" });
    }
    // Nav groups two FTG ranges; products are tagged ftg_range:dice | ftg_range:mice from feed "range".
    if (item.handle === "dice-mice") {
      rules.push(
        { column: "TAG", relation: "EQUALS", condition: "ftg_range:dice" },
        { column: "TAG", relation: "EQUALS", condition: "ftg_range:mice" }
      );
    }
    // Feed range is "Prima"; nav label is longer.
    if (item.handle === "prima-professional-office") {
      rules.push({ column: "TAG", relation: "EQUALS", condition: "ftg_range:prima" });
    }
    // Keep a title fallback for ranges where upstream "range" field is generic (e.g. Bedside/Coffee table).
    if (token.length >= 3) {
      rules.push({ column: "TITLE", relation: "CONTAINS", condition: token });
    }
    const input = {
      title: item.label,
      handle: item.handle,
      ruleSet: {
        appliedDisjunctively: true,
        rules,
      },
    };

    let id = byHandle.get(item.handle);
    if (id) {
      const out = await gql<{ collectionUpdate: { collection?: { id: string }; userErrors: Array<{ message: string }> } }>(
        `mutation($input: CollectionInput!) { collectionUpdate(input: $input) { collection { id } userErrors { message } } }`,
        { input: { id, ...input } }
      );
      if (out.collectionUpdate.userErrors.length) {
        console.log(`update failed ${item.handle}: ${out.collectionUpdate.userErrors.map((e) => e.message).join("; ")}`);
        continue;
      }
      console.log(`updated: ${item.handle}`);
    } else {
      const out = await gql<{ collectionCreate: { collection?: { id: string }; userErrors: Array<{ message: string }> } }>(
        `mutation($input: CollectionInput!) { collectionCreate(input: $input) { collection { id } userErrors { message } } }`,
        { input }
      );
      if (out.collectionCreate.userErrors.length || !out.collectionCreate.collection?.id) {
        console.log(`create failed ${item.handle}: ${out.collectionCreate.userErrors.map((e) => e.message).join("; ")}`);
        continue;
      }
      id = out.collectionCreate.collection.id;
      console.log(`created: ${item.handle}`);
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

