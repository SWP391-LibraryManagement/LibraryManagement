# Phase 1 Open Questions Resolution Packet

Date: 2026-06-10
Status: REVIEWED - OPEN QUESTIONS APPROVED
Source review: `.sdd/reviews/review-phase-1-specs-2026-06-10.md`
Purpose: Use this file in the team review meeting to approve, change, or defer every open question before moving specs to Phase 2 Planning.

Review note: Rows marked `APPROVED` are approved by this review pass. No `PENDING` open-question rows remain in this packet.


## Meeting Rule

A question is resolved only when the team writes one of these outcomes:

- `APPROVED`: accept the proposed decision.
- `CHANGED`: replace the proposed decision with a different rule.
- `DEFERRED`: explicitly move the question out of Phase 1 scope.

Do not change any feature `SPEC.md` status to `APPROVED` until its questions below are resolved and copied back into the related `SPEC.md` / `CHANGELOG.md`.

---

## 1. Cross-Feature Decisions To Approve First

| ID | Affected Features | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- | --- |
| X-001 | FE01, FE05 | FE01 owns public browse/search/detail; FE05 owns staff book CRUD and internal book management. Public views hide inactive books. | APPROVED |  |
| X-002 | FE02, FE10, FE11 | Password setup email is owned by FE02/FE11; FE10 provides reusable notification delivery only if called by those features. | APPROVED |  |
| X-003 | FE03, FE11 | FE03 updates own profile fields; FE11 updates admin-managed account fields/status/roles; email changes go through FE02 verification. | APPROVED |  |
| X-004 | FE04, FE11 | Membership approval changes membership application/status only; role assignment remains FE11. | APPROVED |  |
| X-005 | FE06, FE07, FE08 | Phase 1 copy statuses are `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. FE07 owns `BORROWED`; FE08 owns `RESERVED`; FE06 cannot manually override active borrow/reservation. | APPROVED |  |
| X-006 | FE07, FE09 | Any unpaid fine amount > 0 blocks borrow/renewal. Phase 1 supports overdue fines only. FE09 owns fine calculation/creation. | APPROVED |  |
| X-007 | FE07, FE08 | Active reservation/held copy for another member blocks renewal. Phase 1 reservation targets `CopyId`. | APPROVED |  |
| X-008 | FE07, FE09, FE10 | Due-date reminders are manually/scheduler triggered in Phase 1; notification failure does not roll back borrow/return/fine flows. | APPROVED |  |
| X-009 | FE06, FE07, FE09, FE11, FE12 | FE12 reports must use approved source status values from FE06/FE07/FE09/FE11 and stay read-only. | APPROVED |  |

---

## 2. Feature Question Decisions

### FE01 Public / Browse - Owner: Dung

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE01-001 | Hide inactive/deactivated books from all public search/detail views. | APPROVED |  |
| Q-FE01-002 | Guests see simple availability only: `Available` / `Unavailable`, not exact copy count. | APPROVED |  |
| Q-FE01-003 | Phase 1 filters: keyword, title, author, category; pagination required. | APPROVED |  |
| Q-FE01-004 | ISBN is visible to guests when available. | APPROVED |  |
| Q-FE01-005 | Home page displays navigation/search and recent books; featured books are optional/out of scope unless manually configured. | APPROVED |  |

### FE02 Authentication - Owner: Dat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE02-001 | Password requires at least 8 chars, 1 uppercase, 1 number, 1 special char. | APPROVED |  |
| Q-FE02-002 | Access token expires after 15 minutes; refresh token expires after 7 days. | APPROVED | APPROVED - reasonable secure default for Phase 1; update FE02 token/session rules. |
| Q-FE02-003 | Email verification is required if email/mock provider is available; otherwise mark as mock/planned for Phase 1. | APPROVED |  |
| Q-FE02-004 | Multiple concurrent sessions are allowed in Phase 1. | APPROVED |  |
| Q-FE02-005 | Failed login attempts are rate-limited by IP/email with a simple server-side rule. | APPROVED |  |
| Q-FE02-006 | Password reset token expires after 15 minutes. | APPROVED |  |
| Q-FE02-007 | Log password change attempts and failed login attempts. | APPROVED |  |
| Q-FE02-008 | Inactive users cannot log in; no auto-lock job in Phase 1. | APPROVED |  |
| Q-FE02-009 | Use JWT access token plus refresh token. | APPROVED |  |
| Q-FE02-010 | Password reset requires verified email ownership through reset token only; no extra recovery checks in Phase 1. | APPROVED |  |

### FE03 User Profile - Owner: Dat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE03-001 | FE03 can update `Users.Phone`. | APPROVED |  |
| Q-FE03-002 | FE03 cannot update email; email changes must go through FE02 verification. | APPROVED |  |
| Q-FE03-003 | Missing profile records are auto-created on first view. | APPROVED |  |
| Q-FE03-004 | Phase 1 supports avatar URL text only, not file upload. | APPROVED |  |
| Q-FE03-005 | Profile updates write audit logs for changed fields, actor, and timestamp. | APPROVED |  |

### FE04 Membership Management - Owner: Dat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE04-001 | Rejected users can re-apply after correcting information. | APPROVED |  |
| Q-FE04-002 | Rejection reason is required. | APPROVED |  |
| Q-FE04-003 | Membership does not expire in Phase 1. | APPROVED |  |
| Q-FE04-004 | Approved membership changes application/member status only, not user role. | APPROVED |  |
| Q-FE04-005 | Librarian and Admin can approve/reject. | APPROVED | APPROVED - current FE04 already uses Librarian/Admin permission model. |
| Q-FE04-006 | Approval/rejection triggers FE10 notification when notification provider is available; failure does not roll back approval/rejection. | APPROVED |  |

### FE05 Book Management - Owner: Dung

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE05-001 | ISBN is optional but must be unique when provided. | APPROVED |  |
| Q-FE05-002 | Multiple books can share the same title. | APPROVED |  |
| Q-FE05-003 | Deactivated books are hidden from public search but visible in staff/admin management views. | APPROVED |  |
| Q-FE05-004 | Soft delete/deactivation is required; no physical delete in Phase 1. | APPROVED |  |
| Q-FE05-005 | A book belongs to one category in Phase 1. | APPROVED | APPROVED - current SQL schema has single `CategoryId`; many-to-many is future work. |
| Q-FE05-006 | Cover images are stored as URL/path text, not binary database content. | APPROVED |  |
| Q-FE05-007 | Deactivation is blocked when active copies are borrowed or reserved. | APPROVED |  |

### FE06 Inventory / Book Copy Management - Owner: Dat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE06-001 | Allowed copy statuses: `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. | APPROVED |  |
| Q-FE06-002 | Staff cannot manually set `BORROWED` or `RESERVED`; those come only from FE07/FE08 flows. | APPROVED |  |
| Q-FE06-003 | `DELETE /api/book-copies/{id}` deactivates instead of physical delete. | APPROVED |  |
| Q-FE06-004 | `Location` is optional in Phase 1. | APPROVED |  |
| Q-FE06-005 | Copy condition is not separate from status in Phase 1. | APPROVED |  |
| Q-FE06-006 | Create/update/deactivate/status-change actions write `AuditLogs`. | APPROVED |  |

### FE08 Reservation Management - Owner: Nhat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE08-001 | Reservation targets physical copy `CopyId` in Phase 1. | APPROVED |  |
| Q-FE08-002 | Member cannot reserve when a copy is currently available. | APPROVED |  |
| Q-FE08-003 | Maximum 3 active reservations per member. | APPROVED | APPROVED - simple Phase 1 limit; add business rule and test. |
| Q-FE08-004 | Notified reservation stays valid for 2 calendar days. | APPROVED | APPROVED - simple Phase 1 hold window; add expiration rule. |
| Q-FE08-005 | Queue processing is manual by librarian in Phase 1; automatic trigger is future work. | APPROVED |  |

### FE09 Fine Management - Owner: Dung

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE09-001 | Phase 1 supports overdue fines only; lost/damaged fines are out of scope. | APPROVED |  |
| Q-FE09-003 | No partial payments in Phase 1. | APPROVED |  |
| Q-FE09-004 | Store collector ID and note with the fine payment record/table if payment tracking exists; otherwise store on fine record for Phase 1. | APPROVED |  |
| Q-FE09-005 | Admin can waive/cancel fines with required reason and audit log. | APPROVED | APPROVED - admin-only sensitive action; require reason and audit log. |
| Q-FE09-006 | Fine calculation runs on return and may also run manually by librarian/admin; scheduled daily job is future work. | APPROVED |  |

### FE10 Notification Management - Owner: Nhat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE10-001 | Phase 1 required channel is email with mock provider. | APPROVED |  |
| Q-FE10-002 | In-app notification is optional/future work in Phase 1. | APPROVED |  |
| Q-FE10-003 | Required templates: verification, password reset, due reminder, overdue notice, reservation ready, membership result. | APPROVED |  |
| Q-FE10-004 | Store notification send attempts and status. | APPROVED |  |
| Q-FE10-005 | Retry failed sends manually only in Phase 1. | APPROVED |  |
| Q-FE10-006 | Notification failure must not block source business flow. | APPROVED |  |
| Q-FE10-007 | System/Scheduler may trigger notifications internally; not a login role. | APPROVED |  |

### FE11 User & Role Management - Owner: Dung

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE11-001 | Admins cannot deactivate themselves. | APPROVED |  |
| Q-FE11-002 | Prevent deactivation of users with active borrowings. | APPROVED | APPROVED - safer than warning; prevents invalid borrowing lifecycle. |
| Q-FE11-003 | Password setup uses the same FE02 password complexity rule. | APPROVED |  |
| Q-FE11-004 | Email is case-insensitive for login and uniqueness. | APPROVED |  |
| Q-FE11-005 | Admin-created user receives one-time password setup link when FE10/email mock is available. | APPROVED |  |
| Q-FE11-006 | Do not permanently delete deactivated user data in Phase 1. | APPROVED |  |
| Q-FE11-007 | No role hierarchy in Phase 1; roles are flat. | APPROVED |  |
| Q-FE11-008 | Admin cannot view sensitive account fields such as password hash, reset tokens, refresh tokens. | APPROVED |  |
| Q-FE11-009 | User deactivation notification is optional/future work unless FE10 scope accepts it. | APPROVED | APPROVED - optional/future work; no mandatory Phase 1 notification. |

### FE12 Reporting & Statistics - Owner: Nhat

| Question | Proposed Decision | Outcome | Notes |
| --- | --- | --- | --- |
| Q-FE12-001 | Librarian and Admin can view reports; Member/Guest cannot. | APPROVED |  |
| Q-FE12-002 | Borrowing metrics: active loans, overdue loans, borrow count by period, top borrowed books. | APPROVED |  |
| Q-FE12-003 | Inventory metrics: total books, total copies, copies by status, low/no availability books. | APPROVED |  |
| Q-FE12-004 | User statistics: total members, active/inactive users, new members by period. | APPROVED |  |
| Q-FE12-005 | CSV/PDF export is out of scope unless team requires it. | APPROVED |  |
| Q-FE12-006 | Report access writes audit logs for Admin/Librarian report views. | APPROVED |  |

---

## 3. Approval Checklist

Audit note: items below were rechecked against approved `SPEC.md` files, feature `CHANGELOG.md` files, and the Week 3 closeout. Team signoff is recorded for the Phase 1 specification baseline.

- [x] Cross-feature decisions X-001 to X-009 are approved/changed/deferred.
- [x] Each owner reviews their feature decisions.
- [x] Changed decisions are copied into affected `SPEC.md` files.
- [x] Deferred decisions are added to each feature `Out of Scope` / `Open Questions` section.
- [x] Each affected `CHANGELOG.md` records the approval update.
- [x] Approved feature `SPEC.md` files change status from `DRAFT` to `APPROVED`.
- [x] `PLAN.md` is expanded only after the related `SPEC.md` is approved.
- [x] `TASKS.md` is expanded only after the related `PLAN.md` is approved.
- [x] Reviewer signs off. (Team review signoff recorded on 2026-06-10.)

## 4. Suggested Review Agenda

1. Approve cross-feature decisions first.
2. Review features by dependency order: FE02, FE11, FE03, FE04, FE05, FE06, FE08, FE09, FE10, FE12, FE01.
3. For each row, write `APPROVED`, `CHANGED`, or `DEFERRED`.
4. Assign one owner to update specs and changelogs after the meeting.
5. Re-run review before changing any status to `APPROVED`.
