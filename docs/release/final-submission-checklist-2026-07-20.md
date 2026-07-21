# Final Submission Checklist - 2026-07-20

## Release decision

The approved FE01-FE12 baseline and Phase 3 delivery are integrated. PR #59
was merged as `eed2688` after H3 review; the current `main` candidate is
`a8729f9`, with CI `29824756487` and staging deployment `29824944954` passing.
Dedicated localized desktop/mobile visual acceptance was confirmed by the
project reviewer on 2026-07-21. The later H2-approved local candidate also repairs the two
bounded mobile issues found during closeout (FE08 badge containment and FE11
topbar spacing); it is verified locally but not yet released. A demonstration
video/link remains open. Release `v1.0.2` remains published at `c988af1`; a
future `v1.0.3` still requires explicit human release approval.

## Submission package

| Item | Status | Evidence |
| --- | --- | --- |
| Source code | PASS published baseline / current candidate pending release decision | `v1.0.2` is published at `c988af1`; current `main@a8729f9` includes PR #59 and later product commits. |
| Requirements and design | PASS baseline / H2-APPROVED | `document/RDS.md`, `document/SDS.md`, and the FE02/test-plan source-of-truth reconciliation in this batch. |
| Final release document | PASS | `document/FinalRelease.md`. |
| User documentation | PASS | `docs/user-manual.md` and system overview. |
| Phase 3 final report | PASS | `docs/release/phase3-final-report.md`. |
| Final governance closeout | LOCAL CLOSEOUT H2 PASS; NEW H3 AND RELEASE REVIEW PENDING | `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md` and `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`. |
| Defense presentation | PASS | `docs/presentation/phase3-defense-deck.pptx` with source record and render QA; Vietnamese briefing at `docs/briefing-thuyet-trinh-du-an-vi.docx`. |
| Rehearsal | PASS | `docs/release/phase3-rehearsal-record.md` and demo runbook. |
| Current-main quality | PASS | CI `29824756487` passed 923 backend tests across 54 suites, 178 frontend tests, coverage, lint, build, deployment tests, and 4/4 browser E2E. |
| Current-main staging | PASS | Deployment workflow `29824944954` passed frontend/backend deployment and smoke checks. |
| Public Azure staging | PASS | Frontend, health, SQL catalog, CORS allow/deny, and protected-route six-check smoke. |
| Demonstration video/link | NOT PUBLISHED | No external video URL was provided or fabricated. |
| Authenticated Azure user observation | PASS | Live run `c6e0c46421f0` verified Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search were observed. |
| Vietnamese UI localization | PASS — RELEASED BASELINE; LOCAL H2 REMEDIATION VERIFIED | PR #58 merged; the closeout candidate adds passing FE08/FE11 mobile bounding-box regressions and two corrected 390px screenshots under `output/playwright/`. |

## Automated closeout refresh — 2026-07-21

After a clean reinstall from the final lockfiles, local validation passed with
923/923 backend tests across 54 suites, 178/178 frontend tests, 10/10 system
tests, 8/8 deployment tests, and 4/4 Playwright flows. Coverage remained above
the configured thresholds (statements 92.61%, branches 81.55%, functions
96.68%, lines 92.54%). Production dependency audits for the root, backend, and
frontend workspaces each reported `0 vulnerabilities`; the CI workflow now
enforces the same high-severity audit gates for all dependencies.

The local mobile-remediation follow-up used TDD: both new assertions first
failed for the observed geometry, then passed after mobile-only CSS changes.
The refreshed scoped gate passed 178/178 frontend tests, lint, production build,
4/4 Playwright flows, and 12/12-feature (243/243 FR) traceability. Visual
evidence is retained as `release-member-reservations-mobile-fixed.png` and
`release-admin-users-mobile-fixed.png` under `output/playwright/`.

## Verify the published `v1.0.2` release now

These verification checks can run immediately. The tag must resolve to `c988af1`:

```powershell
git fetch origin --tags
git rev-list -n 1 v1.0.2
gh release view v1.0.2 --repo SWP391-LibraryManagement/LibraryManagement
```

## Verify a future post-reconciliation release

Run the checks against the exact reviewed `origin/main` SHA before any future
release tag; do not reuse `cce59d0` or retroactively approve earlier PRs:

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
- Dedicated human desktop/mobile visual acceptance passed on 2026-07-21; the later local FE08/FE11 corrective evidence is H2-approved but remains subject to H3 and the final release decision.
- The demonstration video/link remains unpublished.
- Avatar storage on App Service is not production-durable.
- CI has no shared disposable SQL Server service.
- Student-credit staging has no production SLA.

These limitations are documented release boundaries, not unverified PASS
claims. Any new feature or production-hardening program requires a separately
approved Phase 4 specification package.
