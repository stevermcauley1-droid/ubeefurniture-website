export type MarkupType = 'PERCENT' | 'FIXED';

export function applyMarkup(basePrice: number, markupType: MarkupType, markupValue: number): number {
  if (!Number.isFinite(basePrice)) return 0;
  const marked =
    markupType === 'PERCENT'
      ? basePrice * (1 + markupValue / 100)
      : basePrice + markupValue;
  return Math.round(marked * 100) / 100;
}

