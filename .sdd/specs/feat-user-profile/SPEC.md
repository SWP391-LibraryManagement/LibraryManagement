# SPEC.md - FE03 User Profile

# Version: 0.3.5

# Status: APPROVED - BASELINE 2026-07-17

# Owner: Dat

# Last Updated: 2026-07-19

# Feature ID: FE03

# Feature folder: `.sdd/specs/feat-user-profile/`

> Current delivery status (2026-07-20): `COMPLETE` for the approved Phase 1 scope.
> `TASKS.md` and `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> are authoritative for current implementation state. Older `Not Started`,
> `PARTIAL`, `READY FOR REVIEW`, or pending-review labels retained below are
> historical planning/evidence snapshots, not the current delivery state.

> Source of truth for FE03 User Profile. The previously approved profile/avatar scope is preserved; v0.3.2 makes missing-profile, protected-field, avatar ownership, audit, and status-display behavior deterministic and awaits human re-review.

---

## 1. Feature Overview

### 1.1 Feature Name

User Profile

### 1.2 Business Context

Members and librarians need to view and maintain their personal information so the library can contact them and identify them correctly during membership, borrowing, reservation, and fine workflows.

Profile management must protect personal data. A user can update only the approved profile fields and cannot change password, role, account status, or membership approval through this feature.

### 1.3 Goal / Outcome

The system shall:

- Allow authenticated members and librarians to view their own profile.
- Allow authenticated members and librarians to update approved profile fields.
- Allow authenticated users to upload their own avatar image from their local device.
- Validate profile data on the server.
- Validate uploaded avatar files on the server.
- Prevent users from viewing or editing another user's profile.
- Prevent profile updates from changing credentials, roles, status, or membership approval.

### 1.4 Scope Level

- [ ] Full Spec - core business logic, high risk, must be correct from the beginning
- [x] Standard Spec - normal feature with business rules and validations
- [ ] Light Spec - simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor | Description | Permission / Responsibility |
| ----- | ----------- | --------------------------- |
| Member | Registered library user | View and update own profile. |
| Librarian | Library staff | View and update own profile. |
| Admin | System administrator | May view/update own profile; admin management of other users belongs to FE11. |
| Guest | Unauthenticated visitor | No profile access. |

---

## 3. Preconditions

The feature can only start when:

- PRE-FE03-001: The actor is authenticated.
- PRE-FE03-002: The user account exists in `Users`.
- PRE-FE03-003: The profile record exists in `UserProfiles`, or the system has an approved rule to create it on first access.
- PRE-FE03-004: The actor is requesting their own profile.
- PRE-FE03-005: Allowed editable fields are approved by the team.
- PRE-FE03-006: Avatar upload storage policy, allowed file types, and maximum file size are approved by the team (see Q-FE03-004: server local filesystem, JPG/JPEG/PNG/WebP, max 2 MB).

---

## 4. Main Flows

### MF-FE03-001: View Profile

1. Authenticated user opens profile page.
2. The system identifies the current user from the authenticated session/token.
3. The system loads profile data for that user only; if no `UserProfiles` row exists, it atomically creates a blank row for the current user and continues.
4. The system returns safe account summary and profile fields.
5. The system includes account `status` as read-only display data and excludes password hash, role management fields, and internal audit data.

### MF-FE03-002: Update Profile

1. Authenticated user submits changes to allowed profile fields.
2. The system verifies the request belongs to the current user.
3. The system validates each submitted field.
4. The system rejects protected fields such as role, status, password hash, and membership approval.
5. The system saves valid profile changes.
6. The system writes an audit entry containing actor, changed field names, and timestamp without raw before/after personal values.
7. The system returns the updated safe profile view.

### MF-FE03-003: Upload Avatar

1. Authenticated user selects an avatar image from their local device.
2. The frontend submits the image as multipart form-data to the avatar upload endpoint.
3. The system verifies the request belongs to the current authenticated user.
4. The system validates file type, file size, and safe storage rules.
5. The system stores the image using a server-generated safe filename.
6. The system saves the generated public avatar URL/path in `UserProfiles.AvatarUrl`.
7. The system writes a profile-avatar audit entry without recording file bytes, local paths, or secret metadata.
8. If the database or audit transaction fails, the system deletes the newly stored file and preserves the previous avatar URL; after a successful commit, cleanup of the replaced old file is attempted without changing the committed profile state, and any cleanup failure is logged safely.
9. The system returns the updated safe profile view.

---

## 5. Alternative Flows

### AF-FE03-001: Profile Record Missing

1. Authenticated user opens profile.
2. `UserProfiles` record does not exist.
3. The system atomically creates one blank `UserProfiles` record for the current user and returns the normal safe profile response.

### AF-FE03-002: User Attempts To Access Another Profile

1. Authenticated user requests another user's profile ID.
2. The system detects the profile does not belong to the current user.
3. The system denies the request.

### AF-FE03-003: Invalid Profile Data

1. User submits invalid date, phone, or overlong editable text.
2. The system rejects the update.
3. The existing profile data remains unchanged.

### AF-FE03-004: Protected Field Submitted

1. User submits role, account status, password, or membership approval fields.
2. The system rejects the entire update with a validation response.
3. The protected account data remains unchanged.

### AF-FE03-005: Invalid Avatar Upload

1. User submits a missing file, unsupported file type, oversized file, or unsafe file.
2. The system rejects the upload.
3. The existing avatar remains unchanged.

---

## 6. Business Rules

Use these stable IDs for tasks and tests.

- BR-FE03-001: Guests cannot view or update profiles.
- BR-FE03-002: A user can view only their own profile in FE03.
- BR-FE03-003: A user can update only their own allowed profile fields in FE03.
- BR-FE03-004: FE03 must not return password hash or credential secrets.
- BR-FE03-005: FE03 must not update password, role, account status, or membership approval.
- BR-FE03-006: Profile updates must be validated on the server.
- BR-FE03-007: Editable fields are `fullName` (trimmed, max 100), `address` (trimmed, max 255), `dateOfBirth` (valid ISO date, not future), and `phone` (10-15 digits with optional leading `+`).
- BR-FE03-008: Invalid update requests must not partially change profile data.
- BR-FE03-009: Email changes are out of FE03 scope unless FE02 verification behavior is approved.
- BR-FE03-010: Profile data must be treated as personal information and returned only to authorized actors.
- BR-FE03-011: Avatar file upload must be authenticated and may update only the current user's profile.
- BR-FE03-012: Avatar uploads must accept only approved image file types and reject executable or unsupported content.
- BR-FE03-013: Avatar uploads must enforce the approved maximum file size.
- BR-FE03-014: Avatar storage must use server-generated filenames and must not trust or persist the user's local file path.
- BR-FE03-015: Avatar files must be stored on the server local filesystem under a public uploads directory (e.g. `/uploads/avatars/`); the generated public path/URL is saved in `UserProfiles.AvatarUrl`. Cloud/object storage is out of scope for Phase 1.
- BR-FE03-016: `avatarUrl` is read-only in profile GET/PUT contracts and may be changed only by the authenticated avatar-upload endpoint after file validation.
- BR-FE03-017: Every successful profile-field update and avatar update must write an audit entry with actor, changed field names, action, and timestamp; raw personal values, file content, paths, tokens, and secrets are forbidden in audit metadata. If avatar storage succeeds before the database/audit transaction fails, the newly stored file must be deleted; after commit, the replaced old file must be cleaned up, and a cleanup failure must be logged safely without rolling back the committed profile state.

---

## 7. Functional Requirements

- FR-FE03-001: When an authenticated user opens profile, the system shall atomically create a blank profile if missing and return the user's own safe profile data.
- FR-FE03-002: If a guest requests profile data, then the system shall deny access.
- FR-FE03-003: If a user requests another user's profile through FE03, then the system shall deny access.
- FR-FE03-004: When an authenticated user submits valid allowed profile fields, the system shall update the profile.
- FR-FE03-005: If submitted profile fields are invalid, then the system shall reject the update and keep existing data unchanged.
- FR-FE03-006: If any protected, unknown, or read-only field is submitted to profile update, including `avatarUrl`, then the system shall reject the entire request without changing profile or account data.
- FR-FE03-007: When a profile response is returned, the system shall exclude password hash, credential tokens, and internal role-management data.
- FR-FE03-008: When an authenticated user uploads a valid avatar image, the system shall store it and update that user's `avatarUrl`.
- FR-FE03-009: If an avatar upload is invalid, then the system shall reject it and keep the existing avatar unchanged.
- FR-FE03-010: When a profile-field update or avatar update succeeds, the system shall write the required safe audit entry in the same source transaction as the database change; avatar file storage must follow the compensation and post-commit cleanup rules in BR-FE03-017, including safe logging when old-file cleanup fails after commit.

---

## 8. Acceptance Criteria

- AC-FE03-001: Given an authenticated member, when the member views profile, then the system returns only that member's safe profile data.
- AC-FE03-002: Given an authenticated librarian, when the librarian views profile, then the system returns only that librarian's safe profile data.
- AC-FE03-003: Given a guest, when the guest requests a profile, then the system denies access.
- AC-FE03-004: Given a user tries to view another user's profile, when the request is processed, then the system denies access.
- AC-FE03-005: Given valid profile updates, when the user submits changes, then the system saves the changes.
- AC-FE03-006: Given invalid profile data, when the user submits changes, then the system rejects the update.
- AC-FE03-007: Given any protected, unknown, or read-only field in the update payload, when the system processes it, then the entire request is rejected and no profile or account field changes.
- AC-FE03-008: Given a profile response, when it is returned, then it does not include `PasswordHash`.
- AC-FE03-009: Given an authenticated user and a valid avatar image, when the user uploads it, then the response includes the updated `avatarUrl`.
- AC-FE03-010: Given an invalid avatar upload, when the request is processed, then the upload is rejected and the old `avatarUrl` remains unchanged.
- AC-FE03-011: Given a guest, when the guest uploads an avatar, then the system denies access.
- AC-FE03-012: Given an authenticated user without a `UserProfiles` row, when the user views the profile, then exactly one blank row is created and the normal safe profile response is returned.
- AC-FE03-013: Given `avatarUrl` in a profile PUT payload, when the request is processed, then it is rejected and the current avatar remains unchanged.
- AC-FE03-014: Given an avatar file is stored, when the database/audit transaction fails, then the new file is deleted and the old avatar remains; when the transaction commits, one safe audit entry is written, old-file cleanup is attempted, and a cleanup failure is safely logged without rolling back the profile state.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE03-001 | User is not authenticated | Return unauthorized response. |
| EC-FE03-002 | User account does not exist | Return `404 PROFILE_ACCOUNT_NOT_FOUND`; do not create a profile row or mutate account state. |
| EC-FE03-003 | Profile record missing | Atomically create one blank profile for the current user and return the normal safe profile response. |
| EC-FE03-004 | User requests another user's profile | Return forbidden response. |
| EC-FE03-005 | Full name too long | Reject update. |
| EC-FE03-006 | Invalid date of birth | Reject update. |
| EC-FE03-007 | Future date of birth | Reject update. |
| EC-FE03-008 | Invalid phone format | Reject update if phone is editable. |
| EC-FE03-009 | PUT payload includes `avatarUrl` | Reject the entire update; avatar changes are accepted only through `POST /api/profile/me/avatar`. |
| EC-FE03-010 | Payload includes password/role/status/unknown field | Reject the entire update; do not change profile or protected data. |
| EC-FE03-011 | Database or audit update fails after avatar storage | Keep previous profile state, delete the newly stored file, and return a safe error. |
| EC-FE03-012 | Avatar upload has no file | Reject upload. |
| EC-FE03-013 | Avatar upload is not an approved image type | Reject upload. |
| EC-FE03-014 | Avatar upload exceeds maximum size | Reject upload. |
| EC-FE03-015 | Avatar upload uses unsafe file name or path | Ignore original path/name and use a server-generated safe filename. |
| EC-FE03-016 | Avatar storage fails | Keep previous avatar state and return safe error. |
| EC-FE03-017 | Replaced old avatar cannot be cleaned after commit | Keep the committed new avatar URL, log a safe cleanup failure, and do not roll back the profile transaction. |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity | Purpose in this feature |
| ------ | ----------------------- |
| Users | Provides account identity, username, email, phone, status, created date. |
| UserProfiles | Stores personal profile details. |
| UserRoles | May be read only for display constraints, but role management is FE11. |

### 10.2 Data Fields

| Field | Type | Required | Validation / Notes |
| ----- | ---- | -------- | ------------------ |
| userId | integer | Yes | Comes from authenticated identity; not client-controlled for own profile update. |
| username | string | Yes | Display only unless FE11/FE02 approves changes. |
| email | string | Yes | Display only unless FE02 email-change flow is approved. |
| phone | string | No | Editable only if Q-FE03-001 is approved. |
| fullName | string | No | Editable; trimmed; maximum 100 characters. |
| address | string | No | Editable; trimmed; maximum 255 characters. |
| dateOfBirth | date | No | Must not be in the future. |
| avatarUrl | string | No | Read-only server-generated public path/URL (for example `/uploads/avatars/{generated}.png`); changed only by avatar upload, never by profile PUT. |
| avatarFile | file | No | Upload-only field. Accepted extensions: JPG, JPEG, PNG, WebP. Maximum size: 2 MB. Stored using a server-generated filename. |
| status | string | No | Included in the safe profile DTO as read-only account state; never editable by FE03. |
| department | string | No | Nullable `UserProfiles.Department`, maximum 100 characters. FE11 Admin management only; excluded from FE03 self-profile reads and updates. |
| specialization | string | No | Nullable `UserProfiles.Specialization`, maximum 100 characters. FE11 Admin management only; excluded from FE03 self-profile reads and updates. |

---

## 11. API / Interface Contract

> The endpoints and request/response shapes below are the canonical Phase 1 contract for this feature.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/profile/me` | Member/Librarian/Admin | - | Safe profile DTO | Current user's profile only. |
| PUT | `/api/profile/me` | Member/Librarian/Admin | `{ fullName?, address?, dateOfBirth?, phone? }` | Updated safe profile DTO | Unknown/protected/read-only fields, including `avatarUrl`, reject the entire request. |
| POST | `/api/profile/me/avatar` | Member/Librarian/Admin | multipart form-data with `avatar` file | Updated safe profile DTO | Uploads an avatar image from the user's local device and stores the generated URL/path in `avatarUrl`. |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-FE03-SEC-001: Profile endpoints must require authentication.
- NFR-FE03-SEC-002: Users must not access another user's profile through FE03.
- NFR-FE03-SEC-003: Responses must not include password hash, tokens, internal authorization data, or secrets.
- NFR-FE03-SEC-004: All profile input must be validated server-side.
- NFR-FE03-SEC-005: Avatar upload must validate MIME type, file extension, file size, and safe storage path server-side.
- NFR-FE03-SEC-006: Avatar upload must not store client local file paths or trust original filenames.

### 12.2 Transaction Integrity

- NFR-FE03-TXN-001: Profile update must be atomic; invalid fields must not cause partial profile changes.
- NFR-FE03-TXN-002: Invalid avatar uploads must not change the current stored `avatarUrl`; a database/audit failure after file storage must delete the new file and preserve the previous URL.
- NFR-FE03-TXN-003: Replacing an avatar must commit the profile URL and audit atomically; cleanup of the old file occurs after commit and cannot change the committed profile state.

### 12.3 Performance

- NFR-FE03-PERF-001: Profile GET must read only the authenticated user's `Users` row and at most one `UserProfiles` row; collection-wide scans are not permitted.

### 12.4 Logging and Audit

- NFR-FE03-LOG-001: Profile update failures must be logged safely without storing sensitive payloads.
- NFR-FE03-LOG-002: Every successful profile-field update and avatar update must be audited with actor, action, changed field names, and timestamp; raw personal values and file/path secrets must not be logged.

### 12.5 Usability

- NFR-FE03-UX-001: Validation errors must identify the invalid field clearly.
- NFR-FE03-UX-002: Profile view must clearly separate editable profile fields from account fields managed elsewhere.
- NFR-FE03-UX-003: Avatar upload errors must identify whether file size or file type validation failed.

---

## 13. Out of Scope

This feature does not include:

- Login, logout, registration, password change, forgot password, or reset password.
- Email verification or email change workflow unless FE02 approves it.
- Creating/deactivating users or changing account status.
- Role assignment or permission management.
- Membership application approval or rejection.
- Borrowing, reservation, or fine history.
- Admin editing another user's profile unless FE11 scope is changed.

---

## 14. Dependencies

| Dependency | Type | Notes |
| ---------- | ---- | ----- |
| FE02 Authentication | Internal | Provides authenticated identity and credential flows. |
| FE04 Membership Management | Internal | Owns membership status; FE03 does not display or change membership status in Phase 1. |
| FE11 User & Role Management | Internal | Owns user status and role management. |
| SQL Server database | Technical | Current SQL script has `Users` and `UserProfiles`. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE03-001 | FE03 can update `Users.Phone`. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-002 | FE03 cannot update email; email changes must go through FE02 verification. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-003 | Missing profile records are auto-created on first view. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-004 | Phase 1 supports avatar upload from the user's local device. Avatars are stored on the server local filesystem under a public uploads directory (e.g. `/uploads/avatars/`) using a server-generated filename; the generated public path/URL is saved in `UserProfiles.AvatarUrl`. Allowed types: JPG/JPEG/PNG/WebP; max size 2 MB. Cloud/object storage is out of scope for Phase 1. | User decision 2026-06-25 | APPROVED |
| Q-FE03-005 | Profile-field and avatar updates must write safe audit logs containing actor, action, changed field names, and timestamp without raw personal values or file/path secrets. | Review packet 2026-06-10; normalization 2026-07-17 | APPROVED |
| Q-FE03-006 | The safe profile DTO includes account `status` as read-only display data. | Spec normalization 2026-07-17 | APPROVED |
| Q-FE03-007 | `avatarUrl` is changed only by the file-upload endpoint; direct profile PUT mutation is rejected. | Spec normalization 2026-07-17 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE03-001 | UC11 | `profileRoutes.test.js` GET/avatar authentication cases | Automated pass; human review pending |
| BR-FE03-002 | UC11 | `profileRoutes.test.js` `/me` current-user route contract | Automated pass; human review pending |
| BR-FE03-003 | UC12 | `profileRoutes.test.js`, `profileService.test.js` authenticated-user update cases | Automated pass; human review pending |
| BR-FE03-004 | UC11, UC12 | `profileService.test.js` safe DTO case | Automated pass; human review pending |
| BR-FE03-005 | UC12 | `profileService.test.js` protected-field rejection cases | Automated pass; human review pending |
| BR-FE03-006 | UC12 | `profileService.test.js` invalid and field-level validation cases | Automated pass; human review pending |
| BR-FE03-007 | UC12 | `profileService.test.js` allowed-field, phone, date, and length cases | Automated pass; human review pending |
| BR-FE03-008 | UC12 | `profileService.test.js`, `profileRepository.test.js` no-partial-write and rollback cases | Automated pass; SQL/human pending |
| BR-FE03-009 | UC12 | `profileService.test.js` email/protected-field rejection cases | Automated pass; human review pending |
| BR-FE03-010 | UC11 | `profileService.test.js`, `profileRoutes.test.js` safe own-profile DTO cases | Automated pass; human review pending |
| BR-FE03-011 | UC12 | `profileRoutes.test.js`, `profileService.test.js` authenticated avatar ownership cases | Automated pass; human review pending |
| BR-FE03-012 | UC12 | `profileService.test.js` MIME, extension, and byte-signature cases | Automated pass; human review pending |
| BR-FE03-013 | UC12 | `profileService.test.js` oversized avatar case | Automated pass; human review pending |
| BR-FE03-014 | UC12 | `avatarStorage.test.js` generated managed filename case | Automated pass; human review pending |
| BR-FE03-015 | UC12 | `avatarStorage.test.js`, `profileService.test.js` managed local URL/storage cases | Automated pass; human review pending |
| BR-FE03-016 | UC12 | `profileService.test.js`, `profileFrontend.test.js` PUT allowlist cases | Automated pass; human review pending |
| BR-FE03-017 | UC12 | `profileRepository.test.js`, `profileService.test.js`, `avatarStorage.test.js` | Automated pass; SQL/human pending |
| FR-FE03-001 | UC11 | `profileService.test.js`, `profileRepository.test.js` missing-profile cases | Automated pass; SQL/human pending |
| FR-FE03-002 | UC11 | `profileRoutes.test.js` unauthenticated GET case | Automated pass; human review pending |
| FR-FE03-003 | UC11 | `profileRoutes.test.js` current-user-only `/me` contract | Automated pass; human review pending |
| FR-FE03-004 | UC12 | `profileRoutes.test.js`, `profileService.test.js` valid update cases | Automated pass; human review pending |
| FR-FE03-005 | UC12 | `profileService.test.js` invalid update/no-partial-write cases | Automated pass; human review pending |
| FR-FE03-006 | UC12 | `profileService.test.js`, `profileFrontend.test.js` protected/unknown/read-only rejection | Automated pass; human review pending |
| FR-FE03-007 | UC11 | `profileService.test.js` safe DTO case | Automated pass; human review pending |
| FR-FE03-008 | UC12 | `profileRoutes.test.js`, `profileService.test.js` valid avatar cases | Automated pass; human review pending |
| FR-FE03-009 | UC12 | `profileRoutes.test.js`, `profileService.test.js` invalid avatar cases | Automated pass; human review pending |
| FR-FE03-010 | UC12 | `profileRepository.test.js`, `profileService.test.js` audit/compensation cases | Automated pass; SQL/human pending |
| AC-FE03-001 | UC11 | `profileRoutes.test.js`, `profileService.test.js` member own-profile behavior | Automated pass; human review pending |
| AC-FE03-002 | UC11 | `profileRoutes.test.js` authenticated own-profile behavior | Automated pass; human review pending |
| AC-FE03-003 | UC11 | `profileRoutes.test.js` unauthenticated GET case | Automated pass; human review pending |
| AC-FE03-004 | UC11 | `profileRoutes.test.js` no client-controlled profile ID contract | Automated pass; human review pending |
| AC-FE03-005 | UC12 | `profileService.test.js` valid update/audit case | Automated pass; human review pending |
| AC-FE03-006 | UC12 | `profileService.test.js` invalid field-level validation cases | Automated pass; human review pending |
| AC-FE03-007 | UC12 | `profileService.test.js` protected/unknown field rejection cases | Automated pass; human review pending |
| AC-FE03-008 | UC11 | `profileService.test.js` secret/internal-field exclusion case | Automated pass; human review pending |
| AC-FE03-009 | UC12 | `profileRoutes.test.js`, `profileService.test.js` valid avatar cases | Automated and agent browser pass; human pending |
| AC-FE03-010 | UC12 | `profileService.test.js` invalid avatar preserves current URL case | Automated and agent browser pass; human pending |
| AC-FE03-011 | UC12 | `profileRoutes.test.js` guest avatar rejection case | Automated pass; human review pending |
| AC-FE03-012 | UC11 | `profileRepository.test.js`, `profileService.test.js` locked auto-create case | Automated pass; SQL/human pending |
| AC-FE03-013 | UC12 | `profileService.test.js`, `profileFrontend.test.js` direct `avatarUrl` rejection | Automated pass; human review pending |
| AC-FE03-014 | UC12 | `profileRepository.test.js`, `profileService.test.js`, `avatarStorage.test.js` compensation and cleanup cases | Automated pass; SQL/human pending |

Coverage: 17/17 BR, 10/10 FR, and 14/14 AC have explicit use-case and test intent mappings.

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Editable profile fields are approved.
- [x] Phone and email ownership is confirmed with FE02/FE11.
- [x] Missing profile behavior is approved.
- [x] Avatar upload storage policy revision is reviewed and approved (Q-FE03-004: local filesystem, approved 2026-06-25).
- [x] Privacy and response DTO rules are reviewed.
- [x] Every acceptance criterion can become a test.
- [x] FE11-owned `department` and `specialization` columns are excluded from the FE03 safe DTO and PUT allowlist.
