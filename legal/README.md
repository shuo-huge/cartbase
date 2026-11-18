# Legal documents

This directory contains the templates CartBase uses to accept contributions and to sell
commercial licenses alongside the MIT open-source release.

> **These are templates, not legal advice.** Have qualified counsel in your jurisdiction
> review them, complete every placeholder, and adapt them to your business before you rely
> on them.

## Files

| File | Purpose |
|---|---|
| [`CLA.md`](CLA.md) | Contributor License Agreement. Every contributor must accept it before a pull request can be merged. It lets the project distribute contributions under MIT and under commercial terms. |
| [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md) | Commercial license template and order form for customers who buy commercial components, commercial support, warranties, or indemnification. |

## What MIT means for the business model

MIT is permissive. Anyone may use, modify, and commercially exploit the Open Source
Version, including in closed-source products, without paying and without disclosing their
changes. A commercial license therefore **cannot sell permission to use the core**, and it
cannot restrict what MIT already allows.

The paid offering has to be something MIT does not provide:

- **Commercial Components** — proprietary modules, integrations, or features that are not
  published under MIT (for example, enterprise features, premium connectors, or a hosted
  service).
- **Commercial Services** — support, SLA, onboarding, managed deployment, and updates.
- **Commercial assurances** — warranty, indemnification, and security review.
- **Brand permissions** — a trademark or white-label license, if you choose to offer one.

Keep the commercial components in a separate repository or package with a clear boundary.
Do not describe the MIT core as "commercial use requires a license"; that statement would
conflict with the LICENSE file and confuse customers.

## Placeholders to complete

Before publishing either document, replace all bracketed fields:

- `[LICENSOR LEGAL NAME]`, `[ENTITY TYPE]`, `[JURISDICTION]`, `[LICENSOR ADDRESS]`
- `[CONTACT EMAIL]`
- `[VENUE]`, `[ARBITRATION INSTITUTION]`, `[CITY]`, `[LANGUAGE]`
- `[EFFECTIVE DATE]`, fee amounts, liability cap, confidentiality term
- Optional clauses marked "delete if not desired"

Use the same legal entity consistently in the CLA, the commercial license, the invoice,
and the trademark policy. If the project is not incorporated yet, do not start selling
licenses in a personal name without advice on liability.

## CLA workflow

1. Publish `CLA.md` and link it from `CONTRIBUTING.md` and the pull-request template.
2. Require acceptance before merge. The usual options are a CLA-check GitHub App, a signed
   PDF kept in a private records directory, or an explicit acceptance comment on the pull
   request.
3. For contributions made during employment, require a Corporate CLA signed by the
   employer.
4. Keep a dated record of every acceptance. Without this record, a later commercial
   license may be challenged by a contributor.
5. If a contribution was merged before the CLA existed, ask that contributor to confirm
   the CLA retroactively for their past contributions.

The CLA grants a broad copyright license, including the right to relicense under
proprietary terms. A DCO sign-off alone is **not** sufficient for dual licensing.

## Commercial license workflow

1. Decide what you are selling before you send an Order Form: commercial components, a
   support plan, indemnification, or a combination. Do not sell "closed-source permission"
   for the MIT code.
2. Send the customer an Order Form (Schedule A) that states the commercial components,
   support plan, license metrics, term, and fees.
3. Confirm the scope in writing: internal use, distribution inside a Customer Product, or
   both; number of stores, domains, environments, and administrator seats.
4. Collect payment terms and invoice details. Do not grant rights beyond the Order Form.
5. Deliver the commercial components and support through the channel in the Order Form.
6. Keep the signed agreement and all Order Forms. If support is sold, attach Schedule B.
7. Remember that the customer can always use the Open Source Version under MIT; the
   commercial agreement adds rights and services, it does not remove MIT rights.

## 中文要点

- `CLA.md`：贡献者许可协议。贡献者保留版权，但授权维护者以 MIT **或商业条款**分发其贡献。没有这份授权，后续卖商业授权会有版权瑕疵。
- `COMMERCIAL-LICENSE.md`：商业授权合同模板，含订购单（Schedule A）和支持条款（Schedule B）。
- **MIT 已经允许闭源商用**，所以商业合同不能卖“解除 copyleft”或“闭源许可”。真正能卖的是：商业组件、支持/SLA、赔偿保障、托管服务、商标/白标授权。
- 商业组件要和 MIT 核心保持清晰边界（独立仓库/独立包/独立服务），否则容易被认为已经随 MIT 一起授权。
- 所有方括号内容都需要替换；金额、责任上限、管辖法院/仲裁机构必须按实际情况填写。
- CLA 必须“先签后合”：每个 PR 合并前确认已接受 CLA，并保留签署记录。公司贡献需要公司主体签 Corporate CLA。
- 以上均为模板，正式使用前请律师审核。
