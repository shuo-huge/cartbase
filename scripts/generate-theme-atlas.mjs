#!/usr/bin/env node
/**
 * Regenerates the 4x2 theme preview atlas from the committed theme SVGs.
 * The atlas is the preview image for every bundled theme; rebuilding it keeps
 * the visible wordmark in sync with the brand without hand-editing a WebP.
 *
 * Usage: pnpm theme:atlas
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const themeDir = path.join(root, "apps", "storefront", "public", "themes");
const output = path.join(themeDir, "theme-previews-atlas.webp");
const themes = [
  "default",
  "beauty",
  "electronics",
  "fashion",
  "home",
  "jewelry",
  "single-product",
  "sports",
];

for (const theme of themes) {
  const file = path.join(themeDir, `${theme}.svg`);
  if (!fs.existsSync(file)) {
    console.error(`Missing theme preview: ${file}`);
    process.exit(1);
  }
}

const cells = themes
  .map((theme) => {
    const svg = fs.readFileSync(path.join(themeDir, `${theme}.svg`));
    const url = `data:image/svg+xml;base64,${svg.toString("base64")}`;
    return `<div class="cell"><img src="${url}" alt=""></div>`;
  })
  .join("");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; width: 720px; height: 392px; background: #fff; }
  .grid { display: grid; grid-template-columns: repeat(4, 180px); grid-template-rows: repeat(2, 196px); }
  .cell { width: 180px; height: 196px; overflow: hidden; background: #f7f5f1; }
  .cell img { display: block; width: 180px; height: 196px; object-fit: fill; }
</style></head><body><div class="grid">${cells}</div></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 720, height: 392 }, deviceScaleFactor: 1 });
  await page.setContent(html, { waitUntil: "load" });
  await page.evaluate(() => Promise.all(
    Array.from(document.images).map((image) => (image.complete ? undefined : new Promise((resolve) => {
      image.addEventListener("load", resolve, { once: true });
      image.addEventListener("error", resolve, { once: true });
    }))),
  ));
  await page.screenshot({ path: output, type: "webp", quality: 88, animations: "disabled" });
  console.log(`[theme-atlas] ${path.relative(root, output)}`);
} finally {
  await browser.close();
}
