-- CreateTable
CREATE TABLE "SupplierProduct" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "productId" TEXT,
    "ean" TEXT,
    "commodityCode" TEXT,
    "range" TEXT,
    "name" TEXT,
    "description" TEXT,
    "finish" TEXT,
    "assembledJson" JSONB,
    "boxesJson" JSONB,
    "imagesJson" JSONB,
    "categoriesJson" JSONB,
    "frFabricUrl" TEXT,
    "frFoamUrl" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProduct_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierProduct_supplier_idx" ON "SupplierProduct"("supplier");

-- CreateIndex
CREATE INDEX "SupplierProduct_ean_idx" ON "SupplierProduct"("ean");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProduct_supplier_sku_key" ON "SupplierProduct"("supplier", "sku");
