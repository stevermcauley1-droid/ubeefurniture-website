/**
 * Top-level category tabs: mega-menu links and /collections/{handle} landing carousels.
 */

export const OFFICE_SUBCATEGORY_ITEMS = [
  { label: 'Desks', handle: 'desks' },
  { label: 'Gaming Desks', handle: 'gaming-desks' },
  { label: 'Desk Chairs', handle: 'desk-chairs' },
  { label: 'Cabinets', handle: 'office-cabinets' },
  { label: 'Bookcases', handle: 'bookcases' },
  { label: 'Cube Shelves', handle: 'cube-shelves' },
  { label: 'Wall Shelves', handle: 'wall-shelves' },
  { label: 'Professional Office', handle: 'professional-office' },
] as const;

export const LIVING_SUBCATEGORY_ITEMS = [
  { label: 'Living Room Sets', handle: 'living-room-sets' },
  { label: 'Sideboards', handle: 'living-sideboards' },
  { label: 'Cabinets', handle: 'living-cabinets' },
  { label: 'TV Units', handle: 'tv-units' },
  { label: 'Lounge Chairs', handle: 'lounge-chairs' },
  { label: 'Console Tables', handle: 'console-tables' },
  { label: 'Coffee Tables', handle: 'coffee-tables' },
  { label: 'Side Tables', handle: 'side-tables' },
  { label: 'Nest of Tables', handle: 'nest-of-tables' },
  { label: 'Cube Shelves', handle: 'cube-shelves' },
  { label: 'Bookcases', handle: 'bookcases' },
  { label: 'Mirrors', handle: 'mirrors' },
  { label: 'Coat Racks', handle: 'coat-racks' },
  { label: 'Shoe Storage Cabinets', handle: 'shoe-storage-cabinets' },
  { label: 'Wall Shelves', handle: 'wall-shelves' },
  { label: 'Cabinet Lights', handle: 'cabinet-lights' },
  { label: 'Accessories', handle: 'accessories' },
] as const;

export const DINING_SUBCATEGORY_ITEMS = [
  { label: 'Dining Sets', handle: 'dining-sets' },
  { label: 'Dining Tables', handle: 'dining-tables' },
  { label: 'Dining Chairs', handle: 'dining-chairs' },
  { label: 'Sideboards', handle: 'dining-sideboards' },
  { label: 'Cabinets', handle: 'dining-cabinets' },
  { label: 'Bar Desks', handle: 'bar-desks' },
  { label: 'Bar and Counter Stools', handle: 'bar-counter-stools' },
  { label: 'Cabinet Lights', handle: 'cabinet-lights' },
] as const;

export const BEDROOM_SUBCATEGORY_ITEMS = [
  { label: 'Bedroom Sets', handle: 'bedroom-sets' },
  { label: 'Bedside Cabinets', handle: 'bedside-cabinets' },
  { label: 'Chest of Drawers', handle: 'chest-of-drawers' },
  { label: 'Console Tables', handle: 'console-tables' },
  { label: 'Wardrobes', handle: 'wardrobes' },
  { label: 'Sliding Wardrobes', handle: 'sliding-wardrobes' },
  { label: 'Beds', handle: 'beds' },
  { label: 'Shoe Storage Cabinets', handle: 'shoe-storage-cabinets' },
  { label: 'Ottoman Storage', handle: 'ottoman-storage' },
  { label: 'Bed Slats', handle: 'bed-slats' },
  { label: 'Cabinet Lights', handle: 'cabinet-lights' },
] as const;

export const KIDS_SUBCATEGORY_ITEMS = [
  { label: 'Kids Room Sets', handle: 'kids-room-sets' },
  { label: 'Kids Beds', handle: 'kids-beds' },
  { label: 'Kids Accessories', handle: 'kids-accessories' },
  { label: 'Kids Wardrobes', handle: 'kids-wardrobes' },
  { label: 'Kids Cabinets', handle: 'kids-cabinets' },
  { label: 'Kids Chest of Drawers', handle: 'kids-chest-of-drawers' },
  { label: 'Kids Desks', handle: 'kids-desks' },
  { label: 'Kids Gaming Desks', handle: 'kids-gaming-desks' },
  { label: 'Kids Wall Shelves', handle: 'kids-wall-shelves' },
  { label: 'Kids Bookcases', handle: 'kids-bookcases' },
  { label: 'Kids Cube Shelves', handle: 'kids-cube-shelves' },
  { label: 'Kids Toy Storage', handle: 'kids-toy-storage' },
] as const;

/** Includes “All Sofas”; omit that tile on the parent /collections/sofas landing via omitLandingTileHandle. */
export const SOFAS_SUBCATEGORY_ITEMS = [
  { label: 'All Sofas', handle: 'sofas' },
  { label: '2 Seater Sofas', handle: 'sofas-2-seater' },
  { label: '3 Seater Sofas', handle: 'sofas-3-seater' },
  { label: 'Corner Sofas', handle: 'corner-sofas' },
  { label: 'Lounge Chairs', handle: 'lounge-chairs' },
] as const;

function submenuLinks(items: readonly { label: string; handle: string }[]) {
  return items.map(({ label, handle }) => ({ label, href: `/collections/${handle}` }));
}

export const OFFICE_SUBMENU_LINKS = submenuLinks(OFFICE_SUBCATEGORY_ITEMS);
export const LIVING_SUBMENU_LINKS = submenuLinks(LIVING_SUBCATEGORY_ITEMS);
export const DINING_SUBMENU_LINKS = submenuLinks(DINING_SUBCATEGORY_ITEMS);
export const BEDROOM_SUBMENU_LINKS = submenuLinks(BEDROOM_SUBCATEGORY_ITEMS);
export const KIDS_SUBMENU_LINKS = submenuLinks(KIDS_SUBCATEGORY_ITEMS);
export const SOFAS_SUBMENU_LINKS = submenuLinks(SOFAS_SUBCATEGORY_ITEMS);

export type CategoryTabLandingKey =
  | 'office'
  | 'living-room'
  | 'dining'
  | 'bedroom-furniture'
  | 'kids'
  | 'sofas';

export type CategoryLandingDef = {
  title: string;
  intro: string;
  subcategories: readonly { label: string; handle: string }[];
  /** Hide carousel tile when it links to the same collection as this page (e.g. All Sofas on Sofas). */
  omitLandingTileHandle?: string;
};

export const CATEGORY_TAB_LANDINGS: Record<CategoryTabLandingKey, CategoryLandingDef> = {
  office: {
    title: 'Office',
    intro:
      'A dedicated space at home helps you work and study with less clutter and more comfort—without turning the whole house into an office. From compact desks and supportive chairs to cabinets, bookcases, and shelving, this range is built around pieces that fit real rooms and everyday use.',
    subcategories: OFFICE_SUBCATEGORY_ITEMS,
  },
  'living-room': {
    title: 'Living Room',
    intro:
      'The living room is where daily life unfolds—quiet mornings, busy evenings, and everything in between. Explore seating, tables, storage, and finishing touches that help the space feel organised, welcoming, and ready for how you actually use it.',
    subcategories: LIVING_SUBCATEGORY_ITEMS,
  },
  dining: {
    title: 'Dining',
    intro:
      'From quick breakfasts to long dinners with guests, the right dining furniture sets the tone. Tables and chairs, sets, sideboards, and storage pieces work together so mealtimes feel comfortable and clutter stays out of sight.',
    subcategories: DINING_SUBCATEGORY_ITEMS,
  },
  'bedroom-furniture': {
    title: 'Bedroom',
    intro:
      'A calm bedroom starts with practical storage and the right bed for your space. Wardrobes, chests, bedside pieces, and beds help you keep clothes and essentials sorted so the room feels restful and easy to maintain.',
    subcategories: BEDROOM_SUBCATEGORY_ITEMS,
  },
  kids: {
    title: 'Kids',
    intro:
      'Children’s rooms need furniture that keeps up with growing routines—sleep, study, play, and storage. Desks, beds, wardrobes, and organisers make it easier to keep toys and clothes under control while the space still feels like theirs.',
    subcategories: KIDS_SUBCATEGORY_ITEMS,
  },
  sofas: {
    title: 'Sofas',
    intro:
      'Whether you are furnishing a compact flat or a larger lounge, the right sofa anchors the room. Browse sizes and shapes—from two- and three-seaters to corners and lounge chairs—to find seating that fits your layout and lifestyle.',
    subcategories: SOFAS_SUBCATEGORY_ITEMS,
    omitLandingTileHandle: 'sofas',
  },
};

export function getCategoryTabLanding(handle: string): CategoryLandingDef | null {
  if (handle in CATEGORY_TAB_LANDINGS) {
    return CATEGORY_TAB_LANDINGS[handle as CategoryTabLandingKey];
  }
  return null;
}
