#!/usr/bin/env node
/**
 * FTG Shopify Product Builder v1
 *
 * Reads data/ftg/ftg-normalized.jsonl (output of normalize-ftg.mjs)
 * and produces Shopify-ready payloads:
 *
 *   data/ftg/shopify-products.jsonl  - product-level fields
 *   data/ftg/shopify-variants.jsonl  - variant-level fields
 *   data/ftg/shopify-images.jsonl    - image URL + position per SKU
 *   data/ftg/shopify-build-report.md - summary + sample payloads
 *
 * No calls are made to Shopify; this only prepares payloads.
 *
 * Usage (from project root):
 *   node scripts/import/ftg/build-shopify-products.mjs
 */

import fs from "fs";
import path from "path";
import { createRequire } from "module";
import { normalizeDropboxImageUrl } from "./lib/dropbox-url.mjs";

const require = createRequire(import.meta.url);

try {
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env.local") });
  require("dotenv").config({ path: path.resolve(process.cwd(), ".env") });
} catch {
}

const NORMALIZED_PATH = path.resolve(
  process.cwd(),
  "data",
  "ftg",
  "ftg-normalized.jsonl"
);

function slugify(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "") || "product";
}

function buildBodyHtml(description, bullets) {
  const desc = (description || "").trim();
  const safeDesc = desc || "";
  const items = Array.isArray(bullets) ? bullets.filter(Boolean) : [];
  let html = "";
  html += `<p>${safeDesc}</p>`;
  if (items.length > 0) {
    html += "\n\n<ul>\n";
    for (const b of items) {
      html += `<li>${b}</li>\n`;
    }
    html += "</ul>";
  }
  return html;
}

function buildDropboxImageUrlsFromSku(sku) {
  const base = process.env.FTG_DROPBOX_BASE_URL;
  if (!base) return [];
  const trimmedBase = base.endsWith("/") ? base : `${base}/`;
  const cleanSku = String(sku || "").trim();
  if (!cleanSku) return [];
  const urls = [];
  for (let i = 1; i <= 3; i++) {
    urls.push(`${trimmedBase}${cleanSku}_${i}.jpg?raw=1`);
  }
  return urls;
}

// Map FTG category names to Shopify collection conditions (product_type + tag).
// Your smart collections use "Product type is X" and "Product tag is equal to Y".
const CATEGORY_TO_COLLECTION = {
  "Dining Tables": { productType: "Dining", tag: "dining" },
  "Dining Chairs": { productType: "Dining", tag: "dining" },
  Mattresses: { productType: "Mattresses", tag: "mattress" },
  Beds: { productType: "Beds", tag: "bed" },
  Sofas: { productType: "Sofas", tag: "sofa" },
  Wardrobes: { productType: "Wardrobes", tag: "wardrobe" },
  "Bar Tables": { productType: "Bar Tables", tag: "bar-tables" },
  "Dressing Tables": { productType: "Dressing Tables", tag: "dressing-tables" },
  "Coffee Tables": { productType: "Coffee Tables", tag: "coffee-tables" },
  "TV Cabinets": { productType: "TV Cabinets", tag: "tv-cabinets" },
  Bookcases: { productType: "Bookcases", tag: "bookcases" },
  Cabinets: { productType: "Cabinets", tag: "cabinets" },
  Chests: { productType: "Chests", tag: "chests" },
  Ottomans: { productType: "Ottomans", tag: "ottomans" },
  "Desks & Office": { productType: "Desks & Office", tag: "desks" },
  Sideboards: { productType: "Sideboards", tag: "sideboards" },
  Mirrors: { productType: "Mirrors", tag: "mirrors" },
  Lighting: { productType: "Lighting", tag: "lighting" },
  "Wall Shelves": { productType: "Wall Shelves", tag: "wall-shelves" },
  Kids: { productType: "Kids", tag: "kids" },
};

const MAX_IMAGES_PER_SKU = 25;

/** When FTG CSV has empty `categories`, infer smart-collection hints from title text. */
function inferCategoriesFromTitle(title) {
  const t = String(title || "");
  const lower = t.toLowerCase();
  const out = [];
  if (/\b(sofa|seater|settee|loveseat|corner\s+(group|sofa))\b/i.test(t)) {
    out.push("Sofas");
  }
  if (/\bmattress(es)?\b/i.test(lower)) out.push("Mattresses");
  if (/\bwardrobe\b/i.test(lower)) out.push("Wardrobes");
  if (/\b(tv\s*unit|tv\s*cabinet|media\s*unit|tv\s*stand)\b/i.test(lower)) {
    out.push("TV Cabinets");
  }
  if (/\b(bookcase|bookshelf|shelving\s*unit)\b/i.test(lower)) out.push("Bookcases");
  if (/\b(dining\s*table|dining\s*chair|dining\s*set)\b/i.test(lower)) {
    out.push("Dining Tables");
  }
  if (/\b(bar\s*stool|breakfast\s*bar)\b/i.test(lower)) out.push("Bar Tables");
  if (
    /\b(coffee\s*table|side\s*table|console\s*table|nest\s+of\s+tables)\b/i.test(lower)
  ) {
    out.push("Coffee Tables");
  }
  if (/\b(bedside|nightstand|bedside\s+table)\b/i.test(lower)) out.push("Cabinets");
  if (/\b(shoe\s*(cabinet|storage|rack))\b/i.test(lower)) out.push("Cabinets");
  if (/\b(dressing\s*table|dresser)\b/i.test(lower)) out.push("Dressing Tables");
  if (/\bmirror\b/i.test(lower)) out.push("Mirrors");
  if (/\b(lamp|pendant|chandelier|ceiling\s*light)\b/i.test(lower)) {
    out.push("Lighting");
  }
  if (/\b(desk|office\s*chair|filing\s*cabinet)\b/i.test(lower)) {
    out.push("Desks & Office");
  }
  if (/\b(ottoman|footstool|pouffe)\b/i.test(lower)) out.push("Ottomans");
  if (/\bsideboard\b/i.test(lower)) out.push("Sideboards");
  if (/\bchest\s+of\s+drawers\b/i.test(lower)) out.push("Chests");
  if (/\bwall\s+(mounted\s+)?shelf|floating\s+shelf\b/i.test(lower)) {
    out.push("Wall Shelves");
  }
  if (
    /\b(bed|bunk|divan|ottoman\s*bed)\b/i.test(lower) &&
    !/\b(sofa|seater|settee)\b/i.test(lower)
  ) {
    out.push("Beds");
  }
  return [...new Set(out)];
}

function dedupeNormalizeImages(urls) {
  const seen = new Set();
  const list = [];
  for (const raw of urls) {
    const u = normalizeDropboxImageUrl(String(raw).trim());
    if (!u || !/^https?:\/\//i.test(u) || seen.has(u)) continue;
    seen.add(u);
    list.push(u);
    if (list.length >= MAX_IMAGES_PER_SKU) break;
  }
  return list;
}

async function main() {
  if (!fs.existsSync(NORMALIZED_PATH)) {
    throw new Error(
      `Normalized FTG file not found: ${NORMALIZED_PATH}. Run ftg:normalize first.`
    );
  }

  const outDir = path.resolve(process.cwd(), "data", "ftg");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const productsPath = path.join(outDir, "shopify-products.jsonl");
  const variantsPath = path.join(outDir, "shopify-variants.jsonl");
  const imagesPath = path.join(outDir, "shopify-images.jsonl");
  const reportPath = path.join(outDir, "shopify-build-report.md");

  const productsStream = fs.createWriteStream(productsPath, "utf-8");
  const variantsStream = fs.createWriteStream(variantsPath, "utf-8");
  const imagesStream = fs.createWriteStream(imagesPath, "utf-8");

  const normalizedLines = fs
    .readFileSync(NORMALIZED_PATH, "utf-8")
    .split(/\r?\n/)
    .filter((line) => line.trim().length > 0);

  let total = 0;
  let missingImages = 0;
  let missingBarcode = 0;
  let skippedInvalid = 0;
  const categoryCounts = new Map();

  const sample = {
    product: null,
    variant: null,
    images: [],
  };

  for (const line of normalizedLines) {
    let rec;
    try {
      rec = JSON.parse(line);
    } catch {
      skippedInvalid++;
      continue;
    }

    const sku = rec.sku && String(rec.sku).trim();
    const title = rec.title && String(rec.title).trim();
    let imageUrls = Array.isArray(rec.imageUrls)
      ? rec.imageUrls.filter((u) => u && /^https?:\/\//i.test(String(u)))
      : [];
    if (!imageUrls.length) {
      imageUrls = buildDropboxImageUrlsFromSku(sku);
    }
    imageUrls = dedupeNormalizeImages(imageUrls);

    if (!sku || !title || imageUrls.length === 0) {
      skippedInvalid++;
      if (!sku || !title) continue;
      // If only images missing, still count in validation below
    }

    total++;

    const categories = [
      ...new Set([
        ...(Array.isArray(rec.categories) ? rec.categories.filter(Boolean) : []),
        ...inferCategoriesFromTitle(title),
      ]),
    ];
    for (const c of categories) {
      categoryCounts.set(c, (categoryCounts.get(c) || 0) + 1);
    }
    if (imageUrls.length === 0) missingImages++;

    const barcode =
      rec.barcode != null && rec.barcode !== ""
        ? String(rec.barcode)
        : null;
    if (!barcode) missingBarcode++;

    const finish =
      rec.finish != null && String(rec.finish).trim() !== ""
        ? String(rec.finish).trim()
        : null;

    const tags = [...categories];
    if (finish) tags.push(finish);

    // So products show in the right smart collections: set product_type and add collection tag.
    let productType = rec.range || null;
    for (const cat of categories) {
      const mapped = CATEGORY_TO_COLLECTION[cat];
      if (mapped) {
        productType = mapped.productType;
        if (mapped.tag && !tags.includes(mapped.tag)) tags.push(mapped.tag);
        break;
      }
    }

    if (tags.length === 0) {
      const fb = productType ? slugify(String(productType)) : "";
      tags.push(fb || "ftg");
    }

    const handleBase = slugify(title);
    const handle = `${handleBase}-${slugify(sku)}`;

    const body_html = buildBodyHtml(rec.description, rec.bullets);

    const productPayload = {
      title,
      body_html,
      vendor: "Furniture To Go",
      product_type: productType,
      handle,
      tags,
    };

    const variantPayload = {
      sku,
      barcode,
      weight: rec.weightKg != null ? Number(rec.weightKg) : null,
      price: null,
      inventory_policy: "continue",
      inventory_management: "shopify",
    };

    productsStream.write(JSON.stringify(productPayload) + "\n");
    variantsStream.write(JSON.stringify(variantPayload) + "\n");

    imageUrls.forEach((url, idx) => {
      imagesStream.write(
        JSON.stringify({
          sku,
          image_url: url,
          position: idx + 1,
        }) + "\n"
      );
    });

    if (!sample.product) {
      sample.product = productPayload;
      sample.variant = variantPayload;
      sample.images = imageUrls.slice(0, 3).map((url, idx) => ({
        sku,
        image_url: url,
        position: idx + 1,
      }));
    }
  }

  productsStream.end();
  variantsStream.end();
  imagesStream.end();

  const lines = [];
  lines.push("# FTG → Shopify build report");
  lines.push("");
  lines.push("This report summarizes the transformation from `ftg-normalized.jsonl`");
  lines.push("into Shopify-ready product, variant, and image payloads.");
  lines.push("");
  lines.push("## How to run");
  lines.push("");
  lines.push("```bash");
  lines.push('cd "c:\\Users\\steve\\ubeefurniture website"');
  lines.push("npm run ftg:normalize");
  lines.push("npm run ftg:build-shopify");
  lines.push("```");
  lines.push("");
  lines.push("Outputs:");
  lines.push("");
  lines.push("- `data/ftg/shopify-products.jsonl`");
  lines.push("- `data/ftg/shopify-variants.jsonl`");
  lines.push("- `data/ftg/shopify-images.jsonl`");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total products processed: ${total}`);
  lines.push(`- Products skipped as invalid (no SKU/title/images): ${skippedInvalid}`);
  lines.push(`- Products missing images: ${missingImages}`);
  lines.push(`- Products missing barcode: ${missingBarcode}`);
  lines.push("");
  lines.push("## Top categories");
  lines.push("");
  const sortedCats = Array.from(categoryCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const top = sortedCats.slice(0, 10);
  if (top.length === 0) {
    lines.push("_No categories present in data._");
  } else {
    for (const [name, count] of top) {
      lines.push(`- ${name}: ${count}`);
    }
  }

  lines.push("");
  lines.push("## Sample payload preview");
  lines.push("");
  if (sample.product && sample.variant) {
    lines.push("### Product");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(sample.product, null, 2));
    lines.push("```");
    lines.push("");
    lines.push("### Variant");
    lines.push("");
    lines.push("```json");
    lines.push(JSON.stringify(sample.variant, null, 2));
    lines.push("```");
    if (sample.images && sample.images.length > 0) {
      lines.push("");
      lines.push("### Images");
      lines.push("");
      lines.push("```json");
      lines.push(JSON.stringify(sample.images, null, 2));
      lines.push("```");
    }
  } else {
    lines.push("_No sample payload available (no valid products processed)._");
  }

  fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");

  console.log(`Products JSONL: ${productsPath}`);
  console.log(`Variants JSONL: ${variantsPath}`);
  console.log(`Images JSONL:   ${imagesPath}`);
  console.log(`Report:         ${reportPath}`);
}

main().catch((err) => {
  console.error("build-shopify-products failed:", err.message || err);
  process.exit(1);
});

