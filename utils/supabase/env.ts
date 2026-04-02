/**
 * Supabase URL + browser-safe (anon) key for SSR and middleware.
 * Vercel/docs use NEXT_PUBLIC_SUPABASE_ANON_KEY; some setups use
 * NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY — support both.
 */
export function getSupabaseUrl(): string | undefined {
  return process.env.NEXT_PUBLIC_SUPABASE_URL;
}

export function getSupabasePublishableKey(): string | undefined {
  return (
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ||
    process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY
  );
}
