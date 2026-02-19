/**
 * Navigation data for Products (category-based) and Landlord Hub (conversion-focused).
 */

export interface ProductCategory {
  label: string;
  href: string;
}

export const PRODUCT_CATEGORIES: ProductCategory[] = [
  { label: 'Mattresses', href: '/collections/mattresses' },
  { label: 'Beds', href: '/collections/beds' },
  { label: 'Bedroom Furniture', href: '/collections/bedroom-furniture' },
  { label: 'Living Room', href: '/collections/living-room' },
  { label: 'Dining', href: '/collections/dining' },
  { label: 'Office', href: '/collections/office' },
  { label: 'Sofas', href: '/collections/sofas' },
];

export interface LandlordHubItem {
  label: string;
  href: string;
  cta?: boolean;
}

/** Landlord Hub mega menu: 5 items max, conversion-driven. Download Catalogue is the main CTA. */
export const LANDLORD_HUB_ITEMS: LandlordHubItem[] = [
  { label: 'Landlord Packages', href: '/landlord-solutions/packages' },
  { label: 'Request a Quote', href: '/landlords#quote' },
  { label: 'Delivery & Assembly', href: '/landlord-solutions/bulk-delivery' },
  { label: 'Aftercare / Repairs', href: '/contact#aftercare' },
];

export const LANDLORD_CATALOGUE_HREF = '/landlords/catalogue';
