# Safety Constraints — Library Management System

# Version: 0.1.0

# Status: DRAFT

> Security, privacy, and operational safety rules. These rules override convenience or performance trade-offs.

## 1. Authentication and Authorization

- SAFE-AUTH-001: Every protected endpoint must require authentication.
- SAFE-AUTH-002: Role-based access must be enforced on the server, not only in the UI.
- SAFE-AUTH-003: Passwords must be hashed with a modern, salted algorithm. Never store plaintext passwords.
- SAFE-AUTH-004: Session or token expiration must be enforced; long-lived tokens require an explicit reason in `feat-auth/SPEC.md`.

## 2. Input Validation

- SAFE-VAL-001: All user input must be validated on the server.
- SAFE-VAL-002: All database access must use parameterized queries or an ORM; no string concatenation of SQL.
- SAFE-VAL-003: Output rendered to the UI must be escaped to prevent XSS.

## 3. Secrets Management

- SAFE-SEC-001: No secrets in source code, commit history, or test fixtures.
- SAFE-SEC-002: Secrets are loaded from environment variables or a secret store at runtime.
- SAFE-SEC-003: `.env`, `.env.*`, `*.secret`, `secrets/`, `credentials/` must remain in [`.gitignore`](../../.gitignore).

## 4. Privacy and PII

- SAFE-PII-001: Member personal data (name, email, phone, address) is treated as PII.
- SAFE-PII-002: PII must not appear in logs, error messages, or analytics events.
- SAFE-PII-003: Reports that aggregate member data must avoid exposing individual identities unless the requesting role is authorized.

## 5. Audit and Logging

- SAFE-LOG-001: Authentication events (login, logout, failed login) must be logged.
- SAFE-LOG-002: Admin actions on books, members, borrowing, returning, and fines must be logged with actor and timestamp.
- SAFE-LOG-003: Logs must not contain secrets, tokens, or full PII payloads.

## 6. Destructive Operations

- SAFE-DEL-001: Deleting a member, book, or transaction requires elevated permission and must be logged.
- SAFE-DEL-002: Bulk operations require explicit confirmation in the UI and must be reversible or recorded.

## 7. Dependency and Supply Chain

- SAFE-DEP-001: Dependencies must come from trusted registries.
- SAFE-DEP-002: Pin versions; review transitive updates before adopting them.
- SAFE-DEP-003: Flag any dependency name that looks like a typosquat before installing.

## 8. AI / Agent Safety

- SAFE-AI-001: AI/agent actions that modify code must follow the approved `SPEC.md` and `TASKS.md` for the feature.
- SAFE-AI-002: Agents must never commit secrets, disable safety checks, or weaken authorization rules without an approved RFC in [`.sdd/rfcs/`](../rfcs).
- SAFE-AI-003: Agents must respect [`.agents/.agentignore`](../../.agents/.agentignore) when scanning the repository.
