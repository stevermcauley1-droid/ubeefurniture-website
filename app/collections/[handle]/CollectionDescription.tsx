/**
 * Shopify collection descriptions are often HTML (from descriptionHtml).
 * Render as markup when it looks like HTML; otherwise plain text in a paragraph.
 */
export function CollectionDescription({ text }: { text: string }) {
  const trimmed = text.trim();
  if (!trimmed) return null;
  const looksLikeHtml = /<[a-z][\s\S]*>/i.test(trimmed);
  if (looksLikeHtml) {
    return (
      <div
        className="mt-2 text-[var(--ubee-gray)] max-w-3xl text-base leading-relaxed [&_a]:text-[var(--ubee-black)] [&_a]:underline [&_p]:mb-3 [&_ul]:list-disc [&_ul]:pl-5 [&_ol]:list-decimal [&_ol]:pl-5"
        dangerouslySetInnerHTML={{ __html: trimmed }}
      />
    );
  }
  return (
    <p className="mt-2 text-[var(--ubee-gray)] max-w-3xl leading-relaxed">{trimmed}</p>
  );
}
