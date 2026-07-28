# PLAN.md - Quản lý sách FE05

Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2

Chủ sở hữu: Dung

Cập nhật: 2026-07-28

Trạng thái quy trình: đã hoàn tất cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là snapshot thực thi lịch sử đã được bằng chứng đó thay thế.

> **Dành cho agent triển khai:** Thực hiện `TASKS.md` theo thứ tự. Giữ quyền sở hữu catalog FE05, bắt đầu mỗi nhiệm vụ hành vi bằng kiểm thử tập trung thất bại và không thay đổi trạng thái vòng đời bản sao FE06 từ FE05.

---

## 1. Mục tiêu

Duy trì catalog FE05 đã đối soát theo hợp đồng v0.6.10 đã phê duyệt: truy vấn công khai/nhân viên xác định, đọc dữ liệu tham chiếu đang hoạt động, cổng khởi động trước khi lắng nghe cho compatibility migration đã đóng gói và rà soát, mức sẵn sàng triển khai nhận biết schema, triển khai staging liên tục có cổng CI, ảnh bìa được quản lý và xác thực, mutation có audit nguyên tử, đồng thời lạc quan, lệnh hủy kích hoạt/kích hoạt lại rõ ràng, đối soát danh sách sau mutation giữ ngữ cảnh, kết xuất trạng thái catalog chuẩn và khả dụng suy ra chỉ đọc từ trạng thái bản sao FE06.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-book-management/SPEC.md` v0.6.9.
- `.sdd/specs/feat-book-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-book-management/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `.sdd/specs/feat-inventory-book-copy/SPEC.md` về quyền sở hữu bản sao và khả dụng.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Sai lệch mốc cơ sở đã đối soát

| Hợp đồng đã phê duyệt | Phần triển khai đã đối soát |
| --- | --- |
| FE05 không bao giờ thay đổi `BookCopies.Status` | Route `/availability` cũ, mutation repository và các control trạng thái bản sao BookManagement đã bị loại; kiểm thử thực thi khả dụng suy ra chỉ đọc. |
| Mutation sách hiện có yêu cầu `If-Match`/SQL `rowversion` | `Books.RowVersion` và lệnh metadata/trạng thái nhận biết phiên bản đã được triển khai. |
| Thay đổi trạng thái dùng lệnh hủy kích hoạt/kích hoạt lại riêng với lý do | Cả hai lệnh yêu cầu phiên bản khớp và lý do đã trim; PUT metadata không thể thay đổi trạng thái. |
| Danh sách công khai và nhân viên sử dụng chính sách phân trang/sắp xếp xác định | Các filter, cấu trúc endpoint và xác thực đã phê duyệt được triển khai và kiểm thử. |
| Create/update/deactivate/reactivate cùng audit là nguyên tử | Transaction repository và độ bao phủ rollback chứng minh tính nguyên tử mutation/audit. |
| Khả dụng công khai chỉ đọc `AVAILABLE`/`UNAVAILABLE` | Frontend kết xuất khả dụng suy ra mà không phân loại mọi hàng không khả dụng là đã mượn. |
| Endpoint công khai và nhân viên có mức hiển thị khác nhau | Tìm kiếm Khách/Thành viên chỉ theo tiêu đề/tác giả và DTO công khai loại ISBN; danh sách/chi tiết nhân viên vẫn giữ ISBN có thể tìm kiếm sau phân quyền Thủ thư/Quản trị viên. |
| Admin Console FE11 không được sao chép mutation FE05 | `UserManagement` giữ bảng Thư viện chỉ đọc; `BookManagement` chuẩn sở hữu create/update/deactivate/reactivate. |

## 4. Phạm vi

### Trong phạm vi

- Tìm kiếm/chi tiết công khai và danh sách quản lý được bảo vệ từ Mục 11 của `SPEC.md`.
- Create và cập nhật chỉ metadata cùng xác thực trường/tham chiếu/ISBN/năm/số trang/đánh giá bắt buộc.
- Lựa chọn thể loại/tác giả/nhà xuất bản đang hoạt động được bảo vệ cho biểu mẫu sách Thủ thư/Quản trị viên.
- Tải ảnh bìa JPG/PNG/WebP được quản lý, có xác thực và bù trừ lỗi.
- Hủy kích hoạt và kích hoạt lại `ACTIVE`/`INACTIVE` mà không thay đổi bản sao hoặc lịch sử.
- SQL `rowversion`, `If-Match`, `409 STALE_BOOK_STATE` và response phiên bản mới.
- Audit log nguyên tử cho mọi mutation catalog.
- Khả dụng chỉ đọc suy ra từ trạng thái cha và trạng thái bản sao FE06 đã commit gần nhất.
- Kiểm thử route/repository/SQL backend, kiểm thử hồi quy frontend, tài liệu API và traceability.

### Ngoài phạm vi

- Tạo bản sao vật lý hoặc chuyển đổi trạng thái bản sao.
- Nhiều tác giả hoặc thể loại nhiều-nhiều.
- Byte ảnh bìa trong SQL Server, đường dẫn tệp không được quản lý tùy ý, quy trình đề xuất, rà soát hoặc đánh giá.
- Triển khai mượn, đặt chỗ, tiền phạt hoặc báo cáo.
- Xóa vật lý sách.

## 5. Bản đồ tệp và interface

| Khu vực | Tệp | Trách nhiệm |
| --- | --- | --- |
| Hợp đồng SQL | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Thêm rowversion `Books`, giữ unique ISBN đã lọc, ghi nhận quyền sở hữu catalog/bản sao. |
| Ranh giới HTTP | `backend/src/app.js`, `backend/src/routes/bookRoutes.js`, `backend/src/controllers/bookController.js`, tạo `backend/src/validators/bookValidators.js` | Route công khai/được bảo vệ, `If-Match`, xác thực query/body và lỗi an toàn. |
| Quy tắc nghiệp vụ | `backend/src/services/bookService.js` | Filter xác định, xác thực metadata, lệnh trạng thái và hợp đồng khả dụng suy ra. |
| Persistence | `backend/src/repositories/bookRepository.js`, `backend/src/repositories/auditLogRepository.js` | Truy vấn có tham số, tổng hợp trạng thái bản sao, so sánh rowversion và ghi có audit nguyên tử. |
| Tương thích triển khai | `backend/src/services/schemaReadinessService.js`, `backend/src/startApplication.js`, `.github/workflows/deploy-staging.yml`, các tệp `database/migrations/*.sql` đã phê duyệt | Đóng gói và chỉ áp dụng compatibility migration đã rà soát trước khi lắng nghe, xác minh postcondition và giữ readiness chỉ đọc. |
| Model/tài liệu | `backend/src/models/Book.js`, `backend/src/docs/openapi.yaml` | Metadata rowversion và schema request/response/lỗi API đã phê duyệt. |
| Kiểm thử backend | tạo `backend/tests/bookRoutes.test.js`, `backend/tests/bookAvailabilityRepository.test.js`, tạo `backend/tests/sql/bookConcurrency.sqltest.js`, tạo `backend/tests/helpers/inMemoryBookRepositories.js` | Hành vi công khai/nhân viên, xác thực, quyền sở hữu, rollback và bằng chứng ghi cũ. |
| Frontend | `frontend/src/page/BookManagement.jsx`, `frontend/src/api/libraryFeatureApi.js` | Cấu trúc endpoint đã phê duyệt, truyền phiên bản, lý do xác nhận, tải lại danh sách chuẩn không lọc sau mutation trạng thái một sách, kết xuất cột trạng thái chuẩn và khả dụng chỉ đọc trong projection chi tiết. |
| Kiểm thử frontend | `frontend/test/bookManagementFrontend.test.js` | Loại kỳ vọng prototype và khóa hợp đồng UI/API v0.5.0. |

## 6. Interface đã phê duyệt

| Phương thức | Endpoint | Hành vi bắt buộc |
| --- | --- | --- |
| `GET` | `/api/books` | Sách đang hoạt động an toàn cho công khai không có ISBN; q chỉ khớp tiêu đề/tác giả; filter, phân trang, sắp xếp và khả dụng suy ra có tính xác định. |
| `GET` | `/api/books/{bookId}` | Khách/Thành viên nhận chi tiết đang hoạt động không có ISBN hoặc `404`; nhân viên được cấp quyền có thể nhận chi tiết `ACTIVE` hoặc `INACTIVE` gồm ISBN và trường quản lý khác. |
| `GET` | `/api/admin/books` | Danh sách quản lý phân trang của Thủ thư/Quản trị viên, gồm bản ghi hoạt động/không hoạt động và tìm kiếm/hiển thị ISBN. |
| `GET` | `/api/books/metadata` | Lựa chọn thể loại/tác giả/nhà xuất bản đang hoạt động của Thủ thư/Quản trị viên; chỉ đọc cho Thủ thư. |
| `POST` | `/api/books` | Thủ thư/Quản trị viên tạo sách `ACTIVE` và nhận phiên bản. |
| `PUT` | `/api/books/{bookId}` | Thủ thư/Quản trị viên cập nhật chỉ metadata bằng `If-Match`; không bao giờ thay đổi trạng thái hoặc bản sao. |
| `PATCH` | `/api/books/{bookId}/deactivate` | `If-Match` khớp cùng `{ reason }`; chỉ thay `Books.Status` thành `INACTIVE`. |
| `PATCH` | `/api/books/{bookId}/reactivate` | `If-Match` khớp cùng `{ reason }`; chỉ thay `Books.Status` thành `ACTIVE`. |

Route `/api/books/{bookId}/availability` cũ và các phương thức mutation controller/service/repository của nó phải bị loại. Lời gọi đến route chưa đăng ký đó trả về response `404` an toàn tiêu chuẩn và không bao giờ ghi `Books` hoặc `BookCopies`.

## 7. Chiến lược triển khai theo thứ tự

### 7.1 Khóa V0.5.0 bằng kiểm thử RED

- Thêm kiểm thử route cho khả năng hiển thị công khai, danh sách nhân viên, RBAC, từ chối query xác định, xác thực trường/tham chiếu/ISBN, `If-Match`, lý do, lệnh trạng thái và từ chối mutation bản sao.
- Thêm kiểm thử repository cho khả dụng suy ra và kiểm thử SQL cho mutation cạnh tranh cũ cùng rollback audit.
- Thay kiểm thử frontend hiện assert mutation khả dụng bị cấm.

### 7.2 Đối soát schema và đồng thời

- Thêm SQL `rowversion` vào `Books` và hiển thị phiên bản API opaque.
- Cập nhật metadata ADR/model trước logic mutation repository.
- So sánh phiên bản của bên gọi trong cùng transaction cập nhật sách và ghi audit.

### 7.3 Đối soát thao tác đọc công khai và nhân viên

- Truy vấn công khai chỉ bao gồm sách `ACTIVE` và trường an toàn công khai.
- Truy vấn quản lý nhân viên có thể bao gồm cả hai trạng thái.
- Áp dụng chính xác quy tắc keyword/page/limit/sort/order và tie-breaking ổn định theo `BookId`.
- Suy ra khả dụng từ `Books.Status` cùng `BookCopies.Status = AVAILABLE`; không bao giờ lưu cột khả dụng FE05.

### 7.4 Đối soát mutation catalog

- Create xác thực tiêu đề, ISBN duy nhất tùy chọn, tham chiếu thể loại/tác giả/nhà xuất bản, năm, số trang, đánh giá, mô tả và URL ảnh bìa.
- Cập nhật metadata không thể chấp nhận trường trạng thái/bản sao.
- Hủy kích hoạt/kích hoạt lại yêu cầu phiên bản hiện tại và lý do; chỉ `Books.Status` thay đổi.
- Mọi mutation và audit entry thành công cùng commit hoặc cùng rollback.

### 7.5 Đối soát frontend và bằng chứng

- Sử dụng endpoint công khai/quản trị đã phê duyệt và truyền phiên bản được thấy gần nhất qua `If-Match`.
- Thay fallback “borrowed” bằng nhãn không khả dụng chính xác `Không khả dụng`.
- Yêu cầu xác nhận/lý do rõ ràng khi hủy kích hoạt/kích hoạt lại và làm mới trạng thái server chuẩn sau mỗi mutation.
- Thêm tag `@spec` và bằng chứng tập trung trước cổng merge toàn bộ.

## 8. Thứ tự phụ thuộc

1. Kiểm thử hợp đồng route/repository/SQL/frontend RED.
2. Hợp đồng SQL rowversion, ADR/model và OpenAPI.
3. Validator và đối soát truy vấn đọc.
4. Triển khai create/update/deactivate/reactivate nguyên tử.
5. Đối soát frontend.
6. Traceability, xác thực tập trung, sau đó rà soát thủ công.

Hợp đồng đọc FE05 phải ổn định trước khi FE06/FE07 sử dụng trạng thái sách cha và bản tóm tắt catalog.

## 9. Cổng xác thực

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Backend FE05 | `npm.cmd --prefix backend test -- --runTestsByPath tests/bookRoutes.test.js tests/bookAvailabilityRepository.test.js` | Kiểm thử công khai/nhân viên, xác thực, quyền sở hữu và khả dụng suy ra vượt qua. |
| SQL đồng thời FE05 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/bookConcurrency.sqltest.js` | Các trường hợp mutation cũ và rollback audit vượt qua khi có cấu hình kiểm thử SQL. |
| Frontend FE05 | `node --test frontend/test/bookManagementFrontend.test.js` | Không mutation bản sao, nhãn không khả dụng chính xác, kiểm tra phiên bản và lệnh trạng thái vượt qua. |
| Readiness triển khai | `node --test tests/deployment/smokeStaging.test.js tests/deployment/stagingWorkflowPolicy.test.js` cùng kiểm thử khởi động backend tập trung | Backend áp dụng metadata migration đã đóng gói và rà soát trước khi lắng nghe, xác minh postcondition và smoke từ chối mọi schema drift còn lại; triển khai staging chỉ theo một lần chạy CI `main` thành công của commit chính xác. |
| Traceability | `npm.cmd run trace:enforce` | Các tệp triển khai FE05 đã thay đổi đáp ứng ngưỡng kho mã nguồn. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

## 10. Cổng rà soát thủ công

- [x] Xác nhận phương án migration/compatibility `/api/admin/books`.
- [x] Xác nhận encoding `If-Match` và cấu trúc response phiên bản.
- [x] Xác nhận mutation khả dụng cũ bị loại mà không chuyển quyền sở hữu bản sao vào FE05.
- [x] Xác nhận hủy kích hoạt/kích hoạt lại chỉ thay `Books.Status` và giữ mọi bản ghi quy trình.
- [x] Phê duyệt thứ tự và ánh xạ `TASKS.md` trước khi triển khai bắt đầu.

## 11. Tải ảnh bìa được quản lý V0.6.0

1. Khóa hành vi create/update multipart bằng kiểm thử hợp đồng route, an toàn storage và frontend.
2. Chấp nhận request tương thích JSON hoặc request multipart chứa `metadata` đã tuần tự hóa và một tệp `cover` tùy chọn.
3. Xác thực kích thước tối đa 2 MB, sự khớp giữa phần mở rộng/MIME/signature JPG/PNG/WebP và đường dẫn lưu trữ do server tạo.
4. Bù trừ thao tác ghi filesystem khi create/update, đồng thời lạc quan, database hoặc audit xử lý thất bại.
5. Thay cả hai trường URL ảnh bìa có thể chỉnh sửa bằng bộ chọn tệp cục bộ, preview, hướng dẫn tên tệp/loại/kích thước và phân giải asset theo backend origin.
6. Xác thực suite backend/frontend tập trung, phân tích OpenAPI, lint/build, traceability và vệ sinh diff trước khi rà soát thủ công.
