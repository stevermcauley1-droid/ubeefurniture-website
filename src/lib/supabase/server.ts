/**
 * Server-side Supabase client (service role). Server-only.
 * NEVER import this from client components or client bundles.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/src/lib/env.server';

/**
 * Service role client for API routes / server actions. Not for Edge runtime.
 */
export function supabaseServerAdmin(): SupabaseClient {
  if (process.env.NEXT_RUNTIME === 'edge') {
    throw new Error(
      'supabaseServerAdmin() cannot run on Edge. Use Node runtime (e.g. export const runtime = "nodejs").'
    );
  }
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    const missing: string[] = [];
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!key) missing.push('SUPABASE_SERVICE_ROLE_KEY');
    throw new Error(`Missing Supabase server env: ${missing.join(', ')}`);
  }
  return createClient(url, key, { auth: { persistSession: false } });
}

/**
 * Server-side anon client (for read-only or public operations). Uses NEXT_PUBLIC_* vars.
 */
export function getSupabaseServerAnon(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !anonKey) return null;
  return createClient(url, anonKey);
}
