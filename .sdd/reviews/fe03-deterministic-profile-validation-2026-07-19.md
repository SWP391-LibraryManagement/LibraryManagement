# FE03 Deterministic Profile Validation

Date: 2026-07-19

Status: AUTOMATED AND SQL-BACKED PASS; HUMAN ACCEPTANCE PENDING

## Decision

- Delivery method: Hybrid, Standard depth.
- Core: own-profile authorization, exact PUT allowlist, mandatory atomic audit,
  deterministic missing-profile creation, avatar compensation, and safe logging.
- Shell: repository wiring, generated file cleanup helper, and focused test
  fixtures.

## Implemented Scope

- `PUT /api/profile/me` accepts only `fullName`, `address`, `dateOfBirth`, and
  `phone`; direct `avatarUrl`, protected, unknown, and empty payloads are
  rejected before mutation.
- The profile edit dialog has no direct Avatar URL field, and its PUT client
  sends only the four approved editable fields.
- Profile-field and avatar database updates require a safe audit entry inside
  the same SQL transaction.
- Missing-profile creation uses `UPDLOCK` and `HOLDLOCK` before inserting the
  unique `UserProfiles.UserId` row.
- Avatar database/audit failure triggers new-file compensation. Successful
  replacement commits first, then attempts managed old-file cleanup without
  rolling back committed profile state.
- Managed deletion refuses external URLs, nested paths, traversal paths, and
  dot-directory targets.
- Shared 5xx logging retains only error code, method, and path; raw error text,
  stack traces, and query strings are excluded.

## Traceability

| Requirement | Code and tests |
| --- | --- |
| BR-FE03-016, FR-FE03-006, AC-FE03-013 | backend service tests plus `profileFrontend.test.js` |
| BR-FE03-017, FR-FE03-010 | `profileRepository.js`, `profileRepository.test.js` |
| FR-FE03-001, AC-FE03-012 | locked `createBlankProfile`, service/repository tests |
| AC-FE03-014 | avatar service compensation, storage deletion tests, safe cleanup logging |
| SAFE-005, NFR-FE03-LOG-001 | `errorHandler.js`, `securityRegression.test.js`, route error tests |

## Automated Evidence

- Baseline before changes: backend 38 suites, 606/606; frontend 120/120.
- Focused FE03: 4 suites, 41/41.
- Focused FE03 coverage: statements 90.83%, branches 81.92%, functions
  92.30%, lines 93.54%.
- Full backend after changes: 40 suites, 632/632.
- Full frontend: 123/123.
- Frontend lint: pass.
- Frontend production build: pass with the existing project-wide chunk-size
  warning.
- Traceability enforcement: pass.
- FE03 source traceability reconciliation: 10/10 functional requirements tagged (100%).
- Playwright browser acceptance with intercepted API: valid PNG upload updated
  the displayed avatar; unsupported `.json` and a PNG larger than 2 MB showed
  the approved Vietnamese errors; the captured PUT body contained exactly
  `fullName`, `address`, `dateOfBirth`, and `phone`; browser console reported
  zero errors and zero warnings.
- Fresh exact-diff reconciliation gate passed: 5 focused backend suites, 48/48 tests;
  focused frontend 3/3; traceability 10/10 FE03 FR tags; `git diff --check` clean.
- Fresh isolated Playwright CLI acceptance on port `4185` reconfirmed the valid PNG flow,
  unsupported `.json` feedback, oversized 23 MB `.png` feedback, the exact four-field PUT
  payload, and a clean session with 0 console errors and 0 warnings. Port `4173` remained
  untouched because it belongs to the existing FE03 Vite process. Screenshot:
  `output/playwright/fe03-exact-profile-updated.png`.

## SQL-Backed Addendum

- `backend/tests/sql/profileConcurrency.sqltest.js` was added through RED-GREEN and passes 6/6 on the disposable reconciliation SQL Server runtime.
- Concurrent first views create exactly one `UserProfiles` row and return the same profile ID.
- Profile-field/phone and avatar URL changes roll back with their audit writes after injected failures.
- The aggregate SQL gate passes 8/8 suites and 61/61 tests with database/login cleanup.

## Remaining Gates

- Complete T-FE03-015 manual profile-screen checks for valid upload, invalid
  type, and oversized-file feedback. The automated browser pass above does not
  replace human L4 acceptance.
- Dat/Nhat must complete final B7/L4 output and integration review before FE03
  can be called complete or merged.
