# CONTEXT.md - FE03 User Profile

# Version: 0.1.0

# Status: DRAFT

# Owner: Dat

# Last Updated: 2026-06-10

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
- Maintaining profile fields such as full name, address, date of birth, avatar URL, and phone when approved.
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
- Avatar upload/storage is not defined; Phase 1 may only support avatar URL.
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

## 9. Open Questions For Team / Teacher

| ID | Question | Owner | Status |
| -- | -------- | ----- | ------ |
| Q-FE03-001 | Can users update phone in FE03 even though it lives in `Users`? | Team/Teacher | Open |
| Q-FE03-002 | Can users update email in FE03, or must email changes go through FE02 verification? | Team/Teacher | Open |
| Q-FE03-003 | Are avatar uploads required, or only avatar URL text? | Team/Teacher | Open |
| Q-FE03-004 | Which profile fields are mandatory? | Team/Teacher | Open |
| Q-FE03-005 | Should Admin/Librarian be able to view another user's profile here, or only in FE11? | Team/Teacher | Open |

---

## 10. Notes For Implementation Later

- Do not implement until `SPEC.md` is reviewed and approved.
- `PLAN.md` and `TASKS.md` stay `NOT STARTED` until approval.
- Do not return `PasswordHash`.
- Do not allow FE03 to change role, status, or password.
- Validate every profile field on the server.
- Keep profile access scoped to the authenticated user unless the spec is explicitly changed.
