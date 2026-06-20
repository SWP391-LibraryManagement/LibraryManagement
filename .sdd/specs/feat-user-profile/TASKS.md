# TASKS.md - FE03 User Profile

# Version: 0.1.0

# Status: APPROVED

# Owner: Dat

# Last Updated: 2026-06-20

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

- [x] Validate allowed update fields: `fullName`, `address`, `dateOfBirth`, `avatarUrl`, `phone`.
- [x] Reject protected fields: `password`, `passwordHash`, `role`, `roles`, `roleId`, `status`, `email`, `membershipStatus`, `membershipApproval`, `userId`, `profileId`.
- [x] Return field-level validation errors.
- [x] Ensure invalid requests do not write partial data.

Traceability: BR-FE03-005, BR-FE03-006, BR-FE03-007, BR-FE03-008, BR-FE03-009, FR-FE03-005, FR-FE03-006, AC-FE03-006, AC-FE03-007

### T-FE03-004 - Add Profile Repository / Model

- [x] Add parameterized query to find user account summary by `UserId`.
- [x] Add parameterized query to find profile by `UserId`.
- [x] Add parameterized query to create a blank `UserProfiles` record.
- [x] Add parameterized query to update `Users.Phone`.
- [x] Add parameterized query to update `UserProfiles.FullName`, `Address`, `DateOfBirth`, and `AvatarUrl`.
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
- [x] Test invalid avatar URL is rejected.
- [x] Test protected fields are rejected and unchanged.
- [x] Test invalid update does not partially change profile data.

Traceability: FT13, AC-FE03-005, AC-FE03-006, AC-FE03-007, BR-FE03-008

### T-FE03-009 - Run Verification

- [x] Run backend tests with `npm --prefix backend test`.
- [x] Checked package scripts; no backend lint/build command is configured.
- [x] Record any environment-related test failures in the final implementation note.

Traceability: Definition of Done, `.agents/AGENTS.md` Testing Rules

---

## Implementation Notes

- Implement tasks in order.
- Do not add new dependencies unless the existing backend tools cannot satisfy the task.
- Do not change database schema in FE03 unless a separate spec/RFC update is approved.
- Keep frontend work out of this task list.
