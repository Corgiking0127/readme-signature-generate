#!/usr/bin/env node
/**
 * Download all Google Fonts used by the signature generator.
 *
 * Downloads both woff2 (for SVG @font-face base64 embedding) and
 * TTF (for Resvg server-side PNG rendering — fontdb doesn't support woff2).
 *
 * Usage:  node scripts/download-fonts.js
 * Output: fonts/<key>.woff2  and  fonts/<key>.ttf  for each font style.
 */

const https = require("https");
const fs = require("fs");
const path = require("path");

const FONTS = {
  elegant:     { family:"Dancing Script",      weight:"700",    url:"https://fonts.googleapis.com/css2?family=Dancing+Script:wght@700&display=swap" },
  classic:     { family:"Great Vibes",         weight:"normal", url:"https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap" },
  modern:      { family:"Parisienne",          weight:"normal", url:"https://fonts.googleapis.com/css2?family=Parisienne&display=swap" },
  bold:        { family:"Sacramento",          weight:"normal", url:"https://fonts.googleapis.com/css2?family=Sacramento&display=swap" },
  refined:     { family:"Allura",              weight:"normal", url:"https://fonts.googleapis.com/css2?family=Allura&display=swap" },
  light:       { family:"Alex Brush",          weight:"normal", url:"https://fonts.googleapis.com/css2?family=Alex+Brush&display=swap" },
  serif:       { family:"Mrs Saint Delafield", weight:"normal", url:"https://fonts.googleapis.com/css2?family=Mrs+Saint+Delafield&display=swap" },
  baskerville: { family:"Zeyada",              weight:"normal", url:"https://fonts.googleapis.com/css2?family=Zeyada&display=swap" },
};

const CHROME_UA = "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36";
const OLD_UA = "Mozilla/4.0";

function get(url, ua) {
  return new Promise((resolve, reject) => {
    const go = (u) => {
      https.get(u, { headers: { "User-Agent": ua } }, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          go(res.headers.location);
          return;
        }
        const chunks = [];
        res.on("data", (d) => chunks.push(d));
        res.on("end", () =>
          resolve({ ok: res.statusCode === 200, buf: Buffer.concat(chunks) })
        );
      }).on("error", reject);
    };
    go(url);
  });
}

async function downloadAll() {
  const fontsDir = path.join(__dirname, "..", "fonts");
  if (!fs.existsSync(fontsDir)) fs.mkdirSync(fontsDir);

  for (const [key, font] of Object.entries(FONTS)) {
    console.log(`Downloading ${key} (${font.family})…`);

    // ── woff2 (for SVG base64 embedding in browsers / GitHub) ──
    try {
      const css = await get(font.url, CHROME_UA);
      if (!css.ok) throw new Error("CSS fetch failed");
      const woff2Urls = [
        ...css.buf
          .toString()
          .matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.woff2)\)/g),
      ];
      if (!woff2Urls.length) throw new Error("No woff2 URL found in CSS");
      // Use last match (Latin subset, covers most signatures)
      const woff2 = await get(woff2Urls[woff2Urls.length - 1][1], CHROME_UA);
      if (!woff2.ok) throw new Error("woff2 download failed");
      fs.writeFileSync(path.join(fontsDir, `${key}.woff2`), woff2.buf);
      console.log(`  ✓ ${key}.woff2  (${woff2.buf.length} bytes)`);
    } catch (e) {
      console.log(`  ✗ woff2 failed: ${e.message}`);
    }

    // ── TTF (for Resvg rendering — fontdb needs TTF/OTF) ──
    try {
      const css = await get(font.url, OLD_UA);
      if (!css.ok) throw new Error("CSS fetch failed");
      const ttfUrls = [
        ...css.buf
          .toString()
          .matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+\.ttf)\)/g),
      ];
      if (!ttfUrls.length) throw new Error("No TTF URL found in CSS");
      const ttf = await get(ttfUrls[ttfUrls.length - 1][1], OLD_UA);
      if (!ttf.ok) throw new Error("TTF download failed");
      fs.writeFileSync(path.join(fontsDir, `${key}.ttf`), ttf.buf);
      console.log(`  ✓ ${key}.ttf   (${ttf.buf.length} bytes)`);
    } catch (e) {
      console.log(`  ✗ TTF failed: ${e.message}`);
    }
  }

  console.log("\nDone! Font files saved to fonts/ directory.");
  console.log("Commit them to the repo so the Vercel deployment includes them.");
}

downloadAll().catch((e) => {
  console.error("Fatal error:", e);
  process.exit(1);
});
