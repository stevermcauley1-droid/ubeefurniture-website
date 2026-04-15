#!/usr/bin/env node
/**
 * Assign Wholesale Beds (vendor) products to storefront collections.
 *
 * Same rules as Beehive/Heartlands: set productType + tag so smart collections match; unmatched → manual fallback.
 *
 * Env: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_API_TOKEN or SHOPIFY_ADMIN_ACCESS_TOKEN
 *
 * Usage:
 *   node scripts/wholesalebeds/assign-wholesalebeds-collections.mjs
 *   node scripts/wholesalebeds/assign-wholesalebeds-collections.mjs --dry-run
 */

import path from "path";
import { createRequire } from "module";

const require = createRequire(import.meta.url);
require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });

const API_VERSION = process.env.SHOPIFY_ADMIN_API_VERSION || "2024-10";

/** Exact vendor string from wholesalebeds-scraper / import JSON. */
const WHOLESALE_BEDS_VENDOR_QUERY = 'vendor:"Wholesale Beds"';

const FALLBACK_MANUAL_HANDLE = "supplier-wholesalebeds-catalog";
const FALLBACK_MANUAL_TITLE = "Wholesale Beds catalog";

function getConfig() {
  const domain =
    process.env.SHOPIFY_STORE_DOMAIN ||
    process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
  const token =
    process.env.SHOPIFY_ADMIN_API_TOKEN ||
    process.env.SHOPIFY_ADMIN_ACCESS_TOKEN;
  return { domain: domain || null, token: token || null };
}

const dryRun = process.argv.includes("--dry-run");

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

/** @returns {{ productType: string, tag: string, collectionHandle: string } | null } */
function classifyTitle(title) {
  const t = String(title || "").toLowerCase();

  if (/\bmattress(es)?\b/.test(t)) {
    return { productType: "Mattresses", tag: "mattress", collectionHandle: "mattresses" };
  }
  if (/\bsofa\b|\bsettee\b|\bcouch\b|\bsofabed\b|\bsofa bed\b/.test(t)) {
    return { productType: "Sofas", tag: "sofa", collectionHandle: "sofas" };
  }
  if (/\bwardrobe\b/.test(t)) {
    return { productType: "Wardrobes", tag: "wardrobe", collectionHandle: "wardrobes" };
  }
  if (/\boffice\b/.test(t)) {
    return { productType: "Office", tag: "office", collectionHandle: "office" };
  }
  if (/\bdining\b|\bdining table\b|\bkitchen table\b/.test(t)) {
    return { productType: "Dining", tag: "dining", collectionHandle: "dining" };
  }
  if (/\btable\b/.test(t) && !/\bcoffee\b|\bconsole\b|\bend\b|\blamp\b|\bbedside\b/.test(t)) {
    return { productType: "Dining", tag: "dining", collectionHandle: "dining" };
  }
  if (/\bheadboard\b/.test(t)) {
    return { productType: "Beds", tag: "bed", collectionHandle: "beds" };
  }
  if (/\bottoman\b/.test(t)) {
    return { productType: "Beds", tag: "bed", collectionHandle: "beds" };
  }
  if (/\bdivan\b/.test(t)) {
    return { productType: "Beds", tag: "bed", collectionHandle: "beds" };
  }
  if (/\bbunk\b/.test(t)) {
    return { productType: "Beds", tag: "bed", collectionHandle: "beds" };
  }
  if (/\bbed\b/.test(t) && !/\bbedside\b|\bbedding\b/.test(t)) {
    return { productType: "Beds", tag: "bed", collectionHandle: "beds" };
  }
  return null;
}

async function fetchAllWholesaleBedsProducts(domain, token) {
  const out = [];
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await adminGraphql(
      domain,
      token,
      `query WholesaleBedsProducts($cursor: String, $q: String!) {
        products(first: 50, after: $cursor, query: $q, sortKey: UPDATED_AT) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              title
              status
              tags
              productType
            }
          }
        }
      }`,
      { cursor, q: WHOLESALE_BEDS_VENDOR_QUERY }
    );
    const conn = data?.products;
    for (const e of conn?.edges || []) {
      if (e?.node) out.push(e.node);
    }
    hasNext = conn?.pageInfo?.hasNextPage;
    cursor = conn?.pageInfo?.endCursor || null;
    if (!hasNext) break;
    await sleep(150);
  }
  return out;
}

async function fetchCollectionsIndex(domain, token) {
  const byHandle = new Map();
  let cursor = null;
  let hasNext = true;
  while (hasNext) {
    const data = await adminGraphql(
      domain,
      token,
      `query Colls($cursor: String) {
        collections(first: 100, after: $cursor) {
          pageInfo { hasNextPage endCursor }
          edges {
            node {
              id
              handle
              ruleSet {
                rules { column relation condition }
              }
            }
          }
        }
      }`,
      { cursor }
    );
    const conn = data?.collections;
    for (const e of conn?.edges || []) {
      const n = e?.node;
      if (!n?.handle) continue;
      const rules = n.ruleSet?.rules;
      byHandle.set(n.handle, {
        id: n.id,
        handle: n.handle,
        isSmart: Array.isArray(rules) && rules.length > 0,
      });
    }
    hasNext = conn?.pageInfo?.hasNextPage;
    cursor = conn?.pageInfo?.endCursor || null;
    if (!hasNext) break;
    await sleep(150);
  }
  return byHandle;
}

function pickCollectionHandle(preferred, byHandle) {
  if (byHandle.has(preferred)) return preferred;
  const alt = `${preferred}-4`;
  if (byHandle.has(alt)) return alt;
  return null;
}

async function getPublicationIds(domain, token) {
  const data = await adminGraphql(
    domain,
    token,
    `query GetPublications {
      publications(first: 25) {
        edges { node { id name } }
      }
    }`
  );
  const edges = data?.publications?.edges || [];
  const headlessIds = edges
    .filter((e) => String(e.node.name || "").toLowerCase().includes("headless"))
    .map((e) => e.node.id);
  const onlineStore = edges.find((e) => e.node.name === "Online Store");
  return {
    headlessIds,
    onlineStoreId: onlineStore?.node?.id ?? null,
  };
}

async function publishCollection(domain, token, collectionId, publicationIds) {
  const inputs = [];
  for (const hid of publicationIds.headlessIds || []) {
    if (hid) inputs.push({ publicationId: hid });
  }
  if (publicationIds.onlineStoreId) {
    inputs.push({ publicationId: publicationIds.onlineStoreId });
  }
  if (!inputs.length) return;
  const data = await adminGraphql(
    domain,
    token,
    `mutation PublishablePublish($id: ID!, $input: [PublicationInput!]!) {
      publishablePublish(id: $id, input: $input) {
        userErrors { field message }
      }
    }`,
    { id: collectionId, input: inputs }
  );
  const errs = data?.publishablePublish?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function ensureManualFallbackCollection(domain, token, publicationIds) {
  const existing = await adminGraphql(
    domain,
    token,
    `query OneColl($q: String!) {
      collections(first: 5, query: $q) {
        edges { node { id handle } }
      }
    }`,
    { q: `handle:${FALLBACK_MANUAL_HANDLE}` }
  );
  const node = existing?.collections?.edges?.[0]?.node;
  if (node?.id) return node.id;

  const created = await adminGraphql(
    domain,
    token,
    `mutation CreateManualColl($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection { id handle }
        userErrors { field message }
      }
    }`,
    {
      input: {
        title: FALLBACK_MANUAL_TITLE,
        handle: FALLBACK_MANUAL_HANDLE,
        descriptionHtml: "<p>Wholesale Beds products pending manual categorization.</p>",
      },
    }
  );
  const pay = created?.collectionCreate;
  const errs = pay?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
  const id = pay?.collection?.id;
  if (!id) throw new Error("collectionCreate returned no id");
  try {
    await publishCollection(domain, token, id, publicationIds);
  } catch (e) {
    console.warn("[wholesalebeds-collections] publish new manual collection:", e.message);
  }
  return id;
}

async function collectionAddProducts(domain, token, collectionId, productIds) {
  if (!productIds.length) return;
  const data = await adminGraphql(
    domain,
    token,
    `mutation AddProds($id: ID!, $productIds: [ID!]!) {
      collectionAddProducts(id: $id, productIds: $productIds) {
        userErrors { field message }
      }
    }`,
    { id: collectionId, productIds }
  );
  const errs = data?.collectionAddProducts?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

async function collectionAddProductsWithRetry(
  domain,
  token,
  collectionId,
  productIds,
  attempts = 3
) {
  let lastErr = null;
  for (let i = 0; i < attempts; i++) {
    try {
      await collectionAddProducts(domain, token, collectionId, productIds);
      return;
    } catch (e) {
      lastErr = e;
      const msg = e?.message || String(e);
      if (!/HTTP 5\d\d|timeout|temporar|thrott/i.test(msg) || i === attempts - 1) {
        throw e;
      }
      await sleep(400 * (i + 1));
    }
  }
  throw lastErr;
}

function isSkippableCollectionAddError(message) {
  const m = String(message || "");
  const l = m.toLowerCase();
  if (l.includes("already")) return true;
  if (l.includes("belong") && l.includes("collection")) return true;
  if (l.includes("exist") && l.includes("collection")) return true;
  if (l.includes("present in the input collection")) return true;
  if (/error adding\s+.+\s+to collection/i.test(m)) return true;
  return false;
}

async function productUpdate(domain, token, { id, tags, productType, status }) {
  const data = await adminGraphql(
    domain,
    token,
    `mutation PU($input: ProductInput!) {
      productUpdate(input: $input) {
        userErrors { field message }
        product { id status }
      }
    }`,
    {
      input: {
        id,
        tags,
        productType,
        ...(status ? { status } : {}),
      },
    }
  );
  const out = data?.productUpdate;
  const errs = out?.userErrors?.filter((e) => e.message) || [];
  if (errs.length) throw new Error(errs.map((e) => e.message).join("; "));
}

const SUPPLIER_TAGS = ["wholesalebeds", "supplier-wholesalebeds", "featured"];

async function main() {
  const { domain, token } = getConfig();
  if (!domain || !token) {
    console.error("Set SHOPIFY_STORE_DOMAIN and SHOPIFY_ADMIN_API_TOKEN (or SHOPIFY_ADMIN_ACCESS_TOKEN).");
    process.exit(1);
  }

  console.error("[wholesalebeds-collections] Loading collections index…");
  const byHandle = await fetchCollectionsIndex(domain, token);
  const publicationIds = await getPublicationIds(domain, token);

  const required = ["sofas", "beds", "mattresses", "dining"];
  const missing = required.filter((h) => !pickCollectionHandle(h, byHandle));
  if (missing.length) {
    console.warn(
      "[wholesalebeds-collections] Missing collection handles (create in Admin or run scripts/create-collections.ts):",
      missing.join(", ")
    );
  }

  console.error(`[wholesalebeds-collections] Loading products (${WHOLESALE_BEDS_VENDOR_QUERY})…`);
  const products = await fetchAllWholesaleBedsProducts(domain, token);
  if (!products.length) {
    console.error("No Wholesale Beds vendor products found. Import first: npm run wholesalebeds:import");
    process.exit(1);
  }

  let manualFallbackId = null;
  const fallbackProductIds = [];

  let updated = 0;
  let activated = 0;
  let manualAdds = 0;
  let errors = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    const cls = classifyTitle(p.title);
    const baseTags = Array.isArray(p.tags) ? [...p.tags] : [];
    const needActive = p.status && String(p.status) !== "ACTIVE";

    try {
      if (dryRun) {
        console.log(
          `[dry-run] ${p.title.slice(0, 60)}… → ${cls ? `${cls.collectionHandle} (smart: type=${cls.productType} tag=${cls.tag})` : "manual fallback"}${needActive ? " +ACTIVE" : ""}`
        );
        continue;
      }

      if (cls) {
        const h = pickCollectionHandle(cls.collectionHandle, byHandle);
        const coll = h ? byHandle.get(h) : null;
        const mergedTags = [...new Set([...baseTags, cls.tag, ...SUPPLIER_TAGS])];
        await productUpdate(domain, token, {
          id: p.id,
          tags: mergedTags,
          productType: cls.productType,
          status: needActive ? "ACTIVE" : undefined,
        });
        if (needActive) activated++;

        if (coll?.isSmart) {
          /* membership is automatic via type/tag */
        } else if (coll && !coll.isSmart && h) {
          await collectionAddProducts(domain, token, coll.id, [p.id]);
        }
        updated++;
      } else {
        const mergedTags = [...new Set([...baseTags, ...SUPPLIER_TAGS])];
        await productUpdate(domain, token, {
          id: p.id,
          tags: mergedTags,
          productType: p.productType || "Furniture",
          status: needActive ? "ACTIVE" : undefined,
        });
        if (needActive) activated++;
        if (!manualFallbackId) {
          manualFallbackId = await ensureManualFallbackCollection(
            domain,
            token,
            publicationIds
          );
        }
        fallbackProductIds.push(p.id);
        updated++;
      }

      if ((i + 1) % 5 === 0) await sleep(200);
    } catch (e) {
      errors++;
      console.error(`[${i + 1}] ${p.title}:`, e.message || e);
    }
  }

  if (!dryRun && fallbackProductIds.length && manualFallbackId) {
    const unique = [...new Set(fallbackProductIds)];
    let manualOk = 0;
    let manualDup = 0;
    let manualFail = 0;
    for (let i = 0; i < unique.length; i++) {
      const pid = unique[i];
      try {
        await collectionAddProductsWithRetry(domain, token, manualFallbackId, [pid], 4);
        manualOk++;
      } catch (e) {
        const msg = e?.message || String(e);
        if (isSkippableCollectionAddError(msg)) {
          manualDup++;
        } else {
          manualFail++;
          console.warn(`[wholesalebeds-collections] manual add ${pid}:`, msg);
        }
      }
      if ((i + 1) % 5 === 0) await sleep(150);
    }
    manualAdds = manualOk;
    console.error(
      `[wholesalebeds-collections] Manual ${FALLBACK_MANUAL_HANDLE}: added=${manualOk} already_in=${manualDup} other_errors=${manualFail}`
    );
    if (manualFail) errors += manualFail;
  }

  console.error(
    `\nDone${dryRun ? " (dry-run)" : ""}. products=${products.length} updated=${updated} activated=${activated} manual_adds=${manualAdds} errors=${errors}`
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
