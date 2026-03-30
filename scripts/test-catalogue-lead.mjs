#!/usr/bin/env node
/**
 * Test POST /api/catalogue-leads (local or production).
 * Usage:
 *   node scripts/test-catalogue-lead.mjs
 *   node scripts/test-catalogue-lead.mjs https://your-app.vercel.app
 */

const baseUrl = process.argv[2] || 'http://localhost:3000';
const url = `${baseUrl.replace(/\/$/, '')}/api/catalogue-leads`;

const body = {
  name: 'Test Lead',
  email: `test-${Date.now()}@example.com`,
  persona: 'landlord',
  consent: true,
};

async function main() {
  console.log('POST', url);
  console.log('Body:', JSON.stringify(body, null, 2));

  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const text = await res.text();
  let data;
  try {
    data = JSON.parse(text);
  } catch {
    console.error('Response was not JSON:', text.slice(0, 200));
    process.exit(1);
  }

  console.log('Status:', res.status);
  console.log('Response:', JSON.stringify(data, null, 2));

  if (data.ok === true && data.mode === 'supabase') {
    console.log('\n✅ Success: lead saved to Supabase.');
    process.exit(0);
  }

  if (data.ok === true && data.mode === 'fallback') {
    console.log('\n⚠️  Success (fallback): Supabase not configured; lead saved to file.');
    process.exit(0);
  }

  console.error('\n❌ Failure:', data.error || data.message || 'Unknown');
  if (data.hint) console.error('   Hint:', data.hint);
  process.exit(1);
}

main().catch((err) => {
  console.error('Request failed:', err.message);
  process.exit(1);
});
