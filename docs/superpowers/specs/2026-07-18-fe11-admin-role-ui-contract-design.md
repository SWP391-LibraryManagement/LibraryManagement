# FE11 Admin Role UI Contract Design

Status: READY FOR HUMAN REVIEW

Date: 2026-07-18

Feature: FE11 User & Role Management

Debt: `TD-022`

## 1. Decision

Use SDD Full depth for the role-mutation contract and bounded ADD for the frontend adapter. Keep the approved backend API unchanged and make the Admin UI translate selected role names through the authoritative role catalog before sending numeric role IDs.

This slice is Core at the API boundary because role mutations affect authorization and must not depend on guessed or hardcoded identifiers. The checkbox presentation and name-to-ID adapter are Shell behavior once the contract and failure rules are locked.

## 2. Source Requirements

This design implements the frontend acceptance path for the existing approved requirements:

- `BR-FE11-001`, `BR-FE11-007..010`: Admin-only role management, at least one role, multiple roles, last-Admin protection, and auditability.
- `FR-FE11-012..014`: role assignment/revocation and concurrency-safe last-Admin protection.
- `FR-FE11-024..027`: deterministic missing-role, duplicate, absent-mapping, and final-role outcomes.
- `AC-FE11-013..015`: successful role assignment/revocation and last-Admin rejection.
- `NFR-FE11-SEC-001..005`: server-side RBAC, validation, safe errors, and approved identifiers.
- FE11 API contract: `POST /api/users/{userId}/roles` with `{ roleId: number }` and `DELETE /api/users/{userId}/roles/{roleId}`.

Primary source: `.sdd/specs/feat-user-role-management/SPEC.md`.

The canonical contract is already approved, so this slice does not modify `SPEC.md` or backend behavior.

## 3. Current Problem

The backend transactional role slice is B7-complete and requires positive numeric role IDs. The Admin frontend still sends `{ roleName }` for assignment and places the role name in the revocation URL. Both calls fail route validation and cannot satisfy `AC-FE11-013/014`.

The role-list endpoint already returns the required catalog entries:

```json
{
  "data": [
    { "roleId": 1, "roleName": "ADMIN" },
    { "roleId": 2, "roleName": "LIBRARIAN" },
    { "roleId": 3, "roleName": "MEMBER" }
  ]
}
```

No schema, endpoint, or backend service change is needed.

## 4. Scope

### In Scope

- Treat `GET /api/users/roles` as the only source of role IDs.
- Keep role selection display/state compatible with role names in `UserManagementView.roles`.
- Map each changed role name to a positive numeric role ID before mutation.
- Send `{ roleId }` for assignment and numeric `roleId` in the revocation path.
- Apply assignments before revocations.
- Block role editing when the catalog is unavailable or invalid; never use hardcoded IDs.
- Reconcile the modal with authoritative server state after a partial mutation failure.
- Add focused frontend RED-GREEN tests and update FE11 planning/evidence records during implementation.

### Out Of Scope

- Backend role transaction, validators, service outcomes, or error codes.
- Database/schema changes.
- Role creation, role editing, permission editing, or role hierarchy.
- FE11 navigation, Permissions, Audit Logs, Request Management, update, or deactivation debt.
- A batch role-replacement endpoint or cross-request transaction.
- Changes to the approved FE11 `SPEC.md` contract.

## 5. Architecture

The bounded request flow is:

```text
GET /api/users/roles
  -> role catalog [{ roleId, roleName }]
  -> RoleModal displays roleName checkboxes
  -> saveRoles computes addedNames and removedNames
  -> validate complete roleName -> roleId mapping
  -> POST assignments by roleId
  -> DELETE revocations by roleId
  -> reload authoritative user/list state
```

`RoleModal` continues to use role names because the managed-user DTO exposes role names. The page-level save orchestration owns the mapping because it already owns the role catalog and API mutations.

## 6. Role Catalog Contract

Each editable catalog item must have:

- `roleName`: one of `ADMIN`, `LIBRARIAN`, or `MEMBER`.
- `roleId`: a positive integer.

`GUEST` and unknown roles are not editable in this Admin flow. An existing non-editable role on the target user is preserved and is not silently revoked.

The UI must not synthesize catalog entries containing only role names. If the catalog request fails, returns an invalid item, or omits an ID required by the requested diff, the UI blocks the save before sending any mutation.

## 7. API Adapter Contract

The frontend API functions become:

```js
assignManagedUserRole(userId, roleId)
revokeManagedUserRole(userId, roleId)
```

Assignment sends:

```json
{ "roleId": 2 }
```

Revocation calls:

```text
DELETE /api/users/{userId}/roles/2
```

The adapter does not accept or translate role names. Name-to-ID translation occurs before the API boundary so tests can prove that no role name enters the mutation contract.

## 8. Mutation Ordering And No-Op Behavior

The UI computes two deterministic lists:

- `addedNames`: selected editable roles absent from the current role set.
- `removedNames`: current editable roles absent from the selected role set.

Both lists follow the role catalog order. The UI performs every assignment first, followed by revocations. This avoids a transient zero-role state when replacing one role with another and leaves the backend as the final authority for last-user-role and last-Admin rules.

When both lists are empty, Save is a successful no-op: no mutation request is sent, the modal closes, and no misleading role-change audit or success claim is created by the client.

## 9. Failure And Reconciliation Behavior

### Catalog Failure

- Do not open or save an actionable role form without a valid catalog.
- When the Admin clicks the role action without a valid catalog, retry `fetchRoles`; open the modal only after a valid response, otherwise keep it closed and show a safe load error.
- Do not fall back to hardcoded IDs or role-name mutation calls.

### Preflight Mapping Failure

- Resolve every added/removed role name to a valid role ID before the first mutation.
- If any mapping is missing or invalid, send no mutation request and keep the modal state unchanged.

### Partial Mutation Failure

Role mutations are separate backend transactions; the client must not claim that the whole checkbox save is atomic.

If any mutation fails:

1. Stop immediately; do not attempt remaining mutations.
2. Fetch the target user through `GET /api/users/{userId}`.
3. Replace the page-level target user and the modal's selected roles with the authoritative server response; `RoleModal` must synchronize its local selection when refreshed user roles arrive.
4. Keep the modal open.
5. Display the safe mapped API error.

If the reconciliation fetch also fails, keep the modal open, display the original mutation error, and mark the modal unsynchronized. Save remains disabled until an authoritative target-user reload succeeds or the Admin closes the modal and starts a fresh role action. Do not display success.

### Concurrent Submission

Disable Save and modal-closing actions while the mutation sequence or reconciliation read is running. A second sequence must not start concurrently from the same modal.

## 10. Component Responsibilities

### `frontend/src/api/userManagementApi.js`

- Accept numeric `roleId` for both mutation helpers.
- Send the canonical body/path.
- Preserve existing safe error mapping.

### `frontend/src/page/UserManagement.jsx`

- Store role catalog success/error state.
- Reject actionable role editing without a valid catalog.
- Keep checkbox state as role names.
- Synchronize checkbox state when an authoritative refreshed target user replaces the modal user state.
- Build and validate the complete name-to-ID diff before mutation.
- Run assignments before revocations.
- On failure, reload the target user and keep the modal open with server roles.
- On success, close the modal and reload canonical list/detail state.

### Frontend Tests

- Prove the adapter body/path use numeric role IDs.
- Prove name-to-ID mapping and deterministic assignment-before-revocation order.
- Prove invalid/missing catalog entries block all mutations.
- Prove no-op Save sends no mutation.
- Prove partial failure stops the sequence, fetches the target user, and keeps authoritative roles in the modal.
- Prove a failed reconciliation read leaves Save disabled and never displays success.

## 11. Testing Strategy

Implementation follows RED-GREEN TDD.

### API Contract Tests

- Assignment calls `/users/{userId}/roles` with `{ roleId }`.
- Revocation calls `/users/{userId}/roles/{roleId}`.
- Mutation helpers contain no `roleName` request field/path interpolation.

### UI Orchestration Tests

- Role catalog entries expose both ID and name to the save flow.
- Assignments run before revocations for a mixed diff.
- Unknown names, missing IDs, zero IDs, and catalog load failure send no mutation.
- Existing non-editable roles are preserved.
- A mutation failure prevents later calls and triggers authoritative target-user reload.
- A reconciliation result replaces stale modal roles while the modal remains open.
- A reconciliation-read failure never converts the operation to success.
- Save is disabled while work is in flight.

### Regression Validation

- Focused FE11 frontend tests.
- Full frontend tests, lint, and production build.
- Focused backend FE11 role tests to confirm the public contract remains unchanged.
- Project traceability enforcement and `git diff --check`.
- Existing browser E2E through CI; no new visual layout is introduced by this slice.

## 12. Documentation And Traceability

During implementation:

- Add a separately reviewable FE11 role-UI task group to `PLAN.md` and `TASKS.md`.
- Update `TEST_PLAN.md` and `CHANGELOG.md` with the bounded evidence.
- Mark `TD-022` `IN PROGRESS`, then `RESOLVED` only after human review, merge, and post-merge CI.
- Preserve whole-feature `Implementation State: DEFERRED` and every unrelated FE11 debt.
- Do not update `SPEC.md`; the existing numeric-ID contract is already authoritative.

## 13. Risks And Mitigations

| Risk | Mitigation |
| --- | --- |
| Hardcoded IDs differ across environments | Use only the authenticated role catalog. |
| Role names enter the mutation API again | Make API helpers accept `roleId` and add source-contract tests. |
| Save partially succeeds | Stop at first failure and reconcile from the server. |
| Revocation briefly leaves no role | Execute assignments before revocations; backend remains authoritative. |
| Catalog is stale or incomplete | Validate the complete diff before the first mutation and surface a retryable error. |
| Scope expands into Permissions or role editing | Keep the slice limited to the existing Manage Roles modal and endpoints. |

## 14. Definition Of Done

This slice is complete only when:

- Every frontend role mutation uses a positive numeric role ID from the server catalog.
- No hardcoded role ID or role-name mutation fallback exists.
- Mixed changes assign before revoke.
- Catalog and mapping failures send no mutation.
- Partial failures reconcile the modal to authoritative server roles without a false success message.
- Focused/full frontend checks, focused backend role regression, traceability, diff hygiene, and CI pass.
- FE11 planning, evidence, changelog, and technical debt are synchronized.
- Human implementation review, merge, and post-merge CI are recorded.

## 15. Open Questions

None. The user approved the name-to-ID adapter approach and authoritative reload behavior for partial failures on 2026-07-18.
