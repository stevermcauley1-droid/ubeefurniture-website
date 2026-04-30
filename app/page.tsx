import Image from "next/image";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ProductGrid } from "@/components/ProductGrid";
import { getCollection } from "@/lib/shopify/getCollection";
import type { StorefrontProduct } from "@/lib/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

const TRUST_POINTS = [
  "Delivered & assembled",
  "Landlord-focused team",
  "No hassle setup",
];

const FEATURES = [
  {
    title: "Fast Turnaround",
    description:
      "From enquiry to installation in days, helping you reduce void periods and start generating rental income sooner.",
  },
  {
    title: "Complete Packages",
    description:
      "Sofa, bed, mattress, wardrobe, dining and essentials bundled into one clear, practical furnishing plan.",
  },
  {
    title: "Built for Rentals",
    description:
      "Durable, low-maintenance furniture selected for tenant use, repeat lets, and professional property presentation.",
  },
];

const LANDLORD_PACKAGES = [
  {
    slug: "1-bed",
    title: "1 Bed Property Pack",
    description: "Fast, complete setup for single-bed rentals so you can list and let sooner.",
    trust: "Delivered & assembled in days",
  },
  {
    slug: "2-bed",
    title: "2 Bed Property Pack",
    description: "Balanced furnishing package for standard two-bed lets with one clear workflow.",
    trust: "Built for repeat landlord use",
  },
  {
    slug: "3-bed",
    title: "3 Bed Property Pack",
    description: "Scalable package for larger family rentals that need quick tenant-ready presentation.",
    trust: "Curated for durability and uptime",
  },
  {
    slug: "hmo",
    title: "HMO Property Pack",
    description: "Multi-room setup designed for higher-turnover shared accommodation projects.",
    trust: "Trusted by landlords across South Wales",
  },
] as const;

export default async function HomePage() {
  const whatsappDigits =
    process.env.NEXT_PUBLIC_WHATSAPP_NUMBER?.replace(/\D/g, '') ?? '';

  let featuredProducts: StorefrontProduct[] = [];
  try {
    const { collection } = await getCollection("sofas", 8);
    if (collection?.products?.edges?.length) {
      featuredProducts = collection.products.edges.map(
        (edge: { node: StorefrontProduct }) => edge.node
      );
    }
  } catch (e) {
    console.error("[HomePage] Featured sofas (Shopify) failed", e);
  }

  return (
    <main className="bg-gradient-to-b from-stone-50 via-white to-stone-100">
      <section className="relative overflow-hidden border-b border-stone-200/70">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,_rgba(250,204,21,0.22),_transparent_44%)]" />
        <div className="mx-auto grid max-w-7xl gap-10 px-6 py-20 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
          <div className="relative z-10">
            <Badge variant="outline" className="mb-4 rounded-full bg-white/70">
              Trusted by landlords & agents
            </Badge>
            <h1 className="text-balance text-4xl font-semibold tracking-tight text-zinc-950 sm:text-5xl lg:text-6xl">
              Furnish Your Property in Days — Ready for Tenants
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-zinc-600 sm:text-lg">
              Premium furniture packages delivered and installed with zero hassle,
              designed for landlords who need speed, consistency, and quality.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row sm:items-center">
              <Button
                asChild
                size="lg"
                className="h-12 rounded-xl bg-[var(--ubee-yellow)] px-7 text-sm font-extrabold text-zinc-900 shadow-[0_14px_32px_-20px_rgba(0,0,0,0.45)] ring-1 ring-yellow-300 transition hover:bg-yellow-300 hover:text-zinc-900 focus-visible:ring-4 focus-visible:ring-yellow-300/70"
              >
                <Link href="/landlords/1-bed">Get Your Property Ready</Link>
              </Button>
              <Button asChild variant="outline" size="lg" className="h-12 rounded-xl px-7 text-sm font-semibold">
                <Link href="/collections">Browse Collections</Link>
              </Button>
            </div>
          </div>

          <div className="relative z-10 overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_20px_50px_-30px_rgba(0,0,0,0.4)]">
            <div className="relative aspect-[4/3] w-full">
              <Image
                src="/hero-clean.webp"
                alt="Premium furnished rental property"
                fill
                priority
                sizes="(max-width: 1024px) 100vw, 48vw"
                className="object-cover"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="border-b border-stone-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-9 sm:py-11">
          <p className="text-center text-base font-semibold tracking-tight text-zinc-900 sm:text-lg">
            Trusted by landlords across South Wales
          </p>
          <ul className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:gap-4 md:justify-center md:gap-6">
            <li className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-zinc-700">
              Delivered & assembled
            </li>
            <li className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-zinc-700">
              Ready to let in days
            </li>
            <li className="rounded-full border border-stone-200 bg-stone-50 px-4 py-2 text-sm font-medium text-zinc-700">
              No hidden costs
            </li>
          </ul>
        </div>
      </section>

      <section className="border-b border-stone-200/70 bg-stone-50/90">
        <div className="mx-auto max-w-7xl px-6 py-14 sm:py-16">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
              Packages
            </p>
            <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
              Ready-to-Let Packages
            </h2>
            <p className="mt-3 text-base leading-relaxed text-zinc-600">
              Furnish voids faster with curated package setups. Pick the property size, confirm on WhatsApp, and get installed quickly.
            </p>
          </div>
          <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {LANDLORD_PACKAGES.map((pkg) => (
              <Card
                key={pkg.slug}
                className="flex h-full flex-col rounded-2xl border-stone-200 bg-white shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)]"
              >
                <CardHeader className="pb-3">
                  <CardTitle className="text-lg font-semibold text-zinc-950">{pkg.title}</CardTitle>
                  <CardDescription className="text-sm leading-relaxed text-zinc-600">
                    {pkg.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-1 flex-col justify-between gap-4">
                  <p className="text-xs font-medium uppercase tracking-[0.08em] text-zinc-500">{pkg.trust}</p>
                  <Button
                    asChild
                    variant="outline"
                    className="h-11 w-full rounded-xl border-zinc-300 text-sm font-semibold text-zinc-900 hover:bg-zinc-900 hover:text-white"
                  >
                    <Link href={`/landlords/${pkg.slug}`}>Check Availability</Link>
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 ? (
        <section className="border-b border-stone-200/70 bg-white">
          <div className="mx-auto max-w-7xl px-6 py-16 sm:py-20">
            <div className="mb-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
                  Featured Sofas
                </p>
                <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
                  Ready-to-Let Sofas
                </h2>
                <p className="mt-3 max-w-2xl text-base leading-relaxed text-zinc-600">
                  Delivered, assembled, ready in days
                </p>
              </div>
              <Button
                asChild
                variant="outline"
                className="h-11 shrink-0 self-start rounded-xl px-6 text-sm font-semibold sm:self-auto"
              >
                <Link href="/collections/sofas">Browse All Ready-to-Let Sofas</Link>
              </Button>
            </div>
            <ProductGrid
              products={featuredProducts}
              priorityCount={8}
              showAvailabilityCta
              whatsappDigits={whatsappDigits || null}
            />
          </div>
        </section>
      ) : null}

      <section className="mx-auto max-w-7xl px-6 py-20">
        <div className="rounded-2xl border border-stone-200 bg-white p-6 shadow-[0_12px_30px_-24px_rgba(0,0,0,0.35)] sm:p-8">
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
                Trust
              </p>
              <h2 className="mt-2 text-2xl font-semibold tracking-tight text-zinc-950">
                Rated 5.0 by landlords across South Wales
              </h2>
            </div>
            <div className="flex flex-wrap gap-2">
              {TRUST_POINTS.map((point) => (
                <Badge key={point} variant="outline" className="rounded-full bg-stone-50 text-zinc-700">
                  {point}
                </Badge>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-7xl px-6 pb-20">
        <div className="mb-10 max-w-3xl">
          <p className="text-sm font-semibold uppercase tracking-[0.12em] text-zinc-500">
            Why Ubee
          </p>
          <h2 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Conversion-focused service built for rental performance
          </h2>
        </div>
        <div className="grid gap-5 md:grid-cols-3">
          {FEATURES.map((feature) => (
            <Card
              key={feature.title}
              className="rounded-2xl border-stone-200 bg-white/95 shadow-[0_14px_28px_-24px_rgba(0,0,0,0.4)]"
            >
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-semibold text-zinc-900">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <CardDescription className="text-sm leading-relaxed text-zinc-600">
                  {feature.description}
                </CardDescription>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section className="border-t border-stone-200/80 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-20 text-center">
          <Badge variant="outline" className="rounded-full bg-stone-50 text-zinc-700">
            Ready to move fast?
          </Badge>
          <h2 className="mt-5 text-3xl font-semibold tracking-tight text-zinc-950 sm:text-4xl">
            Get your property ready today
          </h2>
          <p className="mx-auto mt-4 max-w-2xl text-base leading-relaxed text-zinc-600">
            See package options, confirm availability, and secure your installation slot in minutes.
          </p>
          <div className="mt-8 flex justify-center">
            <Button asChild size="lg" className="h-12 rounded-xl px-8 text-sm font-semibold">
              <Link href="/landlords/1-bed">Check Availability</Link>
            </Button>
          </div>
        </div>
      </section>
    </main>
  );
}
