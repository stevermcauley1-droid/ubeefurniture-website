#!/usr/bin/env node
/**
 * Ensure vendor:Heartlands products are ACTIVE, published to Online Store + Headless,
 * and eligible for smart collections (runs assign-heartlands-collections first).
 * Publishes the dining collection to the same channels if needed.
 *
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN
 *
 * Usage:
 *   node scripts/heartlands/ensure-heartlands-storefront.mjs
 *   node scripts/heartlands/ensure-heartlands-storefront.mjs --skip-assign
 */

import path from "path";
import { spawnSync } from "node:child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";
const STOREFRONT_API_VERSION = "2024-01";

const skipAssign = process.argv.includes("--skip-assign");

function getConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  const sf =
    process.env.SHOPIFY_STOREFRONT_ACCESS_TOKEN ||
    process.env.SHOPIFY_STOREFRONT_TOKEN;
  return { domain: domain || null, token: token || null, storefrontToken: sf || null };
}

async function adminGraphql(domain, token, query, variables = {}) {
  const url = `https://${domain}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    throw new Error(`Admin API HTTP ${res.status}: ${res.statusText}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e) => e.message).join("; "));
  }
  return json.data;
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function getPublicationTargets(domain, token) {
  const data = await adminGraphql(
    domain,
    token,
    `query Pubs {
      publications(first: 25) {
        edges { node { id name } }
      }
    }`
  );
  const edges = data?.publications?.edges || [];
  const headless = edges
    .filter((e) => String(e.node.name || "").toLowerCase().includes("headless"))
    .map((e) => e.node.id);
  const online = edges.find((e) => e.node.name === "Online Store")?.node?.id ?? null;
  return { headlessIds: headless, onlineStoreId: online, allNames: edges.map((e) => e.node.name) };
}

function publicationInputs(targets) {
  const inputs = [];
  for (const id of targets.headlessIds || []) {
    if (id) inputs.push({ publicationId: id });
  }
  if (targets.onlineStoreId) inputs.push({ publicationId: targets.onlineStoreId });
  return inputs;
}

async function publishablePublish(domain, token, resourceId, inputs) {
  if (!inputs.length) return { ok: false, reason: "no_publications" };
  const data = await adminGraphql(
    domain,
    token,
    `mutation PP($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: resourceId, input: inputs }
  );
  const errs = data?.publishablePublish?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
  return { ok: true };
}

async function productSetActive(domain, token, productId) {
  const data = await adminGraphql(
    domain,
    token,
    `mutation PU($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { message }
        product { id status }
      }
    }`,
    { input: { id: productId, status: "ACTIVE" } }
  );
  const errs = data?.productUpdate?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function fetchHeartlandsProductIds(domain, token) {
  const ids = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await adminGraphql(
      domain,
      token,
      `query H($c: String) {
        products(first: 50, after: $c, query: "vendor:Heartlands") {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              status
              resourcePublicationsV2(first: 20) {
                edges {
                  node {
                    isPublished
                    publication { id name }
                  }
                }
              }
            }
          }
        }
      }`,
      { c: cursor }
    );
    const conn = data?.products;
    for (const e of conn?.edges || []) {
      if (e?.node?.id) ids.push(e.node);
    }
    hasNext = conn?.pageInfo?.hasNextPage;
    cursor = conn?.pageInfo?.endCursor || null;
    if (!hasNext) break;
    await sleep(120);
  }
  return ids;
}

function needsChannelPublish(node, targets) {
  const publishedIds = new Set();
  for (const e of node.resourcePublicationsV2?.edges || []) {
    if (e?.node?.isPublished && e?.node?.publication?.id) {
      publishedIds.add(e.node.publication.id);
    }
  }
  const required = [...targets.headlessIds, targets.onlineStoreId].filter(Boolean);
  return required.some((id) => !publishedIds.has(id));
}

async function findDiningCollection(domain, token) {
  for (const q of ["handle:dining", "handle:dining-4"]) {
    const data = await adminGraphql(
      domain,
      token,
      `query C($query: String!) {
        collections(first: 3, query: $query) {
          edges {
            node {
              id
              handle
              title
              ruleSet {
                appliedDisjunctively
                rules { column relation condition }
              }
              resourcePublicationsV2(first: 12) {
                edges {
                  node {
                    isPublished
                    publication { id name }
                  }
                }
              }
            }
          }
        }
      }`,
      { query: q }
    );
    const edge = data?.collections?.edges?.[0];
    if (edge?.node) return edge.node;
  }
  return null;
}

async function storefrontDiningSample(domain, storefrontToken) {
  const query = `query D($h: String!) {
    collection(handle: $h) {
      title
      products(first: 10, sortKey: COLLECTION_DEFAULT) {
        edges { node { title } }
      }
    }
  }`;
  const res = await fetch(`https://${domain}/api/${STOREFRONT_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Shopify-Storefront-Private-Token": storefrontToken,
    },
    body: JSON.stringify({ query, variables: { h: "dining" } }),
  });
  const j = await res.json();
  if (j.errors?.length) {
    return { error: j.errors.map((e) => e.message).join("; ") };
  }
  const edges = j.data?.collection?.products?.edges || [];
  const titles = edges.map((e) => e.node.title);
  return { count: edges.length, titles };
}

async function main() {
  const { domain, token, storefrontToken } = getConfig();
  if (!domain || !token) {
    console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN).");
    process.exit(1);
  }

  if (!skipAssign) {
    console.error("[ensure-storefront] Running assign-heartlands-collections (smart rules / tags)…");
    const r = spawnSync(process.execPath, ["scripts/heartlands/assign-heartlands-collections.mjs"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      console.error("[ensure-storefront] assign-heartlands-collections exited", r.status);
      process.exit(r.status ?? 1);
    }
  }

  console.error("[ensure-storefront] Loading publications…");
  const targets = await getPublicationTargets(domain, token);
  console.error("[ensure-storefront] Publications:", targets.allNames.join(", "));
  const inputs = publicationInputs(targets);
  if (!inputs.length) {
    console.error("[ensure-storefront] No Online Store / Headless publication IDs found.");
    process.exit(1);
  }

  console.error("[ensure-storefront] Loading Heartlands products…");
  const nodes = await fetchHeartlandsProductIds(domain, token);
  if (!nodes.length) {
    console.error("[ensure-storefront] No vendor:Heartlands products.");
    process.exit(1);
  }

  let activated = 0;
  let published = 0;
  let skipped = 0;

  for (let i = 0; i < nodes.length; i++) {
    const n = nodes[i];
    try {
      if (String(n.status) !== "ACTIVE") {
        await productSetActive(domain, token, n.id);
        activated++;
      }
      if (needsChannelPublish(n, targets)) {
        await publishablePublish(domain, token, n.id, inputs);
        published++;
      } else {
        skipped++;
      }
      if ((i + 1) % 5 === 0) await sleep(200);
    } catch (e) {
      console.error(`[ensure-storefront] ${n.title}:`, e.message || e);
    }
  }

  console.error(
    `[ensure-storefront] Products: total=${nodes.length} activated=${activated} channel_publish=${published} already_ok≈${skipped}`
  );

  const dining = await findDiningCollection(domain, token);
  if (!dining) {
    console.error("[ensure-storefront] No dining collection (handle dining / dining-4).");
  } else {
    const smart = Array.isArray(dining.ruleSet?.rules) && dining.ruleSet.rules.length > 0;
    console.error(
      `[ensure-storefront] Collection "${dining.title}" (${dining.handle}) smart=${smart} rules=${smart ? dining.ruleSet.rules.length : 0}`
    );
    if (smart) {
      for (const r of dining.ruleSet.rules) {
        console.error(`  rule: ${r.column} ${r.relation} ${r.condition ?? ""}`);
      }
    }
    const pubEdges = dining.resourcePublicationsV2?.edges || [];
    const missingPub = pubEdges.some((e) => !e?.node?.isPublished);
    if (missingPub || pubEdges.length === 0) {
      try {
        await publishablePublish(domain, token, dining.id, inputs);
        console.error("[ensure-storefront] Published dining collection to target channels.");
      } catch (e) {
        console.error("[ensure-storefront] Collection publish:", e.message || e);
      }
    }
  }

  if (storefrontToken) {
    console.error("[ensure-storefront] Storefront API sample (dining, first 10 titles)…");
    const sample = await storefrontDiningSample(domain, storefrontToken);
    if (sample.error) console.error("  error:", sample.error);
    else console.error("  count:", sample.count, "\n  titles:", sample.titles.slice(0, 10).join(" | "));
  } else {
    console.error("[ensure-storefront] Skip Storefront query (no SHOPIFY_STOREFRONT_ACCESS_TOKEN).");
  }

  console.error("\n[ensure-storefront] Done. Reload http://localhost:3000/collections/dining");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
