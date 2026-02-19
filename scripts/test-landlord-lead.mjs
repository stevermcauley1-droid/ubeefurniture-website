#!/usr/bin/env node
/**
 * Test script for landlord lead form submission.
 * Tests the submitLandlordLead server action.
 */

import { config } from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = join(__dirname, '..');

// Load .env.local
config({ path: join(rootDir, '.env.local') });

const DATABASE_URL = process.env.DATABASE_URL;

function maskEmail(email) {
  if (!email || email.length < 5) return email;
  const [local, domain] = email.split('@');
  if (!domain) return email;
  const maskedLocal = local.slice(0, 2) + '***' + local.slice(-1);
  return `${maskedLocal}@${domain}`;
}

async function testLandlordLead() {
  console.log('Testing landlord lead form submission...\n');

  // Check DATABASE_URL
  if (!DATABASE_URL) {
    console.error('❌ DATABASE_URL is not set in .env.local');
    console.error('   Add DATABASE_URL to .env.local (see .env.example)');
    process.exit(1);
  }

  console.log('✓ DATABASE_URL is set');
  console.log(`  Database: ${DATABASE_URL.split('@')[1]?.split('/')[0] || 'configured'}\n`);

  // Test data
  const testData = {
    name: 'Test Landlord',
    email: `test-${Date.now()}@example.com`,
    property: '2-bed flat in London',
    message: 'Need furniture package for new rental property',
  };

  console.log('Test data:');
  console.log(`  Name: ${testData.name}`);
  console.log(`  Email: ${maskEmail(testData.email)}`);
  console.log(`  Property: ${testData.property}`);
  console.log(`  Message: ${testData.message}\n`);

  try {
    // Import the server action
    // Note: This is a simplified test - in production, server actions are called from client components
    // For a proper test, we'd need to simulate a Next.js server action call
    console.log('⚠️  Note: Server actions must be tested via the Next.js app.');
    console.log('   To test:');
    console.log('   1. Start dev server: npm run dev');
    console.log('   2. Visit: http://localhost:3000/landlord');
    console.log('   3. Fill out the form and submit');
    console.log('   4. Check database: npm run db:studio\n');

    // Check if Prisma client can connect
    console.log('Checking database connection...');
    const { PrismaClient } = await import('@prisma/client');
    const { Pool } = await import('pg');
    const { PrismaPg } = await import('@prisma/adapter-pg');
    
    let url = DATABASE_URL;
    if (!url.includes('sslmode=')) {
      url += url.includes('?') ? '&' : '?';
      url += 'sslmode=no-verify';
    }
    const pool = new Pool({ connectionString: url });
    const adapter = new PrismaPg(pool);
    const prisma = new PrismaClient({ adapter });

    try {
      // Try a simple query
      const count = await prisma.client.count();
      console.log(`✓ Database connection OK (${count} clients in database)\n`);

      // Check if we can query for the test email
      const existing = await prisma.client.findFirst({
        where: {
          contacts: {
            some: {
              email: testData.email,
            },
          },
        },
      });

      if (existing) {
        console.log(`⚠️  Test email already exists in database`);
        console.log(`   Client ID: ${existing.id}\n`);
      } else {
        console.log('✓ Test email is unique\n');
      }
    } catch (err) {
      console.error('❌ Database connection failed:');
      console.error(`   ${err.message}\n`);
      console.error('   Check:');
      console.error('   1. DATABASE_URL is correct');
      console.error('   2. Database is accessible');
      console.error('   3. Migrations have been run: npm run db:migrate');
      process.exit(1);
    } finally {
      await prisma.$disconnect();
    }

    console.log('✅ Prerequisites check passed!');
    console.log('\nTo test the form:');
    console.log('  1. Ensure dev server is running: npm run dev');
    console.log('  2. Visit: http://localhost:3000/landlord');
    console.log('  3. Scroll to "Request a quote" section');
    console.log('  4. Fill out the form with test data');
    console.log('  5. Submit and verify success message');
    console.log('  6. Check database: npm run db:studio');
    console.log('     → Look for Client, ClientContact, Deal, and Property records\n');

  } catch (err) {
    console.error('❌ Test failed:');
    console.error(err.message);
    if (err.stack) {
      console.error('\nStack trace:');
      console.error(err.stack);
    }
    process.exit(1);
  }
}

testLandlordLead().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
