# SPEC.md Template — Library Management System

# Version: 0.1.0

# Status: DRAFT

# Owner: TBD

# Last Updated: YYYY-MM-DD

> Use this template for every core feature in `.sdd/specs/feat-{name}/SPEC.md`.
> SPEC.md is the source of truth for the feature. Implementation, tests, API contracts, and UI behavior must follow this file.

---

## 1. Feature Overview

### 1.1 Feature Name

[Feature name]

### 1.2 Business Context

[Explain why this feature exists in the Library Management System. Describe the real problem it solves for librarians, administrators, members, or library operation.]

### 1.3 Goal / Outcome

[Describe the expected outcome. Focus on what the system must achieve, not how the code will be written.]

### 1.4 Scope Level

Choose one:

- [ ] Full Spec — core business logic, high risk, must be correct from the beginning
- [ ] Standard Spec — normal feature with business rules and validations
- [ ] Light Spec — simple UI, documentation, or low-risk feature

---

## 2. Actors and Permissions

| Actor   | Description   | Permission / Responsibility              |
| ------- | ------------- | ---------------------------------------- |
| [Actor] | [Description] | [What this actor can do in this feature] |

Example actors: Admin, Librarian, Member, Guest.

---

## 3. Preconditions

The feature can only start when:

- PRE-001: [Condition before the feature can be executed]
- PRE-002: [Condition before the feature can be executed]

---

## 4. Main Flow

1. [Step 1]
2. [Step 2]
3. [Step 3]
4. [Step 4]

---

## 5. Alternative Flows

### AF-001: [Alternative flow name]

1. [Alternative step 1]
2. [Alternative step 2]
3. [Expected result]

---

## 6. Business Rules

Use stable IDs so requirements can be traced to tasks and tests.

- BR-001: [Business rule]
- BR-002: [Business rule]
- BR-003: [Business rule]

Example:

- BR-001: A book cannot be borrowed if its available quantity is 0.
- BR-002: A member cannot borrow more than the configured borrowing limit.

---

## 7. Functional Requirements

Use EARS-style wording when possible.

- FR-001: When [event], the system shall [expected behavior].
- FR-002: If [condition], then the system shall [expected behavior].
- FR-003: While [state], the system shall [expected behavior].

---

## 8. Acceptance Criteria

Use Given / When / Then format.

- AC-001: Given [context], when [action], then [expected result].
- AC-002: Given [context], when [action], then [expected result].
- AC-003: Given [context], when [action], then [expected result].

---

## 9. Edge Cases and Error Handling

| ID     | Edge Case / Error | Expected System Behavior |
| ------ | ----------------- | ------------------------ |
| EC-001 | [Edge case]       | [Expected behavior]      |
| EC-002 | [Edge case]       | [Expected behavior]      |

---

## 10. Data Requirements

### 10.1 Entities Involved

| Entity   | Purpose in this feature |
| -------- | ----------------------- |
| [Entity] | [Purpose]               |

### 10.2 Data Fields

| Field   | Type   | Required | Validation / Notes |
| ------- | ------ | -------- | ------------------ |
| [field] | [type] | Yes/No   | [rules]            |

---

## 11. API / Interface Contract

> Leave as TBD if the API design has not been approved yet.

| Method                | Endpoint   | Actor   | Request       | Response       | Notes   |
| --------------------- | ---------- | ------- | ------------- | -------------- | ------- |
| [GET/POST/PUT/DELETE] | [/api/...] | [Actor] | [Request DTO] | [Response DTO] | [Notes] |

---

## 12. Non-functional Requirements

### 12.1 Security

- NFR-SEC-001: All user input must be validated.
- NFR-SEC-002: No secrets, passwords, API keys, or tokens may be hardcoded.
- NFR-SEC-003: The system must enforce role-based access for protected actions.

### 12.2 Performance

- NFR-PERF-001: [Expected performance requirement]

### 12.3 Logging and Audit

- NFR-LOG-001: Important business actions must be logged with actor, timestamp, and result.

### 12.4 Usability

- NFR-UX-001: Error messages must be understandable for the intended user.

---

## 13. Out of Scope

This feature does not include:

- [Out-of-scope item 1]
- [Out-of-scope item 2]

---

## 14. Dependencies

| Dependency                   | Type              | Notes   |
| ---------------------------- | ----------------- | ------- |
| [Feature / Module / Service] | Internal/External | [Notes] |

---

## 15. Open Questions

| ID    | Question   | Owner   | Status |
| ----- | ---------- | ------- | ------ |
| Q-001 | [Question] | [Owner] | Open   |

---

## 16. Traceability Matrix

| Requirement ID | Related Task ID | Related Test Case ID | Status      |
| -------------- | --------------- | -------------------- | ----------- |
| BR-001         | T001            | TC001                | Not Started |
| FR-001         | T002            | TC002                | Not Started |
| AC-001         | T003            | TC003                | Not Started |

---

## 17. Review Checklist

Before this SPEC.md is approved:

- [ ] Business context is clear.
- [ ] Actors and permissions are defined.
- [ ] Preconditions are testable.
- [ ] Business rules have stable IDs.
- [ ] Acceptance criteria are written in Given / When / Then format.
- [ ] Edge cases are listed.
- [ ] Out-of-scope items are explicit.
- [ ] Security and validation requirements are included.
- [ ] Open questions are resolved or assigned.
- [ ] Traceability matrix is ready for TASKS.md and tests.
