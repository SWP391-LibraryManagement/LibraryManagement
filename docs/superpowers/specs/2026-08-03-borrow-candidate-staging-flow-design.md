# Borrow Candidate Staging Flow Design

**Date:** 2026-08-03
**Status:** REVIEW REQUESTED
**Owner:** Nhat
**Delivery mode:** Hybrid SDD, Standard depth
**Branch:** `fix/borrow-candidate-staging-flow`

## 1. Outcome

The Member borrowing flow must remain truthful and demonstrable:

- HomePage must not offer a direct borrow action when every physical copy is blocked by a pending borrow claim or an FE08 reservation claim.
- FE07 must continue to return only copies the current Member can legally add to a borrow request.
- Staging must provide isolated, resettable synthetic catalog data so the team can repeatedly demonstrate `HomePage -> Borrow Request -> Submit` without deleting or rewriting unrelated transactions.

## 2. Confirmed Runtime Evidence

The issue was reproduced on Azure staging with the signed-in `Demo Member` account.

- `GET /api/borrow-requests/candidates` produced no visible books.
- The staging database contained zero effective FE07 candidates for that Member.
- `1984` (`BookId = 13`, `CopyId = 14`) had physical status `AVAILABLE`, but `ReservationId = 16` was `ACTIVE` and owned by another Member.
- FE07 correctly excluded that copy under `BR-FE07-023`, `FR-FE07-034`, and reservation-priority rules.
- FE01 still derived `availabilityStatus = AVAILABLE` solely from `BookCopies.Status`, so HomePage incorrectly offered `Mượn sách này` for a copy that FE07 was required to reject.

Therefore the candidate repository is not the root cause. The root cause is a cross-feature read-model mismatch plus staging data exhaustion.

## 3. Decision

Use two bounded slices in one reviewed batch.

### Slice A — Core: truthful circulation action

Add a safe, coarse `circulationAction` field to the existing public book list/detail DTO while preserving the current `availabilityStatus` field for backward compatibility.

Approved values:

| Value | Meaning | Member HomePage behavior |
| --- | --- | --- |
| `BORROW` | At least one `AVAILABLE` copy has no pending FE07 claim and no `ACTIVE`/`NOTIFIED` FE08 claim. | Route to `/borrowing/new?bookId={bookId}`. |
| `RESERVE` | No copy is currently borrowable, but at least one `BORROWED` or `RESERVED` copy can enter the FE08 candidate flow. | Route to `/reservations/mine?bookId={bookId}`. |
| `WAIT` | No immediate Member action is valid; at least one copy is awaiting FE07 decision or FE08 queue processing. | Show a disabled `Đang chờ thư viện xử lý` action. |
| `UNAVAILABLE` | No borrow, reservation, or queue-processing path is currently available. | Show a disabled `Tạm chưa khả dụng` action. |

The field is title-level and must not expose `CopyId`, reservation ownership, queue position, Member identity, or other staff-only data.

`availabilityStatus` remains the physical high-level value already used by staff-facing presentation. `circulationAction` owns only the Member continuation decision.

### Slice B — Shell/operations: FE07 empty state and staging fixture

1. FE07 empty-state copy distinguishes:
   - the server returned no eligible books; and
   - a local search returned no match while eligible books exist.
2. Add a manual staging-only script with `status` and `reset` modes.
3. The fixture owns only records identified by reserved synthetic ISBN/barcode prefixes and a staging-demo audit marker.
4. `reset` restores two distinct synthetic demo titles, each with one `AVAILABLE` copy, so the same-title active-workflow rule does not remove the entire demo catalog after one request.

## 4. Core Rules

- Do not loosen `GET /api/borrow-requests/candidates`.
- Do not allow a pending FE07 claim or an `ACTIVE`/`NOTIFIED` FE08 claim to be borrowed through the ordinary Member flow.
- Do not automatically process the FE08 queue.
- Do not expose reservation ownership or copy-level identifiers through FE01.
- Do not change schema, status enums, route paths, dependencies, or borrowing limits.
- The staging reset must refuse to run unless:
  - `DB_NAME` is exactly `LibraryManagementStaging`; and
  - `STAGING_DEMO_ALLOW_MUTATION` is explicitly `true`.
- The reset must use a SQL transaction and parameterized queries.
- The reset must refuse to touch a borrow request that mixes a tagged demo copy with an untagged copy.
- Existing non-fixture books, copies, requests, details, reservations, fines, notifications, users, and audit history must remain unchanged.
- Every fixture state transition must leave an audit record with a staging-demo marker.

## 5. Component Design

### 5.1 Backend public catalog read model

Update the existing FE01 book repository projection to calculate `circulationAction` with `EXISTS`/`NOT EXISTS` checks against:

- `BookCopies.Status`;
- pending FE07 `BorrowRequests`/`BorrowDetails`; and
- open FE08 `Reservations` (`ACTIVE`, `NOTIFIED`).

The query remains read-only and parameter-free for circulation state. It returns one coarse enum per title.

The book service adds `circulationAction` to the public list/detail allowlist and uses `UNAVAILABLE` as the safe fallback for missing or unknown repository values.

### 5.2 HomePage action mapping

Update `getHomeBookAction` and all HomePage action controls:

- Guest behavior remains the approved generic login continuation.
- Staff behavior continues to use staff management routes and physical `availabilityStatus`.
- Member behavior uses `circulationAction` exclusively.
- `WAIT` and `UNAVAILABLE` controls are disabled and cannot navigate.

### 5.3 FE07 candidate empty state

When the initial protected candidate response contains no books, show:

> Hiện không có bản sao đủ điều kiện mượn. Sách đang được mượn, giữ chỗ hoặc chờ xử lý sẽ không xuất hiện tại đây.

When candidates exist but the local title/author search has no match, retain the search-specific guidance.

API errors continue to render through the existing safe FE07 error mapping and are not presented as a valid empty state.

### 5.4 Staging demo reset

Add `backend/scripts/stagingBorrowCandidates.js` with two modes:

- `status`: read-only summary of tagged fixture state.
- `reset`: guarded, transactional restoration of the tagged fixtures.

The script uses stable synthetic identifiers, for example:

- ISBN prefix: `STAGING-BORROW-DEMO-`
- Barcode prefix: `STG-BORROW-DEMO-`
- Location: `STAGING-DEMO`

Reset behavior:

1. Resolve an active staging Admin as the audit actor; refuse to continue if none exists.
2. Resolve the configured synthetic Demo Member and verify the account is active, has exactly the `MEMBER` role, has no overdue loan or positive unpaid fine, and has room under the active/daily limits. The script reports blockers but does not alter unrelated Member state.
3. Lock tagged books/copies and any related open borrowing/reservation rows.
4. Refuse mixed tagged/untagged borrow requests.
5. Reject a tagged pending request using the existing `REJECTED` request transition while preserving its `REQUESTED` detail history, or normally return a tagged active loan using `RETURNED` plus the current `Asia/Ho_Chi_Minh` business date and complete its request. Cancel tagged `ACTIVE`/`NOTIFIED` reservations using the existing FE08 transition. Any damaged, lost, mixed, or otherwise unexpected state aborts the reset for manual review.
6. Restore tagged books to `ACTIVE` and copies to `AVAILABLE` only after all tagged open claims reach valid terminal states.
7. Create missing tagged books/copies idempotently.
8. Insert an audit marker and commit atomically.

The script is never invoked automatically by application startup or production deployment.

## 6. Errors and Safety

The script exits non-zero without mutation for:

- a non-staging database;
- a missing explicit mutation flag;
- missing required roles/audit actor;
- mixed tagged/untagged requests;
- unexpected fixture statuses; or
- any SQL error.

Output contains counts and synthetic identifiers only. It must not print passwords, tokens, connection strings, personal information, or deployment credentials.

## 7. Specification and Documentation Changes

Update before or with implementation:

- `.sdd/specs/feat-public-browse/SPEC.md`
- `.sdd/specs/feat-public-browse/PLAN.md`
- `.sdd/specs/feat-public-browse/TASKS.md`
- `.sdd/specs/feat-public-browse/CHANGELOG.md`
- `.sdd/specs/feat-borrowing-management/SPEC.md`
- `.sdd/specs/feat-borrowing-management/PLAN.md`
- `.sdd/specs/feat-borrowing-management/TASKS.md`
- `.sdd/specs/feat-borrowing-management/CHANGELOG.md`
- `docs/api/api-contract.md`
- `docs/deployment/azure-staging-guide.md`

FE08 behavior does not change; its existing candidate and queue tests are regression gates.

## 8. Test Strategy

Follow RED-GREEN in this order:

1. Backend repository/service tests for all four `circulationAction` values and safe projection.
2. Public API contract tests proving the field is present and leaks no copy/reservation data.
3. Frontend tests for Guest, Member, Librarian, and Admin actions, including disabled `WAIT`/`UNAVAILABLE` controls.
4. FE07 frontend test distinguishing server-empty from search-empty states.
5. Staging script tests for guards, idempotence, mixed-request refusal, transaction rollback, fixture-only ownership, and audit creation.
6. Existing FE07/FE08 route and SQL regression suites.
7. Browser acceptance:
   - a globally claimed `AVAILABLE` copy does not offer `Mượn sách này`;
   - reset produces two visible FE07 demo candidates;
   - Demo Member creates one request successfully;
   - the second title remains visible; and
   - unrelated staging rows remain unchanged.

## 9. Acceptance Criteria

- **AC-BCSF-001:** Given an `AVAILABLE` copy with an open FE08 claim, HomePage does not offer a direct borrow action.
- **AC-BCSF-002:** Given an unclaimed `AVAILABLE` copy, HomePage offers `Mượn sách này` and FE07 returns the same title as a candidate.
- **AC-BCSF-003:** Given no borrowable copy but a reservable `BORROWED`/`RESERVED` copy, HomePage offers the FE08 reservation path.
- **AC-BCSF-004:** Given only pending/queue-processing copies, HomePage shows a disabled waiting action.
- **AC-BCSF-005:** FE07 server-empty and local-search-empty states use distinct truthful messages.
- **AC-BCSF-006:** The staging reset refuses non-staging or unapproved mutation and rolls back fully on error.
- **AC-BCSF-007:** The staging reset changes only tagged synthetic fixture state and writes an audit marker.
- **AC-BCSF-008:** After reset, Demo Member sees two distinct demo titles, can submit one request, and still sees the other title.

## 10. Out of Scope

- Loosening FE07 candidate rules.
- Automatically processing FE08 queues.
- Adding a public copy-level or reservation-owner API.
- Changing database schema or state enums.
- Running demo reset during production startup/deploy.
- Deleting unrelated staging history.
- Creating real user credentials or storing passwords in the repository.

## 11. Rollout and Verification

1. Implement and validate locally in an isolated worktree.
2. Complete H2 review before committing generated implementation changes.
3. Push a branch without a `codex/` prefix and open a PR.
4. Require CI, traceability, secret scan, and focused browser checks.
5. Complete H3 before merge.
6. Verify post-merge CI and staging deployment.
7. Run the guarded staging reset manually.
8. Verify HomePage actions, FE07 candidates, request submission, audit evidence, and non-fixture preservation on live staging.

## 12. Approved Assumptions

- The user's `duyệt` on 2026-08-03 approves preserving existing staging transactions and using isolated resettable demo data.
- The current FE07 and FE08 business rules remain authoritative.
- The four-state continuation action is an additive public read-model contract; `availabilityStatus` remains backward compatible.
- Human H2/H3 review remains required by the repository Constitution.
