# Xác thực Hồ sơ tất định FE03

Ngày: 2026-07-19

Trạng thái: TỰ ĐỘNG VÀ DỰA TRÊN SQL ĐẠT; CHẤP THUẬN CỦA CON NGƯỜI ĐANG CHỜ

## Quyết định

- Phương thức bàn giao: Kết hợp, độ sâu Tiêu chuẩn.
- Lõi: phân quyền hồ sơ của chính mình, danh sách trắng PUT chính xác, kiểm toán nguyên tử bắt buộc,
  tạo hồ sơ còn thiếu tất định, bù trừ ảnh đại diện và ghi nhật ký an toàn.
- Khung: nối kho dữ liệu, công cụ hỗ trợ dọn dẹp tệp được tạo và dữ liệu cố định kiểm thử
  trọng tâm.

## Phạm vi đã triển khai

- `PUT /api/profile/me` chỉ chấp nhận `fullName`, `address`, `dateOfBirth` và
  `phone`; tải trọng `avatarUrl` trực tiếp, được bảo vệ, không xác định và trống bị
  từ chối trước khi thay đổi.
- Hộp thoại chỉnh sửa hồ sơ không có trường URL Ảnh đại diện trực tiếp và máy khách PUT
  chỉ gửi bốn trường có thể chỉnh sửa đã phê duyệt.
- Cập nhật trường hồ sơ và ảnh đại diện trong cơ sở dữ liệu yêu cầu mục kiểm toán an toàn bên trong
  cùng giao dịch SQL.
- Việc tạo hồ sơ còn thiếu dùng `UPDLOCK` và `HOLDLOCK` trước khi chèn hàng
  `UserProfiles.UserId` duy nhất.
- Lỗi cơ sở dữ liệu/kiểm toán ảnh đại diện kích hoạt bù trừ tệp mới. Thay thế thành công
  commit trước, rồi thử dọn dẹp tệp cũ được quản lý mà không
  hoàn tác trạng thái hồ sơ đã commit.
- Việc xóa được quản lý từ chối URL bên ngoài, đường dẫn lồng, đường dẫn duyệt ngược và
  đích thư mục dấu chấm.
- Ghi nhật ký 5xx dùng chung chỉ giữ mã lỗi, phương thức và đường dẫn; văn bản lỗi thô,
  dấu vết ngăn xếp và chuỗi truy vấn bị loại.

## Truy vết

| Yêu cầu | Mã và kiểm thử |
| --- | --- |
| BR-FE03-016, FR-FE03-006, AC-FE03-013 | kiểm thử dịch vụ backend cùng `profileFrontend.test.js` |
| BR-FE03-017, FR-FE03-010 | `profileRepository.js`, `profileRepository.test.js` |
| FR-FE03-001, AC-FE03-012 | `createBlankProfile` đã khóa, kiểm thử dịch vụ/kho dữ liệu |
| AC-FE03-014 | bù trừ dịch vụ ảnh đại diện, kiểm thử xóa nơi lưu, ghi nhật ký dọn dẹp an toàn |
| SAFE-005, NFR-FE03-LOG-001 | `errorHandler.js`, `securityRegression.test.js`, kiểm thử lỗi tuyến |

## Bằng chứng tự động

- Đường cơ sở trước thay đổi: backend 38 bộ, 606/606; frontend 120/120.
- FE03 trọng tâm: 4 bộ, 41/41.
- Độ bao phủ FE03 trọng tâm: câu lệnh 90.83%, nhánh 81.92%, hàm
  92.30%, dòng 93.54%.
- Toàn bộ backend sau thay đổi: 40 bộ, 632/632.
- Toàn bộ frontend: 123/123.
- Lint frontend: đạt.
- Bản dựng frontend production: đạt với cảnh báo kích thước khối toàn dự án
  hiện có.
- Thực thi truy vết: đạt.
- Đối soát truy vết nguồn FE03: 10/10 yêu cầu chức năng được gắn thẻ (100%).
- Chấp thuận trình duyệt Playwright với API bị chặn: tải lên PNG hợp lệ cập nhật
  ảnh đại diện hiển thị; `.json` không được hỗ trợ và PNG lớn hơn 2 MB hiển thị
  lỗi tiếng Việt đã phê duyệt; thân PUT thu được chứa chính xác
  `fullName`, `address`, `dateOfBirth` và `phone`; bảng điều khiển trình duyệt báo
  không lỗi và không cảnh báo.
- Cổng đối soát diff chính xác mới đạt: 5 bộ backend trọng tâm, 48/48 kiểm thử;
  frontend trọng tâm 3/3; truy vết 10/10 thẻ FR FE03; `git diff --check` sạch.
- Chấp thuận CLI Playwright cô lập mới trên cổng `4185` tái xác nhận luồng PNG hợp lệ,
  phản hồi `.json` không được hỗ trợ, phản hồi `.png` 23 MB quá lớn, tải trọng PUT chính xác bốn trường
  và phiên sạch với 0 lỗi bảng điều khiển cùng 0 cảnh báo. Cổng `4173` vẫn
  không bị tác động vì thuộc tiến trình Vite FE03 hiện có. Ảnh chụp màn hình:
  `output/playwright/fe03-exact-profile-updated.png`.

## Phụ lục dựa trên SQL

- `backend/tests/sql/profileConcurrency.sqltest.js` được thêm qua ĐỎ-XANH và đạt 6/6 trên môi trường chạy SQL Server đối soát dùng một lần.
- Các lượt xem đầu đồng thời tạo chính xác một hàng `UserProfiles` và trả về cùng ID hồ sơ.
- Thay đổi trường hồ sơ/điện thoại và URL ảnh đại diện hoàn tác cùng phần ghi kiểm toán sau lỗi được chèn.
- Cổng SQL tổng hợp đạt 8/8 bộ và 61/61 kiểm thử kèm dọn dẹp cơ sở dữ liệu/đăng nhập.

## Các cổng còn lại

- Hoàn thành kiểm tra thủ công màn hình hồ sơ T-FE03-015 cho tải lên hợp lệ, loại
  không hợp lệ và phản hồi tệp quá lớn. Lượt trình duyệt tự động ở trên không
  thay thế chấp thuận L4 của con người.
- Dat/Nhat phải hoàn thành đầu ra B7/L4 cuối và đánh giá tích hợp trước khi FE03
  có thể được gọi là hoàn thành hoặc được hợp nhất.
