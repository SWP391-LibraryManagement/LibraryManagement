# Week 13 Core Feature Acceptance Record

Date: 2026-07-14

Release candidate: Week 13 Azure staging

Overall status: READY FOR HUMAN ACCEPTANCE

## Evidence Rules

- L1 automated evidence does not replace L4 human acceptance.
- Only observed results are marked PASS.
- Feature status remains tied to its approved `SPEC.md`, `TASKS.md`, and review records.
- FE09 browser alignment and FE10 inbox UI remain explicit limitations.
- Staging review must use synthetic data and must not expose credentials, tokens, notification
  bodies, connection strings, or `.env` content.

## Shared Quality Evidence

| Evidence | Observed result |
| --- | --- |
| System integration | FE07, FE08, FE09, FE10, and FE12 share one tested workflow and persisted SQL state. |
| Browser golden path | Login -> borrow -> approve -> return -> fine API -> report passed in Chromium. |
| Backend gate | 307/307 tests passed; coverage remains above 80% for every configured metric. |
| Frontend gate | 38/38 tests, lint, and production build passed. |
| Security gate | Root, backend, and frontend production dependency audits report no Critical/High finding. |
| Traceability gate | Six implemented features meet the enforced FR `@spec` threshold. |

Sources:

- [System integration evidence](../../.sdd/reviews/system-integration-evidence-2026-07-14.md)
- [Week 11 browser evidence](../../.sdd/reviews/week11-e2e-evidence-2026-07-14.md)
- [Week 11 coverage evidence](../../.sdd/reviews/week11-coverage-evidence-2026-07-14.md)
- [Week 12 security audit](../../.sdd/reviews/week12-security-audit-2026-07-14.md)

## Feature Matrix

| Feature | Source of truth | Automated evidence | Human evidence | Current decision |
| --- | --- | --- | --- | --- |
| FE02 Authentication | [SPEC](../../.sdd/specs/feat-auth/SPEC.md), [TASKS](../../.sdd/specs/feat-auth/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-auth/TEST_PLAN.md) | `authRoutes`, `authUtils`, security regression, and full backend gate | Staging login, logout, invalid-token, and reset behavior still require final visual review | READY FOR HUMAN ACCEPTANCE |
| FE07 Borrowing | [SPEC](../../.sdd/specs/feat-borrowing-management/SPEC.md), [TASKS](../../.sdd/specs/feat-borrowing-management/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-borrowing-management/TEST_PLAN.md) | Route/service tests, SQL integration, and browser golden path | [B7 human review recorded](../../.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md); staging recheck required | READY FOR STAGING RECHECK |
| FE08 Reservation | [SPEC](../../.sdd/specs/feat-reservation-management/SPEC.md), [TASKS](../../.sdd/specs/feat-reservation-management/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-reservation-management/TEST_PLAN.md) | Reservation route/service tests and system integration queue evidence | Member and staff queue behavior require final staging review | READY FOR HUMAN ACCEPTANCE |
| FE09 Fine server API | [SPEC](../../.sdd/specs/feat-fine-management/SPEC.md), [TASKS](../../.sdd/specs/feat-fine-management/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-fine-management/TEST_PLAN.md) | Fine authorization/calculation tests, SQL integration, and Playwright API handoff | Production-aligned API requires staging review; legacy frontend is not acceptance evidence | READY WITH UI LIMITATION |
| FE10 Notification | [SPEC](../../.sdd/specs/feat-notification-management/SPEC.md), [TASKS](../../.sdd/specs/feat-notification-management/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-notification-management/TEST_PLAN.md) | Notification safety tests and system integration metadata evidence | Safe metadata and failure behavior require staging review; inbox UI is deferred | READY WITH UI LIMITATION |
| FE12 Reporting | [SPEC](../../.sdd/specs/feat-reporting-statistics/SPEC.md), [TASKS](../../.sdd/specs/feat-reporting-statistics/TASKS.md), [TEST PLAN](../../.sdd/specs/feat-reporting-statistics/TEST_PLAN.md) | Report route/service tests, SQL integration, and browser golden path | [B7 human review recorded](../../.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md); staging recheck required | READY FOR STAGING RECHECK |

## Known Acceptance Limitations

- FE09 `FineManagement.jsx` still contains a classroom/demo local-storage workflow. Week 13 accepts
  only the production-aligned server API and integrated handoff as release evidence.
- FE10 does not yet have a completed notification inbox UI. Week 13 acceptance covers safe request,
  queue, retry, audit, and metadata behavior.
- Azure staging email delivery is not considered PASS unless SMTP is configured and observed.
- Features still marked `NOT STARTED` or `DRAFT` are outside this release candidate.

## Staging Human Checklist

- [ ] Member login succeeds and unauthenticated protected routes redirect or return 401 correctly.
- [ ] Member creates a borrow request using synthetic staging data.
- [ ] Librarian approves the request and processes the return.
- [ ] FE08 member/staff reservation queue behavior matches the approved state transitions.
- [ ] FE09 API calculates 14 overdue days as 70,000 VND and records the fine as PAID.
- [ ] FE10 exposes safe metadata without raw token/link/body content.
- [ ] FE12 displays integrated borrowing activity and remains read-only.
- [ ] Desktop and mobile views have no blocking overflow or incoherent overlap.
- [ ] Reset/cleanup leaves no unexplained synthetic pending state.

## Sign-Off

Reviewer:

Date:

Decision: READY FOR STAGING / CHANGES REQUIRED

Notes:
