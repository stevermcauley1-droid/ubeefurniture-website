#!/usr/bin/env node
/**
 * FTG Supplier Ingestion v1 - Normalizer
 *
 * Reads "Product Details for ALL PRODUCTS.csv" (or a supplied FTG CSV),
 * skips the group header row, detects the real header row, and produces
 * a normalized dataset ready for import into uBee + Shopify.
 *
 * Outputs:
 *   data/ftg/ftg-normalized.jsonl  - one JSON object per line
 *   data/ftg/ftg-normalized.csv    - flattened CSV for review
 *   data/ftg/ftg-report.md         - counts + validation summary + how-to-run
 *
 * Usage (from project root):
 *   node scripts/import/ftg/normalize-ftg.mjs
 *   node scripts/import/ftg/normalize-ftg.mjs --file "Product Details for ALL PRODUCTS.csv"
 *
 * Environment (optional):
 *   FTG_DETAILS_CSV_PATH or FTG_CSV_PATH - path to FTG details CSV
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const DETAILS_CSV_PATTERN = /Product Details.*ALL PRODUCTS.*\.csv/i;

// ---------- Small helpers ----------

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findColumnIndex(headerRow, ...candidates) {
  const normalized = headerRow
    .map((h, i) => ({ i, n: norm(h) }))
    .filter((x) => x.n.length > 0);
  for (const c of candidates) {
    const nc = norm(c);
    if (!nc) continue;
    const found = normalized.find((x) => {
      if (x.n === nc) return true;
      // Handle headers like "C1-Bar Table" when candidate is "C1".
      if (nc.length <= 3 && (x.n.startsWith(`${nc}-`) || x.n.startsWith(`${nc} `))) {
        return true;
      }
      // Fuzzy matching only for meaningful strings to avoid false matches.
      if (x.n.length >= 3 && nc.length >= 3) {
        return x.n.includes(nc) || nc.includes(x.n);
      }
      return false;
    });
    if (found) return found.i;
  }
  return -1;
}

function str(row, index) {
  if (index == null || index < 0 || index >= row.length) return null;
  const v = String(row[index] ?? "").trim();
  return v === "" ? null : v;
}

function num(row, index) {
  const v = str(row, index);
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeDropboxUrl(url) {
  if (!url) return null;
  if (url.includes("dl.dropboxusercontent.com")) return url;
  if (url.includes("dropbox.com")) {
    if (url.includes("?dl=0")) return url.replace("?dl=0", "?dl=1");
    if (!url.includes("?dl=")) return `${url}${url.includes("?") ? "&" : "?"}dl=1`;
  }
  return url;
}

function resolveCsvPath(explicitPath) {
  if (explicitPath && explicitPath !== "") {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(`FTG details CSV not found at: ${resolved}`);
  }

  const envPath = process.env.FTG_DETAILS_CSV_PATH || process.env.FTG_CSV_PATH;
  if (envPath && envPath !== "") {
    const resolved = path.isAbsolute(envPath)
      ? envPath
      : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(
      `FTG details CSV not found (FTG_DETAILS_CSV_PATH / FTG_CSV_PATH): ${resolved}`
    );
  }

  const projectRoot = process.cwd();
  const entries = fs.readdirSync(projectRoot, { withFileTypes: true });
  const match = entries.find(
    (e) => e.isFile() && DETAILS_CSV_PATTERN.test(e.name)
  );
  if (match) {
    return path.resolve(projectRoot, match.name);
  }

  const csvFiles = entries
    .filter((e) => e.isFile() && e.name.toLowerCase().endsWith(".csv"))
    .map((e) => e.name)
    .sort();
  console.error(
    "FTG details CSV not found. No file matching 'Product Details...ALL PRODUCTS....csv' in project root."
  );
  if (csvFiles.length > 0) {
    console.error("Available .csv files in project root:", csvFiles.join(", "));
  } else {
    console.error("No .csv files found in project root:", projectRoot);
  }
  throw new Error(
    "FTG details CSV not found. Use --file, set FTG_DETAILS_CSV_PATH / FTG_CSV_PATH, or place a file matching 'Product Details...ALL PRODUCTS....csv' in the project root."
  );
}

function buildColumnMap(headerRow) {
  const col = {
    sku: findColumnIndex(headerRow, "SKU", "Product Code", "Code"),
    productId: findColumnIndex(headerRow, "Product ID", "ProductId", "ID"),
    commodityCode: findColumnIndex(
      headerRow,
      "Commodity Code",
      "CommodityCode",
      "Commodity"
    ),
    range: findColumnIndex(headerRow, "Range"),
    title: findColumnIndex(headerRow, "Name", "Product Name", "Title"),
    description: findColumnIndex(headerRow, "Description", "Long Description"),
    finish: findColumnIndex(headerRow, "Finish"),
    barcode: findColumnIndex(headerRow, "EAN", "Barcode"),
    qty: findColumnIndex(headerRow, "Qty", "Quantity", "Pack Qty"),
    assembledWidth: findColumnIndex(
      headerRow,
      "Assembled Width",
      "Width (cm)",
      "Width(cm)",
      "Width"
    ),
    assembledHeight: findColumnIndex(
      headerRow,
      "Assembled Height",
      "Height (cm)",
      "Height(cm)",
      "Height"
    ),
    assembledDepth: findColumnIndex(
      headerRow,
      "Assembled Depth",
      "Depth (cm)",
      "Depth(cm)",
      "Depth"
    ),
    assembledWeight: findColumnIndex(
      headerRow,
      "Assembled Weight",
      "Weight (kg)",
      "Weight(kg)",
      "Weight"
    ),
  };

  // Bullet points BP1..BP6
  for (let i = 1; i <= 6; i++) {
    col[`bp${i}`] = findColumnIndex(
      headerRow,
      `BP${i}`,
      `Bullet Point ${i}`,
      `Bulletpoint ${i}`
    );
  }

  // Assembly instructions 1..5
  for (let i = 1; i <= 5; i++) {
    col[`assembly${i}`] = findColumnIndex(
      headerRow,
      `Assembly Instructions ${i}`,
      `Assembly Instruction ${i}`,
      `Assembly ${i}`
    );
  }

  // Image URL1..20
  for (let i = 1; i <= 20; i++) {
    col[`image${i}`] = findColumnIndex(
      headerRow,
      `Image URL${i}`,
      `Image URL ${i}`,
      `Image ${i}`,
      `Image${i}`
    );
  }

  // Category flags C1..C19
  for (let i = 1; i <= 19; i++) {
    col[`c${i}`] = findColumnIndex(headerRow, `C${i}`, `Category ${i}`, `Category${i}`);
  }

  // Carton / package blocks (Box 1..10)
  for (let b = 1; b <= 10; b++) {
    col[`box${b}Ean`] = findColumnIndex(
      headerRow,
      `Box ${b} EAN`,
      `Box${b} EAN`,
      `Box ${b}EAN`
    );
    col[`box${b}Length`] = findColumnIndex(
      headerRow,
      `Box ${b} Length`,
      `Box ${b} L`,
      `Box${b}Length`,
      `Box ${b} Length (cm)`
    );
    col[`box${b}Width`] = findColumnIndex(
      headerRow,
      `Box ${b} Width`,
      `Box ${b} W`,
      `Box${b}Width`,
      `Box ${b} Width (cm)`
    );
    col[`box${b}Height`] = findColumnIndex(
      headerRow,
      `Box ${b} Height`,
      `Box ${b} H`,
      `Box${b}Height`,
      `Box ${b} Height (cm)`
    );
    col[`box${b}M3`] = findColumnIndex(
      headerRow,
      `Box ${b} m3`,
      `Box ${b} M3`,
      `Box${b}m3`
    );
  }

  return col;
}

const CATEGORY_MAP = {
  C1: "Bar Tables",
  C2: "Dressing Tables",
  C3: "Mirrors",
  C4: "Beds",
  C5: "Ottomans",
  C6: "Bookcases",
  C7: "Cabinets",
  C8: "Chests",
  C9: "Coffee Tables",
  C10: "Desks & Office",
  C11: "Dining Tables",
  C12: "Dining Chairs",
  C13: "Lighting",
  C14: "Sideboards",
  C15: "Sofas",
  C16: "TV Cabinets",
  C17: "Wall Shelves",
  C18: "Wardrobes",
  C19: "Kids",
};

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

// ---------- Main ----------

async function main() {
  const args = process.argv.slice(2);
  const fileArg = (() => {
    const flag = args.find((a) => a.startsWith("--file="));
    if (flag) return flag.split("=", 2)[1];
    const positional = args.find((a) => !a.startsWith("--"));
    return positional;
  })();

  const csvPath = resolveCsvPath(fileArg);
  console.log("Resolved FTG details CSV path:", csvPath);

  const raw = fs.readFileSync(csvPath, "utf-8");
  const rows = parse(raw, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  });

  if (!Array.isArray(rows) || rows.length < 2) {
    throw new Error("CSV must have at least 2 rows (group + header).");
  }

  // Detect header row in first few rows, skipping group header.
  let headerIndex = -1;
  let col = null;
  const maxScan = Math.min(5, rows.length);
  for (let i = 0; i < maxScan; i++) {
    const candidateHeader = rows[i];
    const candidateMap = buildColumnMap(candidateHeader);
    if (candidateMap.sku >= 0) {
      headerIndex = i;
      col = candidateMap;
      break;
    }
  }
  if (headerIndex < 0 || !col) {
    throw new Error(
      "Could not detect a valid header row with SKU column in first rows of CSV."
    );
  }

  const dataStart = headerIndex + 1;
  const products = [];

  // Validation counters
  let countNoImages = 0;
  let countNoCategories = 0;
  let countNoBarcode = 0;
  const categoryCounts = new Map();

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];

    const sku = str(row, col.sku);
    if (!sku) continue;
    if (String(sku).trim().toUpperCase() === "SKU") continue; // skip header row

    const productId = str(row, col.productId);
    const commodityCode = str(row, col.commodityCode);
    const range = str(row, col.range);
    const title = str(row, col.title) || sku;
    const description = str(row, col.description);
    const finish = str(row, col.finish);
    const barcode = str(row, col.barcode);
    const qtyVal = col.qty >= 0 ? num(row, col.qty) : null;
    const qty = qtyVal && qtyVal > 0 ? qtyVal : 1;

    const widthCm = num(row, col.assembledWidth);
    const heightCm = num(row, col.assembledHeight);
    const depthCm = num(row, col.assembledDepth);
    const weightKg = num(row, col.assembledWeight);

    const bullets = [];
    for (let b = 1; b <= 6; b++) {
      const idx = col[`bp${b}`];
      const v = str(row, idx);
      if (v) bullets.push(v);
    }

    const assemblyUrls = [];
    for (let a = 1; a <= 5; a++) {
      const idx = col[`assembly${a}`];
      let u = str(row, idx);
      if (u) {
        u = normalizeDropboxUrl(u);
        assemblyUrls.push(u);
      }
    }

    const imageUrls = [];
    for (let j = 1; j <= 20; j++) {
      const idx = col[`image${j}`];
      const u = str(row, idx);
      if (u) imageUrls.push(u);
    }

    const categories = [];
    for (let c = 1; c <= 19; c++) {
      const idx = col[`c${c}`];
      if (idx == null || idx < 0) continue;
      const v = str(row, idx);
      if (!v) continue;
      const yes =
        v === "1" ||
        v === "Y" ||
        v === "y" ||
        v === "Yes" ||
        v === "YES" ||
        v === "true" ||
        (v.length > 0 && v !== "0" && v !== "N" && v !== "No" && v !== "false");
      if (!yes) continue;
      const key = `C${c}`;
      const name = CATEGORY_MAP[key];
      if (name) {
        categories.push(name);
        categoryCounts.set(name, (categoryCounts.get(name) || 0) + 1);
      }
    }

    const packages = [];
    for (let b = 1; b <= 10; b++) {
      const ean = str(row, col[`box${b}Ean`]);
      const l = num(row, col[`box${b}Length`]);
      const w = num(row, col[`box${b}Width`]);
      const h = num(row, col[`box${b}Height`]);
      const m3 = num(row, col[`box${b}M3`]);
      const hasDims = l != null || w != null || h != null || m3 != null;
      if (!hasDims) continue;
      packages.push({
        ean: ean || null,
        l: l ?? null,
        w: w ?? null,
        h: h ?? null,
        m3: m3 ?? null,
      });
    }

    if (imageUrls.length === 0) countNoImages++;
    if (categories.length === 0) countNoCategories++;
    if (!barcode) countNoBarcode++;

    const product = {
      supplier: "FTG",
      sku,
      productId: productId || null,
      commodityCode: commodityCode || null,
      range: range || null,
      title,
      description: description || null,
      finish: finish || null,
      barcode: barcode || null,
      dimensionsCm: {
        w: widthCm ?? null,
        h: heightCm ?? null,
        d: depthCm ?? null,
      },
      weightKg: weightKg ?? null,
      qty,
      bullets,
      assemblyUrls,
      imageUrls,
      categories,
      packages,
    };

    products.push(product);
  }

  // ---------- Write outputs ----------

  const outDir = path.resolve(process.cwd(), "data", "ftg");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonlPath = path.join(outDir, "ftg-normalized.jsonl");
  const csvPathOut = path.join(outDir, "ftg-normalized.csv");
  const reportPath = path.join(outDir, "ftg-report.md");

  // JSONL
  const jsonlStream = fs.createWriteStream(jsonlPath, "utf-8");
  for (const p of products) {
    jsonlStream.write(JSON.stringify(p));
    jsonlStream.write("\n");
  }
  jsonlStream.end();

  // CSV (flattened)
  const csvHeader = [
    "supplier",
    "sku",
    "productId",
    "commodityCode",
    "range",
    "title",
    "description",
    "finish",
    "barcode",
    "widthCm",
    "heightCm",
    "depthCm",
    "weightKg",
    "qty",
    "bullets",
    "assemblyUrls",
    "imageUrls",
    "categories",
    "packages",
  ];
  const csvLines = [csvHeader.map(csvEscape).join(",")];
  for (const p of products) {
    csvLines.push(
      [
        p.supplier,
        p.sku,
        p.productId,
        p.commodityCode,
        p.range,
        p.title,
        p.description,
        p.finish,
        p.barcode,
        p.dimensionsCm.w,
        p.dimensionsCm.h,
        p.dimensionsCm.d,
        p.weightKg,
        p.qty,
        (p.bullets || []).join(" | "),
        (p.assemblyUrls || []).join(" | "),
        (p.imageUrls || []).join(" | "),
        (p.categories || []).join(" | "),
        JSON.stringify(p.packages || []),
      ]
        .map(csvEscape)
        .join(",")
    );
  }
  fs.writeFileSync(csvPathOut, csvLines.join("\n"), "utf-8");

  // Report
  const total = products.length;
  const lines = [];
  lines.push("# FTG normalization report");
  lines.push("");
  lines.push("How to run:");
  lines.push("");
  lines.push("```bash");
  lines.push('cd "c:\\Users\\steve\\ubeefurniture website"');
  lines.push('node scripts/import/ftg/normalize-ftg.mjs --file "Product Details for ALL PRODUCTS.csv"');
  lines.push("```");
  lines.push("");
  lines.push("Outputs:");
  lines.push("");
  lines.push("- `data/ftg/ftg-normalized.jsonl`");
  lines.push("- `data/ftg/ftg-normalized.csv`");
  lines.push("- `data/ftg/ftg-report.md` (this file)");
  lines.push("");
  lines.push("## Summary");
  lines.push("");
  lines.push(`- Total products: ${total}`);
  lines.push(`- Products with 0 images: ${countNoImages}`);
  lines.push(`- Products with 0 categories: ${countNoCategories}`);
  lines.push(`- Products with no barcode: ${countNoBarcode}`);
  lines.push("");
  lines.push("## Top 10 categories");
  lines.push("");
  const sortedCats = Array.from(categoryCounts.entries()).sort(
    (a, b) => b[1] - a[1]
  );
  const top10 = sortedCats.slice(0, 10);
  if (top10.length === 0) {
    lines.push("_No categories present in data._");
  } else {
    for (const [name, count] of top10) {
      lines.push(`- ${name}: ${count}`);
    }
  }

  fs.writeFileSync(reportPath, lines.join("\n"), "utf-8");

  console.log(`Normalized ${products.length} FTG product(s).`);
  console.log(`JSONL written to: ${jsonlPath}`);
  console.log(`CSV written to:   ${csvPathOut}`);
  console.log(`Report written to:${reportPath}`);
}

main().catch((err) => {
  console.error("normalize-ftg failed:", err.message || err);
  process.exit(1);
});

