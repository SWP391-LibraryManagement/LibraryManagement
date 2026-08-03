# PLAN.md - Quản lý thành viên FE04

Trạng thái: COMPLETE - PHẠM VI CỐT LÕI VÀ ADMIN EXTENSION

Chủ sở hữu: Dat

Cập nhật: 2026-08-03

Trạng thái quy trình: COMPLETE cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI `main` chính xác sau merge được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu cổng đang chờ/mở bên dưới là snapshot thực thi lịch sử đã được bằng chứng đó thay thế.

Trạng thái mở rộng: `FE04-ADM01..ADM05` và `FE04-CONV-001..002` đã hoàn tất. Playwright local, Azure Staging run `lms-fe04-acceptance-20260803-90ac1d5b`, L1, H2 vòng 1 và H3/manual-owner acceptance đều đạt; xem [H3 round 1](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/107#issuecomment-5162255705).

> **Dành cho agent triển khai:** Thực hiện `TASKS.md` theo thứ tự. Mỗi nhiệm vụ hành vi bắt đầu bằng kiểm thử tập trung thất bại, thêm phần triển khai nhỏ nhất thỏa đặc tả đã phê duyệt và kết thúc bằng cổng xác thực được liệt kê.

---

## 1. Mục tiêu

Đối soát prototype FE04 hiện có với hợp đồng thành viên chuẩn đã phê duyệt để lịch sử đơn, điều kiện hiện tại, metadata người rà soát, dữ liệu audit và việc gửi FE10 duy trì tính xác định trong điều kiện sử dụng bình thường và đồng thời.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-membership-management/SPEC.md` v0.2.1.
- `.sdd/specs/feat-membership-management/CONTEXT.md` v0.2.0.
- `.sdd/specs/feat-membership-management/TEST_PLAN.md`.
- `.sdd/rfcs/ADR-002-database-design.md`.
- `.sdd/specs/feat-notification-management/SPEC.md` về quyền sở hữu bên yêu cầu `MEMBERSHIP_RESULT`.
- `database/Librarymanagement.sql`.
- `.sdd/constraints/safety.md`.

## 3. Baseline hiện có và sai lệch (snapshot lịch sử)

Kho mã nguồn đã chứa FE04 route, controller, service, repository, validator, kiểm thử route, repository in-memory và màn hình frontend. Các tệp này là bằng chứng prototype, không phải bằng chứng hoàn tất cho v0.2.0.

Bảng sai lệch dưới đây ghi nhận baseline trước đối soát. Bảng được giữ vì khả năng audit và đã được thay thế bởi bằng chứng triển khai và chốt Giai đoạn 2 được ghi trong `TASKS.md`, `TEST_PLAN.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

| Hợp đồng đã phê duyệt | Sai lệch hiện tại cần đối soát |
| --- | --- |
| `Members.Status` là nguồn điều kiện chuẩn | Response trạng thái hiện ưu tiên đơn gần nhất và không trả về cấu trúc `{ membershipStatusView, memberStatus, currentApplication }` đã phê duyệt. |
| Ghi application/member/audit là nguyên tử | Thao tác mutation ở repository và ghi audit ở service hiện là các thao tác riêng. |
| Tối đa một đơn đang chờ và một kết quả rà soát cuối cùng | Có kiểm tra in-memory, nhưng thiếu bằng chứng về uniqueness ở cấp SQL và rà soát đồng thời. |
| Người dùng bị từ chối có thể nộp lại đơn mà vẫn giữ lịch sử | Hành vi prototype cần kiểm thử route và SQL rõ ràng về hàng đang chờ mới cùng reset projection chuẩn. |
| Gửi FE10 một lần sau commit và không chặn luồng | Service hiện không có tích hợp bên yêu cầu thông báo gắn với FE04. |
| Người dùng `MEMBER` đang hoạt động đã xác thực có thể nộp đơn/xem trạng thái | Endpoint người nộp đơn phải thực thi vai trò `MEMBER` nhưng cho phép người dùng chưa có projection thành viên từ trước nộp đơn. |
| UI người nộp đơn hiển thị sự thật từ server | Trang hiện fallback về dữ liệu trạng thái/đơn demo bịa đặt sau khi API lỗi. |

### 3.1 Mốc triển khai 2026-07-19

- Nộp đơn/trạng thái/nộp lại chuẩn, callback review/audit nguyên tử, gửi sau commit
  gắn với FE04, danh sách nhân viên được bảo vệ và trạng thái frontend đúng sự thật đã GREEN cho
  phạm vi cốt lõi hoàn tất; phần mở rộng Admin nằm ngoài bằng chứng này.
- Unique index chỉ lọc các đơn đang chờ có trong baseline/model/ADR và migration idempotent; kiểm thử hợp đồng SQL static vượt qua.
- Thực thi SQL đồng thời/rollback có thể thay đổi, nghiệm thu thủ công và xác nhận integration FE07/FE08
  là các cổng lịch sử trước khi chốt; bằng chứng chốt Giai đoạn 2 đã ghi nhận thay thế mốc này.
- Phần mở rộng Admin Console đã phê duyệt tách biệt với phạm vi cốt lõi và đã hoàn tất qua local browser, Azure Staging acceptance, L1, H2 vòng 1 và H3/manual-owner acceptance.

## 4. Phạm vi

### Trong phạm vi

- Các endpoint nộp đơn, trạng thái của chính mình, danh sách nhân viên, phê duyệt và từ chối từ Mục 11 của `SPEC.md`.
- Projection `Members` chuẩn và lịch sử `MembershipApplications` bất biến.
- Kiểm tra tài khoản đang hoạt động, đồng thời một đơn đang chờ, nộp lại đơn, metadata người rà soát, lý do từ chối bắt buộc và quy tắc không hết hạn.
- Ghi application/member/audit nguyên tử.
- Một request FE10 `MEMBERSHIP_RESULT` idempotent, không chặn luồng sau commit review.
- Trạng thái frontend thành viên/nhân viên dựa trên server, không có demo fallback.
- Bằng chứng route, repository, SQL đồng thời, frontend và traceability tập trung.

### Ngoài phạm vi

- Đăng ký/đăng nhập/xác minh email FE02.
- Chỉnh sửa hồ sơ FE03.
- Triển khai mượn FE07, đặt chỗ FE08 hoặc gán vai trò FE11.
- Hết hạn thành viên, gia hạn, thanh toán hoặc cơ chế số thành viên mới.
- Thiết kế lại provider/worker FE10 vượt ngoài việc sử dụng interface bên yêu cầu đã phê duyệt.

## 5. Bản đồ tệp và interface

| Khu vực | Tệp | Trách nhiệm |
| --- | --- | --- |
| Hợp đồng SQL | `database/Librarymanagement.sql`, `.sdd/rfcs/ADR-002-database-design.md` | Thực thi một đơn đang chờ mỗi người dùng và giữ trường thành viên/đơn đã phê duyệt mà không xóa vật lý lịch sử. |
| Ranh giới HTTP | `backend/src/routes/membershipRoutes.js`, `backend/src/controllers/membershipController.js`, `backend/src/validators/membershipValidators.js` | Xác thực, RBAC nhân viên, xác thực ID/query/lý do và cấu trúc response đã phê duyệt. |
| Quy tắc nghiệp vụ | `backend/src/services/membershipService.js` | Điều kiện tài khoản đang hoạt động, suy ra trạng thái chuẩn, nộp lại đơn, kiểm tra trạng thái cuối và request FE10 sau commit. |
| Persistence | `backend/src/repositories/membershipRepository.js`, `backend/src/repositories/auditLogRepository.js` | Ghi application/member/audit theo transaction và truy vấn đơn gần nhất có tính xác định. |
| Ranh giới thông báo | `backend/src/services/notificationService.js`, `backend/src/services/membershipService.js`, `backend/src/app.js` | Tạo và inject bên yêu cầu `MEMBERSHIP_RESULT` gắn với FE04 cùng metadata nguồn và khóa idempotent. |
| Tài liệu API | `backend/src/docs/openapi.yaml` | Ghi nhận năm endpoint FE04, trường response an toàn, lỗi và quy tắc vai trò. |
| Kiểm thử backend | `backend/tests/membershipRoutes.test.js`, `backend/tests/helpers/inMemoryMembershipRepositories.js`, `backend/tests/sql/membershipConcurrency.sqltest.js` | Hành vi route RED/GREEN, rollback, nộp lại đơn, một đơn đang chờ, một kết quả cuối cùng và bằng chứng gửi không chặn luồng. |
| Frontend | `frontend/src/page/MembershipPage.jsx`, `frontend/src/component/membership/*`, `frontend/src/api/libraryFeatureApi.js` | Kết xuất response trạng thái/danh sách chuẩn và hành động rà soát không dùng trạng thái server bịa đặt. |
| Kiểm thử frontend | `frontend/test/membershipFrontend.test.js` | Kiểm tra hồi quy ở cấp nguồn cho quyền truy cập theo vai trò, trạng thái chuẩn, xử lý lỗi và loại bỏ dữ liệu demo fallback. |

## 6. Interface đã phê duyệt

| Phương thức | Endpoint | Hành vi bắt buộc |
| --- | --- | --- |
| `POST` | `/api/membership/applications` | Người dùng `MEMBER` đang hoạt động đã xác thực; tạo đơn và projection `PENDING` chuẩn theo cách nguyên tử. |
| `GET` | `/api/membership/status/me` | Chỉ `MEMBER` đã xác thực; chỉ trả về `{ membershipStatusView, memberStatus, currentApplication }` của tác nhân. |
| `GET` | `/api/membership/applications` | Thủ thư/Quản trị viên; bộ lọc trạng thái đã xác thực và danh sách rà soát có phân trang. |
| `PATCH` | `/api/membership/applications/{applicationId}/approve` | Chỉ đơn đang chờ; application/member/reviewer/audit commit cùng nhau, sau đó yêu cầu FE10. |
| `PATCH` | `/api/membership/applications/{applicationId}/reject` | Chỉ đơn đang chờ; `reason` đã trim dài 1..500, ghi review nguyên tử, sau đó yêu cầu FE10. |

Lời gọi bên yêu cầu FE10 phải dùng loại `MEMBERSHIP_RESULT`, tính năng nguồn `FE04`, ID đơn nguồn, trạng thái cuối cùng và khóa idempotent `FE04:MEMBERSHIP_RESULT:<applicationId>:<finalStatus>`. Exception nội bộ thô hoặc dữ liệu người rà soát được bảo vệ không được vượt qua response HTTP.

## 7. Chiến lược triển khai theo thứ tự

### 7.1 Khóa hợp đồng bằng kiểm thử RED

- Mở rộng kiểm thử route cho người nộp đơn `MEMBER` đang hoạt động nhưng chưa có projection thành viên, từ chối người không phải thành viên, `NONE` chuẩn, nộp lại đơn, chuyển đổi không hợp lệ, quyền riêng tư, phân trang và lỗi FE10.
- Thêm kiểm thử SQL chạy đua hai đơn cho một người dùng và hai lệnh review cuối cùng cho một đơn.
- Làm cho kiểm thử assertion không có trạng thái application/member/audit dở dang sau lỗi được inject.

### 7.2 Đối soát schema và persistence

- Thêm cơ chế uniqueness SQL có thể rà soát, cho phép lịch sử nhưng tối đa một đơn `PENDING` cho mỗi `UserId`.
- Giữ `Members.UserId` chuẩn và duy nhất; không thêm `EXPIRED` hoặc xóa đơn lịch sử.
- Chuyển thao tác nộp/phê duyệt/từ chối cùng audit vào transaction repository và trả về kết quả rõ ràng cho đơn đang chờ trùng lặp, trạng thái cuối không hợp lệ và không tìm thấy.

### 7.3 Đối soát ranh giới và quy tắc service

- Xác thực endpoint người nộp đơn và yêu cầu vai trò `MEMBER`; không cần projection thành viên hiện có trước khi nộp đơn.
- Xác thực `Users.Status` đang hoạt động, ID, filter, phân trang và lý do từ chối ở server.
- Suy ra trạng thái từ `Members`; chỉ chọn đơn gần nhất theo `AppliedAt DESC, ApplicationId DESC` để hiển thị.
- Giữ hàng đơn cuối cùng và chỉ reset projection chuẩn khi nộp lại đơn.

### 7.4 Thêm việc gửi FE10 sau commit

- Yêu cầu đúng một thông báo gắn với FE04 sau commit phê duyệt/từ chối.
- Coi response idempotency trùng lặp là an toàn và lỗi provider/bên yêu cầu là không chặn luồng.
- Chỉ trả về trạng thái gửi an toàn; trạng thái thành viên vẫn commit khi gửi thất bại.

### 7.5 Đối soát frontend và bằng chứng

- Sử dụng các trường response chuẩn và hiển thị riêng biệt `NONE`, `PENDING`, `APPROVED`, `REJECTED` và `INACTIVE`.
- Loại dữ liệu đơn/trạng thái bịa đặt và hiển thị trạng thái tải, trống, quyền và lỗi API rõ ràng.
- Thêm tag `@spec`, cập nhật bằng chứng tài liệu API/chiến lược kiểm thử và chạy xác thực tập trung trước cổng merge của toàn bộ suite.

## 8. Thứ tự phụ thuộc

1. Kiểm thử hợp đồng route/SQL RED.
2. Hợp đồng transaction SQL/ADR và repository.
3. Validator, route, service và cấu trúc response chuẩn.
4. Tích hợp bên yêu cầu FE10.
5. Đối soát frontend.
6. Traceability, xác thực tập trung, sau đó rà soát thủ công.

Triển khai FE04 phải hoàn tất trước khi FE07/FE08 có thể tuyên bố hoàn tất tích hợp điều kiện thành viên chuẩn.

## 9. Cổng xác thực

| Cổng | Lệnh | Kết quả mong đợi |
| --- | --- | --- |
| Backend FE04 | `npm.cmd --prefix backend test -- --runTestsByPath tests/membershipRoutes.test.js` | Suite route tập trung vượt qua, không bỏ qua trường hợp FE04. |
| SQL đồng thời FE04 | `npm.cmd --prefix backend test -- --runTestsByPath tests/sql/membershipConcurrency.sqltest.js` | Các trường hợp một đơn đang chờ, một kết quả cuối và rollback vượt qua khi có cấu hình kiểm thử SQL. |
| Frontend FE04 | `node --test frontend/test/membershipFrontend.test.js` | Kiểm tra trạng thái chuẩn, không demo fallback và trạng thái rà soát vượt qua. |
| Traceability | `npm.cmd run trace:enforce` | Các tệp triển khai thay đổi ở FE04 đáp ứng ngưỡng traceability của kho mã nguồn. |
| Vệ sinh diff | `git diff --check` | Không có lỗi khoảng trắng. |

Toàn bộ suite backend/frontend vẫn là cổng merge cuối cùng, nhưng không thay thế bằng chứng RED/GREEN tập trung ở trên.

## 10. Cổng rà soát thủ công

- [x] Xác nhận endpoint người nộp đơn dùng danh tính tài khoản đang hoạt động đã xác thực thay vì yêu cầu vai trò thành viên đã được phê duyệt từ trước.
- [x] Xác nhận chiến lược một đơn đang chờ SQL giữ mọi lịch sử bị từ chối/đã phê duyệt.
- [x] Xác nhận quyền sở hữu bên yêu cầu FE10, metadata nguồn và khóa idempotency.
- [x] Xác nhận trạng thái lỗi frontend không bao giờ thay thế sự thật server bằng bản ghi demo.
- [x] Phê duyệt thứ tự và ánh xạ `TASKS.md` trước khi triển khai bắt đầu.

## 11. Tích hợp rà soát thành viên trong Admin Console

Quyết định: ĐƯỢC PHÊ DUYỆT BỞI CON NGƯỜI - 2026-07-22.

Thiết kế: `docs/superpowers/specs/2026-07-22-admin-membership-review-integration-design.md`.

Kế hoạch triển khai: `docs/superpowers/plans/2026-07-22-admin-membership-review-integration.md`.

Phần mở rộng có độ sâu Hybrid Standard: quy tắc review FE04, phân quyền, audit và gửi FE10 vẫn là Core; điều hướng FE11 và module Admin responsive là Shell. Thứ tự triển khai là RED-GREEN thuần/điều hướng, danh mục chỉ đọc, mutation/phản hồi review, nghiệm thu trình duyệt đã xác thực responsive, sau đó là bằng chứng L1-L4/H2/Azure. Không được thay đổi production/API/schema backend; harness E2E có thể kết nối service FE04 in-memory hiện có.
