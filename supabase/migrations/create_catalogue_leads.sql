-- Catalogue lead capture for landlord PDF download.
-- Run in Supabase Dashboard → SQL Editor, then run secure_catalogue_leads.sql.

create table if not exists catalogue_leads (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz default now(),
  name text not null,
  email text not null,
  phone text,
  postcode text,
  company text,
  persona text,
  consent boolean default false,
  source text default 'landlord_catalogue'
);

create index if not exists idx_catalogue_leads_created_at on catalogue_leads (created_at desc);
create index if not exists idx_catalogue_leads_email on catalogue_leads (email);
