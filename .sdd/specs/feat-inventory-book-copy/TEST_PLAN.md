# Kế hoạch kiểm thử FE06 - Quản lý tồn kho / bản sao sách

Phiên bản: 0.3.1
Trạng thái: ĐÃ HOÀN TẤT - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Cập nhật lần cuối: 2026-07-19

Đặc tả nguồn: `.sdd/specs/feat-inventory-book-copy/SPEC.md`
ID tính năng: `BR-FE06-*`, `FR-FE06-*`, `AC-FE06-*`
Ánh xạ AC↔kiểm thử có thẩm quyền: §16 Ma trận truy vết trong `SPEC.md` (tệp này mô tả chiến lược, không phải danh sách ca kiểm thử).

---

## 1. Phạm vi kiểm thử

Tạo bản sao sách vật lý, tính duy nhất mã vạch/mã định danh, trạng thái bản sao, tính khả dụng và tích hợp với mượn/đặt trước.

## 2. Mục tiêu kiểm thử đơn vị

- Tính duy nhất mã vạch/mã định danh của bản sao.
- Trạng thái bản sao và các chuyển đổi trạng thái được phép.
- Tính toán khả dụng theo trạng thái bản sao.
- Quy tắc xung đột: bản sao đang được mượn/đặt trước không thể được đánh dấu khả dụng tự do.
- Xác thực vị trí/giá sách nếu được triển khai.

## 3. Mục tiêu kiểm thử API / tích hợp

- Các luồng hợp lệ tạo/liệt kê/cập nhật/trạng thái/ngừng kích hoạt bản sao.
- Mã vạch trùng lặp bị từ chối.
- Chuyển đổi trạng thái không hợp lệ bị từ chối.
- Vai trò không được phép bị từ chối.
- Xung đột với mượn/đặt trước đang hoạt động bị từ chối.

## 4. Luồng chấp nhận E2E / thủ công

- Thủ thư thêm một bản sao vật lý.
- Thủ thư thay đổi trạng thái bản sao.
- Tính khả dụng cho mượn/đặt trước được cập nhật tương ứng.
- Báo cáo tồn kho phản ánh trạng thái bản sao.

## 5. Bằng chứng hiện có

- Kiểm thử route tập trung: `35/35` đạt, bao gồm các race sau kiểm tra trước về mượn, đặt trước, trạng thái sách cha và tạo dưới sách cha.
- Kiểm thử hợp đồng frontend FE06: `6/6` đạt.
- Bộ hợp đồng/đồng thời SQL FE06: `10/10` đạt trên SQL Server dùng một lần, bao gồm kiểm tra lại quy trình/sách cha có khóa sau kiểm tra trước ở service.
- Backend đầy đủ `633/633` và frontend `124/124` đạt.
- Các ngưỡng bao phủ đạt: statements 92.51%, branches 82.46%, functions 97.10%, lines 92.44%.
- Lint/build frontend, phân tích OpenAPI, truy vết `24/24`, import smoke và kiểm tra diff đều đạt.
- Schema dùng một lần cùng migration FE06 lượt 1/2 và lượt 2/2 đều thành công; dọn dẹp trả về `DB_CLEAN` và `LOGIN_CLEAN`.

## 6. Khoảng trống trước khi thoát giai đoạn (đã được thay thế)

- Việc thực thi SQL Server dùng một lần, áp dụng migration FE06 hai lượt và dọn dẹp được ghi tại `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Tại mốc trước khi thoát này, chấp nhận trên trình duyệt/L4 cùng xác nhận quyền sở hữu FE05/FE07/FE08 vẫn đang mở.
- H3, merge và CI `main` chính xác sau merge sau đó đã đóng các cổng đó; bằng chứng hoàn tất có thẩm quyền là `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

## 7. Lệnh / bằng chứng bắt buộc trước khi merge

- Xác minh `q`, mã vạch, vị trí, trạng thái và bộ lọc sách được kết hợp trước phân trang và số đếm nhóm.
- Xác minh projection danh sách an toàn bao gồm mã định danh/trạng thái/phiên bản/vị trí bản sao và chỉ siêu dữ liệu sách cha đã được phê duyệt.
- Xác minh quyền Thủ thư/Quản trị viên, từ chối Thành viên/Khách, xung đột mượn FE07 và xung đột đặt trước FE08 vẫn được thực thi.
- Xác minh lỗi API hiển thị trạng thái lỗi và không bị gắn nhãn sai là tồn kho rỗng hợp lệ.

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run trace:enforce
```
