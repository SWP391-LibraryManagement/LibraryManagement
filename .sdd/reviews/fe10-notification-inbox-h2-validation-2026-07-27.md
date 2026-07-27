# FE10 Personal Notification Inbox H2 Validation

Date: 2026-07-28  
Branch: `codex/feat-fe10-personal-notification-inbox`  
Baseline: `main@41282b4ebc37b327240fbef4df4dc28b7a9b617c`  
Status: **H2 APPROVED, THEN SUPERSEDED BY UPSTREAM CORE DRIFT**

This record preserves the first H2 decision against `main@41282b4`. A
post-approval fetch found four newer upstream commits ending at
`main@5a3c84b`, including overlapping deployment workflow, canonical schema,
operator guide, and deployment-test changes. No reviewed file was staged or
committed. The user approved `H1 drift addendum main@5a3c84b`; after that
rebase, upstream advanced by three additional commits through
`main@db97f17`, overlapping the frontend API and shared shell stylesheet. The
user approved `H1 drift addendum main@db97f17`, and the candidate was rebased
without conflict while preserving both contracts. Publication still requires
a new post-rebase fingerprint and a fresh H2 decision. A later upstream
test-only commit `main@f3ebe95` changed no candidate path and was synchronized
mechanically before that new fingerprint.

## 1. Candidate Identity

- Candidate entries: **47** modified or new files.
- Candidate fingerprint:
  `4bddfb5a24175b2663184c959e73656d6f215a600e351a1fe4a7ae6fa02f4478`.
- Migration SHA-256:
  `6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114`.
- Cached/staged files at fingerprint time: **0**.
- Unmerged paths and conflict markers: **0**.
- This validation record is deliberately excluded from the candidate
  fingerprint so that the approval status can be recorded without changing
  the reviewed product/spec candidate.

Fingerprint algorithm:

1. Read `git status --porcelain=v1 --untracked-files=all`.
2. Exclude only this validation record.
3. For every remaining file, create
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sort entries by case-sensitive path using PowerShell `Sort-Object`.
5. Join entries with LF, include one final LF, encode as UTF-8 without BOM,
   and calculate SHA-256.

## 2. H1 And Scope Reconciliation

- The user approved the FE10 v0.5.0 design, written SPEC, and FE10-I01..I08
  implementation plan.
- Governance PR #70 merged as `25c09ec`.
- The candidate was rebased onto `main@41282b4`.
- The user approved the H1 deployment addendum that preserves both successful
  `main`-CI automatic staging deployment and manual dispatch while requiring
  the exact FE10 migration hash in the GitHub `staging` Environment.
- No delete, archive, retention cleanup, global notification log, arbitrary
  action URL, sensitive authentication/setup inbox item, or FE09 fine
  calculation was added.

## 3. Four-Layer Review

### L1 - Contract And Traceability

**PASS**

- SPEC v0.5.0, PLAN, TASKS, CONTEXT, TEST_PLAN, CHANGELOG, architecture,
  OpenAPI, deployment guide, user manual, and implementation status agree.
- FE10-I01..I08 local scope is implemented and validated; H2, Azure staging,
  H3, merge, and post-merge evidence remain explicitly unclaimed.
- Enforced traceability passed with FE10 at **14/16 FR tags = 88%**, above the
  70% repository gate.

### L2 - Automated Quality

**PASS**

| Gate | Observed result |
| --- | --- |
| Backend coverage | 69/69 suites, 1111/1111 tests |
| Coverage | 91.84% statements, 80.70% branches, 97.59% functions, 91.76% lines |
| Frontend | 251/251 tests; ESLint pass; Vite production build pass |
| Deployment policy | 15/15 tests |
| System integration | 10/10 tests |
| Traceability state | 3/3 tests |
| Chromium E2E | 11/11; FE10-specific 3/3 |
| Git whitespace | `git diff --check` pass |
| High-confidence secret scan | 0 findings across 47 candidate files |

The isolated FE05 test that timed out only while backend coverage competed
with a parallel frontend build passed in 3.358 seconds. The full backend gate
then passed sequentially in 73.691 seconds, closing the contention diagnosis.

### L3 - Business And Security

**PASS**

- List, count, mark-one, and mark-all bind the authenticated `UserId` and apply
  the exact positive inbox type/template allowlist in SQL.
- `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `ACCOUNT_SETUP`, userless rows,
  other-user rows, and mismatched type/template rows remain outside the inbox.
- Missing, sensitive, and cross-user mark-one IDs share the same safe `404`.
- The response DTO has exactly seven safe fields and exposes no recipient,
  payload, idempotency, provider, attempt, delivery-error, or source metadata.
- Backend-derived `actionPath` uses a fixed relative allowlist; the frontend
  checks the same allowlist before navigation.
- `ReadAt` is orthogonal to delivery status, sent time, attempts, source
  outcome, and idempotency. Mark-one and mark-all replay are idempotent.
- `@Offset` is bound as SQL `BIGINT`; SQL Server accepted the maximum-contract
  offset probe `214748364600` without overflow.
- The shared count request is non-overlapping, refreshes after route/auth
  transition, focus, storage change, read mutations, and every 60 seconds.
- A read mutation failure shows safe feedback but does not block an already
  allowlisted business route.

### L4 - Migration And Release Safety

**LOCAL PASS; EXTERNAL GATES PENDING BY DESIGN**

- The migration uses required SQL Server SET options, a transaction,
  `XACT_ABORT`, dynamic compilation after adding `ReadAt`, exact first-run
  backfill, and idempotent index creation.
- A disposable SQL Server rehearsal executed the exact migration twice and
  returned:

```text
ReadAtColumns=1
SupportingIndexes=1
HistoricalBackfilled=5
PostRunStillUnread=1
ExcludedStillUnread=6
RowsAfterRun2=12
AttemptsAfterRun2=13
KeysAfterRun2=12
DisposableDatabasesRemaining=0
```

- Automatic and manual staging paths fail closed unless the checked-out
  migration SHA-256 equals `FE10_INBOX_MIGRATION_SHA256`.
- Manual deployment additionally requires
  `fe10_inbox_migration_confirmed=true`.
- Deployment order is preflight, backend, frontend, then smoke.
- Real Azure migration, exact-branch staging deployment, live three-role
  verification, H3, merge, post-merge CI, and automatic main deployment are
  intentionally pending until H2 approval and publication.

## 4. Findings Closed Before H2

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| H2-FE10-001 | High | SQL Server compiled the historical `ReadAt` update in the same batch before the new column existed. | Added RED coverage and moved update/index compilation behind `sys.sp_executesql`; the strict two-run rehearsal passed. |
| H2-FE10-002 | Medium | The FE09 synthetic token received 401 from the new background unread-count request, clearing the fake session and redirecting its E2E route to login. | Mocked only the new background endpoint in the FE09 fixture; focused FE09 and full 11/11 Chromium passed without weakening real 401 handling. |
| H2-FE10-003 | Medium | A contract-valid maximum page could produce an offset larger than SQL `INT` and fail with 500. | Added a RED repository assertion, changed only `@Offset` to SQL `BIGINT`, passed 5/5 focused tests, and verified the maximum offset directly on SQL Server. |
| H2-FE10-004 | Low | Current SPEC/agent status text still said I01..I07 or implementation not started after I08 local gates were green. | Synchronized SPEC traceability and current-state documentation without changing behavior. |

No open Critical, High, Medium, or Low finding remains in the reviewed local
candidate.

## 5. Candidate Manifest

```text
 M|74f7e0328ec6bc533bbb40373c20ddc1bcf362bc559dccb836c7e53f4841d3ce|.agents/CLAUDE.md
 M|a0f4d0d5f1bc36bc827e84044bbb81948df5be650fa722f5cdb275aa2f0cc560|.github/workflows/deploy-staging.yml
 M|405e3a962bb7a853af59b9bcb852240b64a0ff7f75f15370d70dad00e8500b89|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|a7264ac71895ddc40d824c27f3cf6f61b0062ccff2840bb5e304dd850bfc74c9|.sdd/specs/feat-notification-management/CONTEXT.md
 M|c6f02ad641c516ee0c6ae75c9ae02303600d61fd9212c48af34ae22fffd5891b|.sdd/specs/feat-notification-management/PLAN.md
 M|c5fee553ecb330cf19ae7da4468dd7ed16f410dea84d83ecc7824511e2facfbd|.sdd/specs/feat-notification-management/SPEC.md
 M|0110473b2ecc9d2371dd90ed468e5a7e3a5ed694d13e3a79b321c2c2dcb0ff1e|.sdd/specs/feat-notification-management/TASKS.md
 M|2ffe4d3e22d9d65ee0e393ec2fa5e9bbc88c761d068778858ae99a96ac35729d|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|f8935cbbe6aeef5929551e76c9269a850164a61867d0b54819d73c51518f9e87|backend/src/controllers/notificationController.js
 M|1a660891081188914b75c2675cd78ff242645ebb0bce30295cff844a8a104532|backend/src/docs/openapi.yaml
 M|45e0985ff360934561c435108129e7eef3aca761dfa2bfd2ec4012b632db8497|backend/src/models/Notification.js
 M|fb60bcbaa72eccfac8e7949410535ede72515170cf82cf1a7ae6497d9698c065|backend/src/repositories/notificationRepository.js
 M|481a58fbd8827543540e681d6c891eb586fefdf36bd1c7e2a49690e02eb1b7f2|backend/src/routes/notificationRoutes.js
 M|7cf429d8749d3ebb41dbdec7c4163ebceb2f3e335716265582e76a012a899d80|backend/src/services/notificationService.js
??|976bfe83f49644a3b6a681905f7ae3238b41b2c6103f0f227f552dc64fdcaf71|backend/src/utils/notificationInbox.js
 M|876ed4e7ec783e688705d7198e51fa8147421581ccb0843720c7db8a6bea7714|backend/src/validators/notificationValidators.js
 M|da9da91d5a1cbd692f42ae07caf6d1b61409247ae86ff826b7c10a59bcbf5d5a|backend/tests/helpers/inMemoryNotificationRepositories.js
 M|92afeaf998ec82e56279646c7951a78502f3c2d2bff7aa7a1976ca0ec8fc904d|backend/tests/helpers/systemIntegrationHarness.js
 M|a4fad5081a5281bf378888689f84d0748ae9a750912b279af01ff18c6b172523|backend/tests/integration.test.js
??|5a7937a8a395a3446cb90b5c1de255242b25114b79a6ac80b0af28400ffe1b39|backend/tests/notificationInboxMigration.test.js
??|acbbbf70a951af874837d4ab24128c6ecb5f5d008a9d6774805f5acdf662bffe|backend/tests/notificationInboxRepository.test.js
 M|d9edebf005b03079f8155f10076faa4f69564f717cd2fe11faa76cbe59bb2457|backend/tests/notificationRoutes.test.js
 M|5a05ca96ef0154640254d0a1c7db17c8168dfd0368bd858374bec63ca1431577|database/Librarymanagement.sql
??|6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114|database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
 M|a3bc88af7f4e98ba660a84587100f70d1a7a5883cda431d3594e484d2434b129|docs/architecture/feature-integration-map.md
 M|fa78dcace20b3822d0af2a6b7caa769b6e1dc35621f6d07d2ec38760edfea2e1|docs/architecture/system-architecture.md
 M|b521ae4ec9b36162c571f1dab8374ea033c0df0238620c2ffb4e529276cfd7fc|docs/deployment/azure-staging-guide.md
 M|be1e51f1c803e3e2f9f5321e00f220327af2826148232f6cb18daaf288fd0f3d|docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md
 M|bbf9227e53801386830488d61595c0c02409c1fb1cddddc3be3992621e8b9705|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|70d6b30e056ec269fb89af907c296f54e23a3fda7f9eb44c8c20ba867e81f380|docs/testing/master-test-plan.md
 M|18493952907f00d2cc4a72acbf1088c063b6ed103f6482504a1bb600479e0837|docs/user-manual.md
 M|4b6a961dd83521d3edcbb6499fb0b08bc4c6b679b8a26c0e7aa06c1061234a35|frontend/src/api/apiErrorMessages.js
 M|74bcba28356285d1ac14f665b4d389166fb0eefef80e2a474d9d99ff497f5be9|frontend/src/api/libraryFeatureApi.js
 M|005be9c2d1b9279562f06ecea93ca7e0efb8222be404cb31f496e7fc86550241|frontend/src/App.jsx
??|ef7c2ac784a8bf0f48cdd3ff8593af6891b45a1733d06214d2f4494eac4b52e2|frontend/src/component/auth/AuthenticatedRouteGuard.jsx
 M|d9323f38beda03679ef97d1dda24dcacbc4012bee8cf465a02d5ffe042a481f4|frontend/src/component/layout/Header.jsx
??|f672f3ef820343431b091f5f8fabc17f7e74b18501fa563e28274ce90fed493a|frontend/src/component/notification/NotificationBell.jsx
??|620271d2b7319cebb8e9be609eca63af822811ce5001655f0569b0e7c713e3a7|frontend/src/context/NotificationInboxContext.jsx
??|e39fcf6982b488c9b8df54ba9ec17826a6bf51e9fb886f60502d6dc94df7d502|frontend/src/page/notification/NotificationsPage.jsx
 M|c7d238231c0478372fb1af89cffcf7ece6faa1fe18ef4eabd0386de41f56ad05|frontend/src/styles/app-shell.css
??|fce2174bbe273a43142dbfc1f55a811a5d9acf83ccf60b8fcf2ef2229acbd3c4|frontend/src/utils/notificationInboxViewModel.js
 M|07c999eac3208cb07c3ef1299619f1855847e7c2290772535d065ac80a3bc1cf|frontend/test/appShellFrontend.test.js
??|3840d9b20450799689678e5a6f881d10cb0dc954538a7d8b05ad46228f5e1758|frontend/test/notificationInboxFrontend.test.js
 M|e2ef4e88d50bce93ddf5273c56b1ee02dfc85515af85b3de7f16e08fc19201e2|tests/deployment/stagingWorkflowPolicy.test.js
 M|fd6f190b510a6b90254440e840428e46e56e318f8aaccd88813d0fe9c034c2d2|tests/e2e/fe09-fine-management.spec.js
??|d5be78f15340be11782f90dfb75df74062e743323dc953348b6d2fb9cee1d6eb|tests/e2e/fe10-notification-inbox.spec.js
 M|7d71c0c33860b7a1bb5f9ca5889e6c0525444f581b0e2338e0ff9ae511ad2600|tests/e2e/support/systemTestServer.js
```

## 6. Human H2 Decision

The user approved this exact candidate in the active task on 2026-07-28:

```text
duyệt H2 fingerprint 4bddfb5a24175b2663184c959e73656d6f215a600e351a1fe4a7ae6fa02f4478
```

Decision: **APPROVED**. H2 authorizes staging the reviewed candidate plus this
excluded decision record, committing, pushing the branch, publishing a draft
PR, and transitioning it to ready for review after required PR checks pass.

Supersession: that authority expired before use when the required remote fetch
found overlapping Core drift. `CACHED_COUNT=0` and no commit/push occurred
under this fingerprint.
