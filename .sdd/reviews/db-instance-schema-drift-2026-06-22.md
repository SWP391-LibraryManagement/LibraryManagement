# DB Instance Schema Drift — Borrow flow 500

Date: 2026-06-22
Reporter: Nhat (with AI assistance)
Status: FIXED on local DB — team cần đồng bộ khi tái tạo

## Triệu chứng
Member hợp lệ tạo yêu cầu mượn (FE07) → backend trả **HTTP 500** (`INTERNAL_ERROR`).

## Nguyên nhân gốc
Database `LibraryManagementDB` đang chạy được tạo từ **phiên bản cũ** của `database/Librarymanagement.sql`, lệch với file nguồn hiện tại:

1. `BorrowDetails.DueDate` và `BorrowDate` bị **NOT NULL** trên DB, trong khi file nguồn để `NULL`. Theo spec FE07 (FR-FE07-005) hạn trả chỉ set khi librarian **duyệt**, nên lúc tạo request code insert `DueDate = NULL` → vi phạm ràng buộc → INSERT fail.
2. `CK_BorrowDetails_Status` cũ **thiếu giá trị `'REQUESTED'`** (code dùng khi tạo request) → INSERT conflict với CHECK constraint.

`database/Librarymanagement.sql` (file nguồn) **vốn đã đúng** (DueDate NULL, có 'REQUESTED'). Vấn đề chỉ ở DB instance chưa được tái tạo.

> Lưu ý: test backend dùng repository in-memory nên KHÔNG enforce ràng buộc NOT NULL / CHECK → 52/52 test pass nhưng vẫn lọt bug này. Đây là bài học: cần ít nhất một lớp kiểm thử chạy trên SQL Server thật.

## Đã xử lý (trên DB local)
```sql
ALTER TABLE BorrowDetails ALTER COLUMN DueDate DATE NULL;
ALTER TABLE BorrowDetails ALTER COLUMN BorrowDate DATE NULL;
ALTER TABLE BorrowDetails DROP CONSTRAINT CK_BorrowDetails_Status;
ALTER TABLE BorrowDetails ADD CONSTRAINT CK_BorrowDetails_Status
  CHECK (Status IN ('REQUESTED','BORROWED','RETURNED','OVERDUE','LOST','DAMAGED'));
-- (đồng bộ luôn CK_BorrowRequests_Status với file nguồn)
```
Sau khi sửa: luồng tạo yêu cầu mượn trả về `borrowRequest` (status PENDING) thành công.

## Khuyến nghị cho team
- Khi tái tạo DB, **drop + chạy lại** `database/Librarymanagement.sql` mới nhất thay vì giữ DB cũ.
- Cân nhắc thêm migration script hoặc một integration test chạy trên SQL Server thật trong CI để bắt loại drift này.

## Helper demo
`backend/scripts/demoMember.js` (block/clear/status) để chuyển trạng thái demo.member giữa "bị chặn mượn" (còn phạt + sách quá hạn) và "mượn được", phục vụ demo FE07.
