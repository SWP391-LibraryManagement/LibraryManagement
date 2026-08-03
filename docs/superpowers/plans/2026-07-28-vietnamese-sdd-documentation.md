# Kế hoạch triển khai tài liệu SDD tiếng Việt

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Việt hóa toàn bộ 149 tệp Markdown trong `.sdd/` mà không thay đổi yêu cầu, thiết kế, dữ
kiện lịch sử, cấu trúc Markdown hoặc định danh truy vết.

**Kiến trúc:** Thực hiện theo năm lớp đã được duyệt: nền tảng/ràng buộc, 12 bộ tài liệu chức
năng, RFC/ADR, rà soát lịch sử, rồi kỹ năng và kiểm tra toàn cục. Mỗi chức năng hoặc nhóm rà soát là một
đơn vị dịch, kiểm chứng và bản ghi Git độc lập; mọi điều kiện bất biến kỹ thuật được so sánh trực
tiếp với bản ghi Git
nguồn cố định `7bf76b5`.

**Bộ công nghệ:** Markdown, Git, PowerShell 7/Windows PowerShell, Node.js, `rg` và tập lệnh khả năng
truy vết hiện có của kho mã nguồn.

## Ràng buộc toàn cầu

- Chỉ dịch nội dung ngôn ngữ tự nhiên; không thay đổi quy tắc nghiệp vụ, quyền tác nhân, tiêu chí chấp nhận, lược đồ, hợp đồng API hoặc hành vi phần mềm.
- Giữ nguyên mọi mã `FE*`, `BR-*`, `FR-*`, `AC-*`, `NFR-*`, `DEC-*`, `ADR-*`, `TD-*`, `G*`, `B*`, mã kiểm thử và mã lỗi.
- Giữ nguyên tên tệp/thư mục, đích liên kết, URL, điểm cuối, trường, giá trị liệt kê, hàng rào mã, mã nội tuyến kỹ thuật, JSON, SQL, lệnh, phiên bản, ngày, bản ghi Git, PR và CI lượt chạy.
- Dịch thống nhất: khách → Khách, thành viên → Thành viên, thủ thư → Thủ thư, quản trị viên → Quản trị viên; giá trị liệt kê như `MEMBER` vẫn giữ nguyên.
- Không đổi `Version`, `Last Updated` hoặc trạng thái phê duyệt chỉ vì thao tác dịch; chỉ dịch nhãn và diễn giải tương đương.
- Mọi chỉnh sửa tài liệu phải dùng `apply_patch`; không dùng script để tự động dịch hoặc ghi đè hàng loạt.
- Nếu một câu mơ hồ có thể làm thay đổi nghiệp vụ, phân quyền, an toàn, API, dữ liệu hoặc tiêu chí chấp nhận, dừng tại tệp/mục đó và xin người dùng xác nhận.
- Toàn bộ công việc thực hiện trên nhánh `docs/vietnamese-sdd`; không tạo hoặc đổi sang nhánh có tiền tố khác.
- Mục tiêu chỉ được đánh dấu hoàn thành sau khi cả 149 tệp đã dịch, toàn bộ kiểm tra tự động đạt và phần rủi ro cao đã được rà soát thủ công theo Nhiệm vụ 20.
- Chỉ đưa vào vùng chờ Git các tệp được liệt kê trong Nhiệm vụ hiện tại. Không đưa vào vùng chờ hoặc sửa mã nguồn ứng dụng.
- Mỗi Nhiệm vụ phải vượt qua kiểm tra điều kiện bất biến, quét tiếng Anh còn sót, `git diff --check`, đọc khác biệt và khả năng truy vết trước khi bản ghi Git.

---

## Giao diện xác minh được chia sẻ

### Trình kiểm tra bất biến phiên cục bộ

Trong mỗi phiên PowerShell mới, định nghĩa hàm sau trước khi chạy Nhiệm vụ đầu tiên. Hàm không tạo
tệp và so sánh bản hiện tại với bản ghi Git nguồn cố định `7bf76b5`.

```powershell
function Test-SddTranslationInvariant {
    param([Parameter(Mandatory = $true)][string[]] $Paths)

    node -e 'const cp=require("node:child_process"),fs=require("node:fs");const files=process.argv.slice(1);const rules={ids:/\b(?:FE\d{2}|(?:BR|FR|AC|NFR|DEC|TD)-[A-Z0-9-]+|ADR-\d{3}|G\d+|B\d+)\b/g,inline:/`[^`\r\n]+`/g,links:/\]\(([^)\s]+)(?:\s+"[^"]*")?\)/g,fences:/^```[\s\S]*?^```[ \t]*$/gm,numbers:/\b(?:0x[0-9a-f]+|[0-9a-f]{7,40}|\d+(?:[.,:/-]\d+)*)\b/gi};function values(re,s,key){return key==="links"?[...s.matchAll(re)].map(m=>m[1]).sort():(s.match(re)||[]).sort()}let bad=0;for(const f of files){const old=cp.execFileSync("git",["show","7bf76b5:"+f.replace(/\\/g,"/")],{encoding:"utf8"}).replace(/\r\n/g,"\n");const now=fs.readFileSync(f,"utf8").replace(/\r\n/g,"\n");for(const [k,re] of Object.entries(rules)){const a=JSON.stringify(values(re,old,k)),b=JSON.stringify(values(re,now,k));if(a!==b){console.error(`${f}: ${k} changed`);bad=1}}}if(bad)process.exit(1);console.log(`PASS: ${files.length} files preserved`)' $Paths
    if ($LASTEXITCODE -ne 0) {
        throw "SDD translation invariant check failed."
    }
}
```

**đầu vào:** Một mảng đường dẫn kho mã nguồn-relative tới các tệp đã dịch.

**đầu ra:** `PASS: N files preserved` khi số định danh, mã nội tuyến, đích liên kết, hàng rào mã và
số liệu khớp với bản ghi Git `7bf76b5`; exit khác 0 kèm tên tệp/nhóm điều kiện bất biến khi có sai
lệch.

### Quét dư lượng tiếng Anh

Sau mỗi Nhiệm vụ, chạy lệnh sau với đúng mảng `$paths` của Nhiệm vụ:

```powershell
$pattern = 'Feature Overview|Business Context|Goal / Outcome|Actors and Permissions|Preconditions|Main Flows|Business Rules|Functional Requirements|Acceptance Criteria|Edge Cases|Out of Scope|Non-Functional Requirements|Dependencies|Open Questions|Traceability|Record of Changes|Change Description|Last Updated|Implementation State'
rg -n -i $pattern -- $paths
if ($LASTEXITCODE -gt 1) { throw "English residue scan failed to run." }
```

Kết quả mong đợi: không còn tiêu đề hoặc nhãn tiếng Anh chưa được cho phép. Mọi hit nằm trong hàng
rào mã, mã nội tuyến, giá trị liệt kê, tên riêng hoặc dữ kiện lịch sử phải được đọc trực tiếp và xác
nhận là nội dung được phép giữ nguyên.

### Cổng hoàn thiện chung

Mỗi Nhiệm vụ phải chạy các lệnh sau sau khi điều kiện bất biến và quét phần tiếng Anh còn sót đạt yêu cầu:

```powershell
git diff --check -- $paths
if ($LASTEXITCODE -ne 0) { throw "git diff check failed." }
git diff -- $paths
npm run trace:enforce
if ($LASTEXITCODE -ne 0) { throw "Traceability enforcement failed." }
```

Kết quả mong đợi: không có lỗi whitespace hoặc conflict dấu nhận diện; khác biệt chỉ là bản dịch đúng phạm vi;
khả năng truy vết đạt ngưỡng hiện hành cho toàn bộ FE01-FE12.

---

### Nhiệm vụ 1: Việt hóa nền tảng và ràng buộc

**Tệp:**
- Sửa đổi: `.sdd/constitution.md`
- Sửa đổi: `.sdd/shared_context.md`
- Sửa đổi: `.sdd/test-plan.md`
- Sửa đổi: `.sdd/constraints/business.md`
- Sửa đổi: `.sdd/constraints/global.md`
- Sửa đổi: `.sdd/constraints/safety.md`

**Giao diện:**
- đầu vào: Hợp đồng dịch và bảng thuật ngữ trong `docs/superpowers/specs/2026-07-28-vietnamese-sdd-documentation-design.md`.
- đầu ra: Bộ thuật ngữ tiếng Việt chuẩn cho mọi Nhiệm vụ sau, đồng thời bảo toàn toàn bộ ràng buộc ID và quyết định mốc cơ sở.

- [ ] **Bước 1: Đọc sáu tệp nguồn và đối chiếu thuật ngữ chung**

Đọc theo thứ tự constitution → shared context → kiểm thử kế hoạch → global → nghiệp vụ → safety. Ghi nhận các
thuật ngữ tác nhân, module, quy tắc nghiệp vụ, bảo mật quy tắc và quy trình phải dùng thống nhất.

- [ ] **Bước 2: Dịch nội dung bằng `apply_patch`**

Dịch toàn bộ văn xuôi, heading và nhãn bảng; giữ nguyên bộ công nghệ, ID, giá trị liệt kê, đường
dẫn, mã nguồn block, số liệu và siêu dữ liệu theo Global ràng buộc.

- [ ] **Bước 3: Chạy kiểm tra điều kiện bất biến và tiếng Anh còn sót**

```powershell
$paths = @(
  '.sdd/constitution.md', '.sdd/shared_context.md', '.sdd/test-plan.md',
  '.sdd/constraints/business.md', '.sdd/constraints/global.md', '.sdd/constraints/safety.md'
)
Test-SddTranslationInvariant -Paths $paths
```

Chạy English quét phần tiếng Anh còn sót với `$paths`; đọc từng hit và sửa mọi heading/label tiếng
Anh không thuộc danh sách được giữ nguyên.

- [ ] **Bước 4: Chạy cổng hoàn tất và đọc toàn bộ khác biệt**

Chạy cổng hoàn tất dùng chung với `$paths`. Đặc biệt kiểm tra các câu chứa phủ định, số 5, 14 ngày,
5.000 VND, tác nhân permission và `SAFE-*`.

- [ ] **Bước 5: bản ghi Git lớp nền tảng**

```powershell
git add -- .sdd/constitution.md .sdd/shared_context.md .sdd/test-plan.md .sdd/constraints/business.md .sdd/constraints/global.md .sdd/constraints/safety.md
git commit -m "docs: translate SDD foundation and constraints"
```

### Nhiệm vụ 2: Việt hóa mẫu và FE01 Public Browse

**Tệp:**
- Sửa đổi: `.sdd/specs/_template.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-public-browse/CHANGELOG.md`

**Giao diện:**
- đầu vào: Thuật ngữ lớp nền tảng từ Nhiệm vụ 1 và chức năng hợp đồng FE01 trong sáu tệp nguồn.
- đầu ra: mẫu tiếng Việt và bộ tài liệu FE01 đồng nhất, giữ nguyên `FE01`, các ID, API danh mục và public access boundaries.

- [ ] **Bước 1: Đọc mẫu và FE01 theo thứ tự tài liệu nguồn**

Đọc `_template.md`, rồi `CONTEXT.md` → `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` → `CHANGELOG.md`.

- [ ] **Bước 2: Dịch mẫu và FE01 bằng `apply_patch`**

Dùng “Duyệt/Xem công khai” cho Public Browse khi là văn xuôi; giữ nguyên tên folder, tuyến, điểm
cuối, phản hồi trường, ID và mã nội tuyến.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = @('.sdd/specs/_template.md') + (Get-ChildItem '.sdd/specs/feat-public-browse' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') })
Test-SddTranslationInvariant -Paths $paths
```

Chạy English quét phần tiếng Anh còn sót với `$paths`; xác nhận các giá trị nguyên văn FE01 được giữ nguyên.

- [ ] **Bước 4: Chạy cổng hoàn tất và đối chiếu chuỗi truy vết**

Chạy cổng hoàn tất dùng chung với `$paths`. Đọc theo chuỗi `SPEC.md` → `PLAN.md` → `TASKS.md` →
`TEST_PLAN.md` để xác nhận cùng một yêu cầu có cùng nghĩa.

- [ ] **Bước 5: bản ghi Git mẫu và FE01**

```powershell
git add -- .sdd/specs/_template.md .sdd/specs/feat-public-browse
git commit -m "docs: translate FE01 SDD package"
```

### Nhiệm vụ 3: Việt hóa FE02 xác thực

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`

**Giao diện:**
- đầu vào: Thuật ngữ nền tảng và xác thực hợp đồng tại bản ghi Git nguồn `7bf76b5`.
- đầu ra: Bộ FE02 tiếng Việt bảo toàn OTP, token, email xác minh, mật khẩu đặt lại, vai trò và bảo mật boundaries.

- [ ] **Bước 1: Đọc FE02 theo chuỗi nguồn-triển khai-kiểm thử**

Đọc `CONTEXT.md` → `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` → `CHANGELOG.md`, tập trung
vào phủ định, TTL, attempt limit và transport/bảo mật giá trị nguyên văn.

- [ ] **Bước 2: Dịch sáu tệp FE02 bằng `apply_patch`**

Dịch xác thực thành “Xác thực” trong văn xuôi; giữ nguyên tên điểm cuối, token type, env var, giá
trị liệt kê, error mã nguồn và dữ liệu gửi trường.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-auth' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy English quét phần tiếng Anh còn sót với `$paths`; đọc kỹ các hit chứa xác thực, xác minh, đăng
nhập, mật khẩu và tài khoản Setup.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra ngữ nghĩa bảo mật**

Chạy cổng hoàn tất dùng chung. So sánh các yêu cầu FE02 về OTP, token hashing, expiry, generic
error, vai trò cardinality và verified email với bản nguồn.

- [ ] **Bước 5: Cam kết FE02**

```powershell
git add -- .sdd/specs/feat-auth
git commit -m "docs: translate FE02 SDD package"
```

### Nhiệm vụ 4: Việt hóa FE03 người dùng hồ sơ

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-profile/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-profile/CHANGELOG.md`

**Giao diện:**
- đầu vào: Thuật ngữ tác nhân/tài khoản từ Tasks 1-3 và quyền sở hữu hợp đồng FE03.
- đầu ra: Bộ FE03 tiếng Việt giữ nguyên ranh giới dữ liệu cá nhân, xác thực và quyền sở hữu với FE02/FE11.

- [ ] **Bước 1: Đọc đầy đủ sáu tệp FE03**

Đánh dấu các câu nói về tự phục vụ trường, email quyền sở hữu, PII, ủy quyền và xác thực.

- [ ] **Bước 2: Dịch FE03 bằng `apply_patch`**

Dùng “Hồ sơ người dùng” trong văn xuôi; giữ nguyên trường `fullName`, `phone`, `address`, email,
error mã nguồn và tuyến.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-user-profile' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót và xác nhận mọi thuật ngữ tiếng Anh còn lại là trường/giá trị
nguyên văn được phép giữ nguyên.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra quyền sở hữu**

Chạy cổng hoàn tất dùng chung. Đối chiếu tác nhân permission và ranh giới FE02/FE03/FE11 giữa SPEC,
PLAN, TASKS và TEST_PLAN.

- [ ] **Bước 5: Cam kết FE03**

```powershell
git add -- .sdd/specs/feat-user-profile
git commit -m "docs: translate FE03 SDD package"
```

### Nhiệm vụ 5: Việt hóa FE04 Membership quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-membership-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-membership-management/CHANGELOG.md`

**Giao diện:**
- Đầu vào: mốc cơ sở tư cách thành viên trong bối cảnh dùng chung và ràng buộc nghiệp vụ.
- Đầu ra: bộ FE04 tiếng Việt bảo toàn vòng đời đơn đăng ký, trạng thái, quyền người rà soát và tích hợp với FE07/FE10.

- [ ] **Bước 1: Đọc sáu tệp FE04 và lập đối chiếu trạng thái**

Đọc toàn bộ các luồng nộp đơn, rà soát, phê duyệt, từ chối và thông báo; giữ giá trị liệt kê trạng thái làm mốc.

- [ ] **Bước 2: Dịch FE04 bằng `apply_patch`**

Dùng “Quản lý tư cách thành viên” hoặc “Quản lý đăng ký thành viên” đúng theo ngữ cảnh; giữ nguyên
giá trị liệt kê, thực thể, trường, tuyến và mã lỗi nguồn.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-membership-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; kiểm tra mọi từ Approved/đang chờ/Rejected còn lại chỉ là giá trị
liệt kê hoặc giá trị nguyên văn.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra chuyển đổi trạng thái**

Chạy cổng hoàn tất dùng chung. Đối chiếu điều kiện chuyển trạng thái, quyền thủ thư/quản trị viên và
ảnh hưởng hạn mức mượn.

- [ ] **Bước 5: Cam kết FE04**

```powershell
git add -- .sdd/specs/feat-membership-management
git commit -m "docs: translate FE04 SDD package"
```

### Nhiệm vụ 6: Việt hóa FE05 Book quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-book-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-book-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-book-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-book-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-book-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-book-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: FE05 hợp đồng tại bản ghi Git nguồn `7bf76b5`, gồm các cập nhật book/category/author/publisher.
- đầu ra: Bộ FE05 tiếng Việt bảo toàn thao tác ghi quyền sở hữu, uniqueness, search/filter và API envelope.

- [ ] **Bước 1: Đọc FE05 và đánh dấu siêu dữ liệu kỹ thuật**

Đọc sáu tệp theo thứ tự chuẩn; ghi nhận entity/trường/điểm cuối và các quyết định vừa cập nhật trên từ xa.

- [ ] **Bước 2: Dịch FE05 bằng `apply_patch`**

Dùng “Quản lý sách” trong văn xuôi; phân biệt Sách với Bản sao sách và không dịch tên entity/trường
trong mã nội tuyến.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-book-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; đọc các hit Book, Author, Publisher, Category để phân biệt văn
xuôi với giá trị nguyên văn.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra FE05/FE06 ranh giới**

Chạy cổng hoàn tất dùng chung. Xác nhận siêu dữ liệu-level quản lý không bị dịch thành copy-level
hành vi tồn kho.

- [ ] **Bước 5: Cam kết FE05**

```powershell
git add -- .sdd/specs/feat-book-management
git commit -m "docs: translate FE05 SDD package"
```

### Nhiệm vụ 7: Việt hóa FE06 Inventory / Book Copy quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-inventory-book-copy/CHANGELOG.md`

**Giao diện:**
- đầu vào: Thuật ngữ Sách/Bản sao sách từ FE05 và inventory ràng buộc FE06.
- đầu ra: Bộ FE06 tiếng Việt giữ nguyên barcode, location, tình trạng sẵn có, trạng thái bản sao và có tính giao dịch race quy tắc.

- [ ] **Bước 1: Đọc sáu tệp FE06 và lập bảng thuật ngữ copy-level**

Phân biệt book siêu dữ liệu, bản sao vật lý, số lượng có sẵn, trạng thái bản sao và điều chỉnh kho.

- [ ] **Bước 2: Dịch FE06 bằng `apply_patch`**

Dùng “Quản lý kho/Bản sao sách” phù hợp ngữ cảnh; giữ nguyên `BookCopies`, barcode, giá trị liệt kê
trạng thái và giao dịch terminology khi là giá trị nguyên văn kỹ thuật.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-inventory-book-copy' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót và xác nhận các từ Inventory/Copy còn lại chỉ thuộc tên kỹ thuật.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra concurrency ngữ nghĩa**

Chạy cổng hoàn tất dùng chung. Đọc lại các quy tắc atomicity, barcode trùng lặp, tình trạng sẵn có
và điều kiện tranh chấp.

- [ ] **Bước 5: Cam kết FE06**

```powershell
git add -- .sdd/specs/feat-inventory-book-copy
git commit -m "docs: translate FE06 SDD package"
```

### Nhiệm vụ 8: Việt hóa FE07 mượn sách quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-borrowing-management/CHANGELOG.md`

**Giao diện:**
- Đầu vào: hạn mức nghiệp vụ từ bối cảnh dùng chung/ràng buộc và hợp đồng FE07 tại commit nguồn `7bf76b5`.
- Đầu ra: bộ FE07 tiếng Việt bảo toàn luồng yêu cầu/phê duyệt/từ chối/bàn giao/trả/gia hạn, hạn mức hằng ngày và giới hạn bản sao đang mượn.

- [ ] **Bước 1: Đọc FE07 và đánh dấu mọi câu chứa số hoặc phủ định**

Đọc sáu tệp; tập trung vào hạn mức hằng ngày 3/5 bản sao, 5 bản sao đang mượn, thời hạn mượn 14 ngày,
hạn chế do quá hạn/khoản phạt và chuyển đổi trạng thái.

- [ ] **Bước 2: Dịch FE07 bằng `apply_patch`**

Phân biệt Yêu cầu mượn, Duyệt yêu cầu, Bàn giao sách, Trả sách và Gia hạn; giữ nguyên entity, điểm
cuối, giá trị liệt kê, ID và mã lỗi nguồn.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-borrowing-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; đọc các hit mượn sách, trả sách, gia hạn, Due và Rejected theo giá
trị nguyên văn/văn xuôi.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra tính tương đương quy tắc nghiệp vụ**

Chạy cổng hoàn tất dùng chung. Đối chiếu từng `BR-FE07-*` và `AC-FE07-*` với bản nguồn, đặc biệt các
phép so sánh, ranh giới bao gồm/không bao gồm và tác nhân quyền sở hữu.

- [ ] **Bước 5: Cam kết FE07**

```powershell
git add -- .sdd/specs/feat-borrowing-management
git commit -m "docs: translate FE07 SDD package"
```

### Nhiệm vụ 9: Việt hóa FE08 đặt chỗ quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reservation-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reservation-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: FE07 terminology và FE08 queue/ứng viên quyền sở hữu hợp đồng.
- đầu ra: Bộ FE08 tiếng Việt giữ nguyên hàng đợi đặt chỗ, ứng viên danh mục, hold/expiry và one-open-đặt chỗ quy tắc.

- [ ] **Bước 1: Đọc FE08 và đối chiếu integration với FE07**

Đọc sáu tệp; đánh dấu mọi quy tắc queue order, eligibility, open đặt chỗ, conversion và quyền sở hữu.

- [ ] **Bước 2: Dịch FE08 bằng `apply_patch`**

Dùng “Đặt chỗ” cho đặt chỗ; giữ nguyên queue/ứng viên giá trị nguyên văn khi là trường, điểm cuối
hoặc giá trị liệt kê.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-reservation-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; phân loại đặt chỗ, Queue, Hold và ứng viên còn lại.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra ngữ nghĩa hàng đợi**

Chạy cổng hoàn tất dùng chung. Đối chiếu thứ tự queue, expiry, cancel, ứng viên quyền sở hữu và
integration với mượn sách yêu cầu.

- [ ] **Bước 5: Cam kết FE08**

```powershell
git add -- .sdd/specs/feat-reservation-management
git commit -m "docs: translate FE08 SDD package"
```

### Nhiệm vụ 10: Việt hóa FE09 khoản phạt quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-fine-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-fine-management/CHANGELOG.md`

**Giao diện:**
- Đầu vào: mốc cơ sở khoản phạt 5.000 VND/ngày/bản sao và hợp đồng dữ liệu trả sách FE07.
- Đầu ra: bộ FE09 tiếng Việt bảo toàn phép tính, nhóm hư hỏng/mất/quá hạn, trạng thái thanh toán và khả năng kiểm toán.

- [ ] **Bước 1: Đọc FE09 và đánh dấu công thức tính**

Đọc sáu tệp; chú ý ngày bắt đầu tính phạt, phép nhân theo ngày/bản sao, làm tròn, trạng thái đã thanh
toán/chưa thanh toán và ranh giới bên gọi.

- [ ] **Bước 2: Dịch FE09 bằng `apply_patch`**

Dùng “Quản lý khoản phạt”; giữ nguyên công thức, số liệu, giá trị liệt kê, trường, điểm cuối và mã lỗi.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-fine-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót và kiểm tra các giá trị nguyên văn khoản phạt, đã thanh toán,
Unpaid, Damaged, Lost, quá hạn.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra công thức**

Chạy cổng hoàn tất dùng chung. So sánh từng dấu điều kiện, ngày bắt đầu và số tiền với bản nguồn.

- [ ] **Bước 5: Cam kết FE09**

```powershell
git add -- .sdd/specs/feat-fine-management
git commit -m "docs: translate FE09 SDD package"
```

### Nhiệm vụ 11: Việt hóa FE10 thông báo quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-notification-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-notification-management/CHANGELOG.md`

**Giao diện:**
- đầu vào: FE02/FE04/FE07/FE08/FE09 event boundaries và FE10 delivery hợp đồng.
- đầu ra: Bộ FE10 tiếng Việt giữ nguyên mẫu, lần thử gửi thông báo, trạng thái gửi, retry, nhà cung cấp và OTP ranh giới.

- [ ] **Bước 1: Đọc FE10 theo producer-consumer luồng**

Đọc sáu tệp; xác định nguồn sự kiện, recipient, mẫu, persistence, attempt, trạng thái gửi và hoãn lại scope.

- [ ] **Bước 2: Dịch FE10 bằng `apply_patch`**

Dùng “Quản lý thông báo”; giữ nguyên nhà cung cấp, env var, mẫu key, event name, giá trị liệt kê,
điểm cuối và dữ liệu gửi trường.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-notification-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; kiểm tra thông báo, Delivery, Attempt, mẫu, Retry và nhà cung cấp còn lại.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra integration ranh giới**

Chạy cổng hoàn tất dùng chung. Đối chiếu caller quyền sở hữu, OTP isolation, delivery attempt và
ngoài phạm vi claim.

- [ ] **Bước 5: Cam kết FE10**

```powershell
git add -- .sdd/specs/feat-notification-management
git commit -m "docs: translate FE10 SDD package"
```

### Nhiệm vụ 12: Việt hóa FE11 người dùng & vai trò quản lý

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-user-role-management/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`

**Giao diện:**
- Đầu vào: mốc cơ sở số lượng vai trò, ranh giới thiết lập tài khoản FE02 và quyền sở hữu dữ liệu cá nhân FE03.
- Đầu ra: bộ FE11 tiếng Việt giữ nguyên ủy quyền Quản trị viên, thay thế nguyên tử một vai trò, nhật ký kiểm toán và các điều cấm sửa hồ sơ.

- [ ] **Bước 1: Đọc FE11 và lập ma trận quyền**

Đọc sáu tệp; đối chiếu Quản trị viên, Thủ thư hiện tại, Thành viên, các trường tự phục vụ, thay đổi
vai trò, kết quả kiểm toán và `ACCOUNT_SETUP`.

- [ ] **Bước 2: Dịch FE11 bằng `apply_patch`**

Dùng “Quản lý người dùng và vai trò”; giữ nguyên giá trị liệt kê vai trò, mã lỗi nguồn, hành động
kiểm toán, trường, điểm cuối và giao dịch giá trị nguyên văn.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-user-role-management' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; kiểm tra người dùng, vai trò, Audit, tài khoản Setup và Permission còn lại.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra quyền/atomicity**

Chạy cổng hoàn tất dùng chung. So sánh ma trận quyền, forbidden personal fields, vai trò replacement
cardinality và audit success/không đạt ngữ nghĩa.

- [ ] **Bước 5: Cam kết FE11**

```powershell
git add -- .sdd/specs/feat-user-role-management
git commit -m "docs: translate FE11 SDD package"
```

### Nhiệm vụ 13: Việt hóa FE12 Báo cáo và thống kê

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CONTEXT.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-reporting-statistics/CHANGELOG.md`

**Giao diện:**
- đầu vào: Deterministic báo cáo quy tắc và dữ liệu từ FE05-FE11.
- đầu ra: Bộ FE12 tiếng Việt giữ nguyên metric definitions, date boundaries, ủy quyền và deterministic policy.

- [ ] **Bước 1: Đọc FE12 và lập danh sách metric**

Đọc sáu tệp; đối chiếu công thức, khoảng ngày, timezone, ranh giới bao gồm/không bao gồm, tác nhân
và nguồn dữ liệu.

- [ ] **Bước 2: Dịch FE12 bằng `apply_patch`**

Dùng “Báo cáo và thống kê”; giữ nguyên metric key, trường, điểm cuối, SQL/mã nguồn, giá trị liệt kê
và số liệu.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/specs/feat-reporting-statistics' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; kiểm tra báo cáo, thống kê, Metric, khoảng ngày và Timezone còn lại.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra tính tương đương chỉ số**

Chạy cổng hoàn tất dùng chung. So sánh từng metric, filter, date ranh giới, tác nhân access và phản
hồi trường với bản nguồn.

- [ ] **Bước 5: Cam kết FE12**

```powershell
git add -- .sdd/specs/feat-reporting-statistics
git commit -m "docs: translate FE12 SDD package"
```

### Nhiệm vụ 14: Việt hóa RFC và ADR

**Tệp:**
- Sửa đổi: `.sdd/rfcs/README.md`
- Sửa đổi: `.sdd/rfcs/ADR-001-architecture.md`
- Sửa đổi: `.sdd/rfcs/ADR-002-database-design.md`
- Sửa đổi: `.sdd/rfcs/ADR-003-authentication-approach.md`
- Sửa đổi: `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- Sửa đổi: `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`

**Giao diện:**
- đầu vào: Thuật ngữ FE01-FE12 đã ổn định và quyết định kiến trúc tại bản ghi Git nguồn `7bf76b5`.
- Đầu ra: sáu tài liệu quyết định tiếng Việt giữ nguyên trạng thái, bối cảnh, quyết định, hệ quả, lược đồ và ranh giới tích hợp.

- [ ] **Bước 1: Đọc README và ADR-001 đến ADR-005 theo thứ tự**

Ghi nhận trạng thái quyết định, phương án thay thế, hệ quả, chính sách di chuyển dữ liệu và mọi tham
chiếu spec/lược đồ.

- [ ] **Bước 2: Dịch RFC/ADR bằng `apply_patch`**

Dịch văn xuôi và nhãn; giữ nguyên tên ADR, công nghệ, thư viện, đối tượng lược đồ, mã nguồn, điểm cuối,
đường dẫn, phiên bản và ID quyết định.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/rfcs' -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; kiểm tra các thuật ngữ kiến trúc, bối cảnh, quyết định, hệ quả và di
chuyển dữ liệu còn lại.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra quyết định kiến trúc**

Chạy cổng hoàn tất dùng chung. Đối chiếu đặc biệt ADR-002 chính sách di chuyển dữ liệu và
ADR-003/004/005 xác thực-tài khoản-thông báo boundaries.

- [ ] **Bước 5: Cam kết RFC/ADR**

```powershell
git add -- .sdd/rfcs
git commit -m "docs: translate SDD architecture decisions"
```

### Nhiệm vụ 15: Việt hóa rà soát nền tảng tháng 6

**Tệp:**
- Sửa đổi: `.sdd/reviews/README.md`
- Sửa đổi: `.sdd/reviews/db-instance-schema-drift-2026-06-22.md`
- Sửa đổi: `.sdd/reviews/hybrid-method-compliance-review-2026-06-22.md`
- Sửa đổi: `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/open-questions-review-verdict-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/phase-1-spec-closeout-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/review-phase-1-specs-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/week-2-spec-coverage-review-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/week-3-spec-finalization-closeout-2026-06-10.md`
- Sửa đổi: `.sdd/reviews/week-4-database-gap-review-2026-06-10.md`

**Giao diện:**
- đầu vào: Bản dịch nền tảng/spec/ADR và bằng chứng lịch sử tháng 6.
- đầu ra: Mười tài liệu rà soát tiếng Việt giữ nguyên verdict, gap, question resolution, độ lệch lược đồ và bằng chứng.

- [ ] **Bước 1: Đọc nhóm rà soát theo ngày và chủ đề**

Đọc các tệp ngày 2026-06-10 trước, sau đó 2026-06-22 và README; đánh dấu verdict, trạng thái, owner,
bằng chứng và unresolved/resolved claims.

- [ ] **Bước 2: Dịch mười tệp bằng `apply_patch`**

Dịch văn xuôi và nhãn; giữ nguyên ngày, bản ghi Git, đường dẫn, ID, đạt/không đạt giá trị nguyên
văn, lược đồ object và
trích dẫn kỹ thuật.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

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

Chạy quét phần tiếng Anh còn sót; xác nhận mọi trạng thái/bằng chứng giá trị nguyên văn tiếng Anh
còn lại là dữ kiện lịch sử phải giữ nguyên.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra tuyên bố lịch sử**

Chạy cổng hoàn tất dùng chung. So sánh verdict, resolved/unresolved trạng thái, độ lệch lược đồ và giai đoạn
khóa sổ với nguồn.

- [ ] **Bước 5: bản ghi Git rà soát tháng 6**

```powershell
git add -- $paths
git commit -m "docs: translate June SDD reviews"
```

### Nhiệm vụ 16: Việt hóa rà soát ngày 13-15 tháng 7

**Tệp:**
- Sửa đổi: `.sdd/reviews/app-shell-ux-validation-review-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/authentication-otp-ux-validation-review-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/fe07-b6-validation-review-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/fe07-b7-integration-review-closeout-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/fe07-fe08-borrowing-reservation-integration-validation-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/fe08-b7-integration-review-closeout-2026-07-13.md`
- Sửa đổi: `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`
- Sửa đổi: `.sdd/reviews/fe12-b6-validation-review-2026-07-13.md`
- Sửa đổi: `.sdd/reviews/fe12-b7-integration-review-closeout-2026-07-13.md`
- Sửa đổi: `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/library-ux-slice3-operational-consistency-analysis-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/library-ux-slice3-validation-review-2026-07-15.md`
- Sửa đổi: `.sdd/reviews/system-integration-evidence-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/week11-coverage-evidence-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/week11-e2e-evidence-2026-07-14.md`
- Sửa đổi: `.sdd/reviews/week12-security-audit-2026-07-14.md`

**Giao diện:**
- đầu vào: Bản dịch FE02, FE07, FE08, FE10, FE12 và UX/bảo mật terminology.
- đầu ra: Mười bảy rà soát tiếng Việt giữ nguyên cổng B6/B7, bằng chứng tích hợp, E2E kết quả và kiểm toán bảo mật.

- [ ] **Bước 1: Đọc nhóm rà soát theo chức năng và cổng**

Đọc FE08/FE10/FE12 ngày 13, FE07/system/week bằng chứng ngày 14, rồi xác thực/UX/integration ngày 15; lập
đối chiếu đạt/không đạt và khóa sổ claim.

- [ ] **Bước 2: Dịch mười bảy tệp bằng `apply_patch`**

Dịch văn xuôi/nhãn nhưng giữ nguyên B6/B7, kiểm thử name, tuyến, command, bản ghi Git, CI kết quả,
screenshot path và bảo mật giá trị nguyên văn.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter '*.md' | Where-Object { $_.Name -match '2026-07-(13|14|15)\.md$' } | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 17`, rồi chạy quét phần tiếng Anh còn sót và đọc từng hit bằng chứng/cổng.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra tính tương đương bằng chứng**

Chạy cổng hoàn tất dùng chung. Xác nhận mọi đạt/không đạt, B6/B7, bản ghi Git, CI, kiểm thử count và hoãn lại
ranh giới giữ nguyên.

- [ ] **Bước 5: bản ghi Git rà soát ngày 13-15**

```powershell
git add -- $paths
git commit -m "docs: translate mid-July SDD reviews"
```

### Nhiệm vụ 17: Việt hóa rà soát FE11 ngày 18 tháng 7

**Tệp:**
- Sửa đổi: `.sdd/reviews/fe11-admin-console-context-drift-audit-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-admin-role-ui-contract-validation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-audit-log-validation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-evidence-metadata-validation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-fast-track-batch-1-closeout-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-safe-user-list-detail-validation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-transactional-role-management-validation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/fe11-user-list-envelope-validation-2026-07-18.md`

**Giao diện:**
- Đầu vào: bản dịch FE11, thuật ngữ luồng nhanh H1/H2/H3 và quy tắc quyền sở hữu của Quản trị viên.
- Đầu ra: mười bản rà soát FE11 tiếng Việt bảo toàn cổng phê duyệt, bằng chứng siêu dữ liệu, giao dịch và kết quả kiểm toán.

- [ ] **Bước 1: Đọc mười tệp theo thứ tự phụ thuộc**

Đọc H1 → hợp đồng/bằng chứng xác thực → giao dịch vai trò/kiểm toán → danh sách/chi tiết an toàn → khóa
sổ; ghi nhận thẩm quyền và ranh giới cổng.

- [ ] **Bước 2: Dịch nhóm FE11 bằng `apply_patch`**

Dịch văn xuôi/nhãn; giữ nguyên H1/H2/H3, B7, giá trị liệt kê vai trò, hành động kiểm toán, trường
cấu trúc bao, kiểm thử/bản ghi Git/PR/CI bằng chứng.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter 'fe11-*-2026-07-18.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 10`, rồi chạy quét phần tiếng Anh còn sót và phân loại cổng/giá trị nguyên văn.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra authority ngữ nghĩa**

Chạy cổng hoàn tất dùng chung. Đối chiếu ai phê duyệt H1/H2/H3, hành động nào được phép, bằng chứng
nào là historical và ranh giới nào còn hoãn lại.

- [ ] **Bước 5: bản ghi Git rà soát FE11 ngày 18**

```powershell
git add -- $paths
git commit -m "docs: translate FE11 fast-track reviews"
```

### Nhiệm vụ 18: Việt hóa rà soát ngày 19 tháng 7

**Tệp:**
- Sửa đổi: `.sdd/reviews/fe01-public-book-envelope-decision-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe02-auth-debt-closure-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe04-membership-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe05-book-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe06-inventory-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe09-fine-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe10-otp-security-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe11-admin-navigation-permissions-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/fe12-deterministic-policy-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/full-reconciliation-human-acceptance-packet-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/full-reconciliation-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
- Sửa đổi: `.sdd/reviews/phase3-final-validation-2026-07-19.md`

**Giao diện:**
- đầu vào: Toàn bộ FE01-FE12 đã dịch và đầy đủ-reconciliation terminology.
- đầu ra: Mười tám rà soát tiếng Việt giữ nguyên acceptance, live SQL, deterministic policy, reconciliation và giai đoạn-exit bằng chứng.

- [ ] **Bước 1: Đọc rà soát chức năng trước, rà soát tổng hợp sau**

Đọc FE01-FE12 xác thực theo số FE, rồi đầy đủ reconciliation, giai đoạn 2 exit và giai đoạn 3 final;
đánh dấu mọi claim phụ thuộc bằng chứng.

- [ ] **Bước 2: Dịch mười tám tệp bằng `apply_patch`**

Dịch văn xuôi/nhãn; giữ nguyên bản ghi Git, PR, CI, SQL kết quả, percentage, kiểm thử count, giá trị
trạng thái nguyên văn, giới hạn và tương lai ranh giới.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = Get-ChildItem '.sdd/reviews' -File -Filter '*-2026-07-19.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
Test-SddTranslationInvariant -Paths $paths
```

Xác nhận `$paths.Count -eq 18`, rồi chạy quét phần tiếng Anh còn sót và đọc từng hit bằng chứng/kết quả.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra completion claims**

Chạy cổng hoàn tất dùng chung. Đối chiếu phần hoàn tất/hoãn lại/ngoài phạm vi, nghiệm thu của con người, live
SQL và giai đoạn-exit claim với bản nguồn.

- [ ] **Bước 5: bản ghi Git rà soát ngày 19**

```powershell
git add -- $paths
git commit -m "docs: translate reconciliation and phase reviews"
```

### Nhiệm vụ 19: Việt hóa rà soát ngày 20-27 tháng 7

**Tệp:**
- Sửa đổi: `.sdd/reviews/admin-authenticated-ux-correction-validation-2026-07-22.md`
- Sửa đổi: `.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md`
- Sửa đổi: `.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md`
- Sửa đổi: `.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md`
- Sửa đổi: `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`
- Sửa đổi: `.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md`
- Sửa đổi: `.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md`
- Sửa đổi: `.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md`

**Giao diện:**
- đầu vào: FE07/FE08/FE10/FE11/FE12 translations, bản địa hóa giao diện vocabulary và final quản trị quy tắc.
- đầu ra: Tám rà soát tiếng Việt giữ nguyên H3, khắc phục, môi trường tiền sản xuất email, bản địa hóa giao diện và khóa sổ quản trị bằng chứng.

- [ ] **Bước 1: Đọc tám tệp theo thứ tự ngày**

Đọc ngày 20 → 22 → 23 → 27; ghi nhận final-quản trị authority, UI correction, H3 khắc phục,
email môi trường tiền sản xuất và nghiệp vụ-quy tắc alignment.

- [ ] **Bước 2: Dịch tám tệp bằng `apply_patch`**

Dịch văn xuôi/nhãn; giữ nguyên H3, bản ghi Git, PR, CI, môi trường tiền sản xuất URL, nhà cung cấp phản hồi,
screenshot, kiểm thử và giá trị trạng thái nguyên văn.

- [ ] **Bước 3: Chạy điều kiện bất biến và quét phần tiếng Anh còn sót**

```powershell
$paths = @(
 '.sdd/reviews/admin-authenticated-ux-correction-validation-2026-07-22.md', '.sdd/reviews/admin-console-full-refactor-validation-2026-07-22.md',
 '.sdd/reviews/fe07-fe08-fe10-fe12-h3-remediation-validation-2026-07-23.md', '.sdd/reviews/fe07-fe10-fe12-business-rule-alignment-validation-2026-07-27.md',
 '.sdd/reviews/final-governance-closeout-validation-2026-07-20.md', '.sdd/reviews/governance-release-reconciliation-validation-2026-07-20.md',
 '.sdd/reviews/staging-email-delivery-remediation-validation-2026-07-27.md', '.sdd/reviews/vietnamese-ui-localization-validation-2026-07-20.md'
)
Test-SddTranslationInvariant -Paths $paths
```

Chạy quét phần tiếng Anh còn sót; xác nhận bằng chứng/giá trị nguyên văn còn lại được phép giữ nguyên.

- [ ] **Bước 4: Chạy cổng hoàn tất và kiểm tra tuyên bố trạng thái gần nhất**

Chạy cổng hoàn tất dùng chung. Đối chiếu ngày, nhánh/bản ghi Git, H3 authority, môi trường tiền sản xuất
kết quả, phạm vi bản địa hóa giao diện và các giới hạn còn lại.

- [ ] **Bước 5: bản ghi Git rà soát ngày 20-27**

```powershell
git add -- $paths
git commit -m "docs: translate final SDD validation reviews"
```

### Nhiệm vụ 20: Việt hóa kỹ năng nội bộ và kiểm tra toàn cục

**Tệp:**
- Sửa đổi: `.sdd/skills/README.md`
- xác minh: Toàn bộ 149 tệp `.sdd/**/*.md`
- Xác minh: `docs/superpowers/specs/2026-07-28-vietnamese-sdd-documentation-design.md`
- Xác minh: `docs/superpowers/plans/2026-07-28-vietnamese-sdd-documentation.md`

**Giao diện:**
- đầu vào: Tất cả output của Tasks 1-19.
- đầu ra: Bộ `.sdd` hoàn chỉnh bằng tiếng Việt, báo cáo kiểm chứng sạch và lịch sử bản ghi Git có thể rà soát theo lớp.

- [ ] **Bước 1: Dịch kỹ năng README bằng `apply_patch`**

Dịch nội dung hướng dẫn trong `.sdd/skills/README.md`; giữ nguyên tên folder, tên tệp, lệnh và định
danh kỹ thuật.

- [ ] **Bước 2: Chạy điều kiện bất biến trên toàn bộ 149 tệp**

```powershell
$paths = Get-ChildItem '.sdd' -Recurse -File -Filter '*.md' | ForEach-Object { $_.FullName.Substring((Resolve-Path '.').Path.Length + 1).Replace('\','/') }
if ($paths.Count -ne 149) { throw "Expected 149 Markdown files under .sdd, found $($paths.Count)." }
Test-SddTranslationInvariant -Paths $paths
```

Kết quả mong đợi: `PASS: 149 files preserved`.

- [ ] **Bước 3: Chạy quét tiếng Anh toàn cục**

Chạy English quét phần tiếng Anh còn sót với toàn bộ `$paths`. Sau đó chạy thêm:

```powershell
rg -n -i '^#{1,6}\s+.*\b(Overview|Context|Goal|Scope|Actors|Permissions|Preconditions|Flows|Rules|Requirements|Criteria|Cases|Dependencies|Questions|Traceability|Validation|Evidence|Result|Decision|Consequences)\b' -- $paths
if ($LASTEXITCODE -gt 1) { throw "Global heading scan failed to run." }
```

Kết quả mong đợi: không còn heading tiếng Anh ngoài tên riêng hoặc giá trị nguyên văn kỹ thuật đã
được hợp đồng cho phép.

- [ ] **Bước 4: Chạy kiểm tra cấu trúc, khả năng truy vết và phạm vi khác biệt**

```powershell
git diff --check 7bf76b5...HEAD
if ($LASTEXITCODE -ne 0) { throw "Repository diff check failed." }
npm run trace:enforce
if ($LASTEXITCODE -ne 0) { throw "Traceability enforcement failed." }
$changed = git diff --name-only 7bf76b5...HEAD
$unexpected = $changed | Where-Object { $_ -notmatch '^\.sdd/.+\.md$' -and $_ -notmatch '^docs/superpowers/(specs|plans)/2026-07-28-vietnamese-sdd-documentation(-design)?\.md$' }
if ($unexpected) { $unexpected; throw "Out-of-scope files changed." }
```

Kết quả mong đợi: không có lỗi khác biệt, khả năng truy vết đạt yêu cầu và không có tệp mã
nguồn/thời gian chạy
trong `$unexpected`.

- [ ] **Bước 5: Đọc khác biệt tổng theo khu vực rủi ro**

```powershell
git diff --stat 7bf76b5...HEAD
git diff 7bf76b5...HEAD -- .sdd/constraints .sdd/specs/*/SPEC.md .sdd/rfcs
```

Đọc thủ công mọi câu chứa `only`, `must`, `must not`, `cannot`, `at most`, `at least`, điều kiện phủ
định, tác nhân permission, số tiền, số ngày và trạng thái; xác nhận bản dịch không đảo nghĩa hoặc mở
rộng phạm vi.

- [ ] **Bước 6: bản ghi Git kỹ năng README và khóa sổ tài liệu**

```powershell
git add -- .sdd/skills/README.md
git commit -m "docs: complete Vietnamese SDD translation"
git status --short --branch
```

Kết quả mong đợi: working tree sạch; nhánh chỉ chứa các bản ghi Git tài liệu kế tiếp bản ghi Git
nguồn `7bf76b5`.

## Cổng đánh giá con người cuối cùng

Trước khi đẩy lên kho từ xa hoặc mở yêu cầu hợp nhất, người duyệt cần kiểm tra tối thiểu:

1. `.sdd/constitution.md`, `.sdd/shared_context.md` và ba ràng buộc tệp.
2. `SPEC.md` của FE02, FE07, FE09 và FE11 vì đây là các chức năng có rủi ro bảo mật/nghiệp vụ-quy tắc cao.
3. ADR-002, ADR-003, ADR-004 và ADR-005.
4. Một rà soát lịch sử từ mỗi nhóm Tasks 15-19.
5. Báo cáo điều kiện bất biến, khả năng truy vết, phần tiếng Anh còn sót và ngoài phạm vi khác biệt của Nhiệm vụ 20.

Không đẩy lên kho từ xa, tạo PR hoặc hợp nhất nếu chưa có yêu cầu tiếp theo của người dùng và chưa
vượt qua cổng rà soát tương ứng của kho mã nguồn.
