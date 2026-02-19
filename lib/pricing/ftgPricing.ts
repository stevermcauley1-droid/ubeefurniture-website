/**
 * FTG margin and sell-price computation.
 * Used to derive storefront sell price from cost/RRP.
 */

/** Round up to nearest step (e.g. roundUpToNearest(12.34, 1) => 13). */
export function roundUpToNearest(value: number, step: number): number {
  if (!Number.isFinite(value) || !Number.isFinite(step) || step <= 0) return value;
  return Math.ceil(value / step) * step;
}

/** Round to 2 decimal places for currency. */
export function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface FtgPricingRules {
  /** Multiplier on cost when RRP is present (cap at RRP). Default 1.45 */
  marginWithRrp?: number;
  /** Multiplier on cost when no RRP. Default 1.55 */
  marginNoRrp?: number;
  /** Step for round-up (e.g. 1 = round to whole pound). Default 1 */
  roundStep?: number;
}

export interface ComputeSellPriceInput {
  cost: number | null;
  rrp?: number | null;
  rules?: FtgPricingRules;
}

export interface ComputeSellPriceResult {
  sellPrice: number | null;
  compareAtPrice: number | null;
  marginPct: number | null;
}

const DEFAULT_RULES: Required<FtgPricingRules> = {
  marginWithRrp: 1.45,
  marginNoRrp: 1.55,
  roundStep: 1,
};

/**
 * Compute sell price from cost and optional RRP.
 * - If cost missing: return null sellPrice.
 * - If RRP present: sellPrice = min(rrp, roundUpToNearest(cost * marginWithRrp, step)); never exceed RRP.
 * - If no RRP: sellPrice = roundUpToNearest(cost * marginNoRrp, step).
 * compareAtPrice is set to RRP when we sell below RRP (for strikethrough).
 */
export function computeSellPrice(input: ComputeSellPriceInput): ComputeSellPriceResult {
  const { cost, rrp = null, rules: userRules } = input;
  const rules = { ...DEFAULT_RULES, ...userRules };

  if (cost == null || !Number.isFinite(cost) || cost < 0) {
    return { sellPrice: null, compareAtPrice: null, marginPct: null };
  }

  const step = rules.roundStep ?? 1;
  const withRrp = rrp != null && Number.isFinite(rrp) && rrp >= 0;

  let sellPrice: number;
  let compareAtPrice: number | null = null;

  if (withRrp) {
    const candidate = roundUpToNearest(cost * rules.marginWithRrp, step);
    sellPrice = round2(Math.min(rrp, candidate));
    if (rrp > sellPrice) compareAtPrice = round2(rrp);
  } else {
    sellPrice = round2(roundUpToNearest(cost * rules.marginNoRrp, step));
  }

  const marginPct = sellPrice > 0 ? round2(((sellPrice - cost) / cost) * 100) : null;

  return {
    sellPrice,
    compareAtPrice,
    marginPct,
  };
}
