# Changelog

## Unreleased

### Added

- `pnpm demo:seed` to populate a demo store with categories, products, a published home
  page, and sample orders through the admin API. See [docs/DEMO.md](docs/DEMO.md).

## 0.5.1 — 2026-11-18

### Changed

- Renamed the project from CloudCart to CartBase, including the npm workspace scope, CLI
  binary, runtime identifiers, documentation, and brand assets. The D1 database id,
  encrypted-secret HKDF domains, order access signatures, and historical `CC-` order
  numbers were kept so existing data and links continue to work.
- Bumped the version identifiers and CLI output to 0.5.1.

### Added

- Contributor License Agreement (English, with a Simplified Chinese reference
  translation) and a pull-request checklist that records acceptance.
- Comment-preserving `wrangler.jsonc` updates in the deployment script, with 10 tests
  covering replacement, insertion, removal, and comment-like text inside strings.

### Fixed

- `scripts/deploy.mjs` no longer rewrites the whole Wrangler configuration and drops
  comments when it updates the Worker and D1 bindings.

### Verification

`pnpm typecheck`, `pnpm test` (127 workerd tests), `pnpm test:cli` (31 Node tests),
`pnpm build`, `pnpm test:e2e` (13 Playwright tests), `pnpm docs:build` (48 pages), and
`pnpm check:brand` passed. See [docs/TEST_REPORT.md](docs/TEST_REPORT.md).

## Earlier highlights

- Media storage with R2 and jsDelivr providers, encrypted credentials, an agent-oriented
  admin CLI, a documentation site, and admin screenshots.
- Hybrid bundled/remote plugin architecture with iframe admin pages, short-lived plugin
  JWTs, and HMAC service calls.
- Tax calculation, email notifications with a D1 outbox and retries, page version restore,
  image ordering, and browser end-to-end tests.
- Initial storefront, admin, server cart, guest checkout, manual payments, 8 themes, page
  builder, SEO, and deployment tooling.

For the complete history, see the repository's git log and pull requests.
