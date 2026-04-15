#!/usr/bin/env node
/**
 * Ensure Beehive Furniture Wholesale vendor products are ACTIVE and published to
 * Online Store + Headless (runs assign-beehive-collections first).
 *
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN
 *
 * Usage:
 *   node scripts/beehive/ensure-beehive-storefront.mjs
 *   node scripts/beehive/ensure-beehive-storefront.mjs --skip-assign
 */

import path from "path";
import { spawnSync } from "node:child_process";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

const BEEHIVE_VENDOR_QUERY = 'vendor:"Beehive Furniture Wholesale"';

const skipAssign = process.argv.includes("--skip-assign");

function getConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain: domain || null, token: token || null };
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

async function fetchBeehiveProductIds(domain, token) {
  const ids = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await adminGraphql(
      domain,
      token,
      `query B($c: String, $q: String!) {
        products(first: 50, after: $c, query: $q) {
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
      { c: cursor, q: BEEHIVE_VENDOR_QUERY }
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

async function main() {
  const { domain, token } = getConfig();
  if (!domain || !token) {
    console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN).");
    process.exit(1);
  }

  if (!skipAssign) {
    console.error("[beehive-storefront] Running assign-beehive-collections…");
    const r = spawnSync(process.execPath, ["scripts/beehive/assign-beehive-collections.mjs"], {
      cwd: process.cwd(),
      stdio: "inherit",
      env: process.env,
    });
    if (r.status !== 0) {
      console.error("[beehive-storefront] assign-beehive-collections exited", r.status);
      process.exit(r.status ?? 1);
    }
  }

  console.error("[beehive-storefront] Loading publications…");
  const targets = await getPublicationTargets(domain, token);
  console.error("[beehive-storefront] Publications:", targets.allNames.join(", "));
  const inputs = publicationInputs(targets);
  if (!inputs.length) {
    console.error("[beehive-storefront] No Online Store / Headless publication IDs found.");
    process.exit(1);
  }

  console.error("[beehive-storefront] Loading Beehive vendor products…");
  const nodes = await fetchBeehiveProductIds(domain, token);
  if (!nodes.length) {
    console.error("[beehive-storefront] No Beehive vendor products. Run npm run beehive:import first.");
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
      console.error(`[beehive-storefront] ${n.title}:`, e.message || e);
    }
  }

  console.error(
    `[beehive-storefront] Products: total=${nodes.length} activated=${activated} channel_publish=${published} already_ok≈${skipped}`
  );
  console.error("\n[beehive-storefront] Done.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
