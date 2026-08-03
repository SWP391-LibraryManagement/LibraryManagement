# FE08 Thiết kế danh mục ứng viên đặt chỗ

Ngày: 19-07-2026 chức năng: FE08 Quản lý đặt chỗ Nợ: TD-028 bàn giao: Hybrid SDD + ADD Độ sâu đặc
tả: Tiêu chuẩn cho hợp đồng API mới; việc triển khai vẫn bị giới hạn bởi hợp đồng FE08 lõi đã được
phê duyệt. Trạng thái thiết kế: ĐƯỢC PHÊ DUYỆT bởi người dùng với `APPROVE TD-028 - Option A` và
`APPROVE FE08 DESIGN` vào ngày 19-07-2026.

## 1. Bối cảnh

FE08 Việc tạo mục tiêu đặt chỗ nhắm mục tiêu chính xác vào `CopyId` vật lý và thao tác ghi đã là một
hoạt động `POST /api/reservations` được máy chủ xác thực, được bảo vệ. Màn hình đặt chỗ thành viên
vẫn lấy danh mục ứng viên hiển thị từ `DEMO_RESERVABLE`, danh mục này có thể chuyển từ trạng thái
SQL và có thể hiển thị các bản sao không tồn tại.

Các hợp đồng xung quanh cố tình có ranh giới khác nhau:

- FE01 trình duyệt công khai hiển thị tính khả dụng ở cấp độ sách và không hiển thị số nhận dạng bản sao vật lý.
- FE06 việc đọc chi tiết bản sao được giới hạn đối với người dùng Thủ thư/Quản trị viên.
- FE08 do đó cần một nguồn ứng viên đặt chỗ chỉ đọc, an toàn cho thành viên trong khi vẫn giữ được phê duyệt
  Hợp đồng thao tác ghi `CopyId`.

## 2. Quyết định

Thêm điểm cuối `GET /api/reservations/candidates` chỉ dành cho thành viên được bảo vệ. Nó trả về một
hàng cho mỗi bản sao vật lý đủ điều kiện chỉ có siêu dữ liệu cần thiết để chọn mục tiêu đặt chỗ.
Điểm cuối mang tính chất tư vấn: thao tác ghi tạo hiện tại vẫn có thẩm quyền và kiểm tra lại tất cả các
quy tắc đủ điều kiện trong giao dịch máy chủ.

Quyết định này không mở rộng FE01, cấp cho thành viên quyền truy cập vào kho FE06 hoặc thay đổi mục
tiêu đặt chỗ từ `CopyId` thành `BookId`.

## 3. Hợp đồng cốt lõi

### 3.1 Truy cập

- Lộ trình: `GET /api/reservations/candidates`
- Xác thực: bắt buộc.
- Ủy quyền: Yêu cầu `MEMBER`; Quyền truy cập của Thủ thư/Quản trị viên không được ngụ ý bởi tuyến đường này.
- Không có trạng thái đặt chỗ, kiểm tra, thông báo hoặc sao chép nào bị thay đổi.

### 3.2 Truy vấn

Tất cả các tham số truy vấn đều là tùy chọn:

| Tham số | Loại | Mặc định | Quy tắc |
| --- | --- | --- | --- |
| `q` | chuỗi | trống | Đã cắt tỉa; tối đa 200 ký tự; khớp với tên sách đang hoạt động hoặc tên tác giả. |
| `page` | số nguyên dương | 1 | Phải có ít nhất 1. |
| `limit` | số nguyên | 20 | Phải nằm trong khoảng từ 1 đến 100. |

Lọc và phân trang thuộc sở hữu của máy chủ. Kết quả được sắp xếp một cách xác định bởi `Book.Title
ASC`, `Book.BookId ASC` và `BookCopy.CopyId ASC`.

### 3.3 Tính đủ điều kiện của ứng viên

Một hàng chỉ được trả về khi:

- Sách gốc có `Books.Status = 'ACTIVE'`.
- Bản sao vật lý có `BookCopies.Status IN ('BORROWED', 'RESERVED')`.
- Bản sao không phải là `AVAILABLE`, `DAMAGED`, `LOST` hoặc `INACTIVE`.

Trạng thái `RESERVED` được đưa vào vì nó đại diện cho mục tiêu hàng đợi/giữ hiện có. thao tác ghi tạo
vẫn từ chối một bản sao khi trạng thái của nó thay đổi hoặc khi thành viên yêu cầu không còn đủ điều
kiện.

### 3.4 Phong bì phản hồi

Phản hồi thành công sử dụng hình dạng danh sách chuẩn được máy chủ hỗ trợ:

```json
{
  "data": [
    {
      "copyId": 12,
      "bookId": 4,
      "title": "Clean Code",
      "authorName": "Robert C. Martin",
      "copyStatus": "BORROWED",
      "activeReservationCount": 2
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 1,
    "totalPages": 1
  }
}
```

`authorName` có thể là `null`. `activeReservationCount` chỉ tính `Reservations.Status = 'ACTIVE'`
cho bản sao ứng viên và là bản tóm tắt hàng đợi, không đảm bảo về vị trí mà người gọi sẽ nhận được
sau khi thao tác ghi trong tương lai.

Phản hồi không được chứa `barcode`, `location`, thông tin chủ sở hữu đặt chỗ, email thành viên, dấu
thời gian đặt chỗ, giá trị chuyển đổi hàng nội bộ hoặc siêu dữ liệu chỉ dành cho nhân viên.

### 3.5 Lỗi

- Yêu cầu chưa được xác thực: phong bì xác thực `401` chung hiện có.
- Đã được xác thực không phải là thành viên: phong bì ủy quyền `403` hiện có.
- `q`, `page` hoặc `limit` không hợp lệ: phong bì `400` xác thực hiện có.
- Không có ứng cử viên phù hợp: `200` với `data: []`, `total: 0` và `totalPages: 0`.

## 4. Kiến trúc và luồng dữ liệu

1. `MyReservationsPage` gửi `reservationApi.listCandidates({ q, page, limit })`.
2. Tuyến xác thực người gọi, yêu cầu `MEMBER` và xác thực các tham số truy vấn.
3. Bộ điều khiển chuyển truy vấn đã chuẩn hóa tới dịch vụ đặt chỗ.
4. Dịch vụ ủy quyền cho một phương thức lưu trữ chỉ đọc.
5. Kho lưu trữ sử dụng SQL được tham số hóa nối `Books`, `BookCopies` và tổng hợp các hoạt động
   `Reservations`; nó chỉ trả về phép chiếu an toàn ở trên.
6. Dịch vụ ánh xạ các hàng vào `{ data, pagination }`.
7. Việc chọn một hàng sẽ gọi thao tác ghi `reservationApi.create(copyId)` hiện có. Máy chủ xác nhận lại trạng thái sách,
   trạng thái sao chép, tính đủ điều kiện của thành viên, đặt chỗ trùng lặp và giới hạn đặt chỗ ba
   lần hoạt động.
8. Sau khi tạo hoặc hủy, trang sẽ tải lại dữ liệu đặt chỗ chuẩn và dữ liệu ứng viên thay vì thay đổi địa phương
   danh mục.

Không cần di chuyển lược đồ. Tất cả SQL phải được tham số hóa và đường dẫn đọc không được lấy khóa
thao tác ghi hoặc ghi bản ghi kiểm tra.

## 5. Ranh giới giao diện người dùng

`MyReservationsPage` sẽ:

- Xóa việc nhập và sử dụng `DEMO_RESERVABLE`.
- Giữ văn bản tìm kiếm ở trạng thái thành phần nhưng gửi nó dưới dạng `q` đến máy chủ.
- Hiển thị trạng thái tải, trống, lỗi xác thực và lỗi yêu cầu từ điểm cuối ứng viên.
- Kết xuất `copyStatus` và `activeReservationCount` do máy chủ cung cấp; nó không được phát minh ra các giá trị hoặc tính khả dụng của ETA
  đếm từ dữ liệu cục bộ.
- Giữ nguyên quy tắc hiện tại là bản sao có sẵn sẽ được mượn thay vì dành riêng; ứng viên không bao giờ bao gồm một
  bản sao có sẵn và thao tác ghi vẫn là người bảo vệ cuối cùng.
- Giữ nguyên bảng vòng đời đặt chỗ hiện có, quy trình hủy và cách ly lỗi tiếng Việt.

`DEMO_BORROW_CATALOG` tạm thời được ghi lại vẫn nằm ngoài thay đổi này. Không có danh mục demo nào
khác được giới thiệu lại.

## 6. truy vết và tệp bàn giao

Kế hoạch triển khai phải cập nhật các tạo phẩm nguồn xác thực sau đây trước khi mã được coi là hoàn chỉnh:

- `.sdd/specs/feat-reservation-management/SPEC.md`: thêm điểm cuối ứng cử viên, phép chiếu an toàn và chỉ dành cho thành viên
  ranh giới với ID yêu cầu ổn định.
- `.sdd/specs/feat-reservation-management/PLAN.md`: thêm cổng xác thực và công việc danh mục ứng viên.
- `.sdd/specs/feat-reservation-management/TASKS.md`: thêm các tác vụ máy chủ, giao diện người dùng, kiểm thử, OpenAPI và bằng chứng nguyên tử.
- `.sdd/specs/feat-reservation-management/CHANGELOG.md`: ghi lại hợp đồng đã được phê duyệt và loại bỏ tĩnh
  nguồn ứng viên.
- `backend/src/routes/reservationRoutes.js`, bộ điều khiển, dịch vụ, kho lưu trữ, trình xác thực và OpenAPI.
- `backend/tests/reservationRoutes.test.js` và bộ kiểm thử ứng viên được hỗ trợ bởi SQL.
- `frontend/src/api/libraryFeatureApi.js`, `frontend/src/page/reservation/MyReservationsPage.jsx`,
  `frontend/src/utils/libraryFeatureViewModels.js` và các kiểm thử giao diện người dùng tập trung.
- `TECH_DEBT.md`: chỉ đóng TD-028 sau khi bằng chứng triển khai và xác thực được thông qua.
- `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md` và gói chấp nhận đầy đủ.

## 7. Thiết kế xác nhận

### Kiểm tra đơn vị/tuyến đường máy chủ

- Thành viên có thể liệt kê các ứng cử viên với phong bì mặc định.
- Vai trò khách và không phải thành viên nhận được `401`/`403`.
- `q`, `page` và `limit` không hợp lệ sẽ bị từ chối.
- Tìm kiếm, trạng thái đủ điều kiện cố định, thứ tự xác định, phân trang và kết quả trống đều được đề cập.
- Phép chiếu không bao gồm các trường mã vạch, vị trí, chủ sở hữu, email, dấu thời gian và phiên bản.
- Danh sách ứng viên không gọi các phương thức kho lưu trữ tạo, kiểm tra, thông báo hoặc thao tác ghi.
- Các hồi quy tạo/hủy và bảo vệ vai trò hiện tại vẫn giữ nguyên màu xanh.

### Kiểm tra được hỗ trợ bởi SQL

- Tạo các sách đang hoạt động với các bản sao `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST` và `INACTIVE`.
- Khẳng định chỉ trả sách các bản sao đã mượn/đặt chỗ của cuốn sách đang hoạt động.
- Khẳng định số lượng đặt chỗ đang hoạt động là chính xác và việc đặt chỗ ở thiết bị đầu cuối sẽ bị loại trừ.
- Khẳng định tìm kiếm, sắp xếp ổn định, phân trang và trình chiếu được sắp xếp lại đối với SQL Server.
- Sử dụng chức năng dọn dẹp tổng hợp có bảo vệ và đưa bộ phần mềm vào bằng chứng Live SQL tổng hợp.

### Kiểm tra giao diện người dùng và trình duyệt

- Trang yêu cầu các ứng cử viên từ API và không bao giờ nhập `DEMO_RESERVABLE`.
- Tìm kiếm gửi `q` và hiển thị kết quả máy chủ; không có chức năng lọc/cắt phía trình duyệt nào có thẩm quyền.
- Trạng thái trống/lỗi/tải được hiển thị và an toàn.
- Việc chọn một ứng cử viên sẽ gửi `copyId` thực của nó; đặt chỗ thành công sẽ làm mới trạng thái máy chủ chuẩn.
- Các kiểm thử giao diện người dùng tập trung và hướng dẫn từng bước của trình duyệt dành riêng cho thành viên trên các cổng bị cô lập.

### Cổng cuối cùng

- Hồi quy máy chủ, bảo hiểm, hồi quy giao diện người dùng, tìm lỗi mã nguồn, bản dựng, tích hợp hệ thống, bộ phần mềm được hỗ trợ bởi SQL và E2E.
- Thực thi truy vết, phân tích cú pháp OpenAPI, quét bí mật/phụ thuộc/phạm vi và vệ sinh khác biệt.
- Cổng Quyết định của Con người A ghi lại hợp đồng này và Cổng B chạy lại sau khi đầu thực hiện có màu xanh.

## 8. Rủi ro và mục tiêu không rõ ràng

- Một ứng cử viên có thể không còn khả dụng giữa việc niêm yết và tạo; điều này được mong đợi và xử lý bởi hiện tại
  hợp đồng xung đột máy chủ.
- Số nhận dạng bản sao chỉ được hiển thị cho các thành viên đã được xác thực vì thao tác ghi được phê duyệt yêu cầu chúng; không
  thông tin về vị trí thực tế hoặc quyền sở hữu bị lộ.
- Thay đổi này không thêm xử lý hàng đợi tự động, dự đoán ETA, nhân viên thông báo, đặt chỗ cấp độ sách
  thao tác ghi, số nhận dạng bản sao công khai hoặc di chuyển cơ sở dữ liệu.
