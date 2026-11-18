# @cartbase/cli

Zero-dependency Node.js CLI for the CartBase admin API. Designed for humans, scripts and AI agents.

```bash
pnpm cartbase auth login --url https://store.example.com --email owner@example.com
pnpm cartbase products list --json
pnpm cartbase blog create --title "Hello" --slug hello --text-file post.html --publish --json
pnpm cartbase capabilities --json
```

- Full command reference: [`../../docs/CLI.md`](../../docs/CLI.md)
- Agent instructions: [`../../AGENTS.md`](../../AGENTS.md)
- Tests: `pnpm test:cli`
- Run directly: `node apps/cli/bin/cartbase.mjs --help`

The package is private and intentionally not published to npm yet. Use `pnpm cartbase` from the repository root.
