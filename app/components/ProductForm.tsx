'use client';

import { useState } from 'react';
import { AddToCartButton } from './AddToCartButton';
import type { StorefrontProduct } from '@/lib/types';

interface ProductFormProps {
  product: StorefrontProduct;
  priceAmount?: number;
  priceCurrency?: string;
}

export function ProductForm({ product, priceAmount = 0, priceCurrency = 'GBP' }: ProductFormProps) {
  const variants = product.variants.edges.map((e) => e.node);
  const [selectedVariantId, setSelectedVariantId] = useState(variants[0]?.id ?? '');

  if (variants.length === 0) return null;

  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? variants[0];

  return (
    <div>
      {variants.length > 1 && (
        <div style={{ marginBottom: '1rem' }}>
          <label style={{ fontWeight: 600, marginRight: '0.5rem' }}>Option:</label>
          <select
            value={selectedVariantId}
            onChange={(e) => setSelectedVariantId(e.target.value)}
            style={{ padding: '0.25rem 0.5rem' }}
          >
            {variants.map((v) => (
              <option key={v.id} value={v.id}>
                {v.title} {!v.availableForSale ? '(sold out)' : ''}
              </option>
            ))}
          </select>
        </div>
      )}
      <AddToCartButton
        variantId={selectedVariantId}
        productId={product.id}
        productName={product.title}
        price={priceAmount}
        currency={priceCurrency}
        label={selectedVariant.availableForSale ? 'Add to cart' : 'Sold out'}
        redirectToCart={true}
        disabled={!selectedVariant.availableForSale}
      />
    </div>
  );
}
