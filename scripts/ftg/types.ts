/**
 * Normalized FTG product detail — output of parse-ftg-details and input to import.
 */

export interface FtgAssembled {
  widthCm: number | null;
  heightCm: number | null;
  depthCm: number | null;
  weightKg: number | null;
}

export interface FtgBox {
  boxIndex: number;
  ean: string | null;
  lengthCm: number | null;
  widthCm: number | null;
  heightCm: number | null;
  m3: number | null;
  weightKg: number | null;
}

export interface FtgCategories {
  C1?: boolean;
  C2?: boolean;
  C3?: boolean;
  C4?: boolean;
  C5?: boolean;
  C6?: boolean;
  C7?: boolean;
  C8?: boolean;
  C9?: boolean;
  C10?: boolean;
  C11?: boolean;
  C12?: boolean;
  C13?: boolean;
  C14?: boolean;
  C15?: boolean;
  C16?: boolean;
  C17?: boolean;
  C18?: boolean;
  C19?: boolean;
}

export interface FtgCompliance {
  frFabricUrl: string | null;
  frFoamUrl: string | null;
}

export interface FtgProductDetail {
  supplier: "FTG";
  sku: string;
  productId: string | null;
  ean: string | null;
  commodityCode: string | null;
  range: string | null;
  name: string | null;
  description: string | null;
  finish: string | null;
  assembled: FtgAssembled;
  boxes: FtgBox[];
  images: string[];
  categories: FtgCategories;
  compliance: FtgCompliance;
}
