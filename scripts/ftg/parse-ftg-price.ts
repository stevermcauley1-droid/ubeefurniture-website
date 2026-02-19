/**
 * FTG Price/Stock CSV parser.
 * Reads price list CSV and produces normalized JSON per SKU.
 * SKU is treated strictly as STRING; scientific notation (e.g. 1.01291E+12) is
 * expanded to full digits without precision loss, then normalized for matching.
 */

import * as fs from "fs";
import * as path from "path";
import { parse } from "csv-parse/sync";
import { normalizeSku, expandScientificNotation } from "./sku";
import type { FtgPriceRow } from "./price-types";

const ACTUAL_FILENAME = "FTG-Price-List-2026-02-17.csv";
const DEFAULT_CSV_PATH = path.resolve(process.cwd(), ACTUAL_FILENAME);

/** Get SKU as string: raw from CSV, expand scientific notation, then ready for normalizeSku. */
function skuFromRaw(row: string[], skuColIndex: number): string {
  const raw = row[skuColIndex];
  const asString = raw === undefined || raw === null ? "" : String(raw).trim();
  if (!asString) return "";
  return expandScientificNotation(asString);
}

function norm(s: string): string {
  return String(s ?? "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");
}

function findColumnIndex(headerRow: string[], ...candidates: string[]): number {
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

function str(row: string[], index: number): string | null {
  if (index < 0 || index >= row.length) return null;
  const v = String(row[index] ?? "").trim();
  return v === "" ? null : v;
}

function num(row: string[], index: number): number | null {
  const v = str(row, index);
  if (v == null) return null;
  const n = parseFloat(String(v).replace(/[£,$\s]/g, ""));
  return Number.isFinite(n) ? n : null;
}

function bool(row: string[], index: number): boolean | null {
  const v = str(row, index);
  if (v == null) return null;
  const lower = v.toLowerCase();
  if (lower === "1" || lower === "y" || lower === "yes" || lower === "true" || lower === "discontinued") return true;
  if (lower === "0" || lower === "n" || lower === "no" || lower === "false") return false;
  return null;
}

export interface ParseFtgPriceOptions {
  csvPath?: string;
  /** If true, include raw row object in output (for debugging). */
  includeRaw?: boolean;
}

/**
 * Parse price list CSV and return normalized FtgPriceRow[].
 * First row is treated as header (single-row header).
 */
export function parseFtgPrice(options: ParseFtgPriceOptions = {}): FtgPriceRow[] {
  const csvPath =
    options.csvPath ??
    process.env.FTG_PRICE_CSV_PATH ??
    process.env.FTG_CSV_PATH ??
    DEFAULT_CSV_PATH;

  const resolved = path.isAbsolute(csvPath)
    ? csvPath
    : path.resolve(process.cwd(), csvPath);

  console.log("Resolved FTG price CSV path:", resolved);

  if (!fs.existsSync(resolved)) {
    throw new Error(`FTG price CSV not found: ${resolved}`);
  }

  const raw = fs.readFileSync(resolved, "utf-8");
  const rows = parse(raw, {
    relax_column_count: true,
    skip_empty_lines: true,
    trim: true,
    bom: true,
    cast: (value) => String(value), // Keep all values as strings; no auto number casting (avoids Excel scientific notation as number).
  }) as string[][];

  if (rows.length < 1) throw new Error("Price CSV has no rows.");

  const headerRow = rows[0];
  const col = {
    sku: findColumnIndex(headerRow, "SKU", "Product Code", "Code", "Part No", "Part No.", "Item Code"),
    costPrice: findColumnIndex(headerRow, "Cost", "Cost Price", "Cost Price (ex VAT)", "Cost (ex VAT)"),
    tradePrice: findColumnIndex(headerRow, "Trade", "Trade Price", "Trade Price (ex VAT)"),
    rrp: findColumnIndex(headerRow, "RRP", "Selling Price", "Retail", "Retail Price", "Price"),
    vatRate: findColumnIndex(headerRow, "VAT", "VAT Rate", "VAT %"),
    stockQty: findColumnIndex(headerRow, "Stock", "Qty", "Quantity", "Qty In Stock", "Available"),
    availabilityStatus: findColumnIndex(headerRow, "Availability", "Status", "Stock Status", "Availability Status"),
    leadTimeDays: findColumnIndex(headerRow, "Lead Time", "Lead Time (days)", "Delivery Days", "Days"),
    discontinued: findColumnIndex(headerRow, "Discontinued", "Deleted", "Status"),
  };

  if (col.sku < 0) {
    throw new Error("Could not find SKU column. Header: " + headerRow.join(", "));
  }

  const includeRaw = options.includeRaw ?? false;
  const results: FtgPriceRow[] = [];

  // Log first 5 raw SKU values from the file (before scientific expansion and normalization).
  const rawSkuSamples: string[] = [];
  for (let i = 1; i < rows.length && rawSkuSamples.length < 5; i++) {
    const r = rows[i];
    const rawVal = r[col.sku];
    const rawStr = rawVal === undefined || rawVal === null ? "" : String(rawVal).trim();
    if (rawStr) rawSkuSamples.push(rawStr);
  }
  console.log("First 5 raw SKUs from price file:", rawSkuSamples);

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    const skuExpanded = skuFromRaw(row, col.sku); // Preserve exact value; expand scientific notation.
    if (!skuExpanded) continue;

    const sku = normalizeSku(skuExpanded); // Apply normalize after correct string is preserved.
    if (!sku) continue;
    if (sku.includes("E+") || sku.includes("e+")) {
      console.warn(`[parse-ftg-price] SKU still contains scientific notation after processing; row ${i + 1}:`, row[col.sku]);
    }

    const discontinuedVal = bool(row, col.discontinued);
    const availabilityStatus = str(row, col.availabilityStatus);

    const result: FtgPriceRow = {
      supplier: "FTG",
      sku,
      costPrice: num(row, col.costPrice),
      rrp: num(row, col.rrp),
      tradePrice: num(row, col.tradePrice),
      vatRate: num(row, col.vatRate),
      stockQty: num(row, col.stockQty),
      availabilityStatus,
      leadTimeDays: num(row, col.leadTimeDays),
      discontinued: discontinuedVal ?? (availabilityStatus?.toLowerCase().includes("discontinued") ?? null),
    };

    if (includeRaw) {
      result.raw = {};
      headerRow.forEach((h, idx) => {
        if (row[idx] !== undefined && row[idx] !== "") result.raw![h] = row[idx];
      });
    }

    results.push(result);
  }

  return results;
}

function main() {
  const csvPath = process.argv[2] || process.env.FTG_PRICE_CSV_PATH || process.env.FTG_CSV_PATH || undefined;
  const details = parseFtgPrice({ csvPath, includeRaw: false });
  console.log(JSON.stringify(details, null, 0));
}

const isMain =
  (typeof require !== "undefined" && require.main === module) ||
  (typeof process !== "undefined" && process.argv[1]?.includes("parse-ftg-price"));
if (isMain) main();
