# CONTEXT.md - Quản lý sách FE05

# Phiên bản: 0.2.2

# Trạng thái: ĐÃ PHÊ DUYỆT - MỐC CƠ SỞ 2026-07-17

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-07-27

# Thư mục tính năng: `.sdd/specs/feat-book-management/`

---

## 1. Mục đích tính năng

Quản lý sách duy trì danh mục sách của thư viện, bảo đảm thông tin sách chính xác, có thể tìm kiếm và sẵn sàng cho nghiệp vụ mượn.

Tính năng này phải duy trì tính nhất quán của ba nội dung:

- Metadata sách và thông tin catalog.
- Khả dụng của sách cho Thành viên và Khách.
- Quan hệ giữa sách, tác giả, thể loại, nhà xuất bản và bản sao vật lý.

FE05 là tính năng Đặc tả tiêu chuẩn trong Danh sách tính năng chính. Tính năng vẫn cần quy tắc nghiệp vụ rõ ràng vì dữ liệu catalog được dùng bởi các tính năng kho, mượn, đặt chỗ và báo cáo.

---

## 2. Quy trình thực tế

Quy trình thư viện điển hình:

1. Thủ thư thêm sách mới vào catalog thư viện.
2. Hệ thống xác thực thông tin bắt buộc và ràng buộc duy nhất (ví dụ ISBN).
3. Sách xuất hiện trong tìm kiếm công khai theo tiêu đề/tác giả và tìm kiếm quản lý dành cho nhân viên.
4. Khách và Thành viên tìm kiếm/xem metadata công khai không có ISBN; Thủ thư/Quản trị viên có thể tìm kiếm/xem ISBN trong quản lý FE05.
5. Thủ thư có thể cập nhật thông tin sách khi cần.
6. Thủ thư có thể hủy kích hoạt sách không còn khả dụng hoặc không nên xuất hiện trong lưu thông.
7. Quản lý kho duy trì các bản sao vật lý liên kết với từng sách.
8. Quản lý mượn và đặt chỗ sử dụng thông tin sách để hỗ trợ các nghiệp vụ mượn và đặt chỗ.

---

## 3. Ranh giới tính năng

FE05 bao gồm:

- Khách/Thành viên tìm kiếm theo tiêu đề/tác giả và xem chi tiết công khai không có ISBN.
- Thủ thư/Quản trị viên tìm kiếm, xem chi tiết và danh sách quản lý bao gồm ISBN.
- Thêm sách mới.
- Cập nhật thông tin sách.
- Hủy kích hoạt sách.
- Quản lý metadata catalog sách.

FE05 không bao gồm:

- Quản lý bản sao vật lý. Nội dung đó thuộc FE06.
- Quy trình mượn. Nội dung đó thuộc FE07.
- Quản lý hàng đợi đặt chỗ. Nội dung đó thuộc FE08.
- Quản lý tiền phạt. Nội dung đó thuộc FE09.
- Quản lý người dùng và vai trò. Nội dung đó thuộc FE11.

---

## 4. Ghi chú về mô hình dữ liệu hiện tại

Thiết kế SQL hiện tại bao gồm:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl, Status)`
- `Authors(AuthorId, AuthorName)`
- `Categories(CategoryId, CategoryName)`
- `Publishers(PublisherId, PublisherName)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Các điểm đối soát triển khai:

- Phải thực thi ràng buộc duy nhất ISBN.
- ISBN bị loại khỏi projection Khách/Thành viên FE01 và việc khớp q công khai; ISBN vẫn hiển thị/tìm kiếm được sau khi FE11 cấp quyền vai trò Thủ thư/Quản trị viên duy nhất cho tài khoản.
- SQL hiện tại hỗ trợ một tác giả cho mỗi sách; nhiều tác giả sẽ yêu cầu thay đổi schema về sau.
- Phải sử dụng hủy kích hoạt dựa trên trạng thái thay vì xóa vật lý.
- SQL hiện tại có `Books.Status = ACTIVE|INACTIVE`; thao tác hủy kích hoạt/kích hoạt lại FE05 chỉ thay đổi trường này và không ảnh hưởng trạng thái bản sao FE06.
- Khả dụng FE05 là chỉ đọc và được suy ra từ `Books.Status` cùng `BookCopies.Status` do FE06 sở hữu; FE05 không có endpoint mutation trạng thái bản sao.
- Mutation sách hiện có yêu cầu SQL `rowversion`/`If-Match` để từ chối cập nhật cũ một cách xác định.
- Môi trường đã triển khai phải áp dụng metadata compatibility migration đã rà soát trước khi backend sẵn sàng cho catalog; liveness đơn thuần không phải bằng chứng rằng thao tác đọc tác giả/nhà xuất bản/thể loại được bảo vệ có thể thực thi.
- Hiệu năng tìm kiếm có thể yêu cầu index trên ISBN, Title và Author.

Các quyết định này được phản ánh trong `SPEC.md` v0.5.0 và phải được đối soát với prototype hiện có trước khi phần triển khai được coi là hoàn tất.

---

## 5. Các use case chính từ bảng phân công

| ID use case | Tên use case | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC17 | Xem chi tiết sách (Khách) | Dung |
| UC18 | Tìm kiếm sách (Khách) | Dung |
| UC19 | Tìm kiếm sách (Thành viên) | Dung |
| UC20 | Xem chi tiết sách (Thành viên) | Dung |
| UC21 | Xem danh sách sách | Dung |
| UC22 | Thêm sách | Dung |
| UC23 | Cập nhật thông tin sách | Dung |
| UC24 | Hủy kích hoạt sách | Dung |

---

## 6. Các kiểm thử tính năng từ bảng phân công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT18 | Tìm kiếm sách (Khách) | Dung |
| FT19 | Xem chi tiết sách (Khách) | Dung |
| FT20 | Tìm kiếm sách (Thành viên) | Dung |
| FT21 | Xem chi tiết sách (Thành viên) | Dung |
| FT22 | Xem danh sách sách | Dung |
| FT23 | Thêm sách | Dung |
| FT24 | Cập nhật thông tin sách | Dung |
| FT25 | Hủy kích hoạt sách | Dung |

---

## 7. Rủi ro chính

- Bản ghi ISBN trùng lặp có thể tạo ra sự không nhất quán của catalog.
- Metadata sách sai có thể ảnh hưởng tìm kiếm và báo cáo.
- Hủy kích hoạt sách ẩn bản ghi catalog khỏi duyệt công khai trong khi giữ nguyên bản sao, mượn, đặt chỗ và lịch sử.
- Hiệu năng tìm kiếm có thể giảm khi số lượng sách lớn.
- Cập nhật đồng thời có thể ghi đè thông tin sách nếu không xem xét kiểm soát phiên bản.

---

## 8. Phụ thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| Xác thực FE02 | Xác định người dùng và quyền hiện tại. |
| Quản lý kho/Bản sao sách FE06 | Sở hữu các bản sao sách vật lý. |
| Quản lý mượn FE07 | Sử dụng thông tin sách khi mượn. |
| Quản lý đặt chỗ FE08 | Sử dụng thông tin sách khi đặt chỗ. |
| Quản lý người dùng và vai trò FE11 | Kiểm soát quyền của Thủ thư. |

---

## 9. Câu hỏi đã giải quyết cho nhóm/giảng viên

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE05-001 | ISBN là tùy chọn nhưng phải duy nhất khi được cung cấp. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-002 | Nhiều sách có thể cùng tiêu đề. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-003 | Sách bị hủy kích hoạt bị ẩn khỏi tìm kiếm công khai nhưng hiển thị trong màn hình quản lý nhân viên/quản trị viên. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-004 | Bắt buộc xóa mềm/hủy kích hoạt; không xóa vật lý trong Giai đoạn 1. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-005 | Mỗi sách thuộc một thể loại trong Giai đoạn 1; thể loại nhiều-nhiều là công việc tương lai. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-006 | Ảnh bìa được lưu dưới dạng văn bản URL/đường dẫn, không phải nội dung nhị phân trong cơ sở dữ liệu. | Gói rà soát 2026-06-10 | APPROVED |
| Q-FE05-007 | Hủy kích hoạt ẩn sách khỏi catalog công khai ngay cả khi bản sao đang được mượn hoặc đặt chỗ; lịch sử và bản ghi bản sao không thay đổi. | Điều chỉnh người dùng 2026-06-21 | APPROVED |
| Q-FE05-008 | Nhân viên sử dụng lệnh hủy kích hoạt/kích hoạt lại riêng cho `Books.Status`; cập nhật metadata không đổi trạng thái và duyệt công khai ẩn sách `INACTIVE`. | Nhat phê duyệt sau rà soát liên tính năng 2026-07-15 | APPROVED |
| Q-FE05-009 | Tìm kiếm công khai của Khách/Thành viên chỉ khớp tiêu đề/tác giả và DTO công khai loại ISBN; quản lý FE05 của Thủ thư/Quản trị viên đã xác thực vẫn giữ tìm kiếm/hiển thị ISBN. | Điều chỉnh product owner 2026-07-27 | APPROVED |

---

## 10. Ghi chú cho việc triển khai sau này

- Mốc cơ sở gồm `SPEC.md`, `PLAN.md` và `TASKS.md` đã phê duyệt; chỉ triển khai nhiệm vụ theo thứ tự hiện trong phạm vi.
- Hành vi prototype không phải bằng chứng hoàn tất; ghi nhận xác thực tập trung mới cho từng nhiệm vụ.
- Phải thực thi xác thực ISBN ở server.
- Bắt buộc hủy kích hoạt dựa trên trạng thái; xóa vật lý bị cấm trong Giai đoạn 1.
- API tìm kiếm nên hỗ trợ phân trang và lọc.
- Mọi endpoint API phải xác thực vai trò và dữ liệu đầu vào ở server.
