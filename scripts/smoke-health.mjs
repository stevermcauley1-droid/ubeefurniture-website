#!/usr/bin/env node
/**
 * Smoke test: GET /api/health/supabase and assert ok and canReachSupabase.
 * Usage:
 *   node scripts/smoke-health.mjs
 *   node scripts/smoke-health.mjs https://your-app.vercel.app
 * Exits 0 if healthy, 1 otherwise. No secrets. No lead insert (use test-catalogue-lead.mjs for that, in non-prod only).
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';
const url = `${baseUrl.replace(/\/$/, '')}/api/health/supabase`;

async function main() {
  const res = await fetch(url, { method: 'GET' });
  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Health response was not JSON:', text.slice(0, 200));
    process.exit(1);
  }

  if (data.ok === true && data.canReachSupabase === true) {
    console.log('OK', url, 'canReachSupabase:', data.canReachSupabase);
    process.exit(0);
  }

  console.error('Health check failed:', data.message || data.error || 'unknown');
  console.error('ok:', data.ok, 'canReachSupabase:', data.canReachSupabase);
  process.exit(1);
}

main().catch((err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
