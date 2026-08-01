# FE07, FE08, FE10 Và FE12 Vietnamese Style Cleanup Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Làm cho 24 tệp tài liệu của FE07, FE08, FE10 và FE12 có văn phong tiếng Việt tự nhiên, nhất quán và dễ trình bày mà không thay đổi bất kỳ nội dung kỹ thuật hoặc bằng chứng hoàn thành nào.

**Architecture:** Thực hiện theo từng chức năng, bắt đầu từ thuật ngữ nghiệp vụ trong `SPEC.md`/`CONTEXT.md`, sau đó đồng bộ `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md`. Mỗi chức năng được kiểm tra độc lập trước khi chuyển sang chức năng kế tiếp; cuối cùng chạy kiểm tra invariant và traceability trên toàn bộ 24 tệp.

**Tech Stack:** Markdown, PowerShell, ripgrep, Git, bộ kiểm tra traceability Node.js hiện có của repository.

## Global Constraints

- Baseline cố định: `origin/main@194dcf63768b87657c1d9c49fb064bbcc5d8e5d8`.
- Chỉ chỉnh 24 tệp `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md` của FE07, FE08, FE10 và FE12; ngoài ra chỉ được thay đổi design/plan của đợt này.
- Không thay đổi mã truy vết, endpoint, HTTP method, tên trường/bảng/cột, enum, mã lỗi, literal trong backtick, URL, số phiên bản, ngày, số liệu, PR, commit, CI/Azure run, checkbox, code fence hoặc quan hệ traceability.
- Không thay đổi quy tắc nghiệp vụ, quyền, API, schema, trạng thái hoàn thành hoặc phạm vi chức năng.
- Không dùng thay thế toàn cục không kiểm soát; mọi thay đổi phải được đọc trong ngữ cảnh câu.
- Thuật ngữ chuẩn: `mượn sách`, `hạn trả`, `đặt chỗ`, `lượt đặt chỗ`, Thành viên, Thủ thư, Quản trị viên.
- Giảm các cụm dịch sát như `lát cắt`, `chính tắc`, `có thẩm quyền`, `bề mặt`, `closeout`, `exact-head`, `wave`, `shell`, `core`, `envelope`, `projection`, `mutation`, `harness` theo bảng quy chuẩn trong design doc.

---

### Task 1: Khóa baseline và phạm vi chỉnh sửa

**Files:**
- Reference: `docs/superpowers/specs/2026-08-01-fe07-fe12-vietnamese-style-cleanup-design.md`
- Reference: `.sdd/specs/feat-borrowing-management/*.md`
- Reference: `.sdd/specs/feat-reservation-management/*.md`
- Reference: `.sdd/specs/feat-notification-management/*.md`
- Reference: `.sdd/specs/feat-reporting-statistics/*.md`

**Interfaces:**
- Consumes: `origin/main@194dcf63768b87657c1d9c49fb064bbcc5d8e5d8` và design doc đã duyệt.
- Produces: danh sách chính xác 24 tệp, số liệu thuật ngữ ban đầu và một worktree sạch để các task sau sử dụng.

- [ ] **Step 1: Xác nhận branch, baseline và worktree sạch**

Run:

```powershell
git branch --show-current
git merge-base --is-ancestor 194dcf63768b87657c1d9c49fb064bbcc5d8e5d8 HEAD
git status --short
```

Expected: branch `docs/fe07-fe12-vietnamese-style-cleanup`; lệnh merge-base thoát `0`; chỉ design/plan đã commit và không có thay đổi chưa commit trước khi chỉnh 24 tệp.

- [ ] **Step 2: Xác nhận đúng 24 tệp trong phạm vi**

Run:

```powershell
$dirs = @(
  '.sdd/specs/feat-borrowing-management',
  '.sdd/specs/feat-reservation-management',
  '.sdd/specs/feat-notification-management',
  '.sdd/specs/feat-reporting-statistics'
)
$files = foreach ($dir in $dirs) {
  Get-ChildItem $dir -File | Where-Object Name -in @('CONTEXT.md','SPEC.md','PLAN.md','TASKS.md','TEST_PLAN.md','CHANGELOG.md')
}
if ($files.Count -ne 24) { throw "Expected 24 files, found $($files.Count)" }
$files.FullName
```

Expected: `24` tệp, sáu tệp cho mỗi chức năng.

- [ ] **Step 3: Ghi nhận mật độ từ cần chỉnh trước khi sửa**

Run:

```powershell
$pattern = 'lát cắt|chính tắc|có thẩm quyền|bề mặt|closeout|exact-head|\bshell\b|\bcore\b|\bwave\b|\bharness\b|\benvelope\b|\bprojection\b|\bmutation\b|\bartifact\b'
rg -i -c --glob '*.md' $pattern $dirs
```

Expected: in ra baseline theo từng tệp để so sánh sau khi chỉnh; không sửa file ở bước này.

---

### Task 2: Làm tự nhiên văn phong FE07

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Interfaces:**
- Consumes: thuật ngữ FE07 và invariant từ Task 1.
- Produces: sáu tài liệu FE07 dùng thống nhất `mượn`, `hạn trả`, `bản sao`, `yêu cầu mượn` và cách diễn đạt tự nhiên cho dữ liệu do máy chủ quyết định.

- [ ] **Step 1: Chỉnh thuật ngữ nghiệp vụ trong SPEC và CONTEXT**

Thay `vay` bằng `mượn` trong ngữ cảnh thư viện; thay `ngày đáo hạn` bằng `hạn trả`; thay `chính tắc` theo ngữ cảnh bằng `chuẩn`/`chính thức`; diễn đạt `có thẩm quyền` thành `do máy chủ quyết định` hoặc `nguồn dữ liệu chính thức`. Không sửa enum, ID hay literal trong backtick.

- [ ] **Step 2: Chỉnh PLAN, TASKS và TEST_PLAN**

Đổi các câu trộn Anh-Việt như `Core owner duy nhất của slice`, `Product diff của wave`, `closeout exact-head`, `projection`, `mutation` thành câu tiếng Việt ngắn và rõ. Giữ nguyên mọi số liệu kiểm thử và bằng chứng lịch sử.

- [ ] **Step 3: Chỉnh CHANGELOG và thêm ghi chú văn phong**

Làm tự nhiên phần văn xuôi lịch sử; thêm một mục ngày `2026-08-01` nói rõ chỉ chuẩn hóa văn phong tiếng Việt, không đổi hành vi, hợp đồng hay bằng chứng.

- [ ] **Step 4: Kiểm tra riêng FE07**

Run:

```powershell
rg -n -i --glob '*.md' 'Core owner|\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b' .sdd/specs/feat-borrowing-management
git diff --check -- .sdd/specs/feat-borrowing-management
```

Expected: không còn kết quả văn xuôi chưa giải thích; các kết quả còn lại chỉ nằm trong tên tệp, literal hoặc trích dẫn lịch sử không thể đổi; diff check thoát `0`.

- [ ] **Step 5: Commit FE07**

```powershell
git add .sdd/specs/feat-borrowing-management
git commit -m "docs: naturalize Vietnamese wording in FE07 docs"
```

---

### Task 3: Làm tự nhiên văn phong FE08

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Consumes: invariant Task 1 và thuật ngữ liên tính năng FE07 đã chuẩn hóa.
- Produces: sáu tài liệu FE08 dùng nhất quán `đặt chỗ`, `lượt đặt chỗ`, `giữ bản sao sau thông báo` và `xử lý hàng đợi`.

- [ ] **Step 1: Chỉnh SPEC và CONTEXT**

Chuẩn hóa `đặt trước`/`lượt giữ` theo ngữ cảnh thành `đặt chỗ`/`lượt đặt chỗ`; chỉ giữ `giữ chỗ` khi nói về trạng thái bản sao được giữ sau thông báo. Giữ nguyên các enum `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED`, `EXPIRED`, `RESERVED`.

- [ ] **Step 2: Chỉnh PLAN, TASKS, TEST_PLAN và CHANGELOG**

Thay cách diễn đạt dịch sát và Anh-Việt bằng câu tiếng Việt trực tiếp; giữ nguyên thứ tự hàng đợi, thời gian giữ, giới hạn đặt chỗ, trạng thái và bằng chứng. Thêm mục văn phong ngày `2026-08-01` vào CHANGELOG.

- [ ] **Step 3: Kiểm tra và commit FE08**

Run:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b' .sdd/specs/feat-reservation-management
git diff --check -- .sdd/specs/feat-reservation-management
git add .sdd/specs/feat-reservation-management
git commit -m "docs: naturalize Vietnamese wording in FE08 docs"
```

Expected: không còn kết quả văn xuôi chưa giải thích; diff check thoát `0`; commit chỉ chứa sáu tệp FE08.

---

### Task 4: Làm tự nhiên văn phong FE10

**Files:**
- Modify: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-notification-management/SPEC.md`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`

**Interfaces:**
- Consumes: invariant Task 1 và ranh giới FE07/FE08 đã chuẩn hóa.
- Produces: sáu tài liệu FE10 giải thích rõ nguồn gửi thông báo, tiến trình xử lý nền, nhà cung cấp email, khóa chống gửi trùng và hộp thư cá nhân.

- [ ] **Step 1: Chỉnh SPEC và CONTEXT với ưu tiên khả năng đọc**

Viết lại các cụm khó như `trình yêu cầu được ràng buộc`, `lưu bền`, `I/O của nhà cung cấp`, `khóa lũy đẳng suy ra`, `bề mặt trình bày` thành câu dễ hiểu nhưng giữ nguyên ownership và security boundary. Không thay đổi nguồn FE02/FE04/FE07/FE08/FE09/FE11/SYSTEM, cặp type/template hoặc quy tắc loại trừ dữ liệu nhạy cảm.

- [ ] **Step 2: Chỉnh PLAN, TASKS và TEST_PLAN**

Đổi `fan-in`, `shell`, `wave`, `harness`, `closeout`, `exact-head` trong văn xuôi; giữ nguyên tên task, mã slice lịch sử khi chúng là định danh được tham chiếu, hash, CI/Azure run và kết quả H2/H3.

- [ ] **Step 3: Chỉnh CHANGELOG và thêm ghi chú văn phong**

Làm tự nhiên phần mô tả lịch sử nhưng không đổi thứ tự hoặc nội dung sự kiện; thêm mục ngày `2026-08-01` xác nhận không đổi hành vi.

- [ ] **Step 4: Kiểm tra riêng FE10 và commit**

Run:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bfan-in\b' .sdd/specs/feat-notification-management
git diff --check -- .sdd/specs/feat-notification-management
git add .sdd/specs/feat-notification-management
git commit -m "docs: naturalize Vietnamese wording in FE10 docs"
```

Expected: không còn kết quả văn xuôi chưa giải thích; diff check thoát `0`; commit chỉ chứa sáu tệp FE10.

---

### Task 5: Làm tự nhiên văn phong FE12

**Files:**
- Modify: `.sdd/specs/feat-reporting-statistics/CONTEXT.md`
- Modify: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Modify: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`

**Interfaces:**
- Consumes: invariant Task 1 và thuật ngữ trạng thái mượn từ FE07.
- Produces: sáu tài liệu FE12 diễn đạt rõ báo cáo, chỉ số, cấu trúc phản hồi, bộ lọc và dữ liệu hiển thị.

- [ ] **Step 1: Chỉnh SPEC và CONTEXT**

Giữ luồng nghiệp vụ hiện đã dễ đọc; chỉ sửa các cụm `nguồn chính tắc`, `có thẩm quyền`, `runtime projection` và trạng thái hoàn thành Anh-Việt. Không thay đổi allowlist query, KPI, công thức, phạm vi thời gian hoặc phân quyền.

- [ ] **Step 2: Chỉnh PLAN, TASKS, TEST_PLAN và CHANGELOG**

Viết lại các câu như `Re-review lát cắt base lịch sử đã được supersede bởi closeout exact-head`; thay `envelope`, `wave`, `harness`, `artifact`, `authentication-shell` trong văn xuôi; giữ nguyên dữ kiện. Thêm mục văn phong ngày `2026-08-01` vào CHANGELOG.

- [ ] **Step 3: Kiểm tra và commit FE12**

Run:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bartifact\b' .sdd/specs/feat-reporting-statistics
git diff --check -- .sdd/specs/feat-reporting-statistics
git add .sdd/specs/feat-reporting-statistics
git commit -m "docs: naturalize Vietnamese wording in FE12 docs"
```

Expected: không còn kết quả văn xuôi chưa giải thích; diff check thoát `0`; commit chỉ chứa sáu tệp FE12.

---

### Task 6: Rà soát chéo và xác minh invariant

**Files:**
- Verify: toàn bộ 24 tệp tài liệu đã chỉnh.
- Modify only if verification finds a wording inconsistency: đúng tệp trong phạm vi 24 tệp.

**Interfaces:**
- Consumes: bốn commit FE07/FE08/FE10/FE12.
- Produces: diff cuối đã xác minh, không mất literal hoặc traceability và không còn dấu vết văn phong chưa giải thích.

- [ ] **Step 1: So sánh các invariant với baseline**

Run this PowerShell script from the worktree root:

```powershell
$baseline = '194dcf63768b87657c1d9c49fb064bbcc5d8e5d8'
$dirs = @(
  '.sdd/specs/feat-borrowing-management',
  '.sdd/specs/feat-reservation-management',
  '.sdd/specs/feat-notification-management',
  '.sdd/specs/feat-reporting-statistics'
)
$names = @('CONTEXT.md','SPEC.md','PLAN.md','TASKS.md','TEST_PLAN.md','CHANGELOG.md')
$patterns = @{
  trace = '(?<![A-Z0-9])(?:BR|FR|AC|PRE|NFR|MF|AF|Q|EC|SAFE|SIT|FE)[-A-Z0-9.]+(?:\/[A-Z0-9.]+)?'
  literal = '(?<!`)`[^`\r\n]+`(?!`)'
  url = 'https?://[^\s)<>]+'
  hash = '(?<![0-9a-f])[0-9a-f]{7,40}(?![0-9a-f])'
  pr = 'PR\s*#\d+'
  number = '(?<![A-Za-z0-9_])\d+(?:[.,]\d+)*(?:%|\/\d+)?(?![A-Za-z0-9_])'
}
foreach ($dir in $dirs) {
  foreach ($name in $names) {
    $path = "$dir/$name"
    $before = (git show "$baseline`:$path") -join "`n"
    $after = Get-Content -Raw $path
    foreach ($entry in $patterns.GetEnumerator()) {
      $beforeCounts = [regex]::Matches($before, $entry.Value) | Group-Object Value -NoElement
      $afterCounts = [regex]::Matches($after, $entry.Value) | Group-Object Value -NoElement
      $afterMap = @{}; foreach ($item in $afterCounts) { $afterMap[$item.Name] = $item.Count }
      foreach ($item in $beforeCounts) {
        if (-not $afterMap.ContainsKey($item.Name) -or $afterMap[$item.Name] -lt $item.Count) {
          throw "$($entry.Key) invariant removed from $path: $($item.Name)"
        }
      }
    }
    $beforeFences = ([regex]::Matches($before, '(?m)^```')).Count
    $afterFences = ([regex]::Matches($after, '(?m)^```')).Count
    if ($beforeFences -ne $afterFences) { throw "Code fence count changed in $path" }
    foreach ($mark in @('- [x]','- [ ]','- [~]')) {
      $beforeCount = ([regex]::Matches($before, [regex]::Escape($mark))).Count
      $afterCount = ([regex]::Matches($after, [regex]::Escape($mark))).Count
      if ($beforeCount -ne $afterCount) { throw "Checkbox count changed in $path for $mark" }
    }
  }
}
'INVARIANTS_PASS'
```

Expected: `INVARIANTS_PASS` và không có exception.

- [ ] **Step 2: Chạy quét văn phong cuối**

Run:

```powershell
$dirs = @(
  '.sdd/specs/feat-borrowing-management',
  '.sdd/specs/feat-reservation-management',
  '.sdd/specs/feat-notification-management',
  '.sdd/specs/feat-reporting-statistics'
)
rg -n -i --glob '*.md' 'Core owner|\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bartifact\b|\bfan-in\b' $dirs
```

Expected: mọi kết quả còn lại đều được kiểm tra thủ công và chỉ là tên tệp, literal, định danh lịch sử hoặc thuật ngữ được giữ có chủ ý; không có câu văn xuôi trộn Anh-Việt chưa xử lý.

- [ ] **Step 3: Chạy các cổng repository**

Run:

```powershell
git diff --check origin/main...HEAD
npm.cmd run trace:enforce
git status --short
git diff --name-only origin/main...HEAD
```

Expected:

- `git diff --check` thoát `0`.
- Traceability: FE07 `44/44`, FE08 `39/39`, FE10 `20/20`, FE12 `15/15` và không chức năng nào vi phạm ngưỡng.
- Worktree sạch sau các commit.
- Danh sách thay đổi chỉ gồm 24 tệp trong phạm vi cùng design/plan của đợt chỉnh văn phong.

- [ ] **Step 4: Rà soát diff cuối theo semantics**

Run:

```powershell
git diff --word-diff=porcelain origin/main...HEAD -- .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics
```

Expected: mọi thay đổi là cách diễn đạt; không có ID, literal kỹ thuật, trạng thái hoặc bằng chứng bị xóa/đổi.

- [ ] **Step 5: Commit các chỉnh sửa nhất quán cuối nếu có**

```powershell
git add .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics
git commit -m "docs: align Vietnamese terminology across FE07 FE08 FE10 FE12"
```

Nếu không có thay đổi sau rà soát chéo, bỏ qua commit này và ghi rõ không cần commit bổ sung.
