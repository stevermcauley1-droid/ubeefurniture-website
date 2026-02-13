/**
 * Supplier brands — used in footer and trust sections.
 * Add the 2 without websites when you have their names.
 */

export interface Supplier {
  name: string;
  url?: string; // omit if no website
}

export const SUPPLIERS: Supplier[] = [
  { name: 'Seconique', url: 'https://www.seconique.co.uk' },
  { name: 'Heartlands Furniture', url: 'https://www.heartlandsfurniture.co.uk' },
  { name: 'Wholesale Beds', url: 'https://www.wholesalebeds.co.uk' },
  { name: 'Supplier 4', url: undefined }, // Add name when available; products added manually
  { name: 'Supplier 5', url: undefined }, // Add name when available; products added manually
];
