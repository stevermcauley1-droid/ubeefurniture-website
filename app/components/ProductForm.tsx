'use client';

import { useState } from 'react';
import { AddToCartButton } from './AddToCartButton';
import { ProductVariants } from './ProductVariants';
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
  const currentPrice = selectedVariant.price ? parseFloat(selectedVariant.price.amount) : priceAmount;
  const currentCurrency = selectedVariant.price?.currencyCode ?? priceCurrency;

  return (
    <div className="space-y-4">
      <ProductVariants
        variants={variants}
        selectedVariantId={selectedVariantId}
        onVariantChange={setSelectedVariantId}
      />
      <AddToCartButton
        variantId={selectedVariantId}
        productId={product.id}
        productName={product.title}
        price={currentPrice}
        currency={currentCurrency}
        label={selectedVariant.availableForSale ? 'Add to cart' : 'Sold out'}
        redirectToCart={true}
        disabled={!selectedVariant.availableForSale}
      />
    </div>
  );
}
