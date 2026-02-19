'use client';

import { useMemo } from 'react';
import type { StorefrontProductVariant } from '@/lib/types';

interface ProductVariantsProps {
  variants: StorefrontProductVariant[];
  selectedVariantId: string;
  onVariantChange: (variantId: string) => void;
}

export function ProductVariants({ variants, selectedVariantId, onVariantChange }: ProductVariantsProps) {
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  // Group variants by option name (Size, Color, Fabric, etc.)
  const optionGroups = useMemo(() => {
    const groups: Record<string, Set<string>> = {};
    variants.forEach((v) => {
      v.selectedOptions.forEach((opt) => {
        if (!groups[opt.name]) groups[opt.name] = new Set();
        groups[opt.name].add(opt.value);
      });
    });
    return groups;
  }, [variants]);

  // Build selection state: current selections + new option
  const handleOptionChange = (optionName: string, optionValue: string) => {
    const newSelections: Record<string, string> = {};
    selectedVariant.selectedOptions.forEach((opt) => {
      if (opt.name !== optionName) {
        newSelections[opt.name] = opt.value;
      }
    });
    newSelections[optionName] = optionValue;

    // Find variant matching all selections
    const matchingVariant = variants.find((v) =>
      v.selectedOptions.every((opt) => opt.value === newSelections[opt.name])
    );

    if (matchingVariant) {
      onVariantChange(matchingVariant.id);
    }
  };

  // Check if an option value is available given current selections
  const isOptionValueAvailable = (optionName: string, optionValue: string) => {
    const testSelections: Record<string, string> = {};
    selectedVariant.selectedOptions.forEach((opt) => {
      if (opt.name !== optionName) {
        testSelections[opt.name] = opt.value;
      }
    });
    testSelections[optionName] = optionValue;

    return variants.some(
      (v) =>
        v.selectedOptions.every((opt) => opt.value === testSelections[opt.name]) && v.availableForSale
    );
  };

  if (variants.length <= 1) return null;

  return (
    <div className="space-y-4">
      {Object.entries(optionGroups).map(([optionName, values]) => {
        const currentValue = selectedVariant.selectedOptions.find((o) => o.name === optionName)?.value;

        return (
          <div key={optionName}>
            <label className="block text-sm font-semibold text-[var(--ubee-black)] mb-2">
              {optionName}:
            </label>
            <div className="flex flex-wrap gap-2">
              {Array.from(values).map((value) => {
                const isSelected = currentValue === value;
                const isAvailable = isOptionValueAvailable(optionName, value);

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => handleOptionChange(optionName, value)}
                    disabled={!isAvailable}
                    className={`px-4 py-2 rounded border-2 text-sm font-medium transition-colors ${
                      isSelected
                        ? 'border-[var(--ubee-yellow)] bg-[var(--ubee-yellow)] text-[var(--ubee-black)]'
                        : isAvailable
                        ? 'border-gray-300 bg-white text-[var(--ubee-black)] hover:border-gray-400'
                        : 'border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed'
                    }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
      {selectedVariant && (
        <div className="pt-2 border-t border-gray-200">
          <p className="text-sm text-[var(--ubee-gray)]">
            Price: <span className="font-semibold text-[var(--ubee-black)]">
              {selectedVariant.price.currencyCode} {selectedVariant.price.amount}
            </span>
          </p>
          {!selectedVariant.availableForSale && (
            <p className="text-sm text-red-600 mt-1">This variant is currently sold out.</p>
          )}
        </div>
      )}
    </div>
  );
}
