/**
 * Client-side Supabase client only.
 * Uses NEXT_PUBLIC_SUPABASE_URL + NEXT_PUBLIC_SUPABASE_ANON_KEY.
 * Never import this from server-only code that needs service role; use server.ts instead.
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

/**
 * Throws if required env vars are missing. Do not log or include values.
 */
export function assertEnv(): void {
  if (!url || !anonKey) {
    const missing: string[] = [];
    if (!url) missing.push('NEXT_PUBLIC_SUPABASE_URL');
    if (!anonKey) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
    throw new Error(`Missing Supabase env: ${missing.join(', ')}`);
  }
}

let browserClient: SupabaseClient | null = null;

/**
 * Returns the browser-safe Supabase client (anon key). Client-side only.
 */
export function getSupabaseBrowser(): SupabaseClient {
  if (typeof window === 'undefined') {
    throw new Error('getSupabaseBrowser() is for client-side use only');
  }
  assertEnv();
  if (!browserClient) {
    browserClient = createClient(url!, anonKey!);
  }
  return browserClient;
}

/** Alias for backward compatibility. */
export const getSupabaseClient = getSupabaseBrowser;
