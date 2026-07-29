# System Integration Demo Runbook

Date: 2026-07-14; connected-flow update: 2026-07-29

Audience: SWP391 project presentation

Target duration: five minutes

## 1. Evidence Boundary

Use the FE07, FE08, FE10 and FE12 pages for the visible connected workflow.
The authoritative staging database is Azure SQL. A green `/health` response
proves only that the backend process is reachable; it does not prove the four
feature state transitions or Azure SQL business data are correct.

Do not use local-storage sample rows as proof of database integration. Do not display passwords, tokens, notification bodies, `SafePayload`, connection strings, or `.env` content.

## 2. Preflight

- Run the current read-only staging gate and keep its six check names visible:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

- Run `npm.cmd run phase3:performance` and confirm the documented bcrypt-cost-10
  timing plus entry-bundle metrics are emitted without identities or tokens.
- Start both applications with `npm.cmd run dev`.
- Verify `Invoke-RestMethod http://localhost:3000/health` returns a healthy response.
- Open the frontend URL printed by Vite and confirm login works for two approved
  Member accounts (A/B) and one Librarian account.
- Record one synthetic `copyId` whose status is `AVAILABLE`.
- Confirm both members are `ACTIVE`, membership is `APPROVED`, each has fewer
  than five active loans, no overdue active loan and no `UNPAID` fine.
- Keep a small state sheet with `memberAUserId`, `memberBUserId`,
  `librarianUserId`, `copyId`, both `requestId` values, `borrowDetailId`,
  `reservationId` and the four expected `notificationId` values.
- Never place account passwords or bearer tokens in this file or presentation slides.

## 3. Five-Minute Flow

| Time | Action | Evidence to show |
| --- | --- | --- |
| 0:00-0:25 | Show `/health`, name the Azure SQL boundary and login as Member A. | Reachability is a preflight only; the selected copy is `AVAILABLE`. |
| 0:25-0:55 | A opens `/borrowing/new` and creates a request. | FE07 request is `PENDING`; detail is `REQUESTED`. |
| 0:55-1:25 | Librarian opens `/librarian/borrow-requests` and approves. | FE07 request/detail/copy become `APPROVED`/`BORROWED`/`BORROWED`; one `BORROW_REQUEST_APPROVED` request exists. |
| 1:25-1:50 | A opens the bell item. | FE10 marks it read, opens `/borrowing/history`, and FE07 timeline uses canonical timestamps. |
| 1:50-2:20 | B opens `/reservations/mine` and reserves that borrowed copy. | FE08 reservation is `ACTIVE`; queue position is copy-scoped. |
| 2:20-3:05 | Librarian returns A's copy and chooses **Xử lý hàng đợi đặt chỗ**. | FE07 is `RETURNED`; read-only `reservationQueueAction` opens the exact FE08 queue without mutating it. |
| 3:05-3:35 | Librarian chooses **Giữ sách & thông báo**. | FE08 picks FIFO head, reservation/copy become `NOTIFIED`/`RESERVED`; FE10 contains one `RESERVATION_READY`. |
| 3:35-4:15 | B opens **Reservation ready**, checks expiry and chooses **Tạo yêu cầu mượn**. | Deep link contains the held `bookId` and exact `copyId`; second FE07 request is `PENDING`. |
| 4:15-4:40 | Librarian approves B's request. | Second detail/copy become `BORROWED`; FE08 reservation becomes `FULFILLED`. |
| 4:40-5:00 | Librarian opens `/home`. | Six FE12 KPI values equal the current backend snapshot; pending/open are `0`, active loans are `1`. |

Do not turn the FE07 return button into an automatic FE08 queue mutation. The
separate confirmation demonstrates responsibility and audit boundaries. If a
post-commit FE10 request fails, show the safe warning and keep the already
committed FE07/FE08 source state.

## 4. API Fallback

Use team-approved tokens only in the current terminal session:

```powershell
$memberHeaders = @{ Authorization = "Bearer $memberToken" }
$staffHeaders = @{ Authorization = "Bearer $librarianToken" }

$created = Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/borrow-requests' `
  -Headers $memberHeaders -ContentType 'application/json' `
  -Body (@{ copyIds = @($copyId) } | ConvertTo-Json)

$requestId = $created.borrowRequest.requestId
$borrowDetailId = $created.borrowRequest.details[0].borrowDetailId

$approved = Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/borrow-requests/$requestId/approve" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ notes = 'Presentation approval' } | ConvertTo-Json)

$returned = Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/borrow-details/$borrowDetailId/return" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ condition = 'NORMAL'; returnDate = '2026-07-14' } | ConvertTo-Json)

$calculated = Invoke-RestMethod -Method Post `
  -Uri 'http://localhost:3000/api/fines/calculate' `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ borrowDetailId = $borrowDetailId } | ConvertTo-Json)

$fineId = $calculated.fine.fineId
Invoke-RestMethod -Method Patch `
  -Uri "http://localhost:3000/api/fines/$fineId/paid" `
  -Headers $staffHeaders -ContentType 'application/json' `
  -Body (@{ paymentMethod = 'CASH'; note = 'Presentation fixture' } | ConvertTo-Json)

Invoke-RestMethod `
  -Uri "http://localhost:3000/api/reports/borrowing?fromDate=2026-07-01&toDate=2026-07-31&userId=$memberUserId" `
  -Headers $staffHeaders
```

If the UI or API cannot start, use the deterministic automated evidence:

```powershell
npm.cmd run test:system
npx.cmd playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium

$env:SYSTEM_SQL_TEST_ALLOW_MUTATION = 'true'
$env:SYSTEM_SQL_TEST_ENV_FILE = 'D:\SWP391\library-management-system\backend\.env'
npm.cmd --prefix backend run test:sql:system
```

The system test and connected Chromium test prove
FE07 -> FE10 -> FE08 -> FE07 -> FE12 with deterministic synthetic users. The
optional SQL suite proves the separately documented SQL-backed path and verifies
cleanup before exiting.

If port `4173` is already used by another local session, preserve that process
and run the browser evidence on isolated ports:

```powershell
$env:E2E_FRONTEND_PORT='4273'
$env:E2E_BACKEND_PORT='3200'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4273'
$env:E2E_BACKEND_URL='http://127.0.0.1:3200'
npm.cmd run test:e2e
```

## 5. Safe FE10 Query

Select metadata only. Do not select `Body`, `SafePayload`, tokens, or provider details.

```sql
SELECT
  NotificationId,
  Status,
  SourceFeature,
  SourceEntityType,
  SourceEntityId,
  CreatedAt
FROM Notifications
WHERE SourceFeature = 'FE07'
  AND (
    (SourceEntityType = 'BorrowRequest' AND SourceEntityId = @RequestId)
    OR
    (SourceEntityType = 'BorrowDetail' AND SourceEntityId = @BorrowDetailId)
  );
```

## 6. Failure Fallbacks

| Failure | Fallback |
| --- | --- |
| Frontend does not start | Show API responses from Section 4 and the passing SIT output. |
| SQL Server is unavailable | Run `npm.cmd run test:system`; state clearly that this is deterministic in-memory integration evidence. |
| Email delivery is unavailable | Show the queued FE10 notification metadata; delivery is not required to prove the cross-feature request. |
| Login session has the wrong role | Clear the stale session, log in again, and show the role before continuing. |
| Live fixture is inconsistent | Stop the live mutation and use the automated SQL proof or pre-captured screenshots. Do not improvise with shared data. |

## 7. Reset Checklist

- Copy is restored to `AVAILABLE`, unless the team intentionally retains the completed demonstration loan.
- Borrow request/detail IDs are recorded and left in an understood terminal state or removed by the fixture owner.
- No demo notification remains unexpectedly `PENDING`; do not delete unrelated notifications.
- Fine is `PAID` or the synthetic fine is removed by its fixture cleanup.
- Synthetic Member/Librarian rows and `UserRoles` are removed when disposable accounts were used.
- Current browser session is logged out and no bearer token remains in shared terminal history or slides.
- `SIT-SQL-001` ends with `TestUsers=0` and `TestCopies=0` through its assertions.

## 8. Rehearsal Record

Historical results remain in `.sdd/reviews/system-integration-evidence-2026-07-14.md`.
The current Phase 3 browser, staging, performance, visual, and reset evidence is
recorded in `docs/release/phase3-user-testing-record-2026-07-19.md`.

Run twice before the defense:

1. Normal pace: verify every state transition and reset.
2. Timed pace: finish within five minutes using the fallback evidence when needed.
