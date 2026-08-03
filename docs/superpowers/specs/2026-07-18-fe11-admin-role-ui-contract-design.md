# FE11 Thiết kế hợp đồng UI vai trò quản trị viên

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

Ngày: 2026-07-18

chức năng: Quản lý vai trò và người dùng FE11

Nợ: `TD-022`

## 1. Quyết định

Sử dụng SDD Độ sâu đầy đủ cho hợp đồng chuyển đổi vai trò và ADD giới hạn cho bộ điều hợp giao diện
người dùng. Giữ nguyên phần máy chủ API đã được phê duyệt và làm cho Giao diện người dùng quản trị
dịch các tên vai trò đã chọn thông qua danh mục vai trò có thẩm quyền trước khi gửi ID vai trò dạng
số.

Phần này là Lõi ở ranh giới API vì thao tác ghi vai trò ảnh hưởng đến ủy quyền và không được phụ thuộc
vào số nhận dạng được đoán hoặc mã hóa cứng. Trình bày hộp kiểm và bộ chuyển đổi tên thành ID là
hành vi của lớp bao sau khi các quy tắc hợp đồng và lỗi bị khóa.

## 2. Yêu cầu nguồn

Thiết kế này triển khai đường dẫn chấp nhận giao diện người dùng cho các yêu cầu đã được phê duyệt hiện có:

- `BR-FE11-001`, `BR-FE11-007..010`: Quản lý vai trò chỉ dành cho quản trị viên, ít nhất một vai trò, nhiều vai trò, bảo vệ quản trị viên cuối cùng và khả năng kiểm tra.
- `FR-FE11-012..014`: phân công/thu hồi vai trò và bảo vệ quản trị viên cuối cùng an toàn đồng thời.
- `FR-FE11-024..027`: các kết quả xác định thiếu vai trò, trùng lặp, vắng mặt và vai trò cuối cùng.
- `AC-FE11-013..015`: gán/thu hồi vai trò thành công và từ chối quản trị viên cuối cùng.
- `NFR-FE11-SEC-001..005`: RBAC phía máy chủ, xác thực, lỗi an toàn và số nhận dạng được phê duyệt.
- FE11 Hợp đồng API: `POST /api/users/{userId}/roles` với `{ roleId: number }` và `DELETE /api/users/{userId}/roles/{roleId}`.

Nguồn chính: `.sdd/specs/feat-user-role-management/SPEC.md`.

Hợp đồng chuẩn đã được phê duyệt, vì vậy lát cắt này không sửa đổi `SPEC.md` hoặc hành vi máy chủ.

## 3. Vấn đề hiện tại

Phần vai trò giao dịch máy chủ là B7-đầy đủ và yêu cầu ID vai trò bằng số dương. Giao diện quản trị
viên vẫn gửi `{ roleName }` để phân công và đặt tên vai trò trong lệnh thu hồi URL. Cả hai cuộc gọi
đều không xác thực được tuyến đường và không thể đáp ứng `AC-FE11-013/014`.

Điểm cuối danh sách vai trò đã trả về các mục danh mục bắt buộc:

```json
{
  "data": [
    { "roleId": 1, "roleName": "ADMIN" },
    { "roleId": 2, "roleName": "LIBRARIAN" },
    { "roleId": 3, "roleName": "MEMBER" }
  ]
}
```

Không cần thay đổi lược đồ, điểm cuối hoặc dịch vụ máy chủ.

## 4. Phạm vi

### Trong phạm vi

- Hãy coi `GET /api/users/roles` là nguồn ID vai trò duy nhất.
- Giữ trạng thái/hiển thị lựa chọn vai trò tương thích với tên vai trò trong `UserManagementView.roles`.
- Ánh xạ từng tên vai trò đã thay đổi thành ID vai trò số dương trước khi thao tác ghi.
- Gửi `{ roleId }` để phân công và `roleId` dạng số trong đường dẫn thu hồi.
- Áp dụng bài tập trước khi thu hồi.
- Chặn chỉnh sửa vai trò khi danh mục không có sẵn hoặc không hợp lệ; không bao giờ sử dụng ID được mã hóa cứng.
- Điều chỉnh phương thức với trạng thái máy chủ có thẩm quyền sau lỗi thao tác ghi một phần.
- Thêm các kiểm thử RED-GREEN giao diện người dùng tập trung và cập nhật hồ sơ lập kế hoạch/bằng chứng FE11 trong quá trình triển khai.

### Ngoài phạm vi

- Giao dịch vai trò máy chủ, trình xác thực, kết quả dịch vụ hoặc mã lỗi.
- Thay đổi cơ sở dữ liệu/lược đồ.
- Tạo vai trò, chỉnh sửa vai trò, chỉnh sửa quyền hoặc phân cấp vai trò.
- FE11 điều hướng, Quyền, Nhật ký kiểm tra, Quản lý yêu cầu, cập nhật hoặc hủy kích hoạt.
- Điểm cuối thay thế vai trò hàng loạt hoặc giao dịch yêu cầu chéo.
- Những thay đổi đối với hợp đồng FE11 `SPEC.md` đã được phê duyệt.

## 5. Kiến trúc

Luồng yêu cầu bị giới hạn là:

```text
GET /api/users/roles
-> danh mục vai trò [{ roleId, roleName }]
-> RoleModal hiển thị các hộp chọn roleName
-> saveRoles tính addedNames và removedNames
-> xác thực ánh xạ đầy đủ roleName -> roleId
-> POST các phép gán theo roleId
  -> DELETE revocations by roleId
-> tải lại trạng thái người dùng/danh sách có thẩm quyền
```

`RoleModal` tiếp tục sử dụng tên vai trò vì DTO của người dùng được quản lý hiển thị tên vai trò.
Điều phối lưu cấp trang sở hữu ánh xạ vì nó đã sở hữu danh mục vai trò và các thao tác ghi API.

## 6. Hợp đồng danh mục vai trò

Mỗi mục danh mục có thể chỉnh sửa phải có:

- `roleName`: một trong các `ADMIN`, `LIBRARIAN` hoặc `MEMBER`.
- `roleId`: số nguyên dương.

Không thể chỉnh sửa `GUEST` và các vai trò không xác định trong quy trình Quản trị viên này. Vai trò
không thể chỉnh sửa hiện có của người dùng mục tiêu sẽ được giữ nguyên và không bị thu hồi âm thầm.

Giao diện người dùng không được tổng hợp các mục danh mục chỉ chứa tên vai trò. Nếu yêu cầu danh mục
không thành công, trả về một mục không hợp lệ hoặc bỏ qua ID mà khác biệt được yêu cầu, giao diện
người dùng sẽ chặn việc lưu trước khi gửi bất kỳ thao tác ghi nào.

## 7. Hợp đồng bộ chuyển đổi API

Các chức năng API của giao diện người dùng trở thành:

```js
assignManagedUserRole(userId, roleId)
revokeManagedUserRole(userId, roleId)
```

Bài tập gửi:

```json
{ "roleId": 2 }
```

Cuộc gọi thu hồi:

```text
DELETE /api/users/{userId}/roles/2
```

Bộ điều hợp không chấp nhận hoặc dịch tên vai trò. Quá trình dịch tên sang ID xảy ra trước ranh giới
API nên các kiểm thử có thể chứng minh rằng không có tên vai trò nào tham gia hợp đồng thao tác ghi.

## 8. Thứ tự thao tác ghi và hành vi không hoạt động

Giao diện người dùng tính toán hai danh sách xác định:

- `addedNames`: các vai trò có thể chỉnh sửa được chọn không có trong nhóm vai trò hiện tại.
- `removedNames`: các vai trò có thể chỉnh sửa hiện tại không có trong nhóm vai trò đã chọn.

Cả hai danh sách đều tuân theo thứ tự danh mục vai trò. Giao diện người dùng thực hiện mọi nhiệm vụ
trước tiên, sau đó là thu hồi. Điều này tránh trạng thái không có vai trò nhất thời khi thay thế vai
trò này bằng vai trò khác và để phần máy chủ là quyền cuối cùng đối với các quy tắc vai trò người
dùng cuối cùng và Quản trị viên cuối cùng.

Khi cả hai danh sách đều trống, Lưu là một lệnh không hoạt động thành công: không có yêu cầu đột
biến nào được gửi, phương thức đóng và không có yêu cầu kiểm tra thay đổi vai trò gây hiểu lầm hoặc
yêu cầu thành công nào được khách hàng tạo ra.

## 9. Thất Bại Và Hành Vi Hòa Giải

### Lỗi danh mục

- Không mở hoặc lưu biểu mẫu vai trò có thể thực hiện mà không có danh mục hợp lệ.
- Khi Quản trị viên nhấp vào hành động vai trò mà không có danh mục hợp lệ, hãy thử lại `fetchRoles`; chỉ mở phương thức sau khi có phản hồi hợp lệ, nếu không hãy đóng nó và hiển thị lỗi tải an toàn.
- Đừng quay lại với các ID được mã hóa cứng hoặc các cuộc gọi thao tác ghi tên vai trò.

### Lỗi lập bản đồ trước khi bay

- Giải quyết mọi tên vai trò được thêm/xóa thành ID vai trò hợp lệ trước lần thao tác ghi đầu tiên.
- Nếu bất kỳ ánh xạ nào bị thiếu hoặc không hợp lệ, hãy không gửi yêu cầu thao tác ghi và giữ nguyên trạng thái phương thức.

### Thất bại thao tác ghi một phần

thao tác ghi vai trò là các giao dịch máy chủ riêng biệt; khách hàng không được khẳng định rằng toàn bộ
hộp kiểm được lưu là nguyên tử.

Nếu bất kỳ thao tác ghi nào thất bại:

1. Dừng lại ngay lập tức; không cố gắng thao tác ghi còn lại.
2. Tìm nạp người dùng mục tiêu thông qua `GET /api/users/{userId}`.
3. Thay thế người dùng mục tiêu cấp trang và các vai trò đã chọn của phương thức bằng phản hồi của máy chủ có thẩm quyền; `RoleModal` phải đồng bộ hóa lựa chọn cục bộ của nó khi có vai trò người dùng được làm mới.
4. Giữ phương thức mở.
5. Hiển thị lỗi API được ánh xạ an toàn.

Nếu quá trình tìm nạp đối chiếu cũng không thành công, hãy tiếp tục mở phương thức, hiển thị lỗi đột
biến ban đầu và đánh dấu phương thức là không đồng bộ hóa. Lưu vẫn bị vô hiệu hóa cho đến khi tải
lại người dùng mục tiêu có thẩm quyền thành công hoặc Quản trị viên đóng phương thức và bắt đầu một
hành động vai trò mới. Không hiển thị thành công.

### Gửi đồng thời

Tắt các hành động Lưu và đóng phương thức trong khi trình tự thao tác ghi hoặc đọc đối chiếu đang chạy.
Trình tự thứ hai không được bắt đầu đồng thời từ cùng một phương thức.

## 10. Trách nhiệm của thành phần

### `frontend/src/api/userManagementApi.js`

- Chấp nhận số `roleId` cho cả hai trình trợ giúp thao tác ghi.
- Gửi nội dung/đường dẫn chuẩn.
- Bảo tồn bản đồ lỗi an toàn hiện có.

### `frontend/src/page/UserManagement.jsx`

- Lưu trữ trạng thái thành công/lỗi của danh mục vai trò.
- Từ chối chỉnh sửa vai trò có thể thực hiện mà không có danh mục hợp lệ.
- Giữ trạng thái hộp kiểm làm tên vai trò.
- Đồng bộ hóa trạng thái hộp kiểm khi người dùng mục tiêu được làm mới có thẩm quyền thay thế trạng thái người dùng phương thức.
- Xây dựng và xác thực sự khác biệt hoàn chỉnh giữa tên và ID trước khi thao tác ghi.
- Chạy bài tập trước khi thu hồi.
- Nếu không thành công, hãy tải lại người dùng mục tiêu và giữ chế độ mở với các vai trò máy chủ.
- Nếu thành công, hãy đóng phương thức và tải lại trạng thái chi tiết/danh sách chuẩn.

### Kiểm tra giao diện người dùng

- Chứng minh phần nội dung/đường dẫn của bộ điều hợp sử dụng ID vai trò dạng số.
- Chứng minh ánh xạ tên-ID và thứ tự gán xác định trước khi thu hồi.
- Chứng minh các mục danh mục không hợp lệ/thiếu sẽ chặn tất cả các thao tác ghi.
- Chứng minh no-op Save không gửi thao tác ghi.
- Chứng minh lỗi một phần sẽ dừng trình tự, tìm nạp người dùng mục tiêu và giữ vai trò có thẩm quyền trong phương thức.
- Chứng minh việc đọc đối chiếu không thành công sẽ khiến chức năng Lưu bị vô hiệu hóa và không bao giờ hiển thị thành công.

## 11. Chiến lược kiểm thử

Việc triển khai tuân theo RED-GREEN TDD.

### Kiểm tra hợp đồng API

- Nhiệm vụ gọi `/users/{userId}/roles` bằng `{ roleId }`.
- Cuộc gọi thu hồi `/users/{userId}/roles/{roleId}`.
- Trình trợ giúp thao tác ghi không chứa nội suy đường dẫn/trường yêu cầu `roleName`.

### Kiểm tra điều phối giao diện người dùng

- Các mục nhập danh mục vai trò hiển thị cả ID và tên trong luồng lưu.
- Bài tập chạy trước khi thu hồi đối với sự khác biệt hỗn hợp.
- Tên không xác định, ID bị thiếu, ID không và lỗi tải danh mục không gửi thao tác ghi.
- Các vai trò không thể chỉnh sửa hiện tại được giữ nguyên.
- Lỗi thao tác ghi sẽ ngăn chặn các cuộc gọi sau này và kích hoạt tải lại người dùng mục tiêu có thẩm quyền.
- Kết quả điều chỉnh sẽ thay thế các vai trò phương thức cũ trong khi phương thức vẫn mở.
- Lỗi đọc đối chiếu không bao giờ chuyển đổi hoạt động thành thành công.
- chức năng lưu bị vô hiệu hóa khi công việc đang được thực hiện.

### Xác thực hồi quy

- Các kiểm thử giao diện người dùng FE11 tập trung.
- Kiểm tra giao diện người dùng đầy đủ, tìm lỗi mã nguồn và xây dựng sản xuất.
- Các kiểm thử vai trò FE11 máy chủ tập trung để xác nhận hợp đồng công khai vẫn không thay đổi.
- Thực thi truy vết dự án và `git diff --check`.
- Trình duyệt hiện có E2E thông qua CI; không có bố cục hình ảnh mới nào được giới thiệu bởi lát cắt này.

## 12. Tài liệu và truy vết

Trong quá trình thực hiện:

- Thêm nhóm tác vụ vai trò-UI FE11 có thể xem xét riêng vào `PLAN.md` và `TASKS.md`.
- Cập nhật `TEST_PLAN.md` và `CHANGELOG.md` với bằng chứng có giới hạn.
- Đánh dấu `TD-022` `IN PROGRESS`, sau đó là `RESOLVED` chỉ sau khi con người xem xét, hợp nhất và CI sau hợp nhất.
- Bảo toàn toàn bộ chức năng `Implementation State: DEFERRED` và mọi khoản nợ FE11 không liên quan.
- Không cập nhật `SPEC.md`; hợp đồng ID số hiện có đã có thẩm quyền.

## 13. Rủi ro và giảm thiểu

| Rủi ro | Giảm nhẹ |
| --- | --- |
| ID mã hóa cứng khác nhau giữa các môi trường | Chỉ sử dụng danh mục vai trò đã được xác thực. |
| Tên vai trò lại nhập thao tác ghi API | Làm cho người trợ giúp API chấp nhận `roleId` và thêm các kiểm thử hợp đồng nguồn. |
| Lưu thành công một phần | Dừng lại ở lỗi đầu tiên và điều chỉnh từ máy chủ. |
| Việc thu hồi không còn vai trò nào trong thời gian ngắn | Thực hiện các nhiệm vụ trước khi bị thu hồi; chương trình máy chủ vẫn có thẩm quyền. |
| Danh mục đã cũ hoặc chưa đầy đủ | Xác thực sự khác biệt hoàn chỉnh trước thao tác ghi đầu tiên và hiển thị lỗi có thể thử lại. |
| Phạm vi mở rộng sang Quyền hoặc chỉnh sửa vai trò | Giữ lát cắt được giới hạn ở các điểm cuối và phương thức Quản lý vai trò hiện có. |

## 14. Định nghĩa xong

Phần này chỉ hoàn thành khi:

- Mọi thao tác ghi vai trò giao diện người dùng đều sử dụng ID vai trò số dương từ danh mục máy chủ.
- Không tồn tại ID vai trò được mã hóa cứng hoặc dự phòng thao tác ghi tên vai trò.
- Các thay đổi hỗn hợp được chỉ định trước khi thu hồi.
- Lỗi danh mục và ánh xạ không gửi thao tác ghi.
- Lỗi một phần sẽ điều chỉnh phương thức với các vai trò máy chủ có thẩm quyền mà không có thông báo thành công sai.
- Kiểm tra giao diện người dùng tập trung/đầy đủ, hồi quy vai trò máy chủ tập trung, truy vết, vệ sinh khác biệt và vượt qua CI.
- FE11 lập kế hoạch, bằng chứng, nhật ký thay đổi và nợ kỹ thuật được đồng bộ hóa.
- Đánh giá triển khai của con người, hợp nhất và CI sau hợp nhất được ghi lại.

## 15. Câu hỏi mở

Không. Người dùng đã phê duyệt phương pháp tiếp cận bộ chuyển đổi tên thành ID và hành vi tải lại có
thẩm quyền đối với các lỗi một phần vào ngày 18 tháng 07 năm 2026.
