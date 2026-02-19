/**
 * SKU normalization for FTG details and price feeds.
 * Use the same normalization when storing and when matching so details and price sync align.
 *
 * Rule: trim, uppercase, collapse spaces to single space, remove hyphens.
 * "FTG-001" / "ftg 001" / "FTG  001" → "FTG001"
 *
 * Excel may export long numbers as scientific notation (e.g. 1.01291E+12).
 * Use expandScientificNotation first to get full digits, then normalizeSku.
 */

/** Expand Excel-style scientific notation to full integer string (no precision loss). */
export function expandScientificNotation(value: string): string {
  const s = String(value).trim();
  const match = s.match(/^(\d+\.?\d*)e\+?(\d+)$/i);
  if (!match) return s;
  const [, mantissa, expStr] = match;
  const exp = parseInt(expStr, 10);
  if (!Number.isFinite(exp)) return s;
  const parts = (mantissa || "0").split(".");
  const intPart = (parts[0] || "0").replace(/^0+/, "") || "0";
  const fracPart = parts[1] || "";
  const numDecimals = fracPart.length;
  const mantissaStr = intPart + fracPart;
  const zerosToAdd = exp - numDecimals;
  if (zerosToAdd >= 0) return mantissaStr + "0".repeat(zerosToAdd);
  return mantissaStr.slice(0, mantissaStr.length + zerosToAdd) || "0";
}

export function normalizeSku(sku: string | null | undefined): string {
  if (sku == null || typeof sku !== "string") return "";
  return sku
    .trim()
    .toUpperCase()
    .replace(/\s+/g, " ")
    .replace(/-/g, "")
    .replace(/\s/g, "")
    .trim();
}
