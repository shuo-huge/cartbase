# Contributing to CartBase

Thanks for helping improve CartBase. This project is MIT licensed. Contributions need a
clear copyright grant before they can be merged, and the CLA keeps the project's future
licensing options open.

## Before you open a pull request

1. Read the [Contributor License Agreement](legal/CLA.md).
2. Accept the CLA using the method described in that document. If you contribute as part
   of your job, ask your employer to sign the Corporate CLA section.
3. Open an issue first for large changes or new features so the approach can be agreed
   before you invest time.

Pull requests that do not have a recorded CLA acceptance cannot be merged.

## Development checks

Run the same checks as CI before pushing:

```bash
pnpm install
pnpm check:brand
pnpm typecheck
pnpm test
pnpm test:cli
pnpm build
```

For UI changes, also run the browser suite:

```bash
pnpm exec playwright install chromium
pnpm test:e2e
```

## Guidelines

- Keep changes focused. Separate refactors from behavior changes.
- Add or update tests for behavior changes.
- Follow the existing TypeScript, Preact, and Hono patterns.
- Do not add a dependency that requires a paid service or a non-free runtime.
- Update the relevant document in `docs/` when behavior or configuration changes.
- Never commit secrets, `.dev.vars`, API keys, or generated credentials.

## Commit messages

Use a short imperative subject and explain the reason in the body. Reference an issue when
one exists.
