# Admin Membership Review Integration Design

Status: APPROVED BY HUMAN - 2026-07-22

Date: 2026-07-22

## 1. Decision

Use Hybrid SDD + ADD at Standard depth. FE04 membership review state,
authorization, atomic transitions, audit persistence, and FE10 result delivery
remain Core. The Admin navigation, responsive list/cards, modal, and feedback
presentation are Shell.

The Admin Console shall add a real `Duyệt hội viên` section after `Quản lý
người dùng`. Selecting it renders the FE04 review workflow inside the current
Admin shell instead of navigating to the separate `/membership` workspace.

## 2. Problem And Existing Baseline

FE04 already exposes the approved staff endpoints and the canonical
`/membership` workspace supports both Librarian and Admin review. The modular
Admin Console refactor deliberately removed its old unreachable membership
render path and locked the sidebar to seven entries. Authenticated review then
showed that Admin users reasonably expect membership approval in the Admin
Console itself.

This design supersedes only the earlier decisions that excluded FE04 from the
Admin Console and fixed the corrected sidebar at seven entries. It does not
restore the removed Permissions item, payment workflow, demo data, or the old
Admin monolith.

## 3. Scope

### In scope

- Add `Duyệt hội viên` after `Quản lý người dùng` in desktop and mobile Admin
  navigation.
- Render an Admin-native FE04 application list, filters, pagination, detail,
  approve, and reject flow inside `AdminConsolePage`.
- Preserve canonical FE04 server behavior, including pending-only transitions,
  required rejection reason, audit atomicity, and non-blocking FE10 delivery.
- Provide loading, empty, error, retry, conflict, and safe notification-result
  feedback.
- Use table presentation on wide screens and cards at 1440px and below.
- Retain the existing `/membership` Member/Librarian workspace and its API.

### Out of scope

- Database, migration, public API, DTO, or FE04 state-machine changes.
- Membership expiry, renewal, payment, membership-number, or bulk review.
- Role assignment as a side effect of membership approval.
- Moving Librarian or Member workflows into the Admin Console.
- Restoring the standalone Permissions sidebar item.

## 4. Ownership And Architecture

FE11 owns the Admin shell and its navigation entry. FE04 owns all membership
review data and mutations. The Admin module consumes `membershipApi` directly;
it does not create an `/api/admin/membership` alias or copy business rules into
the frontend.

Planned presentation units:

- `admin/membership/AdminMembershipSection.jsx`: orchestration, filters,
  pagination, authoritative reload, and toast requests.
- `admin/membership/AdminMembershipReviewModal.jsx`: read-only applicant detail,
  approval confirmation, and bounded rejection input.
- `admin/membership/adminMembershipPresentation.js`: pure normalization and
  safe notification/status presentation helpers.
- `adminNavigation.js` and `AdminConsolePage.jsx`: navigation and section
  composition only.

The existing `MembershipPage.jsx` remains the canonical non-Admin-shell
workspace. Domain API ownership is shared; visual shell components are not
shared when doing so would mix the AppLayout and Admin design systems.

## 5. Navigation Contract

The Admin sidebar shall contain exactly eight entries in this order:

1. Trang chủ
2. Tổng quan
3. Thư viện
4. Quản lý mượn trả
5. Quản lý yêu cầu
6. Quản lý người dùng
7. Duyệt hội viên
8. Nhật ký hoạt động

`Phân quyền`, `Xác nhận thanh toán`, and `Xác nhận mượn` remain absent. Manage
Roles remains available from User Management.

## 6. Review Experience

The section opens with `PENDING` selected and exposes:

- server search by application ID, name, username, or email;
- status filter for `PENDING`, `APPROVED`, `REJECTED`, or all;
- server pagination with a limit of 10;
- application ID, applicant identity/contact, applied date, status, and action;
- an Admin-native table above 1440px and responsive cards at/below 1440px.

Selecting a row opens a modal. Only a `PENDING` row exposes decision controls.
Approval requires an explicit confirmation. Rejection requires trimmed input of
1..500 characters. Final applications remain view-only.

## 7. Data Flow And Error Handling

1. Load `GET /api/membership/applications` with frozen applied values for `q`,
   `status`, `page`, and `limit`.
2. Approve with `PATCH /api/membership/applications/{id}/approve` or reject with
   `PATCH /api/membership/applications/{id}/reject` and `{ reason }`.
3. Never optimistically finalize a row. After success or `409
   MEMBERSHIP_APPLICATION_NOT_PENDING`, reload authoritative server data.
4. On a successful decision, close the modal and show success. If
   `notificationStatus = FAILED`, show a non-blocking warning that the decision
   succeeded but the result notification was not sent. `PENDING`, `SENT`,
   `FAILED`, and `NOT_CONFIGURED` are the only safe presentation states.
5. Display safe localized feedback for `400`, `401`, `403`, `404`, `409`, and
   network/server failures. Never display raw stacks or provider errors.

## 8. Responsive And Accessibility Contract

- No document-level horizontal overflow at 1440, 1366, 1280, or 390 pixels.
- Table headers, controls, modal title, rejection label, and buttons have
  accessible names.
- Keyboard users can search with Enter, close the modal, and reach both decision
  controls in logical order.
- Loading state prevents duplicate mutations; controls expose disabled state.
- Focus returns to the row action that opened the modal after the modal closes.
- Reduced-motion and the existing Admin focus-visible contracts are preserved.

## 9. Security And Business Safety

- Server-side FE04 authentication and `ADMIN`/`LIBRARIAN` authorization remain
  authoritative.
- Only `PENDING` applications may transition.
- Rejection reason is validated on both client and server, with the server
  authoritative.
- Application, canonical member projection, reviewer metadata, and audit entry
  continue to commit atomically.
- FE10 delivery remains post-commit and non-blocking.
- The UI consumes only the safe FE04 list/review response and introduces no
  unsafe HTML or credential fields.

## 10. Test Strategy

Test-first implementation shall prove:

- exact eight-entry navigation order with Membership Review present and
  Permissions absent;
- Admin section composition uses `membershipApi` and no Admin mutation alias;
- `q`, `status`, `page`, and `limit` remain server-owned;
- only pending rows expose approve/reject actions;
- approval confirmation and rejection reason bounds;
- authoritative reload after success and review conflict;
- safe FE10 `FAILED` warning without reporting the decision as failed;
- loading, empty, error, retry, desktop table, responsive cards, and no page
  overflow at 1440/1366/1280/390;
- existing Member/Librarian `/membership` tests remain green;
- focused FE04 backend authorization/transition tests remain green.

## 11. Acceptance Criteria

- Given an authenticated Admin on `/admin/users`, when `Duyệt hội viên` is
  selected, then the integrated FE04 review section opens without leaving the
  Admin shell.
- Given pending applications, when the Admin searches, filters, or changes page,
  then results come from the canonical FE04 list endpoint.
- Given a pending application, when the Admin confirms approval or submits a
  valid rejection reason, then the canonical FE04 mutation runs once and the
  list reloads from the server.
- Given another reviewer finalized the application first, when the Admin acts,
  then the UI reports the conflict and refreshes without claiming success.
- Given the decision commits but notification delivery fails, then the UI
  reports the decision as successful and shows a non-blocking delivery warning.
- Given an approved/rejected application, then the modal is view-only.
- Given a desktop, laptop, or mobile review viewport, then the section remains
  usable without document-level horizontal scrolling.

## 12. Approved Assumptions

- The sidebar label is `Duyệt hội viên` and follows User Management.
- Admin receives an embedded module; Librarian and Member keep `/membership`.
- The current FE04 API and schema are sufficient.
- No role changes occur during membership approval.
