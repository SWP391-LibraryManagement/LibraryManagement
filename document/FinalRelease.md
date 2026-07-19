# Library Management System

**Final Release Document**

Version: 1.0  
Release date: 2026-07-19  
Project: SWP391 Library Management System  
Group/project code: `<GROUP_CODE>-LMS`  
Release status: Ready for human staging acceptance

## I. Deliverable Package

This section lists the final source code, database scripts, documents, test evidence, and deployment materials included in this release.

| No. | File / Folder | Version | Notes |
| --- | --- | --- | --- |
| 1 | `database/Librarymanagement.sql` | 1.0 | Final SQL Server database script, including the canonical table structures for users, roles, profiles, members, books, book copies, borrowing, reservations, fines, notifications, and audit logs. |
| 2 | `database/migrations/add_change_password_otp_token_type.sql` | 1.0 | Migration script for authentication token type support related to change-password OTP behavior. |
| 3 | `document/RDS.md` | 1.0 | Final Requirement & Design Specification document covering user requirements, use cases, screen flow, authorization, feature requirements, business rules, assumptions, dependencies, limitations, and references. |
| 4 | `document/SDS.md` | 1.0 | Final Software Design Specification document covering code packages, database design, class-level design, sequence diagrams, and representative SQL queries. |
| 5 | `document/FinalRelease.md` | 1.0 | Final release document for deliverable package, installation guide, and user manual overview. |
| 6 | `README.md` | 1.0 | Main project overview, implemented scope, architecture, setup commands, test commands, staging notes, limitations, and security notes. |
| 7 | `.sdd/constitution.md` | 0.1.1 | Project constitution defining approved stack, source-of-truth rules, core business rules, testing rules, and definition of done. |
| 8 | `.sdd/shared_context.md` | 1.0.0 | Shared project context, actors, core modules, data entities, and Phase 1 baseline business decisions. |
| 9 | `.sdd/test-plan.md` | 0.2.0 | Approved master test policy, coverage target, validation gate, test strategy, and readiness summary. |
| 10 | `.sdd/specs/feat-public-browse/` | Baseline 2026-07-17 | FE01 Public / Browse specification package. |
| 11 | `.sdd/specs/feat-auth/` | Baseline 2026-07-17 | FE02 Authentication specification package. |
| 12 | `.sdd/specs/feat-user-profile/` | Baseline 2026-07-17 | FE03 User Profile specification package. |
| 13 | `.sdd/specs/feat-membership-management/` | Baseline 2026-07-17 | FE04 Membership Management specification package. |
| 14 | `.sdd/specs/feat-book-management/` | Baseline 2026-07-17 | FE05 Book Management specification package. |
| 15 | `.sdd/specs/feat-inventory-book-copy/` | Baseline 2026-07-17 | FE06 Inventory / Book Copy Management specification package. |
| 16 | `.sdd/specs/feat-borrowing-management/` | Baseline 2026-07-17 | FE07 Borrowing Management specification package. |
| 17 | `.sdd/specs/feat-reservation-management/` | Baseline 2026-07-17 | FE08 Reservation Management specification package. |
| 18 | `.sdd/specs/feat-fine-management/` | Baseline 2026-07-17 | FE09 Fine Management specification package. |
| 19 | `.sdd/specs/feat-notification-management/` | Baseline 2026-07-17 | FE10 Notification Management specification package. |
| 20 | `.sdd/specs/feat-user-role-management/` | Baseline 2026-07-17 | FE11 User & Role Management specification package. |
| 21 | `.sdd/specs/feat-reporting-statistics/` | Baseline 2026-07-17 | FE12 Reporting & Statistics specification package. |
| 22 | `backend/` | 1.0 | Express.js backend source code, including routes, controllers, services, repositories, validators, middleware, models, OpenAPI documentation, tests, and scripts. |
| 23 | `frontend/` | 1.0 | React/Vite frontend source code, including pages, shared components, API clients, utilities, styles, assets, tests, and static web app configuration. |
| 24 | `backend/src/docs/openapi.yaml` | 1.0 | Machine-readable REST API documentation used by Swagger UI at `/api-docs`. |
| 25 | `docs/api/api-contract.md` | 1.0 | Supporting API contract notes for frontend/backend integration. |
| 26 | `docs/architecture/system-architecture.md` | 1.0 | Runtime architecture, trust boundaries, module ownership, local topology, Azure staging topology, and operational limitations. |
| 27 | `docs/architecture/feature-integration-map.md` | 1.0 | Cross-feature integration map and entity ownership notes. |
| 28 | `docs/user-manual.md` | 1.0 | Detailed user manual for application workflows. |
| 29 | `docs/tong-quan-he-thong-vi.md` | 1.0 | Vietnamese system overview document. |
| 30 | `docs/testing/master-test-plan.md` | 0.2.0 | Extended testing reference and validation workflow. |
| 31 | `docs/testing/system-integration-demo-runbook.md` | 1.0 | Demo and system integration runbook. |
| 32 | `docs/release/week13-acceptance-record.md` | 1.0 | Week 13 release candidate acceptance record and staging checklist. |
| 33 | `docs/deployment/azure-staging-guide.md` | 1.0 | Azure staging deployment and configuration guide. |
| 34 | `tests/e2e/system-golden-path.spec.js` | 1.0 | Playwright browser golden path test for login, borrowing, return, fine API handoff, and reporting. |
| 35 | `tests/deployment/*.test.js` | 1.0 | Deployment utility tests for Azure schema, staging smoke checks, and static web app routing. |
| 36 | `backend/tests/` | 1.0 | Backend automated test suite for authentication, profile, membership, inventory, borrowing, reservation, fine, notification, reporting, user management, security, and integration behavior. |
| 37 | `frontend/test/` | 1.0 | Frontend automated tests for API helpers, route access, operational view models, and UI behavior utilities. |
| 38 | `package.json`, `backend/package.json`, `frontend/package.json` | 1.0 | Root, backend, and frontend dependency and command definitions. |
| 39 | `.github/workflows/` | 1.0 | CI and staging deployment workflow definitions. |

### Final Product Backlog Summary

The project backlog is tracked through `.sdd/specs/feat-{name}/SPEC.md`, `PLAN.md`, `TASKS.md`, and `CHANGELOG.md` files. Final feature scope is summarized below.

| Feature | Roles | Final Status | Notes |
| --- | --- | --- | --- |
| FE01 Public / Browse | Guest, Member, Librarian, Admin | Approved baseline | Public catalog browsing, search, detail, and availability summary. |
| FE02 Authentication | Guest, Member, Librarian, Admin | Ready for human staging acceptance | Register, email verification, login, logout, refresh token, password change/reset, account setup support. |
| FE03 User Profile | Member, Librarian, Admin | Approved baseline | Profile view/update and avatar support; email changes remain outside FE03. |
| FE04 Membership Management | Member, Librarian, Admin | Approved baseline; UI integrated | Member application and librarian/admin approval/rejection workflow. |
| FE05 Book Management | Librarian, Admin | Approved baseline | Catalog create/update/deactivate/search; reactivation is follow-up scope. |
| FE06 Inventory / Book Copy Management | Librarian, Admin | Approved baseline | Physical copy management, barcode, location, copy status, and availability ownership. |
| FE07 Borrowing Management | Member, Librarian, Admin | Ready for staging recheck | Member borrow request, staff approval/rejection, return, renewal, and borrowing history. |
| FE08 Reservation Management | Member, Librarian, Admin | Ready for human staging acceptance | Reservation creation, cancellation, queue management, hold/fulfillment workflow. |
| FE09 Fine Management | Member, Librarian, Admin | Ready with UI limitation | Server-side overdue fine calculation and offline payment recording; legacy frontend is not release evidence. |
| FE10 Notification Management | System, Librarian, Admin | Ready with UI limitation | Safe email notifications, templates, queue, retry, and delivery attempts; inbox UI deferred. |
| FE11 User & Role Management | Admin | Approved baseline; finalization activated | User list/detail, role assignment, librarian account creation, permissions, and audit log access. |
| FE12 Reporting & Statistics | Librarian, Admin | Ready for staging recheck | Read-only borrowing, inventory, and user statistics reports. |

### Other Related Deliverables

| Item | Link / Location | Notes |
| --- | --- | --- |
| Tagged source code | `<git tag link>` | Add the Git repository release tag link after the team creates the final tag. Recommended tag name: `v1.0.0-final-release`. |
| Demonstration video | `<YouTube link>` | Add the final demo video link after upload. |
| Staging frontend | `<Azure Static Web Apps URL>` | Add the actual Azure Static Web Apps URL after deployment. |
| Staging backend health | `<Azure App Service URL>/health` | Add the actual backend health URL after deployment. |
| Swagger API documentation | `http://localhost:3000/api-docs` or `<staging backend>/api-docs` | Available when the backend is running. |

## II. Installation Guides

This project is a web application, not a NetBeans 8.2 desktop project. It runs with Node.js, Express.js, React/Vite, and SQL Server.

### 1. Prerequisites

- Node.js 22 and npm.
- SQL Server for local database-backed workflows.
- Git.
- Chromium installed through Playwright for E2E tests.
- Azure account only when deploying to Azure staging.

### 2. Install Dependencies

Open PowerShell at the project root:

```powershell
cd C:\Users\DTD\Desktop\LibraryManagement
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
npx.cmd playwright install chromium
```

### 3. Configure Environment Files

Create local environment files from the tracked examples:

```powershell
Copy-Item backend/.env.example backend/.env
Copy-Item frontend/.env.example frontend/.env
```

Set the backend SQL Server and authentication values in `backend/.env`.

Important backend configuration groups:

| Group | Typical Values |
| --- | --- |
| Authentication | `JWT_SECRET`, token lifetimes, bcrypt settings |
| Database | `DB_SERVER`, `DB_NAME`, SQL credentials or trusted connection settings |
| Frontend / CORS | `CORS_ORIGINS`, `FRONTEND_BASE_URL` |
| Email | SMTP host, port, user, password, sender |

Frontend builds use:

```text
VITE_API_BASE_URL=http://localhost:3000
```

Do not commit `.env` files or real credentials.

### 4. Prepare Database

1. Open SQL Server Management Studio or another SQL Server client.
2. Create the target database if needed.
3. Run `database/Librarymanagement.sql`.
4. If change-password OTP support is needed on an older database, run `database/migrations/add_change_password_otp_token_type.sql`.
5. Confirm that the backend `.env` points to the same database.

### 5. Run Locally

Start both frontend and backend from the project root:

```powershell
npm.cmd run dev
```

Default local endpoints:

| Service | URL |
| --- | --- |
| Frontend | `http://localhost:5173` |
| Backend | `http://localhost:3000` |
| Backend health | `http://localhost:3000/health` |
| Swagger UI | `http://localhost:3000/api-docs` |

Run only the backend:

```powershell
npm.cmd --prefix backend run dev
```

Run only the frontend:

```powershell
npm.cmd --prefix frontend run dev
```

### 6. Create Admin Account

After configuring the backend database, use the backend admin creation script if the environment is prepared:

```powershell
npm.cmd --prefix backend run create-admin
```

The script must not use hardcoded production credentials. Use safe test credentials for local/demo environments.

### 7. Test And Verification Commands

Run backend tests:

```powershell
npm.cmd --prefix backend test
```

Run backend coverage gate:

```powershell
npm.cmd --prefix backend run test:coverage:ci
```

Run frontend tests:

```powershell
npm.cmd --prefix frontend test
```

Run frontend lint and production build:

```powershell
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

Run system integration and E2E checks:

```powershell
npm.cmd run test:system
npm.cmd run test:e2e
```

Run deployment utility tests and traceability gate:

```powershell
npm.cmd run test:deployment
npm.cmd run trace:enforce
```

### 8. Azure Staging Deployment

Azure staging uses:

- Azure Static Web Apps for the frontend.
- Azure App Service for the backend.
- Azure SQL Database for staging data.
- GitHub Actions for CI/staging deployment.

Follow `docs/deployment/azure-staging-guide.md` for the full deployment procedure. The workflow does not automatically mutate database schema; run and review database schema updates manually.

## III. User Manual

### 1. Overview

Library Management System is a role-based web application for managing library operations. The system supports four Phase 1 roles:

| Role | Main Capabilities |
| --- | --- |
| Guest | Browse public book information, register, and login. |
| Member | Manage profile, apply for membership, request borrowing, manage reservations, view borrowing history and fines. |
| Librarian | Manage books/copies, review membership applications, approve/reject borrow requests, process returns, manage reservations, collect fines, and view reports. |
| Admin | Manage users, roles, permissions, audit logs, and all librarian-level operational functions. |

Main workflows:

1. Account access.
2. Public book browsing.
3. Profile management.
4. Membership application and review.
5. Book and inventory management.
6. Borrowing and return processing.
7. Reservation management.
8. Fine management.
9. User and role management.
10. Reporting and statistics.

For detailed screenshots, use `docs/user-manual.md` and the image assets under `docs/assets/user-manual/`.

### 2. Account Access Workflow

Purpose: allow users to register, verify email, login, logout, and recover account access.

Steps:

1. Open the frontend application.
2. Select Login or Register.
3. For registration, enter account information and submit the form.
4. Complete email verification through the configured OTP/email flow.
5. Login with valid credentials.
6. Use Forgot Password when password reset is needed.
7. Logout from the user menu when finished.

Rules:

- Email must be unique.
- Passwords are stored as bcrypt hashes.
- Email verification is required before normal login.
- Failed login lockout and reset behavior are enforced by the backend.

### 3. Public Book Browsing Workflow

Purpose: allow guests and authenticated users to view public catalog information.

Steps:

1. Open Home or the public book homepage.
2. Search by keyword or use available catalog filters.
3. View book information and availability summary.
4. Login as Member when borrowing or reservation actions are required.

Rules:

- Inactive books are hidden from public search/detail.
- Guests see simple availability, not internal copy management data.

### 4. Profile Management Workflow

Purpose: allow authenticated users to view and update personal profile information.

Steps:

1. Login.
2. Open User Profile.
3. Review profile details.
4. Update allowed fields such as full name, phone, address, date of birth, or avatar where supported.
5. Save changes and verify that the profile screen displays the updated data.

Rules:

- Email changes are not handled by FE03.
- Protected or unknown fields are rejected.
- Profile updates are processed through the backend.

### 5. Membership Workflow

Purpose: allow members to apply for library membership and allow staff to approve or reject applications.

Member steps:

1. Login as Member.
2. Open Membership.
3. Submit membership application information.
4. View current membership status.

Librarian/Admin steps:

1. Login as Librarian or Admin.
2. Open Membership review area.
3. Filter and review submitted applications.
4. Approve valid applications or reject invalid applications with a reason.

Rules:

- A member cannot create another application while one is pending.
- Approved membership does not expire in Phase 1.
- Only Librarian/Admin users may approve or reject membership applications.

### 6. Book And Inventory Management Workflow

Purpose: allow staff to maintain catalog records and physical book copies.

Steps:

1. Login as Librarian or Admin.
2. Open Book Management to create, search, update, or deactivate catalog records.
3. Open Inventory to manage physical copies.
4. Add copy barcode, location, and status.
5. Save changes and verify availability updates in the catalog/report screens.

Rules:

- ISBN is optional but must be unique when provided.
- One physical copy must have one unique barcode.
- Book deactivation is a soft delete; historical records remain.
- FE06 owns copy status transitions.

### 7. Borrowing And Return Workflow

Purpose: allow members to request books and allow staff to approve, reject, renew, or process returns.

Member steps:

1. Login as an approved Member.
2. Browse available books.
3. Create a borrow request.
4. Open Borrowing History to track request and loan status.

Librarian/Admin steps:

1. Open Borrow Requests.
2. Review pending requests.
3. Approve or reject the request.
4. Open Process Returns when books are returned.
5. Process return and confirm final status.

Rules:

- A member may have at most 5 active borrowed copies.
- Borrowing requires active user status and approved membership.
- A book/copy cannot be borrowed if available quantity is 0.
- Default loan duration is 14 calendar days from approval.

### 8. Reservation Workflow

Purpose: allow members to reserve unavailable or reservable copies and allow staff to process reservation queues.

Member steps:

1. Login as Member.
2. Create a reservation from the book workflow where available.
3. Open My Reservations.
4. Cancel own active reservation if needed.

Librarian/Admin steps:

1. Open Reservation Management.
2. Review reservation queue.
3. Hold, fulfill, cancel, expire, or process queue actions according to the reservation state.

Rules:

- Members may view and manage only their own reservations.
- Staff/Admin may manage queue operations.
- Reservation behavior depends on physical copy availability.

### 9. Fine Management Workflow

Purpose: calculate overdue fines and record offline fine resolution.

Steps:

1. Login as Librarian or Admin.
2. Open Fine Management or process a returned overdue item.
3. Calculate fine from stored due/return data.
4. Record payment or resolution where permitted.
5. Confirm the fine status is updated.

Rules:

- Overdue fine is 5,000 VND per overdue day per copy, starting the day after due date.
- Client input cannot determine calculated fine amount.
- Librarian/Admin may collect fines.
- Admin may waive or cancel fines with a required reason.

Release limitation:

- FE09 release evidence uses the server API. The legacy React fine page may contain classroom/demo local browser records and is not the authoritative production evidence.

### 10. User And Role Management Workflow

Purpose: allow Admin users to manage accounts, roles, permissions, and audit logs.

Steps:

1. Login as Admin.
2. Open Admin User Management.
3. Search or filter users.
4. View safe user details.
5. Create librarian/admin-managed accounts where permitted.
6. Assign or revoke roles.
7. Update user status.
8. Review audit logs.

Rules:

- Only Admin may manage role assignments.
- Roles are resolved on the server from `UserRoles`.
- Protected actions must enforce backend authorization.

### 11. Reporting And Statistics Workflow

Purpose: provide read-only operational reports for staff and admin users.

Steps:

1. Login as Librarian or Admin.
2. Open Borrowing Report, Inventory Report, or User Statistics.
3. Apply date or report filters where available.
4. Review summary cards, charts, and tables.

Rules:

- Reports are read-only and must not mutate operational records.
- Member/Guest users cannot access staff reports.
- Report data is derived from borrowing, inventory, user, member, and fine records.

### 12. Notification Workflow

Purpose: support email-based account, membership, borrowing, reservation, fine, and account setup notifications.

Steps:

1. Configure SMTP/email provider in backend environment settings.
2. Trigger a workflow that creates notification metadata, such as registration, password reset, membership review, borrow approval, reservation, or fine event.
3. Process pending notifications or retry failed sends where supported.
4. Review safe notification metadata and attempt status.

Rules:

- Email is the Phase 1 notification channel.
- Notification failure does not roll back the source business transaction.
- Sensitive tokens, OTP hashes, raw reset links, and provider internals are not exposed in normal API responses.

Release limitation:

- A completed notification inbox UI is deferred from this release scope.

### 13. Known Release Limitations

| No. | Limitation |
| --- | --- |
| 1 | Human staging acceptance still needs final reviewer sign-off. |
| 2 | FE09 legacy frontend is not authoritative release evidence; use server API evidence. |
| 3 | FE10 notification inbox UI is deferred. |
| 4 | SMTP delivery requires a configured provider; without SMTP, actual inbox delivery is not proven. |
| 5 | SQL integration testing is local/manual because CI does not provide a shared disposable SQL Server service. |
| 6 | Uploaded avatar storage on staging App Service needs durable storage before production-scale deployment. |
| 7 | Frontend production build may show a non-blocking chunk-size advisory. |
| 8 | Staging is a student-credit environment, not a production SLA environment. |

### 14. Final Acceptance Checklist

| Check | Status |
| --- | --- |
| Backend automated tests pass | Passed in Week 13 evidence: 307/307 tests. |
| Frontend tests pass | Passed in Week 13 evidence: 38/38 tests. |
| Frontend lint and build pass | Passed in Week 13 evidence. |
| Browser golden path passes | Passed in Chromium for login, borrowing, return, fine API, and reporting. |
| Coverage gate | Passed with more than 80% for configured metrics. |
| Security dependency audit | No unresolved Critical/High production dependency findings. |
| Traceability gate | Implemented features meet enforced FR `@spec` threshold. |
| Human staging acceptance | Pending final reviewer sign-off. |

### 15. References

| Reference | Location |
| --- | --- |
| Project README | `README.md` |
| Requirement & Design Specification | `document/RDS.md` |
| Software Design Specification | `document/SDS.md` |
| User Manual | `docs/user-manual.md` |
| System Architecture | `docs/architecture/system-architecture.md` |
| Feature Integration Map | `docs/architecture/feature-integration-map.md` |
| Master Test Policy | `.sdd/test-plan.md` |
| Acceptance Record | `docs/release/week13-acceptance-record.md` |
| Azure Staging Guide | `docs/deployment/azure-staging-guide.md` |
