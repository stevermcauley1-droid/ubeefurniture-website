# Deployment Guide

## Vercel Setup

1. Import this repository in Vercel as a Next.js project.
2. Build command: `npm run build`
3. Start command: `npm run start`
4. Add required environment variables in Vercel project settings.

## Environment Variables (names only)

- `DATABASE_URL`
- `NEXT_PUBLIC_SITE_URL`
- `SHOPIFY_STORE_DOMAIN`
- `NEXT_PUBLIC_SHOPIFY_STORE_DOMAIN`
- `SHOPIFY_STOREFRONT_ACCESS_TOKEN`
- `SHOPIFY_STOREFRONT_TOKEN` (optional fallback)
- `SHOPIFY_CLIENT_ID`
- `SHOPIFY_CLIENT_SECRET`
- `SHOPIFY_ADMIN_ACCESS_TOKEN` (optional)
- `SHOPIFY_DATA_MODE` (optional)
- `SHOPIFY_WEBHOOK_SECRET` (if webhooks enabled)
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `UBEE_ADMIN_EMAIL` (if enquiry notifications enabled)
- `SMTP_HOST` (if email sending enabled)
- `SMTP_PORT` (if email sending enabled)
- `SMTP_USER` (if email sending enabled)
- `SMTP_PASS` (if email sending enabled)
- `SMTP_FROM` (if email sending enabled)
- `NEXT_PUBLIC_GA_MEASUREMENT_ID` (optional)
- `NEXT_PUBLIC_GA_ID` (optional)
- `GA4_API_SECRET` (optional)
- `NEXT_PUBLIC_HOTJAR_ID` (optional)
- `NEXT_PUBLIC_CLARITY_ID` (optional)

## Prisma Workflow

- Local development migrations: `npm run db:migrate:local`
- Production-safe migration apply: `npm run db:deploy`

Use `db:deploy` in CI/release after environment variables are configured for the target environment.

## Local Development

- Install dependencies: `npm install`
- Run local migration workflow: `npm run db:migrate:local`
- Seed data: `npm run db:seed`
- Start app: `npm run dev`

