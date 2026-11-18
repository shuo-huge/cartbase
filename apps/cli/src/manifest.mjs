import * as auth from "./commands/auth.mjs";
import * as commerce from "./commands/commerce.mjs";
import * as content from "./commands/content.mjs";
import * as meta from "./commands/meta.mjs";
import { usageError } from "./errors.mjs";

/**
 * Single source of truth for command discovery, help, schemas and dispatch.
 * `run` receives the shared CLI context created by main.mjs.
 */
export const COMMANDS = [
  { path: "auth login", summary: "Log in and save an API key.", usage: "cartbase auth login --url URL --email EMAIL [--password-stdin]", mutates: true, examples: ["cartbase auth login --url https://store.example.com --email owner@example.com"], run: auth.login },
  { path: "auth setup", summary: "Initialize a new store and save an API key.", usage: "cartbase auth setup --url URL --setup-token TOKEN --email EMAIL --password-stdin --name NAME", mutates: true, run: auth.setup },
  { path: "auth status", summary: "Show saved profiles and keys.", usage: "cartbase auth status [--probe]", run: auth.status },
  { path: "auth whoami", summary: "Show the authenticated administrator.", usage: "cartbase auth whoami", run: auth.whoami },
  { path: "auth logout", summary: "Revoke the current key and remove the local profile.", usage: "cartbase auth logout [--forget]", mutates: true, run: auth.logout },
  { path: "keys list", summary: "List API keys for the current administrator.", usage: "cartbase keys list", run: auth.keysList },
  { path: "keys create", summary: "Create an API key through a temporary password session.", usage: "cartbase keys create --name NAME [--scope SCOPE]...", mutates: true, run: auth.keysCreate },
  { path: "keys revoke", summary: "Revoke an API key through a temporary password session.", usage: "cartbase keys revoke KEY_ID --yes", mutates: true, run: auth.keysRevoke },

  { path: "products list", summary: "List products.", usage: "cartbase products list [--status STATUS] [--q TEXT]", run: content.productsList },
  { path: "products get", summary: "Get a product.", usage: "cartbase products get PRODUCT_ID", run: content.productsGet },
  { path: "products create", summary: "Create a product and import/attach images.", usage: "cartbase products create --name NAME --price PRICE [--data JSON] [--storage r2|jsdelivr]", mutates: true, examples: ["cartbase products create --name \"Canvas Tote\" --price 25.00 --status active --image https://example.com/tote.jpg --storage jsdelivr"], run: content.productsCreate },
  { path: "products update", summary: "Update a product (GET + merge or full --data).", usage: "cartbase products update PRODUCT_ID [--data JSON|--name ...] [--storage r2|jsdelivr]", mutates: true, run: content.productsUpdate },
  { path: "products status", summary: "Set a product status.", usage: "cartbase products status PRODUCT_ID draft|active|archived", mutates: true, run: content.productsStatus },
  { path: "products delete", summary: "Delete a product.", usage: "cartbase products delete PRODUCT_ID [--delete-media] --yes", mutates: true, run: content.productsDelete },
  { path: "products images add", summary: "Attach an existing media id to a product.", usage: "cartbase products images add PRODUCT_ID MEDIA_ID [--alt TEXT]", mutates: true, run: content.productImagesAdd },
  { path: "products images attach", summary: "Import/upload an image and attach it to a product.", usage: "cartbase products images attach PRODUCT_ID --image-url URL|--file PATH [--storage r2|jsdelivr] [--external]", mutates: true, examples: ["cartbase products images attach prd_123 --image-url https://example.com/a.jpg --storage jsdelivr"], run: content.productImagesAttach },
  { path: "products images remove", summary: "Remove a product image.", usage: "cartbase products images remove PRODUCT_ID IMAGE_ID --yes", mutates: true, run: content.productImagesRemove },
  { path: "products images order", summary: "Reorder product images.", usage: "cartbase products images order PRODUCT_ID IMAGE_ID...", mutates: true, run: content.productImagesOrder },

  { path: "media list", summary: "List media.", usage: "cartbase media list", run: content.mediaList },
  { path: "media add-url", summary: "Register an external HTTPS URL without storing a copy.", usage: "cartbase media add-url URL [--alt TEXT]", mutates: true, run: content.mediaAddUrl },
  { path: "media upload", summary: "Upload a local image into configured storage.", usage: "cartbase media upload PATH [--alt TEXT] [--storage r2|jsdelivr]", mutates: true, run: content.mediaUpload },
  { path: "media import-url", summary: "Download a URL and store a copy in configured storage.", usage: "cartbase media import-url URL [--alt TEXT] [--storage r2|jsdelivr]", mutates: true, run: content.mediaImportUrl },
  { path: "media storage", summary: "Show media storage provider status.", usage: "cartbase media storage", run: content.mediaStorage },
  { path: "media delete", summary: "Delete media.", usage: "cartbase media delete MEDIA_ID --yes", mutates: true, run: content.mediaDelete },

  { path: "categories list", summary: "List categories.", usage: "cartbase categories list", run: content.categoriesList },
  { path: "categories create", summary: "Create a category.", usage: "cartbase categories create --name NAME", mutates: true, run: content.categoriesCreate },
  { path: "categories update", summary: "Update a category.", usage: "cartbase categories update CATEGORY_ID --name NAME", mutates: true, run: content.categoriesUpdate },
  { path: "categories delete", summary: "Delete a category.", usage: "cartbase categories delete CATEGORY_ID --yes", mutates: true, run: content.categoriesDelete },

  { path: "pages list", summary: "List content pages.", usage: "cartbase pages list", run: content.pagesList },
  { path: "pages get", summary: "Get a page and its draft/versions.", usage: "cartbase pages get SLUG", run: content.pagesGet },
  { path: "pages create", summary: "Create a content page.", usage: "cartbase pages create --title TITLE --slug SLUG", mutates: true, run: content.pagesCreate },
  { path: "pages draft", summary: "Save a page document as draft.", usage: "cartbase pages draft SLUG --data JSON|@file|-", mutates: true, run: content.pagesDraft },
  { path: "pages publish", summary: "Publish a page draft.", usage: "cartbase pages publish SLUG", mutates: true, run: content.pagesPublish },
  { path: "pages versions", summary: "List page versions.", usage: "cartbase pages versions SLUG", run: content.pagesVersions },
  { path: "pages version", summary: "Get one page version.", usage: "cartbase pages version SLUG VERSION", run: content.pagesVersion },
  { path: "pages restore", summary: "Restore a version into the draft.", usage: "cartbase pages restore SLUG VERSION", mutates: true, run: content.pagesRestore },
  { path: "pages preview", summary: "Render a draft preview.", usage: "cartbase pages preview SLUG --data JSON [--out FILE]", mutates: false, run: content.pagesPreview },
  { path: "pages rename", summary: "Rename a page title.", usage: "cartbase pages rename SLUG --title TITLE", mutates: true, run: content.pagesRename },
  { path: "pages delete", summary: "Delete a content page.", usage: "cartbase pages delete SLUG --yes", mutates: true, run: content.pagesDelete },

  { path: "blog list", summary: "List content pages used as blog posts.", usage: "cartbase blog list [--q TEXT] [--status draft|published|all]", run: content.blogList },
  { path: "blog get", summary: "Get a blog page.", usage: "cartbase blog get SLUG", run: content.blogGet },
  { path: "blog create", summary: "Create a blog page (hero + rich text).", usage: "cartbase blog create --title TITLE --slug SLUG --text-file FILE [--publish]", mutates: true, examples: ["cartbase blog create --title \"Launch notes\" --slug launch-notes --text-file post.html --publish"], run: content.blogCreate },
  { path: "blog update", summary: "Update a blog page.", usage: "cartbase blog update SLUG [--text-file FILE] [--publish]", mutates: true, run: content.blogUpdate },
  { path: "blog publish", summary: "Publish a blog page.", usage: "cartbase blog publish SLUG", mutates: true, run: content.blogPublish },
  { path: "blog delete", summary: "Delete a blog page.", usage: "cartbase blog delete SLUG --yes", mutates: true, run: content.blogDelete },

  { path: "orders list", summary: "List orders.", usage: "cartbase orders list [--status STATUS] [--q TEXT]", run: commerce.ordersList },
  { path: "orders get", summary: "Get an order.", usage: "cartbase orders get ORDER_ID", run: commerce.ordersGet },
  { path: "orders status", summary: "Set an order status.", usage: "cartbase orders status ORDER_ID STATUS", mutates: true, run: commerce.ordersStatus },
  { path: "orders confirm-payment", summary: "Confirm a manual payment.", usage: "cartbase orders confirm-payment ORDER_ID [--note TEXT]", mutates: true, run: commerce.ordersConfirm },
  { path: "orders ship", summary: "Set shipment details.", usage: "cartbase orders ship ORDER_ID --carrier NAME --tracking-number NUMBER", mutates: true, run: commerce.ordersShip },
  { path: "orders note", summary: "Add an internal order note.", usage: "cartbase orders note ORDER_ID --note TEXT", mutates: true, run: commerce.ordersNote },
  { path: "orders cancel", summary: "Cancel an order and restock.", usage: "cartbase orders cancel ORDER_ID --yes", mutates: true, run: commerce.ordersCancel },
  { path: "orders refund", summary: "Refund an order amount.", usage: "cartbase orders refund ORDER_ID --amount 12.34 --yes", mutates: true, run: commerce.ordersRefund },
  { path: "orders returns", summary: "List returns recorded for an order.", usage: "cartbase orders returns ORDER_ID", run: commerce.ordersReturns },
  { path: "orders return", summary: "Record an item-level return and optionally restock.", usage: "cartbase orders return ORDER_ID --item ORDER_ITEM_ID:QTY [--item ...] [--restock] [--reason TEXT] [--note TEXT] --yes", mutates: true, run: commerce.ordersReturn },

  { path: "customers list", summary: "List customers.", usage: "cartbase customers list [--q TEXT]", run: commerce.customersList },
  { path: "customers get", summary: "Get a customer.", usage: "cartbase customers get CUSTOMER_ID", run: commerce.customersGet },
  { path: "customers notes", summary: "Update customer notes.", usage: "cartbase customers notes CUSTOMER_ID --notes TEXT", mutates: true, run: commerce.customersNotes },

  { path: "coupons list", summary: "List coupons.", usage: "cartbase coupons list", run: commerce.couponsList },
  { path: "coupons get", summary: "Get a coupon with product/category scope.", usage: "cartbase coupons get COUPON_ID", run: commerce.couponsGet },
  { path: "coupons create", summary: "Create a coupon.", usage: "cartbase coupons create --data JSON|--code CODE --type percent --value 10", mutates: true, run: commerce.couponsCreate },
  { path: "coupons update", summary: "Update a coupon (full --data).", usage: "cartbase coupons update COUPON_ID --data JSON", mutates: true, run: commerce.couponsUpdate },
  { path: "coupons delete", summary: "Delete a coupon.", usage: "cartbase coupons delete COUPON_ID --yes", mutates: true, run: commerce.couponsDelete },

  { path: "shipping list", summary: "List shipping zones and rates.", usage: "cartbase shipping list", run: commerce.shippingList },
  { path: "shipping zones create", summary: "Create a shipping zone.", usage: "cartbase shipping zones create --name NAME --countries US,CA", mutates: true, run: commerce.shippingZoneCreate },
  { path: "shipping zones update", summary: "Update a shipping zone.", usage: "cartbase shipping zones update ZONE_ID --name NAME", mutates: true, run: commerce.shippingZoneUpdate },
  { path: "shipping zones delete", summary: "Delete a shipping zone.", usage: "cartbase shipping zones delete ZONE_ID --yes", mutates: true, run: commerce.shippingZoneDelete },
  { path: "shipping rates create", summary: "Create a shipping rate.", usage: "cartbase shipping rates create --zone ZONE_ID --name NAME --price 5.00", mutates: true, run: commerce.shippingRateCreate },
  { path: "shipping rates update", summary: "Update a shipping rate.", usage: "cartbase shipping rates update RATE_ID --price 6.00", mutates: true, run: commerce.shippingRateUpdate },
  { path: "shipping rates delete", summary: "Delete a shipping rate.", usage: "cartbase shipping rates delete RATE_ID --yes", mutates: true, run: commerce.shippingRateDelete },

  { path: "tax list", summary: "List tax rates.", usage: "cartbase tax list", run: commerce.taxList },
  { path: "tax create", summary: "Create a tax rate.", usage: "cartbase tax create --name NAME --country US --rate-percent 8.25", mutates: true, run: commerce.taxCreate },
  { path: "tax update", summary: "Update a tax rate.", usage: "cartbase tax update RATE_ID --rate-percent 9", mutates: true, run: commerce.taxUpdate },
  { path: "tax delete", summary: "Delete a tax rate.", usage: "cartbase tax delete RATE_ID --yes", mutates: true, run: commerce.taxDelete },

  { path: "api", summary: "Call any /api/admin endpoint.", usage: "cartbase api METHOD /api/admin/PATH [--data JSON]", mutates: true, run: meta.api },
  { path: "capabilities", summary: "Show commands and live capabilities.", usage: "cartbase capabilities [--json] [--probe]", run: meta.capabilities },
  { path: "schema", summary: "Show command metadata and JSON schemas.", usage: "cartbase schema [command]", run: meta.schema },
  { path: "doctor", summary: "Diagnose config, URL, key and server.", usage: "cartbase doctor", run: meta.doctor },
  { path: "version", summary: "Show the CLI version.", usage: "cartbase version", run: meta.version },
  { path: "help", summary: "Show help.", usage: "cartbase help", run: meta.help },
];

export function resolveCommand(positionals) {
  const matches = COMMANDS
    .filter((command) => {
      const parts = command.path.split(" ");
      return parts.every((part, index) => positionals[index] === part);
    })
    .sort((left, right) => right.path.split(" ").length - left.path.split(" ").length);
  if (matches.length === 0) {
    throw usageError(`Unknown command: ${positionals.join(" ") || "(none)"}. Run \`cartbase help\`.`);
  }
  const definition = matches[0];
  return {
    definition,
    args: positionals.slice(definition.path.split(" ").length),
  };
}
