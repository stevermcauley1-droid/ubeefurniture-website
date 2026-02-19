-- Add catalogue leads table for landlord catalogue page form
CREATE TABLE IF NOT EXISTS "catalogue_leads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "role" TEXT NOT NULL,
  "source" TEXT,
  CONSTRAINT "catalogue_leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "catalogue_leads_email_idx" ON "catalogue_leads"("email");

