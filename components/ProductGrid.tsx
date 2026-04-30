import Link from 'next/link';
import Image from 'next/image';
import type { StorefrontProduct } from '@/lib/types';
import { Button } from '@/components/ui/button';

export interface ProductGridProps {
  products: StorefrontProduct[];
  /** Number of first images to prioritize (LCP on first row) */
  priorityCount?: number;
  /** When set, renders a storefront-style card with secondary CTA (homepage, promos). */
  showAvailabilityCta?: boolean;
  /** Digits-only E.164-style number used with `https://wa.me/{digits}` (e.g. from `NEXT_PUBLIC_WHATSAPP_NUMBER`). */
  whatsappDigits?: string | null;
  /** Override fallback when WhatsApp unavailable (default: landlord pack funnel). */
  availabilityHref?: string;
}

function whatsappHrefForProduct(whatsappDigits: string, title: string): string {
  const clean = whatsappDigits.replace(/\D/g, '');
  const text = `Hi I'm interested in ${title}`;
  return `https://wa.me/${clean}?text=${encodeURIComponent(text)}`;
}

/**
 * Responsive product grid: 2 columns mobile, 4 columns desktop.
 */
export function ProductGrid({
  products,
  priorityCount = 8,
  showAvailabilityCta = false,
  whatsappDigits = null,
  availabilityHref = '/landlords/1-bed-pack',
}: ProductGridProps) {
  return (
    <ul className="grid grid-cols-2 lg:grid-cols-4 gap-4 list-none p-0">
      {products.map((p, i) => {
        const price = p.variants?.edges?.[0]?.node?.price;
        const gridImage = p.featuredImage ?? p.images?.edges?.[0]?.node ?? null;

        const wa =
          whatsappDigits && whatsappDigits.replace(/\D/g, '').length >= 10
            ? whatsappHrefForProduct(whatsappDigits, p.title)
            : null;

        const main = (
          <Link href={`/products/${p.handle}`} className="block flex flex-1 flex-col">
            <div
              className={
                showAvailabilityCta
                  ? 'relative w-full aspect-square bg-gray-100 overflow-hidden'
                  : 'relative w-full aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2'
              }
            >
              {gridImage ? (
                <Image
                  src={gridImage.url}
                  alt={gridImage.altText ?? p.title}
                  fill
                  sizes="(max-width: 1024px) 50vw, 25vw"
                  priority={i < priorityCount}
                  className={`object-cover ${showAvailabilityCta ? 'group-hover:opacity-95 transition-opacity' : 'group-hover:opacity-90 transition-opacity'}`}
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-gray-400 text-sm">
                  No image
                </div>
              )}
            </div>
            <div className={showAvailabilityCta ? 'p-4 pb-3 flex flex-1 flex-col' : ''}>
              <h3 className="font-semibold text-sm text-[var(--ubee-black)] mb-1 line-clamp-2">
                {p.title}
              </h3>
              {price && (
                <p className="text-sm text-[var(--ubee-gray)]">
                  {price.currencyCode} {price.amount}
                </p>
              )}
              {p.variants?.edges.every((e) => !e.node.availableForSale) && (
                <p className="text-xs text-red-600 mt-1">Sold out</p>
              )}
            </div>
          </Link>
        );

        if (!showAvailabilityCta) {
          return (
            <li key={p.id} className="group">
              {main}
            </li>
          );
        }

        return (
          <li key={p.id} className="group flex flex-col overflow-hidden rounded-2xl border border-stone-200 bg-white shadow-[0_8px_24px_-18px_rgba(0,0,0,0.35)]">
            {main}
            <div className="flex flex-col gap-1.5 px-4 pb-4 pt-1">
              {wa ? (
                <Button
                  asChild
                  size="sm"
                  className="w-full rounded-xl bg-[#25D366] px-3 text-sm font-semibold text-white shadow-sm hover:bg-[#20BD5C]"
                >
                  <a href={wa} target="_blank" rel="noopener noreferrer">
                    Check Availability
                  </a>
                </Button>
              ) : (
                <Button asChild variant="secondary" size="sm" className="w-full rounded-xl font-semibold">
                  <Link href={availabilityHref}>Check Availability</Link>
                </Button>
              )}
              <p className="text-center text-[11px] leading-tight text-amber-900/85">
                Limited stock — message now to reserve
              </p>
              <p className="text-center text-xs text-[var(--ubee-gray)]">Delivered & assembled</p>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
