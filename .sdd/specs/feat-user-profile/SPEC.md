# SPEC.md - FE03 User Profile

# Version: 0.2.0

# Status: DRAFT - AVATAR UPLOAD REVISION

# Owner: Dat

# Last Updated: 2026-06-20

# Feature ID: FE03

# Feature folder: `.sdd/specs/feat-user-profile/`

> Source of truth for FE03 User Profile. Decisions in this spec were reviewed and approved on 2026-06-10. See `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.

---

## 1. Feature Overview

### 1.1 Feature Name

User Profile

### 1.2 Business Context

Members and librarians need to view and maintain their personal information so the library can contact them and identify them correctly during membership, borrowing, reservation, and fine workflows.

Profile management must protect personal data. A user should be able to update allowed profile fields, but should not be able to change protected account fields such as password, role, account status, or membership approval through this feature.

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
- PRE-FE03-006: Avatar upload storage policy, allowed file types, and maximum file size are approved by the team.

---

## 4. Main Flows

### MF-FE03-001: View Profile

1. Authenticated user opens profile page.
2. The system identifies the current user from the authenticated session/token.
3. The system loads profile data for that user only.
4. The system returns safe account summary and profile fields.
5. The system excludes password hash, role management fields, and internal audit data.

### MF-FE03-002: Update Profile

1. Authenticated user submits changes to allowed profile fields.
2. The system verifies the request belongs to the current user.
3. The system validates each submitted field.
4. The system rejects protected fields such as role, status, password hash, and membership approval.
5. The system saves valid profile changes.
6. The system returns the updated safe profile view.

### MF-FE03-003: Upload Avatar

1. Authenticated user selects an avatar image from their local device.
2. The frontend submits the image as multipart form-data to the avatar upload endpoint.
3. The system verifies the request belongs to the current authenticated user.
4. The system validates file type, file size, and safe storage rules.
5. The system stores the image using a server-generated safe filename.
6. The system saves the generated public avatar URL/path in `UserProfiles.AvatarUrl`.
7. The system returns the updated safe profile view.

---

## 5. Alternative Flows

### AF-FE03-001: Profile Record Missing

1. Authenticated user opens profile.
2. `UserProfiles` record does not exist.
3. The system either creates a blank profile record or returns a controlled incomplete-profile response according to approved policy.

### AF-FE03-002: User Attempts To Access Another Profile

1. Authenticated user requests another user's profile ID.
2. The system detects the profile does not belong to the current user.
3. The system denies the request.

### AF-FE03-003: Invalid Profile Data

1. User submits invalid date, phone, avatar URL, or overlong text.
2. The system rejects the update.
3. The existing profile data remains unchanged.

### AF-FE03-004: Protected Field Submitted

1. User submits role, account status, password, or membership approval fields.
2. The system ignores or rejects those fields.
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
- BR-FE03-007: Full name, address, date of birth, avatar URL, and phone must follow approved validation rules when submitted.
- BR-FE03-008: Invalid update requests must not partially change profile data.
- BR-FE03-009: Email changes are out of FE03 scope unless FE02 verification behavior is approved.
- BR-FE03-010: Profile data must be treated as personal information and returned only to authorized actors.
- BR-FE03-011: Avatar file upload must be authenticated and may update only the current user's profile.
- BR-FE03-012: Avatar uploads must accept only approved image file types and reject executable or unsupported content.
- BR-FE03-013: Avatar uploads must enforce the approved maximum file size.
- BR-FE03-014: Avatar storage must use server-generated filenames and must not trust or persist the user's local file path.

---

## 7. Functional Requirements

- FR-FE03-001: When an authenticated user opens profile, the system shall return the user's own safe profile data.
- FR-FE03-002: If a guest requests profile data, then the system shall deny access.
- FR-FE03-003: If a user requests another user's profile through FE03, then the system shall deny access.
- FR-FE03-004: When an authenticated user submits valid allowed profile fields, the system shall update the profile.
- FR-FE03-005: If submitted profile fields are invalid, then the system shall reject the update and keep existing data unchanged.
- FR-FE03-006: If protected account fields are submitted, then the system shall reject or ignore them without changing protected data.
- FR-FE03-007: When a profile response is returned, the system shall exclude password hash, credential tokens, and internal role-management data.
- FR-FE03-008: When an authenticated user uploads a valid avatar image, the system shall store it and update that user's `avatarUrl`.
- FR-FE03-009: If an avatar upload is invalid, then the system shall reject it and keep the existing avatar unchanged.

---

## 8. Acceptance Criteria

- AC-FE03-001: Given an authenticated member, when the member views profile, then the system returns only that member's safe profile data.
- AC-FE03-002: Given an authenticated librarian, when the librarian views profile, then the system returns only that librarian's safe profile data.
- AC-FE03-003: Given a guest, when the guest requests a profile, then the system denies access.
- AC-FE03-004: Given a user tries to view another user's profile, when the request is processed, then the system denies access.
- AC-FE03-005: Given valid profile updates, when the user submits changes, then the system saves the changes.
- AC-FE03-006: Given invalid profile data, when the user submits changes, then the system rejects the update.
- AC-FE03-007: Given protected fields in the update payload, when the system processes it, then password, role, status, and membership approval remain unchanged.
- AC-FE03-008: Given a profile response, when it is returned, then it does not include `PasswordHash`.
- AC-FE03-009: Given an authenticated user and a valid avatar image, when the user uploads it, then the response includes the updated `avatarUrl`.
- AC-FE03-010: Given an invalid avatar upload, when the request is processed, then the upload is rejected and the old `avatarUrl` remains unchanged.
- AC-FE03-011: Given a guest, when the guest uploads an avatar, then the system denies access.

---

## 9. Edge Cases and Error Handling

| ID | Edge Case / Error | Expected System Behavior |
| -- | ----------------- | ------------------------ |
| EC-FE03-001 | User is not authenticated | Return unauthorized response. |
| EC-FE03-002 | User account does not exist | Return not found or force logout according to auth policy. |
| EC-FE03-003 | Profile record missing | Create blank profile or return controlled incomplete-profile response. |
| EC-FE03-004 | User requests another user's profile | Return forbidden response. |
| EC-FE03-005 | Full name too long | Reject update. |
| EC-FE03-006 | Invalid date of birth | Reject update. |
| EC-FE03-007 | Future date of birth | Reject update. |
| EC-FE03-008 | Invalid phone format | Reject update if phone is editable. |
| EC-FE03-009 | Invalid avatar URL | Reject update or store null according to policy. |
| EC-FE03-010 | Payload includes password/role/status | Reject or ignore protected fields; do not change them. |
| EC-FE03-011 | Database update fails | Keep previous profile state and return safe error. |
| EC-FE03-012 | Avatar upload has no file | Reject upload. |
| EC-FE03-013 | Avatar upload is not an approved image type | Reject upload. |
| EC-FE03-014 | Avatar upload exceeds maximum size | Reject upload. |
| EC-FE03-015 | Avatar upload uses unsafe file name or path | Ignore original path/name and use a server-generated safe filename. |
| EC-FE03-016 | Avatar storage fails | Keep previous avatar state and return safe error. |

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
| fullName | string | No | Trimmed; max length must be approved. |
| address | string | No | Trimmed; max length must be approved. |
| dateOfBirth | date | No | Must not be in the future. |
| avatarUrl | string | No | Must be valid URL/path according to approved storage policy. May be generated by avatar upload. |
| avatarFile | file | No | Upload-only field. Accepted extensions: JPG, JPEG, PNG, WebP. Maximum size: 2 MB. Stored using a server-generated filename. |
| status | string | No | Display only if approved; not editable by FE03. |

---

## 11. API / Interface Contract

> Endpoint names are proposed for RESTful API. Final contract may stay in this SPEC.md unless the team reintroduces a dedicated shared API contract document.

| Method | Endpoint | Actor | Request | Response | Notes |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/profile/me` | Member/Librarian/Admin | - | Safe profile DTO | Current user's profile only. |
| PUT | `/api/profile/me` | Member/Librarian/Admin | `{ fullName?, address?, dateOfBirth?, avatarUrl?, phone? }` | Updated safe profile DTO | Phone is included as an approved editable field in Phase 1. |
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
- NFR-FE03-TXN-002: Invalid avatar uploads must not change the current stored `avatarUrl`.

### 12.3 Performance

- NFR-FE03-PERF-001: Profile load should require only current user/profile lookup in normal cases.

### 12.4 Logging and Audit

- NFR-FE03-LOG-001: Profile update failures should be logged safely without storing sensitive payloads.
- NFR-FE03-LOG-002: Audit logging for profile updates is optional unless the team requires it.

### 12.5 Usability

- NFR-FE03-UX-001: Validation errors must identify the invalid field clearly.
- NFR-FE03-UX-002: Profile view should clearly separate editable profile fields from account fields managed elsewhere.
- NFR-FE03-UX-003: Avatar upload errors should clearly identify file size or file type problems.

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
| FE04 Membership Management | Internal | Owns membership status; FE03 may display but not change it if approved. |
| FE11 User & Role Management | Internal | Owns user status and role management. |
| SQL Server database | Technical | Current SQL script has `Users` and `UserProfiles`. |

---

## 15. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE03-001 | FE03 can update `Users.Phone`. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-002 | FE03 cannot update email; email changes must go through FE02 verification. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-003 | Missing profile records are auto-created on first view. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-004 | Phase 1 supports avatar upload from the user's local device. Store the generated public path in `UserProfiles.AvatarUrl`. | User request 2026-06-20 | DRAFT REVISION |
| Q-FE03-005 | Profile updates write audit logs for changed fields, actor, and timestamp. | Review packet 2026-06-10 | APPROVED |

---

## 16. Traceability Matrix

| Requirement ID | Related Use Case | Related Test Case | Status |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE03-002 | UC11 | FT12 | Not Started |
| FR-FE03-001 | UC11 | FT12 | Not Started |
| BR-FE03-003 | UC12 | FT13 | Not Started |
| FR-FE03-004 | UC12 | FT13 | Not Started |
| BR-FE03-004 | UC11, UC12 | FT12, FT13 | Not Started |
| BR-FE03-005 | UC12 | FT13 | Not Started |
| AC-FE03-004 | UC11 | FT12 | Not Started |
| AC-FE03-007 | UC12 | FT13 | Not Started |
| BR-FE03-011 | UC12 | FT13 | Not Started |
| BR-FE03-012 | UC12 | FT13 | Not Started |
| BR-FE03-013 | UC12 | FT13 | Not Started |
| BR-FE03-014 | UC12 | FT13 | Not Started |
| FR-FE03-008 | UC12 | FT13 | Not Started |
| FR-FE03-009 | UC12 | FT13 | Not Started |

---

## 17. Review Checklist

Phase 1 approval checklist (completed on 2026-06-10):

- [x] Editable profile fields are approved.
- [x] Phone and email ownership is confirmed with FE02/FE11.
- [x] Missing profile behavior is approved.
- [ ] Avatar upload storage policy revision is reviewed and approved.
- [x] Privacy and response DTO rules are reviewed.
- [x] Every acceptance criterion can become a test.
