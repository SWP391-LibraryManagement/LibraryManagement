# FE11 Quyết định phong bì danh sách người dùng

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI HUMAN - 2026-07-18

Ngày: 2026-07-18

Phạm vi: `TD-026` và dự báo phụ thuộc vào nguồn dữ liệu cho `TD-023`

## Xung đột hiện tại

Phản hồi `GET /api/users` được phê duyệt là `{ data, pagination }`. Việc triển khai cũng phát ra
`summary` cấp cao nhất và trang Quản trị sử dụng nó cho bộ đếm người dùng. Các quyền hiện chỉ tính
số lượng vai trò từ trang được tải, trang này không có thẩm quyền.

FE12 đã sở hữu mô hình đọc thống kê người dùng toàn cầu hoàn chỉnh tại `GET /api/reports/users`.
Phản hồi B7 của nó bao gồm `totals.users`, `usersByStatus` và `usersByRole`, có nguồn gốc từ dữ liệu
Người dùng/Vai trò FE11.

## Tùy chọn A - Chính thức hóa `summary` trong `GET /api/users`

- Thay đổi thực hiện nhỏ nhất.
- Yêu cầu thay đổi hợp đồng FE11 SPEC/API đã được phê duyệt.
- Các cặp đôi truy xuất danh sách được phân trang tới các tập hợp toàn cầu không liên quan.
- Sao chép quyền sở hữu số liệu thống kê người dùng FE12.

Kết quả: bị từ chối.

## Tùy chọn B - Xóa `summary` và lấy số lượng từ trang đã tải

- Bảo quản phong bì danh sách tài liệu.
- Tạo ra số lượng tổng thể không chính xác bất cứ khi nào chức năng phân trang/lọc được kích hoạt.

Kết quả: bị từ chối vì nó không thể đáp ứng được bảng điều khiển có thẩm quyền hoặc số lượng Quyền.

## Tùy chọn C - Tái sử dụng Mô hình đọc thống kê người dùng FE12

- Giữ `GET /api/users` chính xác là `{ data, pagination }`.
- Sử dụng `GET /api/reports/users` hiện có cho thẻ người dùng Quản trị viên.
- Bản đồ `total` từ `totals.users`.
- Ánh xạ `active` từ `usersByStatus.ACTIVE`, mặc định là số 0.
- Ánh xạ `inactive` từ `usersByStatus.INACTIVE`, mặc định là số 0.
- Ánh xạ `librarians` từ `usersByRole.LIBRARIAN`, mặc định là số 0.
- Tải danh sách phân trang và số liệu thống kê FE12 một cách độc lập để bộ lọc danh sách không bao giờ thay đổi thẻ chung.
- Xóa truy vấn tổng hợp kho lưu trữ không có giấy tờ và danh sách cấp cao nhất `summary` trong cùng một lát TD-026.
- Không tạo `/api/admin/user-summary`.

Kết quả: được khuyến nghị vì nó bảo toàn quyền sở hữu nguồn FE11 và FE12 mà không cần điểm cuối công
khai khác.

## Dự báo phụ thuộc TD-023

`TD-023` vẫn nằm ngoài Lô 1 và không nhận được ủy quyền thực hiện từ quyết định này. Chế độ xem
Quyền trong tương lai của nó không được lấy số lượng từ các hàng người dùng được phân trang. Nó nên
sử dụng lại FE12 `usersByRole` để đếm và giữ quyền sở hữu FE11 đối với ma trận quyền chỉ đọc, trừ
khi hợp đồng TD-023 được phê duyệt riêng chọn thành phần khác.

## Yêu cầu xác thực sau H1

- Các kiểm thử kho lưu trữ/dịch vụ/tuyến đường `GET /api/users` xác nhận các khóa cấp cao nhất chính xác `data` và `pagination`.
- Tổng hợp tóm tắt đã loại bỏ SQL không được thực thi bởi các yêu cầu danh sách.
- Trang quản trị yêu cầu danh sách và số liệu thống kê FE12 một cách độc lập.
- Ánh xạ thẻ trang tổng quan sử dụng giá trị mặc định bằng số 0 xác định.
- Lỗi tải/lọc danh sách không ghi đè kết quả thống kê thành công độc lập và lỗi thống kê không xóa danh sách được tải thành công.
- Giao diện người dùng không lấy được trạng thái chung hoặc số lượng vai trò từ các hàng trang.
- Các kiểm thử ủy quyền, phản hồi và B7 FE12 hiện tại vẫn không thay đổi và đã vượt qua.

## Làm rõ quyền sở hữu tệp

TD-026 chỉ sở hữu các tệp di chuyển người tiêu dùng Quản trị viên và phong bì danh sách FE11:

- `.sdd/specs/feat-user-role-management/SPEC.md` chỉ khi cần làm rõ tài liệu
- `docs/api/api-contract.md`
- `backend/src/docs/openapi.yaml`
- `backend/src/repositories/userRepository.js`
- `backend/src/services/userManagementService.js` chỉ khi nó hiện đang chuyển tiếp trạng thái tóm tắt kho lưu trữ
- `backend/tests/userRepository.test.js`
- `backend/tests/userManagementService.test.js`
- `backend/tests/userManagementRoutes.test.js`
- `frontend/src/page/UserManagement.jsx`
- `frontend/test/userManagementFrontend.test.js`
- `frontend/test/userManagementApi.test.js` chỉ dành cho các xác nhận phong bì danh sách chính xác

TD-026 không sở hữu các tuyến/bộ điều khiển/dịch vụ của Quản trị viên, tệp sản xuất FE12 hoặc điểm
cuối tóm tắt mới.

## Quyết định H1

Đề xuất phê duyệt: Tùy chọn C. Phê duyệt cho phép làm rõ tài liệu FE11/API và kế hoạch triển khai
TD-026 chi tiết sau này. Không có thay đổi mã sản phẩm nào xảy ra trong giai đoạn chuẩn bị H1 hoặc
kích hoạt quản trị.
