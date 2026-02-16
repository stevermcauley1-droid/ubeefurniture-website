import { getCollections } from '@/lib/shopify';
import { MegaMenu } from './MegaMenu';

/**
 * Server component wrapper that fetches real collections and passes them to MegaMenu.
 * This ensures navigation always shows real Shopify collections, not hardcoded handles.
 */
export async function MegaMenuWrapper() {
  let collections: Array<{ handle: string; title: string }> = [];
  
  try {
    const { collections: collectionsData } = await getCollections(10);
    // Filter out frontpage collection (it's a special Shopify collection)
    collections = collectionsData.edges
      .map((e) => ({
        handle: e.node.handle,
        title: e.node.title,
      }))
      .filter((c) => c.handle !== 'frontpage');
  } catch (err) {
    // If collections fail to load, navigation will show "All collections" link only
    console.warn('Could not load collections for navigation:', err);
  }

  return <MegaMenu collections={collections} />;
}
