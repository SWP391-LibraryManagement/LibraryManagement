# Review - Phase 1 Feature Specifications

Date: 2026-06-10

Status: SUPERSEDED - RESOLVED BY WEEK 3 CLOSEOUT

Superseded note: This was the initial Phase 1 review. Its blockers were later resolved by `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md` and closed by `.sdd/reviews/week-3-spec-finalization-closeout-2026-06-10.md`. Keep this file as historical evidence, not the current readiness verdict.

Scope: Review all 12 feature specifications before moving from Phase 1 Specification to Phase 2 Planning.

Sources:

- `.sdd/specs/*/SPEC.md`
- `.sdd/specs/*/CONTEXT.md`
- `docs/phase_1_foundation/07_master_feature_list.md`
- `C:\Users\admin\Downloads\Library Management (3).xlsx`
- `.sdd/shared_context.md`
- `.sdd/constraints/*.md`

Book alignment:

- Phase 1 output must be reviewed `SPEC.md`.
- Open questions must be resolved or explicitly deferred.
- Spec must be approved/locked before detailed `PLAN.md`, `TASKS.md`, or implementation.
- Every feature folder should keep `SPEC.md`, `CONTEXT.md`, `PLAN.md`, `TASKS.md`, and `CHANGELOG.md`.

---

## 1. Executive Verdict

The structural and assignment-traceability blockers found in the first review pass have been fixed.

The full project is still not ready to move to Phase 2 Planning because most feature specs have not been approved by the team reviewer yet. FE07 Borrowing Management is now approved for Phase 2 planning.

Reasons:

1. Most `SPEC.md` files are still `DRAFT` or `DRAFT (Proposed Design)`.
2. Many open questions or proposed decisions remain unresolved across features.
3. Several cross-feature decisions must be approved together to avoid conflicting implementation later.

Recommended next action:

1. Hold a team approval meeting using Section 5 and Section 6 of this review.
2. Update affected specs with approved decisions.
3. Change status to `APPROVED` only after review checklist items are satisfied.

---

## 2. Feature Readiness Summary

| Feature | Owner | Status | Assignment Mapping | Structure | Open Q Count | Phase 2 Verdict |
| ------- | ----- | ------ | ------------------ | --------- | ------------ | --------------- |
| FE01 Public / Browse | Dung | DRAFT | OK | OK | 5 | Not ready |
| FE02 Authentication | Dat | DRAFT (Proposed Design) | OK | OK | 10 | Not ready |
| FE03 User Profile | Dat | DRAFT | OK | OK | 5 | Not ready |
| FE04 Membership Management | Dat | DRAFT | OK | OK | 6 | Not ready |
| FE05 Book Management | Dung | DRAFT | OK | OK | 7 | Not ready |
| FE06 Inventory / Book Copy Management | Dat | DRAFT | OK | OK | 6 | Not ready |
| FE07 Borrowing Management | Nhat | APPROVED | OK | OK | 0 | Ready for Phase 2 |
| FE08 Reservation Management | Nhat | DRAFT | OK | OK | 5 | Not ready |
| FE09 Fine Management | Dung | DRAFT | OK | OK | 5 | Not ready |
| FE10 Notification Management | Nhat | DRAFT (Proposed Design) | OK | OK | 7 | Not ready |
| FE11 User & Role Management | Dung | DRAFT (Proposed Design) | OK | OK | 9 | Not ready |
| FE12 Reporting & Statistics | Nhat | DRAFT | OK | OK | 6 | Not ready |

Notes:

- Assignment mapping was checked against the latest Excel sheet.
- Structure means the `SPEC.md` contains the required sections from the project rules: overview, actors, preconditions, flows, business rules, functional requirements, acceptance criteria, edge cases, data, API/interface, NFRs, out of scope, dependencies, open questions, traceability, and review checklist.

---

## 3. Current Blocking Findings

### BLOCKER-001: All specs are still draft

Files: all `.sdd/specs/feat-*/SPEC.md`

Problem:

Every `SPEC.md` is still `DRAFT` or `DRAFT (Proposed Design)`.

Impact:

According to the SDD process, Phase 2 Planning should not start until the relevant `SPEC.md` files are approved.

Required action:

Resolve or explicitly defer open questions, then update status to `APPROVED` after team review.

---

### BLOCKER-002: Open questions and proposed decisions still need approval

Files: all feature specs

Impact:

Implementation can diverge across features if the team starts planning before shared decisions are approved.

Required action:

Approve, change, or explicitly defer the questions in Section 5.

---

## 3.1 Fixed Findings

The following issues from the first review pass have been fixed:

- FE05 `SPEC.md` now contains all required sections from Section 8 through Section 17.
- FE05 scope level now matches the Master Feature List as Standard Spec.
- FE02 UC/FT IDs now match the latest Excel assignment sheet: UC05-UC10 and FT05-FT11.
- API contract policy is now consistent: API contracts may be approved inside each `SPEC.md` unless the team reintroduces a dedicated shared API contract document.
- FE07 open questions, flow review, API contract, FE08/FE09 dependency check, and acceptance-criteria testability review are complete; FE07 `SPEC.md` is now `APPROVED`.

---

## 4. Cross-feature Scope And Dependency Risks

### RISK-001: FE01 and FE05 both cover guest/member search and book details

Affected features:

- FE01 Public / Browse
- FE05 Book Management

Why it matters:

FE01 owns public browsing and home/search/detail experience. FE05 also includes search/view book details for Guest and Member in the assignment sheet.

Recommended boundary:

- FE01: public UI/navigation/home/browse experience and public-safe read-only behavior.
- FE05: catalog data rules and staff book management; shared read APIs may serve FE01.

Approval needed:

Confirm whether FE01 implements the public pages while FE05 owns catalog data/API, or whether the team wants a different split.

---

### RISK-002: FE02, FE10, and FE11 overlap around account/password setup email

Affected features:

- FE02 Authentication
- FE10 Notification Management
- FE11 User & Role Management

Why it matters:

FE11 proposes admin-created user setup via one-time link. FE02 owns token generation/validation. FE10 currently covers account verification and password reset notification, but password setup notification was removed from FE10 assignment scope to match Excel.

Approval needed:

Choose one:

- Password setup email is treated as part of FE02/FE11 only, not FE10.
- FE10 explicitly supports password setup notification as an internal dependency, even though Excel only names password reset notification.

Do not implement until this is decided.

---

### RISK-003: FE03 and FE11 overlap around user data updates

Affected features:

- FE03 User Profile
- FE11 User & Role Management

Why it matters:

FE03 lets users update their own profile. FE11 lets admins update user information. Email/phone/status/role boundaries must be clear.

Recommended boundary:

- FE03: own profile fields only.
- FE11: admin-managed account metadata, status, roles, librarian accounts.
- FE02: password and email verification behavior.

Approval needed:

Decide whether FE03 can update `Users.Phone` and whether email changes are allowed only through FE02.

---

### RISK-004: FE04 and FE11 overlap around membership and roles

Affected features:

- FE04 Membership Management
- FE11 User & Role Management

Why it matters:

FE04 approves membership applications. FE11 manages user roles. If approval changes role automatically, both features need the same rule.

Recommended boundary:

- FE04 owns membership application status.
- FE11 owns role assignment.

Approval needed:

Decide whether approved membership changes only membership status or also updates roles.

---

### RISK-005: FE06, FE07, and FE08 must share copy status rules

Affected features:

- FE06 Inventory / Book Copy Management
- FE07 Borrowing Management
- FE08 Reservation Management

Why it matters:

Borrowing and reservation depend on `BookCopies.Status`. Conflicting transitions can allow double-borrowing or invalid availability.

Recommended Phase 1 status set:

- `AVAILABLE`
- `BORROWED`
- `RESERVED`
- `DAMAGED`
- `LOST`
- `INACTIVE`

Approval needed:

Decide which feature can set each status and whether manual staff updates can override `BORROWED` or `RESERVED`.

---

### RISK-006: FE07 and FE09 must agree on unpaid fine blocking and damaged/lost fine behavior

Affected features:

- FE07 Borrowing Management
- FE09 Fine Management

Why it matters:

FE07 must know whether unpaid fines block borrowing. FE09 must know when fines are created from overdue/damaged/lost returns.

Approved baseline already exists:

- Overdue fine = 5,000 VND per overdue day per copy.
- Fine starts the day after due date.

Approval still needed:

- Whether any unpaid fine blocks borrowing.
- Whether damaged/lost fines are Phase 1.
- Whether FE07 creates fine requests automatically on return, or FE09 calculates manually/scheduled.

---

### RISK-007: FE07 and FE08 must agree on reservation impact on renewals

Affected features:

- FE07 Borrowing Management
- FE08 Reservation Management

Why it matters:

If another member reserves a book/copy, renewal may need to be blocked.

Approval needed:

Decide whether active reservations block renewal and whether reservation target is `BookId` or `CopyId`.

---

### RISK-008: FE10 scheduling depends on FE07 and FE09

Affected features:

- FE07 Borrowing Management
- FE09 Fine Management
- FE10 Notification Management

Why it matters:

Due date/fine notifications require a trigger source. FE10 should deliver notifications, but not decide borrowing/fine events.

Approval needed:

Decide whether due date reminders are scheduled automatically, manually triggered, or omitted from Phase 1 implementation.

---

### RISK-009: FE12 reports depend on finalized status values

Affected features:

- FE06 Inventory
- FE07 Borrowing
- FE09 Fine
- FE11 User & Role
- FE12 Reporting

Why it matters:

Reports will be wrong if source features use inconsistent status values.

Approval needed:

Approve source status values before FE12 planning.

---

## 5. Open Questions To Resolve

This list contains the questions that block approval unless the team explicitly defers them as out of scope.

### FE01 Public / Browse - Dung

- Q-FE01-001: Should inactive/deactivated books be hidden from all public search/detail views?
- Q-FE01-002: Should guests see exact available copy count, simple available/unavailable, or no availability?
- Q-FE01-003: Which search filters are required in Phase 1?
- Q-FE01-004: Should ISBN be visible to guests?
- Q-FE01-005: Should home page display featured/recent books or only navigation and search?

### FE02 Authentication - Dat

- Q-FE02-001: What is the minimum password length and complexity requirement?
- Q-FE02-002: What is the session timeout duration?
- Q-FE02-003: Should the system enforce email verification during registration, or optional?
- Q-FE02-004: Should the system allow multiple concurrent sessions per user?
- Q-FE02-005: Should failed login attempts be rate-limited?
- Q-FE02-006: What is the expiration time for password reset tokens?
- Q-FE02-007: Should the system log password change attempts and login failures?
- Q-FE02-008: Should inactive users be auto-locked?
- Q-FE02-009: Session management strategy: JWT, cookies, or refresh tokens?
- Q-FE02-010: Should password reset require email verification only, or more recovery checks?

### FE03 User Profile - Dat

- Q-FE03-001: Can FE03 update `Users.Phone`, or is phone managed elsewhere?
- Q-FE03-002: Can FE03 update email, or must email changes go through FE02 verification?
- Q-FE03-003: Should missing profile records be auto-created on first view?
- Q-FE03-004: Are avatar uploads required, or only avatar URL text?
- Q-FE03-005: Should profile updates write audit logs?

### FE04 Membership Management - Dat

- Q-FE04-001: Can rejected users re-apply?
- Q-FE04-002: Is rejection reason required?
- Q-FE04-003: Does membership expire or require renewal?
- Q-FE04-004: Does approved membership change a user role, or only application status?
- Q-FE04-005: Should both Librarian and Admin approve/reject, or Admin only?
- Q-FE04-006: Should approval/rejection trigger FE10 notification?

### FE05 Book Management - Dung

- Q-FE05-001: Is ISBN mandatory for every book?
- Q-FE05-002: Can multiple books share the same title?
- Q-FE05-003: Should deactivated books remain searchable?
- Q-FE05-004: Is soft delete required for books?
- Q-FE05-005: Can a book belong to multiple categories?
- Q-FE05-006: Should book cover images be stored in database or file storage?
- Q-FE05-007: Should deactivation be blocked when active copies are borrowed or reserved?

### FE06 Inventory / Book Copy Management - Dat

- Q-FE06-001: What are the final allowed `BookCopies.Status` values for Phase 1?
- Q-FE06-002: Can staff manually set `BORROWED` or `RESERVED`, or must those only come from FE07/FE08?
- Q-FE06-003: Should `DELETE /api/book-copies/{id}` deactivate instead of physical delete?
- Q-FE06-004: Is `Location` required for every copy?
- Q-FE06-005: Should copy condition be separate from copy status?
- Q-FE06-006: Which copy actions must write `AuditLogs`?

### FE07 Borrowing Management - Nhat

- No remaining FE07 open questions after the 2026-06-10 decision update.

Note:

- Q-FE07-001 and Q-FE07-002 are resolved in FE07 using `.sdd/shared_context.md`: 5 active borrowed copies and 14 calendar days.
- Q-FE07-003 to Q-FE07-008 are resolved in FE07 using the approved owner decisions: 1 renewal, unpaid fines block borrowing/renewal, members create own requests, pending details use `REQUESTED`, requests auto-complete when all details are terminal, and FE09 owns fine creation.

### FE08 Reservation Management - Nhat

- Q-FE08-001: Is reservation at book level (`BookId`) or physical copy level (`CopyId`)?
- Q-FE08-002: Can a member reserve a book if one copy is currently available?
- Q-FE08-003: Maximum active reservations per member?
- Q-FE08-004: How long does a notified reservation stay valid before expiration?
- Q-FE08-005: Should queue processing be automatic after return, manual by librarian, or both?

Note:

- Q-FE08-006 is resolved with FE07: active reservation/held copy for another member blocks renewal.

### FE09 Fine Management - Dung

- Q-FE09-001: Are lost/damaged fines required in Phase 1, or only overdue fines?
- Q-FE09-003: Should fine collection support partial payments?
- Q-FE09-004: Should collection store collector ID and note in a separate table?
- Q-FE09-005: Can Admin waive or cancel fines?
- Q-FE09-006: Should calculation run automatically on return, manually by librarian, scheduled daily, or all?

Note:

- Q-FE09-002 is resolved with FE07: any `UNPAID` fine with amount greater than 0 blocks new borrowing and renewal.

### FE10 Notification Management - Nhat

- Q-FE10-001: Which channels are required for Phase 1: email only, in-app only, or both?
- Q-FE10-002: Which email provider or mock strategy will be used in development?
- Q-FE10-003: Should members be able to disable optional reminders, or are all notifications mandatory?
- Q-FE10-004: How long should delivery records be retained?
- Q-FE10-005: Should due date reminders be scheduled automatically, and how many days before due date?
- Q-FE10-006: Should notification templates be fixed in seed/static configuration for Phase 1?
- Q-FE10-007: Should failed notification delivery block the source business flow?

### FE11 User & Role Management - Dung

- Q-FE11-001: Should admins be able to deactivate themselves?
- Q-FE11-002: Should system prevent deactivation of users with active borrowings, or just warn?
- Q-FE11-003: What is the password complexity requirement when the user completes password setup through FE02?
- Q-FE11-004: Should email be case-sensitive or case-insensitive for login and uniqueness checks?
- Q-FE11-005: Should user creation automatically send a password setup email with a one-time link?
- Q-FE11-006: How long should deactivated user data be retained before permanent deletion?
- Q-FE11-007: Should system support role hierarchy?
- Q-FE11-008: Should admin be able to view another admin's sensitive account fields?
- Q-FE11-009: Should user deactivation notify the user via email?

### FE12 Reporting & Statistics - Nhat

- Q-FE12-001: Which roles can view borrowing, inventory, and user reports?
- Q-FE12-002: Which borrowing metrics are required?
- Q-FE12-003: Which inventory metrics are required?
- Q-FE12-004: Which user statistics are required?
- Q-FE12-005: Is export to CSV/PDF required in Phase 1?
- Q-FE12-006: Should report access be audited?

---

## 6. Recommended Approval Decisions

These are recommended defaults to help the team approve specs quickly. They are not final until the team accepts them.

| Area | Recommendation |
| ---- | -------------- |
| FE01 public fields | Show title, author, category, publisher, publish year, description, cover, and simple availability. Hide internal copy/barcode details from guests. |
| FE01 search | Support keyword search by title/author/category and pagination. |
| FE02 password | 8+ chars, at least 1 uppercase, 1 number, 1 special char. |
| FE02 session | JWT access token with refresh token; access token short-lived; exact duration approved by team. |
| FE02 email verification | Required for registration if FE10/email mock is available; otherwise mark as planned/mock for Phase 1. |
| FE03 profile | Users may update own full name, address, date of birth, avatar URL, and phone. Email changes stay in FE02. |
| FE04 membership | Approval changes membership application status only, not roles. Librarian/Admin can approve/reject. Rejection reason required. No expiry in Phase 1. |
| FE05 book | ISBN optional but unique when provided; title required; soft deactivation; multiple same titles allowed. |
| FE06 copy status | Use `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. |
| FE06 transitions | FE07 owns `BORROWED`; FE08 owns `RESERVED`; FE06 staff changes cannot override active borrow/reservation. |
| FE07 borrow baseline | Max 5 active borrowed copies; default loan duration 14 days. These are already approved in shared context. |
| FE07 renewal | Allow 1 renewal if no overdue, no blocking fine, and no active reservation conflict. |
| FE08 target | Use current SQL `CopyId` for Phase 1 unless the team approves DB change to book-level reservation. |
| FE08 queue | Manual processing by librarian for Phase 1; automatic trigger can be future work. |
| FE09 fine | Phase 1 overdue fines only; 5,000 VND/day/copy; any unpaid fine blocks borrowing unless team changes it. |
| FE09 collection | No partial payments in Phase 1; mark full fine as paid with `PaidAt`. |
| FE10 channel | Email with mock provider is required; in-app optional if time permits. |
| FE10 failure | Notification failure must not roll back source business flow. |
| FE11 roles | Flat roles: Guest, Member, Librarian, Admin. No hierarchy in Phase 1. |
| FE11 deactivation | Do not permanently delete users; use inactive status. Prevent deactivating the last active Admin. |
| FE12 reports | Read-only reports only. No CSV/PDF export unless team explicitly requires it. |

---

## 7. Approval Checklist For The Team

Before any feature enters Phase 2 Planning:

- [x] FE05 `SPEC.md` is completed.
- [x] FE02 UC/FT IDs are aligned to latest Excel.
- [x] All open questions are resolved or explicitly deferred.
- [x] Cross-feature boundaries in Section 4 are approved.
- [x] Shared decisions are propagated to affected specs.
- [x] Each `SPEC.md` status is changed from `DRAFT` to `APPROVED`.
- [x] Each `PLAN.md` remains `NOT STARTED` until its `SPEC.md` is approved.
- [x] Each `TASKS.md` remains `NOT STARTED` until its `PLAN.md` is approved.
- [x] API contract policy is consistent across all specs.
- [x] Reviewer signs off before implementation. (Team review signoff recorded on 2026-06-10.)

---

## 8. Suggested Work Order

1. Approve shared cross-feature decisions:
   - copy statuses
   - borrow limit/loan duration/renewal
   - reservation target and queue behavior
   - fine blocking and calculation behavior
   - notification channel/provider
   - profile/user/role boundaries
2. Update each affected `SPEC.md`.
3. Mark approved specs as `APPROVED`.
4. Start Phase 2 by writing `PLAN.md` for approved features only.
