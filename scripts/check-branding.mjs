#!/usr/bin/env node
/**
 * Fails when the old product name reappears outside a small set of
 * intentionally preserved, data-compatibility values.
 *
 * The old token is assembled at runtime so this file never matches itself.
 */
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";

const root = path.resolve(import.meta.dirname, "..");
const OLD = "cloud" + "cart";

const skipExtensions = new Set([
  ".png", ".jpg", ".jpeg", ".ico", ".webp", ".gif", ".avif",
  ".woff", ".woff2", ".ttf", ".otf", ".sqlite", ".db", ".zip", ".pdf",
]);

const allowed = [
  "cloudcart-master-salt-v1",
  "cloudcart:aes-gcm:v1",
  "cloudcart:hmac:v1",
  "cloudcart:order-access:v1",
  "cloudcart-shuo-preview",
];

const expected = {
  "packages/security/src/crypto.ts": [
    "cloudcart-master-salt-v1",
    "cloudcart:aes-gcm:v1",
    "cloudcart:hmac:v1",
  ],
  "packages/core/src/orders.ts": ["cloudcart:order-access:v1"],
  "packages/shared/src/ids.ts": ["CB-"],
  "apps/worker/src/lib.ts": ["cb_session", "cb_csrf"],
  "packages/core/src/cart.ts": ["cb_cart"],
  "packages/core/src/api-keys.ts": ["cbk_"],
  "packages/security/src/plugin-jwt.ts": ["cartbase:plugin-jwt:v1"],
  "packages/plugin-sdk/src/remote.ts": ["cartbase:plugin-jwt:v1"],
};

const failures = [];

function sanitize(relative, source) {
  let value = source;
  for (const literal of allowed) value = value.split(literal).join("");
  if (relative === "wrangler.jsonc") {
    value = value.replace(/"database_name"\s*:\s*"[^"]*"/g, "");
  }
  if (relative === ".gitignore") {
    value = value.split(`.${OLD}/`).join("");
  }
  if (relative === "CHANGELOG.md") {
    // The changelog records the historical rename by name.
    value = value.split("CloudCart").join("");
  }
  return value;
}

const files = execFileSync("git", ["ls-files", "-z"], { cwd: root, encoding: "utf8" })
  .split("\0")
  .filter(Boolean);

for (const relative of files) {
  if (relative === "scripts/check-branding.mjs") continue;
  if (skipExtensions.has(path.extname(relative).toLowerCase())) continue;
  const absolute = path.join(root, relative);
  let source;
  try {
    source = fs.readFileSync(absolute, "utf8");
  } catch {
    continue;
  }
  if (source.includes("\0")) continue;
  const cleaned = sanitize(relative, source);
  cleaned.split(/\r?\n/).forEach((line, index) => {
    if (line.toLowerCase().includes(OLD)) {
      failures.push(`${relative}:${index + 1}: ${line.trim()}`);
    }
  });
}

for (const [relative, needles] of Object.entries(expected)) {
  const source = fs.readFileSync(path.join(root, relative), "utf8");
  for (const needle of needles) {
    if (!source.includes(needle)) {
      failures.push(`${relative}: missing required compatibility token ${needle}`);
    }
  }
}

const apiKeys = fs.readFileSync(path.join(root, "packages/core/src/api-keys.ts"), "utf8");
if (apiKeys.includes("cck_")) failures.push("packages/core/src/api-keys.ts: legacy API key prefix is still accepted");

const wrangler = fs.readFileSync(path.join(root, "wrangler.jsonc"), "utf8");
if (!/"database_id"\s*:\s*"3ee15198-1fe3-44e3-a20d-b4822f7065cc"/.test(wrangler)) {
  failures.push("wrangler.jsonc: the legacy D1 database_id changed");
}

if (failures.length > 0) {
  console.error(`Branding check failed (${failures.length}):`);
  for (const failure of failures) console.error(`  ${failure}`);
  process.exit(1);
}

console.log(`Branding check passed: no ${OLD} outside the compatibility allowlist.`);
