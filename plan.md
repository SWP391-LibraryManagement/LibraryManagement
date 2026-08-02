# Plan

Current phase: full project closeout for `v1.0.3`, delivered through four bounded PRs under the approved 2026-08-02 design.

Published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. The closeout starts from `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`; CI `30726791185` and staging deployment `30726924615` pass for that exact pre-batch baseline. PR D alone may authorize and publish `v1.0.3` after exact post-merge verification.

The enforced baseline is truthful rather than uniformly complete: FE02 is `PARTIAL` with 27/27 FR tags, FE04 is `PARTIAL` with 14/14, FE11 is `PARTIAL` with 35/43, and the other nine feature packages are `COMPLETE` at 100%.

## Closeout delivery

1. PR A — publish PR #95 documentation closeouts, revalidate the controlled React Router audit exception, and refresh release truth without product changes.
2. PR B — reconcile and complete FE11 Core account lifecycle, exactly-one-role replacement, permission surface, guards, tests, and traceability.
3. PR C — execute FE04 role-based acceptance and FE02 remaining reconciliation without closing unsupported human evidence.
4. PR D — run final cross-feature/SQL/browser/security gates, merge under H3, verify the exact resulting SHA, and publish `v1.0.3` only when every release condition passes.

## External Submission Items

- Demonstration video/link: `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no link or artifact will be fabricated.
- Authenticated Azure Admin/Member/Librarian observation: PASS in live run
  `c6e0c46421f0`, including protected reads and borrow request/approval/return.
- Real SMTP inbox delivery: PASS in live run `c6e0c46421f0`; notification `8`
  was accepted by the provider and observed through Gmail IMAP search.

The video waiver is a final project decision, not missing evidence. It does not waive code, security, traceability, browser, SQL, H2, H3, deployment, or exact-SHA release gates.

Product changes outside the approved PR B/PR C boundaries require a separate
decision and SDD package. After `v1.0.3` closeout, new product scope requires a
separately approved Phase 4 scope, SPEC, plan, tasks, and validation contract.
