# CONTEXT.md - FE01 Công Khai / Duyệt Sách

# Phiên bản: 0.1.2

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE 2026-07-17; RANH GIỚI VAI TRÒ/ISBN HOMEPAGE ĐÃ ĐƯỢC CĂN CHỈNH 2026-07-27

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-07-27

# Thư mục chức năng: `.sdd/specs/feat-public-browse/`

---

## 1. Mục Đích Chức Năng

Chức năng Công khai / Duyệt sách giúp Khách khám phá sách của thư viện trước khi đăng nhập hoặc trở thành Thành viên.

Chức năng này phải làm rõ bốn điều:

- Người dùng công khai có thể xem thông tin danh mục an toàn.
- Khách/Thành viên tìm kiếm danh mục chính thức theo tên sách hoặc tác giả; ISBN vẫn là metadata dành cho nhân viên quản lý.
- Các trang công khai không làm lộ dữ liệu được bảo vệ về người dùng, mượn sách, đặt chỗ hoặc khoản phạt.
- Hoạt động duyệt sách công khai chỉ có quyền đọc và không sửa hồ sơ sách hoặc kho.

FE01 là chức năng có Đặc tả Tiêu chuẩn vì hướng tới người dùng và phụ thuộc vào tính chính xác của danh mục, nhưng không sở hữu hoạt động quản lý danh mục cốt lõi.

---

## 2. Quy Trình Thực Tế

Quy trình duyệt sách công khai điển hình:

1. Khách mở website thư viện.
2. Hệ thống hiển thị trang chủ với các điều hướng công khai hiện có.
3. Khách tìm kiếm hoặc duyệt sách.
4. Hệ thống trả về thông tin sách công khai phù hợp mà không có ISBN.
5. Khách mở một kết quả sách.
6. Hệ thống hiển thị chi tiết sách an toàn mà không làm lộ nhãn tình trạng có sẵn cho Khách/Thành viên.
7. Hệ thống có thể dùng nội bộ tình trạng có sẵn mới nhất để chọn đúng quy trình Thành viên sở hữu; Thủ thư/Quản trị viên có thể xem trạng thái cấp cao đã được phê duyệt.
8. Nếu Khách muốn thực hiện hành động chỉ dành cho Thành viên, hệ thống chuyển họ tới luồng xác thực hoặc đăng ký tư cách thành viên.

---

## 3. Ranh Giới Chức Năng

FE01 bao gồm:

- Xem trang chủ.
- Tìm kiếm danh mục sách công khai.
- Tìm kiếm theo tên sách hoặc tác giả; tìm kiếm ISBN thuộc phạm vi quản lý FE05 của Thủ thư/Quản trị viên.
- Xem thông tin và chi tiết sách công khai không có ISBN.
- Hiển thị chỉ đọc thể loại, tác giả, nhà xuất bản và ảnh bìa.
- Cách hiển thị HomePage nhận biết vai trò: Khách/Thành viên không thấy nhãn tình trạng có sẵn; Thủ thư/Quản trị viên có thể xem trạng thái cấp cao.
- Điều hướng responsive, các phần công khai được kết nối, thông tin liên hệ ở footer và thông tin chính sách dễ đọc.

FE01 không bao gồm:

- Tạo, cập nhật hoặc ngừng kích hoạt sách. Phạm vi này thuộc FE05 Quản lý sách.
- Quản lý bản sao vật lý, barcode, vị trí hoặc trạng thái chi tiết của bản sao. Phạm vi này thuộc FE06 Quản lý kho / Bản sao sách.
- Mượn sách. Phạm vi này thuộc FE07 Quản lý mượn sách.
- Đặt chỗ sách. Phạm vi này thuộc FE08 Quản lý đặt chỗ.
- Xác thực, đăng ký hoặc phê duyệt tư cách thành viên. Các phạm vi này thuộc FE02 và FE04.
- Các màn hình quản lý danh mục dành cho Quản trị viên/Thủ thư.

---

## 4. Ghi Chú Về Mô Hình Dữ Liệu Hiện Tại

Script SQL hiện tại đã bao gồm:

- `Books(BookId, Title, ISBN, CategoryId, AuthorId, PublisherId, PublishYear, Description, CoverUrl)`
- `Categories(CategoryId, CategoryName)`
- `Authors(AuthorId, AuthorName)`
- `Publishers(PublisherId, PublisherName)`
- `BookCopies(CopyId, BookId, Barcode, Status, Location)`

Các vấn đề tiềm ẩn cần review:

- Script SQL chưa định nghĩa trường trạng thái hoạt động/không hoạt động của sách, trong khi tìm kiếm công khai thông thường phải ẩn sách không hoạt động.
- Tình trạng có sẵn được tính từ `BookCopies.Status = AVAILABLE`; dữ liệu này vẫn nằm trong phản hồi chuẩn để định tuyến quy trình và hiển thị cho nhân viên đã được phê duyệt.
- Phản hồi công khai không được làm lộ ISBN hoặc các trường kho nội bộ như chính sách barcode chính xác.
- `q` công khai chỉ khớp tên sách hoặc tác giả; tìm kiếm quản lý dành cho nhân viên FE05 còn có thể khớp ISBN, thể loại và nhà xuất bản.
- Phân trang mặc định là `page=1`, `limit=20`, với `page>=1`, `limit=1..100`; giá trị không hợp lệ bị từ chối. Tìm kiếm trống trả về trang đầu tiên mặc định được sắp xếp theo `Title ASC, BookId ASC`.

Đây không phải các yếu tố chặn việc soạn thảo, nhưng phải được giải quyết trước khi triển khai.

---

## 5. Use Case Chính Từ Bảng Phân Công

| ID Use Case | Tên Use Case | Chủ sở hữu |
| ----------- | ------------- | ----- |
| UC01 | Xem trang chủ | Dung |
| UC02 | Tìm kiếm sách | Dung |
| UC03 | Xem thông tin sách | Dung |
| UC04 | Xem chi tiết sách | Dung |

---

## 6. Kiểm Thử Chức Năng Từ Bảng Phân Công

| ID kiểm thử | Tên kiểm thử | Chủ sở hữu |
| ------- | --------- | ----- |
| FT01 | Hiển thị trang chủ | Dung |
| FT02 | Tìm kiếm sách | Dung |
| FT03 | Xem thông tin sách | Dung |
| FT04 | Xem chi tiết sách | Dung |

---

## 7. Rủi Ro Chính

- FE01 có thể trùng lặp phạm vi quản lý sách của FE05 nếu vô tình bổ sung hành động ghi.
- Tìm kiếm công khai có thể làm lộ sách không hoạt động hoặc chỉ dùng nội bộ nếu quy tắc lọc không rõ ràng.
- Việc định tuyến quy trình Thành viên hoặc hiển thị cho nhân viên có thể lỗi thời nếu tình trạng có sẵn không được tính nhất quán với FE06.
- Endpoint công khai có thể làm lộ dữ liệu được bảo vệ nếu DTO phản hồi không được kiểm soát.
- Tìm kiếm trống, không hợp lệ hoặc quá rộng có thể làm giảm hiệu năng nếu không phân trang.

---

## 8. Phụ Thuộc

| Phụ thuộc | Lý do quan trọng |
| ---------- | -------------- |
| FE05 Quản lý sách | Sở hữu metadata sách chính thức và trạng thái danh mục hoạt động/ngừng kích hoạt. |
| FE06 Quản lý kho / Bản sao sách | Cung cấp trạng thái có sẵn được suy ra để định tuyến nội bộ và hiển thị HomePage đã được phê duyệt cho Thủ thư/Quản trị viên; số lượng chính xác vẫn là dữ liệu riêng tư. |
| FE02 Xác thực | Cung cấp định tuyến đăng nhập/đăng ký cho các hành động chỉ dành cho Thành viên. |
| FE04 Quản lý tư cách thành viên | Sở hữu luồng đăng ký tư cách thành viên sau khi khám phá công khai. |
| FE07 Quản lý mượn sách | Sở hữu các đích mượn/lịch sử của Thành viên và yêu cầu/trả sách của Thủ thư/Quản trị viên được mở từ Homepage. |
| FE08 Quản lý đặt chỗ | Sở hữu việc đặt chỗ của Thành viên và quản lý đặt chỗ của nhân viên; FE01 chỉ định tuyến tới màn hình hiện có. |
| FE11 Quản lý người dùng và vai trò | Cung cấp thứ tự ưu tiên vai trò và các đích quản lý người dùng dành cho Quản trị viên. |
| FE12 Báo cáo và thống kê | Sở hữu các đích báo cáo của Thủ thư/Quản trị viên được hiển thị bởi hành động Homepage nhận biết vai trò. |
| Cơ sở dữ liệu SQL Server | Lưu sách, thể loại, tác giả, nhà xuất bản và bản sao. |

---

## 9. Câu Hỏi Đã Giải Quyết Cho Nhóm / Giảng Viên

| ID | Quyết định được phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Ẩn sách không hoạt động/đã ngừng kích hoạt khỏi mọi chế độ xem tìm kiếm/chi tiết công khai. | Gói review 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE01-002 | Huy hiệu tình trạng có sẵn chỉ dành cho nhân viên. Khách sử dụng bước tiếp tục đăng nhập chung; Thành viên thấy hành động mượn FE07 hoặc đặt chỗ FE08 rõ ràng được chọn từ tình trạng có sẵn hiện tại; Thủ thư/Quản trị viên thấy trạng thái cấp cao và hành động quản lý. Không làm lộ số lượng bản sao chính xác. | Sửa đổi của chủ sản phẩm 2026-07-27, thay thế quyết định nhãn hành động 2026-07-25 | ĐÃ PHÊ DUYỆT |
| Q-FE01-003 | Trong Giai đoạn 1, q công khai khớp tên sách hoặc tác giả; bộ lọc ID và phân trang đã phê duyệt vẫn bắt buộc. | Gói review 2026-06-10; làm rõ của chủ sản phẩm 2026-07-27 | ĐÃ PHÊ DUYỆT |
| Q-FE01-004 | ISBN bị loại khỏi tìm kiếm HomePage, danh sách công khai và chi tiết công khai cho Khách/Thành viên; ISBN chỉ hiển thị/có thể tìm kiếm trong phần quản lý FE05 đã xác thực dành cho Thủ thư/Quản trị viên. | Sửa đổi của chủ sản phẩm 2026-07-27 (thay thế gói review 2026-06-10) | ĐÃ PHÊ DUYỆT |
| Q-FE01-005 | Trang chủ hiển thị điều hướng/tìm kiếm và sách gần đây; sách nổi bật là tùy chọn/ngoài phạm vi trừ khi được cấu hình thủ công. | Gói review 2026-06-10 | ĐÃ PHÊ DUYỆT |
| Q-FE01-008 | Metadata danh mục tùy chọn bị thiếu trả về `null` mà không loại bỏ sách hiển thị công khai. | Chuẩn hóa đặc tả 2026-07-17 | ĐÃ PHÊ DUYỆT |

---

## 10. Ghi Chú Cho Việc Triển Khai Sau Này

- Baseline FE01, phụ lục responsive và các nhiệm vụ hoàn thiện Homepage cục bộ đã được triển khai kèm bằng chứng tự động; việc con người chấp nhận giao diện/điều hướng trên main hiện tại vẫn là review cấp phát hành.
- Hành vi prototype không phải bằng chứng hoàn thành; sử dụng kiểm thử tập trung, gate truy vết và review của con người đã ghi nhận để chấp nhận cuối cùng.
- Giữ các endpoint duyệt sách công khai ở chế độ chỉ đọc.
- Chỉ trả về các trường sách an toàn cho công khai.
- Hành vi tìm kiếm và chi tiết phải nhất quán với FE05 và FE06.
