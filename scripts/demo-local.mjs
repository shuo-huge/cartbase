#!/usr/bin/env node
/**
 * One-command local CartBase demo.
 *
 * Builds the app, creates an isolated local D1 database, applies migrations,
 * starts Wrangler, creates the demo administrator, and seeds the demo catalog.
 * The server keeps running until you press Ctrl+C.
 *
 * Usage:
 *   pnpm demo
 *   pnpm demo --reset
 *   pnpm demo --port 8787 --no-build
 */
import fs from "node:fs";
import net from "node:net";
import path from "node:path";
import process from "node:process";
import { spawn, spawnSync } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] ?? null;
};

const port = Number(value("port") || process.env.DEMO_PORT || 8787);
const host = "127.0.0.1";
const baseUrl = `http://${host}:${port}`;
const persistTo = path.join(root, ".wrangler", "demo-local");
const devVarsPath = path.join(root, ".dev.vars");
const email = value("email") || "demo@cartbase.local";
const password = value("password") || "demo-password-123";
const reset = flag("reset");
const skipBuild = flag("no-build");
const skipSeed = flag("no-seed");

function fail(message) {
  console.error(`\n✖ ${message}\n`);
  process.exit(1);
}

function parseEnvFile(file) {
  const values = new Map();
  if (!fs.existsSync(file)) return values;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const match = line.match(/^\s*([A-Z][A-Z0-9_]*)\s*=\s*(.*?)\s*$/);
    if (match) values.set(match[1], match[2].replace(/^["']|["']$/g, ""));
  }
  return values;
}

function runSync(command, commandArgs, options = {}) {
  const result = spawnSync(command, commandArgs, {
    cwd: root,
    stdio: "inherit",
    shell: process.platform === "win32",
    env: { ...process.env, ...options.env },
  });
  if (result.status !== 0) fail(`${command} ${commandArgs.join(" ")} failed.`);
}

function assertPortFree(targetPort) {
  return new Promise((resolve, reject) => {
    const socket = net.createConnection({ host, port: targetPort });
    socket.setTimeout(1000);
    socket.on("connect", () => {
      socket.destroy();
      reject(new Error(`Port ${targetPort} is already in use. Stop the other process or pass --port.`));
    });
    socket.on("timeout", () => {
      socket.destroy();
      resolve();
    });
    socket.on("error", () => {
      socket.destroy();
      resolve();
    });
  });
}

async function waitFor(url, timeoutMs = 20_000) {
  const deadline = Date.now() + timeoutMs;
  while (Date.now() < deadline) {
    try {
      const response = await fetch(url);
      if (response.ok) return;
    } catch {
      // Retry until Wrangler accepts connections.
    }
    await new Promise((resolve) => setTimeout(resolve, 250));
  }
  throw new Error(`Timed out waiting for ${url}`);
}

async function main() {
  await assertPortFree(port);

  if (!skipBuild) {
    console.log("▸ Building the storefront and admin UI");
    runSync("pnpm", ["run", "build"]);
  }

  if (!fs.existsSync(devVarsPath)) {
    console.log("▸ Creating local Worker secrets in .dev.vars");
    runSync(process.execPath, [path.join(root, "scripts", "dev-secrets.mjs")]);
  }
  const secrets = parseEnvFile(devVarsPath);
  if (!secrets.get("APP_MASTER_KEY") || !secrets.get("SETUP_TOKEN")) {
    console.log("▸ Completing local Worker secrets in .dev.vars");
    runSync(process.execPath, [path.join(root, "scripts", "dev-secrets.mjs")]);
  }
  const workerSecrets = parseEnvFile(devVarsPath);

  if (reset) {
    console.log("▸ Resetting the local demo database");
    fs.rmSync(persistTo, { recursive: true, force: true });
  }
  fs.mkdirSync(persistTo, { recursive: true });

  console.log("▸ Applying local D1 migrations");
  runSync("pnpm", ["exec", "wrangler", "d1", "migrations", "apply", "DB", "--local", "--persist-to", persistTo], {
    env: { CI: "1" },
  });

  console.log("▸ Starting Wrangler");
  const child = spawn(
    "pnpm",
    ["exec", "wrangler", "dev", "--port", String(port), "--ip", host, "--persist-to", persistTo],
    { cwd: root, stdio: "inherit", shell: process.platform === "win32", env: { ...process.env, CI: "1" } },
  );

  const stop = () => {
    if (!child.killed) child.kill();
    process.exit(0);
  };
  process.on("SIGINT", stop);
  process.on("SIGTERM", stop);
  child.on("exit", (code) => process.exit(code ?? 0));

  await waitFor(`${baseUrl}/api/health`);

  const status = await fetch(`${baseUrl}/api/setup/status`).then((response) => response.json());
  if (!status.installed) {
    const setupToken = workerSecrets.get("SETUP_TOKEN");
    const response = await fetch(`${baseUrl}/api/admin/setup`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        setupToken,
        email,
        password,
        name: "Demo Admin",
        storeName: "CartBase Demo",
        currency: "USD",
      }),
    });
    if (!response.ok) {
      const text = await response.text();
      throw new Error(`Creating the demo administrator failed: ${response.status} ${text.slice(0, 300)}`);
    }
    console.log("▸ Created the demo administrator");
  } else {
    const response = await fetch(`${baseUrl}/api/admin/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      throw new Error(
        `This demo database is already installed, but ${email} could not sign in. ` +
        "Pass --email/--password for the existing administrator, or run with --reset to start over.",
      );
    }
    console.log("▸ Reusing the existing demo administrator");
  }

  if (!skipSeed) {
    console.log("▸ Seeding demo categories, products, pages, and orders");
    const seed = spawnSync(
      process.execPath,
      [path.join(root, "scripts", "seed-demo.mjs"), "--yes"],
      {
        cwd: root,
        stdio: "inherit",
        env: {
          ...process.env,
          CARTBASE_URL: baseUrl,
          CARTBASE_ADMIN_EMAIL: email,
          CARTBASE_ADMIN_PASSWORD: password,
        },
      },
    );
    if (seed.status !== 0) {
      console.warn("\n⚠ Demo data could not be seeded. The store is still running; fix the error above and run `pnpm demo:seed --yes` again.\n");
    }
  }

  console.log("\n============================================================");
  console.log("  CartBase demo is running");
  console.log("");
  console.log(`  Storefront:  ${baseUrl}/`);
  console.log(`  Admin:       ${baseUrl}/admin`);
  console.log(`  Email:       ${email}`);
  console.log(`  Password:    ${password}`);
  console.log("");
  console.log("  Press Ctrl+C to stop. Run with --reset for a clean database.");
  console.log("============================================================\n");
}

main().catch((error) => fail(error instanceof Error ? error.message : String(error)));
