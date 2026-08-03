# Kế hoạch triển khai chế độ phân phối kết hợp nhanh chóng

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Kích hoạt mô hình quản trị luồng nhanh đã sửa chữa thông qua tài liệu PR đã được xem
xét và chuẩn bị FE11 Lô 1 cho TD-024, TD-026 và TD-027 mà không thay đổi hành vi của sản phẩm.

**Kiến trúc:** Trưởng nhóm Tích hợp là người viết duy nhất trong cây công việc điều khiển. Các hợp
đồng kiểm kê làn đường chỉ đọc và bằng chứng song song. H1 đánh giá gói kích hoạt quản trị chính
xác; Các đánh giá H2 sau đó đã tạo ra việc triển khai hoặc bằng chứng SPEC khác biệt trước khi cam
kết; H3 thực hiện đánh giá tích hợp cuối cùng sau khi kiểm tra PR được yêu cầu.

**Tech bộ công nghệ:** Tạo tác Markdown SDD, cây/nhánh Git, PowerShell, `rg`, trình kiểm tra truy vết
Node.js, GitHub CLI, FE11/FE12 hiện có hợp đồng và bằng chứng.

## Ràng buộc toàn cầu

- mốc cơ sở là `origin/main@1eb426196ebbc80339e2aed4558270967cd7269e` trừ khi cam kết `main` không chồng chéo mới hơn được chấp nhận rõ ràng.
- Kế hoạch này chỉ thay đổi các hồ sơ quản trị, lập kế hoạch và bằng chứng; nó không thay đổi phần máy chủ, giao diện người dùng, cơ sở dữ liệu, lược đồ, phần phụ thuộc hoặc cấu hình thời gian chạy.
- Giữ toàn bộ chức năng FE11 `Implementation State: DEFERRED`.
- Phạm vi của Lô 1 chỉ có `TD-024`, `TD-026` và `TD-027`.
- Giữ `TD-023` và `TD-025` `OPEN`; thứ tự của họ là dự báo sự phụ thuộc, không phải ủy quyền triển khai.
- Sử dụng tối đa ba làn, nhưng chỉ Trưởng nhóm tích hợp ghi tệp vào cây làm việc điều khiển.
- H2 là bản đánh giá đầu ra AI được cam kết trước tại địa phương. H3 là bản đánh giá tích hợp PR cuối cùng sau khi kiểm tra bắt buộc.
- Không cam kết hoặc đẩy chênh lệch kích hoạt quản trị trước khi phê duyệt H1.
- Không bắt đầu triển khai sản phẩm trước khi PR kích hoạt quản trị hợp nhất vào `main`.
- Chuẩn bị song song TD-027 chỉ đọc, nhưng tuần tự hóa bản chỉnh sửa `SPEC.md` thực tế của nó sau khi hợp nhất TD-026.
- Hãy dừng ngay lập tức nếu hợp đồng không rõ ràng, lệch lõi chồng chéo, lộ bí mật, mở rộng quyền/lược đồ/auth/API, giả định tác nhân không tương thích hoặc kiểm tra bắt buộc không thành công.

---

### Nhiệm vụ 1: Hòa giải cơ quan quản lý

**Tệp:**
- Sửa đổi: `.sdd/constitution.md`
- Sửa đổi: `.agents/AGENTS.md`
- Sửa đổi: `.agents/CLAUDE.md`
- Sửa đổi: `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`

**Giao diện:**
- Tiêu thụ: khái niệm luồng nhanh đã được phê duyệt và các phát hiện của người xác minh trước H1.
- Tạo ra: một mô hình quyền hạn H1/H2/H3 không xung đột.

- [x] **Bước 1: Bảo quản mốc cơ sở đã phân lập**

Chạy:

```powershell
git rev-parse --show-toplevel
git branch --show-current
git rev-parse origin/main
```

Dự kiến: cây công việc được liên kết `fe11-role-ui-contract`, nhánh `docs/fast-track-delivery-mode`
và `1eb426196ebbc80339e2aed4558270967cd7269e` cơ sở.

- [x] **Bước 2: Thứ tự xem xét Hiến pháp đúng đắn**

Sử dụng phiên bản `0.1.1` và yêu cầu:

```markdown
- Các thay đổi do AI tạo ra có thể nhận được đánh giá đầu ra bắt buộc của con người tại địa phương trước khi chúng được cam kết hoặc xuất bản dưới dạng yêu cầu hợp nhất.
- Mọi yêu cầu hợp nhất phải vượt qua các bước kiểm tra tự động có sẵn trước khi có sự đánh giá tích hợp cuối cùng của con người và phê duyệt hợp nhất.
- Đánh giá đầu ra cục bộ không bao giờ cho phép hợp nhất; phê duyệt hợp nhất vẫn là một quyết định tích hợp sau kiểm tra riêng biệt.
```

- [x] **Bước 3: Chỉnh sửa quy định về thiết kế luồng nhanh và đại lý**

Khóa những ý nghĩa này:

- H1 xem xét lô và khác biệt kích hoạt chính xác chỉ có tài liệu.
- H1 cho phép cam kết kích hoạt/PR đã được xem xét, không cho phép hợp nhất nó.
- H2 đánh giá việc triển khai cục bộ sau này hoặc bằng chứng về sự khác biệt của SPEC trước khi cam kết.
- H3 áp dụng trước mỗi lần hợp nhất PR sau khi kiểm tra bắt buộc.
- Kích hoạt nhiệm vụ/nợ chỉ có hiệu lực trên `main`.
- Các chỉnh sửa `SPEC.md` được chia sẻ được đăng theo thứ tự.

- [x] **Bước 4: Xác thực tính nhất quán trong quản trị**

Chạy:

```powershell
rg -n "local human output review|final human integration review|H2 - Local|H3 - Final|governance activation|authoritative only after" .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md
git diff --check -- .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md
```

Dự kiến: tất cả các điểm đánh dấu thẩm quyền đều tồn tại và phần kiểm tra khác biệt trống.

---

### Nhiệm vụ 2: Khóa hợp đồng kiểm toán TD-024

**Tệp:**
- Tạo: `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`

**Giao diện:**
- Tiêu thụ: Hợp đồng FE11 `q/action/actorId/from/to/page/limit` và mọi nhà văn AuditLogs hiện tại.
- Tạo ra: điểm cuối Quản trị viên chính xác, dự báo, ngừng hoạt động, kiểm tra và quyền sở hữu cho TD-024.

- [x] **Bước 1: Kiểm kê các tác giả và độc giả hiện tại**

Chạy:

```powershell
rg -n "GET.*api/admin/audit-logs|q\?|actorId\?|from\?|to\?" .sdd/specs/feat-user-role-management/SPEC.md
rg -n "action:\s*'[^']+'|writeAudit\([^\r\n]*'[^']+'|INSERT INTO AuditLogs" backend/src/services backend/src/repositories --glob '*.js'
rg -n "audit-logs|listAuditLogs|fetchAuditLogs|Metadata" backend/src frontend/src backend/tests frontend/test
```

Dự kiến: tên truy vấn chuẩn, hành động nhiều chức năng, lộ trình nguyên mẫu, hành vi chỉ trang/giới
hạn và độ lệch siêu dữ liệu thô đều hiển thị.

- [x] **Bước 2: Khóa thiết kế từ chối mặc định nhận biết hành động**

Thiết kế phải nêu rõ:

- Chỉ `GET /api/admin/audit-logs`.
- Tên truy vấn vẫn là `q`, `action`, `actorId`, `from`, `to`, `page`, `limit`.
- Tất cả các hàng liên tục đều đủ điều kiện; `action` thu hẹp chúng.
- JSON không hợp lệ, siêu dữ liệu vô hướng/mảng, hành động không xác định và hình dạng không hợp lệ trả về `details: {}`.
- Mỗi hành động hiện tại có một máy chiếu rõ ràng.
- Email thô, số nhận dạng, ID mã thông báo, đối tượng lồng nhau, ghi chú, lý do, tin nhắn và đường dẫn đều bị bỏ qua.
- Văn bản tự do chỉ được thay thế bằng các boolean `notesProvided`, `reasonProvided` hoặc `noteProvided`.
- Thông tin xác thực đệ quy/quyền phủ quyết bí mật chạy sau khi chiếu.
- Tuyến kế thừa trả về `404 NOT_FOUND` mà không cần gọi dịch vụ.
- `frontend/test/adminApi.test.js` sở hữu hợp đồng Quản trị viên API trực tiếp.

- [x] **Bước 3: Xác thực thiết kế Kiểm toán**

Chạy:

```powershell
rg -n 'Status: H1 REVIEW READY|`q`|`from`|Action-Aware Safe Projection|details: \{\}|404.*NOT_FOUND|frontend/test/adminApi.test.js' docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md
```

Dự kiến: mọi điểm đánh dấu hợp đồng đã sửa đều có mặt. Đừng cam kết.

---

### Nhiệm vụ 3: Khóa quyết định tái sử dụng TD-026 FE12

**Tệp:**
- Tạo: `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`

**Giao diện:**
- Tiêu thụ: FE11 `{ data, pagination }`, `summary` không có giấy tờ và FE12 `/api/reports/users` đã hoàn thành.
- Tạo ra: một nguồn tóm tắt không trùng lặp và dự báo phụ thuộc TD-023.

- [x] **Bước 1: Xác minh quyền sở hữu và phản hồi FE12**

Chạy:

```powershell
rg -n "BR-FE12-006|usersByStatus|usersByRole|/api/reports/users|B7 integration" .sdd/specs/feat-reporting-statistics/SPEC.md .sdd/specs/feat-reporting-statistics/TASKS.md .sdd/specs/feat-reporting-statistics/CHANGELOG.md backend/src/repositories/reportRepository.js backend/src/docs/openapi.yaml
rg -n "summary|setUserSummary|usersByRole|permissions" backend/src/repositories/userRepository.js frontend/src/page/UserManagement.jsx docs/api/api-contract.md
```

Dự kiến: FE12 đã cung cấp tổng số/trạng thái/số vai trò có thẩm quyền và danh sách FE11 vẫn phát ra
bản tóm tắt không có giấy tờ.

- [x] **Bước 2: Chọn Tùy chọn C**

Khóa ánh xạ này:

```text
total      <- totals.users
active     <- usersByStatus.ACTIVE || 0
inactive   <- usersByStatus.INACTIVE || 0
librarians <- usersByRole.LIBRARIAN || 0
```

Giữ `GET /api/users` chính xác là `{ data, pagination }`. Không tạo `/api/admin/user-summary`.
TD-023 vẫn nằm ngoài Lô 1 và không được lấy số đếm từ các hàng được phân trang.

- [x] **Bước 3: Xác thực quyết định**

Chạy:

```powershell
rg -n 'Option A|Option B|Option C|GET /api/reports/users|Do not create `/api/admin/user-summary`|TD-023 remains outside Batch 1' docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
git diff --check -- docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md
```

Dự kiến: Tái sử dụng FE12, không có điểm cuối mới và ranh giới phụ thuộc rõ ràng. Đừng cam kết.

---

### Nhiệm vụ 4: Sửa Ma trận bằng chứng TD-027

**Tệp:**
- Tạo: `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- Sửa đổi: `.sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md`

**Giao diện:**
- Tiêu thụ: cấu trúc bảng truy vết FE11 thực tế và bằng chứng B7 đã hợp nhất.
- Sản xuất: chính xác các tế bào hiện có để PR chỉ có bằng chứng sau này.

- [x] **Bước 1: Xác minh bằng chứng B7 về việc thiết lập tài khoản bị thiếu**

Chạy:

```powershell
git show -s --format='%H %P %s' c7f7821
git show -s --format='%H %P %s' e8f467c
git merge-base --is-ancestor c7f7821 e8f467c
gh run view 29392143926 --json databaseId,headSha,conclusion,status,name,url
```

Dự kiến: `c7f7821` được chứa bởi `e8f467c`; CI `29392143926` thành công trên `e8f467c`.

- [x] **Bước 2: Thêm bản ghi tích hợp B7 thiết lập tài khoản**

Ghi lại hai lần xác nhận và chạy CI trong bản đánh giá hiện có. Không yêu cầu hoàn thành toàn bộ chức năng.

- [x] **Bước 3: Khóa chính xác các hàng TD-027**

Sử dụng các nhóm này:

```text
COMPLETE AC: 001, 002, 003, 006, 010, 013..015, 020..022
COMPLETE unwanted FR: 015, 022, 024..027, 029, 037, 038
PARTIAL unwanted FR: 016, 017
UNCHANGED AC: 004, 005, 007..009, 011, 012, 016..019, 023
UNCHANGED unwanted FR: 018..021, 023, 028, 030..035
```

Cập nhật cả ô `Test Case` và `Status` sau. Không thêm các ô trạng thái FR mong muốn. Chỉ áp dụng
chỉnh sửa `SPEC.md` thực tế sau khi hợp nhất TD-026.

- [x] **Bước 4: Xác thực ma trận và bằng chứng B7**

Chạy:

```powershell
rg -n 'COMPLETE \(B7\)|FR-FE11-016|FR-FE11-017|PARTIAL|Rows That Must Remain Not Started|serial writer window|sole authority' .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md
rg -n 'B7 Integration Evidence|c7f7821|e8f467c|29392143926' .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md
git diff --check -- .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md
```

Dự kiến: có các ô thực tế, quyền sở hữu nối tiếp và bằng chứng tích hợp chính xác. Đừng cam kết.

---

### Nhiệm vụ 5: Quạt trong gói H1 đã sửa

**Tệp:**
- Tạo: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`
- Sửa đổi: `docs/superpowers/plans/2026-07-18-fast-track-hybrid-delivery-mode.md`

**Giao diện:**
- Tiêu thụ: Nhiệm vụ 1-4.
- Tạo ra: H1-001..H1-006, phạm vi kích hoạt chính xác, quyền sở hữu, xác thực và quy tắc dừng.

- [x] **Bước 1: Tạo gói H1**

Gói tin phải khóa:

- H1-001 đã sửa quyền quản trị.
- H1-002 đã sửa hợp đồng Kiểm toán.
- Tái sử dụng H1-003 FE12 và không có điểm cuối tóm tắt.
- Các tế bào TD-027 thực tế của H1-004.
- H1-005 `TD-024 -> TD-026 -> TD-027`; Chỉ dự báo TD-023/025.
- Tài liệu kích hoạt H1-006 PR + kiểm tra + H3 + hợp nhất.

- [x] **Bước 2: Chạy kiểm tra nhiều tạo phẩm**

Chạy:

```powershell
rg -n 'H1-001|H1-002|H1-003|H1-004|H1-005|H1-006|TD-024 -> TD-026 -> TD-027|H1 Approval Effect' .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'GET /api/admin/audit-logs|q.*action.*actorId.*from.*to|404.*NOT_FOUND' docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'Option C|/api/reports/users|no `/api/admin/user-summary`|no summary endpoint' docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
rg -n 'FR-FE11-016|FR-FE11-017|serial.*TD-026|existing.*Status' .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md
git diff --check
```

Dự kiến: mọi quyết định đều khớp với các tạo phẩm và kiểm tra khác biệt trống.

- [x] **Bước 3: Chạy xác thực chính sách kho lưu trữ**

Chạy:

```powershell
npm.cmd run trace:enforce
git status --short
git diff --name-only
git ls-files --others --exclude-standard
```

Dự kiến: truy vết ĐẠT. Chỉ các tệp quản trị/H1 được xem xét mới được thay đổi hoặc không bị theo
dõi. Đừng cam kết.

---

### Nhiệm vụ 6: Áp dụng H1, Đăng PR kích hoạt và Tiếp cận H3

**Tệp:**
- Sửa đổi: bốn dòng trạng thái tạo tác H1
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Sửa đổi: `TECH_DEBT.md`

**Giao diện:**
- Tiêu thụ: sự chấp thuận rõ ràng của con người đối với H1-001..H1-006.
- Tạo ra: tài liệu kích hoạt PR, cổng hợp nhất H3, trạng thái Lô 1 có thẩm quyền trên `main` và gói TD-024 chi tiết.

- [x] **Bước 1: Dừng để phê duyệt H1 rõ ràng**

Trình bày các kết quả khác biệt cục bộ, quyết định H1, danh sách tệp kích hoạt, thứ tự phụ thuộc,
quyền sở hữu và kết quả xác thực. Không tiếp tục cho đến khi con người chấp thuận rõ ràng
H1-001..H1-006.

- [x] **Bước 2: Đánh dấu tệp bàn giao H1 đã được phê duyệt**

Thay đổi:

```text
H1 REVIEW READY -> APPROVED BY HUMAN - 2026-07-18
```

trong:

- `docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md`
- `docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md`
- `.sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md`
- `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md`

Đồng thời thay đổi trạng thái thiết kế luồng nhanh:

```text
APPROVED CONCEPT - H1 REVISION REVIEW READY -> APPROVED BY HUMAN - 2026-07-18
```

Thêm vào gói H1:

```markdown
## Sự chấp thuận của con người

Được phê duyệt vào ngày 2026-07-18. H1-001..H1-006 bị khóa cho Lô 1.
```

- [x] **Bước 3: Sửa trạng thái lát FE11 và nối Lô 1 vào `PLAN.md`**

Thay đổi trạng thái hàng đầu thành:

```text
Status: APPROVED - BASELINE 2026-07-17; ACCOUNT SETUP, TRANSACTIONAL ROLE, SAFE LIST/DETAIL, AND ADMIN ROLE UI SLICES COMPLETE; FAST-TRACK BATCH 1 ACTIVE; REMAINING WORK DEFERRED
```

Nối thêm:

```markdown
## 13. Fast Track Đợt 1

### Phạm vi và thứ tự

1. `TD-024` / `FE11-AUD01`: ranh giới đọc Nhật ký kiểm tra của quản trị viên chuẩn.
2. `TD-026`/`FE11-ENV01`: khôi phục `{ data, pagination }` và tái sử dụng FE12 `/api/reports/users` cho bộ đếm.
3. `TD-027` / `FE11-META01`: áp dụng ma trận bằng chứng đã được phê duyệt sau khi hợp nhất TD-026.

`TD-023` và `TD-025` vẫn nằm ngoài Lô 1 và `OPEN`. Toàn bộ FE11 vẫn được hoãn lại.

### Cổng

- Khóa H1 Lô 1 và khác biệt kích hoạt quản trị chính xác.
- Cần có H2 trước mỗi lần triển khai được tạo hoặc khác biệt bằng chứng SPEC được cam kết và đẩy.
- Cần có H3 sau khi kiểm tra và trước mỗi lần hợp nhất PR.
- Phân tích TD-027 có thể chạy song song, nhưng bản chỉnh sửa `SPEC.md` của nó được xuất bản sau TD-026.
```

- [x] **Bước 4: Thêm tác vụ luồng nhanh vào `TASKS.md`**

Thay đổi trạng thái trên cùng để khớp với `PLAN.md`. Giữ:

```text
Implementation State: DEFERRED
```

Chèn trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ Lô 1 Chuyển nhanh

- [x] **FE11-FT01 - Phê duyệt và kích hoạt quản trị Lô 1.**
  - Phạm vi: TD-024, TD-026, TD-027.
  - Bằng chứng: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md` và PR kích hoạt quản trị được hợp nhất.

- [ ] **FE11-AUD01 - Triển khai ranh giới Nhật ký kiểm tra quản trị chuẩn.**
  - Bản đồ tới: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018; TD-024.
  - DoD: Tên truy vấn SPEC, xác thực ưu tiên quản trị viên, phép chiếu từ chối mặc định nhận biết hành động đa chức năng, phân trang SQL được lọc ổn định, di chuyển giao diện người dùng, bằng chứng `404 NOT_FOUND` kế thừa, L1-L4.

- [ ] **FE11-ENV01 - Khôi phục đường bao danh sách người dùng chuẩn bằng cách sử dụng số liệu thống kê FE12.**
  - Bản đồ tới: FR-FE11-001; AC-FE11-001; TD-026.
  - DoD: `/api/users` chỉ trả về `data` và `pagination`; Bản đồ quầy quản trị từ `/api/reports/users`; số lượng toàn cầu độc lập với các hàng trang.

- [ ] **FE11-META01 - Đối chiếu siêu dữ liệu bằng chứng FE11 đã hoàn thành.**
  - Bản đồ tới: TD-027.
  - Phụ thuộc vào: Hợp nhất TD-026 và cửa sổ ghi `SPEC.md` dẫn tích hợp nối tiếp.
  - DoD: chỉ thay đổi các ô Trạng thái/Trường hợp Kiểm thử hiện có đã được phê duyệt; yêu cầu và hàng hoãn lại không thay đổi; H2, kiểm tra, H3, hợp nhất và vượt qua bằng chứng tích hợp.
```

- [x] **Bước 5: Cập nhật `TEST_PLAN.md` và `CHANGELOG.md`**

Đặt phiên bản `TEST_PLAN.md` thành `0.3.3` và trạng thái thành:

```text
Status: ACCOUNT SETUP, TRANSACTIONAL ROLE, SAFE LIST/DETAIL, AND ADMIN ROLE UI SLICES COMPLETE THROUGH B7; FAST-TRACK BATCH 1 TARGETS ACTIVE; REMAINING FE11 TESTS PLANNED
```

Thay thế khoảng trống giao diện người dùng vai trò quản trị viên cũ bằng:

```markdown
- Giao diện người dùng hành động vai trò quản trị viên `FE11-UIR01..UIR05` hoàn tất thông qua B7; PR #30 và CI `29644292781` sau hợp nhất đã được thông qua và `TD-022` được giải quyết.
```

Thêm mục tiêu hiện tại:

```markdown
- Nhật ký kiểm tra quản trị viên chuẩn: Tên truy vấn SPEC, ủy quyền ưu tiên quản trị viên, xác thực/lọc đã nhập, thứ tự ổn định, phép chiếu từ chối mặc định nhận biết hành động và loại bỏ 404 cũ.
- Phong bì danh sách người dùng: không có `summary` cấp cao nhất; Bộ đếm quản trị sử dụng lại FE12 `/api/reports/users` với giá trị mặc định là số 0.
- Siêu dữ liệu bằng chứng: chỉ các ô Trạng thái/Trường hợp Kiểm thử hiện có được phê duyệt mới thay đổi trong cửa sổ nối tiếp sau TD-026.
```

Thêm vào đầu `CHANGELOG.md`:

```markdown
## 18-07-2026 - Kích hoạt đợt 1 nhanh chóng

- Đã phê duyệt H1-001..H1-006 cho TD-024, TD-026 và TD-027.
- Đã sửa quyền hạn H1/H2/H3 và yêu cầu tài liệu kích hoạt PR phải vượt qua kiểm tra và H3 trước khi hợp nhất.
- Nhật ký kiểm tra bị khóa đối với tên truy vấn SPEC và phép chiếu từ chối mặc định nhận biết hành động.
- Đã chọn FE12 `/api/reports/users` cho bộ đếm Quản trị viên và bảo toàn phong bì danh sách FE11.
- Đã phê duyệt chính xác ma trận TD-027 của ô hiện có và quyền sở hữu SPEC nối tiếp sau TD-026.
- Việc triển khai sản phẩm vẫn đang chờ xử lý các cổng H2 và H3 trên mỗi lát; toàn bộ FE11 vẫn được hoãn lại.
```

- [x] **Bước 6: Kích hoạt các hàng nợ tiềm năng trong PR khác biệt**

Chỉ thay đổi:

```text
TD-024 OPEN -> IN PROGRESS
TD-026 OPEN -> IN PROGRESS
TD-027 OPEN -> IN PROGRESS
```

Giữ `TD-023` và `TD-025` `OPEN`. Các trạng thái mới chỉ có hiệu lực sau khi hợp nhất PR kích hoạt.

- [x] **Bước 7: Xác thực khác biệt kích hoạt chính xác**

Chạy:

```powershell
npm.cmd run trace:enforce
git diff --check
rg -n "FE11-FT01|FE11-AUD01|FE11-ENV01|FE11-META01" .sdd/specs/feat-user-role-management/TASKS.md
rg -n "TD-024.*IN PROGRESS|TD-026.*IN PROGRESS|TD-027.*IN PROGRESS|TD-023.*OPEN|TD-025.*OPEN" TECH_DEBT.md
rg -n "Admin role-action UI.*complete through B7|29644292781" .sdd/specs/feat-user-role-management/TEST_PLAN.md
git status --short
```

Dự kiến: khả năng truy vết và kiểm tra khác biệt ĐẠT; chỉ những hồ sơ tài liệu/bằng chứng đã được
phê duyệt mới được thay đổi.

- [ ] **Bước 8: Cam kết và xuất bản PR kích hoạt đã được H1 xem xét**

Chạy:

```powershell
git add -- .sdd/constitution.md .agents/AGENTS.md .agents/CLAUDE.md docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md docs/superpowers/plans/2026-07-18-fast-track-hybrid-delivery-mode.md docs/superpowers/specs/2026-07-18-fe11-audit-log-contract-design.md docs/superpowers/specs/2026-07-18-fe11-user-list-envelope-decision.md .sdd/reviews/fe11-evidence-metadata-reconciliation-2026-07-18.md .sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md .sdd/reviews/auth-account-setup-boundary-validation-review-2026-07-15.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md TECH_DEBT.md
git commit -m "docs: activate fast-track FE11 batch 1"
git push -u origin docs/fast-track-delivery-mode
gh pr create --base main --head docs/fast-track-delivery-mode --title "docs: activate fast-track FE11 batch 1" --body "Activates the H1-reviewed Fast-Track governance package for TD-024, TD-026, and TD-027. No product code or runtime behavior changes."
```

Dự kiến: một PR chỉ có tài liệu được xuất bản. Không cần thêm lời nhắc cấp phép vì H1 đã xem xét bộ
cam kết chính xác.

- [ ] **Bước 9: Tạo gói chi tiết TD-024 trong một cây tài liệu riêng biệt trong khi chạy kiểm tra kích hoạt**

Tạo hoặc sử dụng lại cây/nhánh tài liệu riêng biệt mà không sửa đổi cây làm việc PR kích hoạt. Sử
dụng `writing-plans` ở đó để tạo `docs/superpowers/plans/2026-07-18-fe11-audit-log-contract.md`. Nó
có thể tinh chỉnh các bước triển khai nhưng không được thay đổi H1-002, quyền sở hữu tệp, tên truy
vấn, phạm vi hàng, chính sách máy chiếu, hành vi 404 cũ hoặc ranh giới xác thực. Không bắt đầu triển
khai sản phẩm và không thêm kế hoạch mới vào PR kích hoạt.

- [ ] **Bước 10: Yêu cầu kiểm tra và dừng H3**

Chạy:

```powershell
gh pr checks --watch
gh pr view --json number,state,mergeable,headRefOid,statusCheckRollup
```

Dự kiến: các bước kiểm tra bắt buộc đã vượt qua và PR có thể hợp nhất được. Trình bày bằng chứng
PR/kiểm tra và dừng lại để phê duyệt H3 rõ ràng.

- [ ] **Bước 11: Chỉ hợp nhất sau H3 và xác minh `main`**

Sau khi phê duyệt H3 rõ ràng:

```powershell
gh pr merge --merge
git fetch origin main
gh run list --branch main --workflow CI --limit 5 --json databaseId,headSha,status,conclusion,url
```

Liên kết chính xác `main` SHA sau hợp nhất với hoạt động CI của nó và chờ đợi thành công. Sau đó,
chỉ báo cáo có thẩm quyền của Lô 1 và cho phép triển khai TD-024 bắt đầu theo kế hoạch chi tiết và
ranh giới H2 của nó.

---

## Ranh giới hoàn thành kế hoạch

Kế hoạch này chỉ hoàn thành khi:

- H1-001..H1-006 được phê duyệt.
- PR kích hoạt quản trị chính xác vượt qua các bước kiểm tra bắt buộc, nhận H3, hợp nhất và có CI `main` sau hợp nhất thành công.
- Trạng thái lô 1 có thẩm quyền trên `main`.
- Kế hoạch triển khai TD-024 chi tiết đã sẵn sàng.

Không có mã sản phẩm backend/frontend nào thuộc gói này.
