# Vietnamese SDD Documentation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Việt hóa toàn bộ 149 file Markdown trong `.sdd/` mà không thay đổi yêu cầu, thiết kế, dữ kiện lịch sử, cấu trúc Markdown hoặc định danh truy vết.

**Architecture:** Thực hiện theo năm lớp đã được duyệt: nền tảng/ràng buộc, 12 bộ tài liệu feature, RFC/ADR, review lịch sử, rồi skill và kiểm tra toàn cục. Mỗi feature hoặc nhóm review là một đơn vị dịch, kiểm chứng và commit độc lập; mọi invariant kỹ thuật được so sánh trực tiếp với commit nguồn cố định `7bf76b5`.

**Tech Stack:** Markdown, Git, PowerShell 7/Windows PowerShell, Node.js, `rg`, và script traceability hiện có của repository.

## Global Constraints

- Chỉ dịch nội dung ngôn ngữ tự nhiên; không thay đổi business rule, actor permission, acceptance criterion, schema, API contract hoặc hành vi phần mềm.
- Giữ nguyên mọi mã `FE*`, `BR-*`, `FR-*`, `AC-*`, `NFR-*`, `DEC-*`, `ADR-*`, `TD-*`, `G*`, `B*`, mã test và mã lỗi.
- Giữ nguyên tên file/thư mục, đích liên kết, URL, endpoint, field, enum, code fence, inline code kỹ thuật, JSON, SQL, lệnh, phiên bản, ngày, commit, PR và CI run.
- Dịch thống nhất: Guest → Khách, Member → Thành viên, Librarian → Thủ thư, Admin/Administrator → Quản trị viên; enum như `MEMBER` vẫn giữ nguyên.
- Không đổi `Version`, `Last Updated` hoặc trạng thái phê duyệt chỉ vì thao tác dịch; chỉ dịch nhãn và diễn giải tương đương.
- Mọi chỉnh sửa tài liệu phải dùng `apply_patch`; không dùng script để tự động dịch hoặc ghi đè hàng loạt.
- Nếu một câu mơ hồ có thể làm thay đổi nghiệp vụ, phân quyền, an toàn, API, dữ liệu hoặc tiêu chí chấp nhận, dừng tại file/mục đó và xin người dùng xác nhận.
- Toàn bộ công việc thực hiện trên nhánh `docs/vietnamese-sdd`; không tạo hoặc đổi sang nhánh có tiền tố khác.
- Goal chỉ được đánh dấu hoàn thành sau khi cả 149 file đã dịch, toàn bộ kiểm tra tự động đạt và phần rủi ro cao đã được rà soát thủ công theo Task 20.
- Chỉ stage các file được liệt kê trong task hiện tại. Không stage hoặc sửa code ứng dụng.
- Mỗi task phải vượt qua kiểm tra invariant, quét tiếng Anh còn sót, `git diff --check`, đọc diff và traceability trước khi commit.

---

## Shared Verification Interfaces

### Session-local invariant checker

Trong mỗi phiên PowerShell mới, định nghĩa hàm sau trước khi chạy task đầu tiên. Hàm không tạo file và so sánh bản hiện tại với commit nguồn cố định `7bf76b5`.

```powershell
function Test-SddTranslationInvariant {
    param([Parameter(Mandatory = $true)][string[]] $Paths)

    node -e 'const cp=require("node:child_process"),fs=require("node:fs");const files=process.argv.slice(1);const rules={ids:/\b(?:FE\d{2}|(?:BR|FR|AC|NFR|DEC|TD)-[A-Z0-9-]+|ADR-\d{3}|G\d+|B\d+)\b/g,inline:/`[^`\r\n]+`/g,links:/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,fences:/^```[\s\S]*?^```[ \t]*$/gm,numbers:/\b(?:0x[0-9a-f]+|[0-9a-f]{7,40}|\d+(?:[.,:/-]\d+)*)\b/gi};function values(re,s,key){return key==="links"?[...s.matchAll(re)].map(m=>m[1]).sort():(s.match(re)||[]).sort()}let bad=0;for(const f of files){const old=cp.execFileSync("git",["show","7bf76b5:"+f.replace(/\\/g,"/")],{encoding:"utf8"}).replace(/\r\n/g,"\n");const now=fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");for(const [k,re] of Object.entries(rules)){const a=JSON.stringify(values(re,old,k)),b=JSON.stringify(values(re,now,k));if(a!==b){console.error(`${f}: ${k} changed`);bad=1}}}if(bad)process.exit(1);console.log(`PASS: ${files.length} files preserved`)' $Paths
    if ($LASTEXITCODE -ne 0) {
        throw "SDD translation invariant check failed."
    }
}
```

**Consumes:** Một mảng đường dẫn repository-relative tới các file đã dịch.

**Produces:** `PASS: N files preserved` khi số định danh, inline code, đích liên kết, code fence và số liệu khớp với commit `7bf76b5`; exit khác 0 kèm tên file/nhóm invariant khi có sai lệch.

### English residue scan

Sau mỗi task, chạy lệnh sau với đúng mảng `$paths` của task:

```powershell
$pattern = 'Feature Overview|Business Context|Goal / Outcome|Actors and Permissions|Preconditions|Main Flows|Business Rules|Functional Requirements|Acceptance Criteria|Edge Cases|Out of Scope|Non-Functional Requirements|Dependencies|Open Questions|Traceability|Record of Changes|Change Description|Last Updated|Implementation State'
rg -n -i $pattern -- $paths
if ($LASTEXITCODE -gt 1) { throw "English residue scan failed to run." }
```

Kết quả mong đợi: không còn tiêu đề hoặc nhãn tiếng Anh chưa được cho phép. Mọi hit nằm trong code fence, inline code, enum, tên riêng hoặc dữ kiện lịch sử phải được đọc trực tiếp và xác nhận là nội dung được phép giữ nguyên.

### Common completion gate

Mỗi task phải chạy các lệnh sau sau khi invariant và residue scan đạt yêu cầu:

```powershell
git diff --check -- $paths
if ($LASTEXITCODE -ne 0) { throw "git diff check failed." }
git diff -- $paths
npm run trace:enforce
if ($LASTEXITCODE -ne 0) { throw "Traceability enforcement failed." }
```

Kết quả mong đợi: không có lỗi whitespace hoặc conflict marker; diff chỉ là bản dịch đúng phạm vi; traceability đạt ngưỡng hiện hành cho toàn bộ FE01-FE12.

---

### Task 1: Việt hóa nền tảng và constraints

**Files:**
- Modify: `.sdd/constitution.md`
- Modify: `.sdd/shared_context.md`
- Modify: `.sdd/test-plan.md`
- Modify: `.sdd/constraints/business.md`
- Modify: `.sdd/constraints/global.md`
- Modify: `.sdd/constraints/safety.md`

**Interfaces:**
- Consumes: Hợp đồng dịch và bảng thuật ngữ trong `docs/superpowers/specs/2026-07-28-vietnamese-sdd-documentation-design.md`.
- Produces: Bộ thuật ngữ tiếng Việt chuẩn cho mọi task sau, đồng thời bảo toàn toàn bộ constraint ID và quyết định baseline.

- [ ] **Step 1: Đọc sáu file nguồn và đối chiếu thuật ngữ chung**

Đọc theo thứ tự constitution → shared context → test plan → global → business → safety. Ghi nhận các thuật ngữ actor, module, business rule, security rule và workflow phải dùng thống nhất.

- [ ] **Step 2: Dịch nội dung bằng `apply_patch`**

Dịch toàn bộ prose, heading và nhãn bảng; giữ nguyên stack, ID, enum, đường dẫn, code block, số liệu và metadata theo Global Constraints.

- [ ] **Step 3: Chạy kiểm tra invariant và tiếng Anh còn sót**

```powershell
$paths = @(
  '.sdd/constitution.md', '.sdd/shared_context.md', '.sdd/test-plan.md',
  '.sdd/constraints/business.md', '.sdd/constraints/global.md', '.sdd/constraints/safety.md'
)
Test-SddTranslationInvariant -Paths $paths
```

Chạy English residue scan với `$paths`; đọc từng hit và sửa mọi heading/label tiếng Anh không thuộc danh sách được giữ nguyên.

- [ ] **Step 4: Chạy completion gate và đọc toàn bộ diff**

Chạy Common completion gate với `$paths`. Đặc biệt kiểm tra các câu chứa phủ định, số 5, 14 ngày, 5.000 VND, actor permission và `SAFE-*`.

- [ ] **Step 5: Commit lớp nền tảng**

```powershell
git add -- .sdd/constitution.md .sdd/shared_context.md .sdd/test-plan.md .sdd/constraints/business.md .sdd/constraints/global.md .sdd/constraints/safety.md
git commit -m "docs: translate SDD foundation and constraints"
```

### Task 2: Việt hóa template và FE01 Public Browse

**Files:**
- Modify: `.sdd/specs/_template.md`
- Modify: `.sdd/specs/feat-public-browse/CONTEXT.md`
- Modify: `.sdd/specs/feat-public-browse/SPEC.md`
- Modify: `.sdd/specs/feat-public-browse/PLAN.md`
- Modify: `.sdd/specs/feat-public-browse/TASKS.md`
- Modify: `.sdd/specs/feat-public-browse/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-public-browse/CHANGELOG.md`

**Interfaces:**
- Consumes: Thuật ngữ lớp nền tảng từ Task 1 và feature contract FE01 trong sáu file nguồn.
- Produces: Template tiếng Việt và bộ tài liệu FE01 đồng nhất, giữ nguyên `FE01`, các ID, API catalog và public access boundaries.

- [ ] **Step 1: Đọc template và FE01 theo thứ tự tài liệu nguồn**

Đọc `_template.md`, rồi `CONTEXT.md` → `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` → `CHANGELOG.md`.

- [ ] **Step 2: Dịch template và FE01 bằng `apply_patch`**

Dùng “Duyệt/Xem công khai” cho Public Browse khi là prose; giữ nguyên tên folder, route, endpoint, response field, ID và inline code.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = @('.sdd/specs/_template.md') + (Get-ChildItem '.sdd/specs/feat-public-browse' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') })
Test-SddTranslationInvariant -Paths $paths
```

Chạy English residue scan với `$paths`; xác nhận các literal FE01 được giữ nguyên.

- [ ] **Step 4: Chạy completion gate và đối chiếu chuỗi truy vết**

Chạy Common completion gate với `$paths`. Đọc theo chuỗi `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` để xác nhận cùng một yêu cầu có cùng nghĩa.

- [ ] **Step 5: Commit template và FE01**

```powershell
git add -- .sdd/specs/_template.md .sdd/specs/feat-public-browse
git commit -m "docs: translate FE01 SDD package"
```

### Task 3: Việt hóa FE02 Authentication

**Files:**
- Modify: `.sdd/specs/feat-auth/CONTEXT.md`
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/PLAN.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`

**Interfaces:**
- Consumes: Thuật ngữ nền tảng và auth contract tại commit nguồn `7bf76b5`.
- Produces: Bộ FE02 tiếng Việt bảo toàn OTP, token, email verification, password reset, role và security boundaries.

- [ ] **Step 1: Đọc FE02 theo chuỗi nguồn-triển khai-kiểm thử**

Đọc `CONTEXT.md` → `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` → `CHANGELOG.md`, tập trung vào phủ định, TTL, attempt limit và transport/security literal.

- [ ] **Step 2: Dịch sáu file FE02 bằng `apply_patch`**

Dịch Authentication thành “Xác thực” trong prose; giữ nguyên tên endpoint, token type, env var, enum, error code và payload field.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-auth' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy English residue scan với `$paths`; đọc kỹ các hit chứa Authentication, Verification, Login, Password và Account Setup.

- [ ] **Step 4: Chạy completion gate và kiểm tra security semantics**

Chạy Common completion gate. So sánh các yêu cầu FE02 về OTP, token hashing, expiry, generic error, role cardinality và verified email với bản nguồn.

- [ ] **Step 5: Commit FE02**

```powershell
git add -- .sdd/specs/feat-auth
git commit -m "docs: translate FE02 SDD package"
```

### Task 4: Việt hóa FE03 User Profile

**Files:**
- Modify: `.sdd/specs/feat-user-profile/CONTEXT.md`
- Modify: `.sdd/specs/feat-user-profile/SPEC.md`
- Modify: `.sdd/specs/feat-user-profile/PLAN.md`
- Modify: `.sdd/specs/feat-user-profile/TASKS.md`
- Modify: `.sdd/specs/feat-user-profile/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-profile/CHANGELOG.md`

**Interfaces:**
- Consumes: Thuật ngữ actor/account từ Tasks 1-3 và ownership contract FE03.
- Produces: Bộ FE03 tiếng Việt giữ nguyên ranh giới dữ liệu cá nhân, validation và ownership với FE02/FE11.

- [ ] **Step 1: Đọc đầy đủ sáu file FE03**

Đánh dấu các câu nói về self-service field, email ownership, PII, authorization và validation.

- [ ] **Step 2: Dịch FE03 bằng `apply_patch`**

Dùng “Hồ sơ người dùng” trong prose; giữ nguyên field `fullName`, `phone`, `address`, email, error code và route.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-user-profile' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan và xác nhận mọi thuật ngữ tiếng Anh còn lại là field/literal được phép giữ nguyên.

- [ ] **Step 4: Chạy completion gate và kiểm tra ownership**

Chạy Common completion gate. Đối chiếu actor permission và ranh giới FE02/FE03/FE11 giữa SPEC, PLAN, TASKS và TEST_PLAN.

- [ ] **Step 5: Commit FE03**

```powershell
git add -- .sdd/specs/feat-user-profile
git commit -m "docs: translate FE03 SDD package"
```

### Task 5: Việt hóa FE04 Membership Management

**Files:**
- Modify: `.sdd/specs/feat-membership-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-membership-management/SPEC.md`
- Modify: `.sdd/specs/feat-membership-management/PLAN.md`
- Modify: `.sdd/specs/feat-membership-management/TASKS.md`
- Modify: `.sdd/specs/feat-membership-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-membership-management/CHANGELOG.md`

**Interfaces:**
- Consumes: Membership baseline trong shared context và business constraints.
- Produces: Bộ FE04 tiếng Việt bảo toàn lifecycle đơn đăng ký, trạng thái, reviewer permission và integration với FE07/FE10.

- [ ] **Step 1: Đọc sáu file FE04 và lập đối chiếu trạng thái**

Đọc toàn bộ các luồng apply, review, approve, reject và notification; giữ enum trạng thái làm mốc.

- [ ] **Step 2: Dịch FE04 bằng `apply_patch`**

Dùng “Quản lý tư cách thành viên” hoặc “Quản lý đăng ký thành viên” đúng theo ngữ cảnh; giữ nguyên enum, entity, field, route và error code.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-membership-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; kiểm tra mọi từ Approved/Pending/Rejected còn lại chỉ là enum hoặc literal.

- [ ] **Step 4: Chạy completion gate và kiểm tra state transition**

Chạy Common completion gate. Đối chiếu điều kiện chuyển trạng thái, quyền Librarian/Admin và ảnh hưởng hạn mức mượn.

- [ ] **Step 5: Commit FE04**

```powershell
git add -- .sdd/specs/feat-membership-management
git commit -m "docs: translate FE04 SDD package"
```

### Task 6: Việt hóa FE05 Book Management

**Files:**
- Modify: `.sdd/specs/feat-book-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-book-management/SPEC.md`
- Modify: `.sdd/specs/feat-book-management/PLAN.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`

**Interfaces:**
- Consumes: FE05 contract tại commit nguồn `7bf76b5`, gồm các cập nhật book/category/author/publisher.
- Produces: Bộ FE05 tiếng Việt bảo toàn mutation ownership, uniqueness, search/filter và API envelope.

- [ ] **Step 1: Đọc FE05 và đánh dấu metadata kỹ thuật**

Đọc sáu file theo thứ tự chuẩn; ghi nhận entity/field/endpoint và các quyết định vừa cập nhật trên remote.

- [ ] **Step 2: Dịch FE05 bằng `apply_patch`**

Dùng “Quản lý sách” trong prose; phân biệt Sách với Bản sao sách và không dịch tên entity/field trong inline code.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-book-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; đọc các hit Book, Author, Publisher, Category để phân biệt prose với literal.

- [ ] **Step 4: Chạy completion gate và kiểm tra FE05/FE06 boundary**

Chạy Common completion gate. Xác nhận metadata-level management không bị dịch thành copy-level inventory behavior.

- [ ] **Step 5: Commit FE05**

```powershell
git add -- .sdd/specs/feat-book-management
git commit -m "docs: translate FE05 SDD package"
```

### Task 7: Việt hóa FE06 Inventory / Book Copy Management

**Files:**
- Modify: `.sdd/specs/feat-inventory-book-copy/CONTEXT.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/PLAN.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/TASKS.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`

**Interfaces:**
- Consumes: Thuật ngữ Sách/Bản sao sách từ FE05 và inventory constraints FE06.
- Produces: Bộ FE06 tiếng Việt giữ nguyên barcode, location, availability, copy status và transactional race rules.

- [ ] **Step 1: Đọc sáu file FE06 và lập bảng thuật ngữ copy-level**

Phân biệt book metadata, physical copy, available quantity, copy status và inventory adjustment.

- [ ] **Step 2: Dịch FE06 bằng `apply_patch`**

Dùng “Quản lý kho/Bản sao sách” phù hợp ngữ cảnh; giữ nguyên `BookCopies`, barcode, enum trạng thái và transaction terminology khi là literal kỹ thuật.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-inventory-book-copy' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan và xác nhận các từ Inventory/Copy còn lại chỉ thuộc tên kỹ thuật.

- [ ] **Step 4: Chạy completion gate và kiểm tra concurrency semantics**

Chạy Common completion gate. Đọc lại các rule atomicity, duplicate barcode, availability và race condition.

- [ ] **Step 5: Commit FE06**

```powershell
git add -- .sdd/specs/feat-inventory-book-copy
git commit -m "docs: translate FE06 SDD package"
```

### Task 8: Việt hóa FE07 Borrowing Management

**Files:**
- Modify: `.sdd/specs/feat-borrowing-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Modify: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Modify: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Interfaces:**
- Consumes: Business limits từ shared context/constraints và FE07 contract tại commit nguồn `7bf76b5`.
- Produces: Bộ FE07 tiếng Việt bảo toàn request/approve/reject/checkout/return/renewal flows, daily limit và active-copy limit.

- [ ] **Step 1: Đọc FE07 và đánh dấu mọi câu chứa số hoặc phủ định**

Đọc sáu file; tập trung vào 3/5-copy daily tier, 5 active copies, 14-day loan, overdue/fine restriction và status transition.

- [ ] **Step 2: Dịch FE07 bằng `apply_patch`**

Phân biệt Yêu cầu mượn, Duyệt yêu cầu, Bàn giao sách, Trả sách và Gia hạn; giữ nguyên entity, endpoint, enum, ID và error code.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-borrowing-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; đọc các hit Borrow, Return, Renewal, Due và Rejected theo literal/prose.

- [ ] **Step 4: Chạy completion gate và kiểm tra business-rule parity**

Chạy Common completion gate. Đối chiếu từng `BR-FE07-*` và `AC-FE07-*` với bản nguồn, đặc biệt các phép so sánh, inclusive/exclusive boundary và actor ownership.

- [ ] **Step 5: Commit FE07**

```powershell
git add -- .sdd/specs/feat-borrowing-management
git commit -m "docs: translate FE07 SDD package"
```

### Task 9: Việt hóa FE08 Reservation Management

**Files:**
- Modify: `.sdd/specs/feat-reservation-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-reservation-management/SPEC.md`
- Modify: `.sdd/specs/feat-reservation-management/PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/TASKS.md`
- Modify: `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Interfaces:**
- Consumes: FE07 terminology và FE08 queue/candidate ownership contract.
- Produces: Bộ FE08 tiếng Việt giữ nguyên reservation queue, candidate catalog, hold/expiry và one-open-reservation rules.

- [ ] **Step 1: Đọc FE08 và đối chiếu integration với FE07**

Đọc sáu file; đánh dấu mọi quy tắc queue order, eligibility, open reservation, conversion và ownership.

- [ ] **Step 2: Dịch FE08 bằng `apply_patch`**

Dùng “Đặt chỗ” cho Reservation; giữ nguyên queue/candidate literal khi là field, endpoint hoặc enum.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-reservation-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; phân loại Reservation, Queue, Hold và Candidate còn lại.

- [ ] **Step 4: Chạy completion gate và kiểm tra queue semantics**

Chạy Common completion gate. Đối chiếu thứ tự queue, expiry, cancel, candidate ownership và integration với borrow request.

- [ ] **Step 5: Commit FE08**

```powershell
git add -- .sdd/specs/feat-reservation-management
git commit -m "docs: translate FE08 SDD package"
```

### Task 10: Việt hóa FE09 Fine Management

**Files:**
- Modify: `.sdd/specs/feat-fine-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-fine-management/SPEC.md`
- Modify: `.sdd/specs/feat-fine-management/PLAN.md`
- Modify: `.sdd/specs/feat-fine-management/TASKS.md`
- Modify: `.sdd/specs/feat-fine-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-fine-management/CHANGELOG.md`

**Interfaces:**
- Consumes: Fine baseline 5.000 VND/ngày/bản sao và FE07 return data contract.
- Produces: Bộ FE09 tiếng Việt bảo toàn calculation, damaged/lost/overdue categories, payment state và auditability.

- [ ] **Step 1: Đọc FE09 và đánh dấu công thức tính**

Đọc sáu file; chú ý ngày bắt đầu tính phạt, phép nhân theo ngày/bản sao, rounding, paid/unpaid và caller boundary.

- [ ] **Step 2: Dịch FE09 bằng `apply_patch`**

Dùng “Quản lý khoản phạt”; giữ nguyên công thức, số liệu, enum, field, endpoint và mã lỗi.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-fine-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan và kiểm tra các literal Fine, Paid, Unpaid, Damaged, Lost, Overdue.

- [ ] **Step 4: Chạy completion gate và kiểm tra công thức**

Chạy Common completion gate. So sánh từng dấu điều kiện, ngày bắt đầu và số tiền với bản nguồn.

- [ ] **Step 5: Commit FE09**

```powershell
git add -- .sdd/specs/feat-fine-management
git commit -m "docs: translate FE09 SDD package"
```

### Task 11: Việt hóa FE10 Notification Management

**Files:**
- Modify: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-notification-management/SPEC.md`
- Modify: `.sdd/specs/feat-notification-management/PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/TASKS.md`
- Modify: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-notification-management/CHANGELOG.md`

**Interfaces:**
- Consumes: FE02/FE04/FE07/FE08/FE09 event boundaries và FE10 delivery contract.
- Produces: Bộ FE10 tiếng Việt giữ nguyên template, notification attempt, delivery status, retry, provider và OTP boundary.

- [ ] **Step 1: Đọc FE10 theo producer-consumer flow**

Đọc sáu file; xác định event source, recipient, template, persistence, attempt, delivery status và deferred scope.

- [ ] **Step 2: Dịch FE10 bằng `apply_patch`**

Dùng “Quản lý thông báo”; giữ nguyên provider, env var, template key, event name, enum, endpoint và payload field.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-notification-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; kiểm tra Notification, Delivery, Attempt, Template, Retry và Provider còn lại.

- [ ] **Step 4: Chạy completion gate và kiểm tra integration boundary**

Chạy Common completion gate. Đối chiếu caller ownership, OTP isolation, delivery attempt và out-of-scope claim.

- [ ] **Step 5: Commit FE10**

```powershell
git add -- .sdd/specs/feat-notification-management
git commit -m "docs: translate FE10 SDD package"
```

### Task 12: Việt hóa FE11 User & Role Management

**Files:**
- Modify: `.sdd/specs/feat-user-role-management/CONTEXT.md`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Interfaces:**
- Consumes: Role cardinality baseline, FE02 account setup boundary và FE03 personal-data ownership.
- Produces: Bộ FE11 tiếng Việt giữ nguyên admin authorization, one-role atomic replacement, audit log và profile-edit prohibitions.

- [ ] **Step 1: Đọc FE11 và lập ma trận quyền**

Đọc sáu file; đối chiếu Admin, current Librarian, Member, self-service fields, role change, audit outcome và `ACCOUNT_SETUP`.

- [ ] **Step 2: Dịch FE11 bằng `apply_patch`**

Dùng “Quản lý người dùng và vai trò”; giữ nguyên role enum, error code, audit action, field, endpoint và transaction literal.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-user-role-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; kiểm tra User, Role, Audit, Account Setup và Permission còn lại.

- [ ] **Step 4: Chạy completion gate và kiểm tra quyền/atomicity**

Chạy Common completion gate. So sánh ma trận quyền, forbidden personal fields, role replacement cardinality và audit success/failure semantics.

- [ ] **Step 5: Commit FE11**

```powershell
git add -- .sdd/specs/feat-user-role-management
git commit -m "docs: translate FE11 SDD package"
```

### Task 13: Việt hóa FE12 Reporting & Statistics

**Files:**
- Modify: `.sdd/specs/feat-reporting-statistics/CONTEXT.md`
- Modify: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Modify: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Modify: `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md`
- Modify: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`

**Interfaces:**
- Consumes: Deterministic reporting rules và dữ liệu từ FE05-FE11.
- Produces: Bộ FE12 tiếng Việt giữ nguyên metric definitions, date boundaries, authorization và deterministic policy.

- [ ] **Step 1: Đọc FE12 và lập danh sách metric**

Đọc sáu file; đối chiếu công thức, date range, timezone, inclusive/exclusive boundary, actor và data source.

- [ ] **Step 2: Dịch FE12 bằng `apply_patch`**

Dùng “Báo cáo và thống kê”; giữ nguyên metric key, field, endpoint, SQL/code, enum và số liệu.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-reporting-statistics' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; kiểm tra Reporting, Statistics, Metric, Date Range và Timezone còn lại.

- [ ] **Step 4: Chạy completion gate và kiểm tra metric parity**

Chạy Common completion gate. So sánh từng metric, filter, date boundary, actor access và response field với bản nguồn.

- [ ] **Step 5: Commit FE12**

```powershell
git add -- .sdd/specs/feat-reporting-statistics
git commit -m "docs: translate FE12 SDD package"
```

### Task 14: Việt hóa RFC và ADR

**Files:**
- Modify: `.sdd/rfcs/README.md`
- Modify: `.sdd/rfcs/ADR-001-architecture.md`
- Modify: `.sdd/rfcs/ADR-002-database-design.md`
- Modify: `.sdd/rfcs/ADR-003-authentication-approach.md`
- Modify: `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- Modify: `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`

**Interfaces:**
- Consumes: Thuật ngữ FE01-FE12 đã ổn định và quyết định kiến trúc tại commit nguồn `7bf76b5`.
- Produces: Sáu tài liệu quyết định tiếng Việt giữ nguyên status, context, decision, consequences, schema và integration boundaries.

- [ ] **Step 1: Đọc README và ADR-001 đến ADR-005 theo thứ tự**

Ghi nhận decision status, alternatives, consequences, migration policy và mọi tham chiếu spec/schema.

- [ ] **Step 2: Dịch RFC/ADR bằng `apply_patch`**

Dịch prose và nhãn; giữ nguyên tên ADR, technology, library, schema object, code, endpoint, path, version và decision ID.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/rfcs' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; kiểm tra các thuật ngữ Architecture, Context, Decision, Consequences và Migration còn lại.

- [ ] **Step 4: Chạy completion gate và kiểm tra quyết định kiến trúc**

Chạy Common completion gate. Đối chiếu đặc biệt ADR-002 migration policy và ADR-003/004/005 auth-account-notification boundaries.

- [ ] **Step 5: Commit RFC/ADR**

```powershell
git add -- .sdd/rfcs
git commit -m "docs: translate SDD architecture decisions"
```

### Task 15: Việt hóa review nền tảng tháng 6

**Files:**
- Modify: `.sdd/reviews/README.md`
- Modify: `.sdd/reviews/db-instance-schema-drift-2026-06-22.md`
- Modify: `.sdd/reviews/hybrid-method-compliance-review-2026-06-22.md`
- Modify: `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`
- Modify: `.sdd/reviews/open-questions-review-verdict-2026-06-10.md`
- Modify: `.sdd/reviews/phase-1-spec-closeout-2026-06-10.md`
- Modify: `.sdd/reviews/review-phase-1-specs-2026-06-10.md`
- Modify: `.sdd/reviews/week-2-spec-coverage-review-2026-06-10.md`
- Modify: `.sdd/reviews/week-3-spec-finalization-closeout-2026-06-10.md`
- Modify: `.sdd/reviews/week-4-database-gap-review-2026-06-10.md`

**Interfaces:**
- Consumes: Bản dịch nền tảng/spec/ADR và bằng chứng lịch sử tháng 6.
- Produces: Mười tài liệu review tiếng Việt giữ nguyên verdict, gap, question resolution, schema drift và evidence.

- [ ] **Step 1: Đọc nhóm review theo ngày và chủ đề**

Đọc các file ngày 2026-06-10 trước, sau đó 2026-06-22 và README; đánh dấu verdict, status, owner, evidence và unresolved/resolved claims.

- [ ] **Step 2: Dịch mười file bằng `apply_patch`**

Dịch prose và nhãn; giữ nguyên ngày, commit, đường dẫn, ID, PASS/FAIL literal, schema object và trích dẫn kỹ thuật.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = @(
 '.sdd/reviews/README.md', '.sdd/reviews/db-instance-schema-drift-2026-06-22.md',
 '.sdd/reviews/hybrid-method-compliance-review-2026-06-22.md', '.sdd/reviews/open-questions-resolution-packet-2026-06-10.md',
 '.sdd/reviews/open-questions-review-verdict-2026-06-10.md', '.sdd/reviews/phase-1-spec-closeout-2026-06-10.md',
 '.sdd/reviews/review-phase-1-specs-2026-06-10.md', '.sdd/reviews/week-2-spec-coverage-review-2026-06-10.md',
 '.sdd/reviews/week-3-spec-finalization-closeout-2026-06-10.md', '.sdd/reviews/week-4-database-gap-review-2026-06-10.md'
)
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; xác nhận mọi status/evidence literal tiếng Anh còn lại là dữ kiện lịch sử phải giữ nguyên.

- [ ] **Step 4: Chạy completion gate và kiểm tra historical claims**

Chạy Common completion gate. So sánh verdict, resolved/unresolved state, schema drift và phase closeout với nguồn.

- [ ] **Step 5: Commit review tháng 6**

```powershell
git add -- $paths
git commit -m "docs: translate June SDD reviews"
```

### Task 16: Việt hóa review ngày 13-15 tháng 7

**Files:**
- Modify: `.sdd/reviews/app-shell-ux-validation-review-2026-07-14.md`
- Modify: `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`
- Modify: `.sdd/reviews/authentication-otp-ux-validation-review-2026-07-15.md`
- Modify: `.sdd/reviews/fe07-b6-validation-review-2026-07-14.md`
- Modify: `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`
- Modify: `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`
- Modify: `.sdd/reviews/fe08-b7-integration-review-closeout-2026-07-13.md`
- Modify: `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`
- Modify: `.sdd/reviews/fe12-b6-validation-review-2026-07-13.md`
- Modify: `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`
- Modify: `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`
- Modify: `.sdd/reviews/library-ux-slice3-operational-consistency-analysis-2026-07-15.md`
- Modify: `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`
- Modify: `.sdd/reviews/system-integration-evidence-2026-07-14.md`
- Modify: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- Modify: `.sdd/reviews/week11-e2e-evidence-2026-07-14.md`
- Modify: `.sdd/reviews/week12-security-audit-2026-07-14.md`

**Interfaces:**
- Consumes: Bản dịch FE02, FE07, FE08, FE10, FE12 và UX/security terminology.
- Produces: Mười bảy review tiếng Việt giữ nguyên gate B6/B7, integration evidence, E2E result và security audit.

- [ ] **Step 1: Đọc nhóm review theo feature và gate**

Đọc FE08/FE10/FE12 ngày 13, FE07/system/week evidence ngày 14, rồi auth/UX/integration ngày 15; lập đối chiếu PASS/FAIL và closeout claim.

- [ ] **Step 2: Dịch mười bảy file bằng `apply_patch`**

Dịch prose/nhãn nhưng giữ nguyên B6/B7, test name, route, command, commit, CI result, screenshot path và security literal.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter '*.md' | Where-Object { $_.Name -match '2026-07-(13|14|15)\.md$' } | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 17`, rồi chạy residue scan và đọc từng hit evidence/gate.

- [ ] **Step 4: Chạy completion gate và kiểm tra evidence parity**

Chạy Common completion gate. Xác nhận mọi PASS/FAIL, B6/B7, commit, CI, test count và deferred boundary giữ nguyên.

- [ ] **Step 5: Commit review ngày 13-15**

```powershell
git add -- $paths
git commit -m "docs: translate mid-July SDD reviews"
```

### Task 17: Việt hóa review FE11 ngày 18 tháng 7

**Files:**
- Modify: `.sdd/reviews/fe11-admin-console-context-drift-audit-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-evidence-metadata-validation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-fast-track-batch-1-closeout-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md`
- Modify: `.sdd/reviews/fe11-user-list-envelope-validation-2026-07-18.md`

**Interfaces:**
- Consumes: FE11 translation, Fast-Track H1/H2/H3 terminology và admin ownership rules.
- Produces: Mười review FE11 tiếng Việt bảo toàn approval gates, evidence metadata, transaction và audit results.

- [ ] **Step 1: Đọc mười file theo dependency order**

Đọc H1 → contract/evidence validation → transactional role/audit → safe list/detail → closeout; ghi nhận authority và gate boundaries.

- [ ] **Step 2: Dịch nhóm FE11 bằng `apply_patch`**

Dịch prose/nhãn; giữ nguyên H1/H2/H3, B7, role enum, audit action, envelope field, test/commit/PR/CI evidence.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter 'fe11-*-2026-07-18.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 10`, rồi chạy residue scan và phân loại gate/literal.

- [ ] **Step 4: Chạy completion gate và kiểm tra authority semantics**

Chạy Common completion gate. Đối chiếu ai phê duyệt H1/H2/H3, hành động nào được phép, evidence nào là historical và boundary nào còn deferred.

- [ ] **Step 5: Commit review FE11 ngày 18**

```powershell
git add -- $paths
git commit -m "docs: translate FE11 fast-track reviews"
```

### Task 18: Việt hóa review ngày 19 tháng 7

**Files:**
- Modify: `.sdd/reviews/fe01-public-book-envelope-decision-2026-07-19.md`
- Modify: `.sdd/reviews/fe02-auth-debt-closure-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe04-membership-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe05-book-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe06-inventory-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe09-fine-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`
- Modify: `.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`
- Modify: `.sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md`
- Modify: `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`
- Modify: `.sdd/reviews/full-reconciliation-validation-2026-07-19.md`
- Modify: `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
- Modify: `.sdd/reviews/phase3-final-validation-2026-07-19.md`

**Interfaces:**
- Consumes: Toàn bộ FE01-FE12 đã dịch và full-reconciliation terminology.
- Produces: Mười tám review tiếng Việt giữ nguyên acceptance, live SQL, deterministic policy, reconciliation và phase-exit evidence.

- [ ] **Step 1: Đọc review feature trước, review tổng hợp sau**

Đọc FE01-FE12 validation theo số FE, rồi full reconciliation, phase 2 exit và phase 3 final; đánh dấu mọi claim phụ thuộc evidence.

- [ ] **Step 2: Dịch mười tám file bằng `apply_patch`**

Dịch prose/nhãn; giữ nguyên commit, PR, CI, SQL result, percentage, test count, status literal, limitation và future boundary.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter '*-2026-07-19.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 18`, rồi chạy residue scan và đọc từng hit evidence/result.

- [ ] **Step 4: Chạy completion gate và kiểm tra completion claims**

Chạy Common completion gate. Đối chiếu phần complete/deferred/out-of-scope, human acceptance, live SQL và phase-exit claim với bản nguồn.

- [ ] **Step 5: Commit review ngày 19**

```powershell
git add -- $paths
git commit -m "docs: translate reconciliation and phase reviews"
```

### Task 19: Việt hóa review ngày 20-27 tháng 7

**Files:**
- Modify: `.sdd/reviews/admin-authenticated-ux-correction-validation-2026-07-22.md`
- Modify: `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`
- Modify: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`
- Modify: `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Modify: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Modify: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Modify: `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`
- Modify: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`

**Interfaces:**
- Consumes: FE07/FE08/FE10/FE11/FE12 translations, UI localization vocabulary và final governance rules.
- Produces: Tám review tiếng Việt giữ nguyên H3, remediation, staging email, UI localization và governance closeout evidence.

- [ ] **Step 1: Đọc tám file theo thứ tự ngày**

Đọc ngày 20 → 22 → 23 → 27; ghi nhận final-governance authority, UI correction, H3 remediation, email staging và business-rule alignment.

- [ ] **Step 2: Dịch tám file bằng `apply_patch`**

Dịch prose/nhãn; giữ nguyên H3, commit, PR, CI, staging URL, provider response, screenshot, test và status literal.

- [ ] **Step 3: Chạy invariant và residue scan**

```powershell
$paths = @(
 '.sdd/reviews/admin-authenticated-ux-correction-validation-2026-07-22.md', '.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md',
 '.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md', '.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md',
 '.sdd/reviews/final-governance-closeout-validation-2026-07-20.md', '.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md',
 '.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md', '.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md'
)
Test-SddTranslationInvariant -Paths $paths
```

Chạy residue scan; xác nhận evidence/literal còn lại được phép giữ nguyên.

- [ ] **Step 4: Chạy completion gate và kiểm tra recent-state claims**

Chạy Common completion gate. Đối chiếu ngày, branch/commit, H3 authority, staging result, UI localization scope và remaining limitation.

- [ ] **Step 5: Commit review ngày 20-27**

```powershell
git add -- $paths
git commit -m "docs: translate final SDD validation reviews"
```

### Task 20: Việt hóa skill nội bộ và kiểm tra toàn cục

**Files:**
- Modify: `.sdd/skills/README.md`
- Verify: Toàn bộ 149 file `.sdd/**/*.md`
- Verify: `docs/superpowers/specs/2026-07-28-vietnamese-sdd-documentation-design.md`
- Verify: `docs/superpowers/plans/2026-07-28-vietnamese-sdd-documentation.md`

**Interfaces:**
- Consumes: Tất cả output của Tasks 1-19.
- Produces: Bộ `.sdd` hoàn chỉnh bằng tiếng Việt, báo cáo kiểm chứng sạch và lịch sử commit có thể review theo lớp.

- [ ] **Step 1: Dịch skill README bằng `apply_patch`**

Dịch nội dung hướng dẫn trong `.sdd/skills/README.md`; giữ nguyên tên folder, tên file, lệnh và định danh kỹ thuật.

- [ ] **Step 2: Chạy invariant trên toàn bộ 149 file**

```powershell
$paths = Get-ChildItem '.sdd' -Recurse -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
if ($paths.Count -ne 149) { throw "Expected 149 Markdown files under .sdd, found $($paths.Count)." }
Test-SddTranslationInvariant -Paths $paths
```

Kết quả mong đợi: `PASS: 149 files preserved`.

- [ ] **Step 3: Chạy quét tiếng Anh toàn cục**

Chạy English residue scan với toàn bộ `$paths`. Sau đó chạy thêm:

```powershell
rg -n -i '^#{1,6}\s+.*\b(Overview|Context|Goal|Scope|Actors|Permissions|Preconditions|Flows|Rules|Requirements|Criteria|Cases|Dependencies|Questions|Traceability|Validation|Evidence|Result|Decision|Consequences)\b' -- $paths
if ($LASTEXITCODE -gt 1) { throw "Global heading scan failed to run." }
```

Kết quả mong đợi: không còn heading tiếng Anh ngoài tên riêng hoặc literal kỹ thuật đã được hợp đồng cho phép.

- [ ] **Step 4: Chạy kiểm tra cấu trúc, traceability và phạm vi diff**

```powershell
git diff --check 7bf76b5...HEAD
if ($LASTEXITCODE -ne 0) { throw "Repository diff check failed." }
npm run trace:enforce
if ($LASTEXITCODE -ne 0) { throw "Traceability enforcement failed." }
$changed = git diff --name-only 7bf76b5...HEAD
$unexpected = $changed | Where-Object { $_ -notmatch '^\.sdd/.+\.md$' -and $_ -notmatch '^docs/superpowers/(specs|plans)/2026-07-28-vietnamese-sdd-documentation(-design)?\.md$' }
if ($unexpected) { $unexpected; throw "Out-of-scope files changed." }
```

Kết quả mong đợi: không có lỗi diff, traceability đạt yêu cầu và không có file code/runtime trong `$unexpected`.

- [ ] **Step 5: Đọc diff tổng theo khu vực rủi ro**

```powershell
git diff --stat 7bf76b5...HEAD
git diff 7bf76b5...HEAD -- .sdd/constraints .sdd/specs/*/SPEC.md .sdd/rfcs
```

Đọc thủ công mọi câu chứa `only`, `must`, `must not`, `cannot`, `at most`, `at least`, điều kiện phủ định, actor permission, số tiền, số ngày và trạng thái; xác nhận bản dịch không đảo nghĩa hoặc mở rộng phạm vi.

- [ ] **Step 6: Commit skill README và closeout tài liệu**

```powershell
git add -- .sdd/skills/README.md
git commit -m "docs: complete Vietnamese SDD translation"
git status --short --branch
```

Kết quả mong đợi: working tree sạch; nhánh chỉ chứa các commit tài liệu kế tiếp commit nguồn `7bf76b5`.

## Final Human Review Gate

Trước khi push hoặc mở pull request, người duyệt cần kiểm tra tối thiểu:

1. `.sdd/constitution.md`, `.sdd/shared_context.md` và ba constraint files.
2. `SPEC.md` của FE02, FE07, FE09 và FE11 vì đây là các feature có rủi ro security/business-rule cao.
3. ADR-002, ADR-003, ADR-004 và ADR-005.
4. Một review lịch sử từ mỗi nhóm Tasks 15-19.
5. Báo cáo invariant, traceability, English residue và out-of-scope diff của Task 20.

Không push, tạo PR hoặc merge nếu chưa có yêu cầu tiếp theo của người dùng và chưa vượt qua gate review tương ứng của repository.
