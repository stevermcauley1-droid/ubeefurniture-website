-- Agent Portal MVP
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'MarkupType') THEN
    CREATE TYPE "MarkupType" AS ENUM ('PERCENT', 'FIXED');
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "agents" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "name" TEXT NOT NULL,
  "agency_name" TEXT NOT NULL,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "branding_logo_url" TEXT,
  "branding_primary_color" TEXT,
  "markup_type" "MarkupType" NOT NULL DEFAULT 'PERCENT',
  "markup_value" DECIMAL(10,2) NOT NULL DEFAULT 0,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agents_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agents_email_key" ON "agents"("email");

CREATE TABLE IF NOT EXISTS "agent_catalogues" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" UUID NOT NULL,
  "slug" TEXT NOT NULL,
  "title" TEXT NOT NULL,
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_catalogues_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_catalogues_slug_key" ON "agent_catalogues"("slug");
CREATE INDEX IF NOT EXISTS "agent_catalogues_agent_id_idx" ON "agent_catalogues"("agent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_catalogues_agent_id_fkey'
  ) THEN
    ALTER TABLE "agent_catalogues"
      ADD CONSTRAINT "agent_catalogues_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "agent_access_tokens" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "agent_id" UUID NOT NULL,
  "token" TEXT NOT NULL,
  "expires_at" TIMESTAMP(3) NOT NULL,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "agent_access_tokens_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "agent_access_tokens_token_key" ON "agent_access_tokens"("token");
CREATE INDEX IF NOT EXISTS "agent_access_tokens_agent_id_idx" ON "agent_access_tokens"("agent_id");

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'agent_access_tokens_agent_id_fkey'
  ) THEN
    ALTER TABLE "agent_access_tokens"
      ADD CONSTRAINT "agent_access_tokens_agent_id_fkey"
      FOREIGN KEY ("agent_id") REFERENCES "agents"("id")
      ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END
$$;

CREATE TABLE IF NOT EXISTS "leads" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "name" TEXT NOT NULL,
  "agency_name" TEXT,
  "email" TEXT NOT NULL,
  "phone" TEXT,
  "volume" TEXT,
  "notes" TEXT,
  "source" TEXT,
  CONSTRAINT "leads_pkey" PRIMARY KEY ("id")
);

CREATE INDEX IF NOT EXISTS "leads_email_idx" ON "leads"("email");
