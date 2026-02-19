/**
 * FTG Product Details CSV parser.
 * Reads CSV with 2-row header (group row + header row) and produces normalized JSON per SKU.
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { normalizeSku, expandScientificNotation } from "./sku";
import type {
  FtgProductDetail,
  FtgAssembled,
  FtgBox,
  FtgCategories,
  FtgCompliance,
} from "./types";

const DETAILS_CSV_PATTERN = /Product Details.*ALL PRODUCTS.*\.csv/i;

/**
 * Resolve path to the FTG details CSV.
 * 1. If FTG_DETAILS_CSV_PATH is set, use it (resolve relative to cwd).
 * 2. Otherwise scan project root for a file matching "Product Details...ALL PRODUCTS....csv".
 * 3. If none found, throw after logging available .csv files in project root.
 */
function resolveDetailsCsvPath(explicitPath?: string): string {
  if (explicitPath != null && explicitPath !== "") {
    const resolved = path.isAbsolute(explicitPath)
      ? explicitPath
      : path.resolve(process.cwd(), explicitPath);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(`FTG details CSV not found at: ${resolved}`);
  }

  const envPath = process.env.FTG_DETAILS_CSV_PATH;
  if (envPath != null && envPath !== "") {
    const resolved = path.isAbsolute(envPath)
      ? envPath
      : path.resolve(process.cwd(), envPath);
    if (fs.existsSync(resolved)) return resolved;
    throw new Error(`FTG details CSV not found (FTG_DETAILS_CSV_PATH): ${resolved}`);
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
    "FTG details CSV not found. No file matching 'Product Details...ALL PRODUCTS....csv' in project root.",
  );
  if (csvFiles.length > 0) {
    console.error("Available .csv files in project root:", csvFiles.join(", "));
  } else {
    console.error("No .csv files found in project root:", projectRoot);
  }
  throw new Error(
    "FTG details CSV not found. Set FTG_DETAILS_CSV_PATH or place a file matching 'Product Details...ALL PRODUCTS....csv' in the project root.",
  );
}

/** Normalize header for matching: lowercase, trim, collapse spaces */
function norm(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

/** Find column index by header (exact norm match or includes). */
function findColumnIndex(
  headerRow: string[],
  ...candidates: string[]
): number {
  const normalized = headerRow.map((h, i) => ({ i, n: norm(h) }));
  for (const c of candidates) {
    const nc = norm(c);
    const found = normalized.find(
      (x) => x.n === nc || x.n.includes(nc) || nc.includes(x.n)
    );
    if (found != null) return found.i;
  }
  return -1;
}

/** Get string value from row, trimmed; empty string => null. */
function str(row: string[], index: number): string | null {
  if (index < 0 || index >= row.length) return null;
  const v = String(row[index] ?? "").trim();
  return v === "" ? null : v;
}

/** Get number from row; invalid => null. */
function num(row: string[], index: number): number | null {
  const v = str(row, index);
  if (v == null) return null;
  const n = parseFloat(v);
  return Number.isFinite(n) ? n : null;
}

/** Parse one data row into FtgProductDetail. */
function parseRow(
  row: string[],
  col: Record<string, number>
): FtgProductDetail | null {
  const skuRaw = str(row, col.sku);
  if (!skuRaw) return null;
  const sku = normalizeSku(expandScientificNotation(skuRaw)); // Same convention as price feed for matching.

  const assembled: FtgAssembled = {
    widthCm: num(row, col.assembledWidth),
    heightCm: num(row, col.assembledHeight),
    depthCm: num(row, col.assembledDepth),
    weightKg: num(row, col.assembledWeight),
  };

  const maxBoxes = 10;
  const boxes: FtgBox[] = [];
  for (let b = 1; b <= maxBoxes; b++) {
    const ean = str(row, col[`box${b}Ean` as keyof typeof col]);
    const lengthCm = num(row, col[`box${b}Length` as keyof typeof col]);
    const widthCm = num(row, col[`box${b}Width` as keyof typeof col]);
    const heightCm = num(row, col[`box${b}Height` as keyof typeof col]);
    const m3 = num(row, col[`box${b}M3` as keyof typeof col]);
    const weightKg = num(row, col[`box${b}Weight` as keyof typeof col]);
    if (ean != null || lengthCm != null || widthCm != null || heightCm != null || m3 != null || weightKg != null) {
      boxes.push({
        boxIndex: b,
        ean: ean ?? null,
        lengthCm: lengthCm ?? null,
        widthCm: widthCm ?? null,
        heightCm: heightCm ?? null,
        m3: m3 ?? null,
        weightKg: weightKg ?? null,
      });
    }
  }

  const images: string[] = [];
  for (let i = 1; i <= 20; i++) {
    const url = str(row, col[`image${i}` as keyof typeof col]);
    if (url) images.push(url);
  }

  const categories: FtgCategories = {};
  for (let c = 1; c <= 19; c++) {
    const idx = col[`c${c}` as keyof typeof col];
    if (idx >= 0) {
      const v = str(row, idx);
      categories[`C${c}` as keyof FtgCategories] = v === "1" || v === "Y" || v === "Yes" || v === "true" || (v != null && v.length > 0 && v !== "0" && v !== "N" && v !== "No" && v !== "false");
    }
  }

  const compliance: FtgCompliance = {
    frFabricUrl: str(row, col.frFabricUrl),
    frFoamUrl: str(row, col.frFoamUrl),
  };

  return {
    supplier: "FTG",
    sku,
    productId: str(row, col.productId),
    ean: str(row, col.ean),
    commodityCode: str(row, col.commodityCode),
    range: str(row, col.range),
    name: str(row, col.name),
    description: str(row, col.description),
    finish: str(row, col.finish),
    assembled,
    boxes,
    images,
    categories,
    compliance,
  };
}

/** Build column index map from header row (second row of CSV). */
function buildColumnMap(headerRow: string[]): Record<string, number> {
  const col: Record<string, number> = {
    sku: findColumnIndex(headerRow, "SKU", "Product Code", "Code"),
    productId: findColumnIndex(headerRow, "Product ID", "ProductId", "ID"),
    ean: findColumnIndex(headerRow, "EAN", "Barcode"),
    commodityCode: findColumnIndex(headerRow, "Commodity Code", "CommodityCode", "Commodity"),
    range: findColumnIndex(headerRow, "Range"),
    name: findColumnIndex(headerRow, "Name", "Product Name", "Title"),
    description: findColumnIndex(headerRow, "Description"),
    finish: findColumnIndex(headerRow, "Finish"),
    assembledWidth: findColumnIndex(headerRow, "Assembled Width", "Width (cm)", "Width(cm)", "Width"),
    assembledHeight: findColumnIndex(headerRow, "Assembled Height", "Height (cm)", "Height(cm)", "Height"),
    assembledDepth: findColumnIndex(headerRow, "Assembled Depth", "Depth (cm)", "Depth(cm)", "Depth"),
    assembledWeight: findColumnIndex(headerRow, "Assembled Weight", "Weight (kg)", "Weight(kg)", "Weight"),
    frFabricUrl: findColumnIndex(headerRow, "FR Fabric URL", "Fabric URL", "FabricUrl"),
    frFoamUrl: findColumnIndex(headerRow, "FR Foam URL", "Foam URL", "FoamUrl"),
  };

  for (let b = 1; b <= 10; b++) {
    col[`box${b}Ean`] = findColumnIndex(headerRow, `Box ${b} EAN`, `Box${b} EAN`, `Box ${b}EAN`);
    col[`box${b}Length`] = findColumnIndex(headerRow, `Box ${b} Length`, `Box ${b} L`, `Box${b}Length`, `Box ${b} Length (cm)`);
    col[`box${b}Width`] = findColumnIndex(headerRow, `Box ${b} Width`, `Box ${b} W`, `Box${b}Width`, `Box ${b} Width (cm)`);
    col[`box${b}Height`] = findColumnIndex(headerRow, `Box ${b} Height`, `Box ${b} H`, `Box${b}Height`, `Box ${b} Height (cm)`);
    col[`box${b}M3`] = findColumnIndex(headerRow, `Box ${b} m3`, `Box ${b} M3`, `Box${b}m3`);
    col[`box${b}Weight`] = findColumnIndex(headerRow, `Box ${b} Weight`, `Box ${b} Weight (kg)`, `Box${b}Weight`);
  }

  for (let i = 1; i <= 20; i++) {
    col[`image${i}`] = findColumnIndex(headerRow, `Image ${i}`, `Image${i}`, `Image ${i} URL`, `Image ${i} URL`);
  }

  for (let c = 1; c <= 19; c++) {
    col[`c${c}`] = findColumnIndex(headerRow, `C${c}`, `Category ${c}`, `Category${c}`);
  }

  return col;
}

export interface ParseFtgDetailsOptions {
  /** CSV file path. If not set: FTG_DETAILS_CSV_PATH env, or auto-detect in project root. */
  csvPath?: string;
}

/**
 * Read CSV, handle 2-row header, return normalized FtgProductDetail[].
 */
export function parseFtgDetails(options: ParseFtgDetailsOptions = {}): FtgProductDetail[] {
  const explicitPath = options.csvPath ?? process.env.FTG_CSV_PATH ?? undefined;
  const resolved = resolveDetailsCsvPath(explicitPath);

  console.log("Resolved FTG details CSV path:", resolved);

  const raw = fs.readFileSync(resolved, "utf-8");
  const rows = parse(raw, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
  }) as string[][];

  if (rows.length < 2) {
    throw new Error("CSV must have at least 2 rows (group + header).");
  }

  // Row 0 = group row, Row 1 = header row
  const headerRow = rows[1];
  const col = buildColumnMap(headerRow);

  if (col.sku < 0) {
    throw new Error("Could not find SKU column. Header row: " + headerRow.join(", "));
  }

  const results: FtgProductDetail[] = [];
  for (let i = 2; i < rows.length; i++) {
    const detail = parseRow(rows[i], col);
    if (detail) results.push(detail);
  }

  return results;
}

/** CLI: parse and print JSON to stdout (for piping or debugging). */
function main() {
  const csvPath = process.argv[2] || process.env.FTG_CSV_PATH || undefined;
  const details = parseFtgDetails({ csvPath });
  console.log(JSON.stringify(details, null, 0));
}

// Run when executed directly (tsx script.ts or node script.js)
const isMain =
  (typeof require !== "undefined" && require.main === module) ||
  (typeof process !== "undefined" && process.argv[1]?.includes("parse-ftg-details"));
if (isMain) main();
