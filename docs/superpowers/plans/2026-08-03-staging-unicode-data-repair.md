# Staging Unicode Data Repair Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Khôi phục đúng dữ liệu tiếng Việt đang bị mojibake trên Azure staging và ngăn migration FE10 tiếp tục được chạy bằng sai encoding.

**Architecture:** React tiếp tục hiển thị nguyên văn dữ liệu API; không có frontend decoder. Một migration SQL lũy đẳng chuẩn hóa template/history FE10 và tự kiểm tra exact Unicode trước commit; workflow/runbook hash-gate migration này và bắt buộc `sqlcmd -f 65001`. Một operator script tạm, không commit, dùng `mssql` transaction và exact preimage guards để sửa riêng các hàng Books/BookCopies staging.

**Tech Stack:** SQL Server T-SQL, Node.js 22, `mssql` 12.5.5, PowerShell, GitHub Actions, Jest 30, Node test runner, React/Vite.

## Global Constraints

- Baseline triển khai: `origin/main@724dc2353f3b3a336d6c9d1cda457408c6fa61a3`; design commit: `bb288d2ecb2243dd6e3ff582bdfdb8df7fe4d22e`.
- Làm việc tại `D:\SWP391\library-management-system\.worktrees\borrowing-notification-ui`; không sửa hoặc reset checkout gốc đang dirty.
- Không thay frontend source, CSS, font, API, schema, role hoặc business rule nếu runtime evidence không chứng minh một lỗi khác.
- Mọi SQL mutation dùng parameterized values hoặc Unicode literals `N'...'`, `XACT_ABORT`, transaction và fail-closed exact-value checks.
- Không `DELETE`; không sửa notification ngoài `SourceFeature='FE07'` và bốn `TemplateKey` đã duyệt.
- Không in hoặc commit secret, SQL password, token, cookie, connection string hay temporary firewall IP.
- Temporary Azure SQL firewall rule phải dùng một exact IP, được xóa trong `finally`, rồi xác minh không còn tồn tại.
- Không commit implementation do AI tạo trước cổng H2; commit tài liệu activation đã được duyệt là ngoại lệ docs-only.
- PR implementation chỉ merge sau required CI và H3; staging mutation chỉ chạy từ exact merged `main` SHA.

---

## File Map

| File | Responsibility |
| --- | --- |
| `docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md` | Kế hoạch triển khai được duyệt |
| `.sdd/specs/feat-notification-management/TASKS.md` | Kích hoạt task FE10-I13 và ghi trạng thái gate |
| `database/migrations/2026-08-03-fe10-unicode-repair.sql` | Repair lũy đẳng template/history FE10 với exact Unicode assertions |
| `backend/tests/notificationRepository.test.js` | Regression contract cho migration Unicode |
| `.github/workflows/deploy-staging.yml` | Exact-head/hash gate và packaging migration mới |
| `tests/deployment/stagingWorkflowPolicy.test.js` | Regression contract cho workflow, runbook và UTF-8 `sqlcmd` |
| `docs/deployment/azure-staging-guide.md` | Operator order, `-f 65001`, verification, firewall cleanup |
| `.sdd/specs/feat-notification-management/CHANGELOG.md` | Closeout evidence sau staging |
| `C:\Users\admin\AppData\Local\Temp\lms-staging-unicode-repair-20260803.js` | Operator script tạm; tạo bằng `apply_patch`, chạy rồi xóa; không thuộc Git |

---

### Task 1: Activate FE10-I13 and commit the approved plan

**Files:**
- Create: `docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md:866`

**Interfaces:**
- Consumes: approved design `docs/superpowers/specs/2026-08-03-staging-unicode-data-repair-design.md`.
- Produces: task ID `FE10-I13` as the traceable boundary for migration, deployment guard and staging repair.

- [ ] **Step 1: Append the active task immediately after FE10-I12**

```markdown
- [ ] **FE10-I13 - Sửa dữ liệu Unicode staging và ngăn migration FE10 tái diễn lỗi encoding.**
  - Trạng thái: KẾ HOẠCH ĐÃ DUYỆT - CHỜ TRIỂN KHAI/H2/H3/STAGING.
  - Ánh xạ tới: BR-FE10-010/014/015/018, FR-FE10-017/019,
    AC-FE10-017/019.
  - Tệp: migration repair FE10, workflow/runbook staging, kiểm thử migration/deployment,
    TASKS/CHANGELOG FE10.
  - Tiêu chí hoàn thành: bốn template và notification history FE07 được lưu đúng Unicode;
    migration chạy hai lần an toàn; mọi lệnh `sqlcmd` dùng UTF-8 code page 65001; Books 34-40
    và BookCopies 60-64 staging được sửa bằng exact preimage guards; SQL/API/browser checks đạt;
    temporary firewall rule đã được xóa.
  - Thiết kế: `docs/superpowers/specs/2026-08-03-staging-unicode-data-repair-design.md`.
  - Kế hoạch: `docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md`.
```

- [ ] **Step 2: Verify the docs-only activation diff**

Run:

```powershell
git diff --check
git diff -- docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md `
  .sdd/specs/feat-notification-management/TASKS.md
```

Expected: no whitespace errors; only the plan and FE10-I13 activation appear.

- [ ] **Step 3: Commit the approved docs-only activation**

```powershell
git add -- docs/superpowers/plans/2026-08-03-staging-unicode-data-repair.md `
  .sdd/specs/feat-notification-management/TASKS.md
git commit -m "docs: plan FE10 Unicode repair"
```

Expected: one docs-only commit on `fix/borrowing-notification-ui`.

---

### Task 2: Add the FE10 Unicode repair migration with RED-GREEN evidence

**Files:**
- Create: `database/migrations/2026-08-03-fe10-unicode-repair.sql`
- Modify: `backend/tests/notificationRepository.test.js`

**Interfaces:**
- Consumes: canonical values from `database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`.
- Produces: idempotent SQL migration that repairs `NotificationTemplates` and matching FE07 `Notifications` rows, with exact-value assertions.

- [ ] **Step 1: Append the failing migration contract test**

```js
test('FE10 Unicode repair migration is exact, transactional, scoped, and repeatable', () => {
  const root = path.join(__dirname, '..', '..');
  const migrationPath = path.join(
    root,
    'database',
    'migrations',
    '2026-08-03-fe10-unicode-repair.sql'
  );
  const migration = fs.readFileSync(migrationPath, 'utf8');

  expect(migration).toMatch(/SET XACT_ABORT ON/i);
  expect(migration).toMatch(/BEGIN TRANSACTION/i);
  expect(migration).toMatch(/COMMIT TRANSACTION/i);
  expect(migration).toMatch(/ROLLBACK TRANSACTION/i);
  expect(migration).toMatch(/THROW/i);
  expect(migration).toMatch(/UPDATE dbo\.NotificationTemplates/i);
  expect(migration).toMatch(/UPDATE n[\s\S]*FROM dbo\.Notifications AS n/i);
  expect(migration).toMatch(/n\.SourceFeature = 'FE07'/i);
  expect(migration).toMatch(/n\.TemplateKey IN \([\s\S]*BORROW_REQUEST_APPROVED[\s\S]*BORROW_REQUEST_REJECTED[\s\S]*BORROW_RENEWED[\s\S]*BORROW_RETURNED/i);
  expect(migration).toMatch(/Latin1_General_100_BIN2/i);
  expect(migration).not.toMatch(/\bDELETE\b/i);

  for (const text of [
    "N'Yêu cầu mượn đã được duyệt'",
    "N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.'",
    "N'Yêu cầu mượn đã bị từ chối'",
    "N'Khoản mượn đã được gia hạn'",
    "N'Đã ghi nhận trả sách'",
    "N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.'",
    "N'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t'",
    "N'Khoáº£n mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n'",
    "N'ÄÃ£ ghi nháº­n tráº£ sÃ¡ch'",
  ]) {
    expect(migration).toContain(text);
  }
});
```

- [ ] **Step 2: Run the focused test and capture RED**

Run:

```powershell
npm test -- --runInBand --runTestsByPath tests/notificationRepository.test.js
```

Expected: FAIL because `2026-08-03-fe10-unicode-repair.sql` does not exist.

- [ ] **Step 3: Create the minimal migration**

```sql
SET XACT_ABORT ON;

BEGIN TRY
    BEGIN TRANSACTION;

    DECLARE @ExpectedTemplates TABLE (
        TemplateCode NVARCHAR(100) PRIMARY KEY,
        Subject NVARCHAR(255) NOT NULL,
        Body NVARCHAR(MAX) NOT NULL,
        BadSubject NVARCHAR(255) NOT NULL
    );

    INSERT INTO @ExpectedTemplates (TemplateCode, Subject, Body, BadSubject)
    VALUES
        (
            N'BORROW_REQUEST_APPROVED',
            N'Yêu cầu mượn đã được duyệt',
            N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.',
            N'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t'
        ),
        (
            N'BORROW_REQUEST_REJECTED',
            N'Yêu cầu mượn đã bị từ chối',
            N'Yêu cầu mượn #{{requestId}} đã bị từ chối.',
            N'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ bá»‹ tá»« chá»‘i'
        ),
        (
            N'BORROW_RENEWED',
            N'Khoản mượn đã được gia hạn',
            N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.',
            N'Khoáº£n mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n'
        ),
        (
            N'BORROW_RETURNED',
            N'Đã ghi nhận trả sách',
            N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.',
            N'ÄÃ£ ghi nháº­n tráº£ sÃ¡ch'
        );

    UPDATE nt
    SET Subject = expected.Subject,
        Body = expected.Body,
        Status = N'ACTIVE',
        UpdatedAt = GETDATE()
    FROM dbo.NotificationTemplates AS nt
    INNER JOIN @ExpectedTemplates AS expected
        ON expected.TemplateCode = nt.TemplateCode
    WHERE nt.Subject COLLATE Latin1_General_100_BIN2
              <> expected.Subject COLLATE Latin1_General_100_BIN2
       OR nt.Body COLLATE Latin1_General_100_BIN2
              <> expected.Body COLLATE Latin1_General_100_BIN2
       OR nt.Status <> N'ACTIVE';

    INSERT INTO dbo.NotificationTemplates (TemplateCode, Subject, Body, Status)
    SELECT expected.TemplateCode, expected.Subject, expected.Body, N'ACTIVE'
    FROM @ExpectedTemplates AS expected
    WHERE NOT EXISTS (
        SELECT 1
        FROM dbo.NotificationTemplates AS nt
        WHERE nt.TemplateCode = expected.TemplateCode
    );

    UPDATE n
    SET Title = CASE
            WHEN n.Title COLLATE Latin1_General_100_BIN2
                 = expected.BadSubject COLLATE Latin1_General_100_BIN2
            THEN expected.Subject
            ELSE n.Title
        END,
        Body = CASE n.TemplateKey
            WHEN N'BORROW_REQUEST_APPROVED' THEN
                REPLACE(
                    REPLACE(n.Body,
                        N'YÃªu cáº§u mÆ°á»£n #',
                        N'Yêu cầu mượn #'),
                    N' Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t. Háº¡n tráº£: ',
                    N' đã được duyệt. Hạn trả: '
                )
            WHEN N'BORROW_REQUEST_REJECTED' THEN
                REPLACE(
                    REPLACE(n.Body,
                        N'YÃªu cáº§u mÆ°á»£n #',
                        N'Yêu cầu mượn #'),
                    N' Ä‘Ã£ bá»‹ tá»« chá»‘i.',
                    N' đã bị từ chối.'
                )
            WHEN N'BORROW_RENEWED' THEN
                REPLACE(
                    REPLACE(n.Body,
                        N'Khoáº£n mÆ°á»£n #',
                        N'Khoản mượn #'),
                    N' Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n Ä‘áº¿n ',
                    N' đã được gia hạn đến '
                )
            WHEN N'BORROW_RETURNED' THEN
                REPLACE(
                    REPLACE(n.Body,
                        N'Khoáº£n mÆ°á»£n #',
                        N'Khoản mượn #'),
                    N' Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n tráº£ vá»›i tráº¡ng thÃ¡i ',
                    N' đã được ghi nhận trả với trạng thái '
                )
            ELSE n.Body
        END
    FROM dbo.Notifications AS n
    INNER JOIN @ExpectedTemplates AS expected
        ON expected.TemplateCode = n.TemplateKey
    WHERE n.SourceFeature = 'FE07'
      AND n.TemplateKey IN (
          N'BORROW_REQUEST_APPROVED',
          N'BORROW_REQUEST_REJECTED',
          N'BORROW_RENEWED',
          N'BORROW_RETURNED'
      )
      AND (
          n.Title COLLATE Latin1_General_100_BIN2
              = expected.BadSubject COLLATE Latin1_General_100_BIN2
          OR CHARINDEX(N'YÃªu cáº§u mÆ°á»£n #', n.Body) > 0
          OR CHARINDEX(N'Khoáº£n mÆ°á»£n #', n.Body) > 0
          OR CHARINDEX(N'Ä‘Ã£', n.Body) > 0
          OR CHARINDEX(N'Háº¡n tráº£', n.Body) > 0
      );

    IF EXISTS (
        SELECT 1
        FROM @ExpectedTemplates AS expected
        LEFT JOIN dbo.NotificationTemplates AS nt
            ON nt.TemplateCode = expected.TemplateCode
        WHERE nt.TemplateId IS NULL
           OR nt.Subject COLLATE Latin1_General_100_BIN2
                <> expected.Subject COLLATE Latin1_General_100_BIN2
           OR nt.Body COLLATE Latin1_General_100_BIN2
                <> expected.Body COLLATE Latin1_General_100_BIN2
           OR nt.Status <> N'ACTIVE'
    )
        THROW 51031, 'FE10 Unicode template verification failed.', 1;

    IF EXISTS (
        SELECT 1
        FROM dbo.Notifications AS n
        WHERE n.SourceFeature = 'FE07'
          AND n.TemplateKey IN (
              N'BORROW_REQUEST_APPROVED',
              N'BORROW_REQUEST_REJECTED',
              N'BORROW_RENEWED',
              N'BORROW_RETURNED'
          )
          AND (
              CHARINDEX(N'YÃªu cáº§u mÆ°á»£n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'Khoáº£n mÆ°á»£n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'ÄÃ£ ghi nháº­n', COALESCE(n.Title, N'')) > 0
              OR CHARINDEX(N'YÃªu cáº§u mÆ°á»£n #', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Khoáº£n mÆ°á»£n #', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Ä‘Ã£', COALESCE(n.Body, N'')) > 0
              OR CHARINDEX(N'Háº¡n tráº£', COALESCE(n.Body, N'')) > 0
          )
    )
        THROW 51032, 'FE10 Unicode notification verification failed.', 1;

    COMMIT TRANSACTION;
END TRY
BEGIN CATCH
    IF XACT_STATE() <> 0
        ROLLBACK TRANSACTION;

    THROW;
END CATCH;
```

- [ ] **Step 4: Run the focused test and capture GREEN**

Run:

```powershell
npm test -- --runInBand --runTestsByPath tests/notificationRepository.test.js
```

Expected: 8 tests pass, 0 fail.

- [ ] **Step 5: Preserve the uncommitted GREEN diff for H2**

Run:

```powershell
git diff --check
git status --short
```

Expected: migration and test are modified/untracked; do not commit yet.

---

### Task 3: Make staging deployment and the runbook UTF-8 safe

**Files:**
- Modify: `.github/workflows/deploy-staging.yml`
- Modify: `tests/deployment/stagingWorkflowPolicy.test.js`
- Modify: `docs/deployment/azure-staging-guide.md:229`

**Interfaces:**
- Consumes: `database/migrations/2026-08-03-fe10-unicode-repair.sql`.
- Produces: workflow input `fe10_unicode_repair_confirmed`, environment variable `FE10_UNICODE_REPAIR_SHA256`, exact-head migration proof and documented `sqlcmd -f 65001` execution.

- [ ] **Step 1: Extend deployment policy tests first**

Add the following assertions:

```js
assert.match(
  workflow,
  /Copy-Item [^\r\n]*database\/migrations\/2026-08-03-fe10-unicode-repair\.sql[^\r\n]*deploy\/backend\/database\/migrations\//
);

assert.match(workflow, /fe10_unicode_repair_confirmed:/);
assert.match(workflow, /FE10_UNICODE_REPAIR_SHA256/);
assert.match(
  workflow,
  /\$unicodeRepairMigrationPath[\s\S]*?2026-08-03-fe10-unicode-repair\.sql/
);
assert.match(
  workflow,
  /UNICODE_REPAIR_MANUAL_CONFIRMATION[\s\S]*?fe10_unicode_repair_confirmed/
);

assert.match(guide, /2026-08-03-fe10-unicode-repair\.sql/);
const sqlcmdLines = guide
  .split(/\r?\n/)
  .filter((line) => /\bsqlcmd\b/.test(line));
assert.ok(sqlcmdLines.length >= 2);
for (const line of sqlcmdLines) {
  assert.match(line, /-b\b/);
  assert.match(line, /-f\s+65001\b/);
}
assert.match(guide, /Latin1_General_100_BIN2/);
assert.match(guide, /FE10_UNICODE_REPAIR_SHA256/);
```

- [ ] **Step 2: Run deployment tests and capture RED**

Run:

```powershell
npm run test:deployment
```

Expected: the workflow/runbook tests fail because the new gate, migration packaging and `-f 65001` are absent.

- [ ] **Step 3: Add the workflow input and proof step**

Add under `workflow_dispatch.inputs`:

```yaml
      fe10_unicode_repair_confirmed:
        description: FE10 Unicode repair migration was applied twice and exact values were verified on staging
        required: true
        default: false
        type: boolean
```

Add a third preflight step using the same LF/CRLF hash contract:

```yaml
      - name: Verify FE10 Unicode repair migration gate
        shell: pwsh
        env:
          EVENT_NAME: ${{ github.event_name }}
          UNICODE_REPAIR_MANUAL_CONFIRMATION: ${{ inputs.fe10_unicode_repair_confirmed }}
          EXPECTED_UNICODE_REPAIR_SHA256: ${{ vars.FE10_UNICODE_REPAIR_SHA256 }}
        run: |
          if (
            $env:EVENT_NAME -eq 'workflow_dispatch' -and
            "$env:UNICODE_REPAIR_MANUAL_CONFIRMATION".ToLowerInvariant() -ne 'true'
          ) {
            Write-Error 'Apply the FE10 Unicode repair migration twice and verify exact values before manual deployment.'
            exit 1
          }

          $expectedUnicodeRepairHash = "$env:EXPECTED_UNICODE_REPAIR_SHA256".Trim().ToLowerInvariant()
          if ($expectedUnicodeRepairHash -notmatch '^[0-9a-f]{64}$') {
            Write-Error 'The staging FE10 Unicode repair migration proof is missing or malformed.'
            exit 1
          }

          $unicodeRepairMigrationPath = 'database/migrations/2026-08-03-fe10-unicode-repair.sql'
          $utf8NoBom = [Text.UTF8Encoding]::new($false, $true)
          $unicodeRepairMigrationText = [IO.File]::ReadAllText(
            $unicodeRepairMigrationPath,
            $utf8NoBom
          )
          $unicodeRepairLfText = $unicodeRepairMigrationText.Replace("`r`n", "`n").Replace("`r", "`n")
          $unicodeRepairCrlfText = $unicodeRepairLfText.Replace("`n", "`r`n")
          $unicodeRepairLfHash = [Convert]::ToHexString(
            [Security.Cryptography.SHA256]::HashData(
              $utf8NoBom.GetBytes($unicodeRepairLfText)
            )
          ).ToLowerInvariant()
          $unicodeRepairCrlfHash = [Convert]::ToHexString(
            [Security.Cryptography.SHA256]::HashData(
              $utf8NoBom.GetBytes($unicodeRepairCrlfText)
            )
          ).ToLowerInvariant()
          if ($expectedUnicodeRepairHash -notin @(
            $unicodeRepairLfHash,
            $unicodeRepairCrlfHash
          )) {
            Write-Error 'The reviewed FE10 Unicode repair migration does not match the staging proof.'
            exit 1
          }

          Write-Output 'FE10 Unicode repair migration proof accepted for the exact deployment head and LF/CRLF rendering.'
```

Append the new migration to the existing deployment package `Copy-Item` list.

- [ ] **Step 4: Update the operator guide**

Replace the FE10 migration loop with:

```powershell
$fe10InboxMigration = Resolve-Path 'database/migrations/2026-07-27-fe10-personal-inbox-read-state.sql'
$fe10ResultTemplatesMigration = Resolve-Path 'database/migrations/2026-07-29-fe10-borrowing-result-templates.sql'
$fe10UnicodeRepairMigration = Resolve-Path 'database/migrations/2026-08-03-fe10-unicode-repair.sql'

foreach ($fe10Migration in @(
  $fe10InboxMigration,
  $fe10ResultTemplatesMigration,
  $fe10UnicodeRepairMigration
)) {
  sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE -b -f 65001 `
    -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -i $fe10Migration
  if ($LASTEXITCODE -ne 0) { throw "Migration failed: $fe10Migration" }

  sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE -b -f 65001 `
    -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -i $fe10Migration
  if ($LASTEXITCODE -ne 0) { throw "Idempotence check failed: $fe10Migration" }
}
```

Add this exact-value verification query to the guide:

```sql
WITH Expected (TemplateCode, Subject, Body) AS (
    SELECT N'BORROW_REQUEST_APPROVED', N'Yêu cầu mượn đã được duyệt',
           N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.'
    UNION ALL
    SELECT N'BORROW_REQUEST_REJECTED', N'Yêu cầu mượn đã bị từ chối',
           N'Yêu cầu mượn #{{requestId}} đã bị từ chối.'
    UNION ALL
    SELECT N'BORROW_RENEWED', N'Khoản mượn đã được gia hạn',
           N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.'
    UNION ALL
    SELECT N'BORROW_RETURNED', N'Đã ghi nhận trả sách',
           N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.'
)
SELECT expected.TemplateCode
FROM Expected AS expected
LEFT JOIN dbo.NotificationTemplates AS actual
    ON actual.TemplateCode = expected.TemplateCode
WHERE actual.TemplateId IS NULL
   OR actual.Subject COLLATE Latin1_General_100_BIN2
        <> expected.Subject COLLATE Latin1_General_100_BIN2
   OR actual.Body COLLATE Latin1_General_100_BIN2
        <> expected.Body COLLATE Latin1_General_100_BIN2
   OR actual.Status <> N'ACTIVE';
```

Expected: zero rows.

- [ ] **Step 5: Run deployment tests and capture GREEN**

Run:

```powershell
npm run test:deployment
```

Expected: 20 tests pass, 0 fail unless the new assertions increase the count; all tests must pass.

- [ ] **Step 6: Preserve the uncommitted GREEN diff for H2**

```powershell
git diff --check
git status --short
```

Expected: implementation files remain uncommitted.

---

### Task 4: Run local verification and obtain H2 before implementation commit

**Files:**
- Review all files changed by Tasks 2-3.
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`

**Interfaces:**
- Consumes: complete uncommitted implementation diff.
- Produces: H2-approved commit set ready for push/PR.

- [ ] **Step 1: Run focused and full verification**

```powershell
npm --prefix backend test -- --runInBand --runTestsByPath tests/notificationRepository.test.js
npm run test:deployment
npm --prefix backend test
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm run test:traceability-state
npm run trace:enforce
npm run test:secrets
git diff --check
```

Expected: every command exits 0. Record exact suite/test counts without extrapolating from earlier runs.

- [ ] **Step 2: Review the exact diff and secret boundary**

```powershell
git diff --stat
git diff -- database/migrations/2026-08-03-fe10-unicode-repair.sql `
  backend/tests/notificationRepository.test.js `
  .github/workflows/deploy-staging.yml `
  tests/deployment/stagingWorkflowPolicy.test.js `
  docs/deployment/azure-staging-guide.md `
  .sdd/specs/feat-notification-management/TASKS.md
```

Check line by line:

- no frontend source changes;
- no secret or real PII;
- no `DELETE`;
- every notification update is FE07 + allowlisted TemplateKey;
- migration exact-value assertions occur before commit;
- workflow packages and hash-gates the exact new file;
- every documented `sqlcmd` migration line contains `-b -f 65001`.

- [ ] **Step 3: Ask for H2 on the complete local implementation diff**

Do not commit until the user approves the displayed diff and verification evidence.

- [ ] **Step 4: Mark local implementation evidence after H2**

Change the FE10-I13 status line to:

```markdown
  - Trạng thái: H2 ĐÃ DUYỆT - CHỜ COMMIT/PR/CI/H3/STAGING.
```

- [ ] **Step 5: Commit the H2-approved implementation**

```powershell
git add -- database/migrations/2026-08-03-fe10-unicode-repair.sql `
  backend/tests/notificationRepository.test.js `
  .github/workflows/deploy-staging.yml `
  tests/deployment/stagingWorkflowPolicy.test.js `
  docs/deployment/azure-staging-guide.md `
  .sdd/specs/feat-notification-management/TASKS.md
git diff --cached --check
git commit -m "fix: repair FE10 Unicode persistence"
```

Expected: one H2-reviewed implementation commit; worktree clean.

---

### Task 5: Publish the implementation PR and complete H3 integration

**Files:**
- No new product files unless CI exposes a deterministic defect in the approved scope.

**Interfaces:**
- Consumes: docs activation commit and H2-approved implementation commit.
- Produces: merged `main` SHA whose exact migration is authorized for staging.

- [ ] **Step 1: Rebase safety check without rewriting dirty checkout work**

```powershell
git fetch origin main
git merge-base --is-ancestor origin/main HEAD
if ($LASTEXITCODE -ne 0) {
  throw 'origin/main advanced after H2; stop and repeat verification plus H2 on the updated branch.'
}
git status --short --branch
```

Expected: branch contains current `origin/main` or is updated through a non-destructive reviewed merge/rebase in this clean worktree only.

- [ ] **Step 2: Push the branch and open a PR**

```powershell
git push -u origin fix/borrowing-notification-ui
gh pr create --base main --head fix/borrowing-notification-ui `
  --title "fix: repair staging Unicode persistence" `
  --body-file docs/superpowers/specs/2026-08-03-staging-unicode-data-repair-design.md
```

PR description must additionally list FE10-I13, RED/GREEN evidence, migration order, no-frontend-change decision and the expected post-merge staging mutation.

- [ ] **Step 3: Monitor exact PR checks**

```powershell
gh pr checks --watch
gh pr view --json number,url,headRefOid,mergeStateStatus,reviewDecision,statusCheckRollup
```

Expected: required checks pass for the exact `headRefOid`; no unresolved review thread.

- [ ] **Step 4: Perform H3 review and request merge approval**

Review spec conformance, migration scope, SQL idempotence, workflow gate and CI. Do not merge without explicit H3 approval.

- [ ] **Step 5: Merge and verify exact main SHA**

```powershell
gh pr merge --squash --delete-branch=false
git fetch origin main
git log -1 --oneline origin/main
```

Expected: PR merged; record merge SHA. Monitor exact post-merge CI before staging mutation.

---

### Task 6: Repair Azure staging data and run the UTF-8 migration twice

**Files:**
- Create temporarily: `C:\Users\admin\AppData\Local\Temp\lms-staging-unicode-repair-20260803.js`
- Execute from merged `origin/main`: `database/migrations/2026-08-03-fe10-unicode-repair.sql`
- Delete temporary script after verification.

**Interfaces:**
- Consumes: exact merged migration and App Service SQL settings loaded only into process environment.
- Produces: corrected Books 34-40, BookCopies 60-64, four FE10 templates and exactly 17 currently corrupted historical notifications; no other persisted fields change.

- [ ] **Step 1: Create a clean post-merge staging worktree or fast-forward this clean worktree**

```powershell
git fetch origin main
git switch --detach origin/main
git rev-parse HEAD
```

Expected: HEAD equals the recorded merge SHA. Do not switch or modify the dirty root checkout.

- [ ] **Step 2: Load SQL settings without printing values**

```powershell
$settings = az webapp config appsettings list `
  --resource-group rg-library-staging `
  --name app-library-api-staging-nhat714 `
  --output json | ConvertFrom-Json

$env:DB_SERVER = ($settings | Where-Object name -eq 'DB_SERVER').value
$env:DB_NAME = ($settings | Where-Object name -eq 'DB_NAME').value
$env:DB_USER = ($settings | Where-Object name -eq 'DB_USER').value
$env:DB_PASSWORD = ($settings | Where-Object name -eq 'DB_PASSWORD').value
$env:DB_PORT = '1433'
$env:DB_ENCRYPT = 'true'
$env:DB_TRUST_SERVER_CERTIFICATE = 'false'
$env:UNICODE_REPAIR_ENVIRONMENT = 'staging'

if ($env:DB_SERVER -ne 'sql-library-staging-ea-nhat714.database.windows.net') {
  throw 'Unexpected SQL server.'
}
if ($env:DB_NAME -ne 'LibraryManagementStaging') {
  throw 'Unexpected SQL database.'
}
if (-not $env:DB_USER -or -not $env:DB_PASSWORD) {
  throw 'Missing SQL operator credentials.'
}
```

- [ ] **Step 3: Add one exact-IP temporary firewall rule**

```powershell
$repairRule = 'codex-unicode-repair-20260803'
$operatorIp = (Invoke-RestMethod -Uri 'https://api.ipify.org').Trim()
if ($operatorIp -notmatch '^\d{1,3}(\.\d{1,3}){3}$') {
  throw 'Public IPv4 resolution failed.'
}

az sql server firewall-rule create `
  --resource-group rg-library-staging `
  --server sql-library-staging-ea-nhat714 `
  --name $repairRule `
  --start-ip-address $operatorIp `
  --end-ip-address $operatorIp `
  --output none
```

- [ ] **Step 4: Create the temporary parameterized repair script using `apply_patch`**

The script must contain these exact repair manifests:

```js
const BOOK_REPAIRS = [
  [34, '─Éß║ºu s├ích dß╗» liß╗çu staging d├╣ng ─æß╗â kiß╗âm thß╗¡ luß╗ông tß║ío v├á duyß╗çt y├¬u cß║ºu m╞░ß╗ún FE07.', 'Đầu sách dữ liệu staging dùng để kiểm thử luồng tạo và duyệt yêu cầu mượn FE07.'],
  [35, '─Éß║ºu s├ích dß╗» liß╗çu staging d├╣ng ─æß╗â kiß╗âm thß╗¡ khß║ú dß╗Ñng bß║ún sao v├á y├¬u cß║ºu m╞░ß╗ún c├│ metadata ─æß║ºy ─æß╗º.', 'Đầu sách dữ liệu staging dùng để kiểm thử khả dụng bản sao và yêu cầu mượn có metadata đầy đủ.'],
  [36, 'H╞░ß╗¢ng dß║½n tß╗ò chß╗⌐c kiß║┐n tr├║c phß║ºn mß╗üm dß╗à kiß╗âm thß╗¡, bß║úo tr├¼ v├á ─æß╗Öc lß║¡p vß╗¢i framework.', 'Hướng dẫn tổ chức kiến trúc phần mềm dễ kiểm thử, bảo trì và độc lập với framework.'],
  [37, 'Tß╗òng hß╗úp nguy├¬n l├╜ Agile, SOLID, design pattern v├á v├¡ dß╗Ñ ph├ít triß╗ân phß║ºn mß╗üm h╞░ß╗¢ng ─æß╗æi t╞░ß╗úng.', 'Tổng hợp nguyên lý Agile, SOLID, design pattern và ví dụ phát triển phần mềm hướng đối tượng.'],
  [38, 'T├ái liß╗çu c├┤ ─æß╗ìng vß╗ü UML v├á c├ích sß╗¡ dß╗Ñng s╞í ─æß╗ô trong ph├ón t├¡ch thiß║┐t kß║┐ phß║ºn mß╗üm.', 'Tài liệu cô đọng về UML và cách sử dụng sơ đồ trong phân tích thiết kế phần mềm.'],
  [39, 'Tiß╗âu thuyß║┐t ngß╗Ñ ng├┤n ch├¡nh trß╗ï kinh ─æiß╗ân vß╗ü quyß╗ün lß╗▒c, l├╜ t╞░ß╗ƒng v├á sß╗▒ tha h├│a.', 'Tiểu thuyết ngụ ngôn chính trị kinh điển về quyền lực, lý tưởng và sự tha hóa.'],
  [40, 'Ph├ón t├¡ch c├ích x├óy dß╗▒ng tr├¡ tuß╗ç nh├ón tß║ío ph├╣ hß╗úp vß╗¢i gi├í trß╗ï v├á lß╗úi ├¡ch cß╗ºa con ng╞░ß╗¥i.', 'Phân tích cách xây dựng trí tuệ nhân tạo phù hợp với giá trị và lợi ích của con người.'],
];

const COPY_REPAIRS = [
  [60, 'Kß╗ç demo A1', 'Kệ demo A1'],
  [61, 'Kß╗ç demo A2', 'Kệ demo A2'],
  [62, 'Kß╗ç demo A3', 'Kệ demo A3'],
  [63, 'Kß╗ç demo B1', 'Kệ demo B1'],
  [64, 'Kß╗ç demo C1', 'Kệ demo C1'],
];
```

Use this complete transaction skeleton around those arrays:

```js
const sql = require(process.env.MSSQL_MODULE_PATH);

if (process.env.UNICODE_REPAIR_ENVIRONMENT !== 'staging') {
  throw new Error('UNICODE_REPAIR_ENVIRONMENT must equal staging.');
}
if (process.env.DB_SERVER !== 'sql-library-staging-ea-nhat714.database.windows.net') {
  throw new Error('Unexpected SQL server.');
}
if (process.env.DB_NAME !== 'LibraryManagementStaging') {
  throw new Error('Unexpected SQL database.');
}

const config = {
  server: process.env.DB_SERVER,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  port: Number(process.env.DB_PORT || 1433),
  options: { encrypt: true, trustServerCertificate: false },
  connectionTimeout: 60000,
  requestTimeout: 60000,
};

const TEMPLATE_REPAIRS = {
  BORROW_REQUEST_APPROVED: {
    badSubject: 'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t',
    subject: 'Yêu cầu mượn đã được duyệt',
    badBody: 'YÃªu cáº§u mÆ°á»£n #{{requestId}} Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t. Háº¡n tráº£: {{dueDate}}.',
    body: 'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.',
  },
  BORROW_REQUEST_REJECTED: {
    badSubject: 'YÃªu cáº§u mÆ°á»£n Ä‘Ã£ bá»‹ tá»« chá»‘i',
    subject: 'Yêu cầu mượn đã bị từ chối',
    badBody: 'YÃªu cáº§u mÆ°á»£n #{{requestId}} Ä‘Ã£ bá»‹ tá»« chá»‘i.',
    body: 'Yêu cầu mượn #{{requestId}} đã bị từ chối.',
  },
  BORROW_RENEWED: {
    badSubject: 'Khoáº£n mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n',
    subject: 'Khoản mượn đã được gia hạn',
    badBody: 'Khoáº£n mÆ°á»£n #{{borrowDetailId}} Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n Ä‘áº¿n {{dueDate}}.',
    body: 'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.',
  },
  BORROW_RETURNED: {
    badSubject: 'ÄÃ£ ghi nháº­n tráº£ sÃ¡ch',
    subject: 'Đã ghi nhận trả sách',
    badBody: 'Khoáº£n mÆ°á»£n #{{borrowDetailId}} Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n tráº£ vá»›i tráº¡ng thÃ¡i {{returnStatus}}.',
    body: 'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.',
  },
};

async function guardedUpdate(transaction, { table, idColumn, id, valueColumn, bad, good }) {
  const read = await new sql.Request(transaction)
    .input('Id', sql.Int, id)
    .query(`SELECT ${valueColumn} AS CurrentValue FROM dbo.${table} WITH (UPDLOCK, HOLDLOCK) WHERE ${idColumn} = @Id`);
  if (read.recordset.length !== 1) throw new Error(`${table} ${id} is missing.`);
  const current = read.recordset[0].CurrentValue;
  if (current === good) return false;
  if (current !== bad) throw new Error(`${table} ${id} preimage drifted.`);

  const write = await new sql.Request(transaction)
    .input('Id', sql.Int, id)
    .input('Bad', sql.NVarChar(sql.MAX), bad)
    .input('Good', sql.NVarChar(sql.MAX), good)
    .query(`
      UPDATE dbo.${table}
      SET ${valueColumn} = @Good
      WHERE ${idColumn} = @Id AND ${valueColumn} = @Bad;
      SELECT @@ROWCOUNT AS Affected;
    `);
  if (write.recordset[0].Affected !== 1) throw new Error(`${table} ${id} update lost its guard.`);

  const verify = await new sql.Request(transaction)
    .input('Id', sql.Int, id)
    .query(`SELECT ${valueColumn} AS CurrentValue FROM dbo.${table} WHERE ${idColumn} = @Id`);
  if (verify.recordset[0].CurrentValue !== good) {
    throw new Error(`${table} ${id} verification failed.`);
  }
  return true;
}

const BODY_REPAIRS = {
  BORROW_REQUEST_APPROVED: [
    ['YÃªu cáº§u mÆ°á»£n #', 'Yêu cầu mượn #'],
    [' Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t. Háº¡n tráº£: ', ' đã được duyệt. Hạn trả: '],
  ],
  BORROW_REQUEST_REJECTED: [
    ['YÃªu cáº§u mÆ°á»£n #', 'Yêu cầu mượn #'],
    [' Ä‘Ã£ bá»‹ tá»« chá»‘i.', ' đã bị từ chối.'],
  ],
  BORROW_RENEWED: [
    ['Khoáº£n mÆ°á»£n #', 'Khoản mượn #'],
    [' Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n Ä‘áº¿n ', ' đã được gia hạn đến '],
  ],
  BORROW_RETURNED: [
    ['Khoáº£n mÆ°á»£n #', 'Khoản mượn #'],
    [' Ä‘Ã£ Ä‘Æ°á»£c ghi nháº­n tráº£ vá»›i tráº¡ng thÃ¡i ', ' đã được ghi nhận trả với trạng thái '],
  ],
};

const SUBJECT_REPAIRS = {
  BORROW_REQUEST_APPROVED: ['YÃªu cáº§u mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c duyá»‡t', 'Yêu cầu mượn đã được duyệt'],
  BORROW_REQUEST_REJECTED: ['YÃªu cáº§u mÆ°á»£n Ä‘Ã£ bá»‹ tá»« chá»‘i', 'Yêu cầu mượn đã bị từ chối'],
  BORROW_RENEWED: ['Khoáº£n mÆ°á»£n Ä‘Ã£ Ä‘Æ°á»£c gia háº¡n', 'Khoản mượn đã được gia hạn'],
  BORROW_RETURNED: ['ÄÃ£ ghi nháº­n tráº£ sÃ¡ch', 'Đã ghi nhận trả sách'],
};

function repairBody(templateKey, body) {
  return (BODY_REPAIRS[templateKey] || []).reduce(
    (value, [bad, good]) => value.split(bad).join(good),
    body
  );
}

async function main() {
  const pool = await sql.connect(config);
  const transaction = new sql.Transaction(pool);
  await transaction.begin(sql.ISOLATION_LEVEL.SERIALIZABLE);
  const changed = { books: [], copies: [], templates: [], notifications: [] };

  try {
    for (const [id, bad, good] of BOOK_REPAIRS) {
      if (await guardedUpdate(transaction, {
        table: 'Books', idColumn: 'BookId', id,
        valueColumn: 'Description', bad, good,
      })) changed.books.push(id);
    }

    for (const [id, bad, good] of COPY_REPAIRS) {
      if (await guardedUpdate(transaction, {
        table: 'BookCopies', idColumn: 'CopyId', id,
        valueColumn: 'Location', bad, good,
      })) changed.copies.push(id);
    }

    for (const [templateKey, repair] of Object.entries(TEMPLATE_REPAIRS)) {
      const read = await new sql.Request(transaction)
        .input('TemplateKey', sql.NVarChar(100), templateKey)
        .query(`
          SELECT Subject, Body, Status
          FROM dbo.NotificationTemplates WITH (UPDLOCK, HOLDLOCK)
          WHERE TemplateCode = @TemplateKey;
        `);
      if (read.recordset.length !== 1) {
        throw new Error(`Template ${templateKey} is missing or duplicated.`);
      }
      const current = read.recordset[0];
      const subjectAllowed = [repair.badSubject, repair.subject].includes(current.Subject);
      const bodyAllowed = [repair.badBody, repair.body].includes(current.Body);
      if (!subjectAllowed || !bodyAllowed || !['ACTIVE', 'INACTIVE'].includes(current.Status)) {
        throw new Error(`Template ${templateKey} preimage drifted.`);
      }
      if (current.Subject === repair.subject && current.Body === repair.body && current.Status === 'ACTIVE') {
        continue;
      }

      const write = await new sql.Request(transaction)
        .input('TemplateKey', sql.NVarChar(100), templateKey)
        .input('OldSubject', sql.NVarChar(255), current.Subject)
        .input('OldBody', sql.NVarChar(sql.MAX), current.Body)
        .input('OldStatus', sql.NVarChar(20), current.Status)
        .input('Subject', sql.NVarChar(255), repair.subject)
        .input('Body', sql.NVarChar(sql.MAX), repair.body)
        .query(`
          UPDATE dbo.NotificationTemplates
          SET Subject = @Subject, Body = @Body, Status = 'ACTIVE', UpdatedAt = GETDATE()
          WHERE TemplateCode = @TemplateKey
            AND Subject = @OldSubject
            AND Body = @OldBody
            AND Status = @OldStatus;
          SELECT @@ROWCOUNT AS Affected;
        `);
      if (write.recordset[0].Affected !== 1) {
        throw new Error(`Template ${templateKey} update lost its guard.`);
      }

      const verify = await new sql.Request(transaction)
        .input('TemplateKey', sql.NVarChar(100), templateKey)
        .query(`
          SELECT Subject, Body, Status
          FROM dbo.NotificationTemplates
          WHERE TemplateCode = @TemplateKey;
        `);
      if (
        verify.recordset[0].Subject !== repair.subject ||
        verify.recordset[0].Body !== repair.body ||
        verify.recordset[0].Status !== 'ACTIVE'
      ) {
        throw new Error(`Template ${templateKey} verification failed.`);
      }
      changed.templates.push(templateKey);
    }

    const notificationRead = await new sql.Request(transaction).query(`
      SELECT NotificationId, TemplateKey, Title, Body
      FROM dbo.Notifications WITH (UPDLOCK, HOLDLOCK)
      WHERE SourceFeature = 'FE07'
        AND TemplateKey IN (
          'BORROW_REQUEST_APPROVED',
          'BORROW_REQUEST_REJECTED',
          'BORROW_RENEWED',
          'BORROW_RETURNED'
        )
      ORDER BY NotificationId;
    `);

    for (const row of notificationRead.recordset) {
      if (typeof row.Title !== 'string' || typeof row.Body !== 'string') {
        throw new Error(`Notification ${row.NotificationId} has an unexpected null title/body.`);
      }
    }

    const badRows = notificationRead.recordset.filter((row) => {
      const [badSubject] = SUBJECT_REPAIRS[row.TemplateKey] || [];
      const bodyPairs = BODY_REPAIRS[row.TemplateKey] || [];
      return row.Title === badSubject || bodyPairs.some(([bad]) => row.Body.includes(bad));
    });

    if (![0, 17].includes(badRows.length)) {
      throw new Error(`Expected 17 or 0 corrupted FE07 notifications, found ${badRows.length}.`);
    }

    for (const row of badRows) {
      const [badSubject, goodSubject] = SUBJECT_REPAIRS[row.TemplateKey];
      const nextTitle = row.Title === badSubject ? goodSubject : row.Title;
      const nextBody = repairBody(row.TemplateKey, row.Body);
      if (nextTitle === row.Title && nextBody === row.Body) {
        throw new Error(`Notification ${row.NotificationId} matched but did not transform.`);
      }

      const write = await new sql.Request(transaction)
        .input('NotificationId', sql.Int, row.NotificationId)
        .input('OldTitle', sql.NVarChar(255), row.Title)
        .input('OldBody', sql.NVarChar(sql.MAX), row.Body)
        .input('Title', sql.NVarChar(255), nextTitle)
        .input('Body', sql.NVarChar(sql.MAX), nextBody)
        .query(`
          UPDATE dbo.Notifications
          SET Title = @Title, Body = @Body
          WHERE NotificationId = @NotificationId
            AND Title = @OldTitle
            AND Body = @OldBody;
          SELECT @@ROWCOUNT AS Affected;
        `);
      if (write.recordset[0].Affected !== 1) {
        throw new Error(`Notification ${row.NotificationId} update lost its guard.`);
      }

      const verify = await new sql.Request(transaction)
        .input('NotificationId', sql.Int, row.NotificationId)
        .query(`
          SELECT Title, Body
          FROM dbo.Notifications
          WHERE NotificationId = @NotificationId;
        `);
      if (verify.recordset[0].Title !== nextTitle || verify.recordset[0].Body !== nextBody) {
        throw new Error(`Notification ${row.NotificationId} verification failed.`);
      }
      changed.notifications.push(row.NotificationId);
    }

    await transaction.commit();
    process.stdout.write(`${JSON.stringify(changed)}\n`);
  } catch (error) {
    if (transaction._aborted !== true) await transaction.rollback();
    throw error;
  } finally {
    await pool.close();
  }
}

main().catch((error) => {
  process.stderr.write(`${error.message}\n`);
  process.exitCode = 1;
});
```

- [ ] **Step 5: Run the temporary repair script from `backend`**

```powershell
$env:MSSQL_MODULE_PATH = (Resolve-Path 'backend/node_modules/mssql').Path
node C:\Users\admin\AppData\Local\Temp\lms-staging-unicode-repair-20260803.js
if ($LASTEXITCODE -ne 0) { throw 'Staging Unicode data repair failed.' }
```

Expected first run: books `[34..40]`, copies `[60..64]`, four template keys, and 17 notification IDs reported. A legitimate idempotence rerun reports empty arrays.

- [ ] **Step 6: Apply the merged migration twice with UTF-8 input**

```powershell
$env:FE10_SQL_SERVER = $env:DB_SERVER
$env:FE10_SQL_DATABASE = $env:DB_NAME
$env:FE10_SQL_USER = $env:DB_USER
$env:FE10_SQL_PASSWORD = $env:DB_PASSWORD
$unicodeMigration = Resolve-Path 'database/migrations/2026-08-03-fe10-unicode-repair.sql'

1..2 | ForEach-Object {
  sqlcmd -S $env:FE10_SQL_SERVER -d $env:FE10_SQL_DATABASE -b -f 65001 `
    -U $env:FE10_SQL_USER -P $env:FE10_SQL_PASSWORD -i $unicodeMigration
  if ($LASTEXITCODE -ne 0) { throw "Unicode migration run $_ failed." }
}
```

Expected: both runs exit 0; the migration's exact Unicode assertions do not throw.

- [ ] **Step 7: Always remove and verify the temporary firewall rule**

Execute in `finally` regardless of Step 5/6 outcome:

```powershell
az sql server firewall-rule delete `
  --resource-group rg-library-staging `
  --server sql-library-staging-ea-nhat714 `
  --name $repairRule `
  --output none

$remainingRule = az sql server firewall-rule show `
  --resource-group rg-library-staging `
  --server sql-library-staging-ea-nhat714 `
  --name $repairRule `
  --query name -o tsv 2>$null
if ($LASTEXITCODE -eq 0 -or $remainingRule) {
  throw 'Temporary Unicode repair firewall rule still exists.'
}
```

- [ ] **Step 8: Remove the temporary script and clear secret environment variables**

```powershell
$tempRepairScript = 'C:\Users\admin\AppData\Local\Temp\lms-staging-unicode-repair-20260803.js'
if ((Resolve-Path -LiteralPath $tempRepairScript).Path -ne $tempRepairScript) {
  throw 'Unexpected temporary repair script path.'
}
Remove-Item -LiteralPath $tempRepairScript

Remove-Item Env:DB_PASSWORD,Env:FE10_SQL_PASSWORD,Env:MSSQL_MODULE_PATH -ErrorAction SilentlyContinue
```

- [ ] **Step 9: Set the non-secret migration hash and manually deploy exact main**

```powershell
$unicodeHash = (Get-FileHash `
  database/migrations/2026-08-03-fe10-unicode-repair.sql `
  -Algorithm SHA256).Hash.ToLowerInvariant()

gh variable set FE10_UNICODE_REPAIR_SHA256 --env staging --body $unicodeHash
gh workflow run deploy-staging.yml --ref main `
  -f fe10_inbox_migration_confirmed=true `
  -f fe10_borrowing_result_templates_confirmed=true `
  -f fe10_unicode_repair_confirmed=true
```

Expected: preflight accepts exact migration proof, then backend, frontend and smoke jobs pass.

---

### Task 7: Verify SQL/API/browser behavior and publish closeout evidence

**Files:**
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`

**Interfaces:**
- Consumes: successful staging repair, exact deployment run and merged main SHA.
- Produces: truthful FE10-I13 closeout with exact evidence; no claim broader than checked rows/routes.

- [ ] **Step 1: Verify public API descriptions exactly**

```powershell
$api = 'https://app-library-api-staging-nhat714.azurewebsites.net/api'
$expected = @{
  34 = 'Đầu sách dữ liệu staging dùng để kiểm thử luồng tạo và duyệt yêu cầu mượn FE07.'
  35 = 'Đầu sách dữ liệu staging dùng để kiểm thử khả dụng bản sao và yêu cầu mượn có metadata đầy đủ.'
  36 = 'Hướng dẫn tổ chức kiến trúc phần mềm dễ kiểm thử, bảo trì và độc lập với framework.'
  37 = 'Tổng hợp nguyên lý Agile, SOLID, design pattern và ví dụ phát triển phần mềm hướng đối tượng.'
  38 = 'Tài liệu cô đọng về UML và cách sử dụng sơ đồ trong phân tích thiết kế phần mềm.'
  39 = 'Tiểu thuyết ngụ ngôn chính trị kinh điển về quyền lực, lý tưởng và sự tha hóa.'
  40 = 'Phân tích cách xây dựng trí tuệ nhân tạo phù hợp với giá trị và lợi ích của con người.'
}

foreach ($bookId in 34..40) {
  $book = (Invoke-RestMethod -Uri "$api/books/$bookId" -TimeoutSec 30).book
  if ($book.description -cne $expected[$bookId]) {
    throw "Book $bookId description mismatch."
  }
}
```

Expected: no mismatch.

- [ ] **Step 2: Verify protected notification API using an existing authorized staging session**

Check `/notifications` for the affected member account and confirm the repaired approved/renewed/returned titles and bodies contain no `Ã`, `Ä`, `áº`, `mÆ°`, or CP437 box-drawing fragments. Do not log access tokens or response headers.

- [ ] **Step 3: Browser verification**

Use the staging frontend `https://www.thuvienhub.io.vn`:

1. Public catalog: open books 34-40 and verify Vietnamese descriptions.
2. Member `/borrowing/new`: verify titles/copy locations are readable where displayed.
3. Authenticated `/notifications`: verify approved, renewed and returned notifications.
4. Repeat at desktop and mobile viewport; no frontend source or font change is expected.

Expected: UI matches API exactly; no mojibake in the checked surfaces.

- [ ] **Step 4: Update FE10-I13 and CHANGELOG with exact evidence**

Set task status to:

```markdown
  - Trạng thái: HOÀN TẤT - H3/PR/CI/STAGING/UNICODE VERIFICATION ĐẠT.
```

Add a dated changelog entry containing exact implementation PR, merge SHA, CI run, deployment run, migration hash, SQL/API/browser results and firewall cleanup. Do not include credential, IP, email, token or notification body containing personal data.

- [ ] **Step 5: Run docs closeout gates**

```powershell
npm run test:traceability-state
npm run trace:enforce
npm run test:secrets
git diff --check
```

Expected: all commands exit 0.

- [ ] **Step 6: Review, commit and publish the evidence-only closeout**

After H2 review of the exact docs diff:

```powershell
git switch -c codex/fe10-unicode-repair-closeout origin/main
git add -- .sdd/specs/feat-notification-management/TASKS.md `
  .sdd/specs/feat-notification-management/CHANGELOG.md
git commit -m "docs: close FE10 Unicode repair"
git push -u origin codex/fe10-unicode-repair-closeout
gh pr create --base main --head codex/fe10-unicode-repair-closeout `
  --title "docs: close FE10 Unicode repair" `
  --body "Records exact merged, CI, staging, Unicode, and firewall-cleanup evidence for FE10-I13."
```

Monitor checks, obtain H3, merge, and verify the exact post-merge `main` CI run.

---

## Final Acceptance Checklist

- [ ] Books 34-40 descriptions equal the seven canonical strings byte-for-byte.
- [ ] BookCopies 60-64 locations equal `Kệ demo A1/A2/A3/B1/C1`.
- [ ] Four FE10 template rows equal canonical subject/body/status values.
- [ ] Exactly 17 diagnosed historical notifications were repaired, or execution stopped on drift.
- [ ] Notification IDs, recipients, statuses, attempts and timestamps were preserved.
- [ ] Migration runs twice and contains no `DELETE`.
- [ ] Every documented migration `sqlcmd` call uses `-b -f 65001`.
- [ ] Workflow hash-gates and packages the exact repair migration.
- [ ] Backend, frontend, deployment, lint/build, traceability and secret gates pass.
- [ ] Implementation PR and evidence PR pass H2/H3 and merge.
- [ ] Exact post-merge staging deployment and smoke pass.
- [ ] Public API and authenticated browser checks show correct Vietnamese.
- [ ] Temporary firewall rule and temporary repair script are absent.
- [ ] Dirty root checkout remains unchanged.
