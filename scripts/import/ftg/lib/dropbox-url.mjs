/**
 * Normalize Dropbox shared links so Shopify Admin can fetch images reliably.
 * Prefer ?raw=1; remove dl=0 which serves HTML instead of the file.
 */
export function normalizeDropboxImageUrl(url) {
  if (!url || typeof url !== "string") return url;
  const u = url.trim();
  if (!/^https?:\/\//i.test(u)) return u;
  try {
    const parsed = new URL(u);
    const host = parsed.hostname.toLowerCase();
    if (!host.includes("dropbox.")) return u;
    const sp = parsed.searchParams;
    if (sp.get("dl") === "0") sp.delete("dl");
    if (!sp.has("raw")) sp.set("raw", "1");
    return parsed.toString();
  } catch {
    return u;
  }
}
