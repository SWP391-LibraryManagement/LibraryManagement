# Biên bản diễn tập giai đoạn 3

Ngày: 2026-07-19
nhánh: `docs/phase3-polish-delivery`

## Diễn tập trình duyệt thông thường

- Lệnh: `npm.cmd run test:e2e` với cổng giao diện người dùng `4273`, cổng máy chủ `3200`,
  và khớp các biến URL rõ ràng.
- Kết quả: **ĐẠT**, 4/4 Playwright kiểm tra trong 24,4 giây.
- Đường dẫn: đăng nhập -> mượn -> phê duyệt -> trả sách -> phạt -> báo cáo, cộng với FE08, FE09,
  và các luồng trình duyệt tập trung vào FE11.
- Bằng chứng: `docs/assets/phase3/system-golden-path-desktop.png` và
  `docs/assets/phase3/system-golden-path-mobile.png`.

## Kịch bản bảo vệ đồ án trong năm phút

1. Đăng nhập bằng danh tính `example.test` tổng hợp.
2. Mượn một mục danh mục với tư cách là Thành viên.
3. Phê duyệt và phân bổ yêu cầu với tư cách là Thủ thư.
4. trả sách bản sao quá hạn và hiển thị bản chuyển giao khoản phạt 70.000 VND.
5. Ghi lại khoản thanh toán và mở báo cáo chỉ đọc.
6. Nếu một bước của trình duyệt không khả dụng, hãy hiển thị kiểm thử nhanh môi trường tiền sản xuất gồm sáu dấu kiểm,
   dự phòng `test:system` xác định và ảnh chụp màn hình đã được xác minh.

## kiểm tra trước và thiết lập lại

- Chạy `npm.cmd run smoke:staging` trước khi trình bày bề mặt tổ chức công khai.
- Chạy `npm.cmd run test:system` làm dự phòng API xác định.
- Máy chủ trình duyệt tạo lại dữ liệu trong bộ nhớ cho mỗi lần thiết lập và kết thúc tại
  kết thúc cuộc chạy; không có hàng SQL chia sẻ nào bị thay đổi.
- Chỉ sử dụng danh tính `example.test` tổng hợp. Không hiển thị thông tin xác thực,
  mã thông báo mang, OTP thô, phần thân SMTP hoặc chuỗi kết nối.

## ranh giới

Kỷ lục này chứng tỏ sự lặp lại của buổi diễn tập tại địa phương và buổi chiếu trước công chúng. Nó
không yêu cầu sự quan sát của con người bên ngoài về quy trình làm việc Azure đã được xác thực hoặc
việc gửi hộp thư đến của nhà cung cấp thực sự.
