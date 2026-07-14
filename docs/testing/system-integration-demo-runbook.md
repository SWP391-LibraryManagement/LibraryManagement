# System Integration Demo Runbook

Date: 2026-07-14

Audience: SWP391 project presentation

Target duration: five minutes

## 1. Evidence Boundary

Use the FE07 and FE12 pages for the visible workflow. Use API responses or the safe SQL query below for FE09 and FE10 when the corresponding frontend screen has not been verified against the production SQL services.

Do not use local-storage sample rows as proof of database integration. Do not display passwords, tokens, notification bodies, `SafePayload`, connection strings, or `.env` content.

## 2. Preflight

- Start both applications with `npm.cmd run dev`.
- Verify `Invoke-RestMethod http://localhost:3000/health` returns a healthy response.
- Open the frontend URL printed by Vite and confirm login works for one approved Member and one Librarian account.
- Record one synthetic `copyId` whose status is `AVAILABLE`.
- Confirm the member is `ACTIVE`, membership is `APPROVED`, has fewer than five active loans, has no overdue active loan, and has no `UNPAID` fine.
- Keep a small state sheet with `memberUserId`, `librarianUserId`, `copyId`, `requestId`, `borrowDetailId`, `notificationId`, and `fineId`.
- Never place account passwords or bearer tokens in this file or presentation slides.

## 3. Five-Minute Flow

| Time | Action | Evidence to show |
| --- | --- | --- |
| 0:00-0:30 | Show `/health`, login, and the selected `AVAILABLE` copy. | Backend reachable; correct Member session; clean fixture. |
| 0:30-1:10 | Member opens `/borrowing/new` and creates a request. | Request is `PENDING`; detail is `REQUESTED`. |
| 1:10-1:50 | Librarian opens `/librarian/borrow-requests` and approves it. | Request is `APPROVED`; detail/copy are `BORROWED`; due date is approval date +14 days. |
| 1:50-2:20 | Show the FE10 due-date notification metadata. | `SourceFeature=FE07`, `SourceEntityType=BORROWING`, matching request ID, status `PENDING` or later delivery status. |
| 2:20-3:10 | Use a prepared overdue fixture, then return it from `/librarian/returns`. | Return response contains `fineCandidate`; 14 overdue days maps to 70,000 VND at 5,000 VND/day. |
| 3:10-4:10 | Calculate the FE09 fine, retry borrowing while unpaid, mark it paid, then retry. | `UNPAID` fine blocks the next borrow; `PAID` removes that blocker. |
| 4:10-5:00 | Open `/reports/borrowing`. | FE12 shows the integrated request/loan activity and remains read-only. |

For the overdue step, prepare the due date before the presentation. Do not edit a shared production record during the talk. The automated SQL proof uses due date `2026-06-30` and return date `2026-07-14`, producing exactly 14 overdue days.

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

$env:SYSTEM_SQL_TEST_ALLOW_MUTATION = 'true'
$env:SYSTEM_SQL_TEST_ENV_FILE = 'D:\SWP391\library-management-system\backend\.env'
npm.cmd --prefix backend run test:sql:system
```

The SQL suite creates synthetic rows, proves FE07 -> FE10 -> FE09 -> FE12 shared state, and verifies cleanup before exiting.

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
  AND SourceEntityType = 'BORROWING'
  AND SourceEntityId = @RequestId;
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

Run twice and record the result in `.sdd/reviews/system-integration-evidence-2026-07-14.md`:

1. Normal pace: verify every state transition and reset.
2. Timed pace: finish within five minutes using the fallback evidence when needed.
