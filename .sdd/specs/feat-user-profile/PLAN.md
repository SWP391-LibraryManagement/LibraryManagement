# PLAN.md - FE03 User Profile

# Version: 0.2.1

# Status: COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED

# Owner: Dat

# Last Updated: 2026-07-19

---

## 1. Implementation Goal

Implement the backend API for FE03 User Profile according to `SPEC.md`.

The backend shall support:

- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/profile/me/avatar`
- safe profile response DTOs
- server-side validation
- server-side avatar file validation
- protected-field rejection
- auto-creation of a missing `UserProfiles` record
- storing uploaded avatar files under a backend-controlled static uploads directory
- mandatory safe audit logging for successful profile-field and avatar updates

This plan covers backend work and the minimum frontend wiring needed for users to upload an avatar from their device.

---

## 2. Spec Mapping

| Plan Area | SPEC IDs |
| --------- | -------- |
| Require authenticated user | PRE-FE03-001, BR-FE03-001, FR-FE03-002, NFR-FE03-SEC-001 |
| Own-profile-only access | PRE-FE03-004, BR-FE03-002, BR-FE03-003, FR-FE03-003 |
| Safe response DTO | BR-FE03-004, BR-FE03-010, FR-FE03-001, FR-FE03-007, AC-FE03-008 |
| Update allowed fields | FR-FE03-004, AC-FE03-005 |
| Reject invalid data | BR-FE03-006, BR-FE03-007, BR-FE03-008, FR-FE03-005, AC-FE03-006 |
| Reject protected fields | BR-FE03-005, BR-FE03-009, FR-FE03-006, AC-FE03-007 |
| Missing profile auto-create | PRE-FE03-003, AF-FE03-001, EC-FE03-003, Q-FE03-003 |
| Audit profile updates | Q-FE03-005 |
| Avatar upload | PRE-FE03-006, MF-FE03-003, AF-FE03-005, BR-FE03-011, BR-FE03-012, BR-FE03-013, BR-FE03-014, FR-FE03-008, FR-FE03-009, AC-FE03-009, AC-FE03-010, AC-FE03-011 |

---

## 3. Backend Design

### 3.1 Route Layer

Add a profile route module mounted under `/api/profile`.

Endpoints:

- `GET /api/profile/me`
- `PUT /api/profile/me`
- `POST /api/profile/me/avatar`

All profile endpoints must use the existing authentication middleware or the smallest compatible middleware available in the backend.

`POST /api/profile/me/avatar` shall accept `multipart/form-data` with one file field named `avatar`.

### 3.2 Controller Layer

The controller shall:

- read the current authenticated `userId` from the request identity
- never trust a `userId` from URL params or request body
- return safe HTTP status codes and generic server errors
- return validation errors with field names

Expected status behavior:

| Case | Status |
| ---- | ------ |
| Missing/invalid authentication | `401` |
| Current user not found | `404` |
| Validation error | `400` |
| Protected field submitted | `400` |
| Missing avatar file | `400` |
| Unsupported avatar file type | `400` |
| Oversized avatar file | `400` |
| Successful profile view/update | `200` |
| Unexpected database/server failure | `500` with safe message |

### 3.3 Service Layer

The service shall:

- load the current user and profile by authenticated `userId`
- auto-create a blank `UserProfiles` row when missing
- build a safe DTO that excludes `PasswordHash`, tokens, role-management internals, and audit internals
- validate update payload before any database write
- update `Users.Phone` and `UserProfiles` fields atomically
- store a validated avatar image with a server-generated filename
- update `UserProfiles.AvatarUrl` after a successful avatar upload
- write a safe audit log for every successful profile-field update

### 3.4 Model / Repository Layer

Database access shall use SQL Server parameterized queries through the existing database helper/pool.

Required operations:

- find user account summary by `UserId`
- find profile by `UserId`
- create blank profile by `UserId`
- update `Users.Phone`
- update `UserProfiles.FullName`, `Address`, and `DateOfBirth`; direct `AvatarUrl` mutation is forbidden here
- update only `UserProfiles.AvatarUrl` after avatar upload
- create the required safe audit log entry in the source transaction

No database schema change is part of this plan.

---

## 4. Validation Rules

Use server-side validation for every submitted field.

Approved editable fields:

- `fullName`
- `address`
- `dateOfBirth`
- `phone`

Protected fields must be rejected if present:

- `password`
- `passwordHash`
- `role`
- `roles`
- `roleId`
- `status`
- `email`
- `membershipStatus`
- `membershipApproval`
- `userId`
- `profileId`

Field rules for Phase 1:

| Field | Rule |
| ----- | ---- |
| `fullName` | optional; string; trim; max 100 characters |
| `address` | optional; string; trim; max 255 characters |
| `dateOfBirth` | optional; valid ISO date; must not be in the future |
| `phone` | optional; string; trim; 10-15 digits, optional leading `+` |

If validation fails, no profile or phone field may be changed.

### 4.1 Avatar Upload Rules

Approved upload field:

- `avatar`

Rules:

| Rule | Decision |
| ---- | -------- |
| Accepted file extensions | JPG, JPEG, PNG, WebP |
| Maximum file size | 2 MB |
| Storage path | Backend-controlled static uploads directory, for example `/uploads/avatars` |
| Stored database value | Generated public URL/path saved in `UserProfiles.AvatarUrl` |
| Filename policy | Server-generated safe filename; do not trust original filename or local path |
| Failure behavior | Reject upload and keep the existing `avatarUrl` unchanged |

---

## 5. Testing Plan

Add backend tests with Jest and Supertest where the backend structure supports integration tests.

Required coverage:

- authenticated user can view own safe profile
- guest cannot view profile
- missing profile is auto-created on first view
- safe DTO excludes `PasswordHash`
- authenticated user can update allowed fields
- invalid fields reject the update
- protected fields reject the update and do not change protected data
- update is atomic when validation fails
- authenticated user can upload a valid avatar image
- guest cannot upload an avatar
- unsupported avatar type is rejected
- oversized avatar file is rejected
- invalid avatar upload does not change existing `avatarUrl`

Tests should map to `FT12` and `FT13`.

---

## 6. Out Of Scope

Do not implement:

- login, logout, registration, password reset, or password change
- email change or email verification
- role assignment or account status management
- admin editing another user's profile
- membership approval changes
- borrowing, reservation, or fine history
- full image editing/cropping
- database schema migrations unless separately approved

---

## 7. Implementation Order

1. Confirm existing backend auth middleware and database helper.
2. Add profile DTO and validation helpers.
3. Add profile model/repository functions.
4. Add profile service functions.
5. Add profile controller and routes.
6. Mount routes in the Express app.
7. Add backend tests for view/update/profile validation.
8. Add avatar upload middleware/storage handling.
9. Add backend tests for avatar upload validation and successful upload.
10. Add frontend avatar file input and API call.
11. Run backend and frontend verification.
12. Update this feature changelog with implementation notes if behavior changes.

---

## 8. Approval

This normalized plan is baseline-approved by Nhat on 2026-07-17. T-FE03-016 aligns direct `avatarUrl` rejection, mandatory audit behavior, missing-profile locking, avatar compensation, and safe cleanup logging. Automated, disposable SQL Server, and agent browser validation pass; human B7/L4 review remains pending.
