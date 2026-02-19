-- Add enquiries table for public catalogue quote requests
CREATE TABLE IF NOT EXISTS "enquiries" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "agent_id" UUID NOT NULL,
  "catalogue_id" UUID NOT NULL,
  "customer_name" TEXT NOT NULL,
  "customer_email" TEXT NOT NULL,
  "property_address" TEXT NOT NULL,
  "items_interested_in" TEXT NOT NULL,
  "message" TEXT,
  "status" TEXT NOT NULL DEFAULT 'NEW',
  CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "enquiries_agent_id_idx" ON "enquiries"("agent_id");
CREATE INDEX IF NOT EXISTS "enquiries_catalogue_id_idx" ON "enquiries"("catalogue_id");
CREATE INDEX IF NOT EXISTS "enquiries_status_idx" ON "enquiries"("status");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_agent_id_fkey'
  ) THEN
    ALTER TABLE "enquiries"
      ADD CONSTRAINT "enquiries_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'enquiries_catalogue_id_fkey'
  ) THEN
    ALTER TABLE "enquiries"
      ADD CONSTRAINT "enquiries_catalogue_id_fkey"
      FOREIGN KEY ("catalogue_id") REFERENCES "agent_catalogues"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

