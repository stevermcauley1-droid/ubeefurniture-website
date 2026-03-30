-- Lock down catalogue_leads with strict RLS.
-- Run after create_catalogue_leads.sql in Supabase SQL editor.

alter table catalogue_leads enable row level security;

-- Deny all public SELECT access explicitly
create policy "no_public_select_on_catalogue_leads"
  on catalogue_leads
  for select
  to public
  using (false);

-- Deny all public INSERT access explicitly
create policy "no_public_insert_on_catalogue_leads"
  on catalogue_leads
  for insert
  to public
  with check (false);

