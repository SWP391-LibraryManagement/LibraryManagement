# FE11 Thiết kế quản lý vai trò giao dịch

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

chức năng: Quản lý vai trò và người dùng FE11

## 1. Quyết định

Sử dụng SDD Độ sâu đầy đủ cho phần quản lý vai trò FE11 được giới hạn. Triển khai việc phân công và
thu hồi vai trò thông qua kho lưu trữ giao dịch chuyên dụng để xác thực Quản trị viên hoạt động,
khóa trạng thái vai trò bị ảnh hưởng, áp dụng một thao tác ghi xác định và ghi mục kiểm tra trong cùng
một giao dịch SQL.

Phần này là hành vi cốt lõi vì thao tác ghi vai trò không chính xác có thể cấp các đặc quyền cũ, xóa vai
trò cuối cùng của người dùng, xóa Quản trị viên hoạt động cuối cùng hoặc để lại thay đổi ủy quyền
chưa được kiểm tra.

## 2. Yêu cầu nguồn

Thiết kế thực hiện hoặc nâng cao các yêu cầu FE11 đã được phê duyệt này:

- `BR-FE11-001`, `BR-FE11-007..010`: Quyền truy cập chỉ dành cho quản trị viên, ít nhất một vai trò cho mỗi người dùng, nhiều vai trò, bảo vệ quản trị viên cuối cùng và khả năng kiểm tra.
- `FR-FE11-012..017`, `FR-FE11-024..027`: hành vi gán/thu hồi, xác thực quyền quản trị viên, hành vi không tìm thấy xác định, từ chối gán trùng lặp, từ chối ánh xạ thiếu và bảo vệ vai trò cuối cùng.
- `AC-FE11-013..015`: chỉ định/thu hồi Quản trị viên thành công và từ chối Quản trị viên cuối cùng.
- `NFR-FE11-SEC-001..005`: RBAC phía máy chủ, xác thực đầu vào và SQL được tham số hóa.
- `NFR-FE11-TXN-003`, `NFR-FE11-TXN-006`: kiểm tra nguyên tử cộng với thao tác ghi vai trò và bảo vệ quản trị viên an toàn đồng thời.

Nguồn chính: `.sdd/specs/feat-user-role-management/SPEC.md`.

## 3. Vấn đề hiện tại

Dịch vụ hiện tại kiểm tra một số bất biến trước khi gọi các hoạt động kho lưu trữ riêng biệt, nhưng
việc thay đổi vai trò và kiểm tra không mang tính nguyên tử. SQL hiện tại âm thầm bỏ qua việc gán
trùng lặp và thu hồi vai trò bị thiếu. Lỗi tra cứu người dùng và vai trò cũng sử dụng ngữ nghĩa
`400` không nhất quán và Quản trị viên hành động không được xác nhận lại tại thời điểm thao tác ghi.

Những khoảng trống này tương ứng với `TD-013`, phần quản lý vai trò của `TD-014` và phần kiểm tra
vai trò của `TD-015` trong `TECH_DEBT.md`.

## 4. Phạm vi

### Trong phạm vi

- Xác thực `userId` và `roleId` dưới dạng số nguyên dương tại ranh giới HTTP và một lần nữa tại ranh giới dịch vụ.
- Xác nhận lại rằng người dùng hoạt động tồn tại, đang hoạt động và hiện giữ vai trò Quản trị viên trong giao dịch thay đổi vai trò.
- Trả về các lỗi xác định đối với người dùng/vai trò bị thiếu, chỉ định trùng lặp, ánh xạ vắng mặt, thu hồi vai trò người dùng cuối cùng và thu hồi Quản trị viên hoạt động cuối cùng.
- Áp dụng ánh xạ vai trò và viết bản ghi kiểm tra của nó trong một giao dịch.
- Khóa ánh xạ vai trò người dùng bị ảnh hưởng và số lượng Quản trị viên đang hoạt động để việc thu hồi vai trò đồng thời không thể xóa mọi Quản trị viên đang hoạt động.
- Thêm các kiểm thử tuyến đường, dịch vụ và kho lưu trữ bằng RED-GREEN TDD.
- Cập nhật kế hoạch FE11, khả năng truy vết, chiến lược kiểm tra, nhật ký thay đổi và hồ sơ nợ kỹ thuật cho phần này.

### Ngoài phạm vi

- Đối chiếu danh sách/chi tiết người dùng DTO.
- Cập nhật hồ sơ người dùng hoặc thủ thư, bao gồm `department` và `specialization`.
- Cập nhật đồng thời lạc quan và hủy kích hoạt tài khoản.
- Bảng điều khiển dành cho quản trị viên, ma trận quyền, giao diện người dùng nhật ký kiểm tra và giao diện người dùng quản lý yêu cầu.
- Thay đổi lược đồ cơ sở dữ liệu hoặc các thủ tục được lưu trữ.
- Tạo vai trò, chỉnh sửa vai trò, chỉnh sửa quyền hoặc phân cấp vai trò.

## 5. Kiến trúc

Tạo `backend/src/repositories/userRoleRepository.js` làm chủ sở hữu duy nhất của các thao tác ghi vai
trò giao dịch. Việc tách biệt logic này sẽ tránh thêm một trách nhiệm khác vào `userRepository.js`
lớn hiện có và cung cấp cho các quy tắc đồng thời một ranh giới kiểm thử tập trung.

Luồng yêu cầu vẫn còn:

```text
route validator
  -> userManagementController
  -> userManagementService
  -> userRoleRepository transaction
  -> userRepository readback
```

Bộ điều khiển và điểm cuối công cộng không thay đổi. Dịch vụ ánh xạ kết quả kho lưu trữ tới các lỗi
API an toàn và chỉ tìm nạp chế độ xem người dùng được quản lý an toàn đã cập nhật sau khi cam kết
thành công.

## 6. Hợp đồng lưu trữ

Kho lưu trữ hiển thị một thao tác:

```js
mutateUserRole({
  operation, // 'ASSIGN' or 'REVOKE'
  adminUserId,
  userId,
  roleId,
  ipAddress,
  userAgent,
  now,
})
```

Nó trả về một trong những kết quả này mà không đưa ra các điều kiện kinh doanh dự kiến:

| Kết quả | Ý nghĩa |
| --- | --- |
| `ASSIGNED` | Đã cam kết kiểm tra bản đồ và phân công. |
| `REVOKED` | Kiểm toán bản đồ và thu hồi đã cam kết. |
| `ADMIN_NOT_FOUND` | ID người dùng quản trị viên hiện hành không tồn tại. |
| `ADMIN_REQUIRED` | Quyền người dùng không hoạt động hoặc không còn giữ quyền Quản trị viên. |
| `USER_NOT_FOUND` | Người dùng mục tiêu không tồn tại. |
| `ROLE_NOT_FOUND` | Vai trò được yêu cầu không tồn tại. |
| `USER_ALREADY_HAS_ROLE` | Ánh xạ bài tập đã tồn tại. |
| `USER_ROLE_NOT_FOUND` | Ánh xạ thu hồi không tồn tại. |
| `LAST_USER_ROLE` | Việc thu hồi sẽ khiến mục tiêu không có vai trò gì. |
| `LAST_ADMIN_ROLE` | Việc thu hồi sẽ không còn người giữ vai trò Quản trị viên nào đang hoạt động. |

Lỗi cơ sở dữ liệu không mong muốn sẽ xảy ra và kích hoạt khôi phục.

## 7. Luồng giao dịch và khóa

Đối với cả việc chuyển nhượng và thu hồi, kho lưu trữ thực hiện các bước sau trong một giao dịch SQL:

1. Khóa và tải người dùng đang hoạt động. Phân biệt người dùng bị thiếu với người dùng không hoạt động/không phải Quản trị viên.
2. Khóa và tải người dùng mục tiêu.
3. Khóa và tải vai trò được yêu cầu.
4. Khóa các hàng `UserRoles` của mục tiêu và xác định xem ánh xạ được yêu cầu có tồn tại hay không.
5. Để chuyển nhượng, hãy từ chối ánh xạ hiện có; nếu không hãy chèn nó.
6. Để thu hồi, hãy từ chối ánh xạ bị thiếu và từ chối mục tiêu chỉ có một vai trò.
7. Khi thu hồi Quản trị viên, hãy khóa nhóm vai trò Quản trị viên đang hoạt động và từ chối thao tác ghi khi chỉ còn lại một Quản trị viên đang hoạt động.
8. Chèn `USER_ROLE_ASSIGN` hoặc `USER_ROLE_REVOKE` vào `AuditLogs` chỉ với siêu dữ liệu vai trò an toàn.
9. Cam kết. Bất kỳ SQL hoặc lỗi kiểm tra nào đều sẽ khôi phục thay đổi ánh xạ.

SQL sử dụng các tham số đã nhập cho mọi giá trị. Việc khóa các lần đọc sử dụng `UPDLOCK, HOLDLOCK`
đối với người dùng bị ảnh hưởng, ánh xạ vai trò và số lượng Quản trị viên. Không có giá trị yêu cầu
nào được nối vào SQL.

## 8. API và hợp đồng lỗi

Điểm cuối không thay đổi:

- `POST /api/users/{userId}/roles` với `{ roleId: number }`.
- `DELETE /api/users/{userId}/roles/{roleId}`.

Phản hồi dự kiến:

| Tình trạng | HTTP | Mã | Tin nhắn |
| --- | ---: | --- | --- |
| Hình dạng ID không hợp lệ | 400 | `VALIDATION_ERROR` | Chi tiết xác thực theo trường cụ thể. |
| Quyền quản trị viên mất tích | 404 | `ADMIN_NOT_FOUND` | `Acting admin was not found.` |
| Người dùng quyền không hoạt động hoặc không còn là Quản trị viên | 403 | `ADMIN_REQUIRED` | `Admin access is required.` |
| Người dùng mục tiêu bị thiếu | 404 | `USER_NOT_FOUND` | `User was not found.` |
| Thiếu vai trò | 404 | `ROLE_NOT_FOUND` | `Role was not found.` |
| Vai trò đã được giao | 409 | `USER_ALREADY_HAS_ROLE` | `User already has this role.` |
| Không có bản đồ vai trò | 404 | `USER_ROLE_NOT_FOUND` | `User does not have this role.` |
| Việc thu hồi sẽ xóa vai trò người dùng cuối cùng | 400 | `LAST_USER_ROLE` | `Every user must keep at least one role.` |
| Việc thu hồi sẽ xóa Quản trị viên hoạt động gần đây nhất | 400 | `LAST_ADMIN_ROLE` | `Cannot remove the last Admin role.` |

Các yêu cầu thành công tiếp tục trả về đại diện người dùng được quản lý an toàn với các vai trò được
cập nhật. Không có dữ liệu mật khẩu, mã thông báo, phiên hoặc liên kết thiết lập nào được thêm vào.

## 9. Trách nhiệm dịch vụ

`userManagementService` sẽ:

- Phân tích cú pháp và từ chối các ID số nguyên dương không hợp lệ khi được gọi bên ngoài các tuyến HTTP.
- Gọi `userRoleRepository.mutateUserRole` với bối cảnh Quản trị viên đã được xác thực.
- Ánh xạ từng kết quả kho lưu trữ dự kiến tới hợp đồng API ở trên.
- Tìm nạp và trả về chế độ xem người dùng được quản lý đã cập nhật sau `ASSIGNED` hoặc `REVOKED`.
- Dừng viết kiểm tra vai trò riêng biệt thông qua `writeAudit`, vì giao dịch kho lưu trữ sở hữu kiểm tra đó.

Dịch vụ sẽ không thực hiện kiểm tra tồn tại trước chuyến bay hoặc kiểm tra số lượng vai trò để phát
hiện thao tác ghi vai trò. Kiểm tra trước chuyến bay sẽ dễ xảy ra xung đột và có thể không đồng ý với
trạng thái giao dịch bị khóa.

## 10. Ranh giới xác thực

`userManagementValidators.js` sẽ thêm trình xác nhận tập trung:

- Bài tập: tham số tuyến `userId` số nguyên dương và trường nội dung `roleId` JSON số nguyên dương.
- Thu hồi: tham số tuyến đường `userId` và `roleId` số nguyên dương.

Quá trình xác thực diễn ra sau khi xác thực và ủy quyền của Quản trị viên, duy trì quy tắc hiện tại
mà người gọi không được xác thực và không phải Quản trị viên sẽ nhận được `401`/`403` trước khi chi
tiết về hình dạng yêu cầu bị lộ.

## 11. Chiến lược kiểm thử

Việc triển khai tuân theo RED-GREEN TDD nghiêm ngặt.

### Kiểm tra lộ trình

- Bối cảnh quản trị viên và ID chuẩn hóa tiếp cận dịch vụ.
- ID vai trò hoặc mục tiêu không hợp lệ trả về `400 VALIDATION_ERROR` và không bao giờ gọi dịch vụ.
- Hành vi xác thực hiện tại và ủy quyền của Quản trị viên vẫn không thay đổi.

### Kiểm tra dịch vụ

- Mỗi kết quả của kho lưu trữ ánh xạ tới trạng thái, mã và thông báo an toàn của HTTP được ghi lại.
- Việc chuyển nhượng/thu hồi thành công sẽ trả về người dùng an toàn đã được cập nhật.
- Dịch vụ chỉ gọi kho lưu trữ giao dịch để thay đổi và không viết lần kiểm tra thứ hai.
- Đầu vào dịch vụ trực tiếp không hợp lệ không thành công trước khi truy cập kho lưu trữ.

### Kiểm tra kho lưu trữ

- Nhiệm vụ thành công cam kết lập bản đồ và kiểm tra cùng nhau.
- Thu hồi thành công cam kết xóa và kiểm tra cùng nhau.
- Phân công trùng lặp và ánh xạ bị thiếu trả về kết quả xác định mà không có thao tác ghi hoặc kiểm tra.
- Thiếu quyền Quản trị viên, đặc quyền Quản trị viên cũ, thiếu mục tiêu và vai trò bị thiếu sẽ trả về các kết quả xác định.
- Người bảo vệ vai trò người dùng cuối cùng và người quản trị hoạt động cuối cùng từ chối trước khi thao tác ghi.
- Kiểm tra thất bại sẽ khôi phục thay đổi ánh xạ.
- SQL sử dụng đầu vào tham số và chứa các gợi ý khóa bắt buộc đối với các lần đọc được bảo vệ.

### Xác thực hồi quy

- Các kiểm thử FE11 tập trung.
- Bộ kiểm tra máy chủ đầy đủ và phạm vi bảo hiểm.
- Thực thi truy vết.
- kiểm tra mã/bản dựng giao diện người dùng và E2E hiện tại chỉ khi các thay đổi trong hợp đồng máy chủ ảnh hưởng đến xác minh được chia sẻ.
- `git diff --check` và xem xét mẫu bí mật.

## 12. Tài liệu và truy vết

Khi bắt đầu triển khai:

- Trì hoãn rõ ràng toàn bộ công việc chức năng còn lại của FE11 và ghi lại phần vai trò đã hoàn thành này vào nhóm nhiệm vụ. Trình kiểm tra `main` hiện tại báo cáo phạm vi bao phủ 38-FR của FE11 nhưng vẫn bắt nguồn từ việc thực thi từ trạng thái hàng đầu mà con người có thể đọc được, do đó, lát cắt chỉ dành cho FE11 này không thay đổi hợp đồng trình kiểm tra.
- Giữ siêu dữ liệu `Implementation State: DEFERRED` tương thích chuyển tiếp cục bộ thành FE11 cho đến khi một thay đổi về khả năng truy vết trên toàn kho lưu trữ riêng biệt được xem xét.
- Thêm một nhóm nhiệm vụ có thể xem xét riêng cho phần quản lý vai trò này vào FE11 `PLAN.md` và `TASKS.md`.
- Cập nhật FE11 `TEST_PLAN.md` và `CHANGELOG.md`.
- Thêm thẻ `@spec` vào kho lưu trữ giao dịch và các nhánh dịch vụ.
- Mark `TD-013` đã được giải quyết sau khi chuyển bằng chứng.
- Thu hẹp `TD-014` và `TD-015` vào khoảng trống không có vai trò còn lại thay vì yêu cầu tất cả khoản nợ kiểm tra dịch vụ và không tìm thấy FE11 đã được đóng.

## 13. Rủi ro và giảm thiểu

| Rủi ro | Giảm nhẹ |
| --- | --- |
| Việc thu hồi đồng thời của Quản trị viên sẽ xóa tất cả Quản trị viên | Khóa các ánh xạ bị ảnh hưởng và đặt vai trò Quản trị viên đang hoạt động trong giao dịch. |
| Kiểm toán thành công/thất bại độc lập với thao tác ghi | Chèn kiểm toán bên trong cùng một giao dịch. |
| Mã thông báo chứa vai trò Quản trị viên cũ | Xác nhận lại vai trò Quản trị viên đang hoạt động trong giao dịch thao tác ghi. |
| Dịch vụ chạy đua trước chuyến bay với trạng thái SQL | Các kết quả của kho lưu trữ là nguồn quyết định trạng thái kinh doanh duy nhất. |
| SQL Server không có sẵn trong CI | Các nhánh giao dịch kiểm thử đơn vị và SQL mang khóa; giữ lại sự tích hợp được hỗ trợ bởi SQL dưới dạng khoảng trống bằng chứng còn sót lại rõ ràng. |
| Phạm vi mở rộng sang tất cả các khoản nợ FE11 | Giữ cập nhật, hủy kích hoạt, DTO, các trường thủ thư và giao diện người dùng rõ ràng nằm ngoài phạm vi. |

## 14. Định nghĩa xong

Phần này chỉ hoàn thành khi:

- Các điểm cuối được phê duyệt sẽ thực thi hợp đồng lỗi xác định.
- Chuyển nhượng/thu hồi và cam kết kiểm tra hoặc quay lại cùng nhau.
- Bảo vệ quản trị viên cuối cùng đồng thời được thể hiện bằng các lần đọc SQL bị khóa.
- Tuyến đường, dịch vụ và kho lưu trữ RED-GREEN đã vượt qua các kiểm thử.
- Các kiểm thử máy chủ hiện tại và kiểm tra truy vết đều vượt qua.
- FE11 lập kế hoạch, trạng thái nhiệm vụ, kế hoạch kiểm thử, nhật ký thay đổi và nợ kỹ thuật được đồng bộ hóa.
- Một con người đánh giá việc thực hiện và bằng chứng xác nhận.
