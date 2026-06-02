# CONTEXT.md - FE11 User & Role Management

# Version: 0.1.0

# Status: DRAFT

# Owner: Dung

# Last Updated: 2026-06-02

# Feature folder: `.sdd/specs/feat-user-role-management/`

---

## 1. Feature Purpose

User & Role Management exists to manage user accounts, librarian accounts, and system roles.

This feature must keep three things consistent:

- User account information.
- User account status.
- User role assignments and permissions.

Because authorization affects every protected feature in the system, this feature is treated as a Full Spec feature.

---

## 2. Real-World Workflow

1. Admin creates user accounts.
2. Admin updates account information.
3. Admin deactivates accounts when necessary.
4. Admin creates librarian accounts.
5. Admin assigns roles.
6. The system validates permissions.
7. Other features use role information to authorize actions.

---

## 3. Feature Boundary

FE11 includes:

- View user list.
- View user information.
- Create user accounts.
- Update user accounts.
- Deactivate user accounts.
- Create librarian accounts.
- Update librarian accounts.
- Deactivate librarian accounts.
- Manage roles.

FE11 does not include:

- Authentication. That belongs to FE02.
- Membership approval. That belongs to FE04.
- Book management. That belongs to FE05.
- Borrowing operations. That belongs to FE07.

---

## 4. Current Data Model Notes

Current entities:

- Users
- Roles
- UserRoles

Potential issues:

- Role assignment rules must be clarified.
- Soft delete should be used for accounts.
- Audit logging may be required for account changes.

---

## 5. Main Use Cases From Assignment Sheet

UC49 - UC57

---

## 6. Feature Tests From Assignment Sheet

FT50 - FT58

---

## 7. Key Risks

- Incorrect role assignment may expose protected features.
- Account deactivation may impact active library operations.
- Missing authorization checks may create security vulnerabilities.

---

## 8. Dependencies

| Dependency | Why It Matters |
| ---------- | -------------- |
| FE02 Authentication | Provides login identity. |
| All protected modules | Use roles and permissions from FE11. |

---

## 9. Open Questions

| ID | Question | Status |
| -- | -------- | ------ |
| Q-FE11-001 | Can a user have multiple roles? | Open |
| Q-FE11-002 | Can Admin deactivate another Admin? | Open |
| Q-FE11-003 | Is role hierarchy required? | Open |

---

## 10. Notes For Implementation Later

- Do not implement until SPEC.md is reviewed.
- PLAN.md and TASKS.md remain NOT STARTED until approval.