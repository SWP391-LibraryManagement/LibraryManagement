# Kế hoạch kiểm thử FE05 - Quản lý sách

Phiên bản: 0.4.3
Trạng thái: HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG KẾT THÚC GIAI ĐOẠN 2
Cập nhật gần nhất: 2026-07-27

Đặc tả nguồn: `.sdd/specs/feat-book-management/SPEC.md`
ID tính năng: `BR-FE05-*`, `FR-FE05-*`, `AC-FE05-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: §16 Ma trận truy vết trong `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm vi kiểm thử

Quản lý danh mục sách cho nhân sự được phân quyền, gồm tạo, cập nhật, quản lý siêu dữ liệu, danh sách quản lý và ngừng kích hoạt.

## 2. Mục tiêu kiểm thử đơn vị

- Kiểm tra các trường bắt buộc.
- Quy tắc duy nhất của ISBN/mã định danh.
- Kiểm tra siêu dữ liệu danh mục/tác giả/nhà xuất bản.
- Quy tắc ngừng kích hoạt thay cho xóa cứng.
- Quy tắc tìm kiếm/lọc/sắp xếp của giao diện quản lý.
- Truy vấn q công khai của Khách/Thành viên chỉ khớp tiêu đề/tác giả và DTO công khai không chứa ISBN.
- Danh sách/chi tiết/tìm kiếm quản lý của Thủ thư/Quản trị viên vẫn giữ ISBN.
- Kiểm tra ảnh bìa do hệ thống quản lý: phần mở rộng JPG/PNG/WebP, MIME, chữ ký byte, giới hạn 2 MB, tên được tạo và dọn dẹp an toàn.

## 3. Mục tiêu kiểm thử API / tích hợp

- `GET /books/metadata`: luồng hợp lệ của người quản lý được phân quyền.
- `GET /books/metadata`: Khách/Thành viên bị từ chối; Thủ thư/Quản trị viên chỉ nhận các lựa chọn tham chiếu đang hoạt động.
- `GET /admin/books`: danh sách người quản lý với bộ lọc, phân trang, sắp xếp và thứ tự xác định.
- `GET /books` và `/books/:bookId`: Khách/Thành viên không nhận ISBN; q công khai chỉ có ISBN không trả về kết quả khớp.
- `POST /books`: luồng tạo hợp lệ.
- `POST /books`: thiếu trường, ISBN/mã định danh trùng lặp, siêu dữ liệu không hợp lệ.
- `PUT /books/:bookId`: luồng cập nhật hợp lệ, không tìm thấy, trường không hợp lệ.
- `PATCH /books/:bookId/deactivate`: lý do, `If-Match` khớp, không tìm thấy, xung đột.
- `PATCH /books/:bookId/reactivate`: lý do, `If-Match` khớp, chuyển trạng thái không hợp lệ, xung đột.
- `DELETE /books/:bookId`: xóa đúng sách không có bản sao, audit nguyên tử, `If-Match`, lý do và từ chối `BOOK_HAS_DEPENDENCIES`.
- Kiểm tra vai trò: người không phải quản lý không thể tạo/cập nhật/đổi trạng thái/xóa.
- Tạo/cập nhật multipart: `metadata` được tuần tự hóa, `cover` tùy chọn, bù trừ khi dữ liệu cũ/lỗi, và tương thích JSON.

## 4. Luồng chấp nhận E2E / thủ công

- Thủ thư/quản trị viên tạo một sách.
- Thủ thư/quản trị viên chỉnh sửa một sách.
- Thủ thư/quản trị viên ngừng kích hoạt và kích hoạt lại một sách, có xác nhận và lý do.
- Duyệt công khai chỉ phản ánh dữ liệu danh mục đang hoạt động.
- Nhân sự chọn và xem trước ảnh bìa cục bộ khi tạo/cập nhật; ảnh do hệ thống quản lý đã lưu hiển thị trên giao diện nhân sự và công khai.
- Nhân sự thay đổi trạng thái danh mục trong biểu mẫu cập nhật; danh sách tải lại tất cả trạng thái và mỗi hàng giữ trạng thái chuẩn riêng.
- Nhân sự xóa vĩnh viễn một sách chưa có bản sao; sách có bản sao bị chặn và dữ liệu liên quan giữ nguyên.

## 5. Bằng chứng hiện có

- Các kiểm thử tập trung FE05 cho route/repository/lưu trữ ảnh bìa/OpenAPI: `58/58` đạt, bao gồm các lựa chọn siêu dữ liệu đang hoạt động được bảo vệ theo vai trò.
- Kiểm thử hợp đồng frontend FE05: `10/10` đạt; hồi quy frontend đầy đủ đạt `215/215`.
- Kiểm thử ranh giới Bảng điều khiển Quản trị FE11: giao diện sách Thư viện chỉ đọc và không có adapter thay đổi sách trùng lặp đều đạt.
- Bộ SQL FE05: `7/7` đạt, gồm rowversion cũ, hoàn tác audit nguyên tử, và bảo toàn trạng thái sách/bản sao/quy trình trên SQL Server dùng một lần.
- Lint/build frontend, truy vết FE05 `30/30` (100%), và `git diff --check` đều đạt cho v0.6.2.

## 6. Khoảng trống

- SQL trực tiếp đã phát hiện và sửa lỗi so sánh rowversion ở ranh giới driver; migration hai lượt, kết quả SQL FE05 7/7 và dọn dẹp được ghi trong `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Chấp nhận trên trình duyệt và xác nhận của chủ sở hữu FE06 vẫn là các cổng thủ công/L4.
- Các bộ kiểm thử cổng merge toàn kho vẫn đang chờ và không được tái sử dụng bằng chứng tập trung.

## 7. Lệnh / bằng chứng bắt buộc trước khi merge

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
