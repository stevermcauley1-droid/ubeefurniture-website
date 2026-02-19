require('dotenv').config({ path: '.env.local' });
const { Client } = require('pg');

async function main() {
  let url = process.env.DATABASE_URL;
  if (!url) throw new Error('DATABASE_URL is not set');
  if (!url.includes('sslmode=')) {
    url += (url.includes('?') ? '&' : '?') + 'sslmode=no-verify';
  }

  const client = new Client({ connectionString: url });
  await client.connect();
  const result = await client.query(
    "SELECT id, created_at, name, email, role, source FROM catalogue_leads ORDER BY created_at DESC LIMIT 1"
  );
  console.log(JSON.stringify(result.rows[0] || null));
  await client.end();
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});

