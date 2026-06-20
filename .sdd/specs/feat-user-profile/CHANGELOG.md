# CHANGELOG.md - FE03 User Profile

## 2026-06-20 - Frontend Avatar Upload UI Implemented

- Added frontend API call for `POST /api/profile/me/avatar` using multipart form-data.
- Added avatar file picker and upload button inside the profile edit dialog.
- Added client-side validation for JPG/JPEG/PNG/WebP and 2 MB maximum size.
- Updated profile state from the backend response after successful avatar upload.
- Ran frontend lint and production build successfully.

## 2026-06-20 - Backend Avatar Upload Implemented

- Implemented `POST /api/profile/me/avatar` behind authentication.
- Added single-file multipart parsing for the `avatar` field without adding new dependencies.
- Added server-side avatar validation for JPG/JPEG/PNG/WebP, 2 MB max size, file extension, and image signature.
- Added backend-controlled avatar storage under `/uploads/avatars` with generated filenames.
- Added repository/service support to update only `UserProfiles.AvatarUrl` after a successful upload.
- Added backend tests for route wiring, guest rejection, missing file rejection, valid upload, invalid type rejection, oversized file rejection, unchanged avatar on invalid upload, and no persisted local client path.

## 2026-06-20 - Avatar Upload Spec Revision Drafted

- Updated FE03 `CONTEXT.md`, `SPEC.md`, `PLAN.md`, and `TASKS.md` to support uploading avatar images from the user's local device.
- Added proposed endpoint `POST /api/profile/me/avatar` using multipart form-data field `avatar`.
- Added avatar upload validation rules: JPG/JPEG/PNG/WebP only, 2 MB maximum, server-generated filename, and no persisted local client path.
- Added traceable business rules, functional requirements, acceptance criteria, edge cases, and tasks for avatar upload.
- Marked the revised spec/plan/tasks as draft revision pending team review.

## 2026-06-20 - Backend Implementation Completed

- Implemented FE03 backend profile route, controller, service, repository, validation, and safe DTO.
- Added `GET /api/profile/me` and `PUT /api/profile/me` behind existing authentication middleware.
- Added backend tests for profile route wiring, safe response DTO, missing profile auto-create, validation, protected-field rejection, atomic no-write validation failures, and audit logging.
- Marked FE03 backend tasks as completed in `TASKS.md`.

## 2026-06-20 - Backend Plan And Tasks Approved

- Replaced placeholder `PLAN.md` with an approved backend implementation plan for FE03.
- Replaced placeholder `TASKS.md` with approved backend tasks mapped to FE03 spec IDs and tests.
- Kept implementation scope limited to backend profile APIs, validation, DTOs, persistence, and tests.

## 2026-06-10

- Created FE03 User Profile feature specification structure.
- Established specification files: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md, and CHANGELOG.md.
- Aligned owner and assignment scope with the latest assignment sheet: UC11-UC12 and FT12-FT13 owned by Dat.
- Defined FE03 boundary against FE02 Authentication, FE04 Membership Management, and FE11 User & Role Management.
- Clarified API contract policy so REST endpoints may stay in SPEC.md unless the team reintroduces a shared API contract file.

## 2026-06-10 - Phase 1 Review Decisions Approved

- Approved FE03 open-question decisions from `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Updated `SPEC.md` status to `APPROVED`.
