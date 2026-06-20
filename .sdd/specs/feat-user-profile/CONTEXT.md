# CONTEXT.md - FE03 User Profile

# Version: 0.2.0

# Status: DRAFT - AVATAR UPLOAD REVISION

# Owner: Dat

# Last Updated: 2026-06-20

# Feature folder: `.sdd/specs/feat-user-profile/`

---

## 1. Feature Purpose

User Profile exists so authenticated members and librarians can view and maintain their personal profile information.

This feature must keep three things separate:

- Account credentials and authentication belong to FE02.
- Personal profile data belongs to FE03.
- Administrative user/role management belongs to FE11.

FE03 is a Standard Spec feature because it contains user-owned personal data and server-side validation, but it does not manage authentication or authorization rules.

---

## 2. Real-World Workflow

The typical profile workflow:

1. A member or librarian logs in.
2. The user opens their profile page.
3. The system loads account summary and profile details.
4. The user edits allowed profile fields.
5. The system validates the submitted data.
6. The system saves profile changes.
7. The system keeps protected account fields such as role, status, and password outside FE03 changes.

---

## 3. Feature Boundary

FE03 includes:

- Viewing own profile.
- Updating own allowed profile fields.
- Maintaining profile fields such as full name, address, date of birth, avatar, and phone when approved.
- Uploading an avatar image from the user's local device when avatar upload is approved.
- Server-side validation of profile input.

FE03 does not include:

- Login, logout, password change, password reset, or email verification. Those belong to FE02.
- Creating, deactivating, or assigning roles to users. That belongs to FE11.
- Membership application and approval. That belongs to FE04.
- Borrowing history. That belongs to FE07.
- Fine history. That belongs to FE09.

---

## 4. Current Data Model Notes

The current SQL script includes:

- `Users(UserId, Username, Email, PasswordHash, Phone, Status, CreatedAt)`
- `UserProfiles(ProfileId, UserId, FullName, Address, DateOfBirth, AvatarUrl)`
- `UserRoles(UserId, RoleId)`

Potential issues to review:

- `Phone` currently lives in `Users`, while most profile fields live in `UserProfiles`; the team must decide whether FE03 can update phone.
- Email may be an account identity field and may require FE02 verification before changes.
- Avatar upload/storage is now proposed for Phase 1 revision. The preferred approach is storing the uploaded file on the backend as a static asset and saving the generated public path in `UserProfiles.AvatarUrl`.
- Members and librarians should only edit their own profile unless FE11 explicitly gives admin profile management.
- Profile data is personal information and must not be exposed to other users.

These are not blockers for drafting, but they must be resolved before implementation.

---

## 5. Main Use Cases From Assignment Sheet

| Use Case ID | Use Case Name | Owner |
| ----------- | ------------- | ----- |
| UC11 | View Profile | Dat |
| UC12 | Update Profile | Dat |

---

## 6. Feature Tests From Assignment Sheet

| Test ID | Test Name | Owner |
| ------- | --------- | ----- |
| FT12 | View profile | Dat |
| FT13 | Update profile | Dat |

---

## 7. Key Risks

- A user may access another user's personal profile if authorization checks are missing.
- Updating profile may accidentally change account credentials, roles, or membership state.
- Invalid phone, date of birth, or avatar URL data may be stored without validation.
- Uploaded avatar files may create security risk if file type, size, path, or executable content is not validated.
- Email change behavior may conflict with FE02 verification.
- Profile responses may expose password hash or role data if DTOs are not controlled.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Provides current authenticated user identity and password/email credential flows. |
| FE11 User & Role Management | Owns admin-controlled user status and roles. |
| FE04 Membership Management | Owns membership status, which may be displayed but not changed here. |
| SQL Server database | Stores `Users` and `UserProfiles`. |

---

## 9. Resolved Questions

| ID | Approved Decision | Source | Status |
| -- | ----------------- | ------ | ------ |
| Q-FE03-001 | FE03 can update `Users.Phone`. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-002 | FE03 cannot update email; email changes go through FE02 verification. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-003 | Missing profile records are auto-created on first view. | Review packet 2026-06-10 | APPROVED |
| Q-FE03-004 | Phase 1 originally supported avatar URL text only. This revision proposes local avatar file upload with backend-generated `avatarUrl`. | User request 2026-06-20 | DRAFT REVISION |
| Q-FE03-005 | Profile updates write audit logs. | Review packet 2026-06-10 | APPROVED |

## 9.1 Avatar Upload Revision Notes

- Users may upload their own avatar image from their local machine.
- The upload must be authenticated and scoped to the current user only.
- The frontend sends a multipart form-data request containing one image file.
- The backend validates the file before storage.
- The backend stores only a generated path/URL in `UserProfiles.AvatarUrl`; the original local machine path must never be stored.
- Existing profile response DTOs continue returning `avatarUrl` for display.

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Do not return `PasswordHash`.
- Do not allow FE03 to change role, status, or password.
- Validate every profile field on the server.
- Keep profile access scoped to the authenticated user unless the spec is explicitly changed.
