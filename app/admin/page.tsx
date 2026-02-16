import Link from "next/link";
import { Suspense } from "react";
import { getPrisma } from "@/lib/db/prisma";
import { computeOpportunityScore, HIGH_SCORE_THRESHOLD } from "@/lib/db/scoring";
import { Filters } from "./Filters";
import { Prisma } from "@prisma/client";

const TAKE = 50;
const SKIP = 0;
const FETCH_FOR_SCORE_SORT = 200;

type SearchParams = Record<string, string | string[] | undefined>;

type ClientRow = {
  id: string;
  displayName: string | null;
  clientType: string;
  volumeTier: string;
  urgencyLevel: string;
  complianceRequirement: string;
  relationshipStage: string;
  region: string | null;
  estimatedAnnualValue: number | null;
  probability: number | null;
  nextAction: string | null;
  nextActionDate: Date | null;
  assignedTo: string | null;
};

async function getAdminData(params: SearchParams) {
  const prisma = getPrisma();
  const q = typeof params.q === "string" ? params.q.trim() : "";
  const type = typeof params.type === "string" ? params.type : "ALL";
  const compliance = typeof params.compliance === "string" ? params.compliance : "ALL";
  const stage = typeof params.stage === "string" ? params.stage : "ALL";
  const region = typeof params.region === "string" ? params.region : "ALL";
  const sort = typeof params.sort === "string" ? params.sort : "score";

  const where: Prisma.ClientWhereInput = {};
  if (q) {
    where.OR = [
      { displayName: { contains: q, mode: "insensitive" } },
      { companyName: { contains: q, mode: "insensitive" } },
      { region: { contains: q, mode: "insensitive" } },
    ];
  }
  if (type && type !== "ALL") where.clientType = type as Prisma.ClientWhereInput["clientType"];
  if (compliance && compliance !== "ALL")
    where.complianceRequirement = compliance as Prisma.ClientWhereInput["complianceRequirement"];
  if (stage && stage !== "ALL")
    where.relationshipStage = stage as Prisma.ClientWhereInput["relationshipStage"];
  if (region && region !== "ALL") where.region = region;

  const useScoreSort = sort === "score";
  const orderBy: Prisma.ClientOrderByWithRelationInput[] =
    sort === "value"
      ? [{ estimatedAnnualValue: "desc" }]
      : sort === "region"
        ? [{ region: "asc" }]
        : sort === "stage"
          ? [{ relationshipStage: "asc" }]
          : sort === "oldest"
            ? [{ createdAt: "asc" }]
            : sort === "volumeTier"
              ? [{ volumeTier: "asc" }]
              : [{ createdAt: "desc" }];

  const take = useScoreSort ? FETCH_FOR_SCORE_SORT : TAKE;

  const [
    clientCount,
    propertyCount,
    dealCount,
    orderCount,
    clientsRaw,
    countsByType,
    regionRows,
  ] = await Promise.all([
    prisma.client.count({ where }),
    prisma.property.count(),
    prisma.deal.count(),
    prisma.order.count(),
    prisma.client.findMany({
      where,
      orderBy,
      take,
      skip: useScoreSort ? 0 : SKIP,
      select: {
        id: true,
        displayName: true,
        clientType: true,
        volumeTier: true,
        urgencyLevel: true,
        complianceRequirement: true,
        relationshipStage: true,
        region: true,
        estimatedAnnualValue: true,
        probability: true,
        nextAction: true,
        nextActionDate: true,
        assignedTo: true,
      },
    }),
    prisma.client.groupBy({
      by: ["clientType"],
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    prisma.client.findMany({
      where: { region: { not: null } },
      select: { region: true },
      distinct: ["region"],
    }),
  ]);

  let clients: ClientRow[] = clientsRaw.map((c) => ({
    id: c.id,
    displayName: c.displayName,
    clientType: c.clientType,
    volumeTier: c.volumeTier,
    urgencyLevel: c.urgencyLevel,
    complianceRequirement: c.complianceRequirement,
    relationshipStage: c.relationshipStage,
    region: c.region,
    estimatedAnnualValue: c.estimatedAnnualValue,
    probability: c.probability,
    nextAction: c.nextAction,
    nextActionDate: c.nextActionDate,
    assignedTo: c.assignedTo,
  }));

  if (useScoreSort) {
    clients = clients
      .map((c) => ({
        ...c,
        _score: computeOpportunityScore({
          volumeTier: c.volumeTier,
          urgencyLevel: c.urgencyLevel,
          complianceRequirement: c.complianceRequirement,
          relationshipStage: c.relationshipStage,
        }),
      }))
      .sort((a, b) => (b as { _score: number })._score - (a as { _score: number })._score)
      .slice(0, TAKE)
      .map(({ _score, ...rest }) => rest as ClientRow);
  }

  const distinctRegions = regionRows
    .map((r) => r.region)
    .filter((r): r is string => r != null)
    .sort();

  const clientsWithScore = clients.map((c) => ({
    ...c,
    opportunityScore: computeOpportunityScore({
      volumeTier: c.volumeTier,
      urgencyLevel: c.urgencyLevel,
      complianceRequirement: c.complianceRequirement,
      relationshipStage: c.relationshipStage,
    }),
  }));

  const pipelineValue = clientsWithScore.reduce((sum, c) => {
    const val = c.estimatedAnnualValue ?? 0;
    const prob = (c.probability ?? 0) / 100;
    return sum + val * prob;
  }, 0);

  const highScoreCount = clientsWithScore.filter(
    (c) => c.opportunityScore >= HIGH_SCORE_THRESHOLD
  ).length;

  return {
    counts: { clientCount, propertyCount, dealCount, orderCount },
    countsByType: countsByType.map((r) => ({
      clientType: r.clientType,
      count: r._count.id,
    })),
    clients: clientsWithScore,
    distinctRegions,
    pipelineValue,
    highScoreCount,
  };
}

function formatEnum(s: string) {
  return s.replace(/_/g, " ");
}

function stageBadgeClass(stage: string): string {
  switch (stage) {
    case "LEAD":
      return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/40 dark:text-yellow-200";
    case "QUALIFIED":
      return "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200";
    case "ACTIVE":
      return "bg-green-100 text-green-800 dark:bg-green-900/40 dark:text-green-200";
    case "CHURNED":
      return "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200";
    default:
      return "bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200";
  }
}

function formatPounds(value: number | null | undefined): string {
  if (value == null) return "—";
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(value);
}

function formatDate(d: Date | null | undefined): string {
  if (!d) return "—";
  return new Intl.DateTimeFormat("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  }).format(new Date(d));
}

export const metadata = {
  title: "Admin Dashboard | Ubee Furniture",
  description: "Client intelligence and pipeline overview",
};

interface AdminPageProps {
  searchParams: Promise<SearchParams> | SearchParams;
}

export default async function AdminPage({ searchParams }: AdminPageProps) {
  const params = await Promise.resolve(searchParams);
  let data: Awaited<ReturnType<typeof getAdminData>>;
  let error: string | null = null;

  try {
    data = await getAdminData(params);
  } catch (e) {
    error =
      e instanceof Error ? e.message : "Failed to load dashboard data";
    data = {
      counts: {
        clientCount: 0,
        propertyCount: 0,
        dealCount: 0,
        orderCount: 0,
      },
      countsByType: [],
      clients: [],
      distinctRegions: [],
      pipelineValue: 0,
      highScoreCount: 0,
    };
  }

  if (error) {
    return (
      <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-12">
        <div className="mx-auto max-w-4xl">
          <h1 className="mb-4 text-2xl font-semibold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <div
            className="rounded-lg border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-950/30 p-4 text-red-800 dark:text-red-200"
            role="alert"
          >
            <p className="font-medium">Error loading dashboard</p>
            <p className="mt-1 text-sm">{error}</p>
            <p className="mt-2 text-sm opacity-90">
              Check DATABASE_URL and that migrations have been run.
            </p>
          </div>
          <p className="mt-4">
            <Link
              href="/"
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              ← Back to site
            </Link>
          </p>
        </div>
      </main>
    );
  }

  const { counts, countsByType, clients, distinctRegions, pipelineValue, highScoreCount } = data;
  const kpis = [
    { label: "Clients", value: counts.clientCount },
    { label: "Properties", value: counts.propertyCount },
    { label: "Deals", value: counts.dealCount },
    { label: "Orders", value: counts.orderCount },
  ];

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-900 px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-gray-900 dark:text-white">
            Admin Dashboard
          </h1>
          <Link
            href="/"
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
          >
            ← Back to site
          </Link>
        </div>

        <section className="mb-10">
          <h2 className="sr-only">Key metrics</h2>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {kpis.map(({ label, value }) => (
              <div
                key={label}
                className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-5 shadow-sm"
              >
                <p className="text-sm font-medium text-gray-500 dark:text-gray-400">
                  {label}
                </p>
                <p className="mt-1 text-2xl font-semibold text-gray-900 dark:text-white tabular-nums">
                  {value}
                </p>
              </div>
            ))}
          </div>
          {countsByType.length > 0 && (
            <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-gray-600 dark:text-gray-400">
              <span className="font-medium">By type:</span>
              {countsByType.map(({ clientType, count }) => (
                <span key={clientType}>
                  {formatEnum(clientType)}: {count}
                </span>
              ))}
            </div>
          )}
        </section>

        <section>
          <h2 className="mb-4 text-lg font-medium text-gray-900 dark:text-white">
            Clients
          </h2>
          <Suspense fallback={<div className="h-14 animate-pulse rounded-xl bg-gray-200 dark:bg-gray-700" />}>
            <Filters regions={distinctRegions} />
          </Suspense>
          {clients.length > 0 && (
            <div className="mt-4 flex flex-wrap items-center gap-4 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 px-4 py-3 text-sm">
              <span className="font-medium text-gray-700 dark:text-gray-300">
                Pipeline value (weighted): {formatPounds(Math.round(pipelineValue))}
              </span>
              <span className="text-gray-600 dark:text-gray-400">
                High-score clients (≥{HIGH_SCORE_THRESHOLD}): {highScoreCount}
              </span>
            </div>
          )}
          <div className="mt-4">
            {clients.length === 0 ? (
              <div className="rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-8 text-center">
                <p className="text-gray-500 dark:text-gray-400">
                  No clients match the current filters. Try adjusting search or filters.
                </p>
              </div>
            ) : (
              <div className="overflow-hidden rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
                <div className="overflow-x-auto max-h-[70vh] overflow-y-auto">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                    <thead className="sticky top-0 z-10 bg-gray-50 dark:bg-gray-800">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Display name
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Type
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Volume
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Compliance
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Stage
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Region
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Est. value
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Prob.
                        </th>
                        <th className="px-4 py-3 text-center text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Score
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Next action
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Due
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-gray-500 dark:text-gray-400">
                          Assigned
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {clients.map((client) => (
                        <tr
                          key={client.id}
                          className="hover:bg-gray-50 dark:hover:bg-gray-700/50"
                        >
                          <td className="max-w-[160px] truncate px-4 py-3 text-sm font-medium text-gray-900 dark:text-white" title={client.displayName ?? undefined}>
                            {client.displayName ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800 dark:bg-blue-900/40 dark:text-blue-200">
                              {formatEnum(client.clientType)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                              {client.volumeTier}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className="inline-flex rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800 dark:bg-amber-900/40 dark:text-amber-200">
                              {formatEnum(client.complianceRequirement)}
                            </span>
                          </td>
                          <td className="whitespace-nowrap px-4 py-3">
                            <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${stageBadgeClass(client.relationshipStage)}`}>
                              {formatEnum(client.relationshipStage)}
                            </span>
                          </td>
                          <td className="max-w-[120px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-300" title={client.region ?? undefined}>
                            {client.region ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-right text-sm tabular-nums text-gray-700 dark:text-gray-300">
                            {formatPounds(client.estimatedAnnualValue)}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm tabular-nums text-gray-700 dark:text-gray-300">
                            {client.probability != null ? `${client.probability}%` : "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-center text-sm font-medium tabular-nums text-gray-900 dark:text-white">
                            {"opportunityScore" in client ? String((client as { opportunityScore: number }).opportunityScore) : "—"}
                          </td>
                          <td className="max-w-[140px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-300" title={client.nextAction ?? undefined}>
                            {client.nextAction ?? "—"}
                          </td>
                          <td className="whitespace-nowrap px-4 py-3 text-sm text-gray-600 dark:text-gray-300">
                            {formatDate(client.nextActionDate)}
                          </td>
                          <td className="max-w-[100px] truncate px-4 py-3 text-sm text-gray-600 dark:text-gray-300" title={client.assignedTo ?? undefined}>
                            {client.assignedTo ?? "—"}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                {clients.length >= TAKE && (
                  <p className="border-t border-gray-200 dark:border-gray-700 px-4 py-2 text-xs text-gray-500 dark:text-gray-400">
                    Showing first {TAKE} results. Pagination can be added later.
                  </p>
                )}
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
