# Full Project Closeout PR A Shell Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Keep the diff uncommitted until the repository H2 gate is explicitly approved.

**Goal:** Publish already-proven PR #95 closeouts and refresh the current security/release truth without changing product behavior or prematurely publishing `v1.0.3`.

**Architecture:** PR A is the Shell slice of the approved four-PR closeout design. It consumes immutable GitHub and audit evidence, updates only bounded SDD/governance documents, and leaves FE11 Core, FE04 acceptance, FE02 reconciliation, final exact-SHA release publication, and all product behavior to PR B-D.

**Tech Stack:** Markdown SDD records, Git/GitHub CLI, Node.js traceability and security gates, PowerShell on Windows.

## Approved baseline and invariants

- Approved design: `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`, commit `62e1302`.
- Clean starting point before the design commit: `origin/main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`.
- PR #95 merged head: `3a87ee8324f493f5e50d0806ec90cd7a9dcc4f1f`; merge commit: `e01585a9aa7d603daf932f7ac6459eaa0752746c`.
- PR #95 post-merge CI `30711057582` and staging deployment `30711210037` both succeeded on `e01585a9aa7d603daf932f7ac6459eaa0752746c`.
- PR #97 merged head: `5276b29756762a723a7abff4941cf4e1adb965b1`; merge commit: `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`.
- Current-baseline CI `30726791185` and staging deployment `30726924615` both succeeded on `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`.
- Published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`.
- `GHSA-qwww-vcr4-c8h2` now reports `react-router@8.3.0` as the first patched version. React Router v8 is a major migration that removes `react-router-dom` and raises the Node/React baselines, so dependency/code changes remain outside PR A.
- Demonstration video decision is `WAIVED — NOT REQUIRED`, approved by Nhat on 2026-08-02. Do not create a link or artifact.
- Close only `FE02-T067`, `FE05-T019`, and `FE11-CAT01` from PR #95 evidence.
- Preserve `FE02-T049`, FE04 open acceptance tasks, `FE09-B7`, FE11 Core/UX/lifecycle/personal-data/human-acceptance tasks, and every unrelated checkbox.
- Do not change backend, frontend, database, workflows, dependencies, lockfiles, API contracts, schemas, roles, or requirement meaning.
- Do not edit the original dirty checkout. All execution stays in `.worktrees/full-project-closeout-v1.0.3-design`.
- Do not tag or publish `v1.0.3` in PR A. That action belongs only to PR D after its exact-SHA H3 and post-merge validation.

## File responsibility map

- `.sdd/specs/feat-auth/TASKS.md`: close only `FE02-T067` with bounded evidence.
- `.sdd/specs/feat-auth/SPEC.md`: change only the `AC-FE02-024` status cell.
- `.sdd/specs/feat-auth/CHANGELOG.md`: add the PR #95 FE02 closeout entry.
- `.sdd/specs/feat-book-management/TASKS.md`: close only `FE05-T019`.
- `.sdd/specs/feat-book-management/CHANGELOG.md`: add the atomic catalog-audit closeout entry.
- `.sdd/specs/feat-user-role-management/TASKS.md`: close only `FE11-CAT01`.
- `.sdd/specs/feat-user-role-management/SPEC.md`: change only the `AC-FE11-026` and `FR-FE11-043` status cells.
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`: add the bounded Admin metadata closeout entry.
- `docs/security/react-router-rsc-audit-exception-2026-07-25.md`: append dated revalidation and removal triggers.
- `README.md`: replace stale current-status/security statements with the 2026-08-02 closeout baseline and video waiver.
- `plan.md`: replace the stale top-level delivery state with the four-PR closeout state.
- `TECH_DEBT.md`: replace the false all-COMPLETE statement and empty open-debt claim with measured FE02/FE04/FE11 gaps.
- `docs/release/final-submission-checklist-2026-07-20.md`: refresh the candidate baseline, release boundary, current evidence, and video decision.
- `docs/release/phase3-final-report.md`: preserve the historical Phase 3 snapshot and add an explicit 2026-08-02 closeout refresh.
- `docs/superpowers/plans/2026-08-02-full-project-closeout-pr-a-shell.md`: keep the executable security commands and expected advisory metadata aligned with the fail-closed revalidation result.
- `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`: record the completed written H1 approval without changing any approved decision or boundary.

---

### Task 1: Revalidate immutable evidence before editing

**Files:**

- Read: `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`
- Read: `.sdd/specs/feat-auth/TASKS.md`
- Read: `.sdd/specs/feat-book-management/TASKS.md`
- Read: `.sdd/specs/feat-user-role-management/TASKS.md`

**Interfaces:**

- Consumes: GitHub PR #95/#97, four workflow runs, `origin/main`, and the published release list.
- Produces: a fail-closed evidence decision for Tasks 2-5.

- [ ] **Step 1: Confirm the worktree and exact starting branch**

Run:

```powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
```

Expected: the branch is `codex/full-project-closeout-v1.0.3-design`, the worktree has only the committed design/plan history when implementation starts, and `origin/main` is `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`. If `origin/main` moved, fetch it, inspect the intervening commits, and stop for design revalidation rather than silently rebasing.

- [ ] **Step 2: Confirm PR #95 and its post-merge runs**

Run:

```powershell
gh pr view 95 --json number,state,mergedAt,mergeCommit,headRefOid,url,statusCheckRollup
gh run view 30711057582 --json headSha,conclusion,event,workflowName,url
gh run view 30711210037 --json headSha,conclusion,event,workflowName,url
```

Expected:

- PR #95 is `MERGED` with head `3a87ee8324f493f5e50d0806ec90cd7a9dcc4f1f` and merge commit `e01585a9aa7d603daf932f7ac6459eaa0752746c`;
- the PR check rollup contains no failed or pending check;
- both workflow conclusions are `success` and both `headSha` values are `e01585a9aa7d603daf932f7ac6459eaa0752746c`.

Stop without editing if any value differs.

- [ ] **Step 3: Confirm the PR #95 implementation commits and scope**

Run:

```powershell
git show --stat --oneline e64c636
git show --stat --oneline 3a87ee8
git diff --name-only 16286fc..3a87ee8
```

Expected: `e64c636` is the catalog metadata transaction/audit slice, `3a87ee8` is the auth runtime/session-audit slice, and no unapproved schema, endpoint, role, or successful-response contract was introduced.

- [ ] **Step 4: Confirm the current pre-batch baseline**

Run:

```powershell
gh pr view 97 --json number,state,mergedAt,mergeCommit,headRefOid,url,statusCheckRollup
gh run view 30726791185 --json headSha,conclusion,event,workflowName,url
gh run view 30726924615 --json headSha,conclusion,event,workflowName,url
gh release list --limit 5
gh release view v1.0.2 --json tagName,targetCommitish,publishedAt,url
```

Expected:

- PR #97 is `MERGED` with merge commit `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`;
- CI `30726791185` and staging `30726924615` are `success` for that exact SHA;
- `v1.0.2` is still latest and targets `c988af1f605e32f7207ad51c4657ea07656941b0`;
- no `v1.0.3` release exists.

Any changed release state blocks the release-document edits until the plan is reconciled.

---

### Task 2: Close the three PR #95 documentation tasks

**Files:**

- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**

- Consumes: Task 1 PASS for PR #95.
- Produces: exactly three closed task checkboxes and three bounded status updates.

- [ ] **Step 1: Replace only the FE02-T067 task block**

Use this exact block:

```markdown
- [x] **FE02-T067 - Củng cố bcrypt, OTP response, HTTPS và audit session nguyên tử.**
  - Ánh xạ tới: BR-FE02-005, BR-FE02-011, BR-FE02-016, BR-FE02-017, BR-FE02-020; AC-FE02-024; NFR-FE02-SEC-001/003/015, NFR-FE02-TXN-002, NFR-FE02-LOG-001/002.
  - Bằng chứng: commit `3a87ee8`, PR #95, foundation checks thành công, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`; kiểm thử auth/config/HTTPS tập trung, backend đầy đủ, coverage, system/E2E/deployment, traceability và secret scan đạt trong lô đã duyệt.
  - Ranh giới: hoàn tất fail-fast bcrypt, loại debug OTP, HTTPS `/api`, audit nguyên tử cho đăng nhập thành công/đăng xuất; audit login attempt/failure/lock/auto-unlock vẫn ngoài phạm vi và không được suy diễn là fail-closed.
```

- [ ] **Step 2: Update only the AC-FE02-024 status cell**

Keep every other cell unchanged. Replace `PENDING FE02-T067` with:

```markdown
COMPLETE - PR #95; CI `30711057582`; staging `30711210037`
```

- [ ] **Step 3: Add the FE02 changelog entry above the 2026-08-01 activation entry**

```markdown
## 2026-08-02 - Hoàn tất lô củng cố runtime và session-audit FE02

- Hoàn tất `FE02-T067` qua commit `3a87ee8`, PR #95, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`.
- Giữ audit login attempt/failure/lock/auto-unlock ngoài tuyên bố hoàn tất của lô này.
```

- [ ] **Step 4: Replace only the FE05-T019 task block**

```markdown
- [x] **FE05-T019 - Ghi audit nguyên tử cho mutation dữ liệu tham chiếu catalog.**
  - Ánh xạ tới: NFR-FE05-TXN-001, NFR-FE05-LOG-001; tích hợp FE11 `BR-FE11-033`, `FR-FE11-043`, `AC-FE11-026`.
  - Bằng chứng: commit `e64c636`, PR #95, foundation checks thành công, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`; controller/service/repository/projector RED-GREEN, backend đầy đủ/coverage, traceability, secret scan, system/E2E/deployment đạt.
  - Ranh giới: mutation và audit dùng một transaction SQL tham số hóa; update/deactivate không tồn tại không trả thành công giả; không đổi schema, endpoint, role, envelope hoặc quyền sở hữu trạng thái bản sao FE06.
```

- [ ] **Step 5: Add the FE05 changelog entry above the 2026-08-01 activation entry**

```markdown
## 2026-08-02 - Hoàn tất audit nguyên tử cho dữ liệu tham chiếu catalog

- Hoàn tất `FE05-T019` qua commit `e64c636`, PR #95, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`.
- Giữ nguyên schema, endpoint, role, response envelope và soft-deactivation hiện có.
```

- [ ] **Step 6: Replace only the FE11-CAT01 task block**

```markdown
- [x] **FE11-CAT01 - Làm mutation metadata Quản trị có audit nguyên tử.**
  - Ánh xạ tới: BR-FE11-033, FR-FE11-043, AC-FE11-026, NFR-FE11-TXN-007, NFR-FE11-LOG-003; FE05-T019.
  - Bằng chứng: commit `e64c636`, PR #95, foundation checks thành công, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`; role boundary, controller/service/repository/projector, backend đầy đủ/coverage, traceability, secret scan, system/E2E/deployment đạt.
  - Ranh giới: COMPLETE chỉ cho mutation metadata Admin và lựa chọn metadata chỉ đọc của Librarian; không đóng các task FE11 UX, personal-data hoặc human acceptance khác.
```

- [ ] **Step 7: Update only the AC-FE11-026 and FR-FE11-043 status cells**

Keep every other cell unchanged. Replace each current partial status with:

```markdown
COMPLETE - FE11-CAT01; PR #95; CI `30711057582`; staging `30711210037`
```

- [ ] **Step 8: Add the FE11 changelog entry above the 2026-08-01 activation entry**

```markdown
## 2026-08-02 - Hoàn tất audit nguyên tử cho metadata Quản trị

- Hoàn tất `FE11-CAT01`, `AC-FE11-026` và `FR-FE11-043` trong phạm vi metadata qua commit `e64c636`, PR #95, CI sau merge `30711057582` và staging deployment `30711210037` trên `e01585a`.
- Không thay đổi trạng thái các lát cắt FE11 UX, personal-data hoặc nghiệm thu con người còn mở.
```

---

### Task 3: Revalidate the controlled React Router audit exception

**Files:**

- Read: `frontend/package-lock.json`
- Read: `frontend/scripts/audit-high.js`
- Read: `frontend/src/main.jsx`
- Read: `frontend/src/App.jsx`
- Modify: `docs/security/react-router-rsc-audit-exception-2026-07-25.md`

**Interfaces:**

- Consumes: installed dependency versions, npm advisory output, GitHub advisory metadata, and source-mode proof.
- Produces: a dated, fail-closed exception record; no dependency or lockfile change.

- [ ] **Step 1: Confirm exact installed versions and the controlled audit behavior**

Run:

```powershell
npm.cmd --prefix frontend ls react-router react-router-dom
npm.cmd --prefix frontend run audit:high
```

Expected: `react-router-dom@7.18.1` resolves with nested `react-router@7.18.1`; the guard exits `0` and reports only accepted `GHSA-qwww-vcr4-c8h2` under the Declarative Mode constraint.

- [ ] **Step 2: Inspect the raw high-severity audit and advisory**

Run:

```powershell
$prAAuditJson = npm.cmd --prefix frontend audit --audit-level=high --json 2>$null
$prAAudit = $prAAuditJson | ConvertFrom-Json
$prAAudit.metadata.vulnerabilities
$prAAudit.vulnerabilities.PSObject.Properties | ForEach-Object { [PSCustomObject]@{ package = $_.Name; severity = $_.Value.severity; via = ($_.Value.via | ConvertTo-Json -Compress) } }
gh api /advisories/GHSA-qwww-vcr4-c8h2
```

Expected: raw audit contains only the two controlled `react-router` and `react-router-dom` High findings for this advisory; there is no Critical or unrelated High. The advisory has affected range `>= 7.12.0, < 8.3.0`, `first_patched_version=8.3.0`, and `updated_at=2026-07-24T16:44:43Z` unless upstream has changed it. Official v8 documentation also confirms Node 22.22+, React/ReactDOM 19.2.7+, and removal of `react-router-dom`, which makes the upgrade a separately approved migration rather than a PR A lockfile edit.

Stop and redesign the exception if the advisory, package set, severity, range, or patched-version metadata changed.

- [ ] **Step 3: Prove the frontend remains Declarative Mode only**

Run:

```powershell
rg -n "BrowserRouter|Routes|Route" frontend/src/main.jsx frontend/src/App.jsx
rg -n "createBrowserRouter|RouterProvider|HydratedRouter|RSCStaticRouter|RSCHydratedRouter|unstable_RSC" frontend/src
```

Expected: the first command proves `BrowserRouter`/`Routes`/`Route`; the second command returns no matches. Any blocked API invalidates the exception.

- [ ] **Step 4: Append the exact revalidation record**

Append:

```markdown
## Revalidation — 2026-08-02

- Owner: project frontend maintainer (Nhat).
- Installed versions: `react-router@7.18.1`, `react-router-dom@7.18.1`.
- Advisory: `GHSA-qwww-vcr4-c8h2`; upstream updated at `2026-07-24T16:44:43Z`; affected range `>= 7.12.0, < 8.3.0`; the official response now reports `first_patched_version: 8.3.0` for `react-router`.
- Migration boundary: React Router v8 requires Node 22.22+ and React/ReactDOM 19.2.7+, and removes `react-router-dom`. This repository's manifests allow React/ReactDOM from `^19.2.6` and the lockfile currently resolves `19.2.7`, but source still imports the removed `react-router-dom` package and the new Node baseline still requires full toolchain validation. Upgrading to 8.3.0 is therefore a dedicated dependency/code/regression batch outside documentation-only PR A.
- Full audit result: only the two controlled React Router package findings are High; no other High or Critical finding is accepted.
- Runtime scope proof: `frontend/src/main.jsx` and `frontend/src/App.jsx` use Declarative `BrowserRouter`, `Routes`, and `Route`; the blocked RSC and Framework/Data Router API scan returned no match.
- Enforcement proof: `npm --prefix frontend run audit:high` passed and still fails closed on version drift, another High/Critical advisory, missing `BrowserRouter`, or a blocked API.

## Next review and removal triggers

- Review on every React Router dependency change, every advisory update, or by 2026-08-16, whichever happens first.
- Replace this exception through a separately approved React Router v8 migration that removes `react-router-dom`, meets the new runtime/React baselines, and passes frontend tests, lint, build, raw audit, Playwright, CI, and staging acceptance.
- Invalidate the exception immediately if RSC, Framework Mode, Data Router, server actions, or a second High/Critical finding enters the frontend.
```

Do not edit `frontend/package.json`, `frontend/package-lock.json`, or `frontend/scripts/audit-high.js` in PR A.

---

### Task 4: Refresh top-level project and release truth

**Files:**

- Modify: `README.md`
- Modify: `plan.md`
- Modify: `TECH_DEBT.md`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`
- Modify: `docs/release/phase3-final-report.md`

**Interfaces:**

- Consumes: Task 1 immutable evidence, Task 2 bounded closeouts, Task 3 audit result, and approved decisions BD-001/BD-002/BD-006.
- Produces: one consistent interim release narrative while PR B-D remain open.

- [ ] **Step 1: Replace README Project Status lines 12-18 with the exact interim block**

```markdown
- Full closeout is active as four bounded PRs: PR A Shell truth, PR B FE11 Core, PR C FE04 acceptance/FE02 reconciliation, and PR D final release evidence.
- Pre-batch baseline: `origin/main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97; CI `30726791185` and staging deployment `30726924615` pass for that exact SHA.
- Published source release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. `v1.0.3` is not authorized until PR D passes H3, merge, exact post-merge CI/deploy, smoke, and acceptance gates.
- Current enforced traceability baseline passes: FE02 is `PARTIAL` at 27/27 FR tags, FE04 is `PARTIAL` at 14/14, FE11 is `PARTIAL` at 35/43, and the other nine packages are `COMPLETE` at 100%.
- PR #95 already proves the bounded FE02 runtime/session-audit and FE05/FE11 catalog metadata slices; PR A publishes those three documentation closeouts without changing product behavior.
- The React Router High audit remains a controlled, fail-closed RSC-only exception for pinned `7.18.1`; root and backend production audits have no High/Critical vulnerability.
- Demonstration video: `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no URL or artifact will be fabricated.
```

- [ ] **Step 2: Replace README test-quality statements that claim all features are COMPLETE**

In `## Test And Quality Gates`, replace the current remote-CI and traceability bullets with:

```markdown
- remote CI run `30726791185` passes for the pre-batch baseline `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`;
- staging deployment `30726924615` passes for the same exact SHA, including the documented frontend, health, schema-readiness, SQL catalog, CORS allow/deny, and protected-route smoke;
- traceability gate: FE02 27/27 and FE04 14/14 remain `PARTIAL`; FE11 is 35/43 and `PARTIAL`; the other nine feature packages are `COMPLETE` at 100%;
- dependency audit: root and backend report no High/Critical finding; the frontend guard accepts only pinned React Router `GHSA-qwww-vcr4-c8h2` under the documented Declarative Mode exception and fails closed on drift.
```

Remove stale numeric test/coverage totals from the “current” bullets unless they are extracted from run `30726791185`; keep clearly labeled historical evidence unchanged.

- [ ] **Step 3: Replace README video limitation**

Replace `The demonstration video/link is not published.` with:

```markdown
- Demonstration video is `WAIVED — NOT REQUIRED` by project decision dated 2026-08-02; no external link is expected.
```

- [ ] **Step 4: Replace the top of plan.md through the External Submission Items heading**

Use:

```markdown
# Plan

Current phase: full project closeout for `v1.0.3`, delivered through four bounded PRs under the approved 2026-08-02 design.

Published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. The closeout starts from `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`; CI `30726791185` and staging deployment `30726924615` pass for that exact pre-batch baseline. PR D alone may authorize and publish `v1.0.3` after exact post-merge verification.

The enforced baseline is truthful rather than uniformly complete: FE02 is `PARTIAL` with 27/27 FR tags, FE04 is `PARTIAL` with 14/14, FE11 is `PARTIAL` with 35/43, and the other nine feature packages are `COMPLETE` at 100%.

## Closeout delivery

1. PR A — publish PR #95 documentation closeouts, revalidate the controlled React Router audit exception, and refresh release truth without product changes.
2. PR B — reconcile and complete FE11 Core account lifecycle, exactly-one-role replacement, permission surface, guards, tests, and traceability.
3. PR C — execute FE04 role-based acceptance and FE02 remaining reconciliation without closing unsupported human evidence.
4. PR D — run final cross-feature/SQL/browser/security gates, merge under H3, verify the exact resulting SHA, and publish `v1.0.3` only when every release condition passes.

## External Submission Items
```

Then replace the demonstration-video bullet and its explanatory paragraph with:

```markdown
- Demonstration video/link: `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no link or artifact will be fabricated.

The video waiver is a final project decision, not missing evidence. It does not waive code, security, traceability, browser, SQL, H2, H3, deployment, or exact-SHA release gates.
```

Keep the authenticated Azure and SMTP evidence bullets unchanged.

- [ ] **Step 5: Replace TECH_DEBT.md metadata and Open debt section**

Set `Last Updated: 2026-08-02`, then replace the traceability note and `## Open debt` body with:

```markdown
> Traceability note: the enforced 2026-08-02 baseline passes its configured thresholds, but it is not an all-COMPLETE result. FE02 is `PARTIAL` with 27/27 FR tags, FE04 is `PARTIAL` with 14/14, FE11 is `PARTIAL` with 35/43, and the other nine feature packages are `COMPLETE` at 100%. Coverage and implementation state are separate claims.

---

## Open debt

| ID | Priority | Feature | Open gap | Planned resolution |
| --- | --- | --- | --- | --- |
| TD-029 | P1 | FE11 | Account lifecycle, active-actor revalidation, atomic deactivation/session revoke/audit, stale/self/active-loan/pending-activation guards, exactly-one-role replacement, and remaining permission/traceability evidence are not fully reconciled. | PR B in the approved `v1.0.3` closeout design. |
| TD-030 | P1 | FE04 / FE02 | FE04 role-based acceptance and remaining FE02 reconciliation/human evidence are still open; 100% FR tag coverage does not close them. | PR C in the approved `v1.0.3` closeout design. |
| TD-031 | P1 | Release | Final cross-feature, SQL, browser, security, H3, exact post-merge CI/deploy/smoke, tag, and GitHub release evidence do not yet exist for `v1.0.3`. | PR D; fail closed on any SHA or gate mismatch. |
| TD-032 | P2 | Infrastructure | CI has no shared disposable SQL Server service, avatar storage on App Service is not production-durable, and student-credit staging has no production SLA. | Preserve as explicit operational limitations unless separately funded and approved. |

PR #95 already resolved the bounded FE02-T067, FE05-T019, and FE11-CAT01 slices. PR A publishes those records; it does not resolve TD-029 through TD-032.
```

Do not rewrite the historical `## Resolved` table except to add PR #95 rows only if the table remains unambiguous after the new open section. The preferred PR A diff leaves historical rows unchanged.

- [ ] **Step 6: Refresh the final submission checklist decision and status rows**

Replace the `## Release decision` body with:

```markdown
The published release remains `v1.0.2` at `c988af1f605e32f7207ad51c4657ea07656941b0`. Full-project closeout starts from `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97; CI `30726791185` and staging deployment `30726924615` pass for that exact pre-batch SHA. PR A only reconciles Shell evidence. PR B-D remain required before `v1.0.3`, and PR D must use its own exact post-merge SHA rather than treating this baseline as the final release commit.

Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02. No URL or artifact is missing or expected, and none will be fabricated.
```

Replace these table rows with:

```markdown
| Source code | PASS pre-batch baseline / `v1.0.3` NOT YET AUTHORIZED | `v1.0.2` is published at `c988af1`; the four-PR closeout starts from `main@161cc28` and requires PR B-D plus final exact-SHA evidence. |
| Requirements and design | PASS design / IMPLEMENTATION IN PROGRESS | Approved design `docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md`; PR A-D boundaries are explicit. |
| Current-main quality | PASS pre-batch baseline | CI `30726791185` succeeded on exact SHA `161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27`. |
| Current-main staging | PASS pre-batch baseline | Deployment workflow `30726924615` succeeded on the same exact SHA. |
| Demonstration video/link | WAIVED — NOT REQUIRED | Approved by Nhat on 2026-08-02; no external URL or artifact will be fabricated. |
```

Replace the residual video bullet with:

```markdown
- Demonstration video is `WAIVED — NOT REQUIRED`; this is a final submission decision, not an open limitation.
```

Leave the `v1.0.2` verification commands as historical release verification. Keep the future `v1.0.3` commands explicitly conditional on PR D.

- [ ] **Step 7: Add a current closeout refresh to the Phase 3 final report**

Preserve the historical PR #48 evidence table. Replace the stale later-evidence paragraphs that identify `a8729f9` as current and say the video remains open with:

```markdown
## Full-project closeout refresh — 2026-08-02

The current pre-batch baseline is `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97. CI `30726791185` and staging deployment `30726924615` pass for that exact SHA. The staging smoke covers frontend, health, schema readiness, SQL catalog, allowed and blocked CORS, and an anonymous protected route.

The enforced traceability baseline passes while preserving implementation truth: FE02 is `PARTIAL` at 27/27 FR tags, FE04 is `PARTIAL` at 14/14, FE11 is `PARTIAL` at 35/43, and the other nine feature packages are `COMPLETE` at 100%. PR #95 already proves FE02-T067, FE05-T019, and FE11-CAT01; PR A publishes only those bounded documentation closeouts.

The remaining work is governed by the approved four-PR design: PR B FE11 Core, PR C FE04 acceptance and FE02 reconciliation, and PR D final integration/release evidence. `v1.0.3` is not authorized by this interim report. Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no link or artifact will be fabricated.
```

Keep all historical counts labeled historical. Do not turn old local-only remediation language into a current remote claim; where PR #97 now supplies merge evidence, point to PR #97 and its exact post-merge runs.

---

### Task 5: Validate the complete PR A diff and hold at H2

**Files:**

- Validate: the sixteen files in the File responsibility map, including the fail-closed plan correction and written H1 status update.

**Interfaces:**

- Consumes: Tasks 2-4 documentation diff.
- Produces: a complete, uncommitted, reviewable PR A diff for L1-L4 and H2.

- [ ] **Step 1: Prove the diff contains only the approved sixteen documentation files**

Run:

```powershell
git status --short
git diff --name-only
git diff --name-only | Where-Object { $_ -match '^(backend|frontend|database|\.github)/' }
```

Expected: no output from the final command. The changed implementation files must be exactly:

```text
.sdd/specs/feat-auth/CHANGELOG.md
.sdd/specs/feat-auth/SPEC.md
.sdd/specs/feat-auth/TASKS.md
.sdd/specs/feat-book-management/CHANGELOG.md
.sdd/specs/feat-book-management/TASKS.md
.sdd/specs/feat-user-role-management/CHANGELOG.md
.sdd/specs/feat-user-role-management/SPEC.md
.sdd/specs/feat-user-role-management/TASKS.md
README.md
TECH_DEBT.md
docs/release/final-submission-checklist-2026-07-20.md
docs/release/phase3-final-report.md
docs/security/react-router-rsc-audit-exception-2026-07-25.md
docs/superpowers/plans/2026-08-02-full-project-closeout-pr-a-shell.md
docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md
plan.md
```

The committed design/plan history, fail-closed plan correction, and written H1 status update are all included in H2 review.

- [ ] **Step 2: Run documentation, traceability, and secret gates**

Run:

```powershell
git diff --check
npm.cmd run trace:enforce
npm.cmd run test:secrets
```

Expected: all exit `0`. Trace output must still show FE02 `PARTIAL` 27/27, FE04 `PARTIAL` 14/14, FE11 `PARTIAL` 35/43, and the other nine packages `COMPLETE` at 100% unless Task 2's bounded metadata status changes a measured implementation field. Any unexpected feature-state change blocks H2.

- [ ] **Step 3: Run the security gates**

Run:

```powershell
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend run audit:high
```

Expected: root and backend report no High/Critical vulnerability; the frontend fail-closed guard exits `0` only for the documented React Router advisory. Do not claim the raw frontend audit is zero-vulnerability.

- [ ] **Step 4: Prove only the intended tasks closed and named exclusions remain open**

Run:

```powershell
rg -n "\[x\].*(FE02-T067|FE05-T019|FE11-CAT01)" .sdd/specs
rg -n "\[ \].*(FE02-T049|FE04-|FE09-B7|FE11-(UXR|PDO|LIFE))" .sdd/specs
rg -n "WAIVED — NOT REQUIRED" README.md plan.md docs/release/final-submission-checklist-2026-07-20.md docs/release/phase3-final-report.md
rg -n "demonstration-video publication remains open|video/link remains open|video/link remains unpublished|all twelve.*Implementation State: COMPLETE" README.md plan.md TECH_DEBT.md docs/release
```

Expected:

- the first command finds the three bounded closeouts;
- the second command still finds the named open work where those IDs exist;
- the waiver appears in all four current-status documents;
- the final stale-claim scan returns no current claim. Historical text may remain only when clearly labeled as a dated snapshot and must not contradict the new refresh.

- [ ] **Step 5: Perform L1-L4 review before H2**

Review the entire branch diff against:

- L1: Markdown syntax, broken tables, accidental whitespace, and exact IDs/runs/SHAs;
- L2: SDD trace consistency across TASKS/SPEC/CHANGELOG and the four-PR design;
- L3: cross-document release truth, video waiver, open-debt status, and no premature `v1.0.3` claim;
- L4: reproducible GitHub/audit commands and fail-closed stop conditions.

Record findings in the H2 handoff. Resolve every P0/P1/P2 mismatch before requesting approval.

- [ ] **Step 6: Stop at the H2 gate with the diff uncommitted**

Provide:

- `git status --short` and `git diff --stat`;
- exact changed-file list;
- Task 1 GitHub evidence;
- traceability, secrets, three audit-gate results, and stale-claim scan;
- L1-L4 review outcome;
- explicit statement that no product/dependency/workflow/schema/API file changed.

Do not commit, push, open a PR, or merge until Nhat explicitly approves H2 for the complete PR A diff.

---

### Task 6: Commit, publish, and merge only after H2/H3

**Files:**

- Commit: approved branch diff after H2.
- Create: PR A through GitHub; no new product files.

**Interfaces:**

- Consumes: explicit H2 approval and green branch CI.
- Produces: merged PR A plus exact post-merge CI/deploy evidence for PR B's baseline.

- [ ] **Step 1: Commit the H2-approved PR A implementation diff**

Run:

```powershell
git add .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-book-management/CHANGELOG.md .sdd/specs/feat-book-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/TASKS.md README.md TECH_DEBT.md docs/release/final-submission-checklist-2026-07-20.md docs/release/phase3-final-report.md docs/security/react-router-rsc-audit-exception-2026-07-25.md docs/superpowers/plans/2026-08-02-full-project-closeout-pr-a-shell.md docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md plan.md
git diff --cached --check
git commit -m "docs: reconcile PR A closeout evidence"
```

Expected: the staged scope is exactly the sixteen H2-reviewed documents and the commit succeeds. The earlier design/plan commits remain separate.

- [ ] **Step 2: Push and open PR A**

Run:

```powershell
git push -u origin codex/full-project-closeout-v1.0.3-design
gh pr create --base main --head codex/full-project-closeout-v1.0.3-design --title "docs: reconcile full-project closeout shell" --body-file docs/superpowers/plans/2026-08-02-full-project-closeout-pr-a-shell.md
```

Expected: the branch pushes successfully and the new PR targets `main`. Before accepting the generated body, ensure no secret or local absolute path appears in it.

- [ ] **Step 3: Wait for branch checks and prepare H3 evidence**

Run:

```powershell
gh pr checks --watch
gh pr view --json number,state,mergeable,headRefOid,statusCheckRollup,url
```

Expected: every required check succeeds and the PR is mergeable. Present the complete PR diff, H2 decision, branch SHA, and check rollup for explicit H3 approval.

- [ ] **Step 4: Stop before merge until H3 is explicit**

No merge is allowed from H2 approval alone. After H3 approval, merge according to repository policy, then verify the exact merge SHA with its new post-merge CI and staging deployment. Record that SHA as PR B's starting baseline; do not create or publish `v1.0.3`.

## Completion criteria

PR A is complete only when:

1. the three PR #95 documentation tasks are closed with exact immutable evidence;
2. the React Router exception is revalidated without dependency drift;
3. top-level and release documents consistently describe the current pre-batch baseline, open PR B-D work, and video waiver;
4. all validation commands pass and no product file changed;
5. H2 and H3 are explicitly approved;
6. PR A is merged and exact post-merge CI/deploy evidence is captured for the next slice;
7. no tag or GitHub release for `v1.0.3` has been created.
