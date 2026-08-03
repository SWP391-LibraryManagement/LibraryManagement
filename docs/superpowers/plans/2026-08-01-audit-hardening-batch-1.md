# Kế hoạch thực hiện đợt 1 tăng cường kiểm toán

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Làm cho các thao tác ghi tham chiếu danh mục của Quản trị viên và thời gian chạy xác thực
nhạy cảm về bảo mật không thành công, được kiểm tra giao dịch và căn chỉnh với các hợp đồng
FE02/FE05/FE11 đã được phê duyệt.

**Kiến trúc:** Trước tiên hãy kích hoạt các nhiệm vụ SDD trong PR chỉ dành cho quản trị. Sau khi PR
đó đạt đến `main`, hãy triển khai hai phần TDD nối tiếp: thao tác ghi siêu dữ liệu của quản trị viên
cộng với kiểm tra trong một giao dịch SQL, sau đó tăng cường cấu hình/vận chuyển/kiểm tra phiên xác
thực bằng cách sử dụng các mẫu kho lưu trữ và giao dịch hiện có.

**Tech bộ công nghệ:** Node.js 22, Express 5, CommonJS, SQL Server đến `mssql`, Jest 30, Supertest, cổng
hồi quy React/Vite, PowerShell trên Windows.

## Ràng buộc toàn cầu

- mốc cơ sở là `main@2abd87b36e418ba1d1ad3d529ea864eed8f606cf`; phê duyệt thiết kế là cam kết `e7a12af` trên `codex/audit-hardening`.
- Sử dụng thiết kế đã được phê duyệt tại `docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md` làm hợp đồng lô.
- Không khởi động sản phẩm RED-GREEN cho đến khi PR kích hoạt quản trị đã vượt qua H2-G, yêu cầu kiểm tra, H3-G và đạt `main`.
- Không cam kết thay đổi quản trị được tạo trước H2-G. Không cam kết thay đổi mã/kiểm tra sản phẩm trước H2-P.
- Sau H2-P, giữ nguyên khác biệt đã đánh giá dưới dạng hai cam kết sản phẩm: một cam kết của Quản trị viên và một cam kết Xác thực; không thực hiện chỉnh sửa mã giữa quá trình phê duyệt H2-P và các cam kết đó.
- Giữ một Builder cho các tệp sản xuất lõi được chia sẻ. Không chỉnh sửa đồng thời cùng một tệp lõi từ một làn khác.
- Không có lược đồ, di chuyển, phụ thuộc, điểm cuối, vai trò hoặc mở rộng phản hồi thành công.
- `BCRYPT_COST` là số nguyên `>= 10` nằm ngoài `NODE_ENV=test`; chi phí chỉ dành cho kiểm thử là số nguyên `>= 4`.
- Phản hồi HTTP công khai không bao giờ bao gồm OTP, ngay cả trong kiểm thử/dev.
- Việc thực thi HTTPS sản xuất bao gồm `/api` và `/api/*`; `/`, `/health`, `/health/ready`, `/api-docs` và nội dung tĩnh duy trì hoạt động triển khai hiện tại của chúng.
- Không bao giờ chạy kiểm thử thao tác ghi SQL đối với quá trình sản xuất hoặc môi trường tiền sản xuất Azure.
- Dừng lại khi hợp đồng không rõ ràng, lệch lõi, lộ bí mật, mở rộng quyền/lược đồ/API, lỗi kiểm tra bắt buộc hoặc ba lỗi xác định lặp đi lặp lại.

---

## Bản đồ trách nhiệm nộp hồ sơ

### Kích hoạt quản trị

- `.sdd/specs/feat-book-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`: làm rõ rằng các thao tác ghi dữ liệu tham chiếu của Quản trị viên kế thừa các quy tắc kiểm tra nguyên tử FE05 và kích hoạt `FE05-T019`.
- `.sdd/specs/feat-user-role-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`: xác định hợp đồng thao tác ghi/kiểm tra/lỗi siêu dữ liệu Quản trị viên và kích hoạt `FE11-CAT01`.
- `.sdd/specs/feat-auth/{SPEC,PLAN,TASKS,CHANGELOG}.md`: làm rõ phạm vi HTTPS và tính nguyên tử kiểm tra đăng nhập/đăng xuất, sau đó kích hoạt `FE02-T067`.

### Phần A - Siêu dữ liệu của quản trị viên

- `backend/src/controllers/adminController.js`: lấy bối cảnh tác nhân/IP/tác nhân người dùng đáng tin cậy từ yêu cầu được xác thực.
- `backend/src/services/adminService.js`: xác thực riêng, ánh xạ mục tiêu/hành động, điều phối giao dịch, ghi kiểm tra bắt buộc, ánh xạ không tìm thấy và chiếu chi tiết kiểm tra.
- `backend/src/repositories/adminRepository.js`: vòng đời giao dịch SQL của riêng mình và các truy vấn siêu dữ liệu được tham số hóa nhận biết giao dịch.
- `backend/tests/adminLibraryRoleBoundary.test.js`: chứng minh bối cảnh của bộ điều khiển và ranh giới vai trò không thay đổi.
- `backend/tests/adminCatalogMetadataService.test.js`: chứng minh hợp đồng giao dịch/kiểm tra/lỗi dịch vụ.
- `backend/tests/adminCatalogMetadataRepository.test.js`: chứng minh việc sử dụng yêu cầu giao dịch, phát hiện hàng cập nhật, cam kết và khôi phục.
- `backend/tests/adminAuditLogService.test.js`: chứng minh dự đoán được đưa vào danh sách cho phép của ba hành động kiểm tra mới.

### Phần B - Xác thực

- `backend/src/config/env.js`: xác thực chi phí bcrypt khi tải mô-đun.
- `backend/src/middleware/httpsEnforcement.js`: thực thi HTTPS cho toàn bộ không gian tên API trong khi vẫn duy trì hoạt động của proxy đáng tin cậy và máy chủ chuẩn.
- `backend/src/services/authService.js`: xóa đầu ra OTP gỡ lỗi và chuyển kiểm tra đăng nhập/đăng xuất thành công vào các giao dịch bắt buộc.
- `backend/src/repositories/authTokenRepository.js`: thu hồi giao dịch bằng một mã thông báo.
- `backend/tests/envConfig.test.js`: chứng minh thời gian chạy/kiểm tra các tầng bcrypt.
- `backend/tests/httpsEnforcement.test.js`: chứng minh khả năng bảo vệ API không xác thực, khả năng tương thích proxy, an toàn chuyển hướng và loại trừ tình trạng.
- `backend/tests/authRoutes.test.js`: chứng minh sự vắng mặt của OTP và hành vi quay lại/kiểm tra đăng nhập/đăng xuất.
- `backend/tests/helpers/inMemoryAuthRepositories.js`: lưu giữ bằng chứng khôi phục cho trạng thái mã thông báo, người dùng và kiểm tra.
- Các tệp kiểm tra máy chủ chỉ đặt `AUTH_EXPOSE_TEST_TOKENS`: xóa bài tập lỗi thời; không viết lại những bộ đó.

---

### Nhiệm vụ 1: Kích hoạt hợp đồng quản trị FE02/FE05/FE11

**Tệp:**

- Sửa đổi: `.sdd/specs/feat-book-management/SPEC.md:3-9,370,387,402`
- Sửa đổi: `.sdd/specs/feat-book-management/PLAN.md:1-17` và thêm một phần khắc phục có giới hạn
- Sửa đổi: `.sdd/specs/feat-book-management/TASKS.md` sau `FE05-T018`
- Sửa đổi: `.sdd/specs/feat-book-management/CHANGELOG.md:1-3`
- Sửa đổi: `.sdd/specs/feat-user-role-management/SPEC.md:3-9,318,351,535-553,694,718,726-728`
- Sửa đổi: `.sdd/specs/feat-user-role-management/PLAN.md` bằng cách thêm một phần khắc phục có giới hạn
- Sửa đổi: `.sdd/specs/feat-user-role-management/TASKS.md` bằng cách thêm `FE11-CAT01`
- Sửa đổi: `.sdd/specs/feat-user-role-management/CHANGELOG.md:1-3`
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md:3-9,338,492,509,661`
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md` bằng cách thêm một phần khắc phục có giới hạn
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md` sau `FE02-T066`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md:1-3`
- Giữ lại: `docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md`
- Giữ lại: `docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md`

**Giao diện:**

- Tiêu thụ: Thiết kế H1 đã được phê duyệt `AUDIT-HARDENING-2026-08-01`.
- Tạo ra: ID tác vụ hiện hoạt `FE05-T019`, `FE11-CAT01` và `FE02-T067`, cùng với văn bản yêu cầu chính xác được tất cả tác vụ sản phẩm sử dụng.

- [x] **Bước 1: Áp dụng giải thích chính xác về quản trị FE05**

Đặt tiêu đề FE05 thành phiên bản `0.6.11`, `2026-08-01` được cập nhật lần cuối. Mở rộng dòng tích
hợp và NFR hiện có với nội dung này:

```markdown
- Thư viện quản trị FE11 có thể tạo/cập nhật/vô hiệu hóa bản ghi tham chiếu danh mục, tác giả và nhà xuất bản qua ranh giới `/api/admin/library/*` chỉ dành cho Quản trị viên. Mỗi mutation phải ghi actor và audit catalog trong cùng giao dịch; cập nhật hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND`. Thủ thư chỉ nhận các lựa chọn `/api/books/metadata` đang hoạt động cần thiết cho việc thay đổi sách FE05.

- NFR-FE05-TXN-001: Tạo/cập nhật/vô hiệu hóa/kích hoạt lại sách hoặc dữ liệu tham chiếu catalog và log audit bắt buộc phải cùng thành công hoặc cùng rollback.

- NFR-FE05-LOG-001: Thao tác thêm, cập nhật, vô hiệu hóa và kích hoạt lại sách hoặc dữ liệu tham chiếu catalog phải truy vết được bằng tác nhân, dấu thời gian, loại/ID mục tiêu, trạng thái cũ/mới và lý do khi áp dụng.
```

Bổ sung nội dung kế hoạch/nhiệm vụ này:

```markdown
## 2026-08-01 Củng cố mutation dữ liệu tham chiếu catalog

1. Thêm kiểm thử RED cho ngữ cảnh tác nhân, trường hợp không tìm thấy, kiểm toán hành động/đối tượng và hoàn tác khi kiểm toán lỗi.
2. Làm ba mutation `/api/admin/library/*` dùng cùng transaction với `AuditLogs`.
3. Giữ nguyên vai trò, điểm cuối, lược đồ, cấu trúc phản hồi thành công và cơ chế vô hiệu hóa mềm hiện có.
4. Xác minh máy chủ tập trung/đầy đủ, độ bao phủ, khả năng truy vết, quét bí mật, hệ thống/E2E/triển khai và độ sạch của khác biệt trước H2-P.

- [ ] **FE05-T019 - Ghi audit nguyên tử cho mutation dữ liệu tham chiếu catalog.**
  - Ánh xạ tới: NFR-FE05-TXN-001, NFR-FE05-LOG-001; tích hợp FE11 `BR-FE11-033`, `FR-FE11-043`, `AC-FE11-026`.
- RED: ngữ cảnh tác nhân, danh sách cho phép của ba hành động kiểm toán, cập nhật/vô hiệu hóa đối tượng không tồn tại và hoàn tác kiểm toán.
  - GREEN: mutation và audit dùng một transaction SQL tham số hóa; update không có hàng trả null để service ánh xạ `404`.
- Ranh giới: không đổi lược đồ, điểm cuối, vai trò, cấu trúc phản hồi thành công hoặc quyền sở hữu trạng thái bản sao FE06.
```

Thêm mục nhật ký thay đổi mà không yêu cầu triển khai:

```markdown
## 2026-08-01 - Kích hoạt củng cố kiểm toán dữ liệu tham chiếu danh mục (v0.6.11)

- Làm rõ mutation tác giả/nhà xuất bản/thể loại của Quản trị viên chịu ranh giới transaction/audit FE05 hiện có.
- Kích hoạt `FE05-T019`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Bước 2: Áp dụng giải thích chính xác về quản trị FE11**

Đặt tiêu đề FE11 thành phiên bản `0.6.14`, `2026-08-01` được cập nhật lần cuối. Mở rộng ID và NFR ổn
định hiện có như sau:

```markdown
- BR-FE11-033: Vai trò hiện tại duy nhất của tài khoản kiểm soát quyền truy cập dữ liệu tham chiếu danh mục: `ADMIN` có thể liệt kê/tạo/cập nhật/vô hiệu hóa tác giả, nhà xuất bản và danh mục qua `/api/admin/library/*`; mọi mutation được phép phải ghi actor và audit catalog trong cùng giao dịch. `LIBRARIAN` chỉ được đọc lựa chọn đang hoạt động qua FE05 `/api/books/metadata`; `MEMBER` và Khách không được thực hiện hai nhóm thao tác này.

- FR-FE11-043: NẾU Thủ thư, Thành viên hoặc Khách gọi bất kỳ điểm cuối `/api/admin/library/{authors|publishers|categories}` nào, máy chủ phải từ chối yêu cầu trước khi gọi tầng lưu bền siêu dữ liệu. KHI Quản trị viên đã xác thực tạo/cập nhật/vô hiệu hóa dữ liệu tham chiếu, mutation và audit catalog phải cùng commit/rollback; cập nhật ID không tồn tại hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` mà không ghi audit thành công.

- NFR-FE11-TXN-007: Tạo, cập nhật hoặc vô hiệu hóa tác giả/nhà xuất bản/thể loại và bản ghi audit tương ứng phải dùng cùng một giao dịch SQL.

- NFR-FE11-LOG-003: Audit mutation dữ liệu tham chiếu catalog phải dùng `CATALOG_METADATA_CREATE`, `CATALOG_METADATA_UPDATE` hoặc `CATALOG_METADATA_DEACTIVATE`, chứa ID Quản trị viên, IP, user-agent, target type/ID và metadata theo allowlist; không chứa body thô hoặc credential.
```

Thay thế hàng theo dõi `AC-FE11-026` và hàng theo dõi `FR-FE11-043` bằng:

```markdown
| AC-FE11-026 | Chỉ Quản trị viên truy cập quản lý tác giả/nhà xuất bản/danh mục; mutation được phép ghi audit nguyên tử và ID không tồn tại trả 404; Thủ thư vẫn dùng lựa chọn chỉ đọc của FE05 | FR-FE11-043 | BR-FE11-033 | `backend/tests/adminLibraryRoleBoundary.test.js`; `backend/tests/adminCatalogMetadataService.test.js`; `backend/tests/adminCatalogMetadataRepository.test.js`; `backend/tests/adminAuditLogService.test.js` |MỘT PHẦN: ROLE BOUNDARY HOÀN THÀNH; FE11-CAT01 ĐANG CHỜ XỬ LÝ|

| FR-FE11-043 | Ranh giới role metadata và mutation/audit nguyên tử | BR-FE11-033 | AC-FE11-026 | FE11-CAT01 và các kiểm thử metadata Admin tập trung |MỘT PHẦN: ROLE BOUNDARY HOÀN THÀNH; FE11-CAT01 ĐANG CHỜ XỬ LÝ|
```

Giữ tổng số ở mức 26 AC, 43 FR và 33 BR vì không có ID BR/FR/AC mới nào được thêm vào. Nối thêm:

```markdown
## 2026-08-01 Củng cố mutation metadata Quản trị

1. Giữ role đơn hiện tại làm nguồn ủy quyền duy nhất.
2. Truyền tác nhân/IP/user-agent từ yêu cầu đã xác thực, không lấy từ nội dung yêu cầu/truy vấn.
3. Ghi ba action catalog allowlist trong cùng transaction với mutation.
4. Ánh xạ update/deactivate không có hàng sang `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` và không ghi audit thành công.

- [ ] **FE11-CAT01 - Làm mutation metadata Quản trị có audit nguyên tử.**
  - Ánh xạ tới: BR-FE11-033, FR-FE11-043, AC-FE11-026, NFR-FE11-TXN-007, NFR-FE11-LOG-003; FE05-T019.
- DoD: ba thao tác ghi giữ nguyên vai trò/điểm cuối/cấu trúc phản hồi, dùng một giao dịch cho dữ liệu nguồn + kiểm toán, cập nhật đối tượng không tồn tại không trả thành công giả và bộ chiếu kiểm toán chỉ trả siêu dữ liệu trong danh sách cho phép.
- Bằng chứng yêu cầu: RED-GREEN cho controller/service/repository/projector, máy chủ đầy đủ/độ bao phủ, khả năng truy vết, quét bí mật, hệ thống/E2E/triển khai và rà soát H2-P/H3-P.
```

Thêm mục nhật ký thay đổi:

```markdown
## 2026-08-01 - Kích hoạt kiểm toán nguyên tử cho siêu dữ liệu quản trị (v0.6.14)

- Khóa danh sách cho phép hành động/đối tượng, ngữ cảnh tác nhân, giao dịch và lỗi không tìm thấy cho `/api/admin/library/*`.
- Kích hoạt `FE11-CAT01`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Bước 3: Áp dụng giải thích chính xác về quản trị FE02**

Đặt tiêu đề FE02 thành phiên bản `0.6.20`, `2026-08-01` được cập nhật lần cuối. Thay thế văn bản
AC/NFR hiện có bằng:

```markdown
- AC-FE02-024: Với yêu cầu `/api` hoặc `/api/*` truyền thông tin xác thực/mã thông báo qua HTTP không mã hóa trong môi trường triển khai, khi yêu cầu đến, hệ thống phải chuyển hướng sang HTTPS hoặc từ chối trước khi phân tích nội dung yêu cầu hay điều phối tuyến; kiểm tra sống/sẵn sàng và tài nguyên tĩnh ngoài không gian tên API không bị cổng này chặn.

- NFR-FE02-SEC-003: HTTPS phải được thực thi cho mọi yêu cầu `/api` và `/api/*` có thể mang thông tin xác thực hoặc mã thông báo; yêu cầu HTTP phải được chuyển hướng bằng máy chủ chuẩn đã cấu hình hoặc bị từ chối trước khi xử lý. `/`, `/health`, `/health/ready`, `/api-docs` và tài nguyên tĩnh giữ hợp đồng triển khai riêng.

- NFR-FE02-TXN-002: Đăng nhập thành công phải commit việc đặt lại trạng thái đăng nhập, tạo refresh token và `AUTH_LOGIN_SUCCESS` trong cùng giao dịch; đăng xuất phải commit việc thu hồi refresh token hiện tại khi có và `AUTH_LOGOUT` trong cùng giao dịch. Lỗi audit bắt buộc làm rollback state transition tương ứng.
```

Thay thế hàng dấu vết AC bằng:

```markdown
| AC-FE02-024 | Request HTTP tới namespace API đã triển khai bị chuyển hướng hoặc từ chối trước khi xử lý credential/token; health/static exclusions vẫn hoạt động | NFR-FE02-SEC-003 | BR-FE02-017 | `backend/tests/httpsEnforcement.test.js` |Đang chờ xử lý FE02-T067|
```

Bổ sung nội dung kế hoạch/nhiệm vụ:

```markdown
## 18. Củng cố thời gian chạy và kiểm toán phiên 2026-08-01

1. Thêm RED cho ngưỡng bcrypt ở môi trường production/kiểm thử, phản hồi OTP, HTTPS trên toàn API và hoàn tác đăng nhập/đăng xuất khi kiểm toán lỗi.
2. Loại đường dẫn OTP gỡ lỗi; kiểm thử lấy OTP qua phụ thuộc được truyền vào/cơ chế gửi giả lập.
3. Dùng giao dịch hiện có cho đăng nhập thành công và đăng xuất; giữ các sự kiện đăng nhập thất bại/khóa ngoài phạm vi lô này.
4. Không đổi lược đồ, định dạng mã thông báo, vai trò, điểm cuối hoặc phản hồi thành công ngoài việc loại trường gỡ lỗi bị cấm.

- [ ] **FE02-T067 - Củng cố bcrypt, OTP response, HTTPS và audit session nguyên tử.**
  - Ánh xạ tới: BR-FE02-005, BR-FE02-011, BR-FE02-016, BR-FE02-017, BR-FE02-020; AC-FE02-024; NFR-FE02-SEC-001/003/015, NFR-FE02-TXN-002, NFR-FE02-LOG-001/002.
- RED: bcrypt production dưới 10, `debugOtp`, HTTP API ngoài xác thực, loại trừ proxy tin cậy/kiểm tra tình trạng, hoàn tác kiểm toán đăng nhập/đăng xuất và ngữ cảnh kiểm toán.
- GREEN: cấu hình dừng sớm khi lỗi, xóa phản hồi gỡ lỗi, cổng `/api`, giao dịch kiểm toán bắt buộc cho đăng nhập thành công/đăng xuất và thao tác thu hồi nhận giao dịch.
- Ranh giới: kiểm toán lần thử đăng nhập/thất bại/khóa/tự mở khóa vẫn là phần tiếp theo riêng; không tuyên bố đã chuyển chúng sang cơ chế đóng khi lỗi.
```

Thêm mục nhật ký thay đổi:

```markdown
## 2026-08-01 - Kích hoạt củng cố thời gian chạy và kiểm toán phiên FE02 (v0.6.20)

- Làm rõ bcrypt floor, cấm debug OTP, HTTPS namespace API và transaction audit cho đăng nhập thành công/đăng xuất.
- Kích hoạt `FE02-T067`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Bước 4: Xác thực sự khác biệt chỉ dành cho quản trị**

Chạy từ gốc cây làm việc:

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
git status --short
```

Dự kiến: tất cả các lệnh thoát `0`; trạng thái chỉ chứa gói mới và 12 tệp quản trị FE02/FE05/FE11
(thiết kế đã được cam kết là `e7a12af`); không có tệp backend/frontend/database/workflow nào được
sửa đổi.

Chạy quét ID/trạng thái chính xác:

```powershell
rg -n "FE05-T019|FE11-CAT01|FE02-T067|NFR-FE11-TXN-007|NFR-FE11-LOG-003" .sdd/specs
git diff -- .sdd/specs/feat-auth .sdd/specs/feat-book-management .sdd/specs/feat-user-role-management | Select-String -Pattern '^\+.*(TBD|TODO|FIXME|PLACEHOLDER)'
```

Dự kiến: lần quét đầu tiên sẽ tìm thấy từng ID được kích hoạt trong ngữ cảnh
SPEC/PLAN/TASKS/CHANGELOG của nó; lệnh thứ hai in không có điểm đánh dấu mới được thêm vào chưa được
giải quyết.

- [x] **Bước 5: Dừng đối với H2-G; chỉ sau khi phê duyệt cam kết và công bố quản trị**

Trình bày đầu ra xác thực và khác biệt quản trị hoàn chỉnh. Không cam kết cho đến khi người dùng cấp
H2-G. Sau H2-G, hãy chạy:

```powershell
git add docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md .sdd/specs/feat-auth .sdd/specs/feat-book-management .sdd/specs/feat-user-role-management
git diff --cached --check
git commit -m "docs: activate audit hardening batch"
git push -u origin codex/audit-hardening
```

Dự kiến: một cam kết quản trị sau `e7a12af`; Đẩy thành công mà không cần tập tin sản phẩm.

Mở PR chỉ dành cho quản trị:

```powershell
gh pr create --base main --head codex/audit-hardening --title "docs: activate audit hardening batch" --body-file docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md
gh pr checks --watch
gh pr view --json number,headRefOid,mergeable,statusCheckRollup,url
```

Dự kiến: người đứng đầu quản trị chính xác sẽ chuyển các bước kiểm tra bắt buộc và PR có thể hợp
nhất được. Dừng lại ở H3-G. Chỉ sau khi có H3-G rõ ràng, nó mới có thể hợp nhất:

```powershell
gh pr merge --merge
gh run list --branch main --limit 5
```

Sau khi chạy CI sau hợp nhất chính xác thành công, hãy chuẩn bị cùng một sơ đồ công việc cho công
việc sản phẩm:

```powershell
git fetch origin
git status --short
git switch -c codex/audit-hardening-product origin/main
git merge-base --is-ancestor origin/main HEAD
```

Dự kiến: làm sạch cây làm việc trên `codex/audit-hardening-product`, dựa trên cam kết `main` chứa
`FE05-T019`, `FE11-CAT01` và `FE02-T067`.

---

### Nhiệm vụ 2: Triển khai thao tác ghi và kiểm tra siêu dữ liệu của Quản trị viên một cách nguyên tử

**Tệp:**

- Tạo: `backend/tests/adminCatalogMetadataService.test.js`
- Sửa đổi: `backend/tests/adminLibraryRoleBoundary.test.js:7-52`
- Sửa đổi: `backend/tests/adminCatalogMetadataRepository.test.js:1-49`
- Sửa đổi: `backend/tests/adminAuditLogService.test.js:85-115`
- Sửa đổi: `backend/src/controllers/adminController.js:3-62`
- Sửa đổi: `backend/src/services/adminService.js:8-39,193-412,462-545`
- Sửa đổi: `backend/src/repositories/adminRepository.js:1,168-246,420-432`

**Giao diện:**

- Tiêu thụ: Hoạt động `FE05-T019` và `FE11-CAT01`; `auditLogRepository.create({ ..., transaction })` hiện có.
- Sản xuất: `adminRepository.withTransaction(work)`, `createResource(resource, name, transaction)` nhận biết giao dịch, `updateResource(resource, id, name, transaction) -> row|null` và `deactivateResource(resource, id, transaction) -> number`.
- Tạo ra: chữ ký dịch vụ `createResource(resource, body, context)`, `updateResource(resource, id, body, context)`, `deactivateResource(resource, id, context)` trong đó `context = { actorId, ip, userAgent }`.

- [ ] **Bước 1: Cài đặt các phần phụ thuộc trong sơ đồ sản phẩm khi không có**

```powershell
if (-not (Test-Path node_modules)) { npm ci }
if (-not (Test-Path backend/node_modules)) { npm --prefix backend ci }
if (-not (Test-Path frontend/node_modules)) { npm --prefix frontend ci }
```

Dự kiến: mỗi lượt cài đặt được yêu cầu sẽ thoát khỏi `0`; lockfiles vẫn không thay đổi.

- [ ] **Bước 2: Viết các kiểm thử bộ điều khiển và dịch vụ bị lỗi**

Thêm xác nhận cấp tuyến đường này vào `adminLibraryRoleBoundary.test.js`:

```js
test('Admin metadata mutations pass trusted request audit context', async () => {
  const adminService = {
    createResource: jest.fn(async () => ({ data: { id: 1, name: 'Author' } })),
    updateResource: jest.fn(async () => ({ data: { id: 1, name: 'Updated' } })),
    deactivateResource: jest.fn(async () => ({ deactivated: true, data: { id: 1, status: 'INACTIVE' } })),
  };
  const app = makeApp('ADMIN', adminService);

  await request(app)
    .post('/api/admin/library/authors')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Author' })
    .expect(201);
  await request(app)
    .put('/api/admin/library/authors/1')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Updated' })
    .expect(200);
  await request(app)
    .patch('/api/admin/library/authors/1/deactivate')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .expect(200);

  const context = { actorId: 7, ip: expect.any(String), userAgent: 'catalog-audit-test' };
  expect(adminService.createResource).toHaveBeenCalledWith('authors', { name: 'Author' }, context);
  expect(adminService.updateResource).toHaveBeenCalledWith('authors', '1', { name: 'Updated' }, context);
  expect(adminService.deactivateResource).toHaveBeenCalledWith('authors', '1', context);
});
```

Tạo `adminCatalogMetadataService.test.js` với trọng điểm giao dịch và xác nhận cho cả ba hành động:

```js
const mockTransaction = { name: 'catalog-transaction' };

jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  withTransaction: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const context = { actorId: 7, ip: '203.0.113.7', userAgent: 'jest-catalog' };

beforeEach(() => {
  jest.clearAllMocks();
  adminRepository.getResourceConfig.mockImplementation((resource) => ({ resource }));
  adminRepository.withTransaction.mockImplementation((work) => work(mockTransaction));
});

test.each([
  ['authors', 'AUTHOR'],
  ['publishers', 'PUBLISHER'],
  ['categories', 'CATEGORY'],
])('create %s writes required catalog audit in the mutation transaction', async (resource, targetType) => {
  adminRepository.createResource.mockResolvedValue({ id: 11, name: 'Name', status: 'ACTIVE' });

  await expect(adminService.createResource(resource, { name: ' Name ' }, context)).resolves.toEqual({
    data: { id: 11, name: 'Name', status: 'ACTIVE' },
  });
  expect(adminRepository.createResource).toHaveBeenCalledWith(resource, 'Name', mockTransaction);
  expect(auditLogRepository.create).toHaveBeenCalledWith({
    userId: 7,
    action: 'CATALOG_METADATA_CREATE',
    targetType,
    targetId: 11,
    metadata: { resource },
    ipAddress: '203.0.113.7',
    userAgent: 'jest-catalog',
    transaction: mockTransaction,
  });
});

test('update returns not found and does not write a success audit when no row exists', async () => {
  adminRepository.updateResource.mockResolvedValue(null);

  await expect(adminService.updateResource('authors', 404, { name: 'Missing' }, context))
    .rejects.toMatchObject({ statusCode: 404, code: 'ADMIN_RESOURCE_ITEM_NOT_FOUND' });
  expect(auditLogRepository.create).not.toHaveBeenCalled();
});

test('update and deactivate use allowlisted audit payloads in the same transaction', async () => {
  adminRepository.updateResource.mockResolvedValue({ id: 3, name: 'Updated' });
  adminRepository.deactivateResource.mockResolvedValue(1);

  await adminService.updateResource('authors', 3, { name: 'Updated' }, context);
  await adminService.deactivateResource('authors', 3, context);

  expect(auditLogRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
    action: 'CATALOG_METADATA_UPDATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', changedFields: ['name'] },
    transaction: mockTransaction,
  }));
  expect(auditLogRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
    action: 'CATALOG_METADATA_DEACTIVATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', newStatus: 'INACTIVE' },
    transaction: mockTransaction,
  }));
});

test('audit failure rejects the transaction work instead of reporting mutation success', async () => {
  adminRepository.createResource.mockResolvedValue({ id: 5, name: 'Atomic' });
  auditLogRepository.create.mockRejectedValue(new Error('audit insert failed'));

  await expect(adminService.createResource('authors', { name: 'Atomic' }, context))
    .rejects.toThrow('audit insert failed');
});
```

- [ ] **Bước 3: Viết các kiểm thử máy chiếu và kho lưu trữ bị lỗi**

Thay thế đoạn mở đầu mô phỏng DB trong `adminCatalogMetadataRepository.test.js` bằng mô hình mô
phỏng hoàn chỉnh có khả năng giao dịch này:

```js
const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockSqlRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockTransactionBegin = jest.fn();
const mockTransactionCommit = jest.fn();
const mockTransactionRollback = jest.fn();
const mockTransaction = {
  begin: mockTransactionBegin,
  commit: mockTransactionCommit,
  rollback: mockTransactionRollback,
};
const mockSqlTransaction = jest.fn(() => mockTransaction);

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
  sql: {
    Int: 'INT',
    NVarChar: jest.fn((length) => `NVARCHAR(${length})`),
    Request: mockSqlRequest,
    Transaction: mockSqlTransaction,
  },
}));
```

Đặt lại kết quả SQL đã xếp hàng đợi và xóa lịch sử cuộc gọi giao dịch/yêu cầu trong `beforeEach`:

```js
beforeEach(() => {
  mockQuery.mockReset();
  [
    mockInput,
    mockRequest,
    mockSqlRequest,
    mockTransactionBegin,
    mockTransactionCommit,
    mockTransactionRollback,
    mockSqlTransaction,
  ].forEach((mock) => mock.mockClear());
});
```

Sau đó thêm:

```js
test('update returns null when SQL Server updates no resource row', async () => {
  mockQuery.mockResolvedValueOnce({ recordset: [] });

  await expect(adminRepository.updateResource('authors', 999, 'Missing')).resolves.toBeNull();
  expect(mockQuery.mock.calls[0][0]).toContain('OUTPUT INSERTED.AuthorId AS id');
});

test('metadata mutations use the supplied SQL transaction request', async () => {
  const transaction = { id: 'tx' };
  mockQuery.mockResolvedValueOnce({
    recordset: [{ id: 7, name: 'Transactional', status: 'ACTIVE', createdAt: new Date() }],
  });

  await adminRepository.createResource('authors', 'Transactional', transaction);

  expect(mockSqlRequest).toHaveBeenCalledWith(transaction);
  expect(mockRequest).not.toHaveBeenCalled();
});

test('withTransaction rolls back when its work rejects', async () => {
  const failure = new Error('audit failed');

  await expect(adminRepository.withTransaction(async () => { throw failure; }))
    .rejects.toBe(failure);
  expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
  expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
  expect(mockTransactionCommit).not.toHaveBeenCalled();
});

test('withTransaction commits and returns successful work', async () => {
  await expect(adminRepository.withTransaction(async () => 'committed')).resolves.toBe('committed');
  expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
  expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
  expect(mockTransactionRollback).not.toHaveBeenCalled();
});
```

Thêm các trường hợp này vào `projectorCases` trong `adminAuditLogService.test.js`:

```js
{ actions: ['CATALOG_METADATA_CREATE'], metadata: { resource: 'authors', name: 'omit' }, expected: { resource: 'authors' } },
{ actions: ['CATALOG_METADATA_UPDATE'], metadata: { resource: 'publishers', changedFields: ['name', 'token'] }, expected: { resource: 'publishers', changedFields: ['name'] } },
{ actions: ['CATALOG_METADATA_DEACTIVATE'], metadata: { resource: 'categories', newStatus: 'INACTIVE', reason: 'omit' }, expected: { resource: 'categories', newStatus: 'INACTIVE' } },
```

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác nhận RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js
```

Dự kiến: Chỉ THẤT BẠI trên các hợp đồng mới: bộ điều khiển không có đối số ngữ cảnh, dịch vụ không
gọi `withTransaction`/kiểm toán, bản cập nhật trả về thành công cho một hàng bị thiếu, kho lưu trữ
thiếu trình trợ giúp giao dịch và máy chiếu trả về `{}` cho các hành động mới.

- [ ] **Bước 5: Triển khai bối cảnh bộ điều khiển tối thiểu**

Thêm một lần ở gần đầu `adminController.js`:

```js
function auditContext(req) {
  return {
    actorId: req.user.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}
```

Chuyển `auditContext(req)` làm đối số cuối cùng cho `createResource`, `updateResource` và
`deactivateResource`; giữ nguyên các trình xử lý đọc.

- [ ] **Bước 6: Triển khai các phương thức kho lưu trữ nhận biết giao dịch**

Thêm trợ giúp này và xuất nó:

```js
async function withTransaction(work) {
  const transaction = new sql.Transaction(await getPool());
  await transaction.begin();
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function resourceRequest(transaction) {
  return transaction ? new sql.Request(transaction) : (await getPool()).request();
}
```

Thay đổi ba chữ ký thao tác ghi để chấp nhận `transaction`, nhận yêu cầu thông qua
`resourceRequest(transaction)` và thực hiện cập nhật trả về một hàng thực:

```js
async function updateResource(resource, id, name, transaction) {
  const config = getResourceConfig(resource);
  const result = await (await resourceRequest(transaction))
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .query(`
      UPDATE ${config.table}
      SET ${config.name} = @name
      OUTPUT INSERTED.${config.id} AS id, INSERTED.${config.name} AS name
      WHERE ${config.id} = @id;
    `);
  return result.recordset[0] || null;
}
```

Sử dụng cùng một mẫu yêu cầu khi tạo/hủy kích hoạt mà không thay đổi trường phản hồi hoặc ngữ nghĩa của SQL.

- [ ] **Bước 7: Thực hiện điều phối và dự báo giao dịch/kiểm toán dịch vụ**

Thêm ánh xạ cố định:

```js
const RESOURCE_TARGET_TYPES = Object.freeze({
  authors: 'AUTHOR',
  publishers: 'PUBLISHER',
  categories: 'CATEGORY',
});
const CATALOG_METADATA_CHANGED_FIELDS = new Set(['name']);
```

Thêm một trợ giúp máy chiếu:

```js
function readCatalogResource(value) {
  const resource = readText(value, { max: 20 });
  return resource !== INVALID_AUDIT_VALUE && RESOURCE_NAMES.has(resource)
    ? resource
    : INVALID_AUDIT_VALUE;
}
```

Thêm ba trường hợp `projectAuditDetails` sử dụng `readCatalogResource`, `readChangedFields` và `readText`:

```js
case 'CATALOG_METADATA_CREATE':
  projected = buildAuditDetails({ resource: readCatalogResource(metadata.resource) });
  break;
case 'CATALOG_METADATA_UPDATE':
  projected = buildAuditDetails({
    resource: readCatalogResource(metadata.resource),
    changedFields: readChangedFields(metadata.changedFields, CATALOG_METADATA_CHANGED_FIELDS),
  });
  break;
case 'CATALOG_METADATA_DEACTIVATE':
  projected = buildAuditDetails({
    resource: readCatalogResource(metadata.resource),
    newStatus: readText(metadata.newStatus, { max: 20 }),
  });
  break;
```

Thêm trình trợ giúp kiểm toán nội bộ này và gọi nó trong mỗi giao dịch:

```js
async function writeCatalogAudit({ resource, targetId, action, metadata, context, transaction }) {
  await auditLogRepository.create({
    userId: context.actorId,
    action,
    targetType: RESOURCE_TARGET_TYPES[resource],
    targetId,
    metadata,
    ipAddress: context.ip || null,
    userAgent: context.userAgent || null,
    transaction,
  });
}
```

Để tạo/cập nhật, hãy chuyển ID hàng trả về dưới dạng `targetId`; để hủy kích hoạt, hãy chuyển ID yêu
cầu đã được xác thực. Để cập nhật, hãy gửi trước khi kiểm tra nếu kho lưu trữ trả về `null`. Để hủy
kích hoạt, hãy hủy trước khi kiểm tra nếu các hàng bị ảnh hưởng bằng 0. Bảo toàn ánh xạ SQL `547 ->
RESOURCE_IN_USE` hiện có xung quanh toàn bộ giao dịch hủy kích hoạt.

- [ ] **Bước 8: Chạy phần việc A GREEN và kiểm tra hồi quy**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js tests/adminPermissionService.test.js
```

Dự kiến: tất cả các bộ được liệt kê đạt, `0` đều không thành công.

Đừng cam kết. Ghi lại cam kết dự định sau H2-P:

```powershell
git add backend/src/controllers/adminController.js backend/src/services/adminService.js backend/src/repositories/adminRepository.js backend/tests/adminLibraryRoleBoundary.test.js backend/tests/adminCatalogMetadataService.test.js backend/tests/adminCatalogMetadataRepository.test.js backend/tests/adminAuditLogService.test.js
git commit -m "fix: make catalog metadata audit atomic"
```

---

### Nhiệm vụ 3: Thực thi các hợp đồng thời gian chạy bcrypt/OTP/HTTPS

**Tệp:**

- Sửa đổi: `backend/tests/envConfig.test.js:1-101`
- Sửa đổi: `backend/tests/httpsEnforcement.test.js:1-107`
- Sửa đổi: `backend/tests/authRoutes.test.js:1-20,785-880`
- Sửa đổi: `backend/src/config/env.js:1-25,71-79`
- Sửa đổi: `backend/src/middleware/httpsEnforcement.js:1-50`
- Sửa đổi: `backend/src/services/authService.js:54-68,699-704`
- Chỉ sửa đổi để xóa các bài tập env lỗi thời: `backend/tests/{bookRoutes,borrowingRoutes,integration,inventoryRoutes,membershipRoutes,notificationRoutes,reportRoutes,reservationRoutes,systemIntegration}.test.js`
- Chỉ sửa đổi để xóa tùy chọn dịch vụ lỗi thời: `backend/tests/userManagementService.test.js`

**Giao diện:**

- Tiêu thụ: Kích hoạt `FE02-T067`.
- Sản xuất: `bcryptCostFromEnv() -> integer`, không có tùy chọn phản hồi mã thông báo gỡ lỗi và phần mềm trung gian HTTPS có không gian tên được bảo vệ chính xác là `/api` cộng với `/api/*`.

- [ ] **Bước 1: Viết các kiểm thử cấu hình bcrypt không thành công**

Mở rộng ảnh chụp nhanh/khôi phục môi trường trong `envConfig.test.js` để bao gồm `BCRYPT_COST` và
`NODE_ENV`, sau đó thêm:

```js
test('defaults bcrypt cost to 10 outside test', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.BCRYPT_COST;
  jest.resetModules();
  expect(require('../src/config/env').bcryptCost).toBe(10);
});

test.each(['4', '9'])('rejects production bcrypt cost %s below 10', (value) => {
  process.env.NODE_ENV = 'production';
  process.env.BCRYPT_COST = value;
  jest.resetModules();
  expect(() => require('../src/config/env')).toThrow(
    'BCRYPT_COST must be an integer >= 10 outside NODE_ENV=test'
  );
});

test.each(['0', '3', '4.5'])('rejects invalid test bcrypt cost %s', (value) => {
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_COST = value;
  jest.resetModules();
  expect(() => require('../src/config/env')).toThrow();
});

test('allows bcrypt cost 4 only in test', () => {
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_COST = '4';
  jest.resetModules();
  expect(require('../src/config/env').bcryptCost).toBe(4);
});
```

- [ ] **Bước 2: Viết xác nhận no-debug-OTP bị lỗi**

Trong yêu cầu thay đổi mật khẩu OTP thành công tại `authRoutes.test.js:828`, hãy giữ lại phản hồi và
xác nhận hình dạng công khai chính xác:

```js
const otpResponse = await request(app)
  .post('/api/auth/change-password/request-otp')
  .set('Authorization', authorization)
  .send({
    currentPassword: 'Password1!',
    newPassword: 'NewPassword1!',
    confirmNewPassword: 'NewPassword1!',
  })
  .expect(200);

expect(otpResponse.body).toEqual({
  message: 'OTP đã được gửi đến email của bạn.',
  maskedEmail: 'o***e@example.test',
});
expect(otpResponse.body.maskedEmail).toBe('o***e@example.test');
expect(Object.keys(otpResponse.body).sort()).toEqual(['maskedEmail', 'message']);
expect(otpResponse.body).not.toHaveProperty('debugOtp');
```

Các xác nhận cố tình tránh đọc OTP từ phản hồi; `capturedOtp(app)` vẫn là bản chụp được tiêm kiểm thử.

- [ ] **Bước 3: Viết các kiểm thử API HTTPS đầy đủ không thành công**

Thêm các trường hợp này vào `httpsEnforcement.test.js`:

```js
test('deployed plain-HTTP non-auth API requests are rejected before route dispatch', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps();
    const adminService = { listResource: jest.fn() };
    const authService = { authenticateToken: jest.fn() };
    const app = createApp({ authService, adminService });

    const response = await request(app).get('/api/admin/library/authors');

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'HTTPS_REQUIRED',
      message: 'HTTPS is required for API requests.',
    });
    expect(authService.authenticateToken).not.toHaveBeenCalled();
    expect(adminService.listResource).not.toHaveBeenCalled();
  } finally {
    restoreEnvironment(snapshot);
  }
});

test('trusted proxy HTTPS allows a protected non-auth API request', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps({ TRUST_PROXY: 'true' });
    const adminService = { listResource: jest.fn(async () => ({ data: [] })) };
    const authService = {
      authenticateToken: jest.fn(async () => ({ userId: 7, roles: ['ADMIN'] })),
    };
    const app = createApp({ authService, adminService });

    await request(app)
      .get('/api/admin/library/authors')
      .set('Authorization', 'Bearer test-token')
      .set('X-Forwarded-Proto', 'https')
      .expect(200);
    expect(adminService.listResource).toHaveBeenCalledWith('authors', {});
  } finally {
    restoreEnvironment(snapshot);
  }
});

test('production liveness remains available over the internal HTTP hop', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps();
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  } finally {
    restoreEnvironment(snapshot);
  }
});
```

- [ ] **Bước 4: Chạy kiểm thử tập trung và xác nhận RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/envConfig.test.js tests/httpsEnforcement.test.js tests/authRoutes.test.js
```

Dự kiến: các kiểm thử sàn bcrypt sản xuất mới không thành công, phản hồi OTP chứa `debugOtp` và yêu
cầu HTTP API không xác thực sẽ được định tuyến thay vì trả về `HTTPS_REQUIRED`.

- [ ] **Bước 5: Triển khai sàn bcrypt**

Thêm vào `env.js`:

```js
function bcryptCostFromEnv() {
  const value = positiveIntegerFromEnv('BCRYPT_COST', 10);
  const minimum = process.env.NODE_ENV === 'test' ? 4 : 10;
  if (value < minimum) {
    const suffix = process.env.NODE_ENV === 'test' ? 'in NODE_ENV=test' : 'outside NODE_ENV=test';
    throw new Error(`BCRYPT_COST must be an integer >= ${minimum} ${suffix}`);
  }
  return value;
}
```

Xuất `bcryptCost: bcryptCostFromEnv()` thay vì `numberFromEnv('BCRYPT_COST', 10)`.

- [ ] **Bước 6: Xóa đường dẫn gỡ lỗi OTP và các cờ kiểm tra lỗi thời**

Xóa `exposeDebugTokens` khỏi danh sách tham số `createAuthService` và xóa:

```js
if (exposeDebugTokens) response.debugOtp = otp;
```

Trả về đối tượng phản hồi trực tiếp. Xóa mọi `process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';` trong
`backend/tests` và tùy chọn `exposeDebugTokens: true` khỏi `userManagementService.test.js`. Không
thay đổi tài liệu quy hoạch lịch sử.

Xác minh loại bỏ nguồn/kiểm tra:

```powershell
rg -n "AUTH_EXPOSE_TEST_TOKENS|exposeDebugTokens|debugOtp" backend/src backend/tests
```

Dự kiến: chỉ có thể giữ lại các xác nhận phủ định chứa `debugOtp`; không còn sự xuất hiện nguồn/cấu
hình/chuyển nhượng nào.

- [ ] **Bước 7: Mở rộng việc thực thi HTTPS sang không gian tên API chính xác**

Thêm:

```js
function isApiRequest(req) {
  return req.path === '/api' || req.path.startsWith('/api/');
}
```

Thay đổi thông báo bảo vệ phần mềm trung gian và an toàn thành:

```js
if (!enabled || !isApiRequest(req) || requestProtocol(req) === 'https') {
  return next();
}

return res.status(400).json({
  error: {
    code: 'HTTPS_REQUIRED',
    message: 'HTTPS is required for API requests.',
  },
});
```

Giữ nguyên biểu thức chính quy của máy chủ lưu trữ chuẩn và mã chuyển hướng `308` hiện có.

- [ ] **Bước 8: Chạy kiểm thử GREEN thời gian chạy phần việc B**

```powershell
npm --prefix backend test -- --runTestsByPath tests/envConfig.test.js tests/httpsEnforcement.test.js tests/authRoutes.test.js
```

Dự kiến: cả ba dãy ĐẠT; `0` không thành công.

Đừng cam kết; Nhiệm vụ 4 bổ sung phần khác biệt xác thực được xem xét còn lại trước H2-P.

---

### Nhiệm vụ 4: Thực hiện kiểm tra đăng nhập và đăng xuất thành công không thành công

**Tệp:**

- Sửa đổi: `backend/tests/authRoutes.test.js:624-749` và nối thêm các trường hợp khôi phục gần các kiểm thử nguyên tử hiện có
- Sửa đổi: `backend/tests/helpers/inMemoryAuthRepositories.js:309-317` để `markTokenUsed` và `revokeToken` chấp nhận rõ ràng một đối số `_transaction` chưa được sử dụng trong khi ảnh chụp nhanh giao dịch xung quanh tiếp tục cung cấp bằng chứng khôi phục
- Sửa đổi: `backend/src/services/authService.js:100-123,592-620,643-659`
- Sửa đổi: `backend/src/repositories/authTokenRepository.js:90-111`

**Giao diện:**

- Tiêu thụ: `authTransactionRepository.withTransaction(work)`, `auditLogRepository.create({ transaction })` và hợp đồng `FE02-T067` đang hoạt động.
- Tạo ra: `revokeToken(tokenId, transaction)` và yêu cầu ghi `AUTH_LOGIN_SUCCESS`/`AUTH_LOGOUT` cùng giao dịch.

- [ ] **Bước 1: Viết các kiểm thử khôi phục/kiểm tra đăng nhập không thành công**

Thêm vào `authRoutes.test.js`:

```js
test('login rolls back session state when required success audit fails', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'login-audit-rollback@example.test');
  dependencies.state.users[0].failedLoginCount = 2;
  dependencies.state.users[0].lastLoginAt = null;
  const originalCreate = dependencies.auditLogRepository.create;
  jest.spyOn(dependencies.auditLogRepository, 'create').mockImplementation(async (entry) => {
    if (entry.action === 'AUTH_LOGIN_SUCCESS') throw new Error('login audit failed');
    return originalCreate(entry);
  });

  const response = await login(app, 'login-audit-rollback@example.test');

  expect(response.status).toBe(500);
  expect(response.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error.' });
  expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
  expect(dependencies.state.users[0].failedLoginCount).toBe(2);
  expect(dependencies.state.users[0].lastLoginAt).toBeNull();
  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGIN_SUCCESS')).toHaveLength(0);
});

test('successful login records one required audit with request context', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'login-audit-context@example.test');

  await request(app)
    .post('/api/auth/login')
    .set('User-Agent', 'login-audit-agent')
    .send({ email: 'login-audit-context@example.test', password: 'Password1!' })
    .expect(200);

  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGIN_SUCCESS')).toEqual([
    expect.objectContaining({
      userId: dependencies.state.users[0].userId,
      targetType: 'USER',
      targetId: dependencies.state.users[0].userId,
      ipAddress: expect.any(String),
      userAgent: 'login-audit-agent',
    }),
  ]);
});
```

- [ ] **Bước 2: Viết các kiểm thử khôi phục/đăng xuất không thành công**

```js
test('logout rolls back refresh-token revoke when required audit fails', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'logout-audit-rollback@example.test');
  const loginResponse = await login(app, 'logout-audit-rollback@example.test');
  const refreshTokenId = dependencies.state.tokens.find(
    (token) => token.tokenType === 'REFRESH'
  ).tokenId;
  const originalCreate = dependencies.auditLogRepository.create;
  jest.spyOn(dependencies.auditLogRepository, 'create').mockImplementation(async (entry) => {
    if (entry.action === 'AUTH_LOGOUT') throw new Error('logout audit failed');
    return originalCreate(entry);
  });

  const response = await request(app)
    .post('/api/auth/logout')
    .send({ refreshToken: loginResponse.body.refreshToken });

  expect(response.status).toBe(500);
  expect(response.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error.' });
  expect(dependencies.state.tokens.find((token) => token.tokenId === refreshTokenId).revokedAt)
    .toBeNull();
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .expect(200);
});

test('logout stays idempotent and writes one required audit when the token is absent', async () => {
  const { app, dependencies } = makeTestApp();

  await request(app)
    .post('/api/auth/logout')
    .set('User-Agent', 'logout-idempotent-agent')
    .send({ refreshToken: 'missing-refresh-token' })
    .expect(200, { message: 'Logged out' });

  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGOUT')).toEqual([
    expect.objectContaining({
      userId: null,
      targetType: 'USER',
      targetId: null,
      ipAddress: expect.any(String),
      userAgent: 'logout-idempotent-agent',
    }),
  ]);
});
```

- [ ] **Bước 3: Chạy kiểm thử xác thực tập trung và xác nhận RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js
```

Dự kiến: lỗi kiểm tra đăng nhập trả về `500` nhưng để lại mã thông báo làm mới/thao tác ghi lần đăng
nhập cuối cùng và lỗi kiểm tra đăng xuất khiến mã thông báo bị thu hồi; những xác nhận mới này không
thành công trước khi thực hiện.

- [ ] **Bước 4: Di chuyển kiểm tra đăng nhập thành công vào bên trong giao dịch hiện có**

Thay đổi giao dịch đăng nhập thành công thành:

```js
const storedRefreshToken = await authTransactionRepository.withTransaction(async (transaction) => {
  const prepared = await userRepository.resetFailedLoginsAndSetLastLogin(user.userId, transaction);
  if (!prepared) {
    throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  const storedToken = await createStoredToken(
    user.userId,
    'REFRESH',
    addDays(clock(), env.refreshTokenTtlDays),
    context,
    transaction
  );
  await writeAudit(context, 'AUTH_LOGIN_SUCCESS', {
    userId: user.userId,
    targetId: user.userId,
    metadata: { identifier, reason: 'AUTHENTICATED' },
    transaction,
    required: true,
  });
  return storedToken;
});
```

Xóa cuộc gọi `AUTH_LOGIN_SUCCESS` sau giao dịch cũ. Tiếp tục ký mã thông báo truy cập và tạo phản
hồi sau khi cam kết.

- [ ] **Bước 5: Thực hiện thu hồi nhận thức giao dịch và chuyển kiểm tra đăng xuất thành giao dịch**

Thay đổi chức năng kho lưu trữ thành:

```js
async function revokeToken(tokenId, transaction) {
  const request = transaction ? new sql.Request(transaction) : (await getPool()).request();
  await request
    .input('TokenId', sql.Int, tokenId)
    .query(`
      UPDATE AuthTokens
      SET RevokedAt = COALESCE(RevokedAt, GETDATE())
      WHERE TokenId = @TokenId
    `);
}
```

Giữ giao diện kho lưu trữ trong bộ nhớ được căn chỉnh mà không thay đổi hành vi chụp nhanh của nó:

```js
async markTokenUsed(tokenId, _transaction) {
  const token = tokens.find((item) => item.tokenId === Number(tokenId));
  token.usedAt = new Date();
},

async revokeToken(tokenId, _transaction) {
  const token = tokens.find((item) => item.tokenId === Number(tokenId));
  token.revokedAt = new Date();
},
```

Thay đổi đăng xuất thành:

```js
async function logout(input, context = {}) {
  const refreshTokenHash = hashToken(String(input.refreshToken || '').trim());
  const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', refreshTokenHash);

  await authTransactionRepository.withTransaction(async (transaction) => {
    if (tokenRecord) {
      const revoke = typeof authTokenRepository.revokeToken === 'function'
        ? authTokenRepository.revokeToken
        : authTokenRepository.markTokenUsed;
      await revoke(tokenRecord.tokenId, transaction);
    }
    await writeAudit(context, 'AUTH_LOGOUT', {
      userId: context.userId || tokenRecord?.userId || null,
      targetId: context.userId || tokenRecord?.userId || null,
      transaction,
      required: true,
    });
  });

  return { message: 'Logged out' };
}
```

Cập nhật nhận xét `writeAudit` để nêu rõ "nỗ lực tốt nhất theo mặc định; yêu cầu ghi lỗi lan truyền"
mà không thay đổi hành vi sự kiện không liên quan.

- [ ] **Bước 6: Chạy kiểm thử xác thực GREEN tập trung**

```powershell
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Dự kiến: tất cả các dãy được liệt kê ĐẠT; `0` không thành công. Kiểm tra lỗi đăng nhập/đăng xuất cho
thấy khôi phục và đăng xuất bình thường vẫn trả về `200`.

Ghi lại cam kết xác thực sau H2-P dự định, nhưng chưa chạy nó:

```powershell
git add backend/src/config/env.js backend/src/middleware/httpsEnforcement.js backend/src/services/authService.js backend/src/repositories/authTokenRepository.js backend/tests/authRoutes.test.js backend/tests/envConfig.test.js backend/tests/httpsEnforcement.test.js backend/tests/helpers/inMemoryAuthRepositories.js backend/tests/bookRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/integration.test.js backend/tests/inventoryRoutes.test.js backend/tests/membershipRoutes.test.js backend/tests/notificationRoutes.test.js backend/tests/reportRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/systemIntegration.test.js backend/tests/userManagementService.test.js
git commit -m "fix: harden authentication runtime"
```

---

### Nhiệm vụ 5: Chạy L1-L4, lấy H2-P, cam kết, xuất bản và đóng H3-P

**Tệp:**

- Xác minh tất cả các tệp sản phẩm từ Nhiệm vụ 2-4.
- Không thay đổi `.github/workflows`, `database`, nguồn giao diện người dùng, cài đặt Azure, bảo vệ nhánh, thẻ phát hành hoặc tài liệu lô 2.

**Giao diện:**

- Tiêu thụ: Hoàn thành khác biệt sản phẩm phần việc A + phần việc B có sẵn.
- Tạo ra: Hai cam kết sản phẩm được đánh giá, một PR sản phẩm, bằng chứng CI chính xác, quyết định H3-P và xác minh sau hợp nhất.

- [ ] **Bước 1: Chạy cổng tập trung L1**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js tests/adminPermissionService.test.js
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Dự kiến: mọi bộ được liệt kê đạt; `0` không thành công.

- [ ] **Bước 2: Chạy hồi quy và bảo hiểm máy chủ L2**

```powershell
npm --prefix backend test
npm --prefix backend run test:coverage:ci
```

Dự kiến: thoát `0`; mọi bộ máy chủ đều vượt qua; các câu lệnh/nhánh/chức năng/dòng toàn cục vẫn ở
mức hoặc cao hơn `80%`.

- [ ] **Bước 3: Chạy quản trị L3 và an toàn kho lưu trữ**

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
git status --short
```

Dự kiến: truy vết và kiểm tra bí mật thoát `0`; không có lỗi khoảng trắng; trạng thái chỉ chứa các
tệp sản phẩm được phê duyệt.

Chạy quét phạm vi/bảo mật:

```powershell
rg -n "AUTH_EXPOSE_TEST_TOKENS|exposeDebugTokens" backend/src backend/tests
rg -n "debugOtp" backend/src
rg -n "CATALOG_METADATA_(CREATE|UPDATE|DEACTIVATE)" backend/src backend/tests
git diff --name-only origin/main...HEAD
git diff --name-only
```

Dự kiến: hai lần quét đầu tiên không trả về kết quả nguồn/cấu hình nào phù hợp; các hành động trong
danh mục chỉ xảy ra trong dịch vụ/kiểm tra của Quản trị viên; danh sách tệp đã cam kết và cây làm
việc nằm trong phạm vi được phê duyệt.

- [ ] **Bước 4: Chạy cổng tích hợp quan sát L4**

```powershell
npm run test:system
npm run test:e2e
npm run test:deployment
```

Dự kiến: hệ thống, Crom E2E và các bộ triển khai đều thoát khỏi `0`. Nếu chỉ riêng E2E có vẻ không
ổn định, hãy chạy lại nó một lần với kết quả đã ghi lại; không chạy lại các lỗi xác định mà không có
chẩn đoán mã.

- [ ] **Bước 5: Thực hiện điểm kiểm tra đánh giá H2-P**

Hiện tại:

- sự khác biệt hoàn toàn của sản phẩm so với `origin/main` hỗ trợ quản trị;
- Đầu ra và số lượng lệnh L1-L4;
- ánh xạ rõ ràng tới `FE05-T019`, `FE11-CAT01`, `FE02-T067`;
- rủi ro còn sót lại khi việc kiểm tra nỗ lực đăng nhập/thất bại/khóa/tự động mở khóa vẫn là nỗ lực tốt nhất;
- xác nhận không có lược đồ/phụ thuộc/API/mở rộng vai trò và không có OTP/bí mật bị lộ.

Không thực hiện hoặc cam kết cho đến khi người dùng cấp H2-P.

- [ ] **Bước 6: Sau H2-P, tạo hai cam kết sản phẩm đã đánh giá mà không cần chỉnh sửa**

```powershell
git add backend/src/controllers/adminController.js backend/src/services/adminService.js backend/src/repositories/adminRepository.js backend/tests/adminLibraryRoleBoundary.test.js backend/tests/adminCatalogMetadataService.test.js backend/tests/adminCatalogMetadataRepository.test.js backend/tests/adminAuditLogService.test.js
git diff --cached --check
git commit -m "fix: make catalog metadata audit atomic"

git add backend/src/config/env.js backend/src/middleware/httpsEnforcement.js backend/src/services/authService.js backend/src/repositories/authTokenRepository.js backend/tests/authRoutes.test.js backend/tests/envConfig.test.js backend/tests/httpsEnforcement.test.js backend/tests/helpers/inMemoryAuthRepositories.js backend/tests/bookRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/integration.test.js backend/tests/inventoryRoutes.test.js backend/tests/membershipRoutes.test.js backend/tests/notificationRoutes.test.js backend/tests/reportRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/systemIntegration.test.js backend/tests/userManagementService.test.js
git diff --cached --check
git commit -m "fix: harden authentication runtime"

git status --short
```

Dự kiến: đúng hai cam kết sản phẩm mới; cây làm việc sạch sẽ; không có tệp nào ngoài bộ được xem xét
H2-P được cam kết.

- [ ] **Bước 7: Đẩy và mở PR sản phẩm**

```powershell
git push -u origin codex/audit-hardening-product
gh pr create --base main --head codex/audit-hardening-product --title "fix: harden catalog and authentication audit" --body "Design: docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md. Plan: docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md. Tasks: FE05-T019, FE11-CAT01, FE02-T067. Evidence: L1-L4 results are included in the PR checks/review record. Residual boundary: login attempt/failure/lock/auto-unlock audit remains best-effort."
gh pr checks --watch
gh pr view --json number,headRefOid,mergeable,statusCheckRollup,url
```

Trong phần mô tả PR, hãy giữ lại các tham chiếu của tài liệu thiết kế tới:

- thiết kế `2026-08-01-audit-hardening-batch-1-design.md`;
- kế hoạch `2026-08-01-audit-hardening-batch-1.md`;
- nhiệm vụ `FE05-T019`, `FE11-CAT01`, `FE02-T067`;
- Bằng chứng L1-L4;
- ranh giới kiểm toán nỗ lực tốt nhất còn lại.

Dự kiến: `foundation-checks` được yêu cầu chạy dựa trên đầu sản phẩm chính xác; PR vẫn chưa được hợp nhất.

- [ ] **Bước 8: Dừng ở H3-P, sau đó hợp nhất và chỉ xác minh sau khi được phê duyệt**

Trước H3-P, xác nhận chính xác đầu PR SHA, yêu cầu kiểm tra thành công, khả năng hợp nhất, khác biệt
cuối cùng và không có cam kết mới nào sau H2-P. Chỉ H3-P rõ ràng mới cho phép hợp nhất.

Sau khi hợp nhất, hãy xác minh cam kết hợp nhất chính xác trên `main`:

```powershell
gh pr merge --merge
git fetch origin
git log -1 --oneline origin/main
gh run list --branch main --limit 5
```

Chờ bằng chứng triển khai/CI sau hợp nhất chính xác. Báo cáo các mã định danh nhánh/cam kết/PR/chạy
cuối cùng và nêu rõ liệu giai đoạn kiểm thử nhanh có đạt hay không. Không tạo thẻ phát hành hoặc thay đổi
cài đặt kho lưu trữ/Azure.

---

## Danh sách kiểm tra tự đánh giá

- Phạm vi yêu cầu: Nhiệm vụ 1 kích hoạt tất cả các quy tắc FE02/FE05/FE11; Nhiệm vụ 2 bao gồm tính chính xác/kiểm tra của Quản trị viên; Nhiệm vụ 3-4 bao gồm kiểm tra bcrypt/OTP/HTTPS/phiên; Nhiệm vụ 5 bao gồm tất cả các cổng L1-L4 và H2/H3.
- Tính nhất quán của giao diện: bộ điều khiển sử dụng `{ actorId, ip, userAgent }`; kho kiểm toán nhận `{ userId, ipAddress, userAgent, transaction }`; phương thức kho tài nguyên nhận giao dịch cuối cùng; thu hồi mã thông báo nhận giao dịch cuối cùng.
- Tính nhất quán của phạm vi: không có lược đồ, sự phụ thuộc, hành vi giao diện người dùng, điểm cuối, vai trò, quy trình làm việc, thẻ phát hành, cài đặt GitHub, cài đặt Azure, SQL CI hoặc thay đổi Lô 2.
- Rủi ro còn lại rất rõ ràng: việc kiểm tra sự kiện đăng nhập không thành công vẫn là nỗ lực tốt nhất và không được yêu cầu hoàn thành.
- Cam kết nhất quán: cam kết quản trị chỉ sau H2-G; sản phẩm chỉ cam kết sau H2-P; mỗi PR vẫn yêu cầu H3 riêng.
