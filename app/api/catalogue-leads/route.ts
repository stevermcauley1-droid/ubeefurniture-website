import { NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { getServerEnv } from '@/src/lib/env.server';
import { promises as fs } from 'fs';
import path from 'path';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

const PERSONAS = ['landlord', 'letting_agent', 'social_housing', 'other'] as const;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const FALLBACK_PATH = path.join(process.cwd(), 'data', 'catalogue-leads.json');

function json(status: number, body: Record<string, unknown>) {
  return NextResponse.json(body, {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(String(email).toLowerCase());
}

function getServiceRoleClient(): SupabaseClient | null {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = getServerEnv().SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

async function appendToFallback(row: Record<string, unknown>) {
  const dir = path.dirname(FALLBACK_PATH);
  await fs.mkdir(dir, { recursive: true }).catch(() => {});
  let existing: unknown[] = [];
  try {
    const raw = await fs.readFile(FALLBACK_PATH, 'utf-8');
    existing = JSON.parse(raw);
    if (!Array.isArray(existing)) existing = [];
  } catch {
    existing = [];
  }
  existing.push({ ...row, created_at: new Date().toISOString() });
  await fs.writeFile(FALLBACK_PATH, JSON.stringify(existing, null, 2), 'utf-8');
}

export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      console.error('[catalogue-leads] Invalid request body (non-JSON)');
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Invalid request body.',
      });
    }

    const name = String((body as any)?.name ?? '').trim();
    const email = String((body as any)?.email ?? '').trim().toLowerCase();
    const phone = (body as any)?.phone != null ? String((body as any).phone).trim() : null;
    const postcode = (body as any)?.postcode != null ? String((body as any).postcode).trim() : null;
    const company = (body as any)?.company != null ? String((body as any).company).trim() : null;
    const persona = String((body as any)?.persona ?? '').trim().toLowerCase();
    const consent = Boolean((body as any)?.consent);

    if (!name) {
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Please enter your name.',
      });
    }
    if (!email) {
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Please enter your email.',
      });
    }
    if (!isValidEmail(email)) {
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Please enter a valid email address.',
      });
    }
    if (!PERSONAS.includes(persona as (typeof PERSONAS)[number])) {
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Please select who you are (Landlord, Letting Agent, etc.).',
      });
    }
    if (!consent) {
      return json(400, {
        ok: false,
        error: 'VALIDATION_ERROR',
        message: 'Please agree to be contacted about landlord packages and offers.',
      });
    }

    const row = {
      name,
      email,
      phone: phone || null,
      postcode: postcode || null,
      company: company || null,
      persona,
      consent,
      source: 'landlord_catalogue',
    };

    const supabase = getServiceRoleClient();

    if (!supabase) {
      console.error('[catalogue-leads] Supabase not configured; using fallback');
      await appendToFallback(row);
      console.log('[Catalogue Lead] mode=fallback at=%s', new Date().toISOString());
      return json(200, { ok: true, mode: 'fallback' });
    }

    const result = await supabase.from('catalogue_leads').insert(row);

    if (!result.error) {
      const id = result.data?.[0]?.id;
      console.log('[Catalogue Lead] mode=supabase at=%s', new Date().toISOString());
      return json(200, { ok: true, mode: 'supabase', ...(id && { id }) });
    }

    console.error('[catalogue-leads] Supabase insert error', result.error?.message ?? result.error);
    return json(500, {
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Unable to save lead right now. Please try again.',
    });
  } catch (err) {
    console.error('[catalogue-leads] error', err instanceof Error ? err.message : err);
    return json(500, {
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Something went wrong. Please try again.',
    });
  }
}

export async function GET() {
  try {
    const supabase = getServiceRoleClient();

    if (!supabase) {
      console.error('[catalogue-leads] Supabase not configured for GET');
      let leads: unknown[] = [];
      try {
        const raw = await fs.readFile(FALLBACK_PATH, 'utf-8');
        const parsed = JSON.parse(raw);
        if (Array.isArray(parsed)) leads = parsed;
      } catch {
        leads = [];
      }
      (leads as any[]).sort(
        (a, b) =>
          new Date(b.created_at ?? 0).getTime() - new Date(a.created_at ?? 0).getTime()
      );
      return json(200, { ok: true, mode: 'fallback', leads: (leads as any[]).slice(0, 50) });
    }

    const { data, error } = await supabase
      .from('catalogue_leads')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(50);

    if (!error && data) {
      return json(200, { ok: true, mode: 'supabase', leads: data });
    }

    console.error('[catalogue-leads] GET error', error?.message ?? error);
    return json(500, {
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Unable to load leads.',
    });
  } catch (err) {
    console.error('[catalogue-leads] GET failed', err instanceof Error ? err.message : err);
    return json(500, {
      ok: false,
      error: 'SERVER_ERROR',
      message: 'Unable to load leads.',
    });
  }
}
