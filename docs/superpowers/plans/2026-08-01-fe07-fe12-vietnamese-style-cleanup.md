# FE07, FE08, FE10 Và FE12 Kế hoạch triển khai chỉnh sửa văn phong tiếng Việt

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Goal:** Làm cho 24 tệp tài liệu của FE07, FE08, FE10 và FE12 có văn phong tiếng Việt tự nhiên, nhất quán và dễ trình bày mà không thay đổi bất kỳ nội dung kỹ thuật hoặc bằng chứng hoàn thành nào.

**kiến trúc:** Thực hiện theo từng chức năng, bắt đầu từ thuật ngữ nghiệp vụ trong
`SPEC.md`/`CONTEXT.md`, sau đó đồng bộ `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md`. Mỗi
chức năng được kiểm tra độc lập trước khi chuyển sang chức năng kế tiếp; cuối cùng chạy kiểm tra
điều kiện bất biến và khả năng truy vết trên toàn bộ 24 tệp.

**Tech bộ công nghệ:** Markdown, PowerShell, ripgrep, Git, bộ kiểm tra khả năng truy vết Node.js hiện có
của kho mã nguồn.

## Ràng buộc toàn cầu

- mốc cơ sở cố định: `origin/main@194dcf63768b87657c1d9c49fb064bbcc5d8e5d8`.
- Chỉ chỉnh 24 tệp `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md` của FE07, FE08, FE10 và FE12; ngoài ra chỉ được thay đổi thiết kế/kế hoạch của đợt này.
- Không thay đổi mã truy vết, điểm cuối, HTTP method, tên trường/bảng/cột, giá trị liệt kê, mã lỗi, giá trị nguyên văn trong backtick, URL, số phiên bản, ngày, số liệu, PR, bản ghi Git, CI/Azure lượt chạy, checkbox, hàng rào mã hoặc quan hệ khả năng truy vết.
- Không thay đổi quy tắc nghiệp vụ, quyền, API, lược đồ, trạng thái hoàn thành hoặc phạm vi chức năng.
- Không dùng thay thế toàn cục không kiểm soát; mọi thay đổi phải được đọc trong ngữ cảnh câu.
- Thuật ngữ chuẩn: `mượn sách`, `hạn trả`, `đặt chỗ`, `lượt đặt chỗ`, Thành viên, Thủ thư, Quản trị viên.
- Giảm các cụm dịch sát như `lát cắt`, `chính tắc`, `có thẩm quyền`, `bề mặt`, `closeout`, `exact-head`, `wave`, `shell`, `core`, `envelope`, `projection`, `mutation`, `harness` theo bảng quy chuẩn trong thiết kế doc.

---

### Nhiệm vụ 1: Khóa mốc cơ sở và phạm vi chỉnh sửa

**Tệp:**
- Tham khảo: `docs/superpowers/specs/2026-08-01-fe07-fe12-vietnamese-style-cleanup-design.md`
- Tham khảo: `.sdd/specs/feat-borrowing-management/*.md`
- Tham khảo: `.sdd/specs/feat-reservation-management/*.md`
- Tham khảo: `.sdd/specs/feat-notification-management/*.md`
- Tham khảo: `.sdd/specs/feat-reporting-statistics/*.md`

**Giao diện:**
- đầu vào: `origin/main@194dcf63768b87657c1d9c49fb064bbcc5d8e5d8` và thiết kế doc đã duyệt.
- đầu ra: danh sách chính xác 24 tệp, số liệu thuật ngữ ban đầu và một cây làm việc Git sạch để các Nhiệm vụ sau sử dụng.

- [ ] **Bước 1: Xác nhận nhánh, mốc cơ sở và cây làm việc Git sạch**

Chạy:

```powershell
git branch --show-current
git merge-base --is-ancestor 194dcf63768b87657c1d9c49fb064bbcc5d8e5d8 HEAD
git status --short
```

mong đợi: nhánh `docs/fe07-fe12-vietnamese-style-cleanup`; lệnh hợp nhất-base thoát `0`; chỉ thiết
kế/kế hoạch đã được ghi nhận vào Git và không có thay đổi chưa ghi nhận trước khi chỉnh 24 tệp.

- [ ] **Bước 2: Xác nhận đúng 24 tệp trong phạm vi**

Chạy:

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

mong đợi: `24` tệp, sáu tệp cho mỗi chức năng.

- [ ] **Bước 3: Ghi nhận mật độ từ cần chỉnh trước khi sửa**

Chạy:

```powershell
$pattern = 'lát cắt|chính tắc|có thẩm quyền|bề mặt|closeout|exact-head|\bshell\b|\bcore\b|\bwave\b|\bharness\b|\benvelope\b|\bprojection\b|\bmutation\b|\bartifact\b'
rg -i -c --glob '*.md' $pattern $dirs
```

mong đợi: in ra mốc cơ sở theo từng tệp để so sánh sau khi chỉnh; không sửa tệp ở bước này.

---

### Nhiệm vụ 2: Làm tự nhiên văn phong FE07

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: thuật ngữ FE07 và điều kiện bất biến từ Nhiệm vụ 1.
- đầu ra: sáu tài liệu FE07 dùng thống nhất `mượn`, `hạn trả`, `bản sao`, `yêu cầu mượn` và cách diễn đạt tự nhiên cho dữ liệu do máy chủ quyết định.

- [ ] **Bước 1: Chỉnh thuật ngữ nghiệp vụ trong SPEC và CONTEXT**

Thay `vay` bằng `mượn` trong ngữ cảnh thư viện; thay `ngày đáo hạn` bằng `hạn trả`; thay `chính tắc`
theo ngữ cảnh bằng `chuẩn`/`chính thức`; diễn đạt `có thẩm quyền` thành `do máy chủ quyết định` hoặc
`nguồn dữ liệu chính thức`. Không sửa giá trị liệt kê, ID hay giá trị nguyên văn trong backtick.

- [ ] **Bước 2: Chỉnh PLAN, TASKS và TEST_PLAN**

Đổi các câu trộn Anh-Việt như `Core owner duy nhất của slice`, `Product diff của wave`, `closeout exact-head`, `projection`, `mutation` thành câu tiếng Việt ngắn và rõ. Giữ nguyên mọi số liệu kiểm thử và bằng chứng lịch sử.

- [ ] **Bước 3: Chỉnh CHANGELOG và thêm ghi chú văn phong**

Làm tự nhiên phần văn xuôi lịch sử; thêm một mục ngày `2026-08-01` nói rõ chỉ chuẩn hóa văn phong tiếng Việt, không đổi hành vi, hợp đồng hay bằng chứng.

- [ ] **Bước 4: Kiểm tra riêng FE07**

Chạy:

```powershell
rg -n -i --glob '*.md' 'Core owner|\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b' .sdd/specs/feat-borrowing-management
git diff --check -- .sdd/specs/feat-borrowing-management
```

mong đợi: không còn kết quả văn xuôi chưa giải thích; các kết quả còn lại chỉ nằm trong tên tệp, giá
trị nguyên văn hoặc trích dẫn lịch sử không thể đổi; khác biệt kiểm tra thoát `0`.

- [ ] **Bước 5: Cam kết FE07**

```powershell
git add .sdd/specs/feat-borrowing-management
git commit -m "docs: naturalize Vietnamese wording in FE07 docs"
```

---

### Nhiệm vụ 3: Làm tự nhiên văn phong FE08

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: điều kiện bất biến Nhiệm vụ 1 và thuật ngữ liên chức năng FE07 đã chuẩn hóa.
- đầu ra: sáu tài liệu FE08 dùng nhất quán `đặt chỗ`, `lượt đặt chỗ`, `giữ bản sao sau thông báo` và `xử lý hàng đợi`.

- [ ] **Bước 1: Chỉnh SPEC và CONTEXT**

Chuẩn hóa `đặt trước`/`lượt giữ` theo ngữ cảnh thành `đặt chỗ`/`lượt đặt chỗ`; chỉ giữ `giữ chỗ` khi
nói về trạng thái bản sao được giữ sau thông báo. Giữ nguyên các giá trị liệt kê `ACTIVE`,
`NOTIFIED`, `FULFILLED`, `CANCELLED`, `EXPIRED`, `RESERVED`.

- [ ] **Bước 2: Chỉnh PLAN, TASKS, TEST_PLAN và CHANGELOG**

Thay cách diễn đạt dịch sát và Anh-Việt bằng câu tiếng Việt trực tiếp; giữ nguyên thứ tự hàng đợi, thời gian giữ, giới hạn đặt chỗ, trạng thái và bằng chứng. Thêm mục văn phong ngày `2026-08-01` vào CHANGELOG.

- [ ] **Bước 3: Kiểm tra và bản ghi Git FE08**

Chạy:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b' .sdd/specs/feat-reservation-management
git diff --check -- .sdd/specs/feat-reservation-management
git add .sdd/specs/feat-reservation-management
git commit -m "docs: naturalize Vietnamese wording in FE08 docs"
```

mong đợi: không còn kết quả văn xuôi chưa giải thích; khác biệt kiểm tra thoát `0`; bản ghi Git chỉ
chứa sáu tệp FE08.

---

### Nhiệm vụ 4: Làm tự nhiên văn phong FE10

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: điều kiện bất biến Nhiệm vụ 1 và ranh giới FE07/FE08 đã chuẩn hóa.
- đầu ra: sáu tài liệu FE10 giải thích rõ nguồn gửi thông báo, tiến trình xử lý nền, nhà cung cấp email, khóa chống gửi trùng và hộp thư cá nhân.

- [ ] **Bước 1: Chỉnh SPEC và CONTEXT với ưu tiên khả năng đọc**

Viết lại các cụm khó như `trình yêu cầu được ràng buộc`, `lưu bền`, `I/O của nhà cung cấp`, `khóa
lũy đẳng suy ra`, `bề mặt trình bày` thành câu dễ hiểu nhưng giữ nguyên quyền sở hữu và bảo mật ranh
giới. Không thay đổi nguồn FE02/FE04/FE07/FE08/FE09/FE11/SYSTEM, cặp type/mẫu hoặc quy tắc loại trừ
dữ liệu nhạy cảm.

- [ ] **Bước 2: Chỉnh PLAN, TASKS và TEST_PLAN**

Đổi `fan-in`, `shell`, `wave`, `harness`, `closeout`, `exact-head` trong văn xuôi; giữ nguyên tên
Nhiệm vụ, mã phần việc lịch sử khi chúng là định danh được tham chiếu, hash, CI/Azure lượt chạy và
kết quả H2/H3.

- [ ] **Bước 3: Chỉnh CHANGELOG và thêm ghi chú văn phong**

Làm tự nhiên phần mô tả lịch sử nhưng không đổi thứ tự hoặc nội dung sự kiện; thêm mục ngày `2026-08-01` xác nhận không đổi hành vi.

- [ ] **Bước 4: Kiểm tra riêng FE10 và bản ghi Git**

Chạy:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bfan-in\b' .sdd/specs/feat-notification-management
git diff --check -- .sdd/specs/feat-notification-management
git add .sdd/specs/feat-notification-management
git commit -m "docs: naturalize Vietnamese wording in FE10 docs"
```

mong đợi: không còn kết quả văn xuôi chưa giải thích; khác biệt kiểm tra thoát `0`; bản ghi Git chỉ
chứa sáu tệp FE10.

---

### Nhiệm vụ 5: Làm tự nhiên văn phong FE12

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`

**Giao diện:**
- đầu vào: điều kiện bất biến Nhiệm vụ 1 và thuật ngữ trạng thái mượn từ FE07.
- đầu ra: sáu tài liệu FE12 diễn đạt rõ báo cáo, chỉ số, cấu trúc phản hồi, bộ lọc và dữ liệu hiển thị.

- [ ] **Bước 1: Chỉnh SPEC và CONTEXT**

Giữ luồng nghiệp vụ hiện đã dễ đọc; chỉ sửa các cụm `nguồn chính tắc`, `có thẩm quyền`, `thời gian chạy
dữ liệu chiếu` và trạng thái hoàn thành Anh-Việt. Không thay đổi danh sách cho phép truy vấn, KPI, công
thức, phạm vi thời gian hoặc phân quyền.

- [ ] **Bước 2: Chỉnh PLAN, TASKS, TEST_PLAN và CHANGELOG**

Viết lại các câu như `Re-review lát cắt base lịch sử đã được supersede bởi closeout exact-head`; thay `envelope`, `wave`, `harness`, `artifact`, `authentication-shell` trong văn xuôi; giữ nguyên dữ kiện. Thêm mục văn phong ngày `2026-08-01` vào CHANGELOG.

- [ ] **Bước 3: Kiểm tra và bản ghi Git FE12**

Chạy:

```powershell
rg -n -i --glob '*.md' '\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bartifact\b' .sdd/specs/feat-reporting-statistics
git diff --check -- .sdd/specs/feat-reporting-statistics
git add .sdd/specs/feat-reporting-statistics
git commit -m "docs: naturalize Vietnamese wording in FE12 docs"
```

mong đợi: không còn kết quả văn xuôi chưa giải thích; khác biệt kiểm tra thoát `0`; bản ghi Git chỉ
chứa sáu tệp FE12.

---

### Nhiệm vụ 6: Rà soát chéo và xác minh điều kiện bất biến

**Tệp:**
- xác minh: toàn bộ 24 tệp tài liệu đã chỉnh.
- chỉ sửa nếu xác minh finds a wording inconsistency: đúng tệp trong phạm vi 24 tệp.

**Giao diện:**
- đầu vào: bốn bản ghi Git FE07/FE08/FE10/FE12.
- đầu ra: khác biệt cuối đã xác minh, không mất giá trị nguyên văn hoặc khả năng truy vết và không còn dấu vết văn phong chưa giải thích.

- [ ] **Bước 1: So sánh các điều kiện bất biến với mốc cơ sở**

Chạy tập lệnh PowerShell này từ gốc cây làm việc:

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

mong đợi: `INVARIANTS_PASS` và không có exception.

- [ ] **Bước 2: Chạy quét văn phong cuối**

Chạy:

```powershell
$dirs = @(
  '.sdd/specs/feat-borrowing-management',
  '.sdd/specs/feat-reservation-management',
  '.sdd/specs/feat-notification-management',
  '.sdd/specs/feat-reporting-statistics'
)
rg -n -i --glob '*.md' 'Core owner|\bslice\b|supersede|Re-review|Product diff|\bwave\b|\bcloseout\b|exact-head|lát cắt|chính tắc|có thẩm quyền|bề mặt|\benvelope\b|\bprojection\b|\bmutation\b|\bharness\b|\bartifact\b|\bfan-in\b' $dirs
```

mong đợi: mọi kết quả còn lại đều được kiểm tra thủ công và chỉ là tên tệp, giá trị nguyên văn, định
danh lịch sử hoặc thuật ngữ được giữ có chủ ý; không có câu văn xuôi trộn Anh-Việt chưa xử lý.

- [ ] **Bước 3: Chạy các cổng kho mã nguồn**

Chạy:

```powershell
git diff --check origin/main...HEAD
npm.cmd run trace:enforce
git status --short
git diff --name-only origin/main...HEAD
```

Dự kiến:

- `git diff --check` thoát `0`.
- khả năng truy vết: FE07 `44/44`, FE08 `39/39`, FE10 `20/20`, FE12 `15/15` và không chức năng nào vi phạm ngưỡng.
- cây làm việc Git sạch sau các bản ghi Git.
- Danh sách thay đổi chỉ gồm 24 tệp trong phạm vi cùng thiết kế/kế hoạch của đợt chỉnh văn phong.

- [ ] **Bước 4: Rà soát khác biệt cuối theo ngữ nghĩa**

Chạy:

```powershell
git diff --word-diff=porcelain origin/main...HEAD -- .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics
```

mong đợi: mọi thay đổi là cách diễn đạt; không có ID, giá trị nguyên văn kỹ thuật, trạng thái hoặc
bằng chứng bị xóa/đổi.

- [ ] **Bước 5: bản ghi Git các chỉnh sửa nhất quán cuối nếu có**

```powershell
git add .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics
git commit -m "docs: align Vietnamese terminology across FE07 FE08 FE10 FE12"
```

Nếu không có thay đổi sau rà soát chéo, bỏ qua bản ghi Git này và ghi rõ không cần bản ghi Git bổ sung.
