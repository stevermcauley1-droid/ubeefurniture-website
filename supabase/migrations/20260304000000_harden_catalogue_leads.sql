-- Harden catalogue_leads: drop unused role column, enable RLS, deny anon.
-- Run in Supabase Dashboard → SQL Editor (project nlrkpsdxekgklvcqumhm).
-- Inserts from the app use service role (bypasses RLS). Safe to run once.

-- 1) Remove unused role column (app never sends role)
alter table public.catalogue_leads
  drop column if exists role;

-- 2) Enable RLS (service role bypasses; anon will be denied by policies)
alter table public.catalogue_leads enable row level security;

-- 3) Deny anon/public SELECT and INSERT (admin/API use service role)
drop policy if exists "no_public_select_on_catalogue_leads" on public.catalogue_leads;
create policy "no_public_select_on_catalogue_leads"
  on public.catalogue_leads for select to public using (false);

drop policy if exists "no_public_insert_on_catalogue_leads" on public.catalogue_leads;
create policy "no_public_insert_on_catalogue_leads"
  on public.catalogue_leads for insert to public with check (false);
