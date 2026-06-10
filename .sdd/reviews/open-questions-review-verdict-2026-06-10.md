# Spec Review Verdict - Open Questions Resolution

Date: 2026-06-10
Reviewer: Claude
Status: RECOMMENDED FOR TEAM APPROVAL
Input packet: `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`
Limit: This file records review recommendations only. It does not replace team approval.

## Executive Verdict

The proposed decisions in the resolution packet are internally consistent with:

- `.sdd/constitution.md`
- `.sdd/shared_context.md`
- `.sdd/constraints/global.md`
- `.sdd/constraints/business.md`
- `.sdd/constraints/safety.md`
- `.agents/AGENTS.md`
- Playbook principles from the SDD/ADD PDF

Review result:

- `APPROVE AS PROPOSED` for most decisions.
- `APPROVE WITH NOTE` for decisions that are acceptable for Phase 1 but should be written carefully in the related `SPEC.md`.
- `KEEP TEAM DECISION` for items that depend on project preference, assignment constraints, or team delivery capacity.

---

## 1. Cross-Feature Review Verdict

| ID | Review Verdict | Notes |
| --- | --- | --- |
| X-001 | APPROVE AS PROPOSED | Good boundary. Prevents FE01/FE05 overlap. |
| X-002 | APPROVE AS PROPOSED | Good separation: business ownership in FE02/FE11, delivery support in FE10. |
| X-003 | APPROVE AS PROPOSED | Clean ownership split across FE03, FE11, FE02. |
| X-004 | APPROVE AS PROPOSED | Keeps membership workflow separate from role management. |
| X-005 | APPROVE AS PROPOSED | Required to prevent invalid copy transitions and double-borrowing. |
| X-006 | APPROVE AS PROPOSED | Matches shared context and keeps Phase 1 scope controlled. |
| X-007 | APPROVE AS PROPOSED | Consistent with FE07 renewal rule already resolved. |
| X-008 | APPROVE WITH NOTE | Write clearly whether reminder trigger is manual, scheduler, or both in each affected spec. |
| X-009 | APPROVE AS PROPOSED | Necessary for FE12 reporting consistency. |

---

## 2. Feature-Level Review Verdict

### FE01 Public / Browse

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE01-001 | APPROVE AS PROPOSED | Public should not see inactive books. |
| Q-FE01-002 | APPROVE AS PROPOSED | Simple availability is enough for Phase 1. |
| Q-FE01-003 | APPROVE AS PROPOSED | Good minimum filter set. |
| Q-FE01-004 | APPROVE WITH NOTE | Acceptable if ISBN is treated as bibliographic metadata, not sensitive data. |
| Q-FE01-005 | APPROVE AS PROPOSED | Keeps scope small and testable. |

### FE02 Authentication

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE02-001 | APPROVE AS PROPOSED | Meets baseline security without over-engineering. |
| Q-FE02-002 | KEEP TEAM DECISION | 15m/7d is reasonable, but the team may prefer a different duration. |
| Q-FE02-003 | APPROVE WITH NOTE | If FE10 mock email is not ready, mark verification as planned/mock, not silently dropped. |
| Q-FE02-004 | APPROVE AS PROPOSED | Fine for Phase 1. |
| Q-FE02-005 | APPROVE WITH NOTE | Spec should define simple measurable limit, not vague rate limiting. |
| Q-FE02-006 | APPROVE AS PROPOSED | 15 minutes is reasonable. |
| Q-FE02-007 | APPROVE AS PROPOSED | Good for auditability. |
| Q-FE02-008 | APPROVE AS PROPOSED | Clear and simple. |
| Q-FE02-009 | APPROVE AS PROPOSED | Matches current stack and common backend pattern. |
| Q-FE02-010 | APPROVE AS PROPOSED | Good Phase 1 compromise. |

### FE03 User Profile

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE03-001 | APPROVE AS PROPOSED | Consistent with profile ownership. |
| Q-FE03-002 | APPROVE AS PROPOSED | Email change should stay with FE02 verification flow. |
| Q-FE03-003 | APPROVE AS PROPOSED | Reduces null-profile edge cases. |
| Q-FE03-004 | APPROVE AS PROPOSED | Correct Phase 1 scope cut. |
| Q-FE03-005 | APPROVE WITH NOTE | Audit log detail level should stay lightweight and not expose old sensitive values unnecessarily. |

### FE04 Membership Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE04-001 | APPROVE AS PROPOSED | Reasonable lifecycle behavior. |
| Q-FE04-002 | APPROVE AS PROPOSED | Required for traceability. |
| Q-FE04-003 | APPROVE AS PROPOSED | Good scope control. |
| Q-FE04-004 | APPROVE AS PROPOSED | Prevents FE04/FE11 overlap. |
| Q-FE04-005 | KEEP TEAM DECISION | Librarian+Admin is practical, but the reviewer may prefer Admin-only for stronger control. |
| Q-FE04-006 | APPROVE WITH NOTE | Notification dependency should be non-blocking and explicit in FE04/FE10. |

### FE05 Book Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE05-001 | APPROVE AS PROPOSED | Good bibliographic compromise. |
| Q-FE05-002 | APPROVE AS PROPOSED | Realistic library rule. |
| Q-FE05-003 | APPROVE AS PROPOSED | Good split between public and staff views. |
| Q-FE05-004 | APPROVE AS PROPOSED | Safer than physical delete. |
| Q-FE05-005 | KEEP TEAM DECISION | One category is simpler, but assignment/business expectation may want many-to-many. |
| Q-FE05-006 | APPROVE AS PROPOSED | Best for Phase 1 simplicity. |
| Q-FE05-007 | APPROVE AS PROPOSED | Protects active operational data. |

### FE06 Inventory / Book Copy Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE06-001 | APPROVE AS PROPOSED | Needed shared baseline. |
| Q-FE06-002 | APPROVE AS PROPOSED | Prevents staff bypass of borrow/reservation flows. |
| Q-FE06-003 | APPROVE AS PROPOSED | Consistent with soft-delete strategy. |
| Q-FE06-004 | APPROVE AS PROPOSED | Optional location is acceptable in Phase 1. |
| Q-FE06-005 | APPROVE WITH NOTE | Fine for Phase 1, but document that condition/status split is future work. |
| Q-FE06-006 | APPROVE AS PROPOSED | Matches audit requirement in shared rules. |

### FE08 Reservation Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE08-001 | APPROVE AS PROPOSED | Matches current SQL and limits database change risk. |
| Q-FE08-002 | APPROVE AS PROPOSED | Prevents reservation when immediate borrowing is possible. |
| Q-FE08-003 | KEEP TEAM DECISION | `3` is reasonable, but this limit should be team-approved, not guessed. |
| Q-FE08-004 | KEEP TEAM DECISION | `2` days is reasonable, but still a business decision. |
| Q-FE08-005 | APPROVE AS PROPOSED | Manual queue fits Phase 1 capacity. |

### FE09 Fine Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE09-001 | APPROVE AS PROPOSED | Keeps scope aligned with baseline. |
| Q-FE09-003 | APPROVE AS PROPOSED | Simpler accounting model for Phase 1. |
| Q-FE09-004 | APPROVE WITH NOTE | Use the simplest schema that still preserves collector and note traceability. |
| Q-FE09-005 | KEEP TEAM DECISION | Waive/cancel power is sensitive; the team should confirm. |
| Q-FE09-006 | APPROVE WITH NOTE | Make ownership explicit: FE09 calculates fines; FE07 triggers return event; scheduler is future work unless approved. |

### FE10 Notification Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE10-001 | APPROVE AS PROPOSED | Fits project phase and avoids provider lock-in. |
| Q-FE10-002 | APPROVE AS PROPOSED | Good out-of-scope cut. |
| Q-FE10-003 | APPROVE WITH NOTE | If the team cannot finish all templates, classify lower-priority ones as deferred. |
| Q-FE10-004 | APPROVE AS PROPOSED | Good for observability. |
| Q-FE10-005 | APPROVE AS PROPOSED | Manual retry is enough for Phase 1. |
| Q-FE10-006 | APPROVE AS PROPOSED | Important non-blocking rule. |
| Q-FE10-007 | APPROVE AS PROPOSED | Consistent with shared context. |

### FE11 User & Role Management

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE11-001 | APPROVE AS PROPOSED | Prevents accidental lockout. |
| Q-FE11-002 | KEEP TEAM DECISION | Prevent vs warn is a policy choice; prevent is safer. |
| Q-FE11-003 | APPROVE AS PROPOSED | Reuse FE02 password rule. |
| Q-FE11-004 | APPROVE AS PROPOSED | Standard and safer uniqueness behavior. |
| Q-FE11-005 | APPROVE WITH NOTE | If FE10 mock email is unavailable, keep this as planned/manual admin setup path. |
| Q-FE11-006 | APPROVE AS PROPOSED | Good Phase 1 safety rule. |
| Q-FE11-007 | APPROVE AS PROPOSED | Flat roles reduce complexity. |
| Q-FE11-008 | APPROVE AS PROPOSED | Required by safety constraints. |
| Q-FE11-009 | KEEP TEAM DECISION | Optional is acceptable, but depends on FE10 scope and delivery capacity. |

### FE12 Reporting & Statistics

| Question | Review Verdict | Notes |
| --- | --- | --- |
| Q-FE12-001 | APPROVE AS PROPOSED | Good role boundary. |
| Q-FE12-002 | APPROVE AS PROPOSED | Good minimum borrowing metrics. |
| Q-FE12-003 | APPROVE AS PROPOSED | Good minimum inventory metrics. |
| Q-FE12-004 | APPROVE AS PROPOSED | Good minimum user metrics. |
| Q-FE12-005 | APPROVE AS PROPOSED | Correct scope cut for Phase 1. |
| Q-FE12-006 | APPROVE WITH NOTE | Audit should be simple event logging, not heavy analytics. |

---

## 3. Remaining Team Decisions

The following items should still be explicitly approved by the team because they are business-policy choices rather than purely technical consistency choices:

- `Q-FE02-002` session durations
- `Q-FE04-005` approver roles for membership decisions
- `Q-FE05-005` one category vs multiple categories per book
- `Q-FE08-003` max active reservations per member
- `Q-FE08-004` reservation hold duration
- `Q-FE09-005` admin waive/cancel fine policy
- `Q-FE11-002` prevent vs warn on deactivating users with active borrowings
- `Q-FE11-009` user deactivation notification requirement

These do not block discussion, but they should not be silently assumed without team sign-off.

---

## 4. Reviewer Recommendation

Recommended next step:

1. Use the review verdict to pre-fill the packet outcomes.
2. Hold a short team review meeting focused only on the items in Section 3 above.
3. Update each affected `SPEC.md` and `CHANGELOG.md`.
4. Change feature status to `APPROVED` only after those updates are finished.

Recommended pre-fill policy:

- Mark all `APPROVE AS PROPOSED` items as `APPROVED`.
- Mark all `APPROVE WITH NOTE` items as `APPROVED`, then copy the note into the related `SPEC.md` wording.
- Leave all `KEEP TEAM DECISION` items as `PENDING` until team sign-off.
