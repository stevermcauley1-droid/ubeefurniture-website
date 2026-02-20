/**
 * Create automated collections in Shopify Admin.
 * Run: npx tsx scripts/create-collections.ts
 * 
 * Requires: SHOPIFY_STORE_DOMAIN, SHOPIFY_ADMIN_ACCESS_TOKEN (Admin API, write_products scope)
 */

import { config } from "dotenv";
import { getAdminAccessToken } from "../lib/shopify-auth";

config({ path: ".env.local" });
config({ path: ".env" });

const domain = () =>
  process.env.SHOPIFY_STORE_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN;
const API_VERSION = "2024-01";

interface CollectionRule {
  column: "TAG" | "TYPE" | "TITLE" | "IS_PRICE_REDUCED" | "VARIANT_COMPARE_AT_PRICE";
  relation: "EQUALS" | "CONTAINS" | "IS_SET" | "GREATER_THAN";
  condition?: string;
}

interface CollectionInput {
  title: string;
  description?: string;
  rules: CollectionRule[];
  published: boolean;
}

const COLLECTIONS_TO_CREATE: CollectionInput[] = [
  {
    title: "Sofas",
    description: "Browse our range of sofas",
    // Use TYPE (productType set by sync script) or TAG EQUALS (exact match)
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Sofas" },
      { column: "TAG", relation: "EQUALS", condition: "sofa" },
    ],
    published: true,
  },
  {
    title: "Beds",
    description: "Bedroom furniture and beds",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Beds" },
      { column: "TAG", relation: "EQUALS", condition: "bed" },
    ],
    published: true,
  },
  {
    title: "Mattresses",
    description: "Mattresses and bedding",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Mattresses" },
      { column: "TAG", relation: "EQUALS", condition: "mattress" },
    ],
    published: true,
  },
  {
    title: "Wardrobes",
    description: "Wardrobes and storage solutions",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Wardrobes" },
      { column: "TAG", relation: "EQUALS", condition: "wardrobe" },
    ],
    published: true,
  },
  {
    title: "Dining",
    description: "Dining tables, chairs, and sets",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Dining" },
      { column: "TAG", relation: "EQUALS", condition: "dining" },
    ],
    published: true,
  },
  {
    title: "Package Deals",
    description: "Package deals and bundles",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Packages" },
      { column: "TAG", relation: "EQUALS", condition: "package" },
    ],
    published: true,
  },
  {
    title: "Landlord Packs",
    description: "Furniture packs for landlords and rental properties",
    rules: [
      { column: "TYPE", relation: "EQUALS", condition: "Landlord Packs" },
      { column: "TAG", relation: "EQUALS", condition: "landlord" },
    ],
    published: true,
  },
  {
    title: "Sale",
    description: "Products on sale (has compare at price set)",
    // Use VARIANT_COMPARE_AT_PRICE GREATER_THAN 0 instead
    rules: [{ column: "VARIANT_COMPARE_AT_PRICE", relation: "GREATER_THAN", condition: "0" }],
    published: true,
  },
];

async function adminGraphql<T>(query: string, variables?: Record<string, unknown>): Promise<T> {
  const d = domain();
  if (!d) {
    throw new Error("Set SHOPIFY_STORE_DOMAIN in .env.local");
  }
  
  // Get token using Client Credentials Grant (2026 method)
  const token = await getAdminAccessToken();
  
  const url = `https://${d}/admin/api/${API_VERSION}/graphql.json`;
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
  });
  if (!res.ok) {
    const errorText = await res.text();
    throw new Error(`Admin API error: ${res.status} ${res.statusText}\n${errorText}`);
  }
  const json = await res.json();
  if (json.errors?.length) {
    throw new Error(json.errors.map((e: { message: string }) => e.message).join("; "));
  }
  return json.data as T;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

async function createCollection(input: CollectionInput): Promise<{ id: string; title: string; handle: string; isSmart: boolean; published: boolean } | null> {
  const mutation = `
    mutation CreateCollection($input: CollectionInput!) {
      collectionCreate(input: $input) {
        collection {
          id
          title
          handle
          ruleSet {
            appliedDisjunctively
            rules {
              column
              relation
              condition
            }
          }
        }
        userErrors {
          field
          message
        }
      }
    }
  `;

  const variables = {
    input: {
      title: input.title,
      descriptionHtml: input.description || "",
      ruleSet: {
        appliedDisjunctively: true, // OR logic (any rule matches)
        rules: input.rules.map((r) => {
          const rule: Record<string, string> = {
            column: r.column,
            relation: r.relation,
          };
          
          // For IS_PRICE_REDUCED with IS_SET, condition must be omitted entirely
          if (r.column === "IS_PRICE_REDUCED" && r.relation === "IS_SET") {
            // Don't include condition field
            return rule;
          }
          
          // For all other rules, condition is required
          if (!r.condition || r.condition === "") {
            throw new Error(`${r.column} rule requires a condition value`);
          }
          
          rule.condition = r.condition;
          return rule;
        }),
      },
    },
  };

  try {
    const data = await adminGraphql<{
      collectionCreate?: {
        collection?: { id: string; title: string; handle: string };
        userErrors: { field: string; message: string }[];
      };
    }>(mutation, variables);

    const payload = data?.collectionCreate;
    const errs = payload?.userErrors?.filter((e) => e.message) || [];
    if (errs.length) {
      console.error(`  ❌ ${input.title}:`, errs.map((e) => e.message).join("; "));
      return null;
    }

    const collection = payload?.collection;
    if (!collection) {
      console.error(`  ❌ ${input.title}: No collection returned`);
      return null;
    }

    const isSmart = Boolean((collection as { ruleSet?: { rules?: unknown[] } }).ruleSet?.rules?.length);
    
    // Publish to Online Store if not already published
    let published = false;
    if (input.published) {
      try {
        // Get the Online Store publication ID first
        const publicationsQuery = `
          query GetPublications {
            publications(first: 10) {
              edges {
                node {
                  id
                  name
                }
              }
            }
          }
        `;
        const pubData = await adminGraphql<{
          publications?: {
            edges?: Array<{ node: { id: string; name: string } }>;
          };
        }>(publicationsQuery);
        
        const onlineStorePub = pubData.publications?.edges?.find(
          (e) => e.node.name === "Online Store"
        );
        
        if (onlineStorePub) {
          const publishMutation = `
            mutation PublishCollection($id: ID!, $publicationId: ID!) {
              publishablePublish(id: $id, input: { publicationId: $publicationId }) {
                publishable {
                  ... on Collection {
                    id
                  }
                }
                userErrors {
                  field
                  message
                }
              }
            }
          `;
          const publishData = await adminGraphql<{
            publishablePublish?: {
              publishable?: { id?: string };
              userErrors: { field: string; message: string }[];
            };
          }>(publishMutation, { 
            id: collection.id,
            publicationId: onlineStorePub.node.id,
          });
          
          const errors = publishData.publishablePublish?.userErrors?.filter((e) => e.message) || [];
          if (errors.length === 0) {
            published = true;
          } else {
            console.warn(`  ⚠️  ${input.title}: Could not publish:`, errors.map((e) => e.message).join("; "));
          }
        } else {
          console.warn(`  ⚠️  ${input.title}: Online Store publication not found`);
        }
      } catch (e) {
        console.warn(`  ⚠️  ${input.title}: Could not publish:`, e instanceof Error ? e.message : String(e));
      }
    }

    console.log(`  ✅ ${input.title} (handle: ${collection.handle}, Smart: ${isSmart ? "Yes" : "No"}, Published: ${published ? "Yes" : "No"})`);
    return { ...collection, isSmart, published };
  } catch (e) {
    console.error(`  ❌ ${input.title}:`, e instanceof Error ? e.message : String(e));
    return null;
  }
}

interface CollectionInfo {
  id: string;
  handle: string;
  title: string;
  ruleSet: { appliedDisjunctively: boolean; rules: Array<{ column: string; relation: string; condition?: string }> } | null;
  resourcePublicationsV2?: {
    edges?: Array<{ node: { publication: { id: string; name: string } } }>;
  };
}

async function getExistingCollections(): Promise<{ handles: Set<string>; details: Map<string, CollectionInfo> }> {
  const query = `
    query GetCollections($first: Int!) {
      collections(first: $first) {
        edges {
          node {
            id
            handle
            title
            ruleSet {
              appliedDisjunctively
              rules {
                column
                relation
                condition
              }
            }
            published
          }
        }
      }
    }
  `;

  try {
    const data = await adminGraphql<{
      collections?: {
        edges?: { node: CollectionInfo }[];
      };
    }>(query, { first: 50 });

    const handles = new Set<string>();
    const details = new Map<string, CollectionInfo>();
    
    data.collections?.edges?.forEach((e) => {
      const node = e.node;
      handles.add(node.handle.toLowerCase());
      handles.add(node.title.toLowerCase());
      details.set(node.title.toLowerCase(), node);
      details.set(node.handle.toLowerCase(), node);
    });
    
    return { handles, details };
  } catch (e) {
    console.warn("Could not fetch existing collections:", e);
    return { handles: new Set(), details: new Map() };
  }
}

async function main() {
  console.log("=== Creating Automated Collections ===\n");

  const d = domain();
  if (!d) {
    console.error("❌ Missing SHOPIFY_STORE_DOMAIN");
    console.error("\nSet in .env.local:");
    console.error("SHOPIFY_STORE_DOMAIN=ubee-furniture.myshopify.com");
    console.error("SHOPIFY_CLIENT_ID=your_client_id");
    console.error("SHOPIFY_CLIENT_SECRET=your_client_secret");
    process.exit(1);
  }

  console.log(`Store: ${d}`);
  console.log("Using Client Credentials Grant (2026 method)\n");

  const existing = await getExistingCollections();
  console.log(`Found ${existing.handles.size} existing collection(s)\n`);

  const created: Array<{ id: string; title: string; handle: string; isSmart: boolean; published: boolean }> = [];
  const skipped: Array<{ title: string; isSmart: boolean; published: boolean }> = [];
  const failed: string[] = [];

  for (const input of COLLECTIONS_TO_CREATE) {
    const titleLower = input.title.toLowerCase();
    const handleLower = input.title.toLowerCase().replace(/\s+/g, "-");

    const existingCollection = existing.details.get(titleLower) || existing.details.get(handleLower);
    if (existingCollection) {
      const isSmart = existingCollection.ruleSet !== null;
      const publications = existingCollection.resourcePublicationsV2?.edges || [];
      const published = publications.length > 0;
      const status = [];
      if (!isSmart) status.push("NOT SMART");
      if (!published) status.push("NOT PUBLISHED");
      
      if (status.length > 0) {
        console.log(`⚠️  ${input.title} (exists but: ${status.join(", ")})`);
      } else {
        console.log(`⏭️  ${input.title} (already exists - Smart & Published)`);
      }
      skipped.push({ title: input.title, isSmart, published });
      continue;
    }

    const result = await createCollection(input);
    if (result) {
      created.push(result);
    } else {
      failed.push(input.title);
    }

    await sleep(500);
  }

  console.log("\n=== Summary ===");
  console.log(`Created: ${created.length}`);
  console.log(`Skipped (already exist): ${skipped.length}`);
  console.log(`Failed: ${failed.length}`);

  if (created.length > 0) {
    console.log("\n✅ Created collections:");
    created.forEach((c) => {
      const smartStatus = c.isSmart ? "Smart" : "⚠️ NOT SMART";
      const pubStatus = c.published ? "Published" : "⚠️ NOT PUBLISHED";
      console.log(`   - ${c.title} (${c.handle}) - ${smartStatus}, ${pubStatus}`);
    });
  }

  if (skipped.length > 0) {
    console.log("\n⏭️  Existing collections:");
    skipped.forEach((s) => {
      const smartStatus = s.isSmart ? "Smart" : "⚠️ NOT SMART";
      const pubStatus = s.published ? "Published" : "⚠️ NOT PUBLISHED";
      console.log(`   - ${s.title} - ${smartStatus}, ${pubStatus}`);
    });
  }

  if (failed.length > 0) {
    console.log("\n❌ Failed:");
    failed.forEach((f) => console.log(`   - ${f}`));
  }

  // Final verification
  const allCollections = [...created, ...skipped];
  const allSmart = allCollections.every((c) => c.isSmart);
  const allPublished = allCollections.every((c) => c.published);

  console.log("\n=== Verification ===");
  console.log(`Total collections: ${allCollections.length}`);
  console.log(`All Smart (Automated): ${allSmart ? "✅ Yes" : "❌ No"}`);
  console.log(`All Published: ${allPublished ? "✅ Yes" : "❌ No"}`);

  if (!allSmart || !allPublished) {
    console.log("\n⚠️  Some collections need attention:");
    allCollections.forEach((c) => {
      if (!c.isSmart || !c.published) {
        const issues = [];
        if (!c.isSmart) issues.push("Convert to Smart Collection");
        if (!c.published) issues.push("Publish to Online Store");
        console.log(`   - ${c.title}: ${issues.join(", ")}`);
      }
    });
  }

  console.log("\nNext steps:");
  console.log("1. Run: npm run collections:verify");
  console.log("2. Verify in Shopify Admin: https://ubee-furniture.myshopify.com/admin/collections");
  console.log("3. Check website: http://localhost:3001/collections");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
