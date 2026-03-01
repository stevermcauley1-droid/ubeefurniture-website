import type { Metadata } from 'next';
import Link from 'next/link';
import { headers } from 'next/headers';
import { getServerEnv } from '../../../src/lib/env.server';

export const metadata: Metadata = {
  title: 'Catalogue Leads | Admin | uBee Furniture',
};

interface Lead {
  id?: string;
  name: string;
  email: string;
  persona: string;
  created_at?: string;
}

async function fetchLeads(): Promise<{ leads: Lead[]; mode: 'supabase' | 'fallback' | null }> {
  try {
    const headersList = await headers();
    const host = headersList.get('host') || 'localhost:3000';
    const protocol = process.env.NODE_ENV === 'development' ? 'http' : 'https';
    const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `${protocol}://${host}`;
    const res = await fetch(`${baseUrl}/api/catalogue-leads`, {
      cache: 'no-store',
    });
    if (!res.ok) return { leads: [], mode: null };
    const raw = await res.text();
    let json: { leads?: unknown[]; mode?: string } | null = null;
    try {
      json = raw ? JSON.parse(raw) : null;
    } catch {
      return { leads: [], mode: null };
    }
    const leads = json && Array.isArray(json.leads) ? (json.leads as Lead[]) : [];
    const mode = json?.mode === 'fallback' ? 'fallback' : json?.mode === 'supabase' ? 'supabase' : null;
    return { leads, mode };
  } catch {
    return { leads: [], mode: null };
  }
}

export default async function AdminLeadsPage({
  searchParams,
}: {
  searchParams?: { token?: string };
}) {
  const providedToken = searchParams?.token ?? '';
  const adminToken = getServerEnv().ADMIN_DASH_TOKEN ?? '';

  const authorised =
    adminToken.length > 0 && providedToken.length > 0 && providedToken === adminToken;

  if (!authorised) {
    return (
      <main className="mx-auto max-w-2xl px-4 py-10">
        <h1 className="text-2xl font-bold text-zinc-900">403 Forbidden</h1>
        <p className="mt-3 text-sm text-zinc-600">
          You do not have access to this page.
        </p>
      </main>
    );
  }

  const { leads, mode } = await fetchLeads();

  return (
    <main className="mx-auto max-w-4xl px-4 py-10">
      <h1 className="text-2xl font-bold text-zinc-900">Admin – Leads</h1>
      <p className="mt-2 text-sm text-zinc-600">
        Latest landlord catalogue leads. Protected by an admin token.
      </p>
      {mode === 'fallback' && (
        <div className="mt-4 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
          Supabase is not configured. Showing fallback storage (data/catalogue-leads.json). Set SUPABASE_SERVICE_ROLE_KEY in .env.local to store leads in Supabase.
        </div>
      )}
      <div className="mt-4 text-sm text-zinc-500">
        <Link href="/landlords/catalogue" className="hover:underline">
          Go to catalogue page
        </Link>
      </div>
      <div className="mt-6 overflow-x-auto rounded-lg border border-zinc-200 bg-white">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-zinc-50">
            <tr>
              <th className="px-3 py-2 font-semibold text-zinc-700">Name</th>
              <th className="px-3 py-2 font-semibold text-zinc-700">Email</th>
              <th className="px-3 py-2 font-semibold text-zinc-700">Persona</th>
              <th className="px-3 py-2 font-semibold text-zinc-700">Created At</th>
            </tr>
          </thead>
          <tbody>
            {leads.length === 0 ? (
              <tr>
                <td colSpan={4} className="px-3 py-4 text-center text-zinc-500">
                  No leads found yet.
                </td>
              </tr>
            ) : (
              leads.map((lead) => (
                <tr key={lead.id ?? `${lead.email}-${lead.created_at ?? ''}`}>
                  <td className="border-t px-3 py-2 text-zinc-900">{lead.name}</td>
                  <td className="border-t px-3 py-2 text-zinc-900">{lead.email}</td>
                  <td className="border-t px-3 py-2 text-zinc-900">
                    {lead.persona?.replace('_', ' ') || '—'}
                  </td>
                  <td className="border-t px-3 py-2 text-zinc-900">
                    {lead.created_at
                      ? new Date(lead.created_at).toLocaleString()
                      : '—'}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </main>
  );
}

