/**
 * Server-only env vars for catalogue leads + admin.
 * Never import this from client code.
 */

const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;
const ADMIN_DASH_TOKEN = process.env.ADMIN_DASH_TOKEN;

let envWarningLogged = false;

function logEnvWarningIfNeeded() {
  if (process.env.NODE_ENV === 'production' || envWarningLogged) return;
  const missing: string[] = [];
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL) missing.push('NEXT_PUBLIC_SUPABASE_URL');
  if (!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) missing.push('NEXT_PUBLIC_SUPABASE_ANON_KEY');
  if (!SUPABASE_SERVICE_ROLE_KEY) missing.push('SUPABASE_SERVICE_ROLE_KEY');
  if (!ADMIN_DASH_TOKEN) missing.push('ADMIN_DASH_TOKEN');
  if (missing.length > 0) {
    envWarningLogged = true;
    console.warn('[ubeefurniture] Missing env in .env.local:', missing.join(', '));
    console.warn('[ubeefurniture] Where to get them:');
    if (missing.some((m) => m.includes('SUPABASE'))) {
      console.warn('  - Supabase: Dashboard → your project → Settings → API');
      console.warn('    • Project URL → NEXT_PUBLIC_SUPABASE_URL');
      console.warn('    • anon public → NEXT_PUBLIC_SUPABASE_ANON_KEY');
      console.warn('    • service_role (secret) → SUPABASE_SERVICE_ROLE_KEY');
    }
    if (missing.includes('ADMIN_DASH_TOKEN')) {
      console.warn('  - ADMIN_DASH_TOKEN: choose any secret string (e.g. openssl rand -hex 16)');
    }
    console.warn('  - Add vars to .env.local then restart dev server (npm run dev).');
  }
}

export function getServerEnv() {
  logEnvWarningIfNeeded();
  return {
    SUPABASE_SERVICE_ROLE_KEY: SUPABASE_SERVICE_ROLE_KEY ?? null,
    ADMIN_DASH_TOKEN: ADMIN_DASH_TOKEN ?? null,
  };
}

export { SUPABASE_SERVICE_ROLE_KEY, ADMIN_DASH_TOKEN };
