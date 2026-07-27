# FE10 Personal Notification Inbox Staging And H3 Closeout

- Updated: 2026-07-28
- Pull request: #75
- H3 round-one base: `main@a5fcbb989d730923548a67a789a1447b180de2a9`
- H3 round-one head: `28c4f80ca6e249b7802caf854f9fa42cb4840158`
- Current H1-approved base: `main@a240705fbd486304464b073cbd3caec77a1fa135`
- Current rebased committed head: `883157124edf295f12683548754a881383431664`
- Status: **AZURE STAGING PASS; H3 ROUND ONE FAILED; REMEDIATION IN PROGRESS**

This record closes no gate early. It reconciles the exact Azure evidence and
the first H3 outcome required by the approved FE10-I08 plan. A later section
must record the new exact head, CI, Azure deployment, repeated H3 decision,
merge, and post-merge runs only after each event occurs.

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
- PR #75 remained open, ready, clean, and mergeable at the reviewed head.

## 2. Exact-Head CI And Azure Staging Evidence

| Gate | Exact evidence | Result |
| --- | --- | --- |
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

The later automatic deployment of `main@a240705` means Azure staging no longer
serves the unmerged PR #75 candidate. Historical run `30307855616` remains valid
for head `28c4f80`, but the rebased remediation must receive fresh H2, be
published at a new exact head, and be redeployed before repeated H3.

Fresh complete local gates after the approved `main@a240705` rebase passed:
backend 69/69 suites and 1084/1084 tests with configured coverage; frontend
259/259 plus lint/build; deployment 20/20; system 10/10; traceability state
3/3 and FE10 14/16 (88%); Chromium 11/11; audits, Azure schema preparation,
and diff hygiene. The lower backend count is the expected result of upstream
removing obsolete FE11 edit-action tests, not a skipped FE10 test.

## 5. Remaining Mandatory Gates

1. Produce a fresh H2 remediation fingerprint and obtain explicit H2 approval.
2. Commit/push the approved remediation and wait for exact-head PR CI.
3. Redeploy that exact head to Azure staging and repeat Azure SQL/API/browser
   verification and cleanup.
4. Repeat separate Standards and Spec H3 review on the exact deployed head.
5. Obtain explicit H3 approval before merge.
6. Merge PR #75, then verify exact post-merge `main` CI and automatic Azure
   staging deployment before claiming completion.
