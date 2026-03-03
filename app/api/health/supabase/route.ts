import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;

/**
 * Safe diagnostics: env presence + minimal Supabase reachability.
 * Uses anon key only. No secrets in response.
 */
export async function GET() {
  const hasNextPublicUrl = !!process.env.NEXT_PUBLIC_SUPABASE_URL;
  const hasNextPublicAnonKey = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const env = {
    hasNextPublicUrl,
    hasNextPublicAnonKey,
  };

  const timestamp = new Date().toISOString();

  if (!hasNextPublicUrl || !hasNextPublicAnonKey) {
    return NextResponse.json(
      {
        ok: false,
        env,
        timestamp,
        error: 'MISSING_ENV',
        message: 'NEXT_PUBLIC_SUPABASE_URL or NEXT_PUBLIC_SUPABASE_ANON_KEY missing',
      },
      { status: 503 }
    );
  }

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
    );
    const { error } = await supabase.from('_health_ping_').select('id').limit(1);
    if (error) {
      const code = (error as { code?: string }).code ?? 'UNKNOWN';
      const msg = (error as { message?: string }).message ?? String(error);
      const lower = msg.toLowerCase();

      // Treat \"table does not exist / missing in schema cache\" as a healthy connection:
      // Supabase has been reached, the DB responded, and only the test table is missing.
      if (
        code === '42P01' ||
        lower.includes('does not exist') ||
        lower.includes('relation') ||
        lower.includes('could not find the table') ||
        lower.includes('schema cache')
      ) {
        return NextResponse.json(
          {
            ok: true,
            env,
            timestamp,
            note: 'Supabase reachable. _health_ping_ test table missing.',
          },
          { status: 200 }
        );
      }
      return NextResponse.json(
        {
          ok: false,
          env,
          timestamp,
          error: code,
          message: msg,
        },
        { status: 503 }
      );
    }
    return NextResponse.json({ ok: true, env, timestamp }, { status: 200 });
  } catch (err) {
    const name = err instanceof Error ? err.name : 'Error';
    const message = err instanceof Error ? err.message : String(err);
    if (!message || message.includes('key') || message.includes('secret')) {
      return NextResponse.json(
        {
          ok: false,
          env,
          timestamp,
          error: name,
          message: 'Supabase check failed',
        },
        { status: 503 }
      );
    }
    return NextResponse.json(
      {
        ok: false,
        env,
        timestamp,
        error: name,
        message,
      },
      { status: 503 }
    );
  }
}
