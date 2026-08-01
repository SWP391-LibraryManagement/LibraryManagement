# SPEC.md - Quản lý sách FE05

# Phiên bản: 0.6.11

# Trạng thái: ĐÃ PHÊ DUYỆT - BASELINE 2026-07-17

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-08-01

# ID tính năng: FE05

# Thư mục tính năng: `.sdd/specs/feat-book-management/`

> Trạng thái phân phối hiện tại (2026-07-20): `COMPLETE` cho phạm vi Giai đoạn 1 đã được phê duyệt.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> là nguồn có thẩm quyền về trạng thái triển khai hiện tại. Các nhãn cũ hơn như `Not Started`,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ review được giữ lại bên dưới chỉ là
> ảnh chụp nhanh lịch sử về kế hoạch/bằng chứng, không phải trạng thái phân phối hiện tại.

> Nguồn sự thật cho Quản lý sách FE05. Bản sửa đổi v0.5.0 đã được phê duyệt thủ công vào 2026-07-16 và sẵn sàng để lập kế hoạch triển khai.

---

## 1. Tổng quan về tính năng

### 1.1 Tên tính năng

Quản lý sách

### 1.2 Bối cảnh kinh doanh

Quản lý Sách kiểm soát danh mục thư viện và cung cấp thông tin sách chính xác cho khách, thành viên, thủ thư và các tính năng khác của thư viện.

Tính năng này rất quan trọng vì thông tin sách không chính xác có thể ảnh hưởng đến tìm kiếm, theo dõi tồn kho, hoạt động mượn, đặt chỗ, báo cáo và hồ sơ audit.

### 1.3 Mục tiêu / Kết quả

Hệ thống sẽ:

- Cho phép khách và thành viên tìm kiếm sách.
- Cho phép khách và thành viên xem chi tiết sách.
- Cho phép Thủ thư/Quản trị viên xem danh sách sách.
- Cho phép Thủ thư/Quản trị viên thêm sách mới.
- Cho phép Thủ thư/Quản trị viên cập nhật thông tin sách.
- Suy ra tính khả dụng công khai từ trạng thái bản sao vật lý do FE06 sở hữu mà không cho phép FE05 thay đổi trạng thái bản sao.
- Cho phép Thủ thư/Quản trị viên vô hiệu hóa sách.
- Duy trì siêu dữ liệu sách chính xác cho các tính năng kiểm kê, mượn và báo cáo.
- Bảo đảm các thao tác quản lý sách có thể truy vết cho mục đích audit.

### 1.4 Mức độ phạm vi

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải đúng ngay từ đầu
- [x] Đặc tả tiêu chuẩn - tính năng thông thường, có quy tắc nghiệp vụ và bước xác thực dữ liệu
- [ ] Đặc tả rút gọn - UI đơn giản, tài liệu hoặc tính năng ít rủi ro

---

## 2. Tác nhân và quyền

| Tác nhân | Mô tả | Quyền/Trách nhiệm |
|---------|-------------|-----------------------------|
| Khách | Khách truy cập không được xác thực | Tìm kiếm sách và xem chi tiết sách. |
| Thành viên | Người dùng thư viện đã đăng ký | Tìm kiếm sách và xem chi tiết sách. |
| Thủ thư | Nhân viên thư viện | Xem các lựa chọn siêu dữ liệu đang hoạt động và danh sách quản lý sách; thêm/cập nhật sách; tải bìa được quản lý; vô hiệu hóa/kích hoạt lại sách. |
| Quản trị viên | Quản trị viên hệ thống | Có các quyền FE05 của Thủ thư, dùng được không gian làm việc FE05 chuẩn trong Bảng điều khiển quản trị FE11 và quản lý được bản ghi tham chiếu danh mục/tác giả/nhà xuất bản qua ranh giới tích hợp chỉ dành cho Quản trị viên. |

---

## 3. Điều kiện tiên quyết

Tính năng này chỉ có thể bắt đầu khi:

- PRE-FE05-001: Bản ghi sách tồn tại trước khi có thể xem hoặc cập nhật.
- PRE-FE05-002: Hành động được bảo vệ được thực hiện bởi tác nhân đã được xác thực với vai trò chính xác.
- PRE-FE05-003: Thông tin sách bắt buộc được cung cấp trước khi tạo sách.
- PRE-FE05-004: Quy tắc duy nhất ISBN được nhóm định cấu hình và phê duyệt.
- PRE-FE05-005: Danh mục, tác giả và nhà xuất bản tồn tại trước khi được gán cho sách.

---

## 4. Luồng chính

### MF-FE05-001: Tìm kiếm sách

1. Khách hoặc Thành viên nhập tiêu chí tìm kiếm.
2. Hệ thống kiểm tra hợp lệ các tham số tìm kiếm.
3. Hệ thống tìm kiếm sách đang hoạt động.
4. Hệ thống trả về kết quả trùng khớp.
5. Hệ thống hỗ trợ phân trang khi có thể.

### MF-FE05-002: Xem chi tiết sách

1. Khách hoặc thành viên chọn một cuốn sách.
2. Hệ thống lấy thông tin sách.
3. Hệ thống hiển thị thông tin chi tiết về sách.
4. Hệ thống hiển thị thông tin về tác giả, danh mục, nhà xuất bản và tính khả dụng.

### MF-FE05-003: Xem danh sách sách

1. Thủ thư mở quản lý sách.
2. Hệ thống truy xuất bản ghi sách.
3. Hệ thống hiển thị danh mục sách được phân trang.
4. Hệ thống áp dụng các bộ lọc truy vấn đã được phê duyệt và các trường `sort`/`order` được xác định trong Phần 11.

### MF-FE05-004: Thêm sách

1. Thủ thư nhập thông tin sách.
2. Hệ thống xác nhận các trường bắt buộc.
3. Hệ thống xác nhận tính duy nhất của ISBN.
4. Hệ thống tạo một bản ghi sách mới.
5. Hệ thống ghi một mục audit.

### MF-FE05-005: Cập nhật thông tin sách

1. Thủ thư chọn một cuốn sách hiện có.
2. Thủ thư sửa đổi thông tin.
3. Hệ thống xác nhận dữ liệu cập nhật.
4. Hệ thống lưu các thay đổi.
5. Hệ thống ghi một mục audit.

### MF-FE05-006: Vô hiệu hóa sách

1. Thủ thư chọn một cuốn sách đang hoạt động.
2. Thủ thư cung cấp lý do và xác nhận việc vô hiệu hóa bằng phiên bản sách được xem lần cuối.
3. Hệ thống kiểm tra lại phiên bản và thay đổi trạng thái sách thành `INACTIVE`.
4. Hệ thống ngăn hiển thị công khai và ngăn mượn trong tương lai mà không ghi đè lịch sử bản sao/quy trình.
5. Thao tác cập nhật sách và log audit commit nguyên tử.

### MF-FE05-007: Xem tính khả dụng công khai có nguồn gốc

1. Khách/Thành viên mở trang duyệt công khai hoặc Thủ thư/Quản trị viên mở trang quản lý sách.
2. Hệ thống tải giá trị `Books.Status` hiện tại và `BookCopies.Status` do FE06 sở hữu.
3. Hệ thống chỉ lấy được `AVAILABLE` (`Còn sách`) khi `Books.Status = ACTIVE` và ít nhất một bản sao liên quan là `AVAILABLE`.
4. Nếu không, hệ thống suy ra `UNAVAILABLE` (`Không khả dụng`) mà không tiết lộ bản sao đang được mượn, đặt chỗ, hư hỏng, thất lạc hay không hoạt động.
5. FE05 trả về bản tóm tắt dẫn xuất và không sửa đổi bất kỳ bản ghi `BookCopies` nào.

### MF-FE05-008: Kích hoạt lại sách

1. Thủ thư/Quản trị viên mở một cuốn sách `INACTIVE` trong giao diện quản lý.
2. Tác nhân cung cấp lý do và xác nhận kích hoạt lại bằng phiên bản sách đã xem gần nhất.
3. Hệ thống kiểm tra lại phiên bản và chỉ thay đổi `Books.Status` thành `ACTIVE`.
4. Trạng thái bản sao hiện tại không thay đổi; tính khả dụng dẫn xuất được tính lại từ các bản sao hiện tại do FE06 sở hữu.
5. Thao tác cập nhật sách và log audit commit nguyên tử.

---

## 5. Luồng thay thế

### AF-FE05-001: ISBN trùng lặp

1. Thủ thư nộp một cuốn sách mới.
2. Hệ thống phát hiện ISBN hiện có.
3. Hệ thống từ chối việc tạo.
4. Hệ thống trả về lỗi xác thực.

### AF-FE05-002: Danh mục không hợp lệ

1. Thủ thư gửi thông tin sách.
2. Danh mục đã chọn không tồn tại.
3. Hệ thống từ chối yêu cầu.
4. Hệ thống trả về thông báo lỗi.

### AF-FE05-003: Không tìm thấy sách

1. Người dùng yêu cầu chi tiết sách.
2. ID sách không tồn tại.
3. Hệ thống trả về phản hồi không tìm thấy.

### AF-FE05-004: Truy cập trái phép

1. Khách hoặc Thành viên cố gắng thêm, cập nhật hoặc vô hiệu hóa sách.
2. Hệ thống xác nhận quyền.
3. Hệ thống từ chối truy cập.

---

## 6. Quy tắc kinh doanh

Sử dụng các ID ổn định này cho các nhiệm vụ và bài kiểm tra.

- BR-FE05-001: Khách chỉ có thể tìm kiếm sách và xem chi tiết sách.
- BR-FE05-002: Chỉ thủ thư và quản trị viên mới có thể thêm sách.
- BR-FE05-003: Chỉ thủ thư và quản trị viên mới có thể cập nhật sách.
- BR-FE05-004: Chỉ Thủ thư và Quản trị viên mới có thể vô hiệu hóa sách.
- BR-FE05-005: ISBN phải là duy nhất trên tất cả các sách.
- BR-FE05-006: Cần có tên sách.
- BR-FE05-007: Một cuốn sách thuộc đúng một danh mục trong Giai đoạn 1.
- BR-FE05-008: Không thể mượn sách đã ngừng hoạt động.
- BR-FE05-009: Sách bị vô hiệu hóa không được xuất hiện trong kết quả search/detail công khai.
- BR-FE05-010: Mọi thao tác tạo, cập nhật, vô hiệu hóa và kích hoạt lại đều phải được audit.
- BR-FE05-011: Tính khả dụng công khai khác với khả năng hiển thị trong danh mục; `Books.Status` kiểm soát sách hoạt động/không hoạt động có được hiển thị trong danh mục hay không, còn `BookCopies.Status` do FE06 sở hữu cung cấp nguồn tính khả dụng chỉ đọc.
- BR-FE05-012: FE05 không được tạo hoặc tự chuyển đổi `BookCopies.Status`; thay đổi vòng đời bản sao thuộc FE06, FE07 hoặc FE08 theo quy trình của tính năng sở hữu.
- BR-FE05-013: Đối với một cuốn sách `ACTIVE`, tính khả dụng công khai là `AVAILABLE` chỉ khi có ít nhất một bản sao liên quan có `BookCopies.Status = AVAILABLE`; nếu không thì đó là `UNAVAILABLE`. Một cuốn sách `INACTIVE` không bao giờ được hiển thị công khai hoặc có thể mượn được bất kể trạng thái bản sao.
- BR-FE05-014: `Books.Status` có chính xác hai trạng thái, `ACTIVE` và `INACTIVE`; các chuyển tiếp hợp lệ được tạo -> `ACTIVE`, `ACTIVE -> INACTIVE`, và `INACTIVE -> ACTIVE`. Việc xóa vật lý bị cấm trong Giai đoạn 1.
- BR-FE05-015: Vô hiệu hóa/kích hoạt lại chỉ thay đổi `Books.Status`; FE05 không bao giờ ghi lại các hàng bản sao, khoản mượn, đặt chỗ hoặc lịch sử liên quan.
- BR-FE05-016: Mỗi lần cập nhật/vô hiệu hóa/kích hoạt lại sách hiện có đều yêu cầu `If-Match` chứa SQL `rowversion` mà người gọi đã thấy gần nhất; phiên bản cũ hoặc bị thiếu trả về `409 STALE_BOOK_STATE` mà không thay đổi dữ liệu.
- BR-FE05-017: Truy vấn sách sử dụng các điều khiển xác định: độ dài từ khóa 1..200 khi được cung cấp; `page` mặc định là 1; `limit` mặc định là 20 và phải là 1..100. `/api/books` công khai chỉ chấp nhận `q`, `categoryId`, `authorId`, `publisherId`, `page` và `limit`; `q` công khai chỉ khớp với tiêu đề/tác giả và kết quả không bao gồm ISBN. `/api/admin/books` dành cho nhân viên có thể khớp tiêu đề, ISBN, tác giả, danh mục hoặc nhà xuất bản và chấp nhận thêm các trường sắp xếp `title`, `publishYear` hoặc `createdAt` cùng thứ tự `asc` hoặc `desc`.
- BR-FE05-018: Vô hiệu hóa/kích hoạt lại yêu cầu lý do không trống, đã cắt khoảng trắng, dài tối đa 500 ký tự và được lưu trong siêu dữ liệu audit.
- BR-FE05-019: Thủ thư/Quản trị viên có thể chọn một tệp ảnh bìa được quản lý, tùy chọn, tên là `cover`. Backend chỉ chấp nhận JPG/JPEG, PNG hoặc WebP có đuôi tệp, loại MIME khai báo và chữ ký byte khớp nhau, kích thước tối đa 2 MB; backend tạo tên tệp và lưu đường dẫn công khai trong `/uploads/book-covers/`.
- BR-FE05-020: Nếu thao tác tạo/cập nhật thất bại sau khi lưu tệp bìa mới thì phải xóa tệp chưa commit đó. Khi thay thế thành công, hệ thống giữ đường dẫn mới đã commit và chỉ xóa tệp trước nếu đường dẫn đó do FE05 quản lý; không bao giờ xóa đường dẫn bên ngoài hoặc không được quản lý.
- BR-FE05-021: Biểu mẫu sách của Thủ thư/Quản trị viên chỉ được đọc các lựa chọn danh mục, tác giả và nhà xuất bản `ACTIVE` từ FE05. Chỉ Quản trị viên được thay đổi các bản ghi tham chiếu này qua tích hợp Thư viện quản trị FE11.
- BR-FE05-022: Backend đã triển khai chưa sẵn sàng phục vụ danh mục cho đến khi `Authors`, `Publishers` và `Categories` đều có `Status` chuẩn cùng cột `CreatedAt` do cơ sở dữ liệu tạo. Trước khi nhận lưu lượng HTTP, tiến trình khởi động backend phải áp dụng migration tương thích siêu dữ liệu chuẩn đã được review trong một giao dịch và xác minh hậu điều kiện; nếu không thể hoàn tất đối soát, tiến trình phải khởi động thất bại thay vì phục vụ danh mục chỉ tương thích một phần.


---

## 7. Yêu cầu chức năng

- FR-FE05-001: Hệ thống sẽ cho phép Khách tìm kiếm sách đang hoạt động theo tên sách hoặc tác giả mà không để lộ hoặc khớp ISBN.
- FR-FE05-002: Hệ thống sẽ cho phép Thành viên tìm kiếm sách đang hoạt động theo tên sách hoặc tác giả mà không để lộ hoặc khớp ISBN.
- FR-FE05-003: Hệ thống phải trả về chi tiết sách công khai không có ISBN cho Khách/Thành viên và chỉ được trả ISBN trong phép chiếu quản lý của Thủ thư/Quản trị viên đã được máy chủ phân quyền.
- FR-FE05-004: Hệ thống phải cho phép Thủ thư/Quản trị viên xem danh sách quản lý sách và tìm kiếm/xem ISBN.
- FR-FE05-005: Hệ thống sẽ xác thực tính duy nhất của ISBN trước khi tạo sách.
- FR-FE05-006: Hệ thống phải tạo sách mới khi được cung cấp dữ liệu hợp lệ.
- FR-FE05-007: Hệ thống cho phép cập nhật các sách hiện có.
- FR-FE05-008: Hệ thống phải vô hiệu hóa sách bằng cơ chế vô hiệu hóa dựa trên trạng thái.
- FR-FE05-009: Hệ thống sẽ hỗ trợ phân trang trong tìm kiếm sách.
- FR-FE05-010: Hệ thống sẽ hỗ trợ lọc theo danh mục, tác giả và trạng thái.

### Yêu cầu về hành vi không mong muốn (Lỗi / Điều kiện bất thường)

- FR-FE05-011: NẾU ISBN được cung cấp đã tồn tại trên một cuốn sách khác trong quá trình tạo hoặc cập nhật, hệ thống sẽ từ chối yêu cầu và trả về lỗi xác thực mà không sửa đổi bất kỳ bản ghi nào. (Nguồn: AF-FE05-001, EC-FE05-003, BR-FE05-005)
- FR-FE05-012: NẾU tên sách bị thiếu hoặc trống trong quá trình tạo hoặc cập nhật, hệ thống sẽ từ chối yêu cầu và trả về lỗi xác thực xác định trường tên sách. (Nguồn: EC-FE05-002, BR-FE05-006, NFR-FE05-UX-001)
- FR-FE05-013: NẾU danh mục, tác giả hoặc nhà xuất bản được tham chiếu không tồn tại trong quá trình tạo hoặc cập nhật, hệ thống sẽ từ chối yêu cầu và trả về thông báo lỗi. (Nguồn: AF-FE05-002, EC-FE05-005, EC-FE05-006, EC-FE05-007)
- FR-FE05-014: NẾU ID sách được yêu cầu không tồn tại khi xem, cập nhật hoặc hủy kích hoạt sách, hệ thống sẽ trả về phản hồi không tìm thấy và sẽ không tạo bản ghi mới. (Nguồn: AF-FE05-003, EC-FE05-001)
- FR-FE05-015: NẾU Khách hoặc Thành viên cố thêm, cập nhật hoặc vô hiệu hóa sách, hệ thống phải từ chối truy cập và trả về phản hồi cấm truy cập. (Nguồn: AF-FE05-004, EC-FE05-009, BR-FE05-002, BR-FE05-003, BR-FE05-004)
- FR-FE05-016: NẾU năm xuất bản được cung cấp không hợp lệ hoặc được đặt trong tương lai trong quá trình tạo hoặc cập nhật, hệ thống sẽ từ chối yêu cầu và trả về lỗi xác thực. (Nguồn: EC-FE05-008)
- FR-FE05-017: NẾU từ khóa tìm kiếm vượt quá độ dài tối đa cho phép, hệ thống sẽ từ chối tìm kiếm và trả về thông báo xác thực. (Nguồn: EC-FE05-011)
- FR-FE05-018: NẾU cập nhật sách hoặc ghi log audit bị lỗi giữa chừng, hệ thống phải rollback cả cập nhật sách lẫn log audit để không tồn tại thay đổi một phần. (Nguồn: EC-FE05-012, NFR-FE05-TXN-001)
- FR-FE05-019: KHI sách có trạng thái `INACTIVE`, hệ thống phải ngăn mượn sách đó, loại sách khỏi kết quả tìm kiếm công khai và vẫn giữ nguyên lịch sử mượn/đặt chỗ cùng các bản ghi bản sao. (Nguồn: BR-FE05-008, BR-FE05-009, EC-FE05-010, Q-FE05-007)
- FR-FE05-020: KHI dữ liệu sách được trả về cho nhân viên hoặc trình duyệt công khai, hệ thống sẽ lấy bản tóm tắt tính khả dụng từ trạng thái bản sao FE06 đã commit mới nhất theo BR-FE05-013 và không lưu giá trị khả dụng do FE05 sở hữu. (Nguồn: MF-FE05-007, BR-FE05-011, BR-FE05-012, BR-FE05-013)
- FR-FE05-021: NẾU người gọi cố thay đổi `BookCopies.Status` thông qua endpoint sách FE05, hệ thống sẽ từ chối yêu cầu và không sửa đổi `Books` hoặc `BookCopies`. (Nguồn: BR-FE05-012, EC-FE05-013)
- FR-FE05-022: KHI tác nhân được phân quyền kích hoạt lại sách `INACTIVE` với phiên bản khớp và lý do không trống, hệ thống phải đặt `Books.Status = ACTIVE`, giữ mọi bản ghi bản sao/quy trình liên quan, tính lại tính khả dụng dẫn xuất và ghi audit theo cách nguyên tử. (Nguồn: MF-FE05-008, BR-FE05-014, BR-FE05-015)
- FR-FE05-023: NẾU `If-Match` bị thiếu hoặc không khớp với `rowversion` của sách hiện tại khi cập nhật/vô hiệu hóa/kích hoạt lại, hệ thống sẽ trả về `409 STALE_BOOK_STATE` và không thay đổi bản ghi. (Nguồn: BR-FE05-016, EC-FE05-014)
- FR-FE05-024: NẾU truy vấn công khai chứa trường không được phê duyệt hoặc bất kỳ từ khóa, phân trang, sắp xếp nhân viên hoặc giá trị thứ tự nhân viên nào vi phạm BR-FE05-017, hệ thống sẽ trả về lỗi xác thực thay vì âm thầm áp dụng chính sách khác. (Nguồn: EC-FE05-011, EC-FE05-015)
- FR-FE05-025: NẾU lý do vô hiệu hóa/kích hoạt lại bị thiếu, trống sau khi cắt khoảng trắng hoặc dài hơn 500 ký tự, hệ thống phải từ chối lệnh và giữ nguyên mọi trạng thái. (Nguồn: BR-FE05-018, EC-FE05-016)
- FR-FE05-026: NẾU `pages` không phải là số nguyên từ 1 đến 10,000, hoặc `rating` nằm ngoài 0.0 đến 5.0 hoặc có nhiều hơn một chữ số thập phân khi tạo/cập nhật, hệ thống sẽ từ chối yêu cầu với xác thực cấp trường và không thay đổi bản ghi. (Nguồn: EC-FE05-017, Phần 10.2)
- FR-FE05-027: KHI Thủ thư/Quản trị viên tạo hoặc cập nhật sách bằng `multipart/form-data`, hệ thống sẽ đọc siêu dữ liệu sách JSON từ `metadata`, xác thực và lưu ảnh `cover` tùy chọn theo đường dẫn do máy chủ tạo, lưu đường dẫn đó dưới dạng `Books.CoverUrl` và trả về qua các lần đọc sách dành cho nhân viên/công khai.
- FR-FE05-028: NẾU bìa được cung cấp thiếu siêu dữ liệu nhiều phần bắt buộc, vượt quá 2 MB, có loại/chữ ký không được hỗ trợ hoặc không khớp, hoặc thao tác thay đổi sách liên quan thất bại, hệ thống phải từ chối hoặc bù trừ thao tác mà không thay đường dẫn bìa đã commit hay giữ lại tệp được quản lý chưa commit.
- FR-FE05-029: KHI một trong hai điểm vào thay đổi trạng thái của nhân viên chuyển một cuốn sách giữa `ACTIVE` và `INACTIVE`, frontend phải giữ nguyên ngữ cảnh tìm kiếm, thể loại, trạng thái và trang hiện đang áp dụng, đồng thời tải lại danh sách chuẩn đó từ máy chủ. Frontend không được thay đổi bộ lọc danh sách như một tác dụng phụ của việc sửa một `bookId`; vì vậy sách đã thay đổi có thể không còn trong danh sách hiển thị khi trạng thái mới không khớp với bộ lọc hiện tại.
- FR-FE05-030: KHI Thủ thư/Quản trị viên đã xác thực yêu cầu `/api/books/metadata`, hệ thống sẽ chỉ trả về các lựa chọn danh mục/tác giả/nhà xuất bản đang hoạt động; yêu cầu của Khách/Thành viên sẽ bị từ chối và không bản ghi tham chiếu nào bị thay đổi.
- FR-FE05-031: KHI bắt đầu khởi động backend, hệ thống sẽ áp dụng migration tương thích siêu dữ liệu đã được review trước khi lắng nghe và xác minh các cột siêu dữ liệu chuẩn; NẾU migration hoặc bước xác minh thất bại, backend sẽ không lắng nghe. KHI kiểm tra mức sẵn sàng qua `/health/ready`, hệ thống sẽ thực hiện xác minh chỉ đọc và trả về HTTP `503` với kết quả `not_ready` an toàn nếu sau này xảy ra sai lệch lược đồ hoặc lỗi cơ sở dữ liệu.
- FR-FE05-032: KHI Thủ thư/Quản trị viên xem danh sách quản lý, cột `Trạng thái catalog` phải hiển thị `Books.Status` chuẩn thay vì tình trạng sẵn có của bản sao được FE06 suy ra độc lập, để kết quả của lệnh kích hoạt/vô hiệu hóa hiển thị trên sách đã cập nhật.

---

## 8. Tiêu chí chấp nhận

- AC-FE05-001: Với các sách hiển thị công khai hiện có, khi Khách tìm kiếm theo tiêu đề/tác giả, các sách đang hoạt động phù hợp được trả về mà không có ISBN; từ khóa chỉ chứa ISBN sẽ không khớp.
- AC-FE05-002: Với các sách hiển thị công khai hiện có, khi Thành viên tìm kiếm theo tiêu đề/tác giả, các sách đang hoạt động phù hợp được trả về mà không có ISBN; từ khóa chỉ chứa ISBN sẽ không khớp.
- AC-FE05-003: Với một cuốn sách đang hoạt động hợp lệ, khi Khách hoặc Thành viên mở chi tiết sách thì siêu dữ liệu công khai sẽ được hiển thị mà không có ISBN.
- AC-FE05-004: Cho trước Thủ thư/Quản trị viên mở danh sách sách, khi áp dụng bộ lọc hoặc từ khóa ISBN thì hệ thống trả về danh sách quản lý có phân trang và chứa ISBN.
- AC-FE05-005: Cho trước dữ liệu sách bắt buộc hợp lệ và ISBN duy nhất nếu có, khi Thủ thư/Quản trị viên thêm sách thì hệ thống tạo bản ghi sách.
- AC-FE05-006: Cho trước ISBN trùng lặp, khi Thủ thư/Quản trị viên thêm hoặc cập nhật sách thì hệ thống từ chối yêu cầu.
- AC-FE05-007: Cho trước sách hiện có và dữ liệu cập nhật hợp lệ, khi Thủ thư/Quản trị viên cập nhật thông tin thì hệ thống lưu các thay đổi.
- AC-FE05-008: Cho trước một sách đang hoạt động, khi Thủ thư/Quản trị viên vô hiệu hóa thì sách chuyển sang không hoạt động và bị loại khỏi tìm kiếm công khai.
- AC-FE05-009: Khi Khách hoặc Thành viên cố thêm, cập nhật hoặc vô hiệu hóa sách, hệ thống sẽ từ chối quyền truy cập khi xử lý yêu cầu.
- AC-FE05-010: Cho trước thao tác tạo, cập nhật, vô hiệu hóa hoặc kích hoạt lại thành công, khi thao tác hoàn tất thì thay đổi sách và bản ghi audit bắt buộc phải commit nguyên tử.
- AC-FE05-011: Cho trước một sách đang hoạt động có trạng thái bản sao đã commit gần nhất chứa ít nhất một bản `AVAILABLE`, khi nhân viên hoặc trình duyệt công khai tải sách thì phản hồi hiển thị `AVAILABLE`/`Còn sách` mà không thay đổi bản sao nào.
- AC-FE05-012: Nếu người gọi gửi yêu cầu thay đổi trạng thái bản sao thông qua endpoint FE05, hệ thống sẽ từ chối yêu cầu và giữ nguyên mọi trạng thái sách/bản sao.
- AC-FE05-013: Cho trước một sách `INACTIVE`, `If-Match` khớp và lý do không trống, khi nhân viên kích hoạt lại thì chỉ `Books.Status` trở thành `ACTIVE`, trạng thái bản sao không đổi và tính khả dụng dẫn xuất phản ánh các bản sao hiện tại.
- AC-FE05-014: Cho trước `If-Match` cũ hoặc bị thiếu, khi nhân viên cập nhật/vô hiệu hóa/kích hoạt lại sách thì FE05 trả về `409 STALE_BOOK_STATE` và giữ nguyên mọi trạng thái.
- AC-FE05-015: Với trường truy vấn công khai không được phê duyệt hoặc đầu vào phân trang/sắp xếp nhân viên/từ khóa không hợp lệ, khi endpoint danh sách/tìm kiếm được gọi, FE05 sẽ trả về lỗi xác thực theo chính sách truy vấn xác định.
- AC-FE05-016: Cho trước lý do vô hiệu hóa hoặc kích hoạt lại bị thiếu/trống/quá dài, khi nhân viên gửi lệnh thì FE05 từ chối và giữ nguyên trạng thái sách/bản sao/quy trình.
- AC-FE05-017: Với `pages` hoặc `rating` không hợp lệ, khi nhân viên tạo hoặc cập nhật sách thì FE05 trả về xác thực cấp trường và giữ nguyên trạng thái sách, bản sao, quy trình làm việc và kiểm tra.
- AC-FE05-018: Cho trước Thủ thư/Quản trị viên chọn một bìa JPG/PNG/WebP cục bộ hợp lệ trong biểu mẫu tạo hoặc cập nhật sách, khi xem lại và gửi biểu mẫu thì UI xem trước ảnh đã chọn, gửi siêu dữ liệu nhiều phần cùng `cover`, và bìa được quản lý trả về hiển thị trong giao diện nhân viên lẫn công khai.
- AC-FE05-019: Cho trước bìa không hợp lệ hoặc lỗi phiên bản cũ/cơ sở dữ liệu/audit sau khi tệp thay thế được tạm lưu, khi thao tác tạo/cập nhật kết thúc thì sách/bìa đã commit vẫn không đổi và tệp được quản lý chưa commit bị xóa.
- AC-FE05-020: Cho trước nhân viên thay đổi trạng thái của một cuốn sách qua một trong hai điểm vào được hỗ trợ, khi lệnh thành công thì chỉ `bookId` được chỉ định bị thay đổi, ngữ cảnh tìm kiếm/thể loại/trạng thái/trang hiện đang áp dụng vẫn giữ nguyên và cùng danh sách chuẩn đó được tải lại từ máy chủ.
- AC-FE05-021: Với các bản ghi tham chiếu đang hoạt động và không hoạt động, khi Thủ thư/Quản trị viên tải biểu mẫu sách thì chỉ các lựa chọn đang hoạt động được trả về; Khách/Thành viên không thể truy cập endpoint.
- AC-FE05-022: Cho trước cơ sở dữ liệu đã triển khai cũ thiếu cột siêu dữ liệu chuẩn, khi backend khởi động thì áp dụng migration đã review và đóng gói trước khi lắng nghe; sau khi xác minh hậu điều kiện thành công, endpoint sẵn sàng trả HTTP `200` và cả ba danh sách siêu dữ liệu Quản trị viên tải dữ liệu ổn định. Nếu đối soát thất bại, backend không lắng nghe và bước xác minh triển khai thất bại.
- AC-FE05-023: Cho trước danh sách quản lý được tải lại sau khi một cuốn sách thay đổi trạng thái, khi các hàng hiển thị thì mỗi ô trạng thái nhìn thấy phản ánh `Books.Status` của hàng đó; các hàng không bị ảnh hưởng giữ nguyên trạng thái do máy chủ sở hữu và frontend không gán lại nhãn cho chúng theo kết quả của cuốn sách được chọn.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống mong đợi |
| -- | ----------------- | ------------------------ |
| EC-FE05-001 | ID sách không tồn tại | Trả lại không tìm thấy. |
| EC-FE05-002 | Thiếu tên sách | Từ chối yêu cầu tạo/cập nhật. |
| EC-FE05-003 | ISBN bị trùng lặp | Từ chối yêu cầu tạo/cập nhật. |
| EC-FE05-004 | ISBN trống | Cho phép ISBN trống; khi được cung cấp, ISBN phải là duy nhất. |
| EC-FE05-005 | ID danh mục không tồn tại | Từ chối yêu cầu. |
| EC-FE05-006 | ID tác giả không tồn tại | Từ chối yêu cầu. |
| EC-FE05-007 | ID nhà xuất bản không tồn tại | Từ chối yêu cầu. |
| EC-FE05-008 | Năm xuất bản không hợp lệ hoặc trong tương lai | Từ chối yêu cầu. |
| EC-FE05-009 | Khách/Thành viên thử quản lý sách được bảo vệ | Trả về phản hồi cấm truy cập. |
| EC-FE05-010 | Vô hiệu hóa sách có bản sao đang được mượn/đặt chỗ | Cho phép vô hiệu hóa danh mục dựa trên trạng thái; giữ nguyên lịch sử mượn/đặt chỗ và bản ghi bản sao. |
| EC-FE05-011 | Từ khóa tìm kiếm quá dài | Từ chối với thông báo xác nhận. |
| EC-FE05-012 | Cập nhật cơ sở dữ liệu thất bại một phần | Rollback cập nhật sách và log audit. |
| EC-FE05-013 | Người gọi thử thay đổi trạng thái bản sao qua FE05 | Từ chối yêu cầu; chuyển đổi bản sao trực tiếp phải dùng quy trình do FE06/FE07/FE08 sở hữu. |
| EC-FE05-014 | Thiếu hoặc cũ `If-Match` của hàng đang chuyển đổi | Trả về `409 STALE_BOOK_STATE`; người gọi tải lại trạng thái hiện tại. |
| EC-FE05-015 | Trường truy vấn công khai không được phê duyệt hoặc trang/giới hạn/sắp xếp/thứ tự của nhân viên không hợp lệ | Từ chối theo BR-FE05-017; không âm thầm chuẩn hóa. |
| EC-FE05-016 | Lý do chuyển trạng thái bị thiếu/trống/quá dài | Từ chối lệnh và giữ nguyên mọi trạng thái. |
| EC-FE05-017 | `pages` hoặc `rating` vi phạm giới hạn/độ chính xác tại Mục 10.2 | Từ chối tạo/cập nhật bằng xác thực cấp trường và không thay đổi dữ liệu. |
| EC-FE05-018 | Bìa lớn hơn 2 MB, không được hỗ trợ, đuôi tệp/MIME/chữ ký không khớp, trùng lặp hoặc dữ liệu nhiều phần sai định dạng | Từ chối trước khi thay đổi sách và hiển thị lỗi cấp trường an toàn. |
| EC-FE05-019 | Tệp bìa đã lưu nhưng tạo/cập nhật sau đó thất bại hoặc thua cạnh tranh `If-Match` | Xóa tệp mới và giữ nguyên sách/bìa. |

---

## 10. Yêu cầu về dữ liệu

### 10.1 Các thực thể có liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Books | Lưu siêu dữ liệu danh mục sách. |
| Categories | Cung cấp phân loại danh mục sách. |
| Authors | Cung cấp thông tin tác giả. |
| Publishers | Cung cấp thông tin nhà xuất bản. |
| BookCopies | Cung cấp bản tóm tắt về tính khả dụng thông qua FE06. |
| UserRoles | Kiểm tra quyền Thủ thư/Quản trị viên. |
| AuditLogs | Ghi lại mọi hành động tạo, cập nhật, hủy kích hoạt và kích hoạt lại. |

### 10.2 Trường dữ liệu

| Trường | Kiểu | Bắt buộc | Kiểm tra hợp lệ / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| bookId | số nguyên | Có để cập nhật | Phải tồn tại trong `Books`. |
| title | chuỗi | Có | Bắt buộc, cắt khoảng trắng, 1..255 ký tự. |
| isbn | chuỗi | Không | Trường chỉ dành cho quản lý nhân viên trong FE05; cắt khoảng trắng, tối đa 20 ký tự, duy nhất nếu có. Bị loại khỏi phép chiếu công khai Khách/Thành viên và không được so khớp bởi q công khai. |
| categoryId | số nguyên | Có | Phải tham khảo `Categories`. |
| authorId | số nguyên | Có | Phải tham chiếu `Authors` trong SQL hiện tại. |
| publisherId | số nguyên | Không | Phải tham khảo `Publishers` khi được cung cấp. |
| publishYear | số nguyên | Không | Phải là một năm hợp lệ và không phải trong tương lai. |
| pages | số nguyên | Không | Số nguyên từ 1 đến 10,000 nếu có. |
| rating | số thập phân | Không | Giá trị từ 0.0 đến 5.0, có tối đa một chữ số thập phân nếu có. |
| description | chuỗi | Không | Phải được làm sạch trước khi hiển thị. |
| coverUrl | chuỗi | Không | Đường dẫn được quản lý do máy chủ tạo như `/uploads/book-covers/{uuid}.png` để tải lên UI; đầu vào URL/đường dẫn legacy an toàn vẫn được chấp nhận để tương thích với API. |
| cover | ảnh nhị phân | Không | Trường nhiều phần; JPG/JPEG, PNG hoặc WebP; tối đa 2 MB; máy chủ xác thực đuôi tệp, loại MIME và chữ ký byte. |
| status | chuỗi | Có | Các giá trị: `ACTIVE`, `INACTIVE`; kiểm soát khả năng hiển thị danh mục và điều kiện mượn. |
| availabilityStatus | chuỗi | Dẫn xuất/chỉ đọc | Các giá trị: `AVAILABLE`, `UNAVAILABLE`; được tính từ `Books.Status` và trạng thái bản sao do FE06 sở hữu theo BR-FE05-013. |
| actionReason | chuỗi | Bắt buộc khi vô hiệu hóa/kích hoạt lại | Cắt khoảng trắng, 1..500 ký tự; được lưu trong siêu dữ liệu audit. |
| version | chuỗi không trong suốt | Có khi thay đổi sách hiện có | Biểu diễn API của SQL Server `rowversion`; được cung cấp qua `If-Match` và tăng sau mọi thay đổi. |
| metadataCreatedAt | ngày giờ | Có đối với bản ghi danh mục/tác giả/nhà xuất bản | Dấu thời gian tạo do cơ sở dữ liệu tạo được trả về trong các lần đọc quản lý siêu dữ liệu được bảo vệ. |
| metadataStatus | chuỗi | Có đối với bản ghi danh mục/tác giả/nhà xuất bản | `ACTIVE` hoặc `INACTIVE`; siêu dữ liệu không hoạt động vẫn còn trên các sách hiện có nhưng không thể được gán bởi các thao tác thay đổi sách mới. |

### 10.3 Mô hình trạng thái sách

- Sách mới bắt đầu `ACTIVE`.
- `ACTIVE -> INACTIVE` là vô hiệu hóa; `INACTIVE -> ACTIVE` là kích hoạt lại.
- Quá trình chuyển đổi không làm thay đổi `BookCopies`, các khoản vay, đặt chỗ hoặc hồ sơ lịch sử.
- Endpoint công khai trả về `404` cho sách `INACTIVE`; endpoint quản lý dành cho nhân viên có thể trả về cả hai trạng thái.
- Không có chuyển đổi trạng thái sang xóa vật lý trong Giai đoạn 1.

---

## 11. API / Hợp đồng giao diện

> Hợp đồng API RESTful cho FE05. Các endpoint thay đổi sách hiện có yêu cầu `If-Match` chứa phiên bản được xem lần cuối.

| Phương thức | Endpoint | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/books` | Guest/Member/Librarian/Admin | Truy vấn: `q?, categoryId?, authorId?, publisherId?, page=1, limit=20` | `{ data: PublicBookSummary[], pagination: { page, limit, total, totalPages } }` | `q` công khai chỉ khớp tiêu đề/tác giả và kết quả không bao gồm ISBN. Việc xác thực không mở rộng phép chiếu danh sách này; áp dụng BR-FE05-017. |
| GET | `/api/books/{bookId}` | Guest/Member/Librarian/Admin | - | Chi tiết sách | Khách/Thành viên nhận chi tiết `ACTIVE` an toàn công khai không có ISBN hoặc nhận `404`; Thủ thư/Quản trị viên đã xác thực có thể nhận các trường quản lý, bao gồm ISBN, cho cả sách `ACTIVE` và `INACTIVE`. |
| GET | `/api/admin/books` | Librarian/Admin | Truy vấn: `q?, status?, categoryId?, page?, limit?, sort?, order?` | Danh sách quản lý được phân trang | Endpoint được bảo vệ; `q` có thể khớp ISBN và phản hồi bao gồm ISBN; áp dụng BR-FE05-017. |
| GET | `/api/books/metadata` | Librarian/Admin | - | Các lựa chọn tham chiếu đang hoạt động `{ categories, authors, publishers }` | Quyền đọc được bảo vệ dùng cho các biểu mẫu FE05 chuẩn. Quyền này không cấp cho Thủ thư quyền thay đổi dữ liệu tham chiếu vốn chỉ dành cho Quản trị viên trong FE11. |
| GET | `/health/ready` | Bộ giám sát/người vận hành triển khai | - | `{ status, checks: { catalogMetadata } }` | Kiểm tra mức sẵn sàng chỉ đọc sau khi khởi động. Trả về `503 not_ready` nếu sau này các bảng siêu dữ liệu chuẩn bị mất cột `Status` hoặc `CreatedAt`; migration thuộc cổng khởi động trước khi lắng nghe, không thuộc endpoint này. |
| POST | `/api/books` | Librarian/Admin | Nội dung JSON tương thích hoặc `multipart/form-data` với trường chuỗi JSON `metadata` và trường ảnh tùy chọn `cover` | Sách đã tạo + phiên bản `ACTIVE` | Xác thực trường bắt buộc, ISBN duy nhất và chính sách bìa được quản lý. |
| PUT | `/api/books/{bookId}` | Librarian/Admin | Header `If-Match`; nội dung tương thích JSON hoặc `multipart/form-data` với trường chuỗi JSON `metadata` và trường ảnh tùy chọn `cover` | Sách đã cập nhật + phiên bản mới | Chỉ thay đổi siêu dữ liệu/bìa; không bao giờ thay đổi trạng thái sách hoặc bản sao; việc thay thế thất bại được bù trừ. |
| PATCH | `/api/books/{bookId}/deactivate` | Librarian/Admin | Header `If-Match`; `{ reason: string }` | Sách đã vô hiệu hóa + phiên bản mới | Đặt `INACTIVE`; bắt buộc có lý do; không xóa vật lý hoặc ghi lại bản sao. |
| PATCH | `/api/books/{bookId}/reactivate` | Librarian/Admin | Header `If-Match`; `{ reason: string }` | Sách đã kích hoạt lại + phiên bản mới | Đặt `ACTIVE`; bắt buộc có lý do; trạng thái bản sao không thay đổi. |

### 11.1 Ranh giới sở hữu giao diện người dùng

- `frontend/src/page/BookManagement.jsx` là giao diện thay đổi FE05 chuẩn cho các thao tác tạo sách, cập nhật siêu dữ liệu, vô hiệu hóa và kích hoạt lại.
- `frontend/src/page/UserManagement.jsx` có thể đọc danh sách sách của Thư viện quản trị để cung cấp ngữ cảnh bảng điều khiển, nhưng các hàng sách ở chế độ chỉ đọc và không hiển thị điều khiển thay đổi FE05 trùng lặp.
- `adminApi` của FE11 không chứa bí danh thay đổi sách; mọi thay đổi sách hiện có đều dùng hợp đồng API FE05 ở trên với `If-Match` và lý do khi bắt buộc.
- Thư viện quản trị FE11 có thể tạo/cập nhật/vô hiệu hóa bản ghi tham chiếu danh mục, tác giả và nhà xuất bản qua ranh giới `/api/admin/library/*` chỉ dành cho Quản trị viên. Mỗi mutation phải ghi actor và audit catalog trong cùng giao dịch; cập nhật hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND`. Thủ thư chỉ nhận các lựa chọn `/api/books/metadata` đang hoạt động cần thiết cho việc thay đổi sách FE05.

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE05-SEC-001: Các endpoint quản lý sách phải yêu cầu xác thực và vai trò Thủ thư/Quản trị viên.
- NFR-FE05-SEC-002: Phép chiếu sách công khai cho Khách/Thành viên phải loại trừ ISBN và mọi trường chỉ dành cho nhân viên khác; quyền truy cập ISBN của Thủ thư/Quản trị viên phải được phân quyền phía máy chủ.
- NFR-FE05-SEC-003: ID, `title`, `ISBN`, danh mục/tác giả/nhà xuất bản, năm xuất bản, số trang, xếp hạng, mô tả, URL bìa và đầu vào truy vấn phải được xác thực phía máy chủ.
- NFR-FE05-SEC-004: Việc tiêm SQL phải được ngăn chặn bằng cách sử dụng các truy vấn được tham số hóa hoặc các mẫu ORM đã được phê duyệt.
- NFR-FE05-SEC-005: Mô tả và URL bìa phải được khử trùng hoặc thoát trước khi hiển thị.
- NFR-FE05-SEC-006: Việc tải ảnh bìa lên phải được xác thực và phân quyền theo vai trò trước khi lưu nội dung; tên tệp từ máy khách không bao giờ được quyết định đường dẫn máy chủ, và việc xác thực nội dung phải kiểm tra cả siêu dữ liệu đã khai báo lẫn chữ ký byte.

### 12.2 Tính toàn vẹn giao dịch

- NFR-FE05-TXN-001: Tạo/cập nhật/vô hiệu hóa/kích hoạt lại sách hoặc dữ liệu tham chiếu catalog và log audit bắt buộc phải cùng thành công hoặc cùng rollback.
- NFR-FE05-TXN-002: Việc vô hiệu hóa sách chỉ thay đổi `Books.Status`; FE05 phải giữ nguyên trạng thái vòng đời bản sao của FE06 và mọi lần đọc tính khả dụng phải kết hợp các trạng thái sách/bản sao đã commit mới nhất.
- NFR-FE05-TXN-003: Việc ghi hệ thống tệp được bù trừ quanh giao dịch sách/audit nguyên tử: thao tác thay đổi thất bại sẽ xóa bìa được quản lý mới, còn thay thế thành công chỉ xóa tệp được FE05 quản lý trước đó.

### 12.3 Hiệu năng

- NFR-FE05-PERF-001: Danh sách quản lý và tìm kiếm sách phải hỗ trợ phân trang.
- NFR-FE05-PERF-002: Truy vấn tìm kiếm phải áp dụng bộ lọc từ khóa/ID đã được phê duyệt và phân trang ngay trong truy vấn cơ sở dữ liệu trước khi hiện thực hóa các hàng; không được lọc toàn bộ danh mục ở lớp ứng dụng.

### 12.4 Mức sẵn sàng triển khai

- NFR-FE05-DEP-001: Gói backend staging phải bao gồm migration siêu dữ liệu catalog lũy đẳng đã được rà soát và có thể bao gồm các migration tương thích do tính năng sở hữu đã được phê duyệt riêng. Cổng khởi động ứng dụng chỉ áp dụng các migration đã đóng gói đó trước khi lắng nghe và xác minh hậu điều kiện của chúng. CI không kết nối cơ sở dữ liệu hoặc thay đổi lược đồ. Sau khi lần chạy CI chính xác trên `main` thành công, staging tự động triển khai commit đó; CI thất bại sẽ không triển khai, vẫn có thể chạy lại thủ công, kiểm tra sống vẫn tách biệt với kiểm tra sẵn sàng và kiểm thử khói staging phải đóng an toàn khi quá trình khởi động hoặc bước kiểm tra sẵn sàng chỉ đọc không thành công.

### 12.5 Ghi log và audit

- NFR-FE05-LOG-001: Thao tác thêm, cập nhật, vô hiệu hóa và kích hoạt lại sách hoặc dữ liệu tham chiếu catalog phải truy vết được bằng tác nhân, dấu thời gian, loại/ID mục tiêu, trạng thái cũ/mới và lý do khi áp dụng.

### 12.6 Khả năng sử dụng

- NFR-FE05-UX-001: Lỗi xác thực phải xác định rõ ràng các trường sách không hợp lệ.
- NFR-FE05-UX-002: Việc vô hiệu hóa và kích hoạt lại phải yêu cầu xác nhận trong UI trước khi gửi.
- NFR-FE05-UX-003: Biểu mẫu tạo/cập nhật chuẩn phải hiển thị bộ chọn ảnh cục bộ, hướng dẫn về loại/kích thước được chấp nhận, tên tệp và bản xem trước thay vì trường văn bản URL bìa có thể chỉnh sửa.
- NFR-FE05-UX-004: Thay đổi trạng thái thành công từ biểu mẫu cập nhật sẽ điều chỉnh bộ lọc trạng thái hiển thị thay vì làm cho bản ghi đã chọn có vẻ biến mất dưới bộ lọc cũ của nó.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Quản lý bản sao/mã vạch/vị trí vật lý.
- Quy trình yêu cầu mượn, trả lại hoặc gia hạn.
- Quy trình làm việc của hàng đợi đặt chỗ.
- Tính hoặc thanh toán tiền phạt.
- Thiết kế và điều hướng trang chủ công cộng.
- Quản lý người dùng, vai trò hoặc thành viên.
- Nhập/xuất số lượng lớn, trừ khi được phê duyệt sau.

---

## 14. Sự phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| FE01 Công cộng / Duyệt | Nội bộ | Sử dụng dữ liệu danh mục an toàn công cộng cho các trang home/search/detail. |
| Xác thực FE02 | Nội bộ | Xác định các tác nhân nhân viên cho các hành động được bảo vệ. |
| FE06 Quản lý tồn kho / bản sao sách | Nội bộ | Sở hữu các bản sao vật lý và số lượng sẵn có. |
| Quản lý mượn sách FE07 | Nội bộ | Sử dụng dữ liệu sách trong quy trình mượn. |
| Quản lý đặt chỗ FE08 | Nội bộ | Sử dụng dữ liệu sách trong quy trình đặt chỗ. |
| FE11 Quản lý vai trò và người dùng | Nội bộ | Cung cấp quyền Thủ thư/Quản trị viên. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | SQL hiện tại có các bảng danh mục và `Books.Status`; triển khai phải bổ sung SQL `rowversion` cho hợp đồng `If-Match` đã được phê duyệt. |

---

## 15. Câu hỏi đã được giải quyết

| ID | Quyết định phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE05-001 | ISBN là tùy chọn nhưng phải là duy nhất khi được cung cấp. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-002 | Nhiều cuốn sách có thể chia sẻ cùng một tiêu đề. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-003 | Sách đã vô hiệu hóa bị ẩn khỏi tìm kiếm công khai nhưng vẫn hiển thị trong chế độ xem quản lý dành cho nhân viên/Quản trị viên. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-004 | Bắt buộc xóa mềm/vô hiệu hóa; không xóa vật lý trong Giai đoạn 1. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-005 | Một cuốn sách thuộc một thể loại trong Giai đoạn 1; danh mục nhiều-nhiều là công việc trong tương lai. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-006 | Ảnh bìa được lưu dưới dạng văn bản URL/đường dẫn, không phải nội dung nhị phân trong cơ sở dữ liệu. | Gói review 2026-06-10 | APPROVED |
| Q-FE05-007 | Việc hủy kích hoạt sẽ ẩn sách khỏi danh mục công khai ngay cả khi các bản sao được mượn hoặc đặt trước; hồ sơ lịch sử và bản sao vẫn không thay đổi. | Chỉnh sửa của người dùng 2026-06-21 | APPROVED |
| Q-FE05-008 | Nhân viên có thể chuyển trạng thái sách bằng lệnh vô hiệu hóa/kích hoạt lại chuyên dụng; PUT siêu dữ liệu không thay đổi trạng thái và trình duyệt công khai ẩn sách `INACTIVE`. | Nhat phê duyệt sau khi kiểm tra tính năng chéo 2026-07-15 | APPROVED |
| Q-FE05-009 | Các khung nhìn dành cho nhân viên/công khai hiển thị tính khả dụng dẫn xuất đơn giản (`Còn sách` / `Không khả dụng`). FE05 không bao giờ cập nhật `BookCopies.Status`; FE06/FE07/FE08 sở hữu các chuyển đổi bản sao tương ứng. | Nhat phê duyệt sau khi kiểm tra tính năng chéo 2026-07-15 | APPROVED |
| Q-FE05-010 | Thay đổi sách hiện có dùng SQL `rowversion` được cung cấp dưới dạng phiên bản không trong suốt và yêu cầu `If-Match`; phiên bản cũ/bị thiếu trả về `409 STALE_BOOK_STATE`. | Nhat phê duyệt sau khi kiểm tra tính năng chéo 2026-07-15 | APPROVED |
| Q-FE05-011 | Chính sách truy vấn mang tính quyết định: trình duyệt công khai sử dụng danh sách cho phép FE01 chính xác và `Title ASC, BookId ASC` cố định; danh sách nhân viên cũng chấp nhận sắp xếp trong title/publishYear/createdAt và đặt hàng asc/desc. | Nhat phê duyệt sau khi kiểm tra tính năng chéo 2026-07-15; phê duyệt phong bì người dùng 2026-07-19 | APPROVED |
| Q-FE05-012 | Thủ thư/Quản trị viên có thể đọc các lựa chọn tham chiếu đang hoạt động từ `/api/books/metadata`; chỉ Quản trị viên mới có thể thay đổi dữ liệu tham chiếu danh mục/tác giả/nhà xuất bản qua tích hợp Thư viện quản trị FE11. Các thao tác thay đổi sách vẫn do FE05 sở hữu cho cả hai vai trò. | Đối chiếu vai trò đa tính năng 2026-07-23 | APPROVED |

---

## 15.1 Quyết định thiết kế được phê duyệt

Các quyết định sau đây đã được phê duyệt trong gói đánh giá Giai đoạn 1 trên 2026-06-10 và hiện là một phần của đặc tả này.

| Quyết định | Câu trả lời được phê duyệt | Trạng thái |
| -------- | --------------- | ------ |
| Q-FE05-001 | ISBN là tùy chọn nhưng phải là duy nhất khi được cung cấp. | APPROVED |
| Q-FE05-002 | Nhiều cuốn sách có thể chia sẻ cùng một tiêu đề. | APPROVED |
| Q-FE05-003 | Sách đã vô hiệu hóa bị ẩn khỏi tìm kiếm công khai nhưng vẫn hiển thị trong chế độ xem quản lý dành cho nhân viên/Quản trị viên. | APPROVED |
| Q-FE05-004 | Bắt buộc xóa mềm/vô hiệu hóa; không xóa vật lý trong Giai đoạn 1. | APPROVED |
| Q-FE05-005 | Một cuốn sách thuộc một thể loại trong Giai đoạn 1; danh mục nhiều-nhiều là công việc trong tương lai. | APPROVED |
| Q-FE05-006 | Ảnh bìa được lưu dưới dạng văn bản URL/đường dẫn, không phải nội dung nhị phân trong cơ sở dữ liệu. | APPROVED |
| Q-FE05-007 | Việc hủy kích hoạt sẽ ẩn sách khỏi danh mục công khai ngay cả khi các bản sao được mượn hoặc đặt trước; hồ sơ lịch sử và bản sao vẫn không thay đổi. | APPROVED |

---

## 16. Ma trận truy vết

| ID yêu cầu | Trường hợp sử dụng liên quan | Trường hợp thử nghiệm liên quan | Trạng thái |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE05-001..010 | UC17-UC24 | `bookRoutes.test.js`; `publicBrowseRoutes.test.js` | Hoàn thành |
| BR-FE05-011..018 | UC17-UC24, UC25-UC39 | `bookRoutes.test.js`; `bookAvailabilityRepository.test.js`; `bookConcurrency.sqltest.js`; Hồi quy gốc không hoạt động FE07 | Hoàn thành |
| BR-FE05-019..020 | UC22, UC23 | `bookRoutes.test.js`; `bookCoverStorage.test.js`; `bookManagementFrontend.test.js` | Hoàn thành |
| BR-FE05-021 | UC22, UC23 | `bookRoutes.test.js` ranh giới vai trò tham chiếu tích cực | Hoàn thành |
| BR-FE05-022 | Sẵn sàng triển khai | `schemaReadinessService.test.js`; `startApplication.test.js`; `smokeStaging.test.js`; `stagingWorkflowPolicy.test.js` | Hoàn thành |
| FR-FE05-001..017 | UC17-UC24 | `bookRoutes.test.js`; `publicBrowseRoutes.test.js` | Hoàn thành |
| FR-FE05-018..026 | UC17-UC24, UC29, UC32 | `bookRoutes.test.js`; `bookAvailabilityRepository.test.js`; `bookConcurrency.sqltest.js`; Hồi quy gốc không hoạt động FE07 | Hoàn thành |
| FR-FE05-027..028 | UC22, UC23 | `bookRoutes.test.js`; `bookCoverStorage.test.js`; `bookManagementFrontend.test.js` | Hoàn thành |
| FR-FE05-029 | UC23 | `bookManagementFrontend.test.js` đối chiếu bộ lọc trạng thái | Hoàn thành |
| FR-FE05-030 | UC22, UC23 | `bookRoutes.test.js` từ chối Khách/Thành viên và trả các lựa chọn đang hoạt động cho Thủ thư/Quản trị viên | Hoàn thành |
| FR-FE05-031 | Sẵn sàng triển khai | `app.test.js`; `schemaReadinessService.test.js`; `startApplication.test.js`; `smokeStaging.test.js`; `stagingWorkflowPolicy.test.js` | Hoàn thành |
| FR-FE05-032 | UC21, UC23, UC24 | Hợp đồng cột trạng thái chuẩn trong `bookManagementFrontend.test.js` | Kiểm thử tự động đạt; đang chờ con người rà soát |
| AC-FE05-001..010 | UC17-UC24 | `bookRoutes.test.js`; `publicBrowseRoutes.test.js`; `bookConcurrency.sqltest.js` | Hoàn thành |
| AC-FE05-011..017 | UC17-UC24 | `bookRoutes.test.js`; `bookAvailabilityRepository.test.js`; `bookConcurrency.sqltest.js` | Hoàn thành |
| AC-FE05-018..019 | UC22, UC23 | `bookRoutes.test.js`; `bookCoverStorage.test.js`; `bookManagementFrontend.test.js` | Hoàn thành |
| AC-FE05-020 | UC23 | `bookManagementFrontend.test.js` | Hoàn thành |
| AC-FE05-021 | UC22, UC23 | `bookRoutes.test.js` ranh giới vai trò tham chiếu tích cực | Hoàn thành |
| AC-FE05-022 | Sẵn sàng triển khai | `libraryMetadataMigration.test.js`; `schemaReadinessService.test.js`; `startApplication.test.js`; `smokeStaging.test.js`; `stagingWorkflowPolicy.test.js` | Hoàn thành |
| AC-FE05-023 | UC21, UC23, UC24 | Các xác nhận hàng không bị ảnh hưởng trong `bookManagementFrontend.test.js`; `bookRoutes.test.js` | Kiểm thử tự động đạt; đang chờ con người rà soát |

Độ bao phủ: 22/22 BR, 32/32 FR và 23/23 AC hiện có ánh xạ bằng chứng tự động.

---

## 17. Danh sách kiểm tra đánh giá

### Điều chỉnh bảng điều khiển nhân viên 2026-07-22

- Tìm kiếm nhân viên, bộ lọc trạng thái, bộ lọc danh mục, phân trang và tính tổng sử dụng một truy vấn `/api/admin/books` chuẩn; tìm kiếm không được dùng danh mục công khai chỉ gồm sách hoạt động làm nguồn kết quả riêng biệt.
- Biểu mẫu sách cho Thủ thư/Quản trị viên và các chế độ xem chi tiết/danh sách không hiển thị `rating`; trường API/cơ sở dữ liệu vẫn tương thích ngược và được máy chủ xác thực khi một máy khách được phê duyệt khác cung cấp.
- Vô hiệu hóa/kích hoạt lại giữ lý do audit chuẩn, không trống và `If-Match`, nhưng UI nhân viên tạo lý do thao tác bị chặn thay vì hiển thị hộp nhập lý do trùng lặp hoặc không kiểm soát.
- Biểu mẫu cập nhật của Thủ thư hiển thị trạng thái danh mục dưới dạng `Còn sách` (`ACTIVE`) hoặc `Không khả dụng` (`INACTIVE`) và gọi các lệnh vô hiệu hóa/kích hoạt lại chuyên dụng sau khi cập nhật siêu dữ liệu; PUT siêu dữ liệu vẫn không thể thay đổi trạng thái sách hoặc trạng thái bản sao vật lý.
- Bộ chọn siêu dữ liệu phụ thuộc vào các cột tương thích `Authors`, `Publishers` và `Categories` được triển khai được ghi lại trong ADR-002 và quá trình di chuyển 2026-07-22.

Danh sách kiểm tra phê duyệt giai đoạn 1 (hoàn thành trên 2026-06-10):

- [x] Các quyết định đề xuất tại Mục 15.1 được phê duyệt hoặc thay đổi.
- [x] Quy tắc ISBN bắt buộc/tùy chọn được phê duyệt.
- [x] Lược đồ trạng thái/vô hiệu hóa sách được xác nhận với chủ sở hữu cơ sở dữ liệu.
- [x] Ranh giới search/detail công khai với FE01 được xác nhận.
- [x] Ranh giới bản sao vật lý với FE06 được xác nhận.
- [x] Hợp đồng API được phê duyệt trong SPEC.md này hoặc được sao chép vào tệp hợp đồng API được chia sẻ chuyên dụng nếu nhóm giới thiệu lại một tệp.
- [x] Mọi tiêu chí chấp nhận đều có thể trở thành một bài kiểm tra.

### 17.1 Cổng Rà Soát Bản Sửa Đổi v0.5.0

- [x] Xác nhận FE05 không có endpoint thay đổi `BookCopies.Status`.
- [x] Xác nhận tính sẵn có dẫn xuất và bảo vệ sổ gốc `ACTIVE` trên FE01/FE06/FE07.
- [x] Xác nhận các lệnh vô hiệu hóa/kích hoạt lại chuyên dụng bảo toàn mọi hàng bản sao/quy trình.
- [x] Xác nhận `rowversion`/`If-Match`, giới hạn truy vấn và lý do chuyển đổi bắt buộc.

### 17.2 Cổng tải bìa sách được quản lý của bản sửa đổi v0.6.0

- [x] Giữ `Books.CoverUrl` làm trường ổn định; không có byte hình ảnh hoặc mở rộng lược đồ nào vào Máy chủ SQL.
- [x] Giữ khả năng tương thích JSON khi tạo/cập nhật, đồng thời dùng quy trình tải lên nhiều phần trong UI chuẩn dành cho Thủ thư/Quản trị viên.
- [x] Xác thực và ủy quyền trước khi lưu vào bộ đệm nội dung nhiều phần.
- [x] Giới hạn tải lên ở các tệp JPG/PNG/WebP đã được xác thực có kích thước tối đa là 2 MB và sử dụng tên tệp do máy chủ tạo.
- [x] Bù trừ các thao tác thất bại/dùng phiên bản cũ và không bao giờ xóa đường dẫn bìa bên ngoài/không được quản lý.
- [ ] Rà soát thủ công toàn bộ diff v0.6.0 và bằng chứng xác minh trước khi tích hợp.
