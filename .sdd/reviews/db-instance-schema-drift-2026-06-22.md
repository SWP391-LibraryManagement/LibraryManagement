# Sai lệch lược đồ phiên bản DB — Luồng mượn trả về 500

Ngày: 2026-06-22
Người báo cáo: Nhat (có sự hỗ trợ của AI)
Trạng thái: ĐÃ SỬA trên DB cục bộ — nhóm cần đồng bộ khi tái tạo

## Triệu chứng
Thành viên hợp lệ tạo yêu cầu mượn (FE07) → backend trả về **HTTP 500** (`INTERNAL_ERROR`).

## Nguyên nhân gốc
Cơ sở dữ liệu `LibraryManagementDB` đang chạy được tạo từ **phiên bản cũ** của `database/Librarymanagement.sql`, lệch với tệp nguồn hiện tại:

1. `BorrowDetails.DueDate` và `BorrowDate` bị **NOT NULL** trên DB, trong khi tệp nguồn để `NULL`. Theo đặc tả FE07 (FR-FE07-005), hạn trả chỉ được đặt khi Thủ thư **duyệt**, nên lúc tạo yêu cầu, mã chèn `DueDate = NULL` → vi phạm ràng buộc → INSERT thất bại.
2. `CK_BorrowDetails_Status` cũ **thiếu giá trị `'REQUESTED'`** (mã dùng khi tạo yêu cầu) → INSERT xung đột với ràng buộc CHECK.

`database/Librarymanagement.sql` (tệp nguồn) **vốn đã đúng** (DueDate NULL, có 'REQUESTED'). Vấn đề chỉ nằm ở phiên bản DB chưa được tái tạo.

> Lưu ý: kiểm thử backend dùng kho dữ liệu trong bộ nhớ nên KHÔNG thực thi ràng buộc NOT NULL / CHECK → 52/52 kiểm thử đạt nhưng vẫn bỏ lọt lỗi này. Đây là bài học: cần ít nhất một lớp kiểm thử chạy trên SQL Server thật.

## Đã xử lý (trên DB cục bộ)
```sql
ALTER TABLE BorrowDetails ALTER COLUMN DueDate DATE NULL;
ALTER TABLE BorrowDetails ALTER COLUMN BorrowDate DATE NULL;
ALTER TABLE BorrowDetails DROP CONSTRAINT CK_BorrowDetails_Status;
ALTER TABLE BorrowDetails ADD CONSTRAINT CK_BorrowDetails_Status
  CHECK (Status IN ('REQUESTED','BORROWED','RETURNED','OVERDUE','LOST','DAMAGED'));
-- (đồng bộ luôn CK_BorrowRequests_Status với file nguồn)
```
Sau khi sửa: luồng tạo yêu cầu mượn trả về `borrowRequest` (trạng thái PENDING) thành công.

## Khuyến nghị cho nhóm
- Khi tái tạo DB, **xóa + chạy lại** `database/Librarymanagement.sql` mới nhất thay vì giữ DB cũ.
- Cân nhắc thêm tập lệnh di chuyển dữ liệu hoặc một kiểm thử tích hợp chạy trên SQL Server thật trong CI để phát hiện loại sai lệch này.

## Công cụ hỗ trợ trình diễn
`backend/scripts/demoMember.js` (chặn/xóa/trạng thái) để chuyển trạng thái demo.member giữa "bị chặn mượn" (còn phạt + sách quá hạn) và "mượn được", phục vụ trình diễn FE07.
