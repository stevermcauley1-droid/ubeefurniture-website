#!/usr/bin/env node
/**
 * Smoke test: root URL availability + GET /api/health/supabase.
 * Usage:
 *   node scripts/smoke-health.mjs
 *   node scripts/smoke-health.mjs https://your-app.vercel.app
 * Exits 0 if both checks pass, 1 otherwise. No secrets.
 */

const baseUrl = (process.argv[2] || 'http://localhost:3000').replace(/\/$/, '');
const healthUrl = `${baseUrl}/api/health/supabase`;

async function checkSite() {
  const res = await fetch(baseUrl, { method: 'GET' });
  const ok = res.status >= 200 && res.status <= 399;
  return { ok, status: res.status };
}

async function checkSupabase() {
  const res = await fetch(healthUrl, { method: 'GET' });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    return { ok: false, error: 'Health response was not JSON' };
  }
  const ok = data.ok === true && data.canReachSupabase === true;
  return { ok, data };
}

async function main() {
  const [site, supabase] = await Promise.all([checkSite(), checkSupabase()]);

  if (!site.ok) {
    console.error('Site check failed:', site.status ?? site.error);
    process.exit(1);
  }
  if (!supabase.ok) {
    console.error(
      'Supabase health check failed:',
      supabase.data?.message ?? supabase.data?.error ?? supabase.error ?? 'unknown'
    );
    process.exit(1);
  }

  console.log('Site OK', baseUrl);
  console.log('Supabase OK', healthUrl);
  console.log('canReachSupabase:', supabase.data?.canReachSupabase ?? true);
  process.exit(0);
}

main().catch((err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
