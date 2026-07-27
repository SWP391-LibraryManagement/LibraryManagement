# Kế Hoạch Kiểm Thử FE01 - Công Khai / Duyệt Sách

Phiên bản: 0.3.8
Trạng thái: HOÀN THÀNH - BẰNG CHỨNG BASELINE ĐÃ ĐƯỢC GHI NHẬN; HOÀN THIỆN HOMEPAGE CỤC BỘ ĐÃ ĐƯỢC XÁC THỰC
Cập nhật lần cuối: 2026-07-27

Đặc tả nguồn: `.sdd/specs/feat-public-browse/SPEC.md`
ID chức năng: `BR-FE01-*`, `FR-FE01-*`, `AC-FE01-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: §16 Ma trận truy vết trong `SPEC.md` (file này là chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm Vi Kiểm Thử

Hành vi duyệt/tìm kiếm/chi tiết công khai dành cho Khách và người dùng đã xác thực khi xem thông tin danh mục công khai.

## 2. Mục Tiêu Kiểm Thử Unit

- Validation q tìm kiếm và bộ lọc ID dương.
- q công khai chỉ khớp tên sách/tác giả; tìm kiếm theo ISBN không trả về kết quả khớp.
- Danh sách, chi tiết và HomePage cho Khách/Thành viên không bao giờ làm lộ ISBN.
- Quy tắc hiển thị công khai: người dùng chỉ thấy dữ liệu danh mục hoạt động/công khai.
- Xử lý tìm kiếm trống/phân trang mặc định và không có kết quả.
- Thứ tự `Title ASC, BookId ASC` ổn định và ranh giới page/limit.
- Metadata tùy chọn null và phép chiếu `AVAILABLE`/`UNAVAILABLE`.
- Tài khoản Quản trị viên/Thủ thư FE11 sử dụng hành động sách dành cho nhân viên và không bao giờ vào route mượn/đặt chỗ chỉ dành cho Thành viên.
- Cách hiển thị HomePage cho Khách/Thành viên không có huy hiệu tình trạng có sẵn; Khách thấy bước tiếp tục đăng nhập chung, còn Thành viên thấy hành động mượn FE07 hoặc đặt chỗ FE08 rõ ràng.
- Cách hiển thị HomePage cho Thủ thư/Quản trị viên giữ trạng thái cấp cao đã được phê duyệt.
- Nhãn và đích của nhóm điều hướng phù hợp với đối tượng Khách, Thành viên, Thủ thư và Quản trị viên.
- Mọi đích Homepage được đăng ký bởi `App.jsx`; route được bảo vệ giữ guard của chức năng sở hữu.
- Thông tin liên hệ footer, hộp thoại chính sách, phần responsive và hành vi giảm chuyển động vẫn sử dụng được.
- Bốn thẻ lợi ích thành viên sử dụng lưới desktop 2x2 có chiều rộng bằng nhau, căn theo hàng và một cột không so le trên thiết bị di động.

## 3. Mục Tiêu Kiểm Thử API / Tích Hợp

- `GET /api/books` với bộ lọc q/ID và phân trang chuẩn.
- `GET /api/books/{bookId}` với chi tiết đang hoạt động, an toàn cho công khai.
- Phản hồi cho Khách/Thành viên không có ISBN, trong khi chi tiết dành cho Thủ thư/Quản trị viên được cấp quyền vẫn giữ trường ISBN của FE05.
- ID sách không hợp lệ, bộ lọc không hợp lệ, page/limit không hợp lệ và q quá dài.
- Sách bị thiếu và sách không hoạt động/đã ngừng kích hoạt bị ẩn khỏi phản hồi công khai.
- Metadata tùy chọn null được giữ trong phản hồi danh sách/chi tiết.
- Trạng thái bản sao FE06 hiện tại được phản ánh mà không làm lộ số lượng chính xác hoặc ghi vào bản sao.
- Endpoint duyệt sách công khai không yêu cầu xác thực và các route mutation vẫn được bảo vệ.

## 4. Luồng Chấp Nhận E2E / Thủ Công

- Khách mở chế độ xem trang chủ/danh mục.
- Khách tìm kiếm với tiêu chí trống, hợp lệ, không hợp lệ và không có kết quả.
- Khách mở chi tiết sách đang hoạt động và thấy metadata an toàn cho công khai, không có ISBN hoặc nhãn tình trạng có sẵn.
- Khách mở chi tiết bị thiếu hoặc không hoạt động và thấy trạng thái không tìm thấy an toàn.
- Khách và Thành viên thấy fallback null/không có ảnh bìa an toàn mà không có huy hiệu tình trạng có sẵn; hành động của Thành viên vẫn xác định đúng quy trình sở hữu.
- Thành viên chọn sách có sẵn và tới `/borrowing/new?bookId=...`; sách không có sẵn dẫn tới `/reservations/mine?bookId=...`.
- Thủ thư/Quản trị viên thấy trạng thái cấp cao `Còn sách` hoặc `Không khả dụng` đã được phê duyệt.
- Khách mở `/home`; tác nhân đã xác thực mở thư viện công khai tại `/homepage`.
- Không tác nhân nào thấy các nhóm header `Khám phá sách`, dịch vụ theo đối tượng, `Về thư viện` hoặc `Hỗ trợ` đã bị xóa trên desktop hoặc thiết bị di động; thương hiệu, hành động tài khoản và điều khiển tiếp tục theo vai trò vẫn sử dụng được.
- Số điện thoại, email và địa chỉ ở footer vẫn dễ đọc; các hộp thoại Quyền riêng tư, Điều khoản và Cookie mở và đóng đúng cách.

## 5. Bằng Chứng Hiện Tại

- Kiểm thử route/repository backend chuyên biệt cho FE01 đạt 9/9.
- Kiểm thử frontend duyệt sách công khai FE01 đạt 14/14.
- Kiểm thử frontend tập trung kết hợp đạt 39/39 trên duyệt sách công khai, App Shell và hành động sách HomePage.
- Bộ kiểm thử SQL về tình trạng có sẵn công khai đạt trong lượt chạy SQL Server dùng một lần tổng hợp 61/61.
- Truy vết FE01 bao phủ hợp đồng header đã đơn giản hóa; lint frontend, build production và `git diff --check` đều đạt.

## 6. Khoảng Trống

- Việc xác nhận quyền sở hữu FE05/FE06 trong lịch sử vẫn được ghi nhận là hạng mục quản trị baseline còn mở.
- Vẫn cần con người chấp nhận giao diện, điều hướng và khả năng hiển thị theo vai trò của phần hoàn thiện Homepage cục bộ hiện tại trước khi phát hành.

## 7. Lệnh / Bằng Chứng Bắt Buộc Trước Merge

```powershell
npm.cmd --prefix backend test -- --runTestsByPath tests/publicBrowseRoutes.test.js tests/publicBrowseRepository.test.js
node --test frontend/test/publicBrowseFrontend.test.js frontend/test/appShellFrontend.test.js frontend/test/homeBookActions.test.js
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
git diff --check
```
