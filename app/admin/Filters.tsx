"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useTransition } from "react";

const CLIENT_TYPES = [
  { value: "ALL", label: "All types" },
  { value: "LETTING_AGENT", label: "Letting agent" },
  { value: "SOCIAL_HOUSING", label: "Social housing" },
  { value: "LANDLORD", label: "Landlord" },
  { value: "RETAIL", label: "Retail" },
] as const;

const COMPLIANCE = [
  { value: "ALL", label: "All compliance" },
  { value: "CRIB5", label: "CRIB5" },
  { value: "FULL_COMPLIANCE", label: "Full compliance" },
  { value: "NONE", label: "None" },
  { value: "FIRE_SAFETY", label: "Fire safety" },
] as const;

const STAGES = [
  { value: "ALL", label: "All stages" },
  { value: "LEAD", label: "Lead" },
  { value: "QUALIFIED", label: "Qualified" },
  { value: "ACTIVE", label: "Active" },
  { value: "CHURNED", label: "Churned" },
  { value: "PROSPECT", label: "Prospect" },
  { value: "LAPSED", label: "Lapsed" },
] as const;

const SORT_OPTIONS = [
  { value: "score", label: "Opportunity score" },
  { value: "value", label: "Est. value" },
  { value: "stage", label: "Stage" },
  { value: "region", label: "Region" },
  { value: "newest", label: "Newest first" },
  { value: "oldest", label: "Oldest first" },
  { value: "volumeTier", label: "Volume tier" },
] as const;

interface FiltersProps {
  regions?: string[];
}

export function Filters({ regions = [] }: FiltersProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();

  const q = searchParams.get("q") ?? "";
  const type = searchParams.get("type") ?? "ALL";
  const compliance = searchParams.get("compliance") ?? "ALL";
  const stage = searchParams.get("stage") ?? "ALL";
  const sort = searchParams.get("sort") ?? "score";
  const region = searchParams.get("region") ?? "ALL";

  const setParams = useCallback(
    (updates: Record<string, string>) => {
      const next = new URLSearchParams(searchParams.toString());
      Object.entries(updates).forEach(([key, value]) => {
        const isDefault =
          value === "" ||
          value === "ALL" ||
          (key === "sort" && value === "score");
        if (isDefault) next.delete(key);
        else next.set(key, value);
      });
      startTransition(() => {
        router.push(`/admin?${next.toString()}`);
      });
    },
    [router, searchParams]
  );

  return (
    <div
      className="flex flex-wrap items-center gap-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 shadow-sm"
      aria-busy={isPending}
    >
      <label className="sr-only" htmlFor="admin-search">
        Search clients
      </label>
      <input
        id="admin-search"
        type="search"
        placeholder="Search name, company, region…"
        defaultValue={q}
        onChange={(e) => setParams({ q: e.target.value.trim() })}
        onBlur={(e) => setParams({ q: e.target.value.trim() })}
        onKeyDown={(e) => {
          if (e.key === "Enter") setParams({ q: (e.target as HTMLInputElement).value.trim() });
        }}
        className="min-w-[180px] rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      />
      <select
        aria-label="Client type"
        value={type}
        onChange={(e) => setParams({ type: e.target.value })}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {CLIENT_TYPES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Compliance"
        value={compliance}
        onChange={(e) => setParams({ compliance: e.target.value })}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {COMPLIANCE.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      <select
        aria-label="Relationship stage"
        value={stage}
        onChange={(e) => setParams({ stage: e.target.value })}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {STAGES.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {regions.length > 0 && (
        <select
          aria-label="Region"
          value={region}
          onChange={(e) => setParams({ region: e.target.value })}
          className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
        >
          <option value="ALL">All regions</option>
          {regions.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </select>
      )}
      <select
        aria-label="Sort by"
        value={sort}
        onChange={(e) => setParams({ sort: e.target.value })}
        className="rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-2 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
      >
        {SORT_OPTIONS.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {isPending && (
        <span className="text-xs text-gray-500 dark:text-gray-400">Updating…</span>
      )}
    </div>
  );
}
