# TASKS.md - FE12 Reporting & Statistics

Status: READY FOR REVIEW

Owner: Nhat

Updated: 2026-06-10

---

## 1. Backend Tasks

- [x] FE12-T01 Add borrowing, inventory, and user report routes.
- [x] FE12-T02 Add validators for report filters and date-range ordering.
- [x] FE12-T03 Add read-only reporting service with role checks.
- [x] FE12-T04 Add borrowing aggregate queries and metrics.
- [x] FE12-T05 Add inventory aggregate queries and metrics.
- [x] FE12-T06 Add user statistics aggregate queries and metrics.
- [x] FE12-T07 Add audit logs for successful report access.
- [x] FE12-T08 Keep report responses aggregate-only and free of unnecessary personal data.

## 2. Test Tasks

- [x] FE12-T09 Add in-memory report repository helper.
- [x] FE12-T10 Test borrowing report metrics and zero-result handling.
- [x] FE12-T11 Test inventory report metrics.
- [x] FE12-T12 Test user statistics and personal-data suppression.
- [x] FE12-T13 Test invalid range and role protection.

## 3. Validation

- [x] `npm test` in `backend`.

## 4. Traceability

| Spec ID | Covered by |
| --- | --- |
| BR-FE12-001 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| BR-FE12-002 | FE12-T13 |
| BR-FE12-003 | FE12-T03, FE12-T13 |
| BR-FE12-004 | FE12-T04, FE12-T10 |
| BR-FE12-005 | FE12-T05, FE12-T11 |
| BR-FE12-006 | FE12-T06, FE12-T12 |
| BR-FE12-008 | FE12-T02, FE12-T13 |
| BR-FE12-009 | FE12-T02, FE12-T13 |
| BR-FE12-010 | FE12-T04, FE12-T05, FE12-T06 |
| BR-FE12-011 | FE12-T06, FE12-T12 |
| BR-FE12-012 | FE12-T04, FE12-T05, FE12-T06 |
| FR-FE12-001 | FE12-T10 |
| FR-FE12-002 | FE12-T11 |
| FR-FE12-003 | FE12-T12 |
| FR-FE12-004 | FE12-T13 |
| FR-FE12-005 | FE12-T02, FE12-T13 |
| FR-FE12-006 | FE12-T10 |
| FR-FE12-007 | FE12-T03, FE12-T10, FE12-T11, FE12-T12 |
| FR-FE12-008 | FE12-T06, FE12-T12 |

## 5. Still Outside This Slice

- CSV/PDF export.
- Dashboards.
- BI warehouse integration.
