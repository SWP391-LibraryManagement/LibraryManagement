# Xác thực đối soát Sách FE05 - 2026-07-19

## Quyết định

- Phương pháp: SDD+ADD kết hợp, độ sâu Đầy đủ cho Lõi FE05 và ADD giới hạn cho Khung frontend.
- Phạm vi: FE05-T001 đến FE05-T008 trong `feat/fe05-book-reconciliation`.
- Trạng thái tích hợp: sẵn sàng để con người đánh giá; chưa thực hiện commit, đẩy, PR hoặc hợp nhất.

## Bằng chứng

| Cổng | Lệnh / kiểm tra | Kết quả |
| --- | --- | --- |
| Backend trọng tâm | `npm.cmd --prefix backend test -- --runTestsByPath tests/bookRoutes.test.js tests/bookAvailabilityRepository.test.js --silent` | 45/45 đạt |
| Hợp đồng SQL trọng tâm | `npm.cmd --prefix backend run test:sql:fe05 -- --silent` | 7/7 đạt trên SQL Server dùng một lần |
| Frontend FE05 | `node --test frontend/test/bookManagementFrontend.test.js` | 6/6 đạt |
| Toàn bộ backend | `npm.cmd --prefix backend test -- --silent` | 649/649 đạt |
| Toàn bộ frontend | `npm.cmd --prefix frontend test` | 120/120 đạt |
| Độ bao phủ | `npm.cmd --prefix backend run test:coverage:ci -- --silent` | câu lệnh 92.51%, nhánh 82.46%, hàm 97.10%, dòng 92.44% |
| Lint frontend | `npm.cmd --prefix frontend run lint` | đạt |
| Bản dựng frontend | `npm.cmd --prefix frontend run build` | đạt; chỉ có cảnh báo kích thước khối của Vite |
| Truy vết | `npm.cmd run trace:enforce` | FE05 26/26 (100%); thực thi đạt |
| Phân tích OpenAPI | Nạp PyYAML cùng các xác nhận tuyến FE05 | đạt |
| Kiểm tra nhanh nhập mô-đun | yêu cầu nạp ứng dụng/tuyến/dịch vụ backend | đạt |
| Vệ sinh diff | `git diff --check` | đạt |

## Kiểm tra đặc tả và an toàn

- Đọc công khai ẩn sách không hoạt động; đọc của nhân viên dùng `/api/admin/books` và phân trang do máy chủ sở hữu.
- Tạo mới bắt đầu ở `ACTIVE`; cập nhật siêu dữ liệu không gồm trạng thái và các trường vòng đời bản sao.
- Cập nhật/vô hiệu hóa/kích hoạt lại yêu cầu `If-Match`; trạng thái cũ ánh xạ tới `409 STALE_BOOK_STATE` và hướng dẫn tải lại.
- Vô hiệu hóa/kích hoạt lại yêu cầu lý do đã cắt khoảng trắng và chỉ ghi `Books.Status`; FE05 không thay đổi `BookCopies.Status`.
- Tính khả dụng được suy ra là `AVAILABLE`/`UNAVAILABLE`; UI không gắn nhãn các trạng thái không khả dụng không liên quan là đã mượn.
- Truy cập SQL vẫn được tham số hóa và không có bí mật nào được thêm.

## Các cổng còn mở

- Chấp thuận trình duyệt L4 và xác nhận quyền sở hữu FE06 vẫn đang chờ.
- Đánh giá tích hợp B7 của con người vẫn là bắt buộc trước khi commit, công bố hoặc hợp nhất.

## Xác thực lại sau đồng bộ Origin

- Tua nhanh worktree tính năng đang có thay đổi từ `62ac2d1` lên `origin/main@b2ad9b1` mà không chồng lấn, commit, cất tạm hoặc mất thay đổi cục bộ.
- Xác minh trọng tâm mới sau đồng bộ và khắc phục rowversion: `bookRoutes.test.js` cùng `bookAvailabilityRepository.test.js` đạt 45/45.

## Phụ lục SQL trực tiếp

- Phần hội tụ còn thiếu của `bookConcurrency.sqltest.js` được khôi phục qua ĐỎ-XANH: lệnh SQL FE05 ban đầu thất bại với `No tests found`, sau đó đạt 4/4 kiểm tra tĩnh.
- SQL có thể thay đổi ban đầu chứng minh rằng mọi thao tác thay đổi hợp lệ đều bị phân loại sai là cũ vì `CONVERT(VARCHAR, RowVersion, 2)` đi qua trình điều khiển `mssql` dưới dạng chuỗi nhị phân 8 byte trong khi phiên bản API là mã hex 16 ký tự.
- `bookRepository` hiện đọc vùng đệm rowversion thô và chuẩn hóa cả hai toán hạng qua một bộ mã hóa hex.
- Sau đó FE05 đạt 7/7 ca SQL; sau khi thêm bộ FE03, cổng SQL tổng hợp đạt 8/8 bộ, 61/61 kiểm thử kèm dọn dẹp `DB_CLEAN`/`LOGIN_CLEAN`.
