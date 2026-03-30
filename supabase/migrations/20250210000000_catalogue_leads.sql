-- Catalogue lead capture for landlord PDF download
-- Run in Supabase SQL Editor if migrations aren't wired, or use: supabase db push

CREATE TABLE IF NOT EXISTS catalogue_leads (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  name text NOT NULL,
  email text NOT NULL,
  phone text,
  postcode text,
  company text,
  persona text NOT NULL,
  consent boolean NOT NULL DEFAULT false,
  source text NOT NULL DEFAULT 'landlord_catalogue'
);

CREATE INDEX IF NOT EXISTS idx_catalogue_leads_email ON catalogue_leads (email);
CREATE INDEX IF NOT EXISTS idx_catalogue_leads_created_at ON catalogue_leads (created_at);

-- Optional: RLS (allow anonymous insert for lead capture)
ALTER TABLE catalogue_leads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow anonymous insert for catalogue leads"
  ON catalogue_leads FOR INSERT
  TO anon
  WITH CHECK (true);

CREATE POLICY "Allow service role full access"
  ON catalogue_leads FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
