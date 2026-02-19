import { getCollections } from '@/lib/shopify';
import { SiteHeader } from './SiteHeader';

export async function SiteHeaderWrapper() {
  let collections: Array<{ handle: string; title: string }> = [];
  try {
    const { collections: data } = await getCollections(20);
    collections = data.edges
      .map((e) => ({ handle: e.node.handle, title: e.node.title }))
      .filter((c) => c.handle !== 'frontpage');
  } catch (err) {
    console.warn('Could not load collections for header:', err);
  }
  return <SiteHeader collections={collections} />;
}
