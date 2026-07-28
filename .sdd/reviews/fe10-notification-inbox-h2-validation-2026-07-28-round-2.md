# FE10 Personal Notification Inbox H2 Validation - Round 2

- Date: 2026-07-28
- Branch: `codex/feat-fe10-personal-notification-inbox`
- Baseline: `main@f3ebe95ed00cef5119d2b6788ebccd72c5cda190`
- Status: **H2 APPROVED**

This record supersedes the first H2 validation after the candidate was rebased
onto the two approved Core-drift baselines and then mechanically synchronized
with the later non-overlapping test-only upstream commit. No reviewed file is
staged or committed, and nothing has been pushed under this fingerprint.

## 1. Candidate Identity

- Candidate entries: **49** modified or new files.
- Candidate fingerprint:
  `2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.
- Migration SHA-256:
  `6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114`.
- Candidate baseline and `origin/main`:
  `f3ebe95ed00cef5119d2b6788ebccd72c5cda190`.
- Ahead/behind candidate baseline: **0/0**.
- Cached/staged files at fingerprint time: **0**.
- Unmerged paths and conflict markers: **0**.
- This round-2 validation record is deliberately excluded from the candidate
  fingerprint so the human decision can be recorded without changing the
  reviewed product/spec candidate.

Fingerprint algorithm:

1. Read `git status --porcelain=v1 -z --untracked-files=all`.
2. Exclude only
   `.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-28-round-2.md`.
3. For every remaining file, create
   `<two-character-status>|<lowercase-file-sha256>|<normalized-path>`.
4. Sort entries by case-sensitive path.
5. Join entries with LF, include one final LF, encode as UTF-8 without BOM,
   and calculate SHA-256.

## 2. H1 And Scope Reconciliation

- The user approved the FE10 v0.5.0 design, written SPEC, and FE10-I01..I08
  implementation plan.
- Governance PR #70 merged as `25c09ec`.
- The candidate was first reconciled with approved H1 drift addendum
  `main@5a3c84b`, then with approved H1 drift addendum `main@db97f17`.
- The later `main@f3ebe95` synchronization changed only three upstream
  frontend test files outside the candidate paths and applied without
  conflict.
- Both upstream and FE10 contracts remain present in the shared frontend API
  and shell stylesheet.
- No delete, archive, retention cleanup, global notification log, arbitrary
  action URL, sensitive authentication/setup inbox item, or FE09 fine
  calculation was added.

## 3. Four-Layer Review

### L1 - Contract And Traceability

**PASS**

- SPEC v0.5.0, PLAN, TASKS, CONTEXT, TEST_PLAN, CHANGELOG, architecture,
  OpenAPI, deployment guide, user manual, and implementation state agree.
- FE10-I01..I08 local scope is implemented and validated; H2, Azure staging,
  H3, merge, and post-merge evidence remain explicitly unclaimed.
- Enforced traceability passed with FE10 at **14/16 FR tags = 88%**, above the
  repository's 70% gate. Traceability state tests passed **3/3**.

### L2 - Automated Quality

**PASS**

| Gate | Observed result |
| --- | --- |
| Backend coverage | 69/69 suites, 1114/1114 tests |
| Coverage | 91.84% statements, 80.70% branches, 97.59% functions, 91.76% lines |
| Frontend | 258/258 tests; ESLint pass; Vite production build pass |
| Focused backend inbox and fan-in | 8/8 suites, 300/300 tests before the final security consistency fix |
| Focused frontend inbox and shell | 39/39 tests |
| Deployment policy | 15/15 tests |
| System integration | 10/10 tests |
| Chromium E2E | 11/11; FE10-specific 3/3 |
| Git whitespace | Product/spec candidate check passes; see the governance-record note below |
| Backend dependency audit | 0 vulnerabilities |
| High-confidence secret scan | 0 real findings across 49 candidate files |

The three secret-scan text matches are synthetic `Password1!` test fixtures;
none is an added secret. The frontend audit reports
`GHSA-qwww-vcr4-c8h2` for the pinned React Router version, but the official
advisory limits the issue to unstable RSC APIs. This application uses
Declarative Mode only (`BrowserRouter`, `Routes`, and `Route`), and the
repository's fail-closed `audit:high` policy passed while also asserting that
no RSC API is introduced.

After staging, the complete `git diff --cached --check` reports only three
intentional GFM hard-breaks in the superseded 2026-07-27 H2 evidence record.
That immutable record is part of the approved fingerprint. The same check
excluding the two H2 governance records passes with exit code `0`; no
product, test, workflow, SPEC, or operator-guide line has a whitespace error.

### L3 - Business And Security

**PASS**

- List, count, mark-one, and mark-all bind the authenticated `UserId` and use
  the exact positive inbox type/template allowlist in SQL.
- `ACCOUNT_VERIFICATION`, `PASSWORD_RESET`, `EMAIL_VERIFY`,
  `ACCOUNT_SETUP`, userless rows, other-user rows, and mismatched
  type/template rows remain outside the inbox.
- Missing, sensitive, and cross-user mark-one IDs share the same safe `404`.
- The response DTO has exactly seven safe fields and exposes no recipient,
  payload, idempotency, provider, attempt, delivery-error, or source metadata.
- Backend-derived `actionPath` uses a fixed relative allowlist; the frontend
  checks the same allowlist before navigation.
- SQL inputs are parameterized, ownership filters are applied in SQL, and the
  maximum-contract offset is bound as SQL `BIGINT`.
- `ReadAt` is orthogonal to delivery status, sent time, attempts, source
  outcome, and idempotency. Mark-one and mark-all replay are idempotent.
- The shared count request is non-overlapping and refreshes after route/auth
  transition, focus, storage change, read mutations, and every 60 seconds.
- A read mutation failure shows safe feedback but does not block an already
  allowlisted business route.

The final security review found that the legacy SQL `listPending` helper
omitted `ACCOUNT_SETUP` from its negative sensitive-type filter, while the
active `claimNextPending` path and in-memory implementation already excluded
it. A RED test reproduced the inconsistency. The minimal production fix added
`ACCOUNT_SETUP` to both the type and template exclusions; the focused result
was **3/3 suites, 161/161 tests**, followed by the full backend result of
**69/69 suites, 1114/1114 tests**. No blocking security finding remains.

### L4 - Migration And Release Safety

**LOCAL PASS; EXTERNAL GATES PENDING BY DESIGN**

- The migration uses required SQL Server SET options, a transaction,
  `XACT_ABORT`, dynamic compilation after adding `ReadAt`, exact first-run
  backfill, and idempotent index creation.
- A disposable SQL Server database executed the exact migration twice and
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
ProtectedAggregatesUnchanged=1
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

## 4. Findings Closed Before Round-2 H2

| ID | Severity | Finding | Resolution |
| --- | --- | --- | --- |
| H2-FE10-001 | High | SQL Server compiled the historical `ReadAt` update in the same batch before the new column existed. | Added RED coverage and moved update/index compilation behind `sys.sp_executesql`; strict two-run rehearsal passed. |
| H2-FE10-002 | Medium | The FE09 synthetic token received 401 from the new background count request and redirected its E2E route to login. | Mocked only the new background endpoint in the FE09 fixture; full Chromium passed without weakening real 401 handling. |
| H2-FE10-003 | Medium | A contract-valid maximum page could produce an offset larger than SQL `INT`. | Added a RED repository assertion, bound only `@Offset` as SQL `BIGINT`, and verified the maximum offset on SQL Server. |
| H2-FE10-004 | Low | Current status text still said I01..I07 or implementation not started. | Synchronized traceability and current-state documentation without changing behavior. |
| H2-FE10-005 | Medium | Legacy `listPending` did not exclude `ACCOUNT_SETUP` consistently with the active selector. | Added a RED security consistency test and excluded `ACCOUNT_SETUP` by both type and template; full backend passed. |

No open Critical, High, Medium, or Low finding remains in the reviewed local
candidate.

Known release limitations are explicit rather than treated as completed:

- Azure staging has not run for this uncommitted candidate.
- The F1 producer worker remains best-effort by design.
- The pinned frontend router advisory is accepted only under the enforced
  Declarative-Mode/no-RSC constraint described above.

## 5. Candidate Manifest

```text
 M|5155db679c33485fb377ce9c42bd6f395b87d8ae8232ec6945acccfe8361f0db|.agents/CLAUDE.md
 M|30b6bb6d86ce10953f9a101ea183486ba32d177bc8e517d357a5a953c7db487f|.github/workflows/deploy-staging.yml
??|e979d3632c601d5496fa537999344ef5bd799a62d0845bd56b09afe0c1a159f7|.sdd/reviews/fe10-notification-inbox-h2-validation-2026-07-27.md
 M|80595f9e499499ab49a58ecc7a97091828c5af2df790a45b583b3596d4189a60|.sdd/specs/feat-notification-management/CHANGELOG.md
 M|27dc8f4d0811d4b16da1379da5fd0d9db455d4f364e1a9d1c7200ce87fde8d63|.sdd/specs/feat-notification-management/CONTEXT.md
 M|f56e8680241f3591ea066d11f400faca19a1df9ab3974bd5bb805a8273d463af|.sdd/specs/feat-notification-management/PLAN.md
 M|097f4e177b4dfde106b7d19fa8651a73006dd2182704f8fd817b5b5d0bd0075c|.sdd/specs/feat-notification-management/SPEC.md
 M|674eec9a7979cb496d5273469425dd3d72ff44bc7e8d7991ad0e9d6208d02148|.sdd/specs/feat-notification-management/TASKS.md
 M|f6f567fa0656cbb1b13ffacc11dc668dda36e4ea5d17b0e194cbd6d76476e49f|.sdd/specs/feat-notification-management/TEST_PLAN.md
 M|f8935cbbe6aeef5929551e76c9269a850164a61867d0b54819d73c51518f9e87|backend/src/controllers/notificationController.js
 M|1a660891081188914b75c2675cd78ff242645ebb0bce30295cff844a8a104532|backend/src/docs/openapi.yaml
 M|45e0985ff360934561c435108129e7eef3aca761dfa2bfd2ec4012b632db8497|backend/src/models/Notification.js
 M|69431b35de2a2184a6bb324b00c7dfbf32d2c43e6993e06bf722c7b20b038e75|backend/src/repositories/notificationRepository.js
 M|481a58fbd8827543540e681d6c891eb586fefdf36bd1c7e2a49690e02eb1b7f2|backend/src/routes/notificationRoutes.js
 M|7cf429d8749d3ebb41dbdec7c4163ebceb2f3e335716265582e76a012a899d80|backend/src/services/notificationService.js
??|976bfe83f49644a3b6a681905f7ae3238b41b2c6103f0f227f552dc64fdcaf71|backend/src/utils/notificationInbox.js
 M|876ed4e7ec783e688705d7198e51fa8147421581ccb0843720c7db8a6bea7714|backend/src/validators/notificationValidators.js
 M|da9da91d5a1cbd692f42ae07caf6d1b61409247ae86ff826b7c10a59bcbf5d5a|backend/tests/helpers/inMemoryNotificationRepositories.js
 M|92afeaf998ec82e56279646c7951a78502f3c2d2bff7aa7a1976ca0ec8fc904d|backend/tests/helpers/systemIntegrationHarness.js
 M|a4fad5081a5281bf378888689f84d0748ae9a750912b279af01ff18c6b172523|backend/tests/integration.test.js
??|5a7937a8a395a3446cb90b5c1de255242b25114b79a6ac80b0af28400ffe1b39|backend/tests/notificationInboxMigration.test.js
??|7bb3b0680648515691fd01766d73446ffd31bab918265e3dae0b65843d2abc8d|backend/tests/notificationInboxRepository.test.js
 M|d95b65f07b15396226e2a623c909777a105a439e7ca8b0fbcffb1adf38902faf|backend/tests/notificationRepository.test.js
 M|d9edebf005b03079f8155f10076faa4f69564f717cd2fe11faa76cbe59bb2457|backend/tests/notificationRoutes.test.js
 M|8d741a26f05d443fe74090c0eb766dd691cd45947126333908e2c68dd49bf611|database/Librarymanagement.sql
??|6e8b6b4d857170be215ef721d9c3d3d25ff16bbaf7d006821fbba33110d2d114|database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql
 M|a3bc88af7f4e98ba660a84587100f70d1a7a5883cda431d3594e484d2434b129|docs/architecture/feature-integration-map.md
 M|fa78dcace20b3822d0af2a6b7caa769b6e1dc35621f6d07d2ec38760edfea2e1|docs/architecture/system-architecture.md
 M|b5e731a88618526939f575be3585b646e60be089ca7089fdae4cee6b5bcbcd18|docs/deployment/azure-staging-guide.md
 M|0dd836091a2afaa50fa3c8555942c23c95e789e2ebf8b860a6d7bc86f3909f21|docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md
 M|d2f2e031fe195d449b6431dceeefb28ed319a2847bce6d46dfb1f9c6c9fbd372|docs/superpowers/specs/2026-07-27-fe10-notification-inbox-expansion-design.md
 M|b5dc1404258a486dfe465497f8e8e36b6024257c4bc254eaf30bff3fbd02025d|docs/testing/master-test-plan.md
 M|18493952907f00d2cc4a72acbf1088c063b6ed103f6482504a1bb600479e0837|docs/user-manual.md
 M|4b6a961dd83521d3edcbb6499fb0b08bc4c6b679b8a26c0e7aa06c1061234a35|frontend/src/api/apiErrorMessages.js
 M|8f89b50ad97c8d24bad40bd6db089f4ca5151eadd6cc11a3586cbfc701fb1b2b|frontend/src/api/libraryFeatureApi.js
 M|005be9c2d1b9279562f06ecea93ca7e0efb8222be404cb31f496e7fc86550241|frontend/src/App.jsx
??|ef7c2ac784a8bf0f48cdd3ff8593af6891b45a1733d06214d2f4494eac4b52e2|frontend/src/component/auth/AuthenticatedRouteGuard.jsx
 M|d9323f38beda03679ef97d1dda24dcacbc4012bee8cf465a02d5ffe042a481f4|frontend/src/component/layout/Header.jsx
??|f672f3ef820343431b091f5f8fabc17f7e74b18501fa563e28274ce90fed493a|frontend/src/component/notification/NotificationBell.jsx
??|620271d2b7319cebb8e9be609eca63af822811ce5001655f0569b0e7c713e3a7|frontend/src/context/NotificationInboxContext.jsx
??|e39fcf6982b488c9b8df54ba9ec17826a6bf51e9fb886f60502d6dc94df7d502|frontend/src/page/notification/NotificationsPage.jsx
 M|67f36d22ffb99894e89ad09e4268d0697b62646d0964c263ef0d419b7d8bbfa0|frontend/src/styles/app-shell.css
??|fce2174bbe273a43142dbfc1f55a811a5d9acf83ccf60b8fcf2ef2229acbd3c4|frontend/src/utils/notificationInboxViewModel.js
 M|07c999eac3208cb07c3ef1299619f1855847e7c2290772535d065ac80a3bc1cf|frontend/test/appShellFrontend.test.js
??|3840d9b20450799689678e5a6f881d10cb0dc954538a7d8b05ad46228f5e1758|frontend/test/notificationInboxFrontend.test.js
 M|4dc4d17d9970d5f8acfa1d7af94fe2ac784bc67ba1175549b3a61b0f4824a7c7|tests/deployment/stagingWorkflowPolicy.test.js
 M|e1fc71ff5769b60ceb986eb8480d456c313bd9e7584992dd23024a959ede32c5|tests/e2e/fe09-fine-management.spec.js
??|d5be78f15340be11782f90dfb75df74062e743323dc953348b6d2fb9cee1d6eb|tests/e2e/fe10-notification-inbox.spec.js
 M|7d71c0c33860b7a1bb5f9ca5889e6c0525444f581b0e2338e0ff9ae511ad2600|tests/e2e/support/systemTestServer.js
```

## 6. Human H2 Decision

The user approved this exact candidate in the active task on 2026-07-28:

```text
duyệt H2 fingerprint 2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c
```

Decision: **APPROVED**.

This exact approval authorizes staging the reviewed candidate plus this
excluded decision record, committing, pushing the branch, and publishing the
pull request. Any candidate-content change after this approval invalidates the
authority and requires a new H2 decision.
