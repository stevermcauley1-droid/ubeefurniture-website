import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { generatePackage } from "@/lib/packages/generatePackage";
import { packages, type PackageSlug } from "@/lib/packages/config";
import { Button } from "@/components/ui/button";

function formatGBP(value: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 2,
  }).format(value);
}

function toTitleCaseSlug(slug: string): string {
  return slug
    .split("-")
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

export async function generateStaticParams() {
  return Object.keys(packages).map((pkg) => ({ package: pkg }));
}

interface PageProps {
  params: Promise<{ package: string }>;
}

export async function generateMetadata({ params }: PageProps) {
  const { package: packageSlug } = await params;
  const slug = packageSlug as PackageSlug;
  const cfg = packages[slug];
  if (!cfg) {
    return { title: "Landlord Package" };
  }
  return {
    title: `${cfg.name} | Ubee Furniture`,
    description: cfg.description,
  };
}

export default async function LandlordPackagePage({ params }: PageProps) {
  const { package: packageSlug } = await params;
  const slug = packageSlug as PackageSlug;
  if (!packages[slug]) notFound();

  const cfg = packages[slug];
  const pkg = await generatePackage(slug).catch((error) => {
    if (process.env.NODE_ENV !== "production") {
      console.error("[LandlordPackagePage] package generation fallback", {
        slug,
        error: error instanceof Error ? error.message : String(error),
      });
    }
    return {
      slug,
      name: cfg.name,
      description: cfg.description,
      items: [],
      totals: { original: 0, packagePrice: 0, individualTotal: 0, savings: 0 },
    };
  });
  const whatsappDigits = (process.env.NEXT_PUBLIC_WHATSAPP_NUMBER ?? "").replace(/\D/g, "");
  if (!whatsappDigits) {
    throw new Error("MISSING_WHATSAPP_NUMBER");
  }
  const whatsappUrl = `https://wa.me/${whatsappDigits}?text=${encodeURIComponent(
    `Hi I want the ${toTitleCaseSlug(slug)} furniture pack`
  )}`;
  const heroImage = pkg.items[0]?.image ?? "";

  return (
    <main className="mx-auto max-w-7xl px-4 py-8 pb-24 sm:py-10">
      <section className="mb-8 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900">
        <div className="relative min-h-[260px] sm:min-h-[360px]">
          {heroImage ? (
            <Image
              src={heroImage}
              alt={`${pkg.name} hero`}
              fill
              sizes="100vw"
              className="object-cover opacity-55"
              priority
            />
          ) : null}
          <div className="absolute inset-0 bg-gradient-to-r from-black/75 via-black/60 to-black/35" />
          <div className="relative z-10 flex min-h-[260px] flex-col justify-end gap-3 px-5 py-6 sm:min-h-[360px] sm:justify-center sm:px-10 sm:py-10">
            <p className="inline-flex w-fit rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white backdrop-blur">
              Ready-to-let package • Landlords &amp; letting agents
            </p>
            <h1 className="max-w-3xl text-2xl font-bold leading-tight text-white sm:text-5xl">{pkg.name}</h1>
            <p className="max-w-3xl text-sm text-zinc-200 sm:text-lg">{pkg.description}</p>
            <div className="flex flex-wrap gap-2 pt-1 text-xs font-semibold text-white/95 sm:text-sm">
              <span className="rounded-full bg-white/15 px-3 py-1">Ready in 3-5 days</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Limited stock available</span>
              <span className="rounded-full bg-white/15 px-3 py-1">Used by landlords across South Wales</span>
            </div>
            <div className="pt-2">
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex w-full items-center justify-center rounded-xl bg-[var(--ubee-yellow)] px-8 py-4 text-base font-extrabold text-zinc-900 shadow-lg ring-2 ring-yellow-400/70 transition hover:brightness-105 sm:w-auto sm:text-lg"
              >
                Secure This Property Setup
              </a>
            </div>
          </div>
        </div>
      </section>

      <section className="mb-8 rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm sm:p-8">
        <h2 className="text-2xl font-semibold text-zinc-900">Included Items</h2>
        <p className="mt-2 text-zinc-600">Live Shopify picks assembled into one landlord-ready package.</p>
        {pkg.items.length === 0 ? (
          <p className="mt-3 text-sm text-zinc-500">
            Package details are being refreshed. Please check availability on WhatsApp.
          </p>
        ) : null}
        <ul className="mt-6 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {pkg.items.map((item) => (
            <li key={item.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
              <div className="relative aspect-[4/3] w-full bg-zinc-100">
                <Image src={item.image} alt={item.title} fill sizes="(max-width: 1024px) 50vw, 33vw" className="object-cover" />
              </div>
              <div className="p-5">
                <p className="text-xs font-semibold uppercase tracking-wide text-zinc-500">{item.roleLabel}</p>
                <h3 className="mt-1 line-clamp-3 text-base font-semibold leading-snug text-zinc-900">{item.title}</h3>
                <p className="mt-3 text-sm text-zinc-500 line-through">{formatGBP(item.originalPrice)}</p>
                <p className="text-lg font-bold text-zinc-900">{formatGBP(item.adjustedPrice)}</p>
                <Link href={`/products/${item.handle}`} className="mt-3 inline-block text-sm font-medium text-zinc-600 hover:underline">
                  View product
                </Link>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section className="mb-10 rounded-2xl border border-zinc-200 bg-zinc-50 p-6 sm:p-8">
        <h2 className="mb-5 text-2xl font-semibold text-zinc-900">Package Pricing</h2>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm uppercase tracking-wide text-zinc-500">Original Items Total</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-900">{formatGBP(pkg.totals.original)}</p>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-5">
            <p className="text-sm uppercase tracking-wide text-zinc-500">Individual Items Total</p>
            <p className="mt-2 text-2xl font-semibold text-zinc-500 line-through">{formatGBP(pkg.totals.individualTotal)}</p>
          </div>
          <div className="rounded-xl border border-zinc-900 bg-zinc-900 p-5 text-white">
            <p className="text-sm uppercase tracking-wide text-zinc-300">Package Deal</p>
            <p className="mt-2 text-3xl font-extrabold">Package Price: {formatGBP(pkg.totals.packagePrice)}</p>
            <p className="mt-2 text-sm text-zinc-200">
              You save <span className="font-bold text-green-300">{formatGBP(pkg.totals.savings)}</span> when bundled
            </p>
          </div>
        </div>
      </section>

      <section className="rounded-2xl border border-zinc-200 bg-white p-6 sm:p-8">
        <h3 className="text-xl font-semibold text-zinc-900">Need a different package size?</h3>
        <p className="mt-2 text-zinc-600">Switch packages instantly without rebuilding pages.</p>
        <div className="mt-5 flex flex-wrap gap-3">
          {Object.keys(packages).map((key) => (
            <Button key={key} asChild variant={key === slug ? "default" : "outline"} className="rounded-xl">
              <Link href={`/landlords/${key}`}>{packages[key as PackageSlug].name}</Link>
            </Button>
          ))}
        </div>
      </section>
    </main>
  );
}

