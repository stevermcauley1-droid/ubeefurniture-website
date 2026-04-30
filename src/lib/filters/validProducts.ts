export interface ValidatableProduct {
  price: number;
  images?: unknown[];
}

export function isValidProduct(product: ValidatableProduct): boolean {
  return product.price > 0 && (product.images?.length || 0) > 0;
}
