# FE10 Personal Notification Inbox Staging Hash H2 Addendum

- Date: 2026-07-28
- Branch: `codex/feat-fe10-personal-notification-inbox`
- Local reviewed head before addendum commit:
  `47efcd20c834dfe34e73ae1aa60ba388a0e8c822`
- Current base: `main@804b6957b9e71591eb00fa2ad84d3175e63ffbff`
- Pull request: #75
- Status: **H2 ADDENDUM APPROVED**

This addendum covers the bounded remediation discovered by the first exact-head
Azure staging deployment. It does not reopen the FE10 inbox business contract
approved under round-two H2 fingerprint
`2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.

## 1. Addendum Identity

- Addendum entries: **9** modified files.
- Addendum fingerprint:
  `f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541`.
- Cached/staged files at fingerprint time: **0**.
- Unmerged paths: **0**.
- The local FE10 commit was mechanically rebased from `b11b59e` through
  non-overlapping `main@2c0b169` and then `main@804b695` as `47efcd2`.
- The upstream changes affected only FE02 login/account-lock/registration
  files and had no overlap with the nine addendum files. Intermediate
  `main@2c0b169` passed CI run `30304860723`; current `main@804b695` passed CI
  run `30306335582`.
- This evidence record is excluded from the fingerprint so its decision field
  can be updated without changing the reviewed addendum.

Fingerprint algorithm:

1. Read `git status --porcelain=v1 -z --untracked-files=all`.
2. Exclude only this addendum evidence record.
3. Create
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>` for
   every remaining file.
4. Sort by case-sensitive path, join with LF plus one final LF, encode as
   UTF-8 without BOM, and calculate SHA-256.

## 2. Pre-Finding Publication Evidence

- Round-two H2 approved the 49-entry FE10 candidate.
- Commit `b11b59ed37c6666e9b459e457517e440d5135565` was pushed to PR #75.
- Exact-head PR CI run `30304661463` passed `foundation-checks` in 3m35s.
- PR #75 was moved from draft to ready-for-review only after that CI passed.

## 3. Azure Migration Evidence

The reviewed migration bytes applied by the Windows operator have SHA-256:

```text
6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114
```

The exact staging database changed from zero FE10 schema objects to the
required schema, and the migration ran twice:

```text
PRE_READAT_COLUMNS=0
PRE_SUPPORTING_INDEXES=0
TOTAL_NOTIFICATIONS_BEFORE=42
ELIGIBLE_HISTORICAL_BEFORE=17
EXCLUDED_BEFORE=25
MIGRATION_RUN_1=PASS
READAT_COLUMNS=1
SUPPORTING_INDEXES=1
HISTORICAL_BACKFILLED=17
ELIGIBLE_STILL_UNREAD_AFTER_RUN1=0
EXCLUDED_STILL_UNREAD_AFTER_RUN1=25
PROTECTED_AGGREGATES_AFTER_RUN1=UNCHANGED
POST_RUN1_PROBE_INSERTED_UNREAD=1
MIGRATION_RUN_2=PASS
POST_RUN1_PROBE_STILL_UNREAD=1
READAT_COLUMNS_AFTER_RUN2=1
SUPPORTING_INDEXES_AFTER_RUN2=1
HISTORICAL_BACKFILLED_AFTER_RUN2=17
POST_RUN1_PROBE_REMOVED=1
FINAL_PROTECTED_AGGREGATES=UNCHANGED
CODEX_FE10_FIREWALL_RULES_REMAINING=0
```

The aggregate comparison covered notification row count, delivery-status
counts, `SentAt` count, summed `AttemptCount`, notification-attempt row count,
and non-null idempotency-key count. No recipient, notification body, user
identity, credential, token, or provider detail was logged.

## 4. Staging Finding And Root Cause

Manual exact-head deployment run `30305596861` checked out `b11b59e`, received
`fe10_inbox_migration_confirmed=true`, and read the expected stored hash
correctly. It failed closed in preflight before backend or frontend deployment.

The same unchanged UTF-8 migration text has these platform byte hashes:

```text
LF    143cd8e4c9a1d4f84f8ea3d0fa9dff2effb4edb0128ee51f6a1b60da98e0a43d
CRLF  6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114
```

The Windows operator applied and recorded the CRLF bytes. The Ubuntu GitHub
runner checked out LF bytes. The original raw-byte equality gate therefore
rejected unchanged content. This was a cross-platform proof defect, not a SQL
migration failure, credential failure, or content mismatch.

## 5. Focused Remediation

- Preflight decodes strict UTF-8 without BOM emission.
- It normalizes the checked-out text to LF, derives the corresponding exact
  CRLF representation, and calculates SHA-256 for both byte sequences.
- The stored operator hash must equal exactly one of those two values.
- Any content change remains rejected; a runtime mutation probe produced
  neither accepted hash.
- The operator guide continues to require hashing the bytes actually applied
  and now documents the LF/CRLF boundary.
- Current FE10 state documentation records the real PR, CI, migration,
  failed-deploy, and addendum state without claiming staging success.

No inbox API, DTO, SQL query, migration statement, frontend component,
business rule, dependency, credential, or Azure resource is changed by this
addendum.

## 6. TDD And Regression Evidence

RED:

- Deployment policy: **15/16 passed, 1 failed** because the workflow did not
  derive LF and CRLF hashes.

GREEN after the focused change and non-overlapping rebase:

| Gate | Result |
| --- | --- |
| Deployment policy | 16/16 |
| Backend | 69/69 suites, 1114/1114 tests |
| System integration | 10/10 |
| Frontend | 259/259; ESLint pass; Vite build pass |
| Chromium E2E | 11/11, including FE10 3/3 |
| Traceability state | 3/3 |
| Enforced traceability | PASS; FE10 14/16 = 88% |
| Diff whitespace | PASS |
| Hash runtime check | Stored CRLF accepted; LF accepted; content mutation rejected |

Updated exact-head PR CI and staging redeployment remain intentionally
unclaimed until this addendum is approved, committed, and pushed.

## 7. Operational Items Outside This Addendum

- Azure App Service was observed with `httpsOnly=false`; this operational
  finding was closed after the fingerprint without changing candidate
  content. The exact staging app now reports `httpsOnly=true`, HTTPS `/health`
  and `/health/ready` return 200, and HTTP `/health` returns 301 to HTTPS.
- `https://www.thuvienhub.io.vn` is the configured staging frontend URL and
  returned 200. The apex `thuvienhub.io.vn` had no address record during the
  preflight; it is not the configured workflow target and is not claimed.

## 8. Addendum Manifest

```text
 M|6f18590e8c6a7a026b6417673a6bba1c6ed6a3bb05001a3634e1f91b5f655672|.github/workflows/deploy-staging.yml
 M|22107ba34aba87dfaa847071714e36183c28938aaf7e1f24c8585f7bf0d8ee6d|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|dd879baf5bdb7973b2511cc091761dd762fff17e8572c8d0e2c26443b8fe3ea3|.sdd/specs/feat-notification-management/CONTEXT.md
 M|0874cf24d4752fe43c30503ea513c9cac95264c05b10e00f63ffeddd12dd3606|.sdd/specs/feat-notification-management/PLAN.md
 M|327ca48ca7c6cb2f348acdda026eea51c4590e83f0b82e1a3af4395b6f250a9b|.sdd/specs/feat-notification-management/SPEC.md
 M|5cb51057dfe69ca581edd0ce27230ac5cef018fe1556b47e258a155b6b5331bb|.sdd/specs/feat-notification-management/TASKS.md
 M|1432ec850fd4aa97da15e48bae68279d66fed3ef3aba1145933ffa32742f7772|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|54e0f5f138bc1776804cf318eb80a2c924d1efec3268d726822bcda99ccbd9fe|docs/deployment/azure-staging-guide.md
 M|3ca62a39e1ec720a3723285c6b24cf7df8a03cba7a5b7906ec4cb6f513abdfd6|tests/deployment/stagingWorkflowPolicy.test.js
```

## 9. Human H2 Addendum Decision

The user approved this exact addendum in the active task on 2026-07-28:

```text
duyệt H2 addendum fingerprint f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541
```

Decision: **APPROVED**.

This exact approval authorizes staging these nine files plus this excluded
decision record, committing them on top of rebased FE10 head `47efcd2`,
force-pushing with lease to PR #75, and rerunning exact-head CI and Azure
staging deployment.
