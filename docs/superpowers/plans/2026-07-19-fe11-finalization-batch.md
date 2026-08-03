# FE11 Kế hoạch thực hiện đợt hoàn thiện

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi. Các tệp Shared lõi phải có một trình ghi nối tiếp; không gửi các trình ghi song song cho các tệp sản xuất Sóng A hoặc Sóng B.

**Mục tiêu:** Hoàn thành các yêu cầu Quản lý yêu cầu quản trị và vòng đời người dùng FE11 đã được
phê duyệt còn lại thông qua B7 bằng cách sử dụng một PR quản trị, hai đợt triển khai và một PR kết
thúc.

**Kiến trúc:** Sóng A bổ sung chức năng di chuyển SQL Server bình thường, đồng bộ hóa các hợp đồng
email/hồ sơ được chia sẻ, cập nhật/hủy kích hoạt các tuyến đường thông qua một kho lưu trữ vòng đời
giao dịch và loại bỏ đường vòng quản trị viên phát triển giao diện người dùng. đợt B giữ FE07 làm
chủ sở hữu thao tác ghi yêu cầu mượn duy nhất trong khi FE11 bổ sung DTO đọc quản trị viên được phân
trang, tải chi tiết có thẩm quyền, xuất CSV nhiều trang an toàn và chấp nhận trình duyệt theo chức
năng cụ thể.

**bộ công nghệ công nghệ:** Node.js, Express.js, `mssql`, SQL Server, Jest, Supertest, React 19,
Vite, Trình chạy kiểm thử nút, Playwright, OpenAPI 3.0 YAML, PowerShell, GitHub CLI.

## Ràng buộc toàn cầu

- Chế độ quyết định là Hybrid SDD + ADD ở Độ sâu đầy đủ: lược đồ, ủy quyền, đồng thời lạc quan, vô hiệu hóa thông tin xác thực, tính nguyên tử kiểm tra và quyền sở hữu FE07 là Cốt lõi; Bản trình bày của quản trị viên và thành phần CSV là lớp bao.
- Sử dụng chính xác bốn PR: kích hoạt quản trị, triển khai Sóng A, triển khai Sóng B và khóa tài liệu.
- Công việc sản xuất chỉ bắt đầu sau khi PR kích hoạt quản trị hợp nhất vào `main`.
- Các thay đổi triển khai đã tạo vẫn có sẵn cho đến khi đợt đó nhận được H2. H3 được yêu cầu sau khi kiểm tra PR và trước mỗi lần hợp nhất.
- `Users.Email` và `Notifications.RecipientEmail` là `NVARCHAR(255)`; `UserProfiles.Department` và `UserProfiles.Specialization` là `NVARCHAR(100)` có thể vô hiệu; `Users.DeactivatedAt` là `DATETIME` có thể vô hiệu.
- `fullName` vẫn được cắt bớt, bắt buộc và giới hạn ở 100 ký tự để khớp với FE03 và `UserProfiles.FullName`.
- `UserManagementView.updatedAt` là phiên bản không có giá trị rỗng `COALESCE(Users.UpdatedAt, Users.CreatedAt)`; cập nhật và hủy kích hoạt so sánh cùng một giá trị.
- `department` và `specialization` chỉ được trả về cho vai trò `LIBRARIAN` hiện tại và bị từ chối đối với các mục tiêu không phải Thư viện.
- `INACTIVE` cộng với null `DeactivatedAt` có nghĩa là `PENDING_ACTIVATION`; nó không phải là một kết quả vô hiệu hóa bình thường.
- Việc hủy kích hoạt sẽ thu hồi thông tin xác thực `REFRESH` đang hoạt động một cách nguyên tử; Mã thông báo truy cập đã xác thực trở nên không sử dụng được vì ID làm mới/phiên của chúng không còn phân giải được nữa.
- FE07 vẫn là chủ sở hữu duy nhất của `/api/borrow-requests/{requestId}/approve` và `/reject`; không thêm bí danh thao tác ghi của Quản trị viên.
- Tên truy vấn danh sách yêu cầu của quản trị viên chính xác là `page`, `limit`, `q`, `status`, `from` và `to`; các phím phản hồi chính xác là `data` và `pagination`.
- Không thêm phần phụ thuộc, khung di chuyển, bảng phiên, vai trò CRUD, chỉnh sửa quyền, thay đổi hành vi FE04, thay đổi sản xuất FE12 hoặc công cụ tái cấu trúc Bảng điều khiển dành cho quản trị viên không liên quan.
- Nếu SQL Server trực tiếp không có sẵn, chỉ giữ lại bằng chứng thực thi đó theo `TD-021`; mã bị thiếu, sự chấp nhận của trình duyệt hoặc bằng chứng di chuyển tĩnh không thể bị trì hoãn.

---

## Bản đồ tệp

### Tạo

- `database/migrations/2026-07-19-fe11-finalization.sql` - di chuyển lược đồ bình thường với kiểm tra trước và tính duy nhất của email xác định.
- `backend/src/repositories/userLifecycleRepository.js` - kết quả cập nhật lạc quan về giao dịch và kết quả hủy kích hoạt nguyên tử.
- `backend/tests/fe11SchemaMigration.test.js` - kiểm tra di chuyển tĩnh, mốc cơ sở, mô hình và độ rộng tham số.
- `backend/tests/accountSetupRepository.test.js` - kiểm tra hoạt động giao dịch-Quản trị viên, trùng lặp, nguồn thiết lập và khôi phục.
- `backend/tests/userRepository.test.js` - kiểm thử trình chiếu SQL an toàn, phiên bản hiệu quả và trường Thư viện.
- `backend/tests/userLifecycleRepository.test.js` - kiểm tra giao dịch, khóa, không hoạt động, cũ, trùng lặp, hủy kích hoạt, kiểm tra và khôi phục.
- `backend/tests/adminDashboardService.test.js` - các kiểm thử ranh giới quyền sở hữu DTO và FE12 chỉ đọc bằng chứng cho bảng thông tin hiện có.
- `backend/tests/adminRequestRepository.test.js` - phân trang có tiêu đề riêng biệt, bộ lọc số lượng/dữ liệu phù hợp, thứ tự ổn định và nhóm hàng an toàn.
- `backend/tests/adminRequestService.test.js` - kiểm tra trình chiếu và chuẩn hóa danh sách yêu cầu/chi tiết.
- `backend/tests/adminRequestRoutes.test.js` - Kiểm tra xác thực tuyến đường chi tiết/danh sách yêu cầu đầu tiên của quản trị viên.
- `frontend/src/utils/adminRequests.js` - truy vấn chuẩn, xuất phân trang và trợ giúp thoát CSV.
- `frontend/test/adminRequests.test.js` - kiểm thử trợ giúp xuất/truy vấn yêu cầu thuần túy.
- `tests/e2e/fe11-admin-console.spec.js` - Sự chấp nhận của trình duyệt Quản trị viên FE11 bị cô lập.
- `tests/e2e/support/fe11Fixtures.js` - Các thiết bị dịch vụ yêu cầu/người dùng chỉ dành cho E2E.
- `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md` - Bằng chứng sóng A L1-L4 và H2.
- `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md` - Bằng chứng sóng B L1-L4 và H2.
- `.sdd/reviews/fe11-finalization-closeout-2026-07-19.md` - bản ghi tích hợp B7 cuối cùng.

### Sửa đổi trong kích hoạt quản trị

- `.sdd/rfcs/ADR-002-database-design.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/specs/feat-auth/CHANGELOG.md`
- `.sdd/specs/feat-user-profile/SPEC.md`
- `.sdd/specs/feat-user-profile/CHANGELOG.md`
- `.sdd/specs/feat-notification-management/SPEC.md`
- `.sdd/specs/feat-notification-management/CHANGELOG.md`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `docs/api/api-contract.md`
- `TECH_DEBT.md`

### Sửa đổi ở sóng A

- `database/Librarymanagement.sql`
- `backend/src/models/User.js`
- `backend/src/models/UserProfile.js`
- `backend/src/models/Notification.js`
- `backend/src/repositories/userRepository.js`
- `backend/src/repositories/accountSetupRepository.js`
- `backend/src/repositories/notificationRepository.js`
- `backend/src/repositories/borrowingRepository.js` chỉ khi thứ tự khóa yêu cầu đầu tiên hiện tại phải được sửa thành thứ tự khóa thành viên FE07 đã được phê duyệt.
- `backend/src/services/userManagementService.js`
- `backend/src/controllers/userManagementController.js`
- `backend/src/routes/userManagementRoutes.js`
- `backend/src/validators/userManagementValidators.js`
- `backend/src/docs/openapi.yaml`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `backend/tests/userRoleRepository.test.js`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/models.test.js`
- `backend/tests/borrowingRepository.test.js`
- `backend/tests/sql/borrowingConcurrency.sqltest.js`
- `backend/tests/helpers/inMemoryAuthRepositories.js`
- `frontend/src/api/userManagementApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementApi.test.js`
- `frontend/test/userManagementFrontend.test.js`
- `docs/api/api-contract.md`

### Sửa đổi ở sóng B

- `backend/src/validators/adminValidators.js`
- `backend/src/repositories/adminRepository.js`
- `backend/src/services/adminService.js`
- `backend/src/controllers/adminController.js`
- `backend/src/routes/adminRoutes.js`
- `backend/src/docs/openapi.yaml`
- `backend/tests/adminBorrowingRouteBoundary.test.js`
- `backend/tests/borrowingRoutes.test.js`
- `backend/tests/borrowingRepository.test.js`
- `frontend/src/api/adminApi.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/adminApi.test.js`
- `frontend/test/userManagementFrontend.test.js`
- `tests/e2e/support/systemTestServer.js`
- `docs/api/api-contract.md`

### Sửa đổi khi kết thúc

- `.agents/CLAUDE.md`
- `.sdd/specs/feat-user-role-management/PLAN.md`
- `.sdd/specs/feat-user-role-management/TASKS.md`
- `.sdd/specs/feat-user-role-management/TEST_PLAN.md`
- `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- `.sdd/specs/feat-user-role-management/SPEC.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`
- `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`
- `TECH_DEBT.md`

## Giao diện bị khóa

```js
// backend/src/repositories/userLifecycleRepository.js
updateManagedUser({
  adminUserId: number,
  userId: number,
  expectedUpdatedAt: Date,
  changes: {
    email?: string,
    fullName?: string,
    phone?: string | null,
    address?: string | null,
    department?: string | null,
    specialization?: string | null,
  },
  ipAddress?: string | null,
  userAgent?: string | null,
  now?: Date,
}): Promise<{
  outcome: 'UPDATED' | 'NO_CHANGE' | 'ADMIN_NOT_FOUND' | 'ADMIN_REQUIRED' |
    'USER_NOT_FOUND' | 'STALE_USER_STATE' | 'EMAIL_ALREADY_EXISTS' |
    'LIBRARIAN_FIELDS_FORBIDDEN',
  changedFields?: string[],
}>

deactivateManagedUser({
  adminUserId: number,
  userId: number,
  expectedUpdatedAt: Date,
  ipAddress?: string | null,
  userAgent?: string | null,
  now?: Date,
}): Promise<{
  outcome: 'DEACTIVATED' | 'ALREADY_DEACTIVATED' | 'ADMIN_NOT_FOUND' |
    'ADMIN_REQUIRED' | 'USER_NOT_FOUND' | 'CANNOT_DEACTIVATE_SELF' |
    'STALE_USER_STATE' | 'ACCOUNT_PENDING_ACTIVATION' | 'ACTIVE_BORROWINGS_EXIST',
  activeBorrowingCount?: number,
}>
```

```js
// backend/src/repositories/adminRepository.js
listRequests({ page, limit, q, status, from, to }): Promise<{
  data: Array<AdminRequestListItem>,
  pagination: { page, limit, total, totalPages },
}>

// backend/src/services/adminService.js
getRequest(requestId): Promise<AdminRequestDetail>
```

```js
// frontend/src/utils/adminRequests.js
buildAdminRequestParams({ page, limit, q, status, from, to }): object
fetchAllAdminRequestRows(loadPage, filters): Promise<AdminRequestListItem[]>
buildAdminRequestCsv(rows): string
```

## Kéo yêu cầu và ma trận cổng

| PR | nhánh | Phạm vi | Cổng hợp nhất trước |
| --- | --- | --- | --- |
| 1 | `docs/fe11-finalization-batch-design` | Thiết kế, kế hoạch, kích hoạt quản trị, trạng thái hợp đồng/nợ/nhiệm vụ | Đánh giá, kiểm tra quản trị chính xác H1, H3 |
| 2 | `feat/fe11-finalization-wave-a` | Lược đồ và lõi vòng đời người dùng | H2, séc, H3 |
| 3 | `feat/fe11-finalization-wave-b` | Yêu cầu quản lý và chấp nhận trình duyệt | H2, séc, H3 |
| 4 | `docs/fe11-finalization-closeout` | Bằng chứng B7 cuối cùng và bộ nhớ dự án | H2, séc, H3 |

---

### Nhiệm vụ 1: Kích hoạt Quản trị lô Khóa sổ

**Tệp:** Các tệp quản trị được liệt kê trong Bản đồ tệp.

**Giao diện:**
- Tiêu thụ: cam kết thiết kế `086933d` đã được phê duyệt, bản chỉnh sửa được xem xét để xác định `updatedAt` hiệu quả và kế hoạch triển khai này.
- Tạo ra: các tác vụ đang hoạt động `FE11-FIN01..FE11-FIN02`, trạng thái nợ `IN PROGRESS` và lược đồ có thẩm quyền/hợp đồng API trước khi sản phẩm hoạt động.

- [ ] **Bước 1: Xác minh nhánh và đế thiết kế**

```powershell
git fetch origin main
git merge-base --is-ancestor f706c5457254db16401009e260dd9528aeb8c3c5 origin/main
git status --short --branch
git log -3 --oneline
```

Dự kiến: tổ tiên thoát khỏi `0`; nhánh có bản cam kết về thiết kế, quy hoạch được phê duyệt; không
có tập tin không liên quan là bẩn.

- [ ] **Bước 2: Cập nhật các hợp đồng nhiều chức năng có thẩm quyền**

Áp dụng các quyết định chính xác sau:

```markdown
- FE02: email tối đa 255; Quá trình di chuyển `deactivatedAt` đang hoạt động; FE11 phiên bản DTO được quản lý là `COALESCE(UpdatedAt, CreatedAt)`; Hành vi của FE02 không thay đổi.
- FE03: `UserProfiles.Department` và `Specialization` là các cột tùy chọn do quản trị viên FE11 quản lý và vẫn bị loại khỏi DTO đọc/cập nhật hồ sơ tự FE03; `fullName` vẫn ở mức tối đa 100.
- FE10: Độ bền của `recipientEmail` tối đa là 255; không có quyền sở hữu phân phối hoặc thay đổi quy tắc thông báo nhạy cảm.
- FE11: cập nhật/hủy kích hoạt sử dụng phiên bản không có giá trị hiệu lực; việc hủy kích hoạt đang chờ xử lý sẽ trả về `409 ACCOUNT_PENDING_ACTIVATION`; danh sách yêu cầu/hợp đồng chi tiết phù hợp với thiết kế đã được phê duyệt.
- ADR-002: đặt tên cho năm cột mục tiêu, `UX_Users_Email` xác định, đường dẫn tập lệnh bình thường và yêu cầu xác thực trực tiếp hai lần.
```

Trong `docs/api/api-contract.md`, ghi lại chính xác việc tạo, cập nhật, hủy kích hoạt, thiết lập-gửi
lại, danh sách yêu cầu và tải trọng chi tiết yêu cầu từ thiết kế. Không ghi lại bí danh thao tác ghi của
Quản trị viên.

- [ ] **Bước 3: Thêm nhóm nhiệm vụ Khóa sổ**

Nối nhóm này trước `## Deferred FE11 Work`:

```markdown
## Nhiệm vụ lô hoàn tất FE11

- [ ] **FE11-FIN01 - Phê duyệt và kích hoạt Lô Khóa sổ FE11.**
  - Bản đồ tới: TD-012, TD-014, TD-015, TD-016, TD-017, TD-025.
  - DoD: thiết kế/kế hoạch đã được phê duyệt, hợp đồng cốt lõi được đồng bộ hóa, quyền sở hữu hai đợt, lệnh xác thực và kích hoạt nợ được hợp nhất trước khi sản phẩm hoạt động.

- [ ] **FE11-LIFE01 - Thêm di chuyển lược đồ bình thường và các hợp đồng được đồng bộ hóa.**
  - Bản đồ tới: TD-012, TD-016; FR-FE11-010/021; Các phụ thuộc lược đồ chia sẻ FE02/FE03/FE10.
  - DoD: năm cột mục tiêu, tính duy nhất của email xác định, mô hình, liên kết, mốc cơ sở, kiểm tra tĩnh và bằng chứng trực tiếp hai lần tùy chọn đều đồng ý.

- [ ] **FE11-LIFE02 - Kiên trì và trả sách các trường của Thư viện một cách an toàn.**
  - Bản đồ tới: BR-FE11-015/026; FR-FE11-010/028; AC-FE11-011; TD-012.
  - DoD: tạo/đọc/cập nhật chỉ sử dụng các trường rỗng 100 ký tự cho các mục tiêu Thủ thư hiện tại và không hiển thị các trường giả cho các vai trò khác.

- [ ] **FE11-LIFE03 - Triển khai các bản cập nhật lạc quan và không hoạt động cho người dùng được quản lý.**
  - Bản đồ tới: BR-FE11-004/010/014/027; FR-FE11-004/007/020/021/023; AC-FE11-004/008/023; TD-014/015/016.
  - DoD: khóa tác nhân/mục tiêu, phiên bản hiệu quả, ánh xạ trùng lặp, hành vi không hoạt động, danh sách cho phép kiểm tra an toàn và khôi phục đã được chứng minh.

- [ ] **FE11-LIFE04 - Thực hiện vô hiệu hóa nguyên tử và vô hiệu hóa thông tin xác thực.**
  - Bản đồ tới: BR-FE11-003/006/010/015; FR-FE11-008/011/016..019/023; AC-FE11-007/009/012/023; TD-014/015/016.
  - DoD: bộ bảo vệ chế độ vòng đời, khối mượn hoạt động, việc thu hồi REFRESH, kiểm tra, khôi phục và tuần tự hóa phê duyệt FE07 đã được chứng minh.

- [ ] **FE11-LIFE05 - Căn chỉnh giao diện người dùng quản trị viên và xóa quyền truy cập quản trị viên phát triển tiềm ẩn.**
  - Bản đồ tới: NFR-FE11-SEC-001/002/004; AC-FE11-004/007/011/012/023; TD-017.
  - DoD: tất cả các chế độ yêu cầu trạng thái Quản trị viên được xác thực được lưu trữ; cập nhật/hủy kích hoạt gửi phiên bản hiệu quả và tải lại trạng thái có thẩm quyền.

- [ ] **FE11-LIFE06 - Tích hợp Pass đợt A H2/H3/B7.**
  - Phụ thuộc vào: FE11-LIFE01..FE11-LIFE05.

- [ ] **FE11-REQ01 - Canonicalize danh sách yêu cầu của Quản trị viên và đọc chi tiết.**
  - Bản đồ tới: BR-FE11-019/026; FR-FE11-034; AC-FE11-019; TD-025.

- [ ] **FE11-REQ02 - Căn chỉnh phân trang yêu cầu, chi tiết, hành động và giao diện người dùng CSV.**
  - Bản đồ tới: FR-FE11-034/035; AC-FE11-019; TD-025.

- [ ] **FE11-REQ03 - Chứng minh tính bất biến trạng thái đầu cuối của FE07.**
  - Bản đồ tới: BR-FE11-019; FR-FE11-035; FE07 yêu cầu bất biến trong vòng đời; TD-025.

- [ ] **FE11-ACC01 - Đạt được sự chấp nhận của trình duyệt FE11 và tích hợp đợt B.**
  - Phụ thuộc vào: FE11-REQ01..FE11-REQ03.

- [ ] **FE11-FIN02 - Xuất bản bản kết thúc FE11 B7 cuối cùng.**
  - Phụ thuộc vào: FE11-LIFE06, FE11-ACC01.
  - DoD: tất cả bốn PR và lần chạy CI chính chính xác đều được ghi lại; FE11 hoàn thiện đến B7; chỉ bằng chứng SQL trực tiếp không có sẵn mới có thể vẫn thuộc TD-021.
```

- [ ] **Bước 4: Kích hoạt các mục tiêu nợ và xác thực mà không cần yêu cầu thực hiện**

Thay đổi `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017` và `TD-025` thành `IN PROGRESS`. Giữ
`TD-021` `PARTIAL`. Thêm các phần TEST_PLAN cho các lệnh Sóng A và Sóng B, đồng thời thêm mục nhập
FE11 CHANGELOG cho biết rằng việc triển khai sản phẩm chưa bắt đầu.

Bỏ chọn mọi hộp kiểm nhiệm vụ mới, bao gồm `FE11-FIN01`, trong phần khác biệt quản trị. PR quản trị
hợp nhất cho phép thực thi nhưng bản thân nó không chứng minh được bất kỳ nhiệm vụ sản phẩm hoặc
nhiệm vụ tích hợp nào đã hoàn thành.

- [ ] **Bước 5: Trình bày sự khác biệt về quản trị chính xác cho H1**

```powershell
git diff --check
git diff --name-only
rg -n "FE11-FIN01|FE11-FIN02|TD-012.*IN PROGRESS|TD-025.*IN PROGRESS|TD-021.*PARTIAL" .sdd/specs/feat-user-role-management TECH_DEBT.md
git diff --binary | git hash-object --stdin
```

Dự kiến: chỉ có các tệp quản trị/tài liệu được thay đổi. Ghi lại hàm băm khác biệt và dừng cho H1.
Sau khi H1 xác nhận sự khác biệt chính xác này, hãy cam kết và xuất bản PR 1; mặt khác, sự khác biệt
về quản trị yêu cầu H2 trước khi cam kết.

- [ ] **Bước 6: Cam kết, xuất bản, lấy H3, hợp nhất và xác minh chính**

```powershell
git add -- .sdd/rfcs/ADR-002-database-design.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-user-profile/SPEC.md .sdd/specs/feat-user-profile/CHANGELOG.md .sdd/specs/feat-notification-management/SPEC.md .sdd/specs/feat-notification-management/CHANGELOG.md .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/PLAN.md .sdd/specs/feat-user-role-management/TASKS.md .sdd/specs/feat-user-role-management/TEST_PLAN.md .sdd/specs/feat-user-role-management/CHANGELOG.md docs/api/api-contract.md TECH_DEBT.md docs/superpowers/specs/2026-07-19-fe11-finalization-batch-design.md docs/superpowers/plans/2026-07-19-fe11-finalization-batch.md
git commit -m "docs: activate FE11 finalization batch"
git push -u origin docs/fe11-finalization-batch-design
gh pr create --base main --head docs/fe11-finalization-batch-design --title "docs: activate FE11 finalization batch" --body "Activates FE11-FIN01 and the approved two-wave Full-depth finalization contract. Product work remains blocked until this PR passes checks, receives H3, and merges."
gh pr checks --watch
```

Yêu cầu H3 với PR khác biệt và kiểm tra chính xác. Sau khi phê duyệt:

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$mergeSha = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $mergeSha --limit 5
```

Dự kiến: PR 1 và CI `main` chính xác của nó vượt qua trước khi Sóng A bắt đầu.

---

### Nhiệm vụ 2: Thêm hợp đồng di chuyển lược đồ Idempotent và chiều rộng

**Tệp:** Di chuyển, mốc cơ sở, mô hình, liên kết kho lưu trữ, tài liệu hợp đồng và kiểm tra lược đồ từ Sóng A.

**Giao diện:**
- Tiêu thụ: hợp đồng quản trị sáp nhập.
- Tạo ra: năm cột được đồng bộ hóa và tính bền vững của email FE11-to-FE10 gồm 255 ký tự.

- [ ] **Bước 1: Tạo cây công việc đợt A**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-wave-a -b feat/fe11-finalization-wave-a origin/main
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

- [ ] **Bước 2: Viết kiểm thử lược đồ tĩnh bị lỗi**

Tạo `backend/tests/fe11SchemaMigration.test.js` với các xác nhận tương đương với:

```js
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '../..');
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');

test('FE11 migration is guarded, transactional, and idempotent', () => {
  const sql = read('database/migrations/2026-07-19-fe11-finalization.sql');
  expect(sql).toMatch(/SET XACT_ABORT ON/i);
  expect(sql).toMatch(/BEGIN TRANSACTION/i);
  expect(sql).toMatch(/COL_LENGTH\('dbo\.Users', 'DeactivatedAt'\)/i);
  expect(sql).toMatch(/Department/i);
  expect(sql).toMatch(/Specialization/i);
  expect(sql).toMatch(/Notifications[\s\S]*RecipientEmail/i);
  expect(sql).toMatch(/UX_Users_Email/i);
  expect(sql).toMatch(/THROW/i);
  expect(sql).not.toMatch(/INSERT INTO Users|demo_admin|PasswordHash/i);
});

test('baseline, models, and SQL bindings use canonical widths', () => {
  expect(read('database/Librarymanagement.sql')).toMatch(/Email NVARCHAR\(255\)/);
  expect(read('database/Librarymanagement.sql')).toMatch(/RecipientEmail NVARCHAR\(255\)/);
  expect(read('backend/src/models/Notification.js')).toMatch(/NVARCHAR\(255\)/);
  expect(read('backend/src/repositories/accountSetupRepository.js')).toMatch(/Email', sql\.NVarChar\(255\)/);
  expect(read('backend/src/repositories/notificationRepository.js')).toMatch(/RecipientEmail', type: sql\.NVarChar\(255\)/);
});
```

- [ ] **Bước 3: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fe11SchemaMigration.test.js
```

Dự kiến: THẤT BẠI vì độ rộng di chuyển và độ rộng chuẩn không tồn tại.

- [ ] **Bước 4: Tạo di chuyển**

Triển khai `database/migrations/2026-07-19-fe11-finalization.sql` với hình dạng giao dịch này:

```sql
SET XACT_ABORT ON;

BEGIN TRY
  BEGIN TRANSACTION;

  IF OBJECT_ID('dbo.Users', 'U') IS NULL
     OR OBJECT_ID('dbo.UserProfiles', 'U') IS NULL
     OR OBJECT_ID('dbo.Notifications', 'U') IS NULL
    THROW 51000, 'Required FE11 tables are missing.', 1;

  IF EXISTS (
    SELECT LOWER(LTRIM(RTRIM(Email)))
    FROM dbo.Users
    GROUP BY LOWER(LTRIM(RTRIM(Email)))
    HAVING COUNT(*) > 1
  )
    THROW 51001, 'Users.Email contains case-insensitive duplicates.', 1;

  DECLARE @EmailIndexCount INT;
  DECLARE @EmailIndexName SYSNAME;
  DECLARE @EmailIndexIsConstraint BIT;
  DECLARE @EmailIndexKeyCount INT;
  DECLARE @EmailMaxLength SMALLINT;

  SELECT @EmailMaxLength = max_length
  FROM sys.columns
  WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'Email';

  SELECT @EmailIndexCount = COUNT(DISTINCT i.index_id)
  FROM sys.indexes i
  INNER JOIN sys.index_columns ic
    ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  INNER JOIN sys.columns c
    ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID('dbo.Users') AND c.name = 'Email';

  IF @EmailIndexCount > 1
    THROW 51002, 'Users.Email has unsupported multiple dependent indexes.', 1;

  SELECT TOP (1)
    @EmailIndexName = i.name,
    @EmailIndexIsConstraint = i.is_unique_constraint,
    @EmailIndexKeyCount = (
      SELECT COUNT(*)
      FROM sys.index_columns keys
      WHERE keys.object_id = i.object_id
        AND keys.index_id = i.index_id
        AND keys.key_ordinal > 0
    )
  FROM sys.indexes i
  INNER JOIN sys.index_columns ic
    ON ic.object_id = i.object_id AND ic.index_id = i.index_id
  INNER JOIN sys.columns c
    ON c.object_id = ic.object_id AND c.column_id = ic.column_id
  WHERE i.object_id = OBJECT_ID('dbo.Users') AND c.name = 'Email';

  IF @EmailIndexName IS NOT NULL AND (
    NOT EXISTS (
      SELECT 1 FROM sys.indexes
      WHERE object_id = OBJECT_ID('dbo.Users')
        AND name = @EmailIndexName
        AND is_unique = 1
    ) OR @EmailIndexKeyCount <> 1
  )
    THROW 51003, 'Users.Email has an unsupported dependent index.', 1;

  IF @EmailMaxLength <> 510 OR ISNULL(@EmailIndexName, '') <> 'UX_Users_Email'
  BEGIN
    IF @EmailIndexName IS NOT NULL
    BEGIN
      IF @EmailIndexIsConstraint = 1
        EXEC(N'ALTER TABLE dbo.Users DROP CONSTRAINT ' + QUOTENAME(@EmailIndexName));
      ELSE
        EXEC(N'DROP INDEX ' + QUOTENAME(@EmailIndexName) + N' ON dbo.Users');
    END;

    IF @EmailMaxLength <> 510
      ALTER TABLE dbo.Users ALTER COLUMN Email NVARCHAR(255) NOT NULL;
  END;

  IF COL_LENGTH('dbo.Users', 'DeactivatedAt') IS NULL
    ALTER TABLE dbo.Users ADD DeactivatedAt DATETIME NULL;
  ELSE IF EXISTS (
    SELECT 1
    FROM sys.columns c
    INNER JOIN sys.types t ON t.user_type_id = c.user_type_id
    WHERE c.object_id = OBJECT_ID('dbo.Users')
      AND c.name = 'DeactivatedAt'
      AND (t.name <> 'datetime' OR c.is_nullable = 0)
  )
    ALTER TABLE dbo.Users ALTER COLUMN DeactivatedAt DATETIME NULL;

  IF COL_LENGTH('dbo.UserProfiles', 'Department') IS NULL
    ALTER TABLE dbo.UserProfiles ADD Department NVARCHAR(100) NULL;
  ELSE IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.UserProfiles')
      AND name = 'Department'
      AND (max_length <> 200 OR is_nullable = 0)
  )
    ALTER TABLE dbo.UserProfiles ALTER COLUMN Department NVARCHAR(100) NULL;

  IF COL_LENGTH('dbo.UserProfiles', 'Specialization') IS NULL
    ALTER TABLE dbo.UserProfiles ADD Specialization NVARCHAR(100) NULL;
  ELSE IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.UserProfiles')
      AND name = 'Specialization'
      AND (max_length <> 200 OR is_nullable = 0)
  )
    ALTER TABLE dbo.UserProfiles ALTER COLUMN Specialization NVARCHAR(100) NULL;

  IF EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('dbo.Notifications')
      AND name = 'RecipientEmail'
      AND max_length <> 510
  )
    ALTER TABLE dbo.Notifications ALTER COLUMN RecipientEmail NVARCHAR(255) NOT NULL;

  IF NOT EXISTS (SELECT 1 FROM sys.indexes WHERE object_id = OBJECT_ID('dbo.Users') AND name = 'UX_Users_Email')
    CREATE UNIQUE INDEX UX_Users_Email ON dbo.Users(Email);

  COMMIT TRANSACTION;
END TRY
BEGIN CATCH
  IF @@TRANCOUNT > 0 ROLLBACK TRANSACTION;
  THROW;
END CATCH;
```

Lần thực thi thứ hai phải đạt COMMIT mà không bỏ/tạo lại chỉ mục xác định hoặc thay đổi cột.

- [ ] **Bước 5: Đồng bộ hóa mốc cơ sở, mô hình và liên kết**

Sử dụng `NVARCHAR(255)` cho mọi liên kết `Users.Email` trong `userRepository.js` và
`accountSetupRepository.js`, cũng như mọi liên kết `Notifications.RecipientEmail` trong
`notificationRepository.js`. Thêm `deactivatedAt` vào `User.js`, thêm hai trường hồ sơ vào
`UserProfile.js` và đặt chiều rộng mô hình Thông báo thành 255.

Trong tập lệnh cơ sở, hãy xóa công cụ sửa đổi `UNIQUE` nội tuyến ẩn danh khỏi `Users.Email` và thêm
`CREATE UNIQUE INDEX UX_Users_Email ON Users(Email);` sau định nghĩa bảng.

- [ ] **Bước 6: Chạy GREEN và hồi quy**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/fe11SchemaMigration.test.js tests/models.test.js tests/notificationRoutes.test.js tests/userManagementService.test.js
git diff --check
```

Dự kiến: ĐẠT. Đừng cam kết; ghi lại lý do RED và tổng số GREEN vào tệp xác thực Sóng A.

---

### Nhiệm vụ 3: Duy trì các trường của thủ thư và tăng cường các thao tác ghi trong thiết lập tài khoản

**Tệp:** `userRepository.js`, `accountSetupRepository.js`, `userManagementService.js`, bộ điều
khiển/tuyến/trình xác thực, kiểm tra kho lưu trữ/dịch vụ/tuyến đường, trình trợ giúp xác thực trong
bộ nhớ và tệp biểu mẫu giao diện người dùng.

**Giao diện:**
- Tiêu thụ: các cột chuẩn từ Nhiệm vụ 2.
- Tạo ra: `UserManagementView` với `updatedAt` không null, các trường Thủ thư được phân quyền theo vai trò và các kết quả tạo/gửi lại có thẩm quyền giao dịch.

- [ ] **Bước 1: Viết kiểm thử RED về kho lưu trữ và dịch vụ**

Thêm các kiểm thử khóa các kết quả chính xác này:

```js
await expect(userRepository.getManagedUserById(7)).resolves.toMatchObject({
  updatedAt: FIXED_CREATED,
});

expect(librarian).toMatchObject({
  roles: ['LIBRARIAN'],
  department: 'Reference',
  specialization: 'Research Support',
});
expect(member).not.toHaveProperty('department');
expect(member).not.toHaveProperty('specialization');
```

Tạo `accountSetupRepository.test.js` với kiểu giao dịch mô phỏng giống như
`userRoleRepository.test.js`. Chứng minh cả `createPendingAccount()` và `rotateSetupToken()` đều
khóa và xác nhận lại người dùng đang hoạt động trước bất kỳ thao tác ghi mục tiêu nào:

```js
test.each([
  ['missing actor', [], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }], 'ADMIN_REQUIRED'],
  ['non-admin actor', [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 0 }], 'ADMIN_REQUIRED'],
])('%s rolls back before setup-source mutation', async (_, actorRows, outcome) => {
  // Assert no Users/AuthTokens/AuditLogs INSERT or UPDATE occurs.
});
```

Đối với thao tác tạo, chứng minh khóa tác nhân diễn ra trước kiểm tra tính duy nhất của email/tên người dùng
bị khóa và mỗi lần chèn. Chứng minh email hiện có không phân biệt chữ hoa chữ thường và lỗi khóa
trùng lặp SQL Server đồng thời cho chỉ mục xác định `UX_Users_Email` đều quay lại và trả về
`EMAIL_ALREADY_EXISTS` mà không có yêu cầu gửi thiết lập. Duy trì xung đột tên người dùng xác định
hiện có mà không phân loại sai lỗi `2601`/`2627` không liên quan dưới dạng email.

Để gửi lại, hãy chứng minh khóa tác nhân đứng trước khóa lịch sử mục tiêu/thiết lập. Các tác nhân bị
thiếu, không hoạt động hoặc không phải Quản trị viên phải quay lại trước khi thu hồi mã thông báo,
tạo mã thông báo hoặc kiểm tra.

Mở rộng các kiểm thử dịch vụ để việc tạo Thủ thư vẫn duy trì các trường đã được cắt bớt, quá trình
tạo Thành viên từ chối các trường Thủ thư được cung cấp, một email hợp lệ 255 ký tự đến FE10 mà
không bị cắt bớt, bản đồ kết quả của tác nhân kho lưu trữ một cách an toàn và bản đồ kết quả email
trùng lặp của kho lưu trữ tới `409 EMAIL_ALREADY_EXISTS` trước khi gửi.

Thêm các kiểm thử RED tạo tuyến đường chứng minh xác thực và ủy quyền của Quản trị viên trước khi
xác thực nội dung không hợp lệ. Tải trọng tạo được xác thực phải chuẩn hóa `type`, `email`,
`username`, `fullName`, `phone`, `address`, `department` và `specialization`; từ chối các giá trị
thiếu/không hợp lệ/quá dài; và từ chối các trường chỉ dành cho Thủ thư đối với yêu cầu Thành viên
trước khi dịch vụ được gọi.

- [ ] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/accountSetupRepository.test.js tests/userRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
```

Dự kiến: THẤT BẠI vì các lần đọc được quản lý bỏ qua dự phòng trường/phiên bản, tạo đầu vào bỏ qua
các trường của Thư viện, tạo thiếu xác thực tuyến đường và việc tạo/gửi lại không xác thực lại Quản
trị viên đang hoạt động trong các giao dịch nguồn của họ.

- [ ] **Bước 3: Thực hiện chiếu và tạo tài khoản an toàn**

Trong mọi dự án SELECT của người dùng được quản lý:

```sql
COALESCE(u.UpdatedAt, u.CreatedAt) AS EffectiveUpdatedAt,
up.Department,
up.Specialization
```

Bản đồ với:

```js
const roles = mapManagedRoles(row.Roles);
const result = {
  userId: row.UserId,
  username: row.Username,
  email: row.Email,
  phoneNumber: row.Phone,
  status: row.Status,
  fullName: row.FullName,
  address: row.Address,
  lastLoginAt: row.LastLoginAt,
  createdAt: row.CreatedAt,
  updatedAt: row.EffectiveUpdatedAt,
  roles,
};

if (roles.includes('LIBRARIAN')) {
  result.department = row.Department;
  result.specialization = row.Specialization;
}
return result;
```

Mở rộng `createPendingAccount()` để liên kết và chèn hai trường rỗng và đặt `Users.UpdatedAt = @Now`
cho tài khoản FE11 mới. Giữ nguyên hành vi tự đăng ký FE02; dự phòng đọc hiệu quả hỗ trợ các hàng
cũ/null của nó.

Khi bắt đầu cả hai giao dịch nguồn FE11, hãy khóa người dùng hoạt động và tư cách thành viên vai trò
Quản trị viên của người đó bằng cách sử dụng `UPDLOCK, HOLDLOCK` được tham số hóa. Trả về
`ADMIN_NOT_FOUND` cho tác nhân bị thiếu và `ADMIN_REQUIRED` cho tác nhân không hoạt động hoặc không
phải Quản trị viên trước bất kỳ thao tác ghi nguồn nào. Khi tạo, thực hiện kiểm tra tính duy nhất của
email/tên người dùng có thẩm quyền trong giao dịch; trả về `EMAIL_ALREADY_EXISTS` hoặc
`USERNAME_ALREADY_EXISTS` mà không cần chèn. Chỉ phát hiện các lỗi khóa trùng lặp sau khi khôi phục
và ánh xạ chỉ mục email xác định một cách an toàn; không chuyển đổi một lỗi ràng buộc không xác định
thành xung đột công khai sai. Khi gửi lại, chỉ thực hiện khóa lịch sử mục tiêu/thiết lập sau khi xác
nhận lại tác nhân.

Dịch vụ có thể giữ lại tra cứu trước chuyến bay hiện có để có phản hồi nhanh nhưng kết quả của kho
lưu trữ là có căn cứ. Nó chỉ phải yêu cầu phân phối FE10 sau khi có kết quả `CREATED` hoặc `ROTATED`
đã cam kết; Tác nhân/kết quả trùng lặp không bao giờ tạo yêu cầu thông báo.

- [ ] **Bước 4: Thực hiện xác thực**

Thêm `createUserValidators` và gán `matchedData` cho `req.validatedUserCreate`; bộ điều khiển chỉ
được chuyển đối tượng đó cho dịch vụ. Chuẩn hóa các trường tùy chọn với hành vi từ trống đến rỗng.
Thực thi email 255, tên đầy đủ 100, bộ phận/chuyên môn 100 và từ chối các trường Thủ thư khi `type
!== 'thủ thư'`.

- [ ] **Bước 5: Chạy GREEN và hồi quy lát cắt hoàn chỉnh**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/accountSetupRepository.test.js tests/userRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/userRoleRepository.test.js tests/notificationRoutes.test.js
```

Dự kiến: VƯỢT QUA với xác thực lại của Quản trị viên đang hoạt động, xung đột tạo xác định, xác thực
tuyến đường và hành vi thiết lập tài khoản, vai trò, danh sách/chi tiết an toàn, kiểm tra và quyền
hiện tại không thay đổi.

---

### Nhiệm vụ 4: Thực hiện cập nhật giao dịch lạc quan và không hoạt động

**Tệp:** kho lưu trữ vòng đời, dịch vụ/tuyến đường/trình xác thực quản lý người dùng, kiểm tra, hồi
quy dự báo kiểm toán.

**Giao diện:** Tạo kết quả `updateManagedUser()` từ Giao diện bị khóa.

- [ ] **Bước 1: Viết các kiểm thử RED của kho lưu trữ**

Phản chiếu `userRoleRepository.test.js` với giao dịch SQL giả. Bìa:

```js
const FIXED_NOW = new Date('2026-07-19T08:30:00.000Z');
const FIXED_VERSION = new Date('2026-07-19T08:00:00.000Z');
const ACTIVE_ADMIN = [{ UserId: 99, Status: 'ACTIVE', IsAdmin: 1 }];
const CURRENT_LIBRARIAN = {
  UserId: 7,
  Email: 'librarian@example.test',
  FullName: 'Current Name',
  Phone: null,
  Address: null,
  Department: 'Reference',
  Specialization: 'Research Support',
  Status: 'ACTIVE',
  DeactivatedAt: null,
  EffectiveUpdatedAt: FIXED_VERSION,
};
const STALE_TARGET = { ...CURRENT_LIBRARIAN, EffectiveUpdatedAt: new Date('2026-07-19T08:05:00.000Z') };
const CURRENT_ROLES = [{ RoleName: 'LIBRARIAN' }];
const CURRENT_CHANGES = {
  email: 'librarian@example.test',
  fullName: 'Current Name',
  phone: null,
  address: null,
  department: 'Reference',
  specialization: 'Research Support',
};

function makeLifecycleHarness(results) {
  const calls = [];
  const queued = [...results];
  getPool.mockResolvedValue({
    async transactionQuery(query, inputs) {
      calls.push({ query, inputs });
      const next = queued.shift();
      if (next instanceof Error) throw next;
      return { recordset: next || [] };
    },
  });

  return {
    calls,
    invokeUpdate(overrides = {}) {
      return userLifecycleRepository.updateManagedUser({
        adminUserId: 99,
        userId: 7,
        expectedUpdatedAt: FIXED_VERSION,
        changes: { fullName: 'Current Name' },
        ipAddress: '127.0.0.1',
        userAgent: 'jest',
        now: FIXED_NOW,
        ...overrides,
      });
    },
    get transaction() {
      return sql.Transaction.instances.at(-1);
    },
  };
}

test.each([
  ['missing actor', [[]], 'ADMIN_NOT_FOUND'],
  ['inactive actor', [[{ UserId: 99, Status: 'INACTIVE', IsAdmin: 1 }]], 'ADMIN_REQUIRED'],
  ['missing target', [ACTIVE_ADMIN, []], 'USER_NOT_FOUND'],
  ['stale version', [ACTIVE_ADMIN, [STALE_TARGET]], 'STALE_USER_STATE'],
])('%s rolls back without update or audit', async (_, queuedResults, outcome) => {
  const harness = makeLifecycleHarness(queuedResults);
  await expect(harness.invokeUpdate()).resolves.toEqual({ outcome });
  expect(harness.calls.some(({ query }) => /UPDATE Users|INSERT INTO AuditLogs/.test(query))).toBe(false);
  expect(harness.transaction.commitCount).toBe(0);
  expect(harness.transaction.rollbackCount).toBe(1);
});

test('no-op writes no field update or audit', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_LIBRARIAN], CURRENT_ROLES]);
  await expect(harness.invokeUpdate({ changes: CURRENT_CHANGES })).resolves.toEqual({ outcome: 'NO_CHANGE' });
  expect(harness.calls.some(({ query }) => /UPDATE Users|UPDATE UserProfiles|INSERT INTO AuditLogs/.test(query))).toBe(false);
});

test('effective update writes one audit and commits', async () => {
  const harness = makeLifecycleHarness([ACTIVE_ADMIN, [CURRENT_LIBRARIAN], CURRENT_ROLES, [], [], [], []]);
  await expect(harness.invokeUpdate({ changes: { fullName: 'Updated Name' } })).resolves.toEqual({
    outcome: 'UPDATED', changedFields: ['fullName'],
  });
  expect(harness.calls.filter(({ query }) => query.includes('INSERT INTO AuditLogs'))).toHaveLength(1);
  expect(harness.transaction.commitCount).toBe(1);
});
```

Xác nhận tác nhân, mục tiêu, vai trò và kiểm tra email sử dụng `UPDLOCK, HOLDLOCK` được tham số hóa;
khẳng định siêu dữ liệu kiểm tra chính xác là `{ changedFields: [...] }` với tên trường được sắp
xếp.

- [ ] **Bước 2: Viết dịch vụ và định tuyến các kiểm thử RED**

Kiểm tra lộ trình phải chứng minh ủy quyền đi trước xác thực nội dung không hợp lệ và tải trọng được
chuẩn hóa là:

```js
{
  expectedUpdatedAt: new Date('2026-07-19T08:00:00.000Z'),
  email: 'librarian@example.test',
  department: 'Reference',
}
```

Dịch vụ kiểm tra kết quả bản đồ kho lưu trữ tới `404 USER_NOT_FOUND`, `409 STALE_USER_STATE`, `409
EMAIL_ALREADY_EXISTS` và `400 VALIDATION_ERROR` cho các trường chỉ dành cho Thủ thư. `UPDATED` và
`NO_CHANGE` đều đọc lại bằng `getManagedUserById()` và không bao giờ gọi kho lưu trữ kiểm tra độc
lập.

- [ ] **Bước 3: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js
```

- [ ] **Bước 4: Thực hiện giao dịch**

Tạo `userLifecycleRepository.js` bằng cách sử dụng cùng mẫu giao dịch/kết quả như
`userRoleRepository.js`. So sánh:

```sql
COALESCE(u.UpdatedAt, u.CreatedAt) = @ExpectedUpdatedAt
```

Tính toán chênh lệch hiệu quả chuẩn hóa trong JavaScript từ các hàng bị khóa. Đối với `NO_CHANGE`,
hãy quay lại hoặc cam kết mà không có bất kỳ DML/kiểm tra nào và trả sách `NO_CHANGE`. Để cập nhật,
hãy đặt `Users.UpdatedAt = @Now`, chỉ cập nhật các cột đã thay đổi, cập nhật/chèn các trường hồ sơ
trong cùng một giao dịch và chèn một lần kiểm tra `USER_UPDATE`.

Bắt các số khóa trùng lặp SQL `2601` và `2627`, quay lại và trả về `EMAIL_ALREADY_EXISTS`; thử lại
các lỗi khác sau khi khôi phục.

- [ ] **Bước 5: Trình xác thực dây, bộ điều khiển, tuyến đường và dịch vụ**

Thêm `updateUserValidators` với `userId` dương, ISO8601 `expectedUpdatedAt` bắt buộc, các trường
được xác thực tùy chọn và kiểm tra nội dung tùy chỉnh yêu cầu ít nhất một trường có thể chỉnh sửa.
Lưu trữ `matchedData` dưới dạng `req.validatedUserUpdate`; chuyển nó đến dịch vụ.

- [ ] **Bước 6: Chạy GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/adminAuditLogService.test.js
```

Dự kiến: tất cả các trường hợp chiếu cập nhật/không hoạt động/lỗi/kiểm tra đều đạt.

---

### Nhiệm vụ 5: Thực hiện hủy kích hoạt nguyên tử và tuần tự hóa FE07

**Tệp:** kho lưu trữ vòng đời, kho lưu trữ FE07 chỉ nếu được yêu cầu, kiểm tra lộ trình xác
thực/dịch vụ, kiểm tra đồng thời SQL tùy chọn.

**Giao diện:** Tạo kết quả `deactivateManagedUser()` từ Giao diện bị khóa.

- [ ] **Bước 1: Viết kiểm thử hủy kích hoạt RED**

Bao gồm sự vắng mặt của tác nhân/mục tiêu, tác nhân không hoạt động, tự nhắm mục tiêu, phiên bản cũ,
đang chờ kích hoạt, quyền bình thường đã bị vô hiệu hóa, hoạt động vay mượn, thành công của ACTIVE,
thành công của LOCKED, thu hồi làm mới, siêu dữ liệu kiểm tra và khôi phục được đưa vào ở các giai
đoạn mã thông báo/kiểm tra.

Sử dụng các chi tiết kiểm tra chính xác sau:

```js
expect(JSON.parse(auditCall.inputs.Metadata)).toEqual({
  previousStatus: 'ACTIVE',
  newStatus: 'INACTIVE',
});
```

Xác nhận mã thông báo DML chứa `TokenType = 'REFRESH'`, `UsedAt IS NULL` và `RevokedAt IS NULL`.

- [ ] **Bước 2: Thêm bằng chứng đồng thời phê duyệt/hủy kích hoạt**

Trong quá trình kiểm tra kho lưu trữ mô phỏng, hãy xác nhận khóa thành viên đích trước các lần đọc
BorrowDetails. Trong `borrowingConcurrency.sqltest.js`, thêm một kiểm thử trực tiếp nhằm chạy đua
phê duyệt và hủy kích hoạt cho một thành viên và chỉ chấp nhận các trạng thái cuối cùng hợp lệ sau:

```text
1. phê duyệt được ghi nhận, vô hiệu hóa trả về ACTIVE_BORROWINGS_EXIST, người dùng ACTIVE, yêu cầu APPROVED;
2. vô hiệu hóa được ghi nhận, phê duyệt trả về MEMBER_ACCOUNT_INACTIVE, người dùng INACTIVE, yêu cầu PENDING.
```

Không có trạng thái cuối cùng nào được phép chứa người dùng `INACTIVE` với yêu cầu
`APPROVED`/`BORROWED` mới từ cuộc đua.

- [ ] **Bước 3: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/borrowingRepository.test.js
```

- [ ] **Bước 4: Thực hiện hủy kích hoạt**

Bên trong một giao dịch SQL:

```sql
-- actor locked and active Admin
-- target locked with COALESCE(UpdatedAt, CreatedAt), Status, DeactivatedAt
-- roles/member-scoped lock compatible with FE07
-- active BORROWED detail count
UPDATE Users
SET Status = 'INACTIVE', DeactivatedAt = @Now, UpdatedAt = @Now
WHERE UserId = @UserId;

UPDATE AuthTokens
SET RevokedAt = @Now
WHERE UserId = @UserId
  AND TokenType = 'REFRESH'
  AND UsedAt IS NULL
  AND RevokedAt IS NULL;
```

Chèn kiểm tra và cam kết. Trả về `ACCOUNT_PENDING_ACTIVATION` cho các hàng `DeactivatedAt` INACTIVE
rỗng và `ALREADY_DEACTIVATED` cho các hàng không rỗng không có DML.

Nếu phê duyệt FE07 hiện tại vẫn khóa yêu cầu trước thành viên, hãy thực hiện chỉnh sửa tối thiểu chỉ
dành cho kho lưu trữ đối với đơn hàng ưu tiên thành viên đã được phê duyệt và giữ nguyên mọi kết
quả/ghi FE07.

- [ ] **Bước 5: Chạy GREEN và SQL tùy chọn**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/userLifecycleRepository.test.js tests/userManagementService.test.js tests/userManagementRoutes.test.js tests/borrowingRepository.test.js tests/borrowingRoutes.test.js
```

Khi có sẵn cấu hình SQL:

```powershell
$env:FE07_SQL_TEST_ALLOW_MUTATION='true'
npm.cmd --prefix backend run test:sql:fe07
```

Ghi lại SQL trực tiếp không có sẵn làm bằng chứng môi trường; không đánh dấu thiếu hợp đồng tĩnh/đồng thời.

---

### Nhiệm vụ 6: Căn chỉnh giao diện người dùng trong vòng đời của người dùng và xóa đường vòng dành cho nhà phát triển

**Tệp:** quản lý người dùng API/kiểm tra trang và giao diện người dùng.

**Giao diện:** Tiêu thụ `updatedAt` hiệu quả; tạo ra hành vi tải lại có thẩm quyền.

- [ ] **Bước 1: Viết kiểm thử RED cho giao diện người dùng**

Thêm các kiểm thử nguồn/trợ giúp chứng minh:

```js
assert.doesNotMatch(source, /allowDevUserManagementWithoutLogin|MODE !== 'production'/);
assert.match(source, /<Navigate to="\/login" replace/);
assert.match(source, /expectedUpdatedAt: modal\.user\.updatedAt/);
assert.match(apiSource, /deactivateManagedUser\(userId, expectedUpdatedAt\)/);
assert.match(apiSource, /data: \{ status: 'INACTIVE', expectedUpdatedAt \}/);
assert.match(source, /department/);
assert.match(source, /specialization/);
```

Kiểm tra `validateUserForm()` để biết độ dài email 255, độ dài trường 100, tải trọng từ trống đến
rỗng và đầu vào Thủ thư ẩn cho mục tiêu Thành viên.

- [ ] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix frontend test -- --test-name-pattern="FE11"
```

Dự kiến: lỗi bỏ qua, thiếu phiên bản và thiếu thông tin đầu vào của Thủ thư.

- [ ] **Bước 3: Triển khai bảo vệ tuyến đường và tải trọng**

Sử dụng trạng thái xác thực được lưu trữ một cách nhất quán:

```jsx
const access = readStoredAdminAccess();
if (!access.authenticated) return <Navigate to="/login" replace />;
if (!access.isAdmin) return <Navigate to="/home" replace />;
const currentAdmin = access.user;
```

Yêu cầu mã thông báo truy cập hoặc làm mới trong cùng bộ lưu trữ với `authUser`. Loại bỏ hằng số chế
độ và làm cho `requireAdminSession()` dựa vào cùng một trình trợ giúp.

Gửi `expectedUpdatedAt` để cập nhật và hủy kích hoạt. Nếu thành công, hãy đóng phương thức/ngăn kéo
và tải lại trang có thẩm quyền hiện tại và chủ sở hữu chi tiết. Đối với các lỗi cũ/đang chờ xử
lý/mượn đang hoạt động, hãy giữ biểu mẫu/ngăn mở và hiển thị thông báo được ánh xạ an toàn.

Chỉ kích hoạt chức năng hủy kích hoạt cho các hàng `ACTIVE` và `LOCKED`. Thêm
`ACCOUNT_PENDING_ACTIVATION` vào bản đồ lỗi API ngay cả khi các hàng đang chờ xử lý không hiển thị
nút vì các phản hồi trực tiếp/đồng thời phải dễ hiểu.

- [ ] **Bước 4: Chạy GREEN**

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

---

### Nhiệm vụ 7: Vượt sóng A H2, xuất bản PR 2 và tích hợp sau H3

**Tệp:** tất cả các tệp Sóng A và bản ghi xác thực Sóng A.

- [ ] **Bước 1: Chạy toàn bộ bằng chứng đợt A**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
npm.cmd run test:e2e
git diff --check
```

Đồng thời quét:

```powershell
rg -n "allowDevUserManagementWithoutLogin|MODE !== 'production'|NVarChar\(100\).*Email|RecipientEmail.*NVarChar\(100\)" backend/src frontend/src database
rg -n "password|token|secret|credential" database/migrations/2026-07-19-fe11-finalization.sql .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md
```

Dự kiến: không có sản phẩm nào bị trôi dạt; bất kỳ sự xuất hiện tài liệu nào đều được kiểm tra thủ công.

- [ ] **Bước 2: Làm đông lạnh và trình bày H2**

```powershell
git add -N -- database/migrations/2026-07-19-fe11-finalization.sql backend/src/repositories/userLifecycleRepository.js backend/tests/fe11SchemaMigration.test.js backend/tests/userRepository.test.js backend/tests/userLifecycleRepository.test.js .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
git diff --check
```

Ghi lại hàm băm, lịch sử RED/GREEN, kết quả L1-L4, bằng chứng SQL còn lại và phạm vi tệp chính xác.
Dừng lại ở H2.

Trong sự khác biệt về tài liệu đợt A đã được H2 xem xét, chỉ kiểm tra `FE11-FIN01` và
`FE11-LIFE01..FE11-LIFE05` khi có bằng chứng được nêu tên của chúng. Không chọn `FE11-LIFE06` thông
qua cam kết triển khai và kiểm tra PR.

- [ ] **Bước 3: Cam kết bộ được H2 đánh giá không thay đổi**

```powershell
git add -- database backend/src backend/tests frontend/src frontend/test docs/api .sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md .sdd/specs/feat-user-role-management
git commit -m "feat(fe11): complete user lifecycle core"
git push -u origin feat/fe11-finalization-wave-a
gh pr create --base main --head feat/fe11-finalization-wave-a --title "feat(fe11): complete user lifecycle core" --body "Implements FE11-LIFE01..FE11-LIFE05 from the approved FE11 Finalization Batch. Includes schema/email synchronization, Librarian fields, optimistic/no-op updates, atomic deactivation, access hardening, tests, and H2 evidence. Excludes Request Management behavior."
gh pr checks --watch
```

- [ ] **Bước 4: Yêu cầu H3, hợp nhất và xác minh CI chính chính xác**

Sáu H3:

```powershell
gh pr merge --merge --delete-branch
git fetch origin main
$waveAMerge = gh pr view --json mergeCommit --jq .mergeCommit.oid
gh run list --branch main --commit $waveAMerge --limit 5
```

Không đánh dấu `FE11-LIFE06` là hoàn thành cho đến khi CI chính xác thành công.

---

### Nhiệm vụ 8: Chuẩn hóa danh sách yêu cầu của quản trị viên

**Tệp:** Trình xác thực/kho lưu trữ/dịch vụ/bộ điều khiển/tuyến đường, kiểm thử, tài liệu của quản trị viên.

**Giao diện:** Tạo danh sách `{ data, pagination }` chuẩn.

- [ ] **Bước 1: Tạo cây làm việc đợt B**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-wave-b -b feat/fe11-finalization-wave-b origin/main
npm.cmd ci
npm.cmd --prefix backend ci
npm.cmd --prefix frontend ci
```

- [ ] **Bước 2: Viết các kiểm thử RED về tuyến đường/dịch vụ/kho lưu trữ**

Kiểm tra lộ trình phản ánh Nhật ký kiểm tra và chứng minh xác thực do quản trị viên đặt lên hàng đầu
đối với các giá trị mặc định, giới hạn, giá trị liệt kê, ngày tháng và `from <= to`. Các khóa không
xác định bị
`matchedData` bỏ qua.

Kiểm tra kho lưu trữ khẳng định:

```js
expect(sqlText).toMatch(/ORDER BY[\s\S]*RequestDate DESC[\s\S]*RequestId DESC/);
expect(sqlText).toMatch(/OFFSET @Offset ROWS FETCH NEXT @Limit ROWS ONLY/);
expect(sqlText).toMatch(/COUNT\(DISTINCT/);
expect(sqlText).not.toMatch(/STRING_AGG/);
expect(bindings).toMatchObject({ Offset: 20, Limit: 20, Status: 'PENDING' });
```

Sử dụng các mục cố định có tiêu đề/danh mục chứa dấu phẩy và các danh mục trùng lặp; mong đợi thứ tự
tiêu đề trên mỗi chi tiết và thứ tự danh mục xuất hiện lần đầu duy nhất.

- [ ] **Bước 3: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/adminRequestRepository.test.js
```

- [ ] **Bước 4: Triển khai xác thực chuẩn và phân trang**

Thêm `requestListQueryValidators` và `assignValidatedRequestQuery`. Trong
`adminRepository.listRequests`, phân biệt các tiêu đề yêu cầu theo trang trước và nối các hàng con
sau khi phân trang. Sử dụng `EXISTS` để tìm kiếm tiêu đề để một tiêu đề yêu cầu xuất hiện một lần.
Trả về các DTO được nhóm và `Math.ceil(total / limit)`.

Đầu vào dịch vụ đã được chuẩn hóa và trả về đường bao kho lưu trữ không thay đổi. Bộ điều khiển đọc
`req.validatedRequestQuery`.

- [ ] **Bước 5: Chạy GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/adminRequestRepository.test.js tests/adminAuditLogRoutes.test.js tests/adminAuditLogService.test.js
```

---

### Nhiệm vụ 9: Thêm ranh giới đọc chi tiết yêu cầu chuẩn

**Tệp:** Dịch vụ quản trị/bộ điều khiển/tuyến/trình xác thực, mượn lại kho lưu trữ để đọc, kiểm tra.

**Giao diện:** Tạo `AdminRequestDetail` DTO chính xác mà không có SQL mới trong FE11.

- [ ] **Bước 1: Viết kiểm thử RED**

Kiểm tra lộ trình: 401/403 trước khi xác thực ID không hợp lệ, 400 ID không hợp lệ, 404
`BORROW_REQUEST_NOT_FOUND`, 200 DTO chính xác.

Kiểm tra chiếu dịch vụ:

```js
expect(result).toEqual({
  requestId: 25,
  requestDate: expect.any(Date),
  status: 'PENDING',
  createdAt: expect.any(Date),
  updatedAt: null,
  member: {
    userId: 10,
    memberId: 7,
    fullName: 'Member Name',
    email: 'member@example.test',
    phoneNumber: '0900000000',
    status: 'ACTIVE',
  },
  items: [
    {
      borrowDetailId: 80,
      copyId: 44,
      barcode: 'BC-0044',
      title: 'Book A',
      author: 'Author A',
      location: 'Shelf A',
      status: 'REQUESTED',
    },
  ],
  lifecycle: { approvedAt: null, rejectedAt: null, processedAt: null },
});
expect(JSON.stringify(result)).not.toMatch(/password|token|session|createdBy|approvedBy/i);
```

- [ ] **Bước 2: Chạy RED**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js
```

- [ ] **Bước 3: Thực hiện chiếu chi tiết**

Thêm `GET /api/admin/requests/:requestId`. `adminService.getRequest()` gọi
`borrowingRepository.findBorrowRequestById(requestId)` và chỉ ánh xạ các trường được phê duyệt.
Không thêm kho lưu trữ SQL hoặc bí danh thao tác ghi.

- [ ] **Bước 4: Chạy GREEN**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminRequestRoutes.test.js tests/adminRequestService.test.js tests/borrowingRepository.test.js
```

---

### Nhiệm vụ 10: Chứng minh tính bất biến trạng thái đầu cuối của FE07

**Tệp:** Kiểm tra tuyến đường/kho lưu trữ FE07 và kiểm tra ranh giới của Quản trị viên; Các tệp FE07
sản xuất chỉ thay đổi nếu quá trình kiểm tra cho thấy sự không tuân thủ.

- [ ] **Bước 1: Thêm các kiểm thử hồi quy tập trung**

Đối với mỗi trạng thái `APPROVED`, `REJECTED`, `COMPLETED` và `CANCELLED`, hãy gọi cả phê duyệt và
từ chối dịch vụ/tuyến đường và xác nhận:

```js
expect(error).toMatchObject({ statusCode: 409, code: 'BORROW_REQUEST_NOT_PENDING' });
expect(repository.approveBorrowRequest).not.toHaveBeenCalled();
expect(repository.rejectBorrowRequest).not.toHaveBeenCalled();
expect(auditLogRepository.create).not.toHaveBeenCalled();
```

Mở rộng `adminBorrowingRouteBoundary.test.js` để cấm bí danh `/admin/requests/:id/approve` và `/reject`.

- [ ] **Bước 2: Chạy kiểm thử**

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/adminBorrowingRouteBoundary.test.js
```

Dự kiến: bộ bảo vệ thiết bị đầu cuối FE07 hiện tại có thể đã vượt qua. Ghi lại đó là bằng chứng
GREEN có sẵn; không tạo ra sự khác biệt trong sản xuất. Nếu trường hợp không thành công, chỉ thực
hiện chỉnh sửa nhỏ nhất thuộc sở hữu của FE07 và chạy lại RED-GREEN.

---

### Nhiệm vụ 11: Di chuyển giao diện người dùng yêu cầu quản trị viên và xuất CSV an toàn

**Tệp:** `adminApi.js`, `adminRequests.js`, `UserManagement.jsx` và các kiểm thử giao diện người dùng.

**Giao diện:** Sử dụng API danh sách/chi tiết chuẩn và các thao tác ghi FE07.

- [ ] **Bước 1: Tạo các kiểm thử RED của trình trợ giúp thuần túy**

Kiểm tra những hành vi chính xác này:

```js
assert.deepEqual(buildAdminRequestParams({
  page: 2, limit: 20, q: '  alice  ', status: 'pending', from: '2026-07-01', to: '2026-07-19',
}), {
  page: 2, limit: 20, q: 'alice', status: 'PENDING', from: '2026-07-01', to: '2026-07-19',
});

assert.equal(escapeCsvCell('=SUM(A1:A2)'), "\"'=SUM(A1:A2)\"");
assert.match(buildAdminRequestCsv(rows), /requestId,requestDate,status,memberUserId/);
```

Đồng thời kiểm tra `fetchAllAdminRequestRows()` với 201 đồ đạc trên ba trang, kết quả trống với
`totalPages: 0` và lỗi trang 2 không tạo ra kết quả CSV.

- [ ] **Bước 2: Triển khai mô-đun trợ giúp**

Sử dụng giao diện này:

```js
export function buildAdminRequestParams(input = {}) {
  const params = {
    page: Number(input.page || 1),
    limit: Number(input.limit || 20),
  };
  const q = String(input.q || '').trim();
  const status = String(input.status || '').trim().toUpperCase();
  if (q) params.q = q;
  if (status && status !== 'ALL') params.status = status;
  if (input.from) params.from = input.from;
  if (input.to) params.to = input.to;
  return params;
}

export function escapeCsvCell(value) {
  const text = Array.isArray(value) ? value.join(' | ') : String(value ?? '');
  const safe = /^\s*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function buildAdminRequestCsv(rows) {
  const columns = [
    'requestId', 'requestDate', 'status', 'memberUserId', 'memberName',
    'memberEmail', 'memberPhoneNumber', 'itemCount', 'bookTitles', 'categories',
  ];
  const values = (row) => ({
    requestId: row.requestId,
    requestDate: row.requestDate,
    status: row.status,
    memberUserId: row.member?.userId,
    memberName: row.member?.fullName,
    memberEmail: row.member?.email,
    memberPhoneNumber: row.member?.phoneNumber,
    itemCount: row.itemCount,
    bookTitles: row.bookTitles,
    categories: row.categories,
  });
  return [
    columns.join(','),
    ...rows.map((row) => columns.map((column) => escapeCsvCell(values(row)[column])).join(',')),
  ].join('\r\n');
}
export async function fetchAllAdminRequestRows(loadPage, filters) {
  const rows = [];
  for (let page = 1; ; page += 1) {
    const result = await loadPage({ ...filters, page, limit: 100 });
    rows.push(...(result.data || []));
    if (!(result.data || []).length || page >= Number(result.pagination?.totalPages || 0)) break;
  }
  return rows;
}
```

- [ ] **Bước 3: Thêm bộ điều hợp API và kiểm tra nguồn RED**

Thêm `adminApi.requestDetail(requestId)`. Khóa `from`/`to` chuẩn, phân trang máy chủ, `requestId`,
tìm nạp chi tiết có thẩm quyền, kiểm soát thiết bị đầu cuối, bảo toàn lỗi và trạng thái
`requestExporting` trong kiểm tra nguồn.

- [ ] **Bước 4: Triển khai luồng thành phần**

Thay thế việc cắt ứng dụng khách bằng `requestPagination`. `loadRequests(page)` giữ lại trang thành
công cuối cùng khi bị lỗi. `openRequestDetail(requestId)` tải từ máy chủ trước khi mở. thao tác ghi FE07
thành công tải lại trang hiện tại; thất bại vẫn giữ nguyên phương thức và chi tiết. Chỉ `PENDING`
hiển thị các điều khiển phê duyệt/từ chối.

Xuất sẽ đóng băng các bộ lọc hiện tại, tải tất cả các trang có `limit=100`, tạo CSV cố định và chỉ
tải xuống sau khi mỗi trang thành công.

- [ ] **Bước 5: Chạy GREEN**

```powershell
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
```

---

### Nhiệm vụ 12: Thêm bằng chứng bảng điều khiển và chấp nhận trình duyệt FE11 theo chức năng cụ thể

**Tệp:** kiểm tra dịch vụ bảng điều khiển, dịch vụ cố định E2E, máy chủ hệ thống và đặc tả FE11 Playwright.

**Giao diện:** Tạo bằng chứng cho Bảng điều khiển chỉ đọc hiện có cùng với Quản trị viên riêng biệt,
Thủ thư đang hoạt động, yêu cầu đang chờ xử lý, yêu cầu đầu cuối và nhiều trang danh sách.

- [ ] **Bước 1: Thêm phạm vi đưa tin trên Trang tổng quan chỉ có bằng chứng**

Tạo `backend/tests/adminDashboardService.test.js`. Giả lập `adminRepository.getDashboard()` với DTO
đã được phê duyệt hiện tại và chứng minh `adminService.getDashboard()` trả về hợp đồng `summary` và
`charts` chỉ đọc mà không gọi thao tác ghi tài nguyên hoặc các phương thức tạo báo cáo FE12. Giữ lại
bằng chứng lộ trình xác thực Quản trị viên/authorization hiện có; không thiết kế lại trang tổng quan
SQL, thêm mã sản xuất FE12 hoặc thay đổi hành vi của trang tổng quan chỉ để đáp ứng kiểm thử này.

Chạy:

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/adminDashboardService.test.js tests/securityRegression.test.js
```

- [ ] **Bước 2: Thêm các dịch vụ chỉ dành cho E2E**

Tạo `fe11Fixtures.js` với `userManagementService` và `adminService` trong bộ nhớ. Nó chỉ được triển
khai các phương thức định tuyến do trang Quản trị thực hiện, bao gồm Bảng điều khiển DTO chỉ đọc
hiện có và không bao giờ được nhập bằng mã sản xuất.

Đưa ra `seed({ adminUserId, librarianUserId })` tạo ra:

```js
{
  users: [activeLibrarianWithUpdatedAt],
  requests: Array.from({ length: 21 }, (_, index) => ({
    requestId: index + 1,
    requestDate: new Date(Date.UTC(2026, 6, 19, 8, index, 0)),
    status: index === 20 ? 'COMPLETED' : 'PENDING',
    member: { userId: 500 + index, fullName: `Member ${index + 1}`, email: `member${index + 1}@example.test`, phoneNumber: null },
    itemCount: 1,
    bookTitles: [`Book ${index + 1}`],
    categories: ['General'],
  })),
  pendingRequestId: 1,
  terminalRequestId: 21,
}
```

Xây dựng lại ứng dụng E2E trong `systemTestServer.js` bằng `createApp({ ...setup.services,
userManagementService, adminService })` và thêm `POST /__e2e__/setup-fe11` để tạo Quản trị viên và
Thủ thư đã được xác minh cùng với các thiết bị cố định.

- [ ] **Bước 3: Viết kiểm thử Playwright**

kiểm thử thực hiện:

```js
await page.goto('/admin/users');
await expect.poll(() => new URL(page.url()).pathname).toBe('/login');

await login(page, adminEmail, password, '/admin/users');
await page.getByText('Tổng quan', { exact: true }).click();
// assert the five existing operational summary cards and all three read-only chart panels
await page.getByText('Quản lý người dùng', { exact: true }).click();
// edit department/specialization, save, reopen detail, assert persisted
// deactivate fixture, assert authoritative INACTIVE
await page.getByText('Phân quyền', { exact: true }).click();
await expect(page.getByText('Ma trận phân quyền')).toBeVisible();
await page.getByText('Quản lý yêu cầu', { exact: true }).click();
// verify page 1/2, open pending and terminal authoritative details
await expect(page.getByRole('button', { name: /Duyệt yêu cầu/i })).toHaveCount(0);
```

Sử dụng `page.waitForEvent('download')` cho CSV; đọc tệp đã tải xuống và xác nhận tiêu đề cố định,
các hàng từ cả hai trang và không có trường lồng nhau nào không được phê duyệt.

- [ ] **Bước 4: Chạy trình duyệt RED-GREEN**

```powershell
npx playwright test tests/e2e/fe11-admin-console.spec.js --project=chromium
npm.cmd run test:e2e
```

Dự kiến: kiểm thử FE11 mới và vượt qua luồng nghiệp vụ chuẩn hiện có.

---

### Nhiệm vụ 13: Vượt sóng B H2, xuất bản PR 3 và tích hợp sau H3

- [ ] **Bước 1: Chạy bằng chứng đầy đủ**

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
npm.cmd run test:e2e
node -e "require('yamljs').load('backend/src/docs/openapi.yaml'); console.log('openapi ok')"
node -e "require('./backend/src/app'); console.log('backend import ok')"
git diff --check
```

Chạy quét phạm vi để tìm bí danh thao tác ghi của Quản trị viên, `fromDate`/`toDate` cũ, máy khách
`pagedRequests`, `STRING_AGG` trong danh sách yêu cầu và các công thức CSV không an toàn.

- [ ] **Bước 2: Làm đông lạnh và trình bày H2**

```powershell
git add -N -- backend/tests/adminRequestRepository.test.js backend/tests/adminRequestService.test.js backend/tests/adminRequestRoutes.test.js frontend/src/utils/adminRequests.js frontend/test/adminRequests.test.js tests/e2e/fe11-admin-console.spec.js tests/e2e/support/fe11Fixtures.js .sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md
git diff --binary | git hash-object --stdin
git diff --check
```

Dừng lại ở H2 với bằng chứng L1-L4 và hàm băm khác biệt chính xác.

Trong phần khác biệt về tài liệu đợt B đã được H2 xem xét, chỉ kiểm tra `FE11-REQ01..FE11-REQ03`
khi có bằng chứng được nêu tên của chúng. Không chọn `FE11-ACC01` thông qua cam kết triển khai và
kiểm tra PR.

- [ ] **Bước 3: Cam kết, xuất bản, yêu cầu H3 và hợp nhất**

```powershell
git add -- backend/src backend/tests frontend/src frontend/test tests/e2e docs/api .sdd/specs/feat-user-role-management .sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md
git commit -m "feat(fe11): complete admin request management"
git push -u origin feat/fe11-finalization-wave-b
gh pr create --base main --head feat/fe11-finalization-wave-b --title "feat(fe11): complete admin request management" --body "Implements FE11-REQ01..FE11-REQ03 and supplies pre-integration evidence for FE11-ACC01: canonical Admin request list/detail reads, server pagination, FE07-owned terminal actions, safe CSV export, Dashboard evidence, and FE11 browser acceptance."
gh pr checks --watch
```

Sau H3, hợp nhất và liên kết lần chạy CI `main` chính xác. `FE11-ACC01` chỉ đủ điều kiện để đóng sau
khi lượt chạy chính xác đó đạt và được ghi vào PR 4. Không đóng khoản nợ FE11 trước PR 4.

---

### Nhiệm vụ 14: Xuất bản Bản kết thúc FE11 B7 cuối cùng

**Tệp:** Tệp kết thúc từ Bản đồ tệp.

**Giao diện:** Sử dụng tất cả các số PR, hợp nhất các bản ghi SHA, H2/H3 và ID chạy CI `main` chính xác.

- [ ] **Bước 1: Tạo sơ đồ kết thúc**

```powershell
git fetch origin main
git worktree add .worktrees/fe11-finalization-closeout -b docs/fe11-finalization-closeout origin/main
```

- [ ] **Bước 2: Áp dụng các chuyển đổi chỉ có bằng chứng**

Đặt trạng thái hàng đầu của FE11 PLAN/TASKS thành `COMPLETE THROUGH B7`. Xác nhận `FE11-FIN01`,
`FE11-LIFE01..FE11-LIFE05` và `FE11-REQ01..FE11-REQ03` có bằng chứng được nêu tên; kiểm tra
`FE11-LIFE06` và `FE11-ACC01` từ các bản ghi tích hợp Sóng A/đợt B chính xác, sau đó kiểm tra
`FE11-FIN02`. Cập nhật trạng thái truy vết cho
AC-FE11-004/005/007/008/009/011/012/016/017/018/019/023 và chỉ còn lại một phần các hàng hành vi
không mong muốn có bằng chứng quan sát được. Chỉ cập nhật `FR-FE11-031` từ phạm vi dịch vụ/tuyến
đường/trình duyệt Bảng điều khiển chỉ có bằng chứng; không yêu cầu thiết kế lại Trang tổng quan.

Di chuyển `TD-012`, `TD-014`, `TD-015`, `TD-016`, `TD-017` và `TD-025` sang Đã giải quyết. Cập nhật
`.agents/CLAUDE.md` để FE11 không còn được mô tả là bị trì hoãn nữa. Giữ nguyên khoản nợ chức năng
không liên quan.

Nếu không có bằng chứng SQL Server trực tiếp, hãy viết lại `TD-021` để câu duy nhất còn lại của nó
là di chuyển trực tiếp/thực thi đồng thời không khả dụng; mặt khác hãy giải quyết nó bằng lần chạy
được quan sát.

- [ ] **Bước 3: Xác minh thông tin và phạm vi**

```powershell
git diff --check
git diff --name-only
rg -n "COMPLETE THROUGH B7|FE11-FIN02|TD-012|TD-025|TD-021" .agents/CLAUDE.md .sdd/specs/feat-user-role-management TECH_DEBT.md
$waveAPr = gh pr list --state merged --head feat/fe11-finalization-wave-a --json number --jq '.[0].number'
$waveBPr = gh pr list --state merged --head feat/fe11-finalization-wave-b --json number --jq '.[0].number'
gh pr view $waveAPr --json state,mergeCommit,statusCheckRollup,url
gh pr view $waveBPr --json state,mergeCommit,statusCheckRollup,url
```

- [ ] **Bước 4: Lấy H2/H3 kết thúc và hợp nhất PR 4**

Trình bày tài liệu chính xác khác biệt cho H2. Sau khi phê duyệt:

```powershell
git add -- .agents/CLAUDE.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-user-role-management .sdd/reviews/fe11-finalization-*.md TECH_DEBT.md
git commit -m "docs: close FE11 finalization batch"
git push -u origin docs/fe11-finalization-closeout
gh pr create --base main --head docs/fe11-finalization-closeout --title "docs: close FE11 finalization batch"
gh pr checks --watch
```

Yêu cầu H3 sau khi kiểm tra. Sau H3, hợp nhất và xem CI `main` chính xác cuối cùng. FE11 chỉ hoàn
thành sau khi lần chạy đó thành công.

---

## Kết quả tự đánh giá

- Phạm vi đặc tả: Lược đồ bao gồm Nhiệm vụ 2-7, độ rộng gửi email, tạo/đọc/cập nhật thủ thư, phiên bản đồng thời hiệu quả, cập nhật không hoạt động, email trùng lặp xác định, tạo/gửi lại giao dịch-kiểm tra quản trị viên, xác thực tuyến đường, lỗi tác nhân/mục tiêu, vô hiệu hóa nguyên tử, vô hiệu hóa phiên, tăng cường truy cập của quản trị viên và đợt A B7.
- Phạm vi yêu cầu và chấp nhận: Nhiệm vụ 8-13 bao gồm tên truy vấn yêu cầu chuẩn, phân trang tiêu đề riêng biệt, phạm vi số lượng/dữ liệu phù hợp, chiếu chi tiết, quyền sở hữu thao tác ghi FE07, tính bất biến của thiết bị đầu cuối, hành vi phương thức có thẩm quyền, CSV an toàn trên toàn trang, phạm vi Bảng điều khiển dành cho quản trị viên chỉ có bằng chứng và chấp nhận trình duyệt.
- Quyền sở hữu nhiều chức năng: FE02/FE03/FE10 chỉ nhận được đồng bộ hóa lược đồ/hợp đồng dữ liệu; FE07 không nhận được quy tắc nghiệp vụ mới hoặc bí danh Quản trị viên; Không có tệp sản xuất FE12.
- Quét toàn diện: mỗi bước triển khai đều đặt tên cho các tệp, giao diện, lệnh cụ thể, kết quả mong đợi và các mã định danh tích hợp được quan sát.
- Tính nhất quán của loại: `expectedUpdatedAt` luôn là Ngày ở ranh giới máy chủ và chuỗi ISO trên HTTP; danh sách/chi tiết sử dụng `requestId`; truy vấn danh sách sử dụng `from`/`to`; giao diện và máy chủ sử dụng cùng một phong bì phân trang.
- Tính nhất quán của trạng thái: các tài khoản đang chờ kích hoạt và hủy kích hoạt được phân biệt bằng `DeactivatedAt`; chỉ chuyển tiếp ACTIVE/LOCKED; yêu cầu mượn thiết bị đầu cuối không bao giờ tiết lộ hành động.
- Tính nhất quán của cổng: PR 1 phải hợp nhất trước khi sản phẩm hoạt động và không chọn tất cả các tác vụ mới; Sóng A có thể kiểm tra `FE11-FIN01` và `FE11-LIFE01..LIFE05` tại H2 nhưng không kiểm tra `LIFE06` trước CI chính xác; Sóng B có thể kiểm tra `REQ01..REQ03` tại H2 nhưng không kiểm tra `ACC01` trước CI chính; mọi PR đều yêu cầu H3; PR 4 là quá trình chuyển đổi hoàn thiện toàn bộ chức năng duy nhất.

## Bàn giao thực thi

Nhật phê duyệt thiết kế chỉnh sửa và phương án thực hiện này vào ngày 19/07/2026. Sự chấp thuận đó
cho phép chuẩn bị khác biệt kích hoạt quản trị Nhiệm vụ 1; Bước 5 vẫn yêu cầu xem xét chính xác khác
biệt về quản trị trước khi PR 1 được cam kết và công bố.

Việc triển khai kế hoạch nên sử dụng `executing-plans` theo đợt nối tiếp với các điểm kiểm tra ở
quản trị H1, Sóng A H2/H3, Sóng B H2/H3 và kết thúc H2/H3. Công việc của tác nhân phụ chỉ được phép
sau khi có sự cho phép rõ ràng của người dùng và phải duy trì ở chế độ chỉ đọc hoặc tách rời tệp
khỏi trình ghi lõi đang hoạt động.
