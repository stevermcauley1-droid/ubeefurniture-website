# Client Intelligence Database — Migrate, Seed, Test

Prisma + Supabase (Postgres) for the uBee Furniture sales pipeline, client scoring, and AI-ready recommendations.

## Prerequisites

1. **Supabase project** with Postgres
2. **DATABASE_URL** in `.env` or `.env.local`:
   - Use the **direct connection** (port 5432) for migrations
   - Example: `postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:5432/postgres`

## Setup

```bash
# 1. Install dependencies
npm install

# 2. Add DATABASE_URL to .env (see .env.example for format)

# 3. Validate schema
npx prisma validate

# 4. Run migrations
npx prisma migrate dev --name client_intelligence

# 5. Generate Prisma Client (if not done by migrate)
npx prisma generate

# 6. Seed the database
npx prisma db seed
```

## Scripts

| Command | Description |
|---------|-------------|
| `npm run db:generate` | Generate Prisma Client |
| `npm run db:migrate` | Run migrations (interactive) |
| `npm run db:seed` | Seed sample data |
| `npm run db:studio` | Open Prisma Studio |

## Schema Overview

- **Client** — clientType, volumeTier, budgetBand, urgencyLevel, complianceRequirement, relationshipStage
- **ClientContact** — contacts per client
- **Property** — propertyType, propertyStatus, postcodeArea
- **Deal** — stage, source, value, nextActionAt
- **Quote** — total, validUntil, status
- **Order** — total, paymentTerms, paidAt
- **Package** — CRIB5, Express packages
- **Interaction** — calls, emails, WhatsApp
- **ClientMetrics** — opportunityScore, riskScore, aov, totalOrders
- **Recommendation** — ruleType, text, priority

## Troubleshooting

### "Connection url is empty"
Add `DATABASE_URL` to `.env` with your Supabase Postgres connection string. Use port **5432** (direct) for migrations.

### "Cannot find module 'prisma/config'"
The config uses `@prisma/config` directly. Ensure `prisma` and `@prisma/client` are installed (`npm install`).

### Shadow database / permissions
If `migrate dev` fails on shadow DB, try:
```bash
npx prisma migrate dev --name client_intelligence
```
Supabase supports shadow databases; ensure your DB user has `CREATE DATABASE` if needed.
