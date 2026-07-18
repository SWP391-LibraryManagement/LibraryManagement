# Fast-Track Hybrid Delivery Mode Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Activate the approved Fast-Track governance model and prepare a human-reviewable H1 package for FE11 `TD-024`, `TD-026`, and `TD-027` without changing product behavior.

**Architecture:** The Integration Lead is the only writer in the control worktree. Two subagents run read-only analysis in parallel and return exact contract/evidence recommendations. The Lead writes three independent H1 artifacts, fans them into one approval packet, and keeps every generated change uncommitted until H1 review.

**Tech Stack:** Markdown SDD artifacts, Git worktrees/branches, PowerShell, `rg`, Node.js traceability checker, existing FE11 source documents.

## Global Constraints

- Baseline is `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e` unless a newer non-overlapping `main` commit is explicitly accepted.
- This plan changes governance and planning/evidence files only; do not modify backend, frontend, database, schema, package files, or FE11 requirements.
- Keep whole-feature FE11 `Implementation State: DEFERRED`.
- Keep `TD-023` and `TD-025` `OPEN`; only `TD-024`, `TD-026`, and `TD-027` enter Batch 1.
- Use up to three lanes, but only the Integration Lead writes files in the control worktree.
- Do not commit or push generated Batch 1 artifacts before H1 human review.
- Do not start TD-024/026/027 product implementation in this plan.
- Do not silently resolve endpoint ownership, envelope shape, redaction, or evidence-status ambiguity outside the H1 packet.
- Every artifact must contain concrete recommendations and explicit human decisions; unresolved placeholder markers are forbidden.
- If incoming `main` drift overlaps FE11 Admin/user-management Core files or source contracts, stop and return to the user.

---

### Task 1: Activate The Fast-Track Agent Contract In The Local Review Diff

**Files:**
- Modify: `.agents/AGENTS.md`
- Modify: `.agents/CLAUDE.md`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`.
- Produces: repository-visible H1/H2/H3 rules that later agents must follow.

- [ ] **Step 1: Confirm the approved design and clean branch**

Run:

```powershell
git status --short --branch
rg -n "Status: APPROVED BY HUMAN|## 7\. Three Human Gates|## 10\. Retry And Stop Rules" docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md
```

Expected: the branch is clean before task edits and the three design markers are present.

- [ ] **Step 2: Add the Fast-Track section to `.agents/AGENTS.md`**

Insert after Section 5 `Working Style` and before Section 6:

```markdown
## 5.1 Fast-Track Hybrid Batch Mode

Fast-Track mode is opt-in and applies only when a human-approved design names the active batch and scope.

- H1 approves the batch contract, dependency order, file ownership, plan/task boundaries, validation commands, and allowed agent lanes.
- H1 authorizes worktrees, read-only parallel analysis, and uncommitted RED-GREEN implementation inside the approved scope. It does not authorize committing generated implementation changes, pushing product-code branches, or merging.
- H2 reviews the complete local diff plus L1-L4 evidence before generated implementation changes are committed. H2 authorizes the reviewed commit set, branch push, draft PR publication, and ready-for-review transition after required checks pass.
- H3 approves merge after required checks pass and the branch remains mergeable. H3 also authorizes exact post-merge CI monitoring and pre-reviewed mechanical closeout substitutions.
- H1 occurs once per approved batch. H2 and H3 occur once per implementation PR.
- Only one Builder may edit shared Core production files for the active slice. Other lanes prepare the next contract or independently verify the current slice.
- Stop immediately for contract ambiguity, overlapping Core drift, secret exposure, permission/schema/API expansion, incompatible agent assumptions, or a failed required check.
- A deterministic failure receives at most three total attempts. A suspected E2E flake may be rerun once with evidence.

The authoritative design is `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`.

---
```

- [ ] **Step 3: Update `.agents/CLAUDE.md`**

Change the version header from `0.3.3` to `0.3.4`.

Add after the `Current SDD scope` block:

```markdown
- **Current delivery mode**: Fast-Track Hybrid is approved for bounded batches. Use the three-lane pipeline and H1/H2/H3 authority model from `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`. The first preparation batch covers FE11 `TD-024`, `TD-026`, and `TD-027`; no product implementation starts before H1 approval.
```

Add after Section 3 `Spec-First Workflow`:

```markdown
## 3.1 Fast-Track Execution Rules

- The Integration Lead owns shared contracts, fan-in, commits, PR publication, and CI association.
- The Builder owns RED-GREEN changes for one active slice and leaves generated implementation changes uncommitted until H2.
- The Verifier independently checks L2/L3/L4 and does not rewrite Builder production files concurrently.
- Draft publication after H2 and post-merge monitoring after H3 do not require additional permission prompts.
- Batched closeout may replace per-slice closeout only when the H3-reviewed template permits exact evidence substitutions and no new behavior claim.
```

- [ ] **Step 4: Validate the local policy diff**

Run:

```powershell
rg -n "Fast-Track Hybrid Batch Mode|H1 approves|H2 reviews|H3 approves|three-lane pipeline|generated implementation changes uncommitted" .agents/AGENTS.md .agents/CLAUDE.md
git diff --check -- .agents/AGENTS.md .agents/CLAUDE.md
```

Expected: all policy markers are present and the diff check is empty.

- [ ] **Step 5: Leave changes uncommitted for H1**

Run:

```powershell
git status --short
```

Expected: only `.agents/AGENTS.md` and `.agents/CLAUDE.md` are modified at this checkpoint. Do not commit.

---

### Task 2: Prepare The TD-024 Audit Log Contract Design

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`

**Interfaces:**
- Consumes: `FR-FE11-033`, `AC-FE11-018`, `BR-FE11-018`, `BR-FE11-026`, current `/api/users/audit-logs` behavior, and `TD-024`.
- Produces: a concrete recommended `/api/admin/audit-logs` contract for H1 approval and the later TD-024 implementation plan.

- [ ] **Step 1: Run the read-only Audit contract inventory**

Run in a verifier lane or locally:

```powershell
rg -n -A 45 -B 15 "FR-FE11-033|AC-FE11-018|EC-FE11-018|/api/admin/audit-logs" .sdd/specs/feat-user-role-management/SPEC.md docs/api/api-contract.md
rg -n -A 80 -B 10 "audit-logs|listAuditLogs|fetchAuditLogs|Metadata" backend/src frontend/src backend/tests frontend/test
```

Expected: evidence shows the canonical Admin endpoint requirement and the current user-management route/pagination/raw-metadata drift.

- [ ] **Step 2: Create the Audit contract design with this complete content**

```markdown
# FE11 Audit Log Contract Design

Status: H1 REVIEW READY

Date: 2026-07-18

Scope: `TD-024`, `FR-FE11-033`, `AC-FE11-018` only

## Decision Requested

Approve the canonical Admin-owned read-only endpoint and remove the legacy FE11 UI dependency on `/api/users/audit-logs` in the same implementation slice.

## Canonical Endpoint

`GET /api/admin/audit-logs`

Authentication and authorization remain server-side. Only authenticated active Admin users may access the endpoint.

## Query Contract

| Field | Contract |
| --- | --- |
| `page` | Optional positive integer; default `1` |
| `limit` | Optional integer `1..100`; default `20` |
| `search` | Optional trimmed string, maximum 100 characters; searches action, actor email/full name, target type, and target ID text |
| `action` | Optional trimmed exact action string, maximum 100 characters |
| `actorId` | Optional positive integer |
| `fromDate` | Optional ISO `YYYY-MM-DD` inclusive lower bound |
| `toDate` | Optional ISO `YYYY-MM-DD` inclusive upper bound; must not precede `fromDate` |

Invalid supplied values return HTTP `400` with code `VALIDATION_ERROR`. Authorization precedes detailed validation.

## Response Contract

```json
{
  "data": [
    {
      "logId": 1,
      "action": "USER_ROLE_ASSIGNED",
      "actor": { "userId": 7, "email": "admin@example.com", "fullName": "Admin User" },
      "target": { "type": "USER", "id": 15, "label": "member@example.com" },
      "details": { "roleId": 2, "roleName": "LIBRARIAN", "outcome": "SUCCESS" },
      "ipAddress": "203.0.113.10",
      "createdAt": "2026-07-18T10:00:00.000Z"
    }
  ],
  "pagination": { "page": 1, "limit": 20, "total": 1, "totalPages": 1 }
}
```

## Safe Detail Allowlist

`details` may contain only these keys with primitive values or arrays of strings:

- `changedFields`
- `previousStatus`
- `newStatus`
- `roleId`
- `roleName`
- `entityType`
- `entityId`
- `requestId`
- `reason`
- `outcome`

Every other metadata key is omitted. Keys matching password, hash, token, authorization, cookie, secret, session, reset, setup, or API-key concepts are never returned even if persisted.

## Ordering And SQL Boundary

- Stable order is `CreatedAt DESC, LogId DESC`.
- Pagination is applied in SQL.
- All search/filter inputs use typed `mssql` parameters.
- No raw metadata object is spread into the response.

## Compatibility Decision

Recommended: migrate the Admin frontend to `/api/admin/audit-logs` and remove `/api/users/audit-logs` from the public route table in the same slice. No compatibility alias is retained because the route is internal prototype drift and has no approved external contract.

## Tests Required After H1

- Admin-first authorization.
- Invalid page/limit/search/action/actor/date boundaries.
- `fromDate <= toDate` validation.
- Stable pagination/order and typed parameters.
- Search and each filter independently and in combination.
- Sensitive metadata removal with hostile persisted keys.
- Frontend canonical endpoint, query omission, filter wiring, and safe rendering.
- Legacy route absence.

## Out Of Scope

- Audit writes, audit deletion/update, export, schema changes, dashboard analytics, and non-FE11 audit policy changes.

## H1 Recommendation

Approve the contract exactly as written. Any alternate compatibility or metadata policy requires an explicit H1 revision before implementation.
```

- [ ] **Step 3: Validate the Audit design**

Run:

```powershell
rg -n "GET /api/admin/audit-logs|VALIDATION_ERROR|Safe Detail Allowlist|Legacy route absence|H1 Recommendation" docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
```

Expected: every marker is present and the diff check is empty. Do not commit.

---

### Task 3: Prepare The TD-026 User-List Envelope Decision

**Files:**
- Create: `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`

**Interfaces:**
- Consumes: approved `GET /api/users` `{ data, pagination }` envelope, current undocumented `summary`, `TD-026`, dashboard counters, and future `TD-023` Permissions counts.
- Produces: one explicit H1 decision and a dependency boundary for TD-026/TD-023.

- [ ] **Step 1: Inventory the current envelope consumers**

Run:

```powershell
rg -n -A 35 -B 10 "summary|fetchUsers|listUsers|pagination" backend/src/repositories/userRepository.js backend/src/services/userManagementService.js backend/src/controllers/userManagementController.js frontend/src/api/userManagementApi.js frontend/src/page/UserManagement.jsx backend/tests frontend/test docs/api/api-contract.md .sdd/specs/feat-user-role-management/SPEC.md
```

Expected: repository-produced `summary`, frontend `setUserSummary`, and the approved list envelope are visible.

- [ ] **Step 2: Create the decision record with this complete content**

```markdown
# FE11 User List Envelope Decision

Status: H1 REVIEW READY

Date: 2026-07-18

Scope: `TD-026` and the data dependency for `TD-023`

## Current Conflict

The approved `GET /api/users` response is `{ data, pagination }`. The implementation also emits top-level `summary`, and the Admin page consumes it for user counters. Permissions currently derives role counts from only the loaded page, which is not authoritative.

## Option A - Formalize `summary` In `GET /api/users`

- Smallest implementation change.
- Requires an approved FE11 SPEC/API contract change.
- Couples list pagination with global aggregates and encourages Permissions to reuse the wrong boundary.

Result: not recommended.

## Option B - Remove `summary` And Derive Counts From The Loaded Page

- Preserves the documented envelope.
- Produces incorrect global counts whenever pagination/filtering is active.

Result: rejected because it cannot satisfy `AC-FE11-017`.

## Option C - Separate Read Models

- Keep `GET /api/users` exactly `{ data, pagination }`.
- Add Admin-only `GET /api/admin/user-summary` for global user counters: `total`, `active`, `inactive`, and `librarians`.
- Let future `GET /api/admin/permissions` own role counts and the read-only permission matrix for `TD-023`.
- Migrate the Admin page to the summary endpoint before removing the undocumented list `summary` in the same TD-026 slice.
- Update FE11/API documentation before product implementation because `/api/admin/user-summary` is a new public contract.

Result: recommended.

## Recommended Response

```json
{
  "data": {
    "total": 120,
    "active": 100,
    "inactive": 15,
    "librarians": 5
  }
}
```

## Validation Required After H1

- Admin-first authorization and safe error mapping.
- One parameterized aggregate query with numeric zero defaults.
- `GET /api/users` repository/service/route tests assert no top-level `summary`.
- Frontend loads list and summary independently and does not derive global counts from page rows.
- `TD-023` consumes its own Permissions contract rather than the user-list page.

## H1 Decision

Recommended approval: Option C. Approval authorizes the required FE11/API documentation delta and a later detailed TD-026 implementation plan. No code changes occur in the H1 preparation phase.
```

- [ ] **Step 3: Validate the decision record**

Run:

```powershell
rg -n "Option A|Option B|Option C|GET /api/admin/user-summary|Recommended approval: Option C|no top-level `summary`" docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
```

Expected: all alternatives, recommendation, and validation boundary are present. Do not commit.

---

### Task 4: Prepare The TD-027 Evidence Metadata Matrix

**Files:**
- Create: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`

**Interfaces:**
- Consumes: merged B7 evidence for account setup, transactional roles, safe list/detail, and Admin role UI.
- Produces: exact status-only changes that a later TD-027 docs task may apply without altering requirements.

- [ ] **Step 1: Inventory stale status cells and merged evidence**

Run:

```powershell
rg -n "Ready for review|Not Started|AC-FE11-00[1-3]|AC-FE11-006|AC-FE11-010|AC-FE11-013|AC-FE11-014|AC-FE11-015|AC-FE11-020|AC-FE11-021|AC-FE11-022|FR-FE11-00[1-3]|FR-FE11-006|FR-FE11-009|FR-FE11-012|FR-FE11-013|FR-FE11-014|FR-FE11-024|FR-FE11-025|FR-FE11-026|FR-FE11-027|FR-FE11-036|FR-FE11-037|FR-FE11-038" .sdd/specs/feat-user-role-management/SPEC.md
rg -n "Integration state|post-merge CI|PR #" .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/reviews/fe11-*-validation-2026-07-18.md
```

Expected: stale SPEC statuses and exact B7 records are both visible.

- [ ] **Step 2: Create the evidence matrix with this complete content**

```markdown
# FE11 Evidence Metadata Reconciliation Matrix

Status: H1 REVIEW READY

Date: 2026-07-18

Scope: `TD-027`; status/evidence metadata only

## Rules

- Do not change requirement wording, IDs, actors, flows, business rules, API behavior, or acceptance criteria.
- Change only traceability/evidence status cells supported by merged B7 records.
- Use `COMPLETE (B7)` for fully satisfied requirement rows.
- Use `PARTIAL` when a requirement spans deferred behavior beyond the completed slice.
- Keep all unimplemented Admin Console, Audit, Request Management, update/deactivation, and librarian-field rows unchanged.

## Complete Account-Setup Rows

| Type | IDs | Evidence |
| --- | --- | --- |
| FR | `FR-FE11-003`, `006`, `009`, `036..038` | `FE11-S01..S07`, merged account-setup B7 evidence |
| AC | `AC-FE11-003`, `006`, `010`, `020..022` | `FE11-S01..S07`, merged account-setup B7 evidence |

Intended status: `COMPLETE (B7)`.

## Complete Role Rows

| Type | IDs | Evidence |
| --- | --- | --- |
| FR | `FR-FE11-012..014`, `024..027` | `FE11-R01..R05`, `FE11-UIR01..UIR05`, PR #30, post-merge CI `29644292781` |
| AC | `AC-FE11-013..015` | backend role B7 plus Admin role UI B7 |

Intended status: `COMPLETE (B7)`.

## Complete Safe-Read Rows

| Type | IDs | Evidence |
| --- | --- | --- |
| FR | `FR-FE11-001`, `002`, `015` | `FE11-U01..U06`, PR #27, post-merge CI `29639933730` |
| AC | `AC-FE11-001`, `002` | `FE11-U01..U06` validation and integration records |

Intended status: `COMPLETE (B7)`.

## Partial Rows

| ID | Intended status | Reason |
| --- | --- | --- |
| `FR-FE11-016` | `PARTIAL` | Safe detail `404 USER_NOT_FOUND` is complete; update/deactivation and other target actions remain deferred |

## Rows That Must Remain Not Started

- `FR-FE11-030..035`
- `AC-FE11-004`, `007..009`, `011`, `012`, `016..019`, `023`
- Update/deactivation, librarian-field, Admin Console, Audit Log, and Request Management mappings not covered by a merged bounded slice

## H1 Recommendation

Approve this matrix as the sole authority for a later status-only `SPEC.md` maintenance diff. Any requirement wording change is out of scope and requires separate spec review.
```

- [ ] **Step 3: Validate the evidence matrix**

Run:

```powershell
rg -n "COMPLETE \(B7\)|FR-FE11-016|PARTIAL|Rows That Must Remain Not Started|sole authority" .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
git diff --check -- .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
```

Expected: complete, partial, and unchanged groups are explicit. Do not commit.

---

### Task 5: Fan In The FE11 Batch 1 H1 Review Packet

**Files:**
- Create: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`

**Interfaces:**
- Consumes: Tasks 1-4 local diffs/artifacts.
- Produces: the single H1 decision package and approved dependency/file-ownership boundary for later implementation plans.

- [ ] **Step 1: Create the H1 packet with this complete content**

```markdown
# FE11 Fast-Track Batch 1 H1 Review

Status: H1 REVIEW READY

Date: 2026-07-18

Baseline: `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e`

Batch scope: `TD-024`, `TD-026`, `TD-027`

## H1 Decisions

| ID | Decision | Recommendation |
| --- | --- | --- |
| H1-001 | Activate Fast-Track H1/H2/H3 agent rules | APPROVE |
| H1-002 | Adopt canonical `GET /api/admin/audit-logs` contract and remove the legacy public route in the same slice | APPROVE |
| H1-003 | Adopt TD-026 Option C: separate `/api/admin/user-summary`, preserve `{ data, pagination }`, and reserve `/api/admin/permissions` for TD-023 | APPROVE |
| H1-004 | Use the TD-027 evidence matrix for status-only SPEC maintenance | APPROVE |
| H1-005 | Implementation order `TD-024 -> TD-026 -> TD-023`; design TD-025 only after FE07 contract lock | APPROVE |

## Core And Shell

- Core: Audit authorization, filters, redaction, API ownership; list/summary API contracts; SPEC evidence truthfulness.
- Shell: Audit filter controls/rendering, mechanical endpoint adapters, evidence formatting.

## File Ownership After H1

### TD-024 Builder-owned files

- `.sdd/specs/feat-user-role-management/SPEC.md` API/detail clarification only if H1 requires it
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/routes/adminRoutes.js`
- `backend/src/routes/userManagementRoutes.js`
- `backend/src/controllers/adminController.js`
- `backend/src/controllers/userManagementController.js`
- `backend/src/services/adminService.js`
- `backend/src/services/userManagementService.js`
- `backend/src/repositories/auditLogRepository.js`
- `backend/src/validators/adminValidators.js` (new)
- `backend/tests/adminAuditLogRoutes.test.js` (new)
- `backend/tests/adminAuditLogService.test.js` (new)
- `backend/tests/auditLogRepository.test.js` (new)
- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userManagementService.test.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/api/userManagementApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`

### TD-026 Builder-owned files

- `.sdd/specs/feat-user-role-management/SPEC.md`
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/routes/adminRoutes.js`
- `backend/src/controllers/adminController.js`
- `backend/src/services/adminService.js`
- `backend/src/repositories/userRepository.js`
- `backend/tests/adminUserSummaryRoutes.test.js` (new)
- `backend/tests/adminUserSummaryService.test.js` (new)
- `backend/tests/userRepository.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userManagementService.test.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`

TD-024 and TD-026 are sequential because they share Admin route/API/page files.

### TD-027 docs owner files

- `.sdd/specs/feat-user-role-management/SPEC.md` status cells only
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `TECH_DEBT.md`
- `.agents/CLAUDE.md`

## Validation Gates

- L1: focused/full tests as affected, lint/build, traceability, diff, secret/security scans, PR CI.
- L2: requirement-to-task/code/test/evidence mapping.
- L3: Admin-first authorization, typed validation, redaction, no secret/schema drift.
- L4: Admin Audit filter/read flow, independent summary counters, and evidence-status review.

## Stop Rules

- Stop if H1 changes any recommended contract.
- Stop for overlapping Core drift after this packet is approved.
- Stop if the audit metadata allowlist cannot represent required accepted actions without exposing sensitive fields.
- Stop if `/api/admin/user-summary` conflicts with another approved feature owner.

## H1 Approval Effect

Approval authorizes the agent-policy/documentation commit, marks `TD-024`, `TD-026`, and `TD-027` `IN PROGRESS`, and permits automatic generation of detailed per-slice plans within these contracts. It does not authorize product-code commit/push or merge; those remain H2/H3.
```

- [ ] **Step 2: Run fan-in consistency checks**

Run:

```powershell
rg -n "H1-001|H1-002|H1-003|H1-004|H1-005|TD-024 -> TD-026 -> TD-023|H1 Approval Effect" .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n "GET /api/admin/audit-logs" docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n "Option C|/api/admin/user-summary" docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n "FR-FE11-016.*PARTIAL|Rows That Must Remain Not Started" .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
git diff --check
```

Expected: every decision and cross-artifact contract matches exactly; diff check is empty.

- [ ] **Step 3: Run repository policy checks**

Run:

```powershell
npm.cmd run trace:enforce
git status --short
git diff --name-only
```

Expected: traceability PASS. Only these files are changed/untracked:

```text
.agents/AGENTS.md
.agents/CLAUDE.md
.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
```

Do not commit before H1 approval.

---

### Task 6: Apply H1 Approval And Activate Batch 1

**Files:**
- Modify: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- Modify: `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`
- Modify: `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`
- Modify: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `TECH_DEBT.md`
- Modify: `.agents/AGENTS.md`
- Modify: `.agents/CLAUDE.md`

**Interfaces:**
- Consumes: explicit human H1 approval of Task 5.
- Produces: committed/active Batch 1 governance and stable task IDs used by the later TD-024/026/027 implementation plans.

- [ ] **Step 1: Stop for H1 human review**

Present the six-file local diff, H1 decisions, dependency order, file ownership, and validation result. Do not continue until the human explicitly approves H1.

- [ ] **Step 2: Mark the H1 artifacts approved**

After approval, change each artifact status:

```text
H1 REVIEW READY -> APPROVED BY HUMAN - 2026-07-18
```

In the H1 packet, add:

```markdown
## Human Approval

Approved on 2026-07-18. H1-001..H1-005 are locked for Batch 1.
```

- [ ] **Step 3: Add Batch 1 to FE11 `PLAN.md`**

Append:

```markdown
## 13. Fast-Track Batch 1

### Scope

- `TD-024`: canonical Admin Audit Logs contract, validation, filtering, redaction, and frontend migration.
- `TD-026`: separate Admin user-summary boundary and restore the canonical user-list envelope.
- `TD-027`: status/evidence metadata reconciliation only.

### Order

1. TD-024 Audit Logs.
2. TD-026 user-list envelope and summary boundary.
3. TD-027 evidence metadata may run in the verifier/docs lane but cannot alter requirements.

TD-023 follows TD-026. TD-025 waits for a separately locked FE07 request contract.

### Fast-Track Gates

- H1: approved Batch 1 contracts, ownership, plans, and validation boundaries.
- H2: required before each generated implementation diff is committed/pushed.
- H3: required before each merge.
```

- [ ] **Step 4: Add Batch 1 task groups to FE11 `TASKS.md`**

Insert before Deferred FE11 Work:

```markdown
## Fast-Track Batch 1 Tasks

- [x] **FE11-FT01 - Approve Batch 1 contracts and Fast-Track ownership.**
  - Scope: TD-024, TD-026, TD-027.
  - Evidence: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`.

- [ ] **FE11-AUD01 - Implement the canonical Admin Audit Log boundary.**
  - Maps to: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018; TD-024.
  - DoD: Admin-first canonical endpoint, complete boundary validation, typed filtering/pagination, stable order, safe metadata allowlist, frontend migration, legacy route removal, L1-L4 evidence.

- [ ] **FE11-ENV01 - Restore the canonical user-list envelope and separate user summary.**
  - Maps to: FR-FE11-001; AC-FE11-001; TD-026; H1-approved Admin user-summary API delta.
  - Depends on: H1 Option C approval.
  - DoD: `/api/users` returns only `data` and `pagination`; Admin summary is independently authorized and loaded; global counts are not derived from page rows.

- [ ] **FE11-META01 - Reconcile completed FE11 evidence metadata.**
  - Maps to: TD-027.
  - DoD: only approved status/evidence cells change; requirements and deferred rows remain unchanged; traceability/diff/human review pass.
```

- [ ] **Step 5: Update TEST_PLAN, CHANGELOG, and debt state**

Add to `TEST_PLAN.md` Current Targets:

```markdown
- Canonical Admin Audit Logs: Admin-first authorization, page/limit/search/action/actor/date validation, typed filters, stable order, safe metadata allowlist, and frontend filter/read flow.
- User list envelope: no top-level `summary`; independently authorized Admin user summary with numeric zero defaults; frontend list/summary ownership is separate.
- Evidence metadata: completed/partial/deferred status changes match merged B7 records without requirement edits.
```

Add to the top of `CHANGELOG.md`:

```markdown
## 2026-07-18 - Fast-Track Batch 1 Approved

- Approved H1 contracts and ownership for TD-024, TD-026, and TD-027.
- Locked Audit Logs to the canonical Admin endpoint with validation, filtering, and allowlisted metadata.
- Selected TD-026 Option C: separate Admin user summary and preserve the canonical user-list envelope.
- Approved status-only TD-027 evidence reconciliation.
- Product implementation remains pending H2 review and H3 merge gates.
```

In `TECH_DEBT.md`, change only:

```text
TD-024 OPEN -> IN PROGRESS
TD-026 OPEN -> IN PROGRESS
TD-027 OPEN -> IN PROGRESS
```

Keep TD-023 and TD-025 `OPEN`.

- [ ] **Step 6: Validate the approved activation diff**

Run:

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n "FE11-FT01|FE11-AUD01|FE11-ENV01|FE11-META01" .sdd/specs/feat-user-role-management/TASKS.md
rg -n "TD-024.*IN PROGRESS|TD-026.*IN PROGRESS|TD-027.*IN PROGRESS|TD-023.*OPEN|TD-025.*OPEN" TECH_DEBT.md
git status --short
```

Expected: traceability and diff checks PASS, stable task IDs exist, only the approved governance/FE11 documentation files are changed.

- [ ] **Step 7: Commit the human-reviewed H1 package**

```powershell
git add -- .agents/AGENTS.md .agents/CLAUDE.md .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: activate fast-track FE11 batch 1"
```

- [ ] **Step 8: Transition automatically to the TD-024 detailed plan**

Invoke `writing-plans` to create `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md` from the approved Audit design. The detailed plan may add bite-sized implementation steps but must not change H1-002, file ownership, or validation boundaries. If it discovers a material ambiguity, stop and return to H1 instead of implementing.

---

## Plan Completion Boundary

This plan is complete only when H1 is approved, the reviewed governance/Batch 1 package is committed, and the TD-024 detailed implementation plan is ready. No backend/frontend product code is part of this plan.
