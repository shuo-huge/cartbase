# Demo store data

`pnpm demo:seed` fills a CartBase store with demo content through the admin API. It is
meant for a fresh demo deployment, not for an existing merchant store.

## What it creates

- 4 categories: Bags, Lighting, Home, Accessories
- 8 active products with descriptions, prices, stock, categories, and external images
- A published home page with announcement, hero, product grid, and story sections
- Demo store settings (store name, currency, tax rate, SEO)
- 3 demo orders: one awaiting payment, one paid, and one paid and shipped

It also works on an existing store: it only adds missing categories and products, skips
orders that already exist, and keeps the existing settings. It never deletes data.

## Requirements

- A running store: a Cloudflare deployment or `pnpm dev`
- The owner/admin email and password
- Outbound access to `picsum.photos` for the demo product images

## Usage

```bash
CARTBASE_URL=https://cartbase-demo.example.com \
CARTBASE_ADMIN_EMAIL=owner@example.com \
CARTBASE_ADMIN_PASSWORD='your-password' \
pnpm demo:seed
```

Or pass the values as flags:

```bash
pnpm demo:seed \
  --url http://127.0.0.1:8787 \
  --email owner@example.com \
  --password 'your-password'
```

### Options

| Flag | Effect |
|---|---|
| `--url`, `--email`, `--password` | Connection details (also read from `CARTBASE_URL`, `CARTBASE_ADMIN_EMAIL`, `CARTBASE_ADMIN_PASSWORD`) |
| `--store-name` | Demo store name; applied only to a fresh store |
| `--currency` | Three-letter currency code; applied only to a fresh store |
| `--no-orders` | Skip the three demo orders |
| `--yes` | Allow adding missing content to a store that already has products |
| `--dry-run` | Print the plan and exit without writing |

### Re-running

The seed is idempotent for categories, products, and orders. Re-running republishes the
home page and creates a new page version, which is harmless.

If the store already has products, the script stops unless you pass `--yes`:

```bash
pnpm demo:seed --yes
```

## Limitations

- Product images are external HTTPS URLs from `picsum.photos`. For a long-lived public
  demo, upload the images to R2 or jsDelivr and replace them.
- Demo orders use the manual payment method.
- The seed does not configure Stripe, PayPal, email delivery, R2, shipping zones, or
  coupons.
- It reads at most 100 existing products when checking for duplicates.

## Creating a public demo

```bash
pnpm run deploy:cloudflare -- --name cartbase-demo
```

Open the one-time setup link, create the owner account, then run `pnpm demo:seed` against
the Worker URL. Keep the demo store on its own Worker and D1 database; do not seed a real
merchant store.
