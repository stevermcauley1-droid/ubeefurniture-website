#!/usr/bin/env node
/**
 * FTG normalizer: read "Product Details for ALL PRODUCTS.csv",
 * skip the first (group) header row, detect the real header row,
 * and output a normalized JSON + CSV for uBee.
 *
 * Usage (from project root):
 *   node scripts/import/ftg-normalize.mjs
 *   node scripts/import/ftg-normalize.mjs --file "Product Details for ALL PRODUCTS.csv"
 *
 * The script will:
 * - Resolve the CSV path (CLI --file, FTG_DETAILS_CSV_PATH/FTG_CSV_PATH, or auto-detect in CWD)
 * - Parse the 2-row header (group row + header row)
 * - Extract SKU, title, range (as productType), description, EAN, assembled dimensions, weight
 * - Write:
 *     data/ftg-products-normalized.json
 *     data/ftg-products-normalized.csv
 */

import fs from "fs";
import path from "path";
import { parse } from "csv-parse/sync";

const DETAILS_CSV_PATTERN = /Product Details.*ALL PRODUCTS.*\.csv/i;

function norm(s) {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findColumnIndex(headerRow, ...candidates) {
  const normalized = headerRow.map((h, i) => ({ i, n: norm(h) }));
  for (const c of candidates) {
    const nc = norm(c);
    const found = normalized.find(
      (x) => x.n === nc || x.n.includes(nc) || nc.includes(x.n)
    );
    if (found) return found.i;
  }
  return -1;
}

function str(row, index) {
  if (index < 0 || index >= row.length) return null;
  const v = String(row[index] ?? "").trim();
  return v === "" ? null : v;
}

function num(row, index) {
  const v = str(row, index);
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
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
    throw new Error(`FTG details CSV not found (FTG_DETAILS_CSV_PATH / FTG_CSV_PATH): ${resolved}`);
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
    ean: findColumnIndex(headerRow, "EAN", "Barcode"),
    range: findColumnIndex(headerRow, "Range", "Product Type", "Category"),
    name: findColumnIndex(headerRow, "Name", "Product Name", "Title"),
    description: findColumnIndex(headerRow, "Description", "Long Description"),
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

  for (let i = 1; i <= 10; i++) {
    col[`image${i}`] = findColumnIndex(
      headerRow,
      `Image ${i}`,
      `Image${i}`,
      `Image ${i} URL`
    );
  }

  return col;
}

function csvEscape(value) {
  const s = value == null ? "" : String(value);
  if (s.includes('"') || s.includes(",") || s.includes("\n")) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

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

  // Detect header row (skip group row). We scan first few rows to find one with a SKU column.
  let headerIndex = -1;
  let col = null;
  const maxScan = Math.min(5, rows.length);
  for (let i = 0; i < maxScan; i++) {
    const row = rows[i];
    const candidate = buildColumnMap(row);
    if (candidate.sku >= 0) {
      headerIndex = i;
      col = candidate;
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

  for (let i = dataStart; i < rows.length; i++) {
    const row = rows[i];
    const sku = str(row, col.sku);
    if (!sku) continue;

    const title = str(row, col.name) || sku;
    const productType = str(row, col.range);
    const description = str(row, col.description);
    const barcode = str(row, col.ean);

    const widthCm = num(row, col.assembledWidth);
    const heightCm = num(row, col.assembledHeight);
    const depthCm = num(row, col.assembledDepth);
    const weightKg = num(row, col.assembledWeight);

    const images = [];
    for (let j = 1; j <= 10; j++) {
      const idx = col[`image${j}`];
      const url = idx != null ? str(row, idx) : null;
      if (url) images.push(url);
    }

    products.push({
      sku,
      title,
      vendor: "Furniture To Go",
      productType: productType || null,
      description: description || null,
      barcode: barcode || null,
      dimensions: {
        widthCm: widthCm ?? null,
        heightCm: heightCm ?? null,
        depthCm: depthCm ?? null,
      },
      weight: weightKg ?? null,
      images,
    });
  }

  const outDir = path.resolve(process.cwd(), "data");
  if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
  }

  const jsonPath = path.join(outDir, "ftg-products-normalized.json");
  const csvOutPath = path.join(outDir, "ftg-products-normalized.csv");

  fs.writeFileSync(jsonPath, JSON.stringify(products, null, 2), "utf-8");

  const header = [
    "sku",
    "title",
    "vendor",
    "productType",
    "description",
    "barcode",
    "widthCm",
    "heightCm",
    "depthCm",
    "weight",
    "images",
  ];

  const lines = [header.map(csvEscape).join(",")];
  for (const p of products) {
    lines.push(
      [
        p.sku,
        p.title,
        p.vendor,
        p.productType,
        p.description,
        p.barcode,
        p.dimensions.widthCm,
        p.dimensions.heightCm,
        p.dimensions.depthCm,
        p.weight,
        (p.images || []).join("|"),
      ].map(csvEscape).join(",")
    );
  }

  fs.writeFileSync(csvOutPath, lines.join("\n"), "utf-8");

  console.log(`Normalized ${products.length} FTG product(s).`);
  console.log(`JSON written to: ${jsonPath}`);
  console.log(`CSV written to:  ${csvOutPath}`);
}

main().catch((err) => {
  console.error("ftg-normalize failed:", err.message || err);
  process.exit(1);
});

