# FE10 Personal Notification Inbox Staging And H3 Closeout

- Updated: 2026-07-28
- Pull request: #75
- H3 round-one base: `main@a5fcbb989d730923548a67a789a1447b180de2a9`
- H3 round-one head: `28c4f80ca6e249b7802caf854f9fa42cb4840158`
- Current H1-approved base: `main@30f936d644c2034bbbf9cb4e01ba25feab31595c`
- Rebased local committed head: `c72bc77f996a160333c2cb7ee4399f3d591fe17c`
- Last fully deployed/reviewed head: `cf0a2364b9f526dae4f4e873f261764ea43da777`
- Final H2/H3-reviewed head: `778e0a470d8a1083bf571a8007b3c058eee4bb22`
- PR #75 merge commit: `b75776b10d6cf4b6868d2ba51eb3268073483b8b`
- Status: **COMPLETE — PR #75 MERGED; POST-MERGE CI/AZURE PASS**

This record now closes the approved FE10-I08 chain with immutable evidence.
The historical sections retain the first H3 outcome and remediation path;
Sections 2 and 6 record the final head, H3 approval, merge, and post-merge
CI/Azure results without adding a new behavior claim.

## 1. Reviewed Candidate And Approval Chain

- Governance PR #70 merged as `25c09ec`.
- H2 round-two candidate fingerprint:
  `2b53d7ecd2247aa72e7ae3c43bab5bd00ab48f0e5a97662455fa8d3db736b40c`.
- Cross-platform migration-hash H2 addendum fingerprint:
  `f78e0cc9ac7ca5f2f89cb2fe50fe6224c4f02f96fd0492d4674b2e713927f541`.
- The user approved H1 drift reconciliation through
  `main@a5fcbb989d730923548a67a789a1447b180de2a9`.
- The user later approved the non-overlapping H1 drift addendum through
  `main@12faeadb9a92fa30cc8dc16aa01467577374c8b0`. The rebase completed without
  conflict; the incoming drift deletes only retired `document/` artifacts and
  does not overlap this remediation's files.
- H2 round 3 was approved but stopped before use when the mandatory pre-stage
  fetch found `main@a240705fbd486304464b073cbd3caec77a1fa135`. The user approved
  that H1 drift addendum; the upstream FE11 Admin edit-action removal passed CI
  `30311801599` and Azure deployment `30311973740`, and the FE10 branch rebased
  without conflict.
- Historical head `cf0a2364b9f526dae4f4e873f261764ea43da777`
  subsequently passed CI `30315046007`, Azure staging `30315273298`, and final
  separate Standards/Spec H3 reviews with no actionable finding.
- H2 round 7 approved a three-line whitespace-only correction, but the
  mandatory pre-stage fetch found `main@30f936d644c2034bbbf9cb4e01ba25feab31595c`.
  The user approved that H1 drift addendum. No file was staged, committed, or
  pushed under round-7 authority.
- `main@30f936d` translates SDD documentation to Vietnamese and has no runtime,
  API, migration, UI, or test overlap with FE10. Exact upstream CI
  `30315665010` and automatic Azure staging `30315842152` passed. The branch
  rebased without runtime conflict and preserved the translated FE10 SPEC.
- H2 round 8 approved fingerprint
  `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
  PR #75 then published final head `778e0a470d8a1083bf571a8007b3c058eee4bb22`.
- Separate Standards and Spec H3 reviews on that exact head returned no
  actionable finding; the user explicitly approved H3. PR #75 merged as
  `b75776b10d6cf4b6868d2ba51eb3268073483b8b`.

## 2. Exact-Head CI And Azure Staging Evidence

| Gate | Exact evidence | Result |
| --- | --- | --- |
| Final PR CI | Run `30317424995`, head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | PASS |
| Final manual Azure staging | Run `30317621429`, head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | PASS |
| Post-merge CI | Run `30341279111`, merge `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | PASS |
| Post-merge automatic Azure staging | Run `30341540847`, merge `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | PASS |
| PR CI | Run `30306805399`, head `28c4f80ca6e249b7802caf854f9fa42cb4840158` | PASS |
| Manual Azure staging | Run `30307855616`, head `28c4f80ca6e249b7802caf854f9fa42cb4840158` | PASS |
| Deployment jobs | Preflight, migration/backend, frontend, smoke | PASS |
| Public transport | HTTPS frontend/API, HTTP redirect, approved CORS allowed, malicious origin omitted | PASS |
| Live roles | MEMBER, LIBRARIAN, ADMIN own-inbox flows | PASS |

Azure SQL verification established:

- one nullable `Notifications.ReadAt` column and one
  `IX_Notifications_User_ReadAt_CreatedAt` index after repeated migration;
- historical eligible rows backfilled while the post-run-one probe stayed
  unread;
- sensitive, userless, and cross-user rows excluded from personal operations;
- mark-one replay preserved the first read timestamp and mark-all replay
  returned `updated: 0`;
- protected notification/delivery/attempt aggregates returned to their
  pre-probe values;
- all synthetic users, notifications, tokens, audits, and temporary Azure SQL
  firewall rules created by the task were removed.

## 3. H3 Round-One Result

H3 round one reviewed `main@a5fcbb9...28c4f80` on separate Standards and Spec
axes and returned **FAIL**.

### Standards findings

1. `ADR-002-database-design.md` did not record the approved `ReadAt` column,
   supporting index, migration, or Azure deployment boundary.
2. FE10 source-of-truth files still reported H2/redeploy pending and referenced
   old baselines after the addendum, CI, Azure deployment, and live checks had
   passed.

### Spec findings

1. This required current-state closeout record was absent.
2. A successfully read item with `actionPath: null` or another non-navigated
   result stayed visually unread because `/notifications` did not reload its
   list after the successful mutation.
3. `Đánh dấu tất cả đã đọc` was disabled when the current filtered page was
   empty, even though unread rows could exist in another filter.

### User-reported visual finding

A staging screenshot showed page content painted over the open notification
popover. Root cause was the blurred `.app-topbar` creating a stacking context
without an explicit sibling stack level; the later `.app-content` could paint
above the popover even though the popover itself had `z-index: 90`.

## 4. Local Remediation State

The bounded remediation:

- records the personal read-state schema decision in ADR-002;
- reconciles current lifecycle status across FE10 SPEC/PLAN/TASKS/CONTEXT,
  test/developer/design documentation, this closeout, and the changelog;
- reloads the current notification page after a successful read that does not
  navigate away;
- disables mark-all only while loading or while the mutation is pending;
- assigns `.app-topbar` a normal `position: relative; z-index: 40` and elevates
  it to `z-index: 100` only while it contains the open notification popover.
  The popover keeps its approved dimensions while the open state sits above
  every current layout layer, including modal (`50`), mobile navigation
  (`60`/`70`), and toast (`80`).

Focused frontend RED reproduced the page-state and stacking contracts. Focused
GREEN then passed 16/16 tests. This is local evidence only; it does not replace
the complete remediation gates.

Fresh complete local gates on the H1-approved `main@12faead` base passed:
backend 69/69 suites and 1116/1116 tests with configured coverage; frontend
259/259 plus lint/build; deployment 20/20; system 10/10; traceability state
3/3 and FE10 enforced coverage 14/16 (88%); Chromium 11/11; dependency audits,
Azure schema preparation, diff hygiene, and contradiction, unfinished-marker,
and conflict scans. These results authorize only preparation of the new H2
candidate.

The later automatic deployment of `main@a240705` temporarily meant Azure
staging no longer served the unmerged PR #75 candidate. Historical run
`30307855616` remains valid for head `28c4f80`; that condition was subsequently
closed by H2 round 4, publication of `3f9f23a`, and exact-head Azure deployment
`30313949983`.

Fresh complete local gates after the approved `main@a240705` rebase passed:
backend 69/69 suites and 1084/1084 tests with configured coverage; frontend
259/259 plus lint/build; deployment 20/20; system 10/10; traceability state
3/3 and FE10 14/16 (88%); Chromium 11/11; audits, Azure schema preparation,
and diff hygiene. The lower backend count is the expected result of upstream
removing obsolete FE11 edit-action tests, not a skipped FE10 test.

## 5. Runtime Exact-Head Evidence

- H2 round 4 fingerprint
  `f41dbf50680d9c5601ae00d3c53651a7bb782ff81724ca641ef49b7cd88844e4`
  was explicitly approved.
- The approved remediation was committed and pushed as PR #75 head
  `3f9f23a0bc8705590a977e31b03b05a6d2845628`.
- Exact-head CI `30313721511` passed.
- Manual Azure staging deployment `30313949983` passed preflight, backend,
  frontend, and smoke jobs.
- `https://www.thuvienhub.io.vn` returned `200`; backend health and readiness
  returned `ok`; anonymous `GET /api/notifications/mine` returned protected
  `401` with the exact approved CORS origin.
- Direct read-only Azure SQL verification found exactly one nullable `ReadAt`
  column and exactly one `IX_Notifications_User_ReadAt_CreatedAt` index.
  Temporary probe rows and temporary exact-IP firewall rules were removed.
- Historical three-role own-record/sensitive-exclusion/read-replay evidence on
  `28c4f80` remains applicable to the unchanged FE10 backend contract. Exact
  remediation-head local Chromium covers the changed page-state and stacking
  behavior; the deployed frontend was additionally observed on the Azure
  domain rather than localhost.

## 6. Completed Mandatory Gates

| Gate | Immutable evidence | Result |
| --- | --- | --- |
| Post-drift H2 | Fingerprint `e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15` | APPROVED |
| Exact-head quality/deployment | CI `30317424995`; Azure staging `30317621429`; head `778e0a470d8a1083bf571a8007b3c058eee4bb22` | PASS |
| H3 | Separate Standards and Spec reviews: no actionable finding; user explicitly approved the exact head | APPROVED |
| Integration | PR #75 merged as `b75776b10d6cf4b6868d2ba51eb3268073483b8b` | PASS |
| Post-merge runtime | CI `30341279111`; automatic Azure staging `30341540847` | PASS |

The closeout changes only evidence/status fields and approved task transitions.
No business rule, schema, API, UI behavior, Azure configuration, or database
data is changed by this record.
