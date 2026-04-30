export type PackageCollectionKey =
  | "sofas"
  | "beds"
  | "wardrobes"
  | "chests"
  | "tables";

export type PackageSlug = "1-bed" | "2-bed" | "3-bed" | "hmo";

export interface LandlordPackageConfig {
  name: string;
  description: string;
  items: Record<PackageCollectionKey, number>;
}

export const packages: Record<PackageSlug, LandlordPackageConfig> = {
  "1-bed": {
    name: "1 Bed Property Pack",
    description: "Essential furnishing setup for a single-bedroom rental.",
    items: {
      sofas: 1,
      beds: 1,
      wardrobes: 1,
      chests: 1,
      tables: 1,
    },
  },
  "2-bed": {
    name: "2 Bed Property Pack",
    description: "Balanced package for standard two-bedroom lets.",
    items: {
      sofas: 1,
      beds: 2,
      wardrobes: 2,
      chests: 2,
      tables: 1,
    },
  },
  "3-bed": {
    name: "3 Bed Property Pack",
    description: "Scaled package for larger family rentals.",
    items: {
      sofas: 1,
      beds: 3,
      wardrobes: 3,
      chests: 3,
      tables: 2,
    },
  },
  hmo: {
    name: "HMO Property Pack",
    description: "High-turnover, multi-room setup for shared accommodation.",
    items: {
      sofas: 1,
      beds: 4,
      wardrobes: 4,
      chests: 4,
      tables: 2,
    },
  },
};

export const PACKAGE_COLLECTION_MAP: Record<PackageCollectionKey, string> = {
  sofas: "sofas",
  beds: "beds",
  wardrobes: "wardrobes",
  chests: "chest-of-drawers",
  tables: "coffee-tables",
};

export const PACKAGE_ROLE_LABELS: Record<PackageCollectionKey, string> = {
  sofas: "Sofa",
  beds: "Bed",
  wardrobes: "Wardrobe",
  chests: "Chest of drawers",
  tables: "Coffee table",
};

