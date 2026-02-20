import { notFound } from 'next/navigation';
import BrandedCatalogueView from '@/src/components/catalogue/BrandedCatalogueView';
import { getAgentCatalogueBySlug, getCatalogueProductsPublic } from '@/src/lib/agent/server';

export const dynamic = 'force-dynamic';

export default async function PublicAgentCataloguePage({
  params,
}: {
  params: { slug: string };
}) {
  const slug = params.slug;
  const catalogue = await getAgentCatalogueBySlug(slug);

  if (!catalogue || !catalogue.agent) {
    notFound();
  }

  const products = await getCatalogueProductsPublic();

  return (
    <main className="min-h-screen bg-zinc-50 py-8">
      <BrandedCatalogueView
        catalogueSlug={catalogue.slug}
        catalogueTitle={catalogue.title}
        agencyName={catalogue.agent.agencyName}
        agentName={catalogue.agent.name}
        logoUrl={catalogue.agent.brandingLogoUrl}
        primaryColor={catalogue.agent.brandingPrimaryColor}
        products={products}
      />
    </main>
  );
}

