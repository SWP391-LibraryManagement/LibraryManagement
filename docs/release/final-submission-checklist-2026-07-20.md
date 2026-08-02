# Final Submission Checklist - 2026-07-20

## Release decision

The published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. Full-project closeout starts from `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97; CI `30726791185` and staging deployment `30726924615` pass for that exact pre-batch SHA. PR A only reconciles Shell evidence. PR B-D remain required before `v1.0.3`, and PR D must use its own exact post-merge SHA rather than treating this baseline as the final release commit.

Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02. No URL or artifact is missing or expected, and none will be fabricated.

## Submission package

| Item | Status | Evidence |
| --- | --- | --- |
| Source code | PASS pre-batch baseline / `v1.0.3` NOT YET AUTHORIZED | `v1.0.2` is published at `c988af1`; the four-PR closeout starts from `main@161cc28` and requires PR B-D plus final exact-SHA evidence. |
| Requirements and design | PASS design / IMPLEMENTATION IN PROGRESS | Approved design `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`; PR A-D boundaries are explicit. |
| Final release document | PASS | `document/FinalRelease.md`. |
| User documentation | PASS | `docs/user-manual.md` and system overview. |
| Phase 3 final report | PASS | `docs/release/phase3-final-report.md`. |
| Final governance closeout | ACTIVE — PR A-D REQUIRED | The 2026-07-20 reviews remain historical; the approved 2026-08-02 design and PR A plan govern the current closeout. |
| Defense presentation | PASS | `docs/presentation/phase3-defense-deck.pptx` with source record and render QA; Vietnamese briefing at `docs/briefing-thuyet-trinh-du-an-vi.docx`. |
| Rehearsal | PASS | `docs/release/phase3-rehearsal-record.md` and demo runbook. |
| Current-main quality | PASS pre-batch baseline | CI `30726791185` succeeded on exact SHA `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`. |
| Current-main staging | PASS pre-batch baseline | Deployment workflow `30726924615` succeeded on the same exact SHA. |
| Public Azure staging | PASS pre-batch baseline | Seven checks passed: frontend, health, schema readiness, SQL catalog, allowed CORS, blocked CORS, and anonymous protected route. |
| Demonstration video/link | WAIVED — NOT REQUIRED | Approved by Nhat on 2026-08-02; no external URL or artifact will be fabricated. |
| Authenticated Azure user observation | PASS | Live run `c6e0c46421f0` verified Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search were observed. |
| Vietnamese UI localization | PASS — INTEGRATED ON CURRENT MAIN / NOT IN `v1.0.2` | PR #58 established the released baseline; later responsive corrections are included in the pre-batch `main@161cc28` candidate and covered by its CI/deployment evidence. |

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

- FE10 personal inbox is integrated; a separate `IN_APP` delivery channel and global staff notification log remain outside the approved scope.
- Dedicated human desktop/mobile visual acceptance passed on 2026-07-21; later responsive corrections are integrated on the pre-batch main candidate but are not part of published `v1.0.2`.
- Demonstration video is `WAIVED — NOT REQUIRED`; this is a final submission decision, not an open limitation.
- Avatar storage on App Service is not production-durable.
- CI has no shared disposable SQL Server service.
- Student-credit staging has no production SLA.

These limitations are documented release boundaries, not unverified PASS
claims. Any new feature or production-hardening program requires a separately
approved Phase 4 specification package.
