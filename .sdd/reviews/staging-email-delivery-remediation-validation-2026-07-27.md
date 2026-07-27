# Staging Email Delivery Remediation Validation - 2026-07-27

Status: STAGING VALIDATION PASS; H3 AND MERGE PENDING

Baseline: `a408bf0808ed79eeb9dd4f2a6f9253f587dffa4b`

Branch: `codex/fix-staging-email-delivery`

Worktree: `.worktrees/fix-staging-email-delivery`

H2-reviewed product commits:

- `7920d4b` - restore the FE10 account-setup template;
- `2134d44` - preserve FE10 delivery evidence and SYSTEM processing boundary;
- `ccb590c` - process queued notifications automatically.
- `a98f459` - use Azure-compatible notification claim locks (H2 addendum).

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
| Migration executes twice with one canonical active row | PASS - both staging executions and the `1|1|1|1|1` aggregate are recorded below |
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
| L2 Spec compliance | PASS | FE10-S13 through FE10-S15 map to implementation/tests and corrected staging evidence |
| L3 Constitution and security | PASS | No role widening, public DTO/schema/dependency change, sensitive-content leak, unsafe new log, or leftover firewall rule |
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

## Initial Publication And Staging Evidence

- PR #65 published head
  `8f39baa0b58b772c462ea8d11a2049a1bfe102ce`.
- CI run `30272237192` passed dependency audits, traceability, backend tests and
  coverage, frontend tests/lint/build, browser E2E, deployment utilities, and
  backend import checks.
- The migration ran twice through one exact-IP temporary firewall rule.
- The post-migration aggregate was `1|1|1|1|1`: one matching row, one ACTIVE
  row, one canonical subject, and one row containing each required variable.
- The temporary migration firewall rule was removed; task-created rules
  remaining were zero.
- The three reviewed worker settings were applied without printing any SMTP or
  SQL secret.
- Manual deploy run `30272792025` used exact head `8f39baa` and passed backend,
  frontend, and staging smoke jobs.
- Independent checks returned API health 200, frontend `/home` 200, and
  anonymous manual queue processing 401.

## Staging Worker Finding And Safe Rollback

The first masked queue check found:

- 15 non-sensitive `PENDING` rows;
- zero new post-deploy delivery attempts;
- fixed-code `NOTIFICATION_WORKER_BATCH_FAILED` entries at startup and the next
  interval.

A transaction-rollback probe reproduced SQL Server error 650 before any
notification state change:

```text
You can only specify the READPAST lock in the READ COMMITTED or REPEATABLE READ
isolation levels.
```

Root cause: `claimNextPending()` combined `READPAST` with `HOLDLOCK`;
`HOLDLOCK` requests serializable isolation and is incompatible with
`READPAST`. The worker was immediately rolled back with
`NOTIFICATION_WORKER_ENABLED=false`. No queue row was claimed, no attempt was
created, and all task-created firewall rules were removed.

## H2 Addendum Decision

Scope is limited to:

- `backend/src/repositories/notificationRepository.js`;
- `backend/tests/notificationRepository.test.js`;
- this FE10 evidence/status update.

The candidate replaces `HOLDLOCK` with `READCOMMITTEDLOCK` while retaining
`UPDLOCK`, `READPAST`, and `ROWLOCK`. A direct Azure SQL transaction-rollback
probe returned one claimable row with the corrected hints.

Fresh addendum evidence:

| Check | Result |
| --- | --- |
| RED repository lock contract | PASS as RED - old hints failed the new Azure-compatible expectation |
| Azure SQL corrected-hint rollback probe | PASS - one claimable row, no mutation |
| Focused FE10/config/runtime gate | PASS - 6 suites, 165 tests |
| Full backend | PASS - 64 suites, 1,079 tests |
| System integration | PASS - 10/10 |
| Deployment utilities | PASS - 9/9 |
| Task-created firewall rules remaining | PASS - 0 |

The user approved the H2 addendum on 2026-07-27 after review of the bounded
two-file product diff and the fresh evidence above. The correction is committed
as `a98f459`.

## Corrected Redeploy And Final Staging Evidence

- Updated PR head `9240525129a8e0d5badf753ef5ef89d105caa232` passed CI run
  `30274110435`.
- Redeploy run `30274367534` passed backend, frontend, and staging smoke while
  the worker remained safely disabled.
- The corrected worker was then enabled at `2026-07-27T14:19:30Z`; the API
  returned health 200 after the settings restart.
- The mid-batch snapshot showed 8 SENT attempts and 8 provider IDs, proving
  active progress rather than a no-op.
- The final non-sensitive queue aggregate was `0|0|15|0`: zero PENDING, zero
  PROCESSING, 15 SENT, and zero FAILED.
- The final attempt aggregate was `15|15`: all 15 new attempts retained a
  provider message ID.
- The sensitive persistence aggregate was `21|0`: 21 sensitive rows checked
  and zero rows contained a persisted title/body or non-redacted safe payload.
- The SYSTEM audit aggregate was `1|0`: one actual batch audit and zero empty
  poll audits.
- API health and frontend `/home` returned 200. Anonymous access to the
  protected manual processing endpoint returned 401; the MEMBER denial remains
  covered by the exact-head CI authorization tests.
- Every exact-IP temporary SQL firewall rule was removed; task-created rules
  remaining were zero.
- No expired setup token was reused. Live sensitive inbox validation remains an
  explicit Admin-resend action that must create a fresh token/event.

## Remaining H3 Boundary

- App Service F1 remains best-effort: automatic processing pauses while the
  process sleeps.
- Rollback remains `NOTIFICATION_WORKER_ENABLED=false`.
- PR #65 must receive explicit H3 approval before merge.
- The documentation evidence commit must pass exact-head CI before merge.
