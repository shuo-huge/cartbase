# Deployment assets

The deployment entry point is `scripts/deploy.mjs`, invoked by:

```bash
pnpm run deploy:cloudflare
```

It discovers or creates the Cloudflare resources this store needs (Worker and D1; R2 is optional), updates `wrangler.jsonc`,
applies migrations, builds, deploys and creates secrets. See `docs/DEPLOYMENT.md` for the full
procedure, custom domains, updates, backup and restore.

Deployment state is written to `.cartbase/deploy.json` (gitignored). Treat it as a secret store:
it contains `APP_MASTER_KEY` and `SETUP_TOKEN` for this store. Stores renamed from the previous
product name may still have a legacy state file; copy it to the new path and preserve `d1Id` before
deploying.

The existing D1 resource keeps its legacy physical name; its `database_id` is the authoritative
identity and must not change. Use the `DB` binding in Wrangler commands so scripts do not depend on
the physical name. The jsDelivr media repository may also keep its old name; renaming it would break
image URLs already stored in the catalog.

There is intentionally no Cloudflare API token stored in the running Worker.
