# Pre-Azure Release Remediation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn tất các sửa chữa FE07/FE08, release preparation, credential rotation và governance không cần Azure SQL staging đang online.

**Architecture:** Giữ nguyên ownership hiện tại: FE07 sở hữu transaction mượn/trả, FE08 sở hữu queue/hold, FE10 sở hữu notification request và FE12 chỉ đọc aggregate. Handoff FE07 chỉ là read-only projection; không thêm API hoặc schema mới. Workflow chỉ xác minh migration/hash, còn việc chạy SQL vẫn do operator thực hiện sau khi database hết `Paused`.

**Tech Stack:** Node.js + Express + Jest + React/Vite + Node test runner + GitHub Actions + Azure CLI + SQL Server.

## Global Constraints

- Core behavior phải tuân theo SPEC/PLAN/TASKS hiện hành của FE07/FE08/FE10/FE12.
- Không mở rộng schema, API, actor boundary hoặc transaction ownership.
- `DAMAGED`/`LOST` không được phát ra queue handoff có thể xử lý như bản sao `AVAILABLE`.
- Handoff FE08 lỗi thời không được tự chuyển sang `copyId` khác.
- Không ghi credential vào repo, `.env`, fixture, log hoặc output.
- Không bật tính phí, resume database, chạy `sqlcmd`, deploy staging hoặc tạo release tag trong plan này.
- Mọi thay đổi behavior phải có test hồi quy và cập nhật CHANGELOG/SDD.

---

### Task 1: Khóa FE07 return handoff theo trạng thái bản sao

**Files:**
- Modify: `backend/src/repositories/borrowingRepository.js:1435-1503`
- Test: `backend/tests/borrowingRoutes.test.js` (các test return có reservation queue)
- Test: `backend/tests/borrowingRepository.test.js` (contract/source assertions hiện hành)
- Modify: `backend/tests/helpers/inMemoryBorrowingRepositories.js:818-827`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Interfaces:**
- Consumes: `returnBorrowDetail({ borrowDetailId, condition, ... })`.
- Produces: response `reservationQueueAction` giữ nguyên shape `{ copyId, hasActiveQueue, actionPath }`; chỉ thay đổi giá trị `hasActiveQueue`.

- [ ] **Step 1: Add the failing regression assertions**

Trong test return route, giữ test `NORMAL` hiện tại và thêm hai ca dùng cùng fixture có `ACTIVE` reservation:

```js
test.each(['DAMAGED', 'LOST'])(
  'returning a %s copy does not expose a process-queue handoff',
  async (condition) => {
    const response = await request(setup.app)
      .patch(`/api/borrow-details/${detailId}/return`)
      .set(auth)
      .send({ condition })
      .expect(200);

    expect(response.body.borrowDetail.status).toBe(condition);
    expect(response.body.reservationQueueAction).toEqual({
      copyId,
      hasActiveQueue: false,
      actionPath: '/librarian/reservations',
    });
  }
);
```

Trong in-memory repository test/fixture, bảo đảm `hasActiveQueue` được tính từ điều kiện `detailStatus === 'RETURNED'`, để regression không chỉ phụ thuộc SQL implementation.

- [ ] **Step 2: Run the focused tests and verify RED**

Run:

```powershell
npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Expected: test mới fail vì code hiện tại trả `hasActiveQueue: true` cho `DAMAGED/LOST`; các test cũ khác vẫn chạy để xác nhận failure cùng một root cause.

- [ ] **Step 3: Implement the smallest root-cause fix**

Trong `authoritativeReturn`, thay:

```js
hasActiveQueue: reservationQueueResult.recordset.some((row) => row.Status === 'ACTIVE'),
```

bằng:

```js
hasActiveQueue: detailStatus === 'RETURNED'
  && copyStatus === 'AVAILABLE'
  && reservationQueueResult.recordset.some((row) => row.Status === 'ACTIVE'),
```

Áp dụng cùng điều kiện trong `backend/tests/helpers/inMemoryBorrowingRepositories.js`. Không xóa hoặc tự chuyển reservation.

- [ ] **Step 4: Run the focused tests and verify GREEN**

Run:

```powershell
npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
```

Expected: all focused tests pass, gồm `NORMAL` handoff `true` và `DAMAGED/LOST` handoff `false`.

- [ ] **Step 5: Update traceability/changelog**

Ghi rõ `BR-FE07-012`, `BR-FE07-013`, `FR-FE07-007` và connected-flow handoff trong changelog; không thay đổi SPEC rule.

---

### Task 2: Giữ nguyên handoff `copyId` khi FE08 tải trạng thái lỗi thời

**Files:**
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx:7-126, 390-430`
- Test: `frontend/test/*.test.js` (test FE08 librarian handoff hiện hành)
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Consumes: `location.state.copyId` từ FE07.
- Produces: queue view đúng bản sao hoặc cảnh báo stale state; không thay đổi API payload/mutation.

- [ ] **Step 1: Add the failing source-level regression test**

Thêm test đọc source để khóa hai hành vi:

```js
test('FE08 does not fallback from a stale FE07 handoff to another active copy', () => {
  const source = readReservationLibrarianPage();

  assert.match(source, /initialQueueCopyId/);
  assert.match(source, /Hàng đợi đã thay đổi/);
  assert.doesNotMatch(
    source,
    /return mapped\.find\(\(item\) => isActiveReservationQueueStatus\(item\.status\)\)\?\.copyId \|\| null;/
  );
});
```

Giữ nguyên test hiện hành chứng minh handoff hợp lệ mở đúng `copyId`.

- [ ] **Step 2: Run the focused frontend test and verify RED**

Run:

```powershell
npm --prefix frontend test -- --test-name-pattern "handoff"
```

Expected: test mới fail vì `loadReservations()` đang fallback sang active copy đầu tiên.

- [ ] **Step 3: Implement exact-copy stale handling**

Thêm `useRef` để tiêu thụ handoff một lần:

```js
const pendingHandoffCopyId = useRef(initialQueueCopyId);
const [queueNotice, setQueueNotice] = useState('');
```

Trong `loadReservations()`:

```js
const requestedCopyId = pendingHandoffCopyId.current;
if (requestedCopyId) {
  const requestedIsActive = mapped.some((item) => (
    item.copyId === requestedCopyId && isActiveReservationQueueStatus(item.status)
  ));
  if (requestedIsActive) {
    setQueueCopyId(requestedCopyId);
  } else {
    setQueueCopyId(null);
    setQueueNotice('Hàng đợi đã thay đổi. Hãy tải lại hoặc chọn bản sao khác.');
  }
  pendingHandoffCopyId.current = null;
} else {
  setQueueCopyId((current) => (
    current && mapped.some((item) => (
      item.copyId === current && isActiveReservationQueueStatus(item.status)
    ))
      ? current
      : mapped.find((item) => isActiveReservationQueueStatus(item.status))?.copyId || null
  ));
}
```

Render `queueNotice` bằng `DataNotice` trong queue panel, cùng nút chuyển về danh sách/chọn thủ công. Không gọi `processQueue` tự động.

- [ ] **Step 4: Run the focused frontend tests and verify GREEN**

Run:

```powershell
npm --prefix frontend test -- --test-name-pattern "handoff|queue"
```

Expected: handoff hợp lệ vẫn đúng `copyId`, handoff stale không đổi sang copy khác, queue tests hiện hành pass.

- [ ] **Step 5: Update FE08 changelog**

Ghi `FR-FE08-039` và connected-flow stale-state behavior; giữ action path allowlist hiện tại.

---

### Task 3: Đưa migration FE10 mới vào release gate và đồng bộ SDD

**Files:**
- Modify: `.github/workflows/deploy-staging.yml:45-78, 91`
- Modify: `docs/deployment/azure-staging-guide.md:160-247, 381-390`
- Modify: `.sdd/specs/feat-borrowing-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Modify: `.sdd/specs/feat-reservation-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Modify: `.sdd/specs/feat-notification-management/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Modify: `.sdd/specs/feat-reporting-statistics/{SPEC.md,PLAN.md,TASKS.md,TEST_PLAN.md,CONTEXT.md,CHANGELOG.md}`
- Test: `backend/tests/notificationInboxMigration.test.js`
- Test: `tests/deployment/*.test.js`

**Interfaces:**
- Consumes: `database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`.
- Produces: deterministic migration SHA gate for future deployment; no database execution in CI.

- [ ] **Step 1: Add the failing deployment/migration assertions**

Add assertions that the deploy workflow and guide mention the new migration and expected SHA variable:

```js
assert.match(deployWorkflow, /2026-07-29-fe10-borrowing-result-templates\.sql/);
assert.match(deployWorkflow, /FE10_BORROWING_RESULT_TEMPLATES_SHA256/);
assert.match(stagingGuide, /2026-07-29-fe10-borrowing-result-templates\.sql/);
```

Run:

```powershell
npm run test:deployment
```

Expected: new assertions fail before workflow/docs changes.

- [ ] **Step 2: Implement the migration hash gate**

Extend the existing migration preflight to read the new file, normalize LF/CRLF exactly as the old gate does, compare to `FE10_BORROWING_RESULT_TEMPLATES_SHA256`, and fail before deployment if absent/mismatched. Keep the operator-owned “apply twice” instruction; do not call `sqlcmd` from the workflow.

- [ ] **Step 3: Update the Azure guide**

Add the migration to the ordered list and document:

```text
1. Apply 2026-07-29-fe10-borrowing-result-templates.sql twice with sqlcmd -b.
2. Verify BORROW_REQUEST_APPROVED, BORROW_REQUEST_REJECTED and BORROW_RENEWED are active.
3. Set FE10_BORROWING_RESULT_TEMPLATES_SHA256 to the exact normalized file hash.
```

Mark this step `BLOCKED` until Azure SQL is online; do not claim it was applied.

- [ ] **Step 4: Synchronize feature statuses**

Replace stale “CHỜ H3/MERGE” and “UNCOMMITTED PENDING H2 APPROVAL” headers with a precise post-merge state:

```text
Trạng thái: MERGED ON MAIN; POST-MERGE CI PASSED; AZURE STAGING BLOCKED BY PAUSED SQL QUOTA
```

Keep human Azure acceptance unchecked and preserve historical changelog entries.

- [ ] **Step 5: Run deployment/traceability checks**

Run:

```powershell
npm run test:deployment
npm run test:traceability-state
npm run trace:enforce
git diff --check
```

Expected: all automated checks pass; no statement says Azure migration or authenticated staging acceptance passed.

---

### Task 4: Add tracked-file secret scanning without introducing a dependency

**Files:**
- Create: `scripts/check-tracked-secrets.js`
- Create: `scripts/check-tracked-secrets.test.js`
- Modify: `package.json`
- Modify: `.github/workflows/ci.yml`

**Interfaces:**
- Consumes: Git tracked paths from `git ls-files -z`.
- Produces: exit code `0` when no high-confidence secret pattern is found; non-zero with file path and pattern name only, never the matched value.

- [ ] **Step 1: Write the failing scanner tests**

<!-- secret-scan: allow-synthetic -->

Create tests with temporary files containing a synthetic AWS key and a database URL password, plus a safe fixture:

```js
test('fails on high-confidence credential patterns without printing values', () => {
  const result = runScannerWithFixture('AWS_ACCESS_KEY_ID=AKIAIOSFODNN7EXAMPLE');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /AWS access key/);
  assert.doesNotMatch(result.stderr, /AKIAIOSFODNN7EXAMPLE/);
});

test('allows marked synthetic test passwords', () => {
  const result = runScannerWithFixture('// secret-scan: allow-synthetic\npassword=Phase3-test-only');
  assert.equal(result.status, 0);
});
```

- [ ] **Step 2: Run scanner tests and verify RED**

Run:

```powershell
node --test scripts/check-tracked-secrets.test.js
```

Expected: fail because the scanner script does not exist.

- [ ] **Step 3: Implement the minimal scanner**

Use Node built-ins only. Read tracked files as buffers, skip binary files and the scanner’s own test fixtures, normalize text, detect only high-confidence patterns (AWS access key, private key header, Azure publish profile XML secret, connection string password, and JWT-like assignment), support one-line `secret-scan: allow-synthetic`, and print only `path: pattern-name`.

- [ ] **Step 4: Wire the scanner into CI**

Add:

```yaml
- name: Secret literal scan
  run: node scripts/check-tracked-secrets.js
```

Run before dependency audits. Keep `npm audit --audit-level=high` unchanged.

- [ ] **Step 5: Verify scanner and CI contract**

Run:

```powershell
node --test scripts/check-tracked-secrets.test.js
npm run test:deployment
git grep -n -I -E "(AKIA[0-9A-Z]{16}|BEGIN (RSA|OPENSSH|EC) PRIVATE KEY|password=.{8,})" -- ':!scripts/check-tracked-secrets.test.js' ':!docs/superpowers/plans/2026-07-29-pre-azure-release-remediation.md'
```

Expected: scanner tests pass, known synthetic fixtures are allowlisted, and the final grep produces no real credential value.

---

### Task 5: Rotate SQL credential without exposing the new value

**Files:**
- No repository file changes.
- External state: Azure SQL logical server admin password and App Service `DB_PASSWORD`; update GitHub Actions secret only if an existing matching secret is present.
- Evidence: `.sdd/reviews/` or task log must contain only masked names/status, never the value.

**Interfaces:**
- Consumes: Azure resource group `rg-library-staging`, server `sql-library-staging-ea-nhat714`, app `app-library-api-staging-nhat714`.
- Produces: new password applied to server and matching App Service setting; connection verification deferred while database remains `Paused`.

- [ ] **Step 1: Confirm names without reading secret values**

Run:

```powershell
az sql server show --resource-group rg-library-staging --name sql-library-staging-ea-nhat714 `
  --query "{administratorLogin:administratorLogin,state:state}" -o json
az webapp config appsettings list --resource-group rg-library-staging `
  --name app-library-api-staging-nhat714 --query "[?name=='DB_PASSWORD'].name" -o tsv
gh secret list --app actions
```

Expected: server/app names resolve; no command prints a value.

- [ ] **Step 2: Generate and apply a memory-only password**

Use a single PowerShell process:

```powershell
$newSqlPassword = 'Lib' + [Guid]::NewGuid().ToString('N') + '!A9'
az sql server update --resource-group rg-library-staging `
  --name sql-library-staging-ea-nhat714 --admin-password $newSqlPassword | Out-Null
az webapp config appsettings set --resource-group rg-library-staging `
  --name app-library-api-staging-nhat714 `
  --settings "DB_PASSWORD=$newSqlPassword" | Out-Null
Remove-Variable newSqlPassword
```

Do not echo `$newSqlPassword`, include it in a transcript, or write it to `.env`.

- [ ] **Step 3: Verify only metadata**

Confirm the App Service setting name exists and the database remains `Paused`/unchanged; do not call a health endpoint and report it as passing while SQL is paused.

---

### Task 6: Apply governance and run non-Azure validation

**Files:**
- External state: GitHub branch protection for `main`.
- Test/evidence: CI, local suites, traceability output, clean diff.

- [ ] **Step 1: Discover the required CI check context**

Run:

```powershell
gh api repos/SWP391-LibraryManagement/LibraryManagement/commits/main/check-runs `
  --jq '.check_runs[].name' | Sort-Object -Unique
```

Use the exact stable CI job name in branch protection; do not invent a context.

- [ ] **Step 2: Enable conservative main protection**

Configure PR-required, strict up-to-date branches, conversation resolution, force-push/delete protection, and the discovered CI check. Do not require an unavailable external reviewer or bypass the check.

- [ ] **Step 3: Run the full non-Azure validation**

Run:

```powershell
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:deployment
npm run test:traceability-state
npm run trace:enforce
git diff --check
git status --short
```

Expected: all commands pass; the only remaining acceptance blocker is Azure SQL/migration/staging.

- [ ] **Step 4: Review the final diff**

Confirm changed files match this plan, no secret appears in the diff, and the SDD statuses do not claim Azure acceptance. Commit with:

```powershell
git add backend frontend scripts .github docs .sdd
git commit -m "fix: close pre-azure release findings"
```
