# Final Submission Checklist - 2026-07-20

## Release decision

The approved FE01-FE12 scope and Phase 3 delivery package are complete. The next
canonical source release is `v1.0.2`; create the tag only after H3 approval,
merge to `main`, and exact post-merge CI pass.

## Submission package

| Item | Status | Evidence |
| --- | --- | --- |
| Source code | PENDING H3 | GitHub release/tag `v1.0.2` after merge and exact post-merge CI. |
| Requirements and design | PASS | `document/RDS.md` and `document/SDS.md`. |
| Final release document | PASS | `document/FinalRelease.md`. |
| User documentation | PASS | `docs/user-manual.md` and system overview. |
| Phase 3 final report | PASS | `docs/release/phase3-final-report.md`. |
| Final governance closeout | H2-READY | `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`; implementation remains uncommitted. |
| Defense presentation | PASS | `docs/presentation/phase3-defense-deck.pptx` with source record and render QA. |
| Rehearsal | PASS | `docs/release/phase3-rehearsal-record.md` and demo runbook. |
| Automated quality | PASS | 916 backend tests, 152 frontend tests, coverage gate, lint, build, and 4/4 browser E2E. |
| Public Azure staging | PASS | Frontend, health, SQL catalog, CORS allow/deny, and protected-route six-check smoke. |
| Demonstration video/link | NOT PUBLISHED | No external video URL was provided or fabricated. |
| Authenticated Azure user observation | PASS | Live run `c6e0c46421f0` verified Admin/Member/Librarian login, protected reads, borrow request, approval, and return. |
| Real SMTP inbox delivery | PASS | Notification `8` was `SENT` in one attempt; provider acceptance and Gmail IMAP message search were observed. |

## Final operator checks

Run these commands only after H3 approval, merge to `main`, and exact
post-merge CI pass:

```powershell
git fetch origin --tags
git rev-list -n 1 v1.0.2
gh release view v1.0.2 --repo SWP391-LibraryManagement/LibraryManagement
gh run list --repo SWP391-LibraryManagement/LibraryManagement --branch main --limit 5
```

## Residual limitations

- Notification inbox UI remains outside the approved Phase 1 scope.
- Avatar storage on App Service is not production-durable.
- CI has no shared disposable SQL Server service.
- Student-credit staging has no production SLA.

These limitations are documented release boundaries, not unverified PASS
claims. Any new feature or production-hardening program requires a separately
approved Phase 4 specification package.
