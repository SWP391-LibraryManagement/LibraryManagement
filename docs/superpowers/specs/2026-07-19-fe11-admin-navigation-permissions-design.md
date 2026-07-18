# FE11 Admin Navigation And Permissions Design

Status: APPROVED BY HUMAN - 2026-07-19

Date: 2026-07-19

Scope: `TD-023`; `FR-FE11-030`, `FR-FE11-032`, `AC-FE11-016`, `AC-FE11-017`

## 1. Decision

Use Hybrid SDD + ADD at Standard depth.

- Core: the approved Admin navigation, Admin-only read boundary, canonical permission matrix, FE11/FE12 ownership, and failure isolation.
- Shell: sidebar labels, cards, tables, loading/error presentation, and responsive rendering.

The selected architecture is a canonical FE11 read-only Permissions API plus independent FE12 role counts. The frontend must not own a hardcoded permission matrix and must not derive counts from paginated user rows.

Whole-feature metadata remains `Implementation State: DEFERRED`.

## 2. Approved Scope

### In Scope

- Align the Admin Console sidebar to the eight approved FE11 sections.
- Make the Permissions section reachable from the sidebar.
- Add Admin-only `GET /api/admin/permissions`.
- Move the Phase 1 permission policy out of `UserManagement.jsx` into an FE11 backend policy module.
- Load the FE11 permission matrix and FE12 role counts independently.
- Render a read-only role summary, module coverage, and permission matrix.
- Add backend/frontend contract tests and complete the normal validation gates.

### Out Of Scope

- Permission editing, role hierarchy, role creation, or role deletion.
- A new `Permissions` database table or any schema migration.
- Removing the FE04 Membership page, route, API, or implementation.
- Request Management detail/immutability work tracked by `TD-025`.
- User update/deactivation, librarian fields, optimistic concurrency, or whole-feature FE11 completion.

## 3. Admin Navigation Contract

The Admin Console sidebar contains exactly these entries in this order:

1. `home` - Trang chủ - navigates to `/home`.
2. `dashboard` - Tổng quan.
3. `library` - Thư viện.
4. `circulation` - Quản lý mượn trả.
5. `requests` - Quản lý yêu cầu.
6. `users` - Quản lý người dùng.
7. `permissions` - Phân quyền.
8. `audit` - Nhật ký hoạt động.

`membership`, `Confirm Payment`, and `Confirm Borrow` are not Admin Console sidebar entries. Removing `membership` from this sidebar does not remove or modify FE04 functionality elsewhere.

Manage Roles remains an explicit user action under Quản lý người dùng. The Permissions page is read-only.

## 4. API Contract

### Endpoint

`GET /api/admin/permissions`

- Actor: Admin only.
- Request body/query: none.
- Authentication and Admin authorization run before the controller.
- Response is deterministic, read-only, and has no database mutation.

### Response

```json
{
  "roles": [
    { "roleName": "ADMIN", "label": "Admin" },
    { "roleName": "LIBRARIAN", "label": "Librarian" },
    { "roleName": "MEMBER", "label": "Member" }
  ],
  "permissions": [
    {
      "permissionKey": "USER_VIEW",
      "label": "View users",
      "moduleKey": "USER_ROLE",
      "moduleLabel": "User & Role",
      "allowedRoles": ["ADMIN"]
    }
  ]
}
```

Top-level keys are exactly `roles` and `permissions`.

Role objects contain exactly `roleName` and `label`. Permission objects contain exactly `permissionKey`, `label`, `moduleKey`, `moduleLabel`, and `allowedRoles`.

Allowed role names are limited to `ADMIN`, `LIBRARIAN`, and `MEMBER`. Arrays use deterministic order and contain no duplicates.

## 5. Canonical Phase 1 Matrix

| Module | Permission key | Label | Allowed roles |
| --- | --- | --- | --- |
| User & Role | `USER_VIEW` | View users | ADMIN |
| User & Role | `USER_CREATE` | Create accounts | ADMIN |
| User & Role | `USER_UPDATE` | Update accounts | ADMIN |
| User & Role | `USER_DEACTIVATE` | Deactivate accounts | ADMIN |
| User & Role | `ROLE_MANAGE` | Manage roles | ADMIN |
| User & Role | `AUDIT_VIEW` | View audit logs | ADMIN |
| Library | `CATALOG_MANAGE` | Manage library catalog | ADMIN, LIBRARIAN |
| Library | `METADATA_MANAGE` | Manage authors/publishers/categories | ADMIN |
| Borrow/Return | `BORROW_APPROVE_REJECT` | Approve/reject borrow requests | ADMIN, LIBRARIAN |
| Borrow/Return | `RETURN_RENEW_PROCESS` | Process returns and renewals | ADMIN, LIBRARIAN |
| Fine | `FINE_CALCULATE_COLLECT` | Calculate and collect fines | ADMIN, LIBRARIAN |
| Fine | `FINE_WAIVE_CANCEL` | Waive or cancel fines | ADMIN |
| Reports | `REPORT_VIEW` | View reports | ADMIN, LIBRARIAN |
| Borrow/Return | `BORROW_REQUEST_CREATE` | Create borrow request | MEMBER |
| Borrow/Return | `BORROW_HISTORY_VIEW_OWN` | View own borrowing history | MEMBER |

The backend policy module is the only product-code owner of this matrix. The frontend derives table booleans and module coverage counts from the response.

## 6. Data Flow And Ownership

1. Opening Permissions triggers `adminApi.permissions()`.
2. FE11 returns the canonical read-only matrix.
3. Existing FE12 `reportApi.users()` supplies global `usersByRole` counts.
4. The frontend joins the two responses by `roleName` only for presentation.
5. Module coverage is derived by counting permissions whose `allowedRoles` contain each role.

The two requests remain independent:

- FE11 matrix failure does not erase a successful FE12 count result.
- FE12 statistics failure does not erase a successful FE11 matrix result.
- List filters and pagination do not affect role counts.
- No `/api/admin/user-summary` or duplicate count query is introduced.

## 7. Error And Security Behavior

- Missing/invalid authentication returns `401`.
- Authenticated Member or Librarian access returns `403`.
- Authorization runs before controller execution.
- The response uses an explicit allowlist and contains no credentials, personal data, audit metadata, internal function names, or mutable policy objects.
- The service returns fresh DTO objects so callers cannot mutate the shared policy definition.
- Frontend API failure shows a retryable error and does not use a hardcoded matrix fallback.
- Counts start at numeric zero and preserve their last successful value after later FE12 failures.
- The matrix preserves its last successful value after later FE11 failures.

## 8. Implementation Boundaries

Expected backend ownership:

- `backend/src/policies/adminPermissionPolicy.js`
- `backend/src/services/adminService.js`
- `backend/src/controllers/adminController.js`
- `backend/src/routes/adminRoutes.js`
- focused backend tests
- API/OpenAPI documentation where the Admin API is documented

Expected frontend ownership:

- `frontend/src/api/adminApi.js`
- `frontend/src/page/UserManagement.jsx`
- focused frontend source/contract tests

Expected governance updates:

- FE11 PLAN/TASKS/TEST_PLAN/CHANGELOG
- `TECH_DEBT.md`
- a TD-023 validation record

No repository, SQL, schema, authentication implementation, FE12 production file, or FE04 production file is owned by this slice.

## 9. Test Strategy

### Backend RED-GREEN

- Route rejects unauthenticated and non-Admin callers before the service.
- Route returns exact `{ roles, permissions }` for Admin.
- Service returns the canonical role order and all 15 permission rows.
- DTO objects contain only approved keys, valid roles, stable ordering, and no duplicates.
- Repeated calls return independent objects and do not mutate the policy source.
- No repository or write method is invoked.

### Frontend RED-GREEN

- Sidebar exposes exactly the eight approved entries in order.
- Membership, Confirm Payment, and Confirm Borrow are absent from Admin navigation.
- Permissions is reachable and loads through `adminApi.permissions()`.
- The page contains no product hardcoded `permissionRows` or `permissionModules` fallback.
- Role cards use FE12 `usersByRole`, not loaded user rows.
- Module coverage and permission cells are derived from the FE11 response.
- Matrix and count loading/error state remain independent and retryable.

### Validation Gate

- Focused and full backend/frontend tests pass.
- Backend coverage threshold, frontend lint/build, browser E2E, health import, OpenAPI parsing, traceability, diff hygiene, and high-confidence secret scan pass.
- Human H2 review occurs before commit/push; human H3 review occurs after PR checks and before merge.
- Post-merge `main` CI is recorded before closing `TD-023`.

## 10. Acceptance Criteria

- Admin sees exactly the approved eight sidebar entries and can open Permissions.
- Membership remains functional outside the Admin Console sidebar.
- Permissions displays global Admin/Librarian/Member counts from FE12.
- Permissions displays the canonical FE11 matrix and derived module coverage.
- The page is read-only and exposes no permission mutation controls.
- FE11/FE12 failures are isolated without invented fallback data.
- `TD-023` closes only after H2, tests, H3, merge, and post-merge CI.
- Whole FE11 remains deferred after this bounded slice.
