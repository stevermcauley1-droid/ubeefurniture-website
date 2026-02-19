'use client';

import { useEffect, useMemo, useState, useTransition } from 'react';

type EnquiryStatus = 'NEW' | 'IN_PROGRESS' | 'WON' | 'LOST';

type EnquiryItem = {
  id: string;
  createdAt: string;
  customerName: string;
  customerEmail: string;
  propertyAddress: string;
  message: string | null;
  status: EnquiryStatus;
};

type Props = {
  token: string;
  initialEnquiries: EnquiryItem[];
};

function formatRelativeTime(iso: string) {
  const now = Date.now();
  const then = new Date(iso).getTime();
  const diffMs = then - now;
  const diffMins = Math.round(diffMs / 60000);
  const rtf = new Intl.RelativeTimeFormat('en', { numeric: 'auto' });
  if (Math.abs(diffMins) < 60) return rtf.format(diffMins, 'minute');
  const diffHours = Math.round(diffMins / 60);
  if (Math.abs(diffHours) < 24) return rtf.format(diffHours, 'hour');
  const diffDays = Math.round(diffHours / 24);
  return rtf.format(diffDays, 'day');
}

export default function EnquiriesInbox({ token, initialEnquiries }: Props) {
  const [pending, startTransition] = useTransition();
  const [statusFilter, setStatusFilter] = useState<'ALL' | EnquiryStatus>('ALL');
  const [query, setQuery] = useState('');
  const [enquiries, setEnquiries] = useState(initialEnquiries);
  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});

  async function refresh() {
    const url = new URL('/api/enquiries/list', window.location.origin);
    url.searchParams.set('token', token);
    if (statusFilter !== 'ALL') url.searchParams.set('status', statusFilter);
    if (query.trim()) url.searchParams.set('q', query.trim());
    const response = await fetch(url.toString(), { cache: 'no-store' });
    const data = await response.json();
    if (response.ok && Array.isArray(data.enquiries)) {
      setEnquiries(
        data.enquiries.map((item: any) => ({
          ...item,
          createdAt: new Date(item.createdAt).toISOString(),
        }))
      );
    }
  }

  useEffect(() => {
    startTransition(() => {
      void refresh();
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  useEffect(() => {
    const id = setInterval(() => {
      void refresh();
    }, 10000);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [statusFilter, query]);

  const rows = useMemo(() => enquiries, [enquiries]);

  async function updateStatus(id: string, status: EnquiryStatus) {
    const response = await fetch('/api/enquiries/update-status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token, id, status }),
    });
    const data = await response.json();
    if (!response.ok || !data.enquiry) return;
    const updated = { ...data.enquiry, createdAt: new Date(data.enquiry.createdAt).toISOString() };
    setEnquiries((prev) => prev.map((item) => (item.id === id ? updated : item)));
  }

  function statusClass(status: EnquiryStatus) {
    if (status === 'NEW') return 'bg-blue-100 text-blue-800';
    if (status === 'IN_PROGRESS') return 'bg-amber-100 text-amber-800';
    if (status === 'WON') return 'bg-emerald-100 text-emerald-800';
    return 'bg-rose-100 text-rose-800';
  }

  return (
    <section className="rounded-xl border border-zinc-200 bg-white p-6">
      <h1 className="text-2xl font-semibold text-zinc-900">Enquiries</h1>
      <div className="mt-4 flex flex-wrap gap-3">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value as 'ALL' | EnquiryStatus)}
          className="rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        >
          <option value="ALL">All</option>
          <option value="NEW">NEW</option>
          <option value="IN_PROGRESS">IN_PROGRESS</option>
          <option value="WON">WON</option>
          <option value="LOST">LOST</option>
        </select>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search name, email, address, message"
          className="min-w-[280px] flex-1 rounded-lg border border-zinc-300 px-3 py-2 text-sm"
        />
      </div>

      {rows.length === 0 ? (
        <div className="mt-4 rounded-lg border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-700">
          No enquiries yet.
        </div>
      ) : (
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-sm">
            <thead className="border-b border-zinc-200 text-zinc-600">
              <tr>
                <th className="py-2 pr-4">Created</th>
                <th className="py-2 pr-4">Customer</th>
                <th className="py-2 pr-4">Email</th>
                <th className="py-2 pr-4">Property</th>
                <th className="py-2 pr-4">Message</th>
                <th className="py-2 pr-4">Status</th>
                <th className="py-2 pr-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => {
                const message = item.message || '';
                const isExpanded = !!expandedIds[item.id];
                const shouldTruncate = message.length > 80;
                const shown = shouldTruncate && !isExpanded ? `${message.slice(0, 80)}...` : message || '-';
                return (
                  <tr key={item.id} className="border-b border-zinc-100 align-top">
                    <td className="py-3 pr-4 text-zinc-600">{formatRelativeTime(item.createdAt)}</td>
                    <td className="py-3 pr-4 font-medium text-zinc-900">{item.customerName}</td>
                    <td className="py-3 pr-4 text-zinc-700">{item.customerEmail}</td>
                    <td className="py-3 pr-4 text-zinc-700">{item.propertyAddress}</td>
                    <td className="py-3 pr-4 text-zinc-700">
                      {shown}
                      {shouldTruncate ? (
                        <button
                          type="button"
                          onClick={() =>
                            setExpandedIds((prev) => ({ ...prev, [item.id]: !prev[item.id] }))
                          }
                          className="ml-2 text-xs font-semibold text-zinc-900 underline"
                        >
                          {isExpanded ? 'Collapse' : 'Expand'}
                        </button>
                      ) : null}
                    </td>
                    <td className="py-3 pr-4">
                      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${statusClass(item.status)}`}>
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 pr-4">
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          onClick={() => void updateStatus(item.id, 'IN_PROGRESS')}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs"
                        >
                          In Progress
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(item.id, 'WON')}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs"
                        >
                          Won
                        </button>
                        <button
                          type="button"
                          onClick={() => void updateStatus(item.id, 'LOST')}
                          className="rounded border border-zinc-300 px-2 py-1 text-xs"
                        >
                          Lost
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
      {pending ? <p className="mt-3 text-xs text-zinc-500">Refreshing enquiries...</p> : null}
    </section>
  );
}

