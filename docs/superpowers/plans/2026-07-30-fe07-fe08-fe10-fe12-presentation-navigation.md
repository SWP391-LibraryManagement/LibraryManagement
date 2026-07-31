# FE07-FE08-FE10-FE12 Presentation Navigation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create one concise, evidence-backed guide that lets a student trace and present FE07, FE08, FE10, and FE12 without changing the application architecture or behavior.

**Architecture:** Keep the existing React -> `libraryFeatureApi` -> Express route/validator -> controller -> service -> repository -> SQL Server structure. The only product artifact is a single presentation map under `docs/architecture`; it links to existing code rather than introducing new modules, folders, dependencies, APIs, or database structures.

**Tech Stack:** Markdown, existing React/Vite source, Node.js/Express source, SQL Server repository layer, `rg`, Git, and the project traceability script.

## Global Constraints

- Preserve every existing API route, request body, query string, role check, business rule, database schema, UI behavior, and Azure configuration.
- Do not create, move, split, rename, or reformat production source files.
- Treat the four `SPEC.md` files as the source of truth; the presentation map must not introduce a rule or state transition.
- Explain FE10 correctly: FE07/FE08 request backend notifications; `/notifications` is an authenticated personal inbox.
- Explain FE08 correctly: FE07 return supplies a read-only handoff; a librarian must explicitly process the reservation queue.
- Explain FE12 correctly: reports are authorized read-only views, and the operations summary is server-derived rather than frontend-calculated.
- Work only on branch `docs/fe07-fe12-presentation-navigation`; do not use a `codex/` branch name.

---

## File Structure

| File | Responsibility |
| --- | --- |
| Create `docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md` | Single entry point for defense prep: source map, connected demo script, request-to-result explanations, and rebuttal notes. |
| Create `docs/superpowers/specs/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation-design.md` | Approved design and scope boundary for this documentation-only batch. |
| Create `docs/superpowers/plans/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation.md` | This executable implementation plan. |

No frontend, backend, database, environment, migration, or deployment file is modified.

### Task 1: Build the single presentation map

**Files:**

- Create: `docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md`
- Reference: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Reference: `.sdd/specs/feat-reservation-management/SPEC.md`
- Reference: `.sdd/specs/feat-notification-management/SPEC.md`
- Reference: `.sdd/specs/feat-reporting-statistics/SPEC.md`

**Interfaces:**

- Consumes: existing pages, `frontend/src/api/libraryFeatureApi.js`, backend routes, controllers, services, repositories, and the four feature specifications.
- Produces: one Markdown guide that a presenter can follow without reading all source files first.

- [ ] **Step 1: Capture the authoritative entry points before writing prose.**

Run:

```powershell
rg -n "router\\.(get|post|patch)" backend/src/routes/borrowingRoutes.js backend/src/routes/reservationRoutes.js backend/src/routes/notificationRoutes.js backend/src/routes/reportRoutes.js
rg -n "async function (createBorrowRequest|approveBorrowRequest|rejectBorrowRequest|returnBorrowDetail|renewBorrowDetail|createReservation|cancelReservation|processQueue|expireHolds|getBorrowingReport|getInventoryReport|getUserStatistics)" backend/src/services/borrowingService.js backend/src/services/reservationService.js backend/src/services/reportService.js
```

Expected: route and service names match the presentation map; no endpoint or action is inferred from page labels.

- [ ] **Step 2: Write the map with a fixed six-part explanation for every feature.**

Create the following top-level sections in this exact order:

```markdown
# FE07-FE08-FE10-FE12: Bản đồ trình bày code và nghiệp vụ

## Cách dùng trong lúc bảo vệ
## Luồng liên hoàn FE07 -> FE08 -> FE10 -> FE12
## FE07 — Quản lý mượn sách
## FE08 — Quản lý đặt chỗ
## FE10 — Thông báo cá nhân
## FE12 — Báo cáo và thống kê
## Câu hỏi phản biện thường gặp
## Bảng mở file nhanh
```

For each FE section, include exactly these labels: `Khi thầy cô hỏi gì`, `Bấm ở đâu`, `Request`, `Server xử lý`, `Dữ liệu`, and `Kết quả thật`.

- [ ] **Step 3: Add the exact source-navigation table.**

Include these service actions and source paths, with each row explaining its purpose in plain Vietnamese:

| Feature | Page entry | Backend route/controller/service/repository chain |
| --- | --- | --- |
| FE07 | `frontend/src/page/borrowing/BorrowRequestPage.jsx`, `BorrowRequestsAdminPage.jsx`, `ProcessReturnsPage.jsx`, `BorrowingHistoryPage.jsx` | `backend/src/routes/borrowingRoutes.js` -> `controllers/borrowingController.js` -> `services/borrowingService.js` (`createBorrowRequest`, `approveBorrowRequest`, `rejectBorrowRequest`, `returnBorrowDetail`, `renewBorrowDetail`) -> `repositories/borrowingRepository.js` |
| FE08 | `frontend/src/page/reservation/MyReservationsPage.jsx`, `ReservationsLibrarianPage.jsx` | `backend/src/routes/reservationRoutes.js` -> `controllers/reservationController.js` -> `services/reservationService.js` (`createReservation`, `cancelReservation`, `processQueue`, `expireHolds`) -> `repositories/reservationRepository.js` |
| FE10 | `frontend/src/page/notification/NotificationsPage.jsx`, `frontend/src/component/notification/NotificationBell.jsx` | `backend/src/routes/notificationRoutes.js` -> `controllers/notificationController.js` -> `services/notificationService.js` -> `repositories/notificationRepository.js` |
| FE12 | `frontend/src/page/report/BorrowingReportPage.jsx`, `InventoryReportPage.jsx`, `UserStatisticsPage.jsx` | `backend/src/routes/reportRoutes.js` -> `controllers/reportController.js` -> `services/reportService.js` (`getBorrowingReport`, `getInventoryReport`, `getUserStatistics`) -> `repositories/reportRepository.js` |

- [ ] **Step 4: Write the connected demo script without changing source behavior.**

Explain these facts in this order:

```text
1. FE07 validates and records a borrowing request or decision transaction.
2. After the source transaction commits, FE07 can request one safe FE10 result notification.
3. A librarian explicitly processes the FE08 queue; that operation selects an eligible owner, holds a copy, and requests FE10 notification.
4. The notified reservation owner moves to FE07 with the exact held copy id; FE07 rechecks eligibility server-side.
5. FE12 reads already-committed source state and does not calculate KPI values in the browser.
```

Add the corresponding batch rules: `BR-FE07-035` through `BR-FE07-037`, `BR-FE08-021` through `BR-FE08-022`, `BR-FE10-021` through `BR-FE10-023`, and `BR-FE12-017` through `BR-FE12-020`.

- [ ] **Step 5: Verify the map is navigable and honest.**

Run:

```powershell
rg -n "frontend/src/|backend/src/|BR-FE07-|BR-FE08-|BR-FE10-|BR-FE12-" docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md
git diff --check
```

Expected: every source path is present in the map, no trailing whitespace is reported, and the map does not prescribe a new business rule.

### Task 2: Cross-check business claims and final source paths

**Files:**

- Modify: `docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md`
- Reference: the four feature `SPEC.md` files named in Task 1

**Interfaces:**

- Consumes: completed map from Task 1 and the approved feature specifications.
- Produces: a map whose connected-flow statements can be traced to approved rule IDs and real source.

- [ ] **Step 1: Verify every cross-feature assertion against the approved specification.**

Run:

```powershell
Get-Content .sdd/specs/feat-borrowing-management/SPEC.md | Select-Object -Skip 816 -First 40
Get-Content .sdd/specs/feat-reservation-management/SPEC.md | Select-Object -Skip 601 -First 32
Get-Content .sdd/specs/feat-notification-management/SPEC.md | Select-Object -Skip 803 -First 34
Get-Content .sdd/specs/feat-reporting-statistics/SPEC.md | Select-Object -Skip 456 -First 40
```

Expected: the map states the same transaction, queue, notification, ownership, and reporting boundaries as the four appendices.

- [ ] **Step 2: Verify every path in the navigation table exists.**

Run:

```powershell
$paths = @(
  'frontend/src/api/libraryFeatureApi.js',
  'backend/src/routes/borrowingRoutes.js', 'backend/src/routes/reservationRoutes.js',
  'backend/src/routes/notificationRoutes.js', 'backend/src/routes/reportRoutes.js',
  'backend/src/controllers/borrowingController.js', 'backend/src/controllers/reservationController.js',
  'backend/src/controllers/notificationController.js', 'backend/src/controllers/reportController.js',
  'backend/src/services/borrowingService.js', 'backend/src/services/reservationService.js',
  'backend/src/services/notificationService.js', 'backend/src/services/reportService.js',
  'backend/src/repositories/borrowingRepository.js', 'backend/src/repositories/reservationRepository.js',
  'backend/src/repositories/notificationRepository.js', 'backend/src/repositories/reportRepository.js'
)
$paths | Where-Object { -not (Test-Path $_) }
```

Expected: no output. Any missing path must be corrected in the map before review.

- [ ] **Step 3: Verify the documentation batch does not alter runtime files.**

Run:

```powershell
git diff --name-only
```

Expected: only the design, plan, and presentation-map Markdown files are listed.

### Task 3: Review, verify, and publish the documentation batch

**Files:**

- Verify: `docs/superpowers/specs/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation-design.md`
- Verify: `docs/superpowers/plans/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation.md`
- Verify: `docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md`

**Interfaces:**

- Consumes: the three documentation files and verification outputs from Tasks 1-2.
- Produces: one reviewable documentation-only commit and PR, with no runtime deployment.

- [ ] **Step 1: Run documentation and traceability checks.**

Run:

```powershell
git diff --check
npm run trace:enforce
```

Expected: no whitespace errors and `Mode: ENFORCE ... PASS`.

- [ ] **Step 2: Perform the internal H2/H3 evidence review under the user's standing authorization.**

Check that the diff has exactly three Markdown files, contains no source code change, no API/schema/Azure configuration change, and makes no claim that Azure runtime was verified.

- [ ] **Step 3: Commit and publish the reviewed documentation-only change.**

Run:

```powershell
git add docs/architecture/fe07-fe08-fe10-fe12-presentation-map.md docs/superpowers/specs/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation-design.md docs/superpowers/plans/2026-07-30-fe07-fe08-fe10-fe12-presentation-navigation.md
git commit -m "docs: add FE07-FE12 presentation navigation map"
git push -u origin docs/fe07-fe12-presentation-navigation
```

Expected: one documentation-only commit on the intended branch. Create a PR, wait for required checks, run final review, then merge only if the branch is mergeable and required checks pass.

## Plan Self-Review

- **Spec coverage:** Task 1 creates the one map required by the design. Task 2 checks every source and business claim. Task 3 enforces the no-runtime-change boundary and publishes only after evidence review.
- **Placeholder scan:** The plan contains no unfinished implementation instruction; every task has exact files, commands, expected outcomes, and source references.
- **Type/interface consistency:** This batch introduces no application interface. All named functions and routes are existing public code-navigation targets only.
