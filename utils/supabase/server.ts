import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { getSupabasePublishableKey, getSupabaseUrl } from "@/utils/supabase/env";

export const createClient = async () => {
  const supabaseUrl = getSupabaseUrl();
  const supabaseKey = getSupabasePublishableKey();
  if (!supabaseUrl || !supabaseKey) {
    throw new Error(
      "Missing NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY (or NEXT_PUBLIC_SUPABASE_PUBLISHABLE_DEFAULT_KEY)"
    );
  }
  const cookieStore = await cookies();

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        } catch {
          // setAll may run from a Server Component; middleware will handle refresh.
        }
      },
    },
  });
};
