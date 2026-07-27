# Staging Email Delivery Remediation Validation - 2026-07-27

Status: H2 PASS; PUBLICATION, CI, STAGING VALIDATION, AND H3 PENDING

Baseline: `a408bf0808ed79eeb9dd4f2a6f9253f587dffa4b`

Branch: `codex/fix-staging-email-delivery`

Worktree: `.worktrees/fix-staging-email-delivery`

H2-reviewed product commits:

- `7920d4b` - restore the FE10 account-setup template;
- `2134d44` - preserve FE10 delivery evidence and SYSTEM processing boundary;
- `ccb590c` - process queued notifications automatically.

## Scope

- Restore the canonical active `ACCOUNT_SETUP` template in an existing database
  with an additive, transactional, repeatable migration.
- Preserve only the SMTP adapter message ID for successful sensitive FE02 and
  FE11 delivery attempts.
- Process only non-sensitive `PENDING` notifications through an opt-in,
  lifecycle-managed, non-overlapping SYSTEM worker.
- Preserve protected human HTTP processing, manual-only failed retry, current
  role boundaries, minimal DTOs, and provider-memory-only credentials.
- Keep the Azure App Service F1 limitation explicit: the worker runs only while
  the application process is awake.

## RED Evidence

| Slice | RED command | Proven failure before implementation |
| --- | --- | --- |
| FE10-S13 | `npx jest --runInBand --runTestsByPath tests/notificationRepository.test.js` | The contract test failed with `ENOENT` because the dated `ACCOUNT_SETUP` migration did not exist. |
| FE10-S14 | `npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js` | Three FE02/FE11 success assertions expected the mock provider message ID and received `null`. |
| FE10-S15 | `npx jest --runInBand --runTestsByPath tests/envConfig.test.js tests/notificationWorker.test.js tests/serverRuntime.test.js` | Worker configuration/factory/runtime modules were absent, so construction and lifecycle tests failed before production changes. |
| SYSTEM empty-poll regression | `npx jest --runInBand tests/notificationRoutes.test.js -t "does not audit empty SYSTEM queue polls"` | The empty poll produced one `NOTIFICATION_PROCESS_PENDING` audit with zero processed and failed rows. |

The empty-poll correction is deliberately scoped: SYSTEM skips only no-op
audits, while actual SYSTEM work and the existing human endpoint remain
audited.

## Fresh Automated Evidence

| Check | Result |
| --- | --- |
| Focused FE10/config/runtime gate | PASS - 6 suites, 165 tests |
| Full backend | PASS - 64 suites, 1,079 tests |
| Frontend tests | PASS - 232/232 |
| Deployment tests | PASS - 9/9 |
| System integration | PASS - 10/10 |
| Frontend lint | PASS |
| Frontend production build | PASS with Vite 8.0.16 |
| Traceability enforcement | PASS - FE10 10/10; no implemented feature below 70% |
| Diff whitespace check | PASS |

## Requirement And Safety Review

| Review item | Result |
| --- | --- |
| Migration is additive and transactional | PASS locally: update-or-insert, `XACT_ABORT`, transaction, rollback/rethrow, no delete |
| Migration executes twice with one canonical active row | PENDING H2-authorized staging execution |
| SYSTEM is construction-bound, not a login role | PASS |
| Human HTTP authorization and response DTOs are unchanged | PASS |
| Sensitive success evidence stores only the adapter message ID | PASS |
| Sensitive OTP/setup content stays out of persistence, audit, logs, attempts, and responses | PASS through existing regression assertions |
| Worker overlap is prevented and later passes recover | PASS |
| Automatic processing excludes sensitive queue identifiers | PASS |
| `FAILED` delivery remains manual-only | PASS |
| Disabled mode creates no timer and shutdown clears scheduling | PASS |
| Empty SYSTEM polls do not flood audit storage | PASS |
| Worker failures log a fixed code without recipient/provider error text | PASS |
| Public routes, schemas, dependencies, and role permissions changed | NO |
| Committed credentials or real recipient data found | NO |

The secret scan matched only the deliberate fake `provider-secret` and
`example.test` values in the worker log-redaction test. No production credential
value or unsafe new production log was found.

## Validation Layers

| Layer | Status | Evidence / remaining boundary |
| --- | --- | --- |
| L1 Automated | PASS | Focused and full local gates above are fresh after the final regression correction |
| L2 Spec compliance | PASS LOCALLY | FE10-S13 through FE10-S15 map to implementation/tests; live two-pass migration remains pending |
| L3 Constitution and security | PASS LOCALLY | No role widening, public DTO/schema/dependency change, sensitive-content leak, or unsafe new log |
| L4 Human acceptance | H2 PASS | H1 approved the design; the user approved this complete candidate on 2026-07-27; H3 remains pending before merge |

## H2 Decision

The user approved H2 on 2026-07-27 after review of the complete uncommitted
candidate and fresh L1-L3 evidence. H2 confirmed:

- the migration is additive and repeatable;
- SYSTEM does not become a login role;
- protected human processing and manual failed retry remain unchanged;
- only the provider message ID is retained for sensitive success attempts;
- automatic passes cannot overlap or retry `FAILED`;
- F1 best-effort behavior and rollback by
  `NOTIFICATION_WORKER_ENABLED=false` are stated accurately;
- no secret or real recipient data appears in the reviewed set.

The exact reviewed product set is committed above. Publication and exact-head
CI are still required before any staging mutation. Staging evidence must record
setting names only, masked aggregate counts, provider-ID presence only, two
migration executions, deployment run/commit, temporary firewall cleanup, and
the F1 limitation.
