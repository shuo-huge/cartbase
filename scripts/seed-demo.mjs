#!/usr/bin/env node
/**
 * Seed a CartBase store with demo content through the admin API.
 *
 * Intended for a fresh demo store. It never deletes existing data; when the
 * store already contains products it requires --yes and only adds missing
 * categories, products, orders, and the home page.
 *
 * Usage:
 *   CARTBASE_URL=https://demo.example.com \
 *   CARTBASE_ADMIN_EMAIL=owner@example.com \
 *   CARTBASE_ADMIN_PASSWORD=secret \
 *   pnpm demo:seed
 *
 * Options:
 *   --url <url>            Store URL (or CARTBASE_URL)
 *   --email <email>        Admin email (or CARTBASE_ADMIN_EMAIL)
 *   --password <pass>      Admin password (or CARTBASE_ADMIN_PASSWORD)
 *   --store-name <name>    Demo store name (fresh stores only)
 *   --currency <code>      Store currency (fresh stores only, default USD)
 *   --no-orders            Skip demo orders
 *   --yes                  Allow adding content to a store that already has products
 *   --dry-run              Print the plan without changing anything
 */
import process from "node:process";

const args = process.argv.slice(2);
const flag = (name) => args.includes(`--${name}`);
const value = (name) => {
  const index = args.indexOf(`--${name}`);
  return index === -1 ? null : args[index + 1] ?? null;
};

const baseUrl = (value("url") || process.env.CARTBASE_URL || "").replace(/\/+$/, "");
const email = value("email") || process.env.CARTBASE_ADMIN_EMAIL || "";
const password = value("password") || process.env.CARTBASE_ADMIN_PASSWORD || "";
const storeName = value("store-name") || "Lumen & Co.";
const currency = (value("currency") || "USD").toUpperCase();
const dryRun = flag("dry-run");
const assumeYes = flag("yes");
const withOrders = !flag("no-orders");

if (!baseUrl || !email || !password) {
  console.error(
    "Usage: CARTBASE_URL=https://store.example.com CARTBASE_ADMIN_EMAIL=... CARTBASE_ADMIN_PASSWORD=... pnpm demo:seed",
  );
  process.exit(1);
}
if (!/^https?:\/\//.test(baseUrl)) {
  console.error("CARTBASE_URL must start with http:// or https://");
  process.exit(1);
}
if (currency.length !== 3) {
  console.error("--currency must be a three-letter code such as USD or CNY");
  process.exit(1);
}

const log = (message) => process.stdout.write(`${message}\n`);
const warn = (message) => process.stderr.write(`warning: ${message}\n`);

class Session {
  constructor(name) {
    this.name = name;
    this.cookies = new Map();
    this.csrf = null;
  }

  cookieHeader() {
    return [...this.cookies.entries()].map(([key, entry]) => `${key}=${entry}`).join("; ");
  }

  storeCookies(response) {
    const headers = typeof response.headers.getSetCookie === "function"
      ? response.headers.getSetCookie()
      : [response.headers.get("set-cookie")].filter(Boolean);
    for (const header of headers) {
      const pair = header.split(";", 1)[0];
      const separator = pair.indexOf("=");
      if (separator > 0) {
        this.cookies.set(pair.slice(0, separator).trim(), pair.slice(separator + 1).trim());
      }
    }
  }

  async request(method, path, options = {}) {
    const headers = { Accept: options.accept ?? "application/json", "User-Agent": "CartBaseDemoSeed/1.0" };
    if (this.cookies.size > 0) headers.Cookie = this.cookieHeader();
    if (this.csrf && options.csrf !== false) headers["X-CSRF-Token"] = this.csrf;
    let body;
    if (options.json !== undefined) {
      headers["Content-Type"] = "application/json";
      body = JSON.stringify(options.json);
    } else if (options.form !== undefined) {
      headers["Content-Type"] = "application/x-www-form-urlencoded";
      body = new URLSearchParams(options.form).toString();
    }
    const response = await fetch(`${baseUrl}${path}`, {
      method,
      headers,
      body,
      redirect: options.redirect ?? "follow",
    });
    this.storeCookies(response);
    const text = await response.text();
    let data = null;
    if ((options.accept ?? "application/json") === "application/json") {
      try {
        data = text ? JSON.parse(text) : null;
      } catch {
        data = null;
      }
    }
    if (!response.ok && !options.allowError) {
      const message = data?.error?.message ?? text.slice(0, 300) ?? response.statusText;
      throw new Error(`${this.name}: ${method} ${path} -> ${response.status} ${message}`);
    }
    return { response, status: response.status, data, text };
  }

  async json(method, path, options = {}) {
    const result = await this.request(method, path, options);
    if (!result.data || result.data.ok !== true) {
      throw new Error(`${this.name}: ${method} ${path} returned an unexpected payload`);
    }
    return result.data.data;
  }

  async login() {
    const result = await this.request("POST", "/api/admin/login", {
      json: { email, password },
      csrf: false,
      allowError: true,
    });
    if (!result.response.ok) {
      throw new Error(`Login failed: ${result.data?.error?.message ?? result.status}`);
    }
    this.csrf = result.data?.csrfToken ?? null;
    if (!this.csrf) throw new Error("Login succeeded but no CSRF token was returned.");
    log(`Signed in as ${result.data.admin?.email ?? email}`);
  }
}

const admin = new Session("admin");
await admin.login();

const settings = await admin.json("GET", "/api/admin/settings");
const existingProducts = await admin.json("GET", "/api/admin/products?perPage=1");
const productTotal = Number(existingProducts.total) || 0;
const freshStore = productTotal === 0;

if (!freshStore && !assumeYes && !dryRun) {
  throw new Error(
    `The store already has ${productTotal} product(s). Re-run with --yes to add missing demo content without deleting anything.`,
  );
}

const categories = await admin.json("GET", "/api/admin/categories");
const categoryByName = new Map(categories.map((category) => [category.name.toLowerCase(), category]));
const productList = await admin.json("GET", "/api/admin/products?perPage=100");
const productBySlug = new Map(productList.items.map((product) => [product.slug, product]));

const DEMO_CATEGORIES = ["Bags", "Lighting", "Home Goods", "Accessories"];

const DEMO_PRODUCTS = [
  {
    name: "Ridge Canvas Tote",
    slug: "ridge-canvas-tote",
    description: "Waxed 18 oz canvas, vegetable-tanned leather handles, and an interior zip pocket. Built to carry the week.",
    price: "58.00",
    stock: 24,
    category: "Bags",
    featured: true,
    seeds: ["tote-1", "tote-2", "tote-3"],
  },
  {
    name: "Halo Table Lamp",
    slug: "halo-table-lamp",
    description: "A warm, dimmable pool of light in a hand-finished stoneware base with a linen shade.",
    price: "129.00",
    compareAtPrice: "149.00",
    stock: 12,
    category: "Lighting",
    featured: true,
    seeds: ["lamp-1", "lamp-2"],
  },
  {
    name: "Linen Throw 鈥?Oat",
    slug: "linen-throw-oat",
    description: "Stonewashed European linen with a hand-knotted fringe. Light enough for summer, warm enough for winter.",
    price: "74.00",
    stock: 31,
    category: "Home Goods",
    featured: true,
    seeds: ["throw-1", "throw-2"],
  },
  {
    name: "Arc Ceramic Vase",
    slug: "arc-ceramic-vase",
    description: "Wheel-thrown stoneware in a soft matte glaze. Each piece varies slightly in tone and profile.",
    price: "42.00",
    stock: 18,
    category: "Home Goods",
    featured: true,
    seeds: ["vase-1", "vase-2"],
  },
  {
    name: "Field Notes Journal",
    slug: "field-notes-journal",
    description: "A compact cloth-bound notebook with 160 pages of fountain-pen-friendly paper and a lay-flat spine.",
    price: "18.00",
    stock: 64,
    category: "Accessories",
    featured: false,
    seeds: ["journal-1", "journal-2"],
  },
  {
    name: "Studio Apron",
    slug: "studio-apron",
    description: "Heavy cotton twill with cross-back straps, deep pockets, and a reinforced hem for daily work.",
    price: "64.00",
    stock: 15,
    category: "Bags",
    featured: false,
    seeds: ["apron-1", "apron-2"],
  },
  {
    name: "Cedar Serving Board",
    slug: "cedar-serving-board",
    description: "Hand-oiled cedar with a soft chamfer and a hanging hole. For bread, cheese, and everything between.",
    price: "48.00",
    stock: 22,
    category: "Home Goods",
    featured: true,
    seeds: ["board-1", "board-2"],
  },
  {
    name: "Brass Reading Sconce",
    slug: "brass-reading-sconce",
    description: "An adjustable brass arm with a warm LED bulb and a fabric cord. Made for the chair by the window.",
    price: "89.00",
    stock: 9,
    category: "Lighting",
    featured: false,
    seeds: ["sconce-1", "sconce-2"],
  },
];

const planned = {
  categories: DEMO_CATEGORIES.filter((name) => !categoryByName.has(name.toLowerCase())),
  products: DEMO_PRODUCTS.filter((product) => !productBySlug.has(product.slug)),
  settings: freshStore,
  homePage: true,
  orders: withOrders,
};

log(`Store: ${baseUrl}`);
log(`Existing products: ${productTotal}${freshStore ? " (fresh store)" : ""}`);
log(`Plan: ${planned.categories.length} categories, ${planned.products.length} products, home page${withOrders ? ", demo orders" : ""}`);

if (dryRun) {
  log("Dry run: no changes were made.");
  process.exit(0);
}

/* Settings ---------------------------------------------------------------- */

if (freshStore) {
  await admin.json("PUT", "/api/admin/settings", {
    json: {
      settings: {
        "store.name": storeName,
        "store.currency": currency,
        "store.email": "hello@example.com",
        "store.phone": "+1 415 555 0142",
        "store.address": "48 Clement Street, San Francisco, CA 94118",
        "seo.title": `${storeName} 鈥?Everyday objects, considered`,
        "seo.description": "A small collection of useful, quietly made pieces for the home.",
        "tax.default_rate_bps": "825",
        "tax.default_name": "Sales tax",
        "tax.included": "0",
      },
    },
  });
  log("Updated demo store settings");
} else {
  log(`Kept existing settings for ${settings.store?.name ?? "the store"}`);
}

/* Categories -------------------------------------------------------------- */

const categoryIds = new Map();
for (const category of categories) categoryIds.set(category.name.toLowerCase(), category.id);

for (const name of planned.categories) {
  const created = await admin.json("POST", "/api/admin/categories", { json: { name } });
  categoryIds.set(name.toLowerCase(), created.id);
  log(`Created category ${name}`);
}
for (const name of DEMO_CATEGORIES) {
  if (!categoryIds.has(name.toLowerCase())) throw new Error(`Category ${name} is missing after seeding.`);
}

/* Products ---------------------------------------------------------------- */

const productIds = new Map();
for (const product of productList.items) productIds.set(product.slug, product.id);

for (const spec of planned.products) {
  const created = await admin.json("POST", "/api/admin/products", {
    json: {
      name: spec.name,
      slug: spec.slug,
      description: spec.description,
      status: "active",
      type: "simple",
      price: spec.price,
      compareAtPrice: spec.compareAtPrice ?? null,
      sku: spec.slug.toUpperCase().slice(0, 24),
      stock: spec.stock,
      manageStock: true,
      featured: spec.featured,
      seoTitle: spec.name,
      seoDescription: spec.description.slice(0, 160),
      categoryIds: [categoryIds.get(spec.category.toLowerCase())],
      tags: ["demo", "home", "everyday"],
      variants: [],
    },
  });
  productIds.set(spec.slug, created.id);

  for (const seed of spec.seeds) {
    const media = await admin.json("POST", "/api/admin/media/external", {
      json: { url: `https://picsum.photos/seed/${seed}/900/900`, alt: `${spec.name} product photo` },
    });
    await admin.json("POST", `/api/admin/products/${created.id}/images`, {
      json: { mediaId: media.id, alt: spec.name },
    });
  }
  log(`Created product ${spec.name} (${spec.seeds.length} images)`);
}

/* Home page --------------------------------------------------------------- */

await admin.json("PUT", "/api/admin/pages/home/draft", {
  json: {
    document: {
      version: 1,
      page: "home",
      sections: [
        {
          id: "home-announcement",
          type: "announcement-bar",
          enabled: true,
          settings: { text: "Complimentary shipping on orders over $75" },
        },
        {
          id: "home-hero",
          type: "hero",
          enabled: true,
          settings: {
            title: "Everyday objects, considered.",
            subtitle: "A small collection of useful pieces, made to be used rather than stored.",
            image: "https://picsum.photos/seed/hero-1/1600/900",
            imageAlt: "A quiet studio table with ceramics and linen",
            buttonText: "Shop the collection",
            buttonUrl: "/products",
          },
        },
        {
          id: "home-grid",
          type: "product-grid",
          enabled: true,
          settings: { title: "New arrivals", subtitle: "Quietly made for daily life.", source: "featured", limit: 6 },
        },
        {
          id: "home-story",
          type: "image-banner",
          enabled: true,
          settings: {
            title: "Made to be used",
            text: "Small runs, natural materials, and a preference for things that get better with age.",
            image: "https://picsum.photos/seed/story-1/1400/900",
            imageAlt: "Hands working with natural materials",
            buttonText: "Read our story",
            buttonUrl: "/pages/about",
          },
        },
      ],
    },
  },
});
await admin.json("POST", "/api/admin/pages/home/publish", { json: {} });
log("Published the demo home page");

/* Orders ------------------------------------------------------------------ */

if (withOrders && productIds.has("ridge-canvas-tote")) {
  const existingOrders = await admin.json("GET", "/api/admin/orders?perPage=100");
  const existingEmails = new Set(existingOrders.items.map((order) => order.email));
  const orders = [
    {
      slug: "ridge-canvas-tote",
      email: "maya.chen@example.com",
      name: "Maya Chen",
      line1: "18 Linden Street",
      city: "San Francisco",
      state: "CA",
      postalCode: "94102",
      confirm: true,
      ship: false,
    },
    {
      slug: "halo-table-lamp",
      email: "jonas.reed@example.com",
      name: "Jonas Reed",
      line1: "220 Mercer Street",
      city: "New York",
      state: "NY",
      postalCode: "10012",
      confirm: true,
      ship: true,
    },
    {
      slug: "linen-throw-oat",
      email: "priya.nair@example.com",
      name: "Priya Nair",
      line1: "9 Elm Court",
      city: "Austin",
      state: "TX",
      postalCode: "78701",
      confirm: false,
      ship: false,
    },
  ];

  for (const order of orders) {
    if (existingEmails.has(order.email)) {
      log(`Skipped existing order for ${order.email}`);
      continue;
    }
    const productId = productIds.get(order.slug);
    if (!productId) {
      warn(`Product ${order.slug} is missing; skipped order for ${order.email}`);
      continue;
    }

    try {
      const guest = new Session("guest");
      await guest.request("POST", "/api/cart/items", { json: { productId, quantity: 1 } });
      const checkout = await guest.request("POST", "/checkout", {
        form: {
          email: order.email,
          name: order.name,
          phone: "",
          line1: order.line1,
          line2: "",
          city: order.city,
          state: order.state,
          postalCode: order.postalCode,
          country: "US",
          paymentMethod: "manual",
          customerNote: "Demo order",
        },
        accept: "text/html",
        redirect: "manual",
        allowError: true,
      });
      if (checkout.status !== 303 && checkout.status !== 302) {
        throw new Error(`checkout returned ${checkout.status}`);
      }

      const list = await admin.json("GET", `/api/admin/orders?perPage=20&q=${encodeURIComponent(order.email)}`);
      const created = list.items.find((item) => item.email === order.email);
      if (!created) throw new Error("order was created but could not be found through the admin API");

      if (order.confirm) {
        await admin.json("POST", `/api/admin/orders/${created.id}/confirm-payment`, {
          json: { note: "Demo payment received" },
        });
      }
      if (order.ship) {
        await admin.json("POST", `/api/admin/orders/${created.id}/shipping`, {
          json: { carrier: "UPS", trackingNumber: "1Z999AA10123456784", trackingUrl: "https://www.ups.com/track" },
        });
        await admin.json("POST", `/api/admin/orders/${created.id}/status`, { json: { status: "shipped" } });
      }
      log(`Created demo order for ${order.email}${order.confirm ? " (paid)" : ""}${order.ship ? " (shipped)" : ""}`);
    } catch (error) {
      warn(`Could not create demo order for ${order.email}: ${error instanceof Error ? error.message : String(error)}`);
    }
  }
}

log("Demo seed complete.");
log(`Storefront: ${baseUrl}/`);
log(`Admin: ${baseUrl}/admin`);

