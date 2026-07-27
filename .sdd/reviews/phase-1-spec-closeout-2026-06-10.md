# Hoàn tất đặc tả Giai đoạn 1 - Hệ thống Quản lý Thư viện

Ngày: 2026-06-10
Phương pháp: Phát triển Hybrid hướng Đặc tả và hướng Tác nhân
Bước sách được ánh xạ: SDD Giai đoạn 1 - Đặc tả

---

## 1. Mục đích

Tài liệu này hoàn tất giai đoạn Đặc tả cho đường cơ sở dự án hiện tại.

Theo quy trình SDD, nhóm không được chuyển từ Đặc tả sang Lập kế hoạch cho đến khi mỗi tính năng có:

- Một `SPEC.md` có ngữ cảnh hỗ trợ.
- Phạm vi và ranh giới ngoài phạm vi rõ ràng.
- Quy tắc nghiệp vụ và yêu cầu chức năng cụ thể.
- Tiêu chí chấp nhận có thể chuyển thành kiểm thử.
- Câu hỏi thiết kế đã được giải quyết hoặc phê duyệt rõ ràng.
- Danh sách kiểm tra rà soát đã hoàn tất.
- `# Status: APPROVED` trong `SPEC.md` của tính năng.

---

## 2. Kết quả Giai đoạn 1

Đặc tả Giai đoạn 1 hiện đã hoàn tất cho đường cơ sở hiện tại.

| Tính năng | Chủ sở hữu | Trạng thái SPEC | Kết quả Giai đoạn 1 | Bước bắt buộc tiếp theo |
| --- | --- | --- | --- | --- |
| FE01 Công khai / Duyệt | Dung | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE02 Xác thực | Dat | APPROVED | Hoàn tất | Tiếp tục các tác vụ triển khai đã phê duyệt |
| FE03 Hồ sơ Người dùng | Dat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE04 Quản lý Tư cách Thành viên | Dat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE05 Quản lý Sách | Dung | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE06 Quản lý Kho / Bản sao Sách | Dat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE07 Quản lý Mượn | Nhat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE08 Quản lý Đặt chỗ | Nhat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE09 Quản lý Tiền phạt | Dung | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE10 Quản lý Thông báo | Nhat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE11 Quản lý Người dùng và Vai trò | Dung | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |
| FE12 Báo cáo và Thống kê | Nhat | APPROVED | Hoàn tất | PLAN.md Giai đoạn 2 |

---

## 3. Nội dung đã dọn dẹp

Các vấn đề tài liệu sau đã được căn chỉnh với việc hoàn tất Giai đoạn 1:

- Ghi chú nguồn chân lý SPEC được đổi từ cách diễn đạt bản nháp sang cách diễn đạt đã phê duyệt để lập kế hoạch.
- Tiêu đề danh sách kiểm tra rà soát được đổi từ cách diễn đạt trước phê duyệt sang cách diễn đạt đã hoàn tất Giai đoạn 1.
- Các mục danh sách kiểm tra rà soát ở Phần 17 được đánh dấu hoàn tất dựa trên trạng thái `APPROVED` hiện có và các quyết định Giai đoạn 1 đã ghi.
- Cách diễn đạt FE07 được căn chỉnh từ câu hỏi mở sang câu hỏi đã giải quyết.
- Định dạng danh sách kiểm tra lồng nhau của FE03 đã được sửa.

Không có mã nguồn tính năng nào thay đổi trong lần hoàn tất này.

---

## 4. Cổng quan trọng cho nhóm

Hoàn tất Giai đoạn 1 không có nghĩa mọi tính năng đã sẵn sàng để lập trình.

Trước khi triển khai mỗi tính năng, nhóm phải hoàn tất:

1. Giai đoạn 2: `PLAN.md` được phê duyệt.
2. Giai đoạn 3: `TASKS.md` được phê duyệt.
3. Giai đoạn 4: triển khai từng tác vụ cùng kiểm thử.
4. Giai đoạn 5: báo cáo xác thực so sánh mã với SPEC.

Mức sẵn sàng triển khai hiện tại:

| Nhóm tính năng | Trạng thái |
| --- | --- |
| FE02 | PLAN.md và TASKS.md đã được phê duyệt cho triển khai Sprint 1. |
| FE01, FE03-FE12 trừ FE02 | SPEC đã hoàn tất nhưng PLAN.md/TASKS.md vẫn cần được viết và phê duyệt trước khi lập trình core. |
| Phạm vi của Nhat: FE07, FE08, FE10 | SPEC đã hoàn tất; ưu tiên tiếp theo là PLAN.md FE07, sau đó là TASKS.md FE07. |

---

## 5. Thứ tự tiếp theo được đề xuất

Đối với công việc được giao cho Nhat, tiến hành theo thứ tự này:

1. Quản lý Mượn FE07 - viết và phê duyệt `PLAN.md`.
2. Quản lý Mượn FE07 - viết và phê duyệt `TASKS.md`.
3. Triển khai và kiểm thử FE07.
4. Quản lý Đặt chỗ FE08 - lập kế hoạch/tác vụ sau khi phần phụ thuộc FE07 rõ ràng.
5. Quản lý Thông báo FE10 - lập kế hoạch/tác vụ sau khi điểm tích hợp thông báo rõ ràng.

Lý do: FE07 là quy trình lưu hành cốt lõi và được FE08, FE09, FE10, FE11 cùng các báo cáo phụ thuộc vào.

## 6. Ranh giới kiểm toán

Lần hoàn tất này nghĩa là các sản phẩm `SPEC.md` Giai đoạn 1 nhất quán nội bộ và sẵn sàng cho Lập kế hoạch Giai đoạn 2. Điều đó không có nghĩa lược đồ SQL hay phần triển khai đã sẵn sàng hoàn toàn. Các cổng sau vẫn phải xác minh ràng buộc cơ sở dữ liệu, hợp đồng API, mã, kiểm thử và báo cáo xác thực.

Hạng mục triển khai cần theo dõi đã biết sau SPEC: ràng buộc SQL mượn FE07 phải hỗ trợ các giá trị trạng thái SPEC đã phê duyệt như `REQUESTED`, `DAMAGED` và `COMPLETED` trước khi kho lưu trữ/dịch vụ FE07 được triển khai.

## 7. Kết quả kiểm toán cuối cùng

Kết quả kiểm toán cuối cùng sau khi kiểm tra lại toàn bộ đặc tả tính năng:

| Kiểm tra | Kết quả |
| --- | --- |
| Cả 12 tệp `SPEC.md` có `# Status: APPROVED` | PASS |
| Cả 12 tệp `SPEC.md` chứa các phần bắt buộc của Giai đoạn 1 | PASS |
| Tất cả mục trong danh sách kiểm tra rà soát Phần 17 của đặc tả tính năng đã được đánh dấu | PASS |
| Quyết định cho câu hỏi mở được phê duyệt trong gói giải quyết | PASS |
| Tài liệu rà soát không còn dùng kết luận cũ `NOT READY` làm trạng thái hiện tại | PASS |
| Người rà soát / nhóm xác nhận | PASS |

Ghi chú xác nhận: Đặc tả Giai đoạn 1 được hoàn tất cho đường cơ sở lập kế hoạch hiện tại kể từ 2026-06-10.
