# Safety Constraints — Library Management System

# Version: 0.1.1

# Status: APPROVED

# Last Updated: 2026-07-20

> High-level security rules. These rules override convenience or speed. Detailed safety rules (audit, PII handling, dependency policy) will be added in later weeks.

## High-Level Security Rules

- SAFE-001: No secrets are committed. API keys, passwords, tokens, private keys, and database credentials must never appear in source code, fixtures, or commit history.
- SAFE-002: No hardcoded credentials, including admin accounts, default passwords, or seeded tokens.
- SAFE-003: All user input must be validated on the server. Client-side validation alone is not sufficient.
- SAFE-004: Role-based access must be enforced for every protected action. Authorization is checked on the server, not only in the UI.
- SAFE-005: Internal error stack traces and framework messages must not be exposed to end users; return safe, generic error responses.
