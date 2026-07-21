# Plan

Current phase: Phase 3 - Polish and Delivery baseline integrated; PR #59 governance/localization reconciliation is merged with H3 recorded, while the later current-main release decision remains open.

Published release: `v1.0.2` at `c988af1`. PR #59 merged the reconciliation as
`eed2688`; current `main` is `a8729f9` after twelve later commits. CI
`29824756487` and staging deployment `29824944954` pass for that SHA. The later
batch, security audit, and desktop/mobile visual acceptance have review
evidence; `v1.0.3` remains an explicit human release decision.

Phase 2 Core Development is complete for the approved FE01-FE12 scope. Product reconciliation and human H3 were merged through PR #40/#41, FE02/FE10 OTP follow-up was merged through PR #42-#44, all twelve feature packages declare `Implementation State: COMPLETE`, and the enforced traceability gate reports 100% FR coverage.

## Completed Delivery

- FE01-FE12 contracts, implementation, tests, and traceability are complete.
- PR #48 integrated the Phase 3 package; PR #49 integrated post-merge evidence.
- Main CI and the SQL-aware Azure staging workflow passed for the Phase 3 merge.
- Final report, release document, rehearsal record, presentation deck, and
  four-layer validation packet are tracked.
- Route-level code splitting resolved the previous entry-bundle advisory.
- PR #58 Vietnamese UI localization and strict bearer-header verification are merged in `cce59d0`; PR #59 commits `962ceb1` and `daaeea6` are merged through H3 as `eed2688`. The later current-main product commits have green CI but still need one final release evidence update.

## External Submission Items

- Demonstration video/link: not published in the repository.
- Authenticated Azure Admin/Member/Librarian observation: PASS in live run
  `c6e0c46421f0`, including protected reads and borrow request/approval/return.
- Real SMTP inbox delivery: PASS in live run `c6e0c46421f0`; notification `8`
  was accepted by the provider and observed through Gmail IMAP search.

The demonstration video remains an explicit evidence boundary. The observed
provider checks do not silently reopen Phase 3 or invalidate the verified
public staging release; sanitized details are recorded in the Phase 3 evidence
packet.

Any future product work requires a separately approved Phase 4 scope, SPEC,
plan, tasks, and validation contract.
