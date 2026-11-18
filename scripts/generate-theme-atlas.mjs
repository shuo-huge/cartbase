#!/usr/bin/env node
/**
 * Regenerates the 4x2 theme preview atlas.
 *
 * Prefers real storefront screenshots captured by `pnpm screenshots` in
 * test-results/theme-previews/ and falls back to the committed theme SVGs.
 *
 * Usage: pnpm theme:atlas
 */
import fs from "node:fs";
import path from "node:path";
import { chromium } from "@playwright/test";

const root = path.resolve(import.meta.dirname, "..");
const themeDir = path.join(root, "apps", "storefront", "public", "themes");
const photoDir = path.join(root, "test-results", "theme-previews");
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
  const photo = path.join(photoDir, `${theme}.jpg`);
  const svg = path.join(themeDir, `${theme}.svg`);
  if (!fs.existsSync(photo) && !fs.existsSync(svg)) {
    console.error(`Missing theme preview for ${theme}: ${photo} or ${svg}`);
    process.exit(1);
  }
}

const cells = themes
  .map((theme) => {
    const photo = path.join(photoDir, `${theme}.jpg`);
    if (fs.existsSync(photo)) {
      const data = fs.readFileSync(photo).toString("base64");
      return `<div class="cell"><img class="photo" src="data:image/jpeg;base64,${data}" alt=""></div>`;
    }
    const svg = fs.readFileSync(path.join(themeDir, `${theme}.svg`));
    const data = svg.toString("base64");
    return `<div class="cell"><img class="art" src="data:image/svg+xml;base64,${data}" alt=""></div>`;
  })
  .join("");

const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html, body { margin: 0; padding: 0; width: 1920px; height: 720px; background: #fff; }
  .grid { display: grid; grid-template-columns: repeat(4, 480px); grid-template-rows: repeat(2, 360px); }
  .cell { width: 480px; height: 360px; overflow: hidden; background: #f7f5f1; }
  .cell img { display: block; width: 480px; height: 360px; object-fit: cover; }
</style></head><body><div class="grid">${cells}</div></body></html>`;

const browser = await chromium.launch();
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 720 }, deviceScaleFactor: 1 });
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
