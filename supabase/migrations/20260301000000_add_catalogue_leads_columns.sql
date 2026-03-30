-- Production fix: add missing columns to catalogue_leads (idempotent).
-- Run in Supabase Dashboard → SQL Editor for project nlrkpsdxekgklvcqumhm.
-- Safe to run multiple times; no data loss.

alter table public.catalogue_leads
  add column if not exists phone text,
  add column if not exists postcode text,
  add column if not exists company text,
  add column if not exists persona text,
  add column if not exists consent boolean default false,
  add column if not exists source text default 'landlord_catalogue';
