# Legal documents

This directory contains the templates CartBase uses to accept contributions and to sell
commercial licenses alongside the GPLv3 open-source release.

> **These are templates, not legal advice.** Have qualified counsel in your jurisdiction
> review them, complete every placeholder, and adapt them to your business before you rely
> on them.

## Files

| File | Purpose |
|---|---|
| [`CLA.md`](CLA.md) | Contributor License Agreement. Every contributor must accept it before a pull request can be merged. It lets the project distribute contributions under GPLv3 and under commercial terms. |
| [`COMMERCIAL-LICENSE.md`](COMMERCIAL-LICENSE.md) | Commercial license template and order form for customers who need to use CartBase without GPLv3's copyleft and source-disclosure obligations. |

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

1. Send the customer an Order Form (Schedule A) that states the license metrics, term,
   fees, and permitted distribution.
2. Confirm the scope in writing: internal use, distribution inside a Customer Product, or
   both; number of stores, domains, environments, and administrator seats.
3. Collect payment terms and invoice details. Do not grant rights beyond the Order Form.
4. Deliver the agreed software through the channel in the Order Form.
5. Keep the signed agreement and all Order Forms. If support is sold, attach Schedule B.
6. If the customer also uses code received under GPLv3, remember that GPLv3 rights cannot
   be taken away by the commercial agreement; the commercial license adds permissions.

## Important notes about the open-source history

- Earlier releases of this repository were published under the MIT license. Those releases
  remain MIT for anyone who obtained them; changing the current `LICENSE` does not revoke
  those grants.
- The current source is GPLv3. A commercial license is an alternative grant for customers
  who need proprietary-use permissions, not a restriction added on top of GPLv3.
- Keep the copyright notice accurate. If contributors other than the maintainer have
  merged code, their CLA records are what make commercial relicensing safe.

## 中文要点

- `CLA.md`：贡献者许可协议。贡献者保留版权，但授权维护者以 GPLv3 **或商业条款**分发其贡献。没有这份授权，后续卖商业授权会有版权瑕疵。
- `COMMERCIAL-LICENSE.md`：商业授权合同模板，含订购单（Schedule A）和支持条款（Schedule B）。
- 所有方括号内容都需要替换；金额、责任上限、管辖法院/仲裁机构必须按实际情况填写。
- CLA 必须“先签后合”：每个 PR 合并前确认已接受 CLA，并保留签署记录。公司贡献需要公司主体签 Corporate CLA。
- 商业合同要和 GPLv3 并存：GPLv3 授权不能被商业合同收回，商业合同只是在订购单范围内**额外授予**闭源使用权限。
- 以上均为模板，正式使用前请律师审核。
