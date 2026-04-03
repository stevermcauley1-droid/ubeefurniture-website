/**
 * Office mega-menu and /collections/office landing carousel (single source of truth).
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

export const OFFICE_SUBMENU_LINKS: Array<{ label: string; href: string }> =
  OFFICE_SUBCATEGORY_ITEMS.map(({ label, handle }) => ({
    label,
    href: `/collections/${handle}`,
  }));
