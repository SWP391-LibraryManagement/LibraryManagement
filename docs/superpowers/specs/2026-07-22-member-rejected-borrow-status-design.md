# Thiết kế trạng thái vay bị từ chối của thành viên

Ngày: 22-07-2026

Trạng thái: ĐƯỢC PHÊ DUYỆT BỞI NHAT

## 1. Mục tiêu

Đảm bảo rằng thành viên nhìn thấy `Đã từ chối` trong lịch sử mượn sau khi Thủ thư hoặc Quản trị viên
từ chối yêu cầu mượn đang chờ xử lý của thành viên.

Thay đổi phải duy trì vòng đời chi tiết và yêu cầu FE07 riêng biệt, lược đồ cơ sở dữ liệu hiện có và
các bộ lọc lịch sử trạng thái chi tiết chuẩn.

## 2. Nguyên nhân gốc rễ

Sự kiên trì từ chối đã hoạt động chính xác:

- `BorrowRequests.Status` thay đổi từ `PENDING` thành `REJECTED`.
- `BorrowDetails.Status` được liên kết vẫn là `REQUESTED`, theo yêu cầu của giá trị liệt kê trạng thái chi tiết hiện tại.
- Truy vấn SQL lịch sử đã chọn `BorrowRequests.Status AS RequestStatus`.

Lỗi xảy ra ở ranh giới mô hình đọc. `mapBorrowDetail` loại bỏ `RequestStatus`, do đó
`/api/borrow-requests/me` chỉ trả về trạng thái chi tiết `REQUESTED`. Giao diện người dùng thành
viên ánh xạ giá trị đó tới `Pending`, được hiển thị dưới dạng `Chờ xử lý`.

## 3. Phương pháp tiếp cận đã được phê duyệt

Mở rộng mô hình đọc chi tiết mượn với `requestStatus` và chỉ sử dụng nó để giải quyết trạng thái
hiển thị của thành viên đối với các yêu cầu bị từ chối.

Đối với một hàng lịch sử:

1. Nếu `requestStatus === 'REJECTED'`, trạng thái UI hiệu quả là `Rejected`.
2. Mặt khác, trạng thái giao diện người dùng hiệu quả tiếp tục đến từ trạng thái chi tiết, bao gồm cả hành vi `OVERDUE` dẫn xuất.

Cách tiếp cận này không ghi đè `BorrowDetail.status` và không đưa `REJECTED` vào giá trị liệt kê
trạng thái chi
tiết liên tục.

## 4. Phạm vi

### Trong phạm vi

- Hiển thị `requestStatus` từ SQL và các trình ánh xạ chi tiết mượn trong bộ nhớ.
- Tài liệu `requestStatus` trong hợp đồng phản hồi FE07.
- Tạo bản đồ lịch sử thành viên từ chối các yêu cầu tới trạng thái UI `Rejected` hiện có và nhãn tiếng Việt `Đã từ chối`.
- Thêm các kiểm thử hồi quy máy chủ, giao diện người dùng và OpenAPI.
- Cập nhật FE07 SPEC và CHANGELOG để biết hành vi mô hình đọc có thể quan sát được.

### Ngoài phạm vi

- Thay đổi lược đồ cơ sở dữ liệu.
- Cập nhật `BorrowDetails.Status` trong quá trình từ chối.
- Thêm yêu cầu mới hoặc giá trị giá trị liệt kê chi tiết.
- Thêm tab lịch sử bị từ chối hoặc thay đổi giá trị bộ lọc truy vấn `status` được chấp nhận.
- Hiển thị hoặc duy trì lý do từ chối cho các thành viên.
- Thay đổi hành vi từ chối của Thủ thư/Quản trị viên.

## 5. Dữ liệu và hợp đồng API

Các phản hồi chi tiết về lượt mượn có một trường cấp độ yêu cầu:

```json
{
  "borrowDetailId": 41,
  "requestId": 17,
  "status": "REQUESTED",
  "requestStatus": "REJECTED"
}
```

`status` vẫn giữ trạng thái chi tiết chuẩn và tiếp tục chỉ chấp nhận `REQUESTED`, `BORROWED`,
`RETURNED`, `LOST`, `DAMAGED` và `OVERDUE` dẫn xuất nếu có.

`requestStatus` báo cáo trạng thái yêu cầu sở hữu: `PENDING`, `APPROVED`, `REJECTED`, `COMPLETED`
hoặc `CANCELLED`.

Hợp đồng truy vấn `/api/borrow-requests/me` và `/api/members/{memberId}/borrowings` vẫn không thay
đổi. chức năng lọc vẫn hoạt động ở trạng thái chi tiết nên bản sửa lỗi này không thêm `REJECTED` làm
giá trị bộ lọc lịch sử.

## 6. Thiết kế máy chủ

Các truy vấn SQL không yêu cầu thay đổi vì cả hai lựa chọn chi tiết vay mượn đều đã bao gồm
`br.Status AS RequestStatus`.

Trình ánh xạ `mapBorrowDetail` sản xuất sẽ sao chép `row.RequestStatus` sang `requestStatus`. Trình
ánh xạ trong bộ nhớ sẽ tra cứu yêu cầu sở hữu và hiển thị cùng một trường để kiểm tra tuyến đường
duy trì tính chẵn lẻ của SQL/trong bộ nhớ.

Giao dịch từ chối vẫn không thay đổi. Nó tiếp tục chỉ cập nhật tiêu đề yêu cầu và trạng thái kiểm
tra, để lại các chi tiết được yêu cầu ở trạng thái bền vững đã được phê duyệt.

## 7. Thiết kế giao diện người dùng

`mapBorrowDetailsToHistoryRows` sẽ lấy được trạng thái hiển thị hiệu quả:

```text
requestStatus là REJECTED -> Bị từ chối
trường hợp khác           -> ánh xạ trạng thái chi tiết hiện có
```

Bản địa hóa hiện tại đã ánh xạ `Rejected` thành `Đã từ chối`, do đó không cần khóa dịch mới. Các
hàng bị từ chối vẫn không thể gia hạn vì việc gia hạn vẫn chỉ được bật cho các chi tiết có trạng
thái liên tục là `BORROWED`.

Các màn hình khác sử dụng chi tiết mượn vẫn giữ nguyên hành vi trạng thái chi tiết hiện tại của
chúng trừ khi chúng sử dụng rõ ràng trường cấp độ yêu cầu mới.

## 8. Lỗi và hành vi tương thích

- Các máy khách hiện tại bỏ qua các thuộc tính phản hồi không xác định vẫn tương thích.
- Các bộ lọc trạng thái chi tiết và phân trang hiện tại vẫn không thay đổi.
- `requestStatus` bị thiếu từ tải trọng cũ hơn hoặc một phần sẽ quay trở lại ánh xạ trạng thái chi tiết hiện có.
- Trường mới không có lý do từ chối hoặc danh tính nhân viên nào bị lộ.

## 9. Thiết kế kiểm thử

### Hồi quy lộ trình máy chủ

1. Thành viên tạo yêu cầu mượn.
2. Thủ thư từ chối nó với một lý do chính đáng.
3. Thành viên tải `/api/borrow-requests/me`.
4. Hàng trả về giữ `status: 'REQUESTED'` và báo cáo `requestStatus: 'REJECTED'`.

kiểm thử này chứng minh tính toàn vẹn của vòng đời và hợp đồng đọc cố định.

### Hồi quy giao diện Mapper

- Một chi tiết có `status: 'REQUESTED'` và `requestStatus: 'REJECTED'` ánh xạ tới trạng thái giao diện người dùng `Rejected`.
- Một chi tiết đang chờ xử lý thông thường không có trạng thái yêu cầu bị từ chối vẫn ánh xạ tới `Pending`.
- Các bản đồ mượn, quá hạn, trả sách, hư hỏng và bị mất hiện tại vẫn không thay đổi.

### Hồi quy hợp đồng

- OpenAPI ghi lại `BorrowDetail.requestStatus` với giá trị liệt kê trạng thái yêu cầu.
- Các kiểm thử máy chủ và giao diện người dùng FE07 tập trung đã vượt qua.
- kiểm tra mã/bản dựng giao diện người dùng, thực thi truy vết và vượt qua vệ sinh khác biệt trước khi hoàn thành được yêu cầu.

## 10. Tiêu chí chấp nhận

- Với yêu cầu mượn đang chờ xử lý của thành viên, khi Thủ thư hoặc Quản trị viên từ chối và thành viên tải lại lịch sử mượn, thì mọi chi tiết thuộc yêu cầu đó sẽ hiển thị `Đã từ chối` thay vì `Chờ xử lý`.
- Yêu cầu bị từ chối vẫn là `REJECTED` và các chi tiết của nó vẫn là `REQUESTED` vẫn tồn tại.
- Các yêu cầu đang chờ xử lý chưa bị từ chối sẽ tiếp tục hiển thị `Chờ xử lý`.
- Không có lược đồ cơ sở dữ liệu, bộ lọc giá trị liệt kê, phân trang, quyền hoặc hành vi giao dịch từ chối.

## 11. Đánh giá kết quả

Nhật phê duyệt phương pháp đọc mô hình vào ngày 22-07-2026. Việc triển khai phải là một thay đổi
FE07 mang tính phẫu thuật với xác minh kiểm thử đầu tiên và không chỉnh sửa đối với công việc xác
thực đang diễn ra không liên quan hoặc công việc trong bảng điều khiển dành cho quản trị viên.
