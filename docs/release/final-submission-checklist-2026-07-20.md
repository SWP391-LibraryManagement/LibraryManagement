# Final Submission Checklist - 2026-07-20

## Release decision

The approved FE01-FE12 baseline and Phase 3 delivery are integrated, but the
current reconciliation is not yet final: the published `31d4bba` scope was
H2-approved, the responsive correction requires fresh H2 review, H3 remains
pending, the dedicated localized desktop/mobile visual acceptance is pending,
and no demonstration video/link is published. Release `v1.0.2` is published at
`c988af1`; `cce59d0` is the validated post-release application baseline. A
future `v1.0.3` must use the later reviewed `main` SHA after this reconciliation
merges through H3 and passes exact post-merge CI.

## Submission package

| Item | Status | Evidence |
| --- | --- | --- |
| Source code | PASS published baseline / H2 re-review required | `v1.0.2` is published at `c988af1`; application baseline `cce59d0` contains PR #57/#58, while the responsive correction awaits H2/H3 integration review. |
| Requirements and design | PASS baseline / responsive H2 re-review required | `document/RDS.md`, `document/SDS.md`, and the FE02/test-plan source-of-truth reconciliation in this batch. |
| Final release document | PASS | `document/FinalRelease.md`. |
| User documentation | PASS | `docs/user-manual.md` and system overview. |
| Phase 3 final report | PASS | `docs/release/phase3-final-report.md`. |
| Final governance closeout | PASS for PR #54; responsive correction H2/H3 pending | `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md` and `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`. |
| Defense presentation | PASS | `docs/presentation/phase3-defense-deck.pptx` with source record and render QA; Vietnamese briefing at `docs/briefing-thuyet-trinh-du-an-vi.docx`. |
| Rehearsal | PASS | `docs/release/phase3-rehearsal-record.md` and demo runbook. |
| Remote application-baseline quality | PASS | CI `29712597463` passed 917 backend tests across 53 suites and 171 frontend tests for `cce59d0`; staging workflow `29712612188` also passed. |
| Fresh local reconciliation quality | AUTOMATED PASS / H2 RE-REVIEW REQUIRED | The current correction passes 173 frontend tests, lint, build, traceability, and 4/4 browser E2E; prior backend/coverage/deployment evidence remains recorded for the unchanged backend scope. |
| Public Azure staging | PASS | Frontend, health, SQL catalog, CORS allow/deny, and protected-route six-check smoke. |
| Demonstration video/link | NOT PUBLISHED | No external video URL was provided or fabricated. |
| Authenticated Azure user observation | PASS | Live run `c6e0c46421f0` verified Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search were observed. |
| Vietnamese UI localization | AUTOMATED/STAGING PASS; HUMAN VISUAL REVIEW PENDING | PR #58 merged; focused responsive review 1/1 produced `output/playwright/h3-visual/`, while human acceptance remains open in `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`. |

## Verify the published `v1.0.2` release now

These verification checks can run immediately. The tag must resolve to `c988af1`:

```powershell
git fetch origin --tags
git rev-list -n 1 v1.0.2
gh release view v1.0.2 --repo SWP391-LibraryManagement/LibraryManagement
```

## Verify a future post-reconciliation release

Run the first checks only after H2 approval, merge through H3, and exact
post-merge CI pass. Treat the resulting `origin/main` SHA as the only eligible
future release source; do not reuse `cce59d0` or retroactively approve PR #57/#58:

```powershell
git fetch origin --tags
git rev-parse origin/main
gh run list --repo SWP391-LibraryManagement/LibraryManagement --branch main --limit 5
```

Only if the team later publishes `v1.0.3`, verify that release separately:

```powershell
git rev-list -n 1 v1.0.3
gh release view v1.0.3 --repo SWP391-LibraryManagement/LibraryManagement
```

## Residual limitations

- Notification inbox UI remains outside the approved Phase 1 scope.
- Dedicated human desktop/mobile visual acceptance remains pending for the current Vietnamese localization reconciliation.
- The demonstration video/link remains unpublished.
- Avatar storage on App Service is not production-durable.
- CI has no shared disposable SQL Server service.
- Student-credit staging has no production SLA.

These limitations are documented release boundaries, not unverified PASS
claims. Any new feature or production-hardening program requires a separately
approved Phase 4 specification package.
