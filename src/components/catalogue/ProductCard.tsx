import Image from 'next/image';

type PublicProduct = {
  id: string;
  title: string;
  benefitLine: string;
  image?: { url: string; altText: string | null } | null;
};

type Props = {
  product: PublicProduct;
  accentColor: string;
  onRequestQuote: (productTitle: string) => void;
};

export default function ProductCard({ product, accentColor, onRequestQuote }: Props) {
  return (
    <article className="print-card rounded-xl border border-zinc-200 bg-white p-4">
      <div className="relative mb-3 aspect-[4/3] overflow-hidden rounded-lg bg-zinc-100">
        {product.image?.url ? (
          <Image
            src={product.image.url}
            alt={product.image.altText || product.title}
            fill
            className="object-cover"
            sizes="(min-width: 1024px) 33vw, 100vw"
          />
        ) : null}
      </div>
      <h2 className="text-base font-semibold text-zinc-900">{product.title}</h2>
      <p className="mt-1 text-sm text-zinc-600">{product.benefitLine}</p>
      <button
        type="button"
        onClick={() => onRequestQuote(product.title)}
        className="mt-3 inline-block rounded-lg px-3 py-2 text-sm font-semibold text-zinc-900"
        style={{ backgroundColor: accentColor }}
      >
        Request Quote Through Your Agent
      </button>
    </article>
  );
}

