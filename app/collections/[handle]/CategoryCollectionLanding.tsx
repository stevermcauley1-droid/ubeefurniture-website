import Image from 'next/image';
import Link from 'next/link';
import { getCollectionByHandle } from '@/lib/shopify';
import type { StorefrontProduct } from '@/lib/types';
import type { CategoryLandingDef } from '@/app/components/site/categoryTabSubcategories';

function pickLifestyleImages(products: StorefrontProduct[], max = 3) {
  const out: { url: string; alt: string }[] = [];
  const seen = new Set<string>();
  for (const p of products) {
    const img = p.featuredImage;
    if (!img?.url || seen.has(img.url)) continue;
    seen.add(img.url);
    out.push({
      url: img.url,
      alt: img.altText ?? p.title,
    });
    if (out.length >= max) break;
  }
  return out;
}

export async function CategoryCollectionLanding({
  def,
  heroProducts,
}: {
  def: CategoryLandingDef;
  heroProducts: StorefrontProduct[];
}) {
  const tiles =
    def.omitLandingTileHandle != null
      ? def.subcategories.filter((s) => s.handle !== def.omitLandingTileHandle)
      : def.subcategories;

  const previews = await Promise.all(
    tiles.map(async ({ label, handle }) => {
      const href = `/collections/${handle}`;
      try {
        const { collection } = await getCollectionByHandle(handle, 1);
        if (!collection) {
          return { label, href, imageUrl: null as string | null, alt: label };
        }
        const first = collection.products.edges[0]?.node;
        if (collection.image?.url) {
          return {
            label,
            href,
            imageUrl: collection.image.url,
            alt: collection.image.altText ?? label,
          };
        }
        if (first?.featuredImage?.url) {
          return {
            label,
            href,
            imageUrl: first.featuredImage.url,
            alt: first.featuredImage.altText ?? label,
          };
        }
        return { label, href, imageUrl: null, alt: label };
      } catch {
        return { label, href, imageUrl: null, alt: label };
      }
    })
  );

  const lifestyle = pickLifestyleImages(heroProducts, 3);
  const aria = `${def.title} categories`;

  return (
    <section className="mb-10 space-y-8" aria-label={aria}>
      <div className="relative -mx-1">
        <div className="flex gap-3 md:gap-4 overflow-x-auto pb-3 snap-x snap-mandatory [-webkit-overflow-scrolling:touch] [scrollbar-width:thin]">
          {previews.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className="snap-start shrink-0 w-[132px] sm:w-[150px] md:w-[168px] group text-center"
            >
              <div className="relative aspect-square rounded-lg overflow-hidden bg-[#f0f0f0] border border-[#e8e8e8]">
                {item.imageUrl ? (
                  <Image
                    src={item.imageUrl}
                    alt={item.alt}
                    fill
                    className="object-cover group-hover:opacity-95 transition-opacity"
                    sizes="(max-width: 640px) 132px, 168px"
                  />
                ) : (
                  <span className="absolute inset-0 flex items-center justify-center text-xs text-[var(--ubee-gray)] px-2 leading-tight">
                    {item.label}
                  </span>
                )}
              </div>
              <span className="mt-2 block text-xs md:text-sm font-medium text-[var(--ubee-black)] group-hover:underline underline-offset-2">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>

      <header>
        <h1 className="text-3xl md:text-4xl font-bold text-[var(--ubee-black)] tracking-tight">
          {def.title}
        </h1>
        <p className="mt-4 text-[var(--ubee-gray)] max-w-3xl text-base md:text-lg leading-relaxed">
          {def.intro}
        </p>
      </header>

      {lifestyle.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4">
          {lifestyle.map((img) => (
            <div
              key={img.url}
              className="relative aspect-[4/3] rounded-lg overflow-hidden bg-[#f0f0f0]"
            >
              <Image
                src={img.url}
                alt={img.alt}
                fill
                className="object-cover"
                sizes="(max-width: 640px) 100vw, 33vw"
              />
            </div>
          ))}
        </div>
      ) : null}
    </section>
  );
}
