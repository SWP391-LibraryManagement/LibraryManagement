# CHANGELOG.md - FE08 Reservation Management

## 2026-06-02

- Created initial FE08 Reservation Management draft spec.
- Added context, open questions, proposed API contract, business rules, acceptance criteria, and traceability matrix.

## 2026-06-10

- Updated API contract policy to allow approval in `SPEC.md` unless the team reintroduces a shared API contract document.
- Resolved FE08/FE07 renewal dependency: active reservation or held copy for another member blocks FE07 loan renewal.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` decision status from draft/proposed/open to approved where applicable.
- Preserved Phase 1 scope controls and deferred future-work items explicitly.

## 2026-06-10 - Backend Slice Ready For Review

- Added the FE08 backend plan and task checklist for Nhat's reservation scope.
- Added member reservation APIs, staff queue processing, audit logging, and FE10 notification request handoff.
- Added backend tests for reservation rules, cancellation ownership, queue order, notifications, and role guards.
