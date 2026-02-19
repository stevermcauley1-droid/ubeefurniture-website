-- CreateTable
CREATE TABLE "SupplierProductPricing" (
    "id" TEXT NOT NULL,
    "supplier" TEXT NOT NULL,
    "sku" TEXT NOT NULL,
    "currency" TEXT NOT NULL DEFAULT 'GBP',
    "costPrice" DECIMAL(12,2),
    "tradePrice" DECIMAL(12,2),
    "rrp" DECIMAL(12,2),
    "vatRate" DECIMAL(5,2),
    "stockQty" INTEGER,
    "availabilityStatus" TEXT,
    "leadTimeDays" INTEGER,
    "discontinued" BOOLEAN,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SupplierProductPricing_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "SupplierProductPricing_supplier_idx" ON "SupplierProductPricing"("supplier");

-- CreateIndex
CREATE UNIQUE INDEX "SupplierProductPricing_supplier_sku_key" ON "SupplierProductPricing"("supplier", "sku");
