/**
 * Re-export from canonical server module. Use @/src/lib/supabase/server for new code.
 */
export {
  supabaseServerAdmin,
  getSupabaseServerAnon,
} from '@/src/lib/supabase/server';

import { getSupabaseServerAnon } from '@/src/lib/supabase/server';

/** Backward compatibility: anon client. */
export const getSupabaseServerClient = getSupabaseServerAnon;
