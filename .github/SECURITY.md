# Security policy

## Supported versions

Security fixes are provided for the latest release on `main`. Older tags are kept for
history but are not actively patched.

## Reporting a vulnerability

Please report vulnerabilities privately through GitHub's **Report a vulnerability** button
on the repository's Security tab, or by email to **[SECURITY EMAIL]**.

Do not open a public issue for a suspected vulnerability.

Include:

- the affected version or commit;
- the deployment mode (Deploy to Cloudflare, CLI deploy, or local development);
- steps to reproduce, or a proof of concept;
- the impact you believe is possible;
- any suggested fix or mitigation.

## What to expect

- Acknowledgement within a reasonable time.
- An assessment and a remediation plan for confirmed issues.
- Credit in the release notes if you want it.

Please give us time to ship a fix before publishing details.

## Scope

In scope:

- authentication, session, CSRF, and API-key handling;
- payment callbacks, signature verification, refunds, and idempotency;
- plugin tokens, HMAC calls, remote plugin isolation, and CSP;
- SQL injection, XSS, SSRF, path traversal, and secret exposure;
- privilege escalation between admin roles or stores.

Out of scope:

- findings that require a compromised Cloudflare account or physical device;
- denial of service through unrealistic volume;
- missing security headers without a demonstrated impact;
- issues in third-party services or dependencies that are already publicly known and
  fixed upstream.

See [docs/SECURITY.md](../docs/SECURITY.md) for the security model and known limitations.
