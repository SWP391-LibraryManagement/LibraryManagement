# FE11 Admin Role UI Contract Validation

Date: 2026-07-18

Scope: FE11-UIR01..UIR05 / TD-022 only

Status: B7 INTEGRATION COMPLETE

## L1 Automated Evidence

| Check | Result |
| --- | --- |
| Focused frontend | PASS - 12/12 tests across the FE11 API and Admin page contracts |
| Full frontend | PASS - 101/101 tests |
| Frontend lint | PASS |
| Frontend production build | PASS; the existing bundle-size advisory remains non-blocking |
| Focused backend role regression | PASS - 3 suites, 105/105 tests |
| Traceability enforcement | PASS |
| Diff check | PASS against `origin/main...HEAD` |
| Scope check | PASS - backend, database, FE11 `SPEC.md`, and dependencies are unchanged |
| Security scan | PASS - no added secret assignment, key material, hardcoded role ID, or role-name mutation fallback |
| PR #30 CI run `29643619999` | PASS - `foundation-checks` completed successfully before merge |
| Post-merge `main` CI run `29644292781` | PASS - `foundation-checks` completed successfully on merge commit `c20d3251` |

Observed RED-GREEN evidence:

- `FE11-UIR01`: RED exposed legacy `roleName` assignment/revocation requests; GREEN passed 6/6 focused API tests with numeric `roleId`.
- `FE11-UIR02`: RED produced two catalog-contract failures; GREEN passed 4/4 focused Admin page tests with complete positive/unique catalog validation.
- `FE11-UIR03`: RED exposed the direct role-name loops and missing no-op branch; GREEN passed 5/5 focused Admin page tests with preflight planning and assignment-before-revocation order.
- `FE11-UIR04`: RED exposed missing target reload and modal synchronization; GREEN passed 6/6 focused Admin page tests with reconciliation and unsynchronized Save lock.

Validation commands:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userManagementRoutes.test.js tests/userManagementService.test.js tests/userRoleRepository.test.js
node --test frontend/test/userManagementFrontend.test.js frontend/test/userManagementApi.test.js
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check origin/main...HEAD
```

## L2 Spec Compliance

- `FR-FE11-012` / `AC-FE11-013`: assignment now crosses the frontend API boundary only as `{ roleId: number }`, with the ID resolved from authenticated `GET /api/users/roles` data.
- `FR-FE11-013` / `AC-FE11-014`: revocation now uses the numeric `roleId` path segment and never interpolates a role name.
- `FR-FE11-014` / `AC-FE11-015`: the existing locked backend last-Admin rule remains unchanged and passes the 105-test focused role regression.
- `FR-FE11-024..027`: backend validation and deterministic role outcomes remain authoritative; the modal displays the mapped safe error and reloads the target after the first failed mutation.
- `BR-FE11-007..009`: the complete editable diff is validated before requests, assignments run before revocations, no-op saves send no mutation, and non-editable existing roles are preserved.
- `PRE-FE11-004`: only a complete catalog for `ADMIN`, `LIBRARIAN`, and `MEMBER` with positive unique IDs enables the role flow; invalid or missing catalog data blocks mutation without a hardcoded fallback.
- Whole-feature `Implementation State: DEFERRED` remains unchanged, and no unrelated FE11 behavior is claimed complete.

## L3 Constitution And Safety

- Role IDs come only from the authenticated role catalog and are normalized to positive unique integers before mutation.
- Frontend `requireAdminSession` remains a usability guard; backend authorization, validation, locked transaction behavior, and audit ownership remain the security authority and are unchanged.
- Assignment, revocation, catalog reads, and reconciliation reads continue through the authorized request wrapper.
- The complete name-to-ID plan is built before the first request, preventing partial work caused by an invalid local catalog.
- Safe API errors are rendered as React text; no stack trace, SQL detail, credential, or token data is introduced.
- No backend, schema, dependency, production configuration, FE11 `SPEC.md`, secret, or credential change is included.
- Security review found no actionable issue in the bounded diff.

## L4 Acceptance And Residual Risks

- The successful path satisfies the approved numeric assignment/revocation contract and deterministic assignment-before-revocation sequence.
- Multi-request UI saves are not atomic. The approved recovery boundary is to stop on the first failure, reload the authoritative target, keep the modal open, and disable Save if that reload also fails.
- Frontend Node tests verify source/API orchestration contracts; no new role-specific browser interaction test was added. Existing browser E2E remains CI regression evidence.
- Real SQL Server concurrent last-Admin execution remains environment-dependent; the unchanged backend repository/service/route regression remains the automated boundary for this slice.
- The Vite build retains the pre-existing large-chunk advisory; it is unrelated to TD-022.
- Navigation, Permissions, Audit Logs, Request Management, update/deactivation, list-envelope drift, and all other FE11 debt remain deferred.

## Files Changed

- FE11 planning/evidence: `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md`, `TECH_DEBT.md`, approved design/implementation plan, and this validation record.
- Frontend API: `frontend/src/api/userManagementApi.js` and its focused contract test.
- Admin role flow: `frontend/src/page/UserManagement.jsx` and its focused catalog/order/reconciliation tests.
- No backend, database, schema, dependency, or FE11 `SPEC.md` file changed.

## Human Review Gate

Approved on 2026-07-18. The human reviewer approved the implementation, automated evidence, bounded scope, and documented multi-request reconciliation risk. PR #30 and post-merge CI now satisfy the remaining integration gate, so `FE11-UIR05` is complete.

## Integration State

Complete. PR #30 merged into `main` as `c20d3251254467a1543355f18c705590724f5b55`; post-merge CI run `29644292781` passed all `foundation-checks`. `TD-022` is resolved for this bounded slice. Whole-feature `Implementation State: DEFERRED` and unrelated FE11 debt remain unchanged.
