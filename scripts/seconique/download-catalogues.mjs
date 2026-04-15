#!/usr/bin/env node
/**
 * Download public catalogue PDFs linked from Seconique "Downloads" page.
 * See: https://seconique.co.uk/downloads
 *
 * Usage:
 *   node scripts/seconique/download-catalogues.mjs
 *   node scripts/seconique/download-catalogues.mjs --out-dir=data/seconique/catalogues
 */

import fs from "fs";
import path from "path";

const DOWNLOADS_PAGE = "https://seconique.co.uk/downloads";
const UA = "Mozilla/5.0 (compatible; UbeeCatalogBot/1.0)";

function arg(name, def) {
  const p = process.argv.find((a) => a.startsWith(`--${name}=`));
  if (!p) return def;
  return p.split("=", 2)[1] ?? def;
}

async function main() {
  const outDir = path.resolve(process.cwd(), arg("out-dir", path.join("data", "seconique", "catalogues")));
  fs.mkdirSync(outDir, { recursive: true });

  const res = await fetch(DOWNLOADS_PAGE, { headers: { "User-Agent": UA } });
  if (!res.ok) throw new Error(`HTTP ${res.status} ${DOWNLOADS_PAGE}`);
  const html = await res.text();
  const hrefs = [...html.matchAll(/href="(https:\/\/seconique\.co\.uk\/amfile\/file\/download\/file\/\d+)"/gi)].map(
    (m) => m[1]
  );
  const urls = [...new Set(hrefs)];
  if (!urls.length) {
    console.error("[seconique] No amfile download links found; using known catalogue IDs.");
    urls.push(
      "https://seconique.co.uk/amfile/file/download/file/3",
      "https://seconique.co.uk/amfile/file/download/file/5"
    );
  }

  for (const url of urls) {
    const id = url.match(/file\/(\d+)/)?.[1] || "file";
    const dest = path.join(outDir, `seconique-catalogue-${id}.pdf`);
    console.error(`[seconique] GET ${url}`);
    const r = await fetch(url, { headers: { "User-Agent": UA } });
    if (!r.ok) throw new Error(`HTTP ${r.status} ${url}`);
    const buf = Buffer.from(await r.arrayBuffer());
    fs.writeFileSync(dest, buf);
    console.error(`[seconique] Wrote ${dest} (${buf.length} bytes)`);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
