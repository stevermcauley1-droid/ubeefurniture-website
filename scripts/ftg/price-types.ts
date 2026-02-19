/**
 * Normalized FTG price/stock row — output of parse-ftg-price.
 */

export interface FtgPriceRow {
  supplier: "FTG";
  sku: string;
  costPrice: number | null;
  rrp: number | null;
  tradePrice: number | null;
  vatRate: number | null;
  stockQty: number | null;
  availabilityStatus: string | null;
  leadTimeDays: number | null;
  discontinued: boolean | null;
  raw?: Record<string, unknown>;
}
