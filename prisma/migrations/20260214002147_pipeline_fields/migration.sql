-- AlterTable
ALTER TABLE "Client" ADD COLUMN     "assignedTo" TEXT,
ADD COLUMN     "estimatedAnnualValue" INTEGER,
ADD COLUMN     "nextAction" TEXT,
ADD COLUMN     "nextActionDate" TIMESTAMP(3),
ADD COLUMN     "probability" INTEGER;
