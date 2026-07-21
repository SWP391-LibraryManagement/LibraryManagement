# TASKS.md - FE03 User Profile

# Version: 0.2.1

# Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED
Implementation State: COMPLETE

# Owner: Dat

# Last Updated: 2026-07-19

Workflow State: COMPLETE for the approved Phase 2 scope; H3, merge, and exact
post-merge `main` CI are recorded in
`.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Unchecked manual
verification statements retained below are historical execution snapshots
superseded by that evidence, not current open implementation tasks.

---

## Task Status Legend

- `[ ]` Not started
- `[~]` In progress
- `[x]` Done

---

## Backend Tasks

### T-FE03-001 - Inspect Backend Auth And Database Patterns

- [x] Find the existing Express app entry point, route mounting style, auth middleware, and SQL Server database helper.
- [x] Confirm how authenticated `userId` is exposed on the request object.
- [x] Confirm current test setup for backend route tests.

Traceability: PRE-FE03-001, NFR-FE03-SEC-001

### T-FE03-002 - Define Safe Profile DTO

- [x] Create a DTO/helper that returns only safe profile fields.
- [x] Include account summary fields approved for display: `userId`, `username`, `email`, `phone`, `status`, `createdAt`.
- [x] Include profile fields: `profileId`, `fullName`, `address`, `dateOfBirth`, `avatarUrl`.
- [x] Exclude `PasswordHash`, tokens, role-management internals, and audit internals.

Traceability: BR-FE03-004, BR-FE03-010, FR-FE03-001, FR-FE03-007, AC-FE03-008

### T-FE03-003 - Add Profile Validation

- [x] Validate allowed update fields: `fullName`, `address`, `dateOfBirth`, and `phone`; reject direct `avatarUrl` mutation.
- [x] Reject protected fields: `password`, `passwordHash`, `role`, `roles`, `roleId`, `status`, `email`, `membershipStatus`, `membershipApproval`, `userId`, `profileId`.
- [x] Return field-level validation errors.
- [x] Ensure invalid requests do not write partial data.

Traceability: BR-FE03-005, BR-FE03-006, BR-FE03-007, BR-FE03-008, BR-FE03-009, FR-FE03-005, FR-FE03-006, AC-FE03-006, AC-FE03-007

### T-FE03-004 - Add Profile Repository / Model

- [x] Add parameterized query to find user account summary by `UserId`.
- [x] Add parameterized query to find profile by `UserId`.
- [x] Add parameterized query to create a blank `UserProfiles` record.
- [x] Add parameterized query to update `Users.Phone`.
- [x] Add parameterized query to update `UserProfiles.FullName`, `Address`, and `DateOfBirth`; keep `AvatarUrl` in the upload-only repository operation.
- [x] Add audit-log insert when the existing schema supports it.

Traceability: PRE-FE03-002, PRE-FE03-003, Q-FE03-003, Q-FE03-005, SAFE-003

### T-FE03-005 - Add Profile Service

- [x] Implement `getMyProfile(userId)`.
- [x] Auto-create a blank profile if missing.
- [x] Implement `updateMyProfile(userId, payload)`.
- [x] Keep profile update and phone update atomic.
- [x] Return the updated safe profile DTO.

Traceability: FR-FE03-001, FR-FE03-004, AC-FE03-001, AC-FE03-002, AC-FE03-005, EC-FE03-003, NFR-FE03-TXN-001

### T-FE03-006 - Add Profile Controller And Routes

- [x] Add `GET /api/profile/me`.
- [x] Add `PUT /api/profile/me`.
- [x] Protect both endpoints with authentication.
- [x] Do not accept client-controlled `userId` for FE03 own-profile operations.
- [x] Return safe errors without stack traces.

Traceability: BR-FE03-001, BR-FE03-002, BR-FE03-003, FR-FE03-002, FR-FE03-003, NFR-FE03-SEC-001, NFR-FE03-SEC-002, SAFE-004, SAFE-005

### T-FE03-007 - Add Backend Tests For View Profile

- [x] Test authenticated member can view own safe profile.
- [x] Test authenticated librarian/admin can view own safe profile if auth fixtures support roles.
- [x] Test guest request returns unauthorized.
- [x] Test missing profile is auto-created.
- [x] Test response does not include `PasswordHash`.

Traceability: FT12, AC-FE03-001, AC-FE03-002, AC-FE03-003, AC-FE03-008

### T-FE03-008 - Add Backend Tests For Update Profile

- [x] Test valid profile update saves allowed fields.
- [x] Test phone update saves to `Users.Phone`.
- [x] Test invalid date of birth is rejected.
- [x] Test future date of birth is rejected.
- [x] Test invalid phone is rejected.
- [x] Test direct `avatarUrl` submission is rejected as read-only.
- [x] Test protected fields are rejected and unchanged.
- [x] Test invalid update does not partially change profile data.

Traceability: FT13, AC-FE03-005, AC-FE03-006, AC-FE03-007, BR-FE03-008

### T-FE03-009 - Run Verification

- [x] Run backend tests with `npm --prefix backend test`.
- [x] Checked package scripts; no backend lint/build command is configured.
- [x] Record any environment-related test failures in the final implementation note.

Traceability: Definition of Done, `.agents/AGENTS.md` Testing Rules

---

## Avatar Upload Revision Tasks

### T-FE03-010 - Update Avatar Upload Contract

- [x] Confirm final avatar upload endpoint: `POST /api/profile/me/avatar`.
- [x] Confirm multipart field name: `avatar`.
- [x] Confirm accepted file extensions: JPG, JPEG, PNG, WebP.
- [x] Confirm maximum file size: 2 MB.
- [x] Confirm generated public path is stored in `UserProfiles.AvatarUrl`.

Traceability: PRE-FE03-006, BR-FE03-012, BR-FE03-013, BR-FE03-014

### T-FE03-011 - Add Backend Avatar Upload Handling

- [x] Add multipart upload middleware for the avatar endpoint.
- [x] Validate authentication before accepting avatar upload.
- [x] Validate file type and extension.
- [x] Validate maximum file size.
- [x] Generate a safe server-side filename.
- [x] Store the file in a backend-controlled uploads directory.
- [x] Serve uploaded avatar files through a safe static path.
- [x] Reject invalid uploads without changing the existing `avatarUrl`.

Traceability: BR-FE03-011, BR-FE03-012, BR-FE03-013, BR-FE03-014, FR-FE03-008, FR-FE03-009, NFR-FE03-SEC-005, NFR-FE03-SEC-006

### T-FE03-012 - Add Backend Avatar Service And Repository Updates

- [x] Add service function to update the current user's avatar after successful upload.
- [x] Reuse own-profile-only lookup by authenticated `userId`.
- [x] Save only the generated avatar URL/path to `UserProfiles.AvatarUrl`.
- [x] Return the updated safe profile DTO.
- [x] Write audit log entry for avatar update when audit logging is available.

Traceability: FR-FE03-008, AC-FE03-009, Q-FE03-005

### T-FE03-013 - Add Backend Tests For Avatar Upload

- [x] Test authenticated user can upload a valid avatar.
- [x] Test guest avatar upload is unauthorized.
- [x] Test missing avatar file is rejected.
- [x] Test unsupported avatar file type is rejected.
- [x] Test oversized avatar file is rejected.
- [x] Test invalid avatar upload keeps the existing `avatarUrl`.
- [x] Test original local file path/name is not persisted.

Traceability: AC-FE03-009, AC-FE03-010, AC-FE03-011, EC-FE03-012, EC-FE03-013, EC-FE03-014, EC-FE03-015, EC-FE03-016

### T-FE03-014 - Add Frontend Avatar Upload UI

- [x] Add avatar file picker to the profile edit flow.
- [x] Submit selected avatar as multipart form-data to `POST /api/profile/me/avatar`.
- [x] Show upload progress/loading state.
- [x] Show clear file type and file size validation errors.
- [x] Refresh profile state with the returned safe profile DTO.

Traceability: MF-FE03-003, NFR-FE03-UX-003

### T-FE03-015 - Run Avatar Upload Verification

- [x] Run backend tests.
- [x] Run frontend lint/build.
- [ ] Manually verify upload from the profile screen with a valid image.
- [ ] Manually verify invalid file type and oversized file errors.

Traceability: Definition of Done, `.agents/AGENTS.md` Testing Rules

---

## Deterministic Contract Follow-up For Code Owner

### T-FE03-016 - Align Profile PUT And Audit Behavior

- [x] Remove `avatarUrl` from allowed `PUT /api/profile/me` fields and reject protected, unknown, or read-only fields atomically.
- [x] Require one safe audit entry for every successful profile-field and avatar database update.
- [x] Confirm missing-profile creation remains deterministic and account `status` remains read-only in the safe DTO.
- [x] Add focused tests for AC-FE03-012..014 without changing unrelated FE03 behavior.

Traceability: BR-FE03-016..017, FR-FE03-001, FR-FE03-006, FR-FE03-010, AC-FE03-012..014

Evidence: `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`.

---

## Implementation Notes

- Implement tasks in order.
- Do not add new dependencies unless the existing backend tools cannot satisfy the task.
- Do not change database schema in FE03 unless a separate spec/RFC update is approved.
- Keep frontend work limited to the approved avatar upload UI and PUT allowlist reconciliation in T-FE03-014/T-FE03-016.
