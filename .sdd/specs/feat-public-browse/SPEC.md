# SPEC.md - FE01 Công Khai / Duyệt Sách

# Phiên bản: 0.5.0

# Trạng thái: CIRCULATION ACTION v0.5.0 ĐÃ QUA H2 BAN ĐẦU VÀ CI PR #102; CHỜ H2 BỔ SUNG SAU KHẮC PHỤC H3

# Chủ sở hữu: Dung

# Cập nhật lần cuối: 2026-08-03

# ID chức năng: FE01

# Thư mục chức năng: `.sdd/specs/feat-public-browse/`

> Trạng thái bàn giao hiện tại (2026-07-26): `COMPLETE` đối với baseline Giai đoạn 1/2
> đã được phê duyệt và phụ lục HomePage responsive có giới hạn được merge qua PR #59.
> Phần hoàn thiện Homepage từ FE01-T009 đến FE01-T012 được triển khai cục bộ với
> bằng chứng tự động đạt; việc con người chấp nhận giao diện, điều hướng và khả năng hiển thị theo vai trò
> vẫn là một quyết định phát hành riêng biệt.
> `TASKS.md` và `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`
> có thẩm quyền về trạng thái triển khai hiện tại. Các nhãn cũ `Not Started`,
> `PARTIAL`, `READY FOR REVIEW` hoặc đang chờ review được giữ lại bên dưới là
> snapshot kế hoạch/bằng chứng lịch sử, không phải trạng thái bàn giao hiện tại.

> Nguồn chuẩn của FE01 Công khai / Duyệt sách. Bản sửa đổi v0.3.0 được phê duyệt làm baseline sau khi phụ thuộc tình trạng có sẵn được nêu rõ.

> Ranh giới phụ lục responsive: yêu cầu về điều hướng di động và bố cục màn hình hẹp
> bên dưới được tích hợp qua PR #59. Review phát hành còn lại
> là việc con người chấp nhận giao diện của ứng viên main hiện tại, không phải gate
> triển khai hoặc merge.

---

## 1. Tổng Quan Chức Năng

### 1.1 Tên Chức Năng

Công khai / Duyệt sách

### 1.2 Bối Cảnh Nghiệp Vụ

Khách cần một cách đơn giản để khám phá sách trước khi tạo tài khoản hoặc đăng ký tư cách thành viên. Danh mục công khai làm giảm các câu hỏi thủ công cho Thủ thư và giúp Thành viên tiềm năng hiểu thư viện cung cấp những gì.

Hoạt động duyệt sách công khai phải an toàn và chỉ có quyền đọc. Hoạt động này có thể sử dụng nội bộ tình trạng có sẵn cấp cao để chọn đúng quy trình sở hữu, nhưng cách hiển thị HomePage cho Khách và Thành viên không render nhãn tình trạng có sẵn hoặc chi tiết kho được bảo vệ.

### 1.3 Mục Tiêu / Kết Quả

Hệ thống phải:

- Cho phép Khách xem trang chủ.
- Cho phép Khách tìm kiếm danh mục sách công khai.
- Cho phép Khách xem thông tin sách công khai.
- Cho phép Khách xem chi tiết sách công khai.
- Sử dụng tình trạng có sẵn công khai mới nhất sau khi trạng thái bản sao thay đổi để định tuyến hành động chính xác, đồng thời giới hạn nhãn trạng thái HomePage hiển thị cho Thủ thư/Quản trị viên.
- Chỉ hiển thị dữ liệu an toàn cho công khai.
- Giữ mọi hành vi duyệt sách công khai ở chế độ chỉ đọc.

### 1.4 Mức Phạm Vi

- [ ] Đặc tả đầy đủ - logic nghiệp vụ cốt lõi, rủi ro cao, phải chính xác ngay từ đầu
- [x] Đặc tả tiêu chuẩn - chức năng thông thường có quy tắc nghiệp vụ và validation
- [ ] Đặc tả gọn - giao diện đơn giản, tài liệu hoặc chức năng có rủi ro thấp

---

## 2. Tác Nhân Và Quyền

| Tác nhân | Mô tả | Quyền / Trách nhiệm |
| ----- | ----------- | --------------------------- |
| Khách | Khách truy cập chưa xác thực | Xem trang chủ, tìm kiếm sách, xem thông tin và chi tiết sách công khai. |
| Thành viên | Người dùng thư viện đã xác thực | Có thể sử dụng cùng các chức năng duyệt sách công khai; hành động chỉ dành cho Thành viên do chức năng khác xử lý. |
| Thủ thư | Nhân viên thư viện | Có thể sử dụng cùng các thao tác đọc an toàn cho công khai; FE01 không cấp quyền ghi và quản lý danh mục thuộc FE05. |
| Quản trị viên | Quản trị viên hệ thống | Có thể sử dụng cùng các thao tác đọc an toàn cho công khai; FE01 không cấp quyền ghi và việc quản lý thuộc FE05/FE11. |

### 2.1 Ma Trận Tiếp Tục Theo Vai Trò Trên Homepage

Header chỉ chứa thương hiệu thư viện và hành động tài khoản. Header không render các nhóm điều hướng cũ `Khám phá sách`, `Hội viên`/`Thư viện của tôi`/`Nghiệp vụ`, `Về thư viện` hoặc `Hỗ trợ`. Các đích do vai trò sở hữu vẫn hiện có thông qua bảng tiếp tục theo vai trò của trang và các điều khiển sở hữu khác, được suy ra từ vai trò FE11 duy nhất của tài khoản.

| Đối tượng | Các đích được kết nối |
| -------- | ---------------------- |
| Khách | `/login`, `/register` và phần danh mục công khai. |
| Thành viên | `/membership`, `/borrowing/new`, `/borrowing/history` và `/reservations/mine`. |
| Thủ thư | `/membership`, `/librarian/borrow-requests`, `/librarian/returns` và `/librarian/inventory`. |
| Quản trị viên | `/admin/users`, `/membership`, `/reports/users` và `/reports/inventory`. |

Trải nghiệm thư viện công khai hiện có tại `/home` cho Khách và Quản trị viên thông qua route trang chủ nhận biết vai trò, và trực tiếp tại `/homepage` cho mọi tác nhân. `/home` của Thành viên/Thủ thư vẫn là dashboard theo vai trò của họ. FE01 chỉ liên kết tới màn hình sở hữu hiện có và không trùng lặp các thao tác được bảo vệ của các màn hình đó.

---

## 3. Điều Kiện Tiên Quyết

Chức năng chỉ có thể bắt đầu khi:

- PRE-FE01-001: Dữ liệu danh mục công khai tồn tại trong `Books`.
- PRE-FE01-002: Metadata công khai có thể tìm kiếm hiện có: tên sách, tên tác giả khi có và `BookId` bắt buộc; ISBN vẫn là metadata FE05 dành cho nhân viên và bị loại khỏi tìm kiếm cùng phản hồi FE01.
- PRE-FE01-003: Endpoint công khai hiện có mà không cần xác thực.
- PRE-FE01-004: Các trường trả về bị giới hạn ở dữ liệu danh mục an toàn cho công khai.
- PRE-FE01-005: Giá trị phân trang mặc định được xác định cho kết quả tìm kiếm.

---

## 4. Luồng Chính

### MF-FE01-001: Xem Trang Chủ

1. Khách mở trang chủ công khai.
2. Hệ thống tải điều hướng công khai, điểm vào tìm kiếm và sách công khai gần đây theo thứ tự duyệt mặc định.
3. Hệ thống hiển thị liên kết đăng nhập/đăng ký cho các hành động chỉ dành cho Thành viên.
4. Ở chiều rộng di động được hỗ trợ, hệ thống giữ cho cùng các hành động duyệt sách và tài khoản/thành viên có thể truy cập thông qua menu điều hướng có khả năng truy cập.
5. Hệ thống không yêu cầu xác thực.

### MF-FE01-002: Tìm Kiếm Sách

1. Khách nhập từ khóa hoặc bộ lọc.
2. Hệ thống kiểm tra độ dài query, trang và giá trị bộ lọc.
3. Hệ thống tìm kiếm sách hiển thị công khai.
4. Hệ thống trả về kết quả được phân trang với các trường tóm tắt an toàn.
5. Hệ thống hiển thị thông báo trạng thái trống khi không có sách phù hợp.

### MF-FE01-003: Xem Thông Tin Sách

1. Khách chọn một cuốn sách từ kết quả tìm kiếm hoặc duyệt sách.
2. Hệ thống kiểm tra ID sách.
3. Hệ thống tải thông tin sách công khai.
4. Hệ thống hiển thị tên sách, tác giả, thể loại, nhà xuất bản, năm xuất bản và ảnh bìa; cách hiển thị HomePage cho Khách/Thành viên không có nhãn tình trạng có sẵn.

### MF-FE01-004: Xem Chi Tiết Sách

1. Khách mở trang chi tiết sách.
2. Hệ thống truy xuất dữ liệu sách công khai chi tiết.
3. Hệ thống truy xuất thông tin tình trạng có sẵn cấp cao đã được phê duyệt từ kho.
4. Hệ thống hiển thị mô tả và metadata công khai.
5. Hệ thống trình bày hành động chỉ dành cho Thành viên dưới dạng điều hướng tới luồng đăng nhập/đăng ký hoặc tư cách thành viên.

### MF-FE01-005: Phản Ánh Tình Trạng Có Sẵn Hiện Tại Trên Trang Chủ/Tìm Kiếm

1. Một quy trình sở hữu thay đổi trạng thái bản sao vật lý thông qua FE06, FE07 hoặc FE08.
2. Khách mở `/home`, hoặc tác nhân bất kỳ mở chế độ xem thư viện công khai tại `/homepage`, tìm kiếm hoặc chi tiết sách.
3. Hệ thống đọc hồ sơ danh mục hoạt động và trạng thái bản sao do FE06 sở hữu đã commit mới nhất.
4. Cách hiển thị HomePage cho Thủ thư/Quản trị viên hiển thị `Còn sách` khi có ít nhất một bản sao là `AVAILABLE`, nếu không hiển thị `Không khả dụng`; cách hiển thị cho Khách/Thành viên không render nhãn nào.
5. FE01 và FE05 không sửa trạng thái bản sao khi tạo bản tóm tắt này.

### MF-FE01-006: Tiếp Tục Tới Quy Trình Do Vai Trò Sở Hữu

1. Tác nhân mở hành động tiếp tục theo vai trò hoặc hành động sách.
2. Hệ thống suy ra đối tượng từ vai trò duy nhất `ADMIN`, `LIBRARIAN` hoặc `MEMBER` của tài khoản; tác nhân chưa xác thực là Khách.
3. Hệ thống hiển thị nhãn đối tượng và các đích được xác định trong Ma trận Tiếp tục theo Vai trò trên Homepage.
4. Hành động trong phần công khai cuộn hoặc lọc bên trong Homepage; hành động được bảo vệ điều hướng tới route sở hữu đã đăng ký.
5. Chức năng sở hữu và route guard của nó thực thi quyền truy cập. FE01 không mô phỏng việc hoàn thành hoặc thực hiện mutation được bảo vệ.

---

## 5. Luồng Thay Thế

### AF-FE01-001: Không Có Từ Khóa Tìm Kiếm

1. Khách gửi tìm kiếm trống.
2. Hệ thống trả về trang đầu tiên mặc định của kết quả duyệt sách công khai theo thứ tự sắp xếp đã được phê duyệt.
3. Hệ thống không thất bại với lỗi server.

### AF-FE01-002: Không Có Sách Phù Hợp

1. Khách tìm kiếm với tiêu chí hợp lệ.
2. Không có sách hiển thị công khai nào phù hợp.
3. Hệ thống trả về tập kết quả trống kèm thông báo rõ ràng.

### AF-FE01-003: Không Tìm Thấy Sách

1. Khách mở URL chi tiết sách cho một cuốn sách bị thiếu.
2. Hệ thống trả về phản hồi không tìm thấy.
3. Hệ thống không làm lộ chi tiết cơ sở dữ liệu nội bộ.

### AF-FE01-004: Sách Không Hiển Thị Công Khai

1. Khách mở một cuốn sách không hoạt động, đã ngừng kích hoạt hoặc bị chính sách ẩn theo cách khác.
2. Hệ thống trả về `404 Not Found` và không làm lộ trường danh mục bị ẩn.
3. Hệ thống không làm lộ dữ liệu danh mục bị ẩn.

---

## 6. Quy Tắc Nghiệp Vụ

Sử dụng các ID ổn định này cho nhiệm vụ và kiểm thử.

- BR-FE01-001: Hoạt động duyệt sách công khai chỉ có quyền đọc.
- BR-FE01-002: Khách có thể xem trang chủ mà không cần xác thực.
- BR-FE01-003: Khách chỉ có thể tìm kiếm sách hiển thị công khai.
- BR-FE01-004: Phản hồi danh sách/chi tiết công khai cho Khách và Thành viên loại trừ ISBN cùng mọi metadata chỉ dành cho nhân viên; Thủ thư/Quản trị viên chỉ có thể truy cập ISBN thông qua phép chiếu quản lý FE05 được server cấp quyền.
- BR-FE01-005: Tìm kiếm công khai phải hỗ trợ phân trang.
- BR-FE01-006: Tìm kiếm công khai chỉ chấp nhận `q`, `categoryId`, `authorId`, `publisherId`, `page` và `limit`. `q` được cắt khoảng trắng, phải dài 1..200 ký tự khi được cung cấp và khớp tên sách hoặc tên tác giả không phân biệt hoa thường; bộ lọc ID phải là số nguyên dương.
- BR-FE01-007: Sách bị thiếu hoặc bị ẩn không được làm lộ chi tiết cơ sở dữ liệu nội bộ.
- BR-FE01-008: Cách hiển thị tình trạng có sẵn công khai phải được suy ra từ quy tắc kho FE06 khi được hiển thị.
- BR-FE01-009: FE01 không được tạo, cập nhật, ngừng kích hoạt, mượn, đặt chỗ hoặc tạo hồ sơ phạt.
- BR-FE01-010: Phản hồi công khai không được làm lộ dữ liệu người dùng, hồ sơ mượn, hàng đợi đặt chỗ, khoản phạt, audit log hoặc trường nhân viên được bảo vệ.
- BR-FE01-011: Tình trạng có sẵn công khai phải được tính từ `BookCopies.Status` hiện tại của sách đang hoạt động và không được sử dụng giá trị mã hóa cứng hoặc giá trị cũ chỉ có trên giao diện.
- BR-FE01-012: Hoạt động duyệt sách công khai phải ẩn `Books.Status = INACTIVE` ngay cả khi một hoặc nhiều bản sao được đánh dấu `AVAILABLE`.
- BR-FE01-013: Duyệt sách công khai mặc định là `page=1`, `limit=20` và thứ tự ổn định `Title ASC, BookId ASC`; `page` phải là số nguyên ít nhất bằng 1 và `limit` phải là số nguyên từ 1 đến 100.
- BR-FE01-014: Metadata danh mục tùy chọn bị thiếu không được loại bỏ một cuốn sách vốn hiển thị công khai; phản hồi trả về `null` và giao diện sử dụng nhãn/ảnh fallback an toàn.
- BR-FE01-015: Tài khoản FE11 có đúng một vai trò. Hành động sách công khai định tuyến `MEMBER` tới quy trình mượn/đặt chỗ do Thành viên sở hữu và định tuyến `ADMIN`/`LIBRARIAN` tới quy trình quản lý do nhân viên sở hữu.
- BR-FE01-016: HomePage không được render huy hiệu tình trạng có sẵn cho Khách hoặc Thành viên. Khách nhận bước tiếp tục đăng nhập chung mà không tiết lộ tình trạng có sẵn; `MEMBER` đã xác thực phải thấy hành động sở hữu rõ ràng được chọn từ tình trạng có sẵn hiện tại (`Mượn sách này` tới FE07 hoặc `Đặt chỗ sách này` tới FE08). Thủ thư/Quản trị viên có thể thấy trạng thái cấp cao và hành động quản lý FE05/FE06 rõ ràng.
- BR-FE01-017: Header HomePage không được render các nhóm điều hướng `Khám phá sách`, dịch vụ theo đối tượng, `Về thư viện` hoặc `Hỗ trợ` đã bị xóa trên desktop hoặc thiết bị di động.

---

## 7. Yêu Cầu Chức Năng

- FR-FE01-001: Khi Khách mở trang chủ, hệ thống phải hiển thị trang chủ công khai mà không yêu cầu đăng nhập.
- FR-FE01-002: Khi Khách tìm kiếm sách với tiêu chí BR-FE01-006 hợp lệ, hệ thống phải trả về sách phù hợp hiển thị công khai chỉ bằng các trường query đã được phê duyệt.
- FR-FE01-003: Nếu không có sách công khai nào phù hợp tiêu chí tìm kiếm, hệ thống phải trả về kết quả trống kèm thông báo rõ ràng.
- FR-FE01-004: Khi Khách hoặc Thành viên xem thông tin sách, hệ thống chỉ phải trả về trường tóm tắt an toàn cho công khai và không được trả về ISBN.
- FR-FE01-005: Khi Khách hoặc Thành viên xem chi tiết sách, hệ thống phải trả về trường chi tiết sách an toàn cho công khai và không được trả về ISBN; Thủ thư/Quản trị viên đã xác thực chỉ có thể nhận ISBN từ phép chiếu dành cho nhân viên FE05.
- FR-FE01-006: Nếu sách được yêu cầu không tồn tại hoặc không hiển thị công khai, hệ thống phải trả về phản hồi không tìm thấy.
- FR-FE01-007: Khi giá trị trang hoặc hạn mức tìm kiếm không hợp lệ, hệ thống phải từ chối bằng phản hồi validation và không được âm thầm chuẩn hóa chúng.
- FR-FE01-008: Hệ thống phải suy ra tình trạng có sẵn bằng quy tắc trạng thái kho đã được phê duyệt thay vì giá trị mã hóa cứng mỗi khi chọn route sở hữu hoặc trình bày trạng thái cho Thủ thư/Quản trị viên.
- FR-FE01-009: Khi quy trình sở hữu FE06/FE07/FE08 thay đổi trạng thái bản sao, HomePage phải sử dụng trạng thái đã commit mới nhất để hiển thị cho nhân viên và định tuyến chính xác quy trình Thành viên.
- FR-FE01-010: Nếu sách không có bản sao có sẵn, HomePage cho Thủ thư/Quản trị viên có thể hiển thị `Không khả dụng`; HomePage cho Khách/Thành viên phải bỏ trạng thái mà không làm lộ barcode bản sao, vị trí hoặc dữ liệu người mượn.
- FR-FE01-011: Khi nội dung tìm kiếm trống hoặc bị bỏ qua, hệ thống phải trả về trang duyệt sách công khai mặc định với `page=1`, `limit=20` và `Title ASC, BookId ASC`.
- FR-FE01-012: Nếu ID sách không phải số nguyên dương, hệ thống phải trả về lỗi validation; nếu ID dương bị thiếu hoặc bị ẩn, hệ thống phải trả về không tìm thấy.
- FR-FE01-013: Khi thiếu dữ liệu tác giả, thể loại, nhà xuất bản hoặc ảnh bìa tùy chọn, hệ thống phải giữ sách hiển thị công khai trong phản hồi và trả về `null` cho trường bị thiếu.
- FR-FE01-014: Khi tài khoản đã xác thực mở HomePage, hệ thống phải sử dụng vai trò FE11 duy nhất của tài khoản: `MEMBER` định tuyến tới quy trình Thành viên FE07/FE08, trong khi `LIBRARIAN` hoặc `ADMIN` định tuyến tới quy trình nhân viên FE05/FE06.
- FR-FE01-015: Footer công khai phải trình bày thông tin liên hệ responsive gọn, giữ số điện thoại/email dễ đọc mà không xuống dòng desktop có thể tránh được, đồng thời mở thông tin dễ đọc, có thể đóng cho các điều khiển Quyền riêng tư, Điều khoản và lưu trữ trình duyệt mà không điều hướng tới liên kết trống.
- FR-FE01-016: Header trang chủ công khai phải hiển thị thương hiệu thư viện và hành động tài khoản mà không có các nhóm điều hướng cũ `Khám phá sách`, dịch vụ theo đối tượng, `Về thư viện` hoặc `Hỗ trợ`; hành động tiếp tục theo vai trò phải vẫn kết nối tới route sở hữu đã đăng ký thông qua vai trò duy nhất của tài khoản.
- FR-FE01-017: Trang chủ phải cung cấp thêm các phần chủ đề danh mục, hành trình thư viện và tiếp tục nhận biết vai trò có hành động tái sử dụng bộ lọc công khai hiện tại cùng route chức năng sở hữu.
- FR-FE01-018: Khách và Thành viên không được thấy huy hiệu tình trạng có sẵn trong cách hiển thị danh sách, tìm kiếm, bảng thông tin hoặc modal chi tiết của HomePage. Khách phải thấy bước tiếp tục đăng nhập chung; Thành viên phải thấy `Mượn sách này` khi `AVAILABLE` và `Đặt chỗ sách này` trong trường hợp khác, với `bookId` được chuyển tới route FE07/FE08 sở hữu. Tài khoản Thủ thư/Quản trị viên giữ trạng thái cấp cao và hành động quản lý.

---

## 8. Tiêu chí chấp nhận

- AC-FE01-001: Với một Khách, khi Khách mở trang chủ, hệ thống hiển thị các điểm vào tìm kiếm/duyệt công khai và sách công khai gần đây khi có dữ liệu danh mục; nội dung sách nổi bật không bắt buộc trong Giai đoạn 1.
- AC-FE01-002: Với các sách được phép hiển thị công khai đang tồn tại, khi Khách tìm kiếm theo từ khóa, hệ thống trả về các sách phù hợp.
- AC-FE01-003: Với trường hợp không có sách nào khớp từ khóa, khi Khách tìm kiếm, hệ thống hiển thị thông báo kết quả trống.
- AC-FE01-004: Với một sách công khai hợp lệ, khi Khách hoặc Thành viên xem thông tin sách, hệ thống hiển thị siêu dữ liệu tóm tắt không có ISBN.
- AC-FE01-005: Với một sách công khai hợp lệ, khi Khách hoặc Thành viên xem chi tiết sách từ HomePage, hệ thống hiển thị siêu dữ liệu công khai chi tiết không có ISBN hoặc nhãn tình trạng có sẵn.
- AC-FE01-006: Với ID sách không hợp lệ, khi Khách mở chi tiết, hệ thống trả về phản hồi không tìm thấy.
- AC-FE01-007: Với một sách đã ngừng kích hoạt/bị ẩn, khi Khách tìm kiếm hoặc mở chi tiết, sách không bị lộ công khai.
- AC-FE01-008: Với một yêu cầu công khai, khi hệ thống phản hồi, dữ liệu được bảo vệ về người dùng, lượt mượn, đặt chỗ, khoản phạt hoặc kiểm toán không được đưa vào.
- AC-FE01-009: Với trường hợp quy trình sở hữu xác nhận một lần chuyển trạng thái bản sao, khi Thủ thư/Quản trị viên mở HomePage thì trạng thái cấp cao mới nhất được hiển thị; Khách/Thành viên không thấy nhãn trạng thái trong khi định tuyến cho Thành viên vẫn theo trạng thái mới nhất.
- AC-FE01-010: Với một nội dung tìm kiếm trống, khi Khách gửi tìm kiếm, hệ thống trả về trang duyệt mặc định đầu tiên với `page=1`, `limit=20` và `Title ASC, BookId ASC`.
- AC-FE01-011: Với `page` hoặc `limit` không hợp lệ, khi Khách tìm kiếm, hệ thống trả về phản hồi validation và không truy vấn bằng các giá trị đã chuẩn hóa.
- AC-FE01-012: Với ID sách không phải số hoặc không dương, khi có yêu cầu xem chi tiết, hệ thống trả về phản hồi validation; ID đúng định dạng nhưng bị thiếu/bị ẩn trả về không tìm thấy.
- AC-FE01-013: Với một sách được phép hiển thị công khai nhưng thiếu siêu dữ liệu tùy chọn, khi sách được liệt kê hoặc mở, sách vẫn xuất hiện và mỗi trường bị thiếu được trả về là `null` để giao diện dự phòng an toàn.
- AC-FE01-014: Với một tài khoản có vai trò duy nhất là `LIBRARIAN` hoặc `ADMIN`, khi tài khoản mở một hành động sách công khai, sách có sẵn định tuyến tới quản lý FE05 và sách không có sẵn định tuyến tới kiểm tra kho FE06; `MEMBER` chỉ định tuyến tới các quy trình do Thành viên sở hữu.
- AC-FE01-015: Với một người dùng trên trang chủ công khai, khi footer được hiển thị, điện thoại, email và địa chỉ vẫn dễ đọc ở chiều rộng được hỗ trợ; việc chọn Quyền riêng tư, Điều khoản hoặc Cookie mở thông tin tương ứng trong hộp thoại có khả năng truy cập và có thể đóng bằng các điều khiển, nền hộp thoại hoặc phím Escape.
- AC-FE01-016: Với một Khách, Thành viên, Thủ thư hoặc Quản trị viên trên trang chủ công khai, khi header được hiển thị, không có nhóm nào trong bốn nhóm điều hướng đã loại bỏ được kết xuất trên desktop hoặc thiết bị di động, trong khi thương hiệu, hành động tài khoản và đích tiếp tục theo vai trò vẫn khả dụng.
- AC-FE01-017: Với một Khách, Thành viên, Thủ thư hoặc Quản trị viên đang xem trang chủ mở rộng, khi người dùng chọn một chủ đề hoặc hành động tiếp tục theo vai trò, danh mục được lọc hoặc người dùng được định tuyến tới màn hình hiện có hợp lệ cho đối tượng đó mà không có dữ liệu hay thành công giả lập.
- AC-FE01-018: Với cùng một sách được mỗi vai trò xem trên HomePage, Khách không thấy huy hiệu tình trạng có sẵn và thấy bước tiếp tục đăng nhập chung; Thành viên không thấy huy hiệu nhưng nhận hành động mượn FE07 hoặc đặt chỗ FE08 rõ ràng; Thủ thư/Quản trị viên thấy trạng thái cấp cao đã được phê duyệt và hành động quản lý của nhân viên.

---

## 9. Trường hợp biên và xử lý lỗi

| ID | Trường hợp biên / Lỗi | Hành vi hệ thống mong đợi |
| -- | ----------------- | ------------------------ |
| EC-FE01-001 | Từ khóa tìm kiếm trống | Trả về trang duyệt mặc định đầu tiên với `page=1`, `limit=20` và `Title ASC, BookId ASC`. |
| EC-FE01-002 | Từ khóa tìm kiếm quá dài | Từ chối với thông báo validation. |
| EC-FE01-003 | Page hoặc limit không hợp lệ | Từ chối bằng phản hồi validation trước khi truy vấn; không tự động chuẩn hóa. |
| EC-FE01-004 | ID sách không phải số nguyên dương | Trả về phản hồi validation. |
| EC-FE01-005 | Sách không tồn tại | Trả về không tìm thấy. |
| EC-FE01-006 | Sách bị ẩn/ngừng kích hoạt | Không làm lộ sách công khai. |
| EC-FE01-007 | Sách không có ảnh bìa | Hiển thị trạng thái mặc định/không có bìa. |
| EC-FE01-008 | Sách không có bản sao có sẵn | Ẩn trạng thái HomePage khỏi Khách/Thành viên; chỉ hiển thị `Không khả dụng` cho Thủ thư/Quản trị viên. |
| EC-FE01-009 | Thiếu siêu dữ liệu tùy chọn về thể loại/tác giả/nhà xuất bản/bìa | Giữ sách được phép hiển thị công khai, trả về `null` cho trường bị thiếu và để giao diện hiển thị giá trị dự phòng an toàn. ISBN không bao giờ thuộc phép chiếu công khai. |
| EC-FE01-010 | Truy vấn cơ sở dữ liệu thất bại | Trả về lỗi chung an toàn không có stack trace. |
| EC-FE01-011 | Trạng thái bản sao thay đổi ngay trước yêu cầu công khai | Trả về tóm tắt tình trạng có sẵn đã xác nhận mới nhất từ cơ sở dữ liệu. |
| EC-FE01-012 | Vai trò tài khoản là Quản trị viên hoặc Thủ thư | Không định tuyến tài khoản tới màn hình thay đổi chỉ dành cho Thành viên. |

---

## 10. Yêu cầu dữ liệu

### 10.1 Các thực thể liên quan

| Thực thể | Mục đích trong tính năng này |
| ------ | ----------------------- |
| Books | Cung cấp siêu dữ liệu sách công khai. |
| Categories | Cung cấp tên thể loại công khai. |
| Authors | Cung cấp tên tác giả công khai. |
| Publishers | Cung cấp tên nhà xuất bản công khai. |
| BookCopies | Cung cấp trạng thái tình trạng có sẵn công khai được suy ra; không làm lộ số lượng bản sao chính xác. |

### 10.2 Các trường dữ liệu

| Trường | Kiểu | Bắt buộc | Validation / Ghi chú |
| ----- | ---- | -------- | ------------------ |
| bookId | số nguyên | Có đối với chi tiết | Số nguyên dương. Định dạng không hợp lệ trả về lỗi validation; sách được tham chiếu bị thiếu/bị ẩn trả về không tìm thấy. |
| title | chuỗi | Có | Hiển thị trong tóm tắt và chi tiết công khai. |
| categoryName | chuỗi | Không | Trường lọc/hiển thị công khai; trả về `null` khi không có. |
| authorName | chuỗi | Không | Trường lọc/hiển thị công khai; trả về `null` khi không có. |
| publisherName | chuỗi | Không | Trường hiển thị công khai; trả về `null` khi không có. |
| publishYear | số nguyên | Không | Phải là năm dương lịch dạng số nguyên khi có. |
| description | chuỗi | Không | Chỉ hiển thị nội dung đã được làm sạch. |
| coverUrl | chuỗi | Không | Không được trỏ tới đường dẫn nội bộ/không an toàn; trả về `null` khi không có để giao diện có thể hiển thị trạng thái không có bìa tiêu chuẩn. |
| availabilityStatus | chuỗi | Có | Giá trị được suy ra: `AVAILABLE` (`Còn sách`) hoặc `UNAVAILABLE` (`Không khả dụng`). |
| bookStatus | chuỗi | Chỉ dùng làm bộ lọc nội bộ | Endpoint công khai phải lọc bỏ `INACTIVE`; không làm lộ bản ghi không hoạt động. |

---

## 11. Hợp đồng API / giao diện

> Các endpoint và cấu trúc yêu cầu/phản hồi dưới đây là hợp đồng chuẩn của Giai đoạn 1 cho tính năng này.

| Phương thức | Endpoint | Tác nhân | Yêu cầu | Phản hồi | Ghi chú |
| ------ | -------- | ----- | ------- | -------- | ----- |
| GET | `/api/books` | Khách/Thành viên/Thủ thư/Quản trị viên | Truy vấn: `q?, categoryId?, authorId?, publisherId?, page=1, limit=20` | `{ data: PublicBookSummary[], pagination: { page, limit, total, totalPages } }` | `q` chỉ khớp tiêu đề/tác giả. Tóm tắt công khai không có ISBN; việc xác thực không mở rộng phản hồi danh sách này. Các khóa cấp cao nhất chính xác là `data` và `pagination`; `page>=1`, `limit=1..100`; giá trị không hợp lệ bị từ chối trước khi truy vấn; `q` trống trả về kết quả duyệt mặc định. |
| GET | `/api/books/{bookId}` | Khách/Thành viên/Thủ thư/Quản trị viên | - | Chi tiết sách công khai cho Khách/Thành viên; chi tiết quản lý đã xác thực cho Thủ thư/Quản trị viên | Khách/Thành viên nhận phép chiếu an toàn FE01 không có ISBN. ISBN và các trường chỉ dành cho nhân viên khác chỉ có thể được trả về sau khi phía máy chủ xác thực vai trò FE11 duy nhất cho quản lý FE05; bản ghi không hoạt động vẫn bị ẩn khỏi Khách/Thành viên. |

---

## 12. Yêu cầu phi chức năng

### 12.1 Bảo mật

- NFR-FE01-SEC-001: Endpoint công khai phải kiểm tra tính hợp lệ của mọi tham số truy vấn và route.
- NFR-FE01-SEC-002: Phản hồi công khai cho Khách/Thành viên không được chứa ISBN, dữ liệu được bảo vệ về người dùng, lượt mượn, đặt chỗ, khoản phạt, kiểm toán hoặc kho chỉ dành cho nhân viên.
- NFR-FE01-SEC-003: Endpoint công khai không được làm lộ stack trace hoặc lỗi SQL/cơ sở dữ liệu.
- NFR-FE01-SEC-004: Nội dung hiển thị công khai phải được làm sạch hoặc escape để ngăn chèn script.

### 12.2 Hiệu năng

- NFR-FE01-PERF-001: Kết quả tìm kiếm phải được phân trang.
- NFR-FE01-PERF-002: Truy vấn tìm kiếm phải áp dụng bộ lọc từ khóa/ID và phân trang đã được phê duyệt trong truy vấn cơ sở dữ liệu trước khi hiện thực hóa các hàng; không cho phép lọc toàn bộ danh mục ở tầng ứng dụng.

### 12.3 Ghi log và kiểm toán

- NFR-FE01-LOG-001: Việc duyệt công khai chỉ đọc không yêu cầu log kiểm toán nghiệp vụ.
- NFR-FE01-LOG-002: Lỗi endpoint công khai phải được ghi log an toàn để khắc phục sự cố mà không lưu dữ liệu nhạy cảm.

### 12.4 Khả năng sử dụng

- NFR-FE01-UX-001: Trạng thái tìm kiếm trống và không có kết quả phải dễ hiểu đối với Khách.
- NFR-FE01-UX-002: Cách trình bày sách trên HomePage phải ẩn tình trạng có sẵn khỏi Khách/Thành viên và phân biệt rõ trạng thái cấp cao khi hiển thị cho Thủ thư/Quản trị viên.
- NFR-FE01-UX-003: Chi tiết liên hệ ở footer phải giữ gọn trên desktop, giữ email trên một dòng ở chiều rộng desktop được hỗ trợ và sắp xếp lại mà không tràn ngang ở chiều rộng máy tính bảng và thiết bị di động.
- NFR-FE01-UX-004: Header công khai đã đơn giản hóa phải vẫn responsive và giữ các hành động tài khoản dùng được mà không kết xuất khoảng điều hướng trống hoặc các accordion di động đã loại bỏ.
- NFR-FE01-UX-005: Các phần trang chủ mở rộng phải vẫn responsive, cung cấp phản hồi khi xuất hiện trong khung nhìn và khi tương tác, đồng thời hiển thị ngay lập tức khi có yêu cầu giảm chuyển động. Bốn thẻ lợi ích thành viên phải tạo thành lưới căn chỉnh: các thẻ trong cùng một hàng có chung cạnh trên và các cột có chiều rộng bằng nhau, không có độ lệch so le cố định.

---

## 13. Ngoài phạm vi

Tính năng này không bao gồm:

- Quy trình tạo/cập nhật/ngừng kích hoạt sách.
- Quản lý bản sao vật lý, barcode hoặc vị trí.
- Tạo yêu cầu mượn.
- Tạo/hủy đặt chỗ.
- Xác thực, đăng ký, đặt lại mật khẩu hoặc phê duyệt tư cách thành viên.
- Tính hoặc thanh toán khoản phạt.
- Dashboard quản lý của Quản trị viên/Thủ thư.
- Alias `/api/public/*` và endpoint thể loại công khai riêng.

---

## 14. Phụ thuộc

| Phụ thuộc | Loại | Ghi chú |
| ---------- | ---- | ----- |
| FE05 Quản lý sách | Nội bộ | Sở hữu siêu dữ liệu danh mục và trạng thái hoạt động/ngừng kích hoạt của sách. |
| FE06 Quản lý kho / bản sao sách | Nội bộ | Cung cấp trạng thái tình trạng có sẵn công khai mà không làm lộ số lượng bản sao chính xác. |
| FE02 Xác thực | Nội bộ | Cung cấp route đăng nhập/đăng ký cho hành động chỉ dành cho Thành viên. |
| FE04 Quản lý thành viên | Nội bộ | Xử lý đơn đăng ký tư cách thành viên sau khi khám phá công khai. |
| FE11 Quản lý người dùng và vai trò | Nội bộ | Cung cấp vai trò hiện tại duy nhất của tài khoản dùng cho hành động tài khoản công khai. |
| Cơ sở dữ liệu SQL Server | Kỹ thuật | Lưu dữ liệu danh mục sách công khai. |

---

## 15. Các câu hỏi đã giải quyết

| ID | Quyết định đã phê duyệt | Nguồn | Trạng thái |
| -- | ----------------- | ------ | ------ |
| Q-FE01-001 | Ẩn sách không hoạt động/đã ngừng kích hoạt khỏi mọi màn hình tìm kiếm/chi tiết công khai. | Gói review 2026-06-10 | APPROVED |
| Q-FE01-002 | Huy hiệu tình trạng có sẵn vẫn chỉ dành cho nhân viên. Khách nhận bước tiếp tục đăng nhập chung; Thành viên nhận hành động `Mượn sách này` hoặc `Đặt chỗ sách này` rõ ràng kết nối tới FE07/FE08 bằng `bookId` đã chọn; Thủ thư/Quản trị viên nhận trạng thái cấp cao và hành động FE05/FE06. Không làm lộ số lượng bản sao chính xác. | Hiệu chỉnh của chủ sản phẩm 2026-07-27 (thay thế quyết định nhãn hành động 2026-07-25) | APPROVED |
| Q-FE01-003 | Các trường truy vấn công khai Giai đoạn 1 chính xác là `q`, `categoryId`, `authorId`, `publisherId`, `page` và `limit`; `q` khớp tiêu đề hoặc tên tác giả không phân biệt hoa thường. | Gói review 2026-06-10; chuẩn hóa bộ lọc 2026-07-17 | APPROVED |
| Q-FE01-004 | ISBN bị loại khỏi tìm kiếm HomePage, danh sách công khai và chi tiết công khai dành cho Khách/Thành viên. ISBN vẫn là siêu dữ liệu quản lý FE05 chỉ hiển thị/tìm kiếm được với người dùng Thủ thư/Quản trị viên đã xác thực. | Hiệu chỉnh của chủ sản phẩm 2026-07-27 (thay thế gói review 2026-06-10) | APPROVED |
| Q-FE01-005 | Trang chủ hiển thị điều hướng/tìm kiếm và sách gần đây; sách nổi bật là tùy chọn/ngoài phạm vi trừ khi được cấu hình thủ công. | Gói review 2026-06-10 | APPROVED |
| Q-FE01-006 | Endpoint công khai chuẩn của Giai đoạn 1 là `/api/books` và `/api/books/{bookId}`; alias `/api/public/*` nằm ngoài phạm vi và không thuộc hợp đồng API. | Hiệu chỉnh của người dùng 2026-06-21; chuẩn hóa endpoint 2026-07-17 | APPROVED |
| Q-FE01-007 | `/home`, tìm kiếm công khai và chi tiết công khai dùng tóm tắt `BookCopies.Status` mới nhất do FE06 sở hữu sau các lần chuyển trạng thái FE06/FE07/FE08; FE01/FE05 vẫn chỉ đọc đối với trạng thái bản sao. | Nhat phê duyệt sau kiểm toán chéo tính năng 2026-07-15 | APPROVED |
| Q-FE01-008 | Nội dung tìm kiếm trống hoặc bị bỏ qua trả về trang duyệt công khai mặc định đầu tiên được sắp xếp theo `Title ASC, BookId ASC`. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE01-009 | Phân trang mặc định là `page=1`, `limit=20`; giới hạn hợp lệ là `page>=1` và `limit=1..100`; giá trị không hợp lệ bị từ chối. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE01-010 | ID sách không dương/không phải số là lỗi validation; ID đúng định dạng nhưng bị thiếu hoặc bị ẩn là không tìm thấy. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |
| Q-FE01-011 | Siêu dữ liệu danh mục tùy chọn bị thiếu trả về `null` và không bao giờ loại bỏ một sách vốn được phép hiển thị công khai. | Chuẩn hóa đặc tả 2026-07-17 | APPROVED |

---

## 16. Ma trận truy vết

| ID yêu cầu | Use case liên quan | Test case liên quan | Trạng thái |
| -------------- | ---------------- | ----------------- | ------ |
| BR-FE01-001..007 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| BR-FE01-008..012 | UC01-UC04 | `bookAvailabilityRepository.test.js`; `publicBrowseAvailability.sqltest.js`; `bookRoutes.test.js` | Hoàn thành |
| BR-FE01-013..014 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| BR-FE01-015 | UC01-UC04 | Các trường hợp Thành viên/nhân viên một vai trò trong `homeBookActions.test.js` cùng trường hợp legacy phòng vệ | Hoàn thành |
| BR-FE01-016 | UC01-UC04 | Ranh giới hiển thị tình trạng có sẵn trong `publicBrowseFrontend.test.js` | Hoàn thành |
| BR-FE01-017 | UC01 | Các nhóm header desktop/di động đã loại bỏ trong `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-001..007 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-008..010 | UC01, UC02, UC04 | `bookAvailabilityRepository.test.js`; `publicBrowseAvailability.sqltest.js`; `bookRoutes.test.js` | Hoàn thành |
| FR-FE01-011..013 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-014 | UC01-UC04 | `homeBookActions.test.js` | Hoàn thành |
| FR-FE01-015 | UC01 | Các điều khiển chính sách footer trong `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-016 | UC01 | Header đã đơn giản hóa và các đích tiếp tục theo vai trò được giữ lại trong `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-017 | UC01 | Các phần trang chủ mở rộng trong `publicBrowseFrontend.test.js` | Hoàn thành |
| FR-FE01-018 | UC01-UC04 | Cách trình bày Khách/Thành viên so với nhân viên trong `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-001..008 | UC01-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-009 | UC01, UC02 | `publicBrowseAvailability.sqltest.js`; `bookAvailabilityRepository.test.js` | Hoàn thành |
| AC-FE01-010..013 | UC02-UC04 | `publicBrowseRoutes.test.js`; `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-014 | UC01-UC04 | Các trường hợp mảng nhân viên/Thành viên legacy không hợp lệ trong `homeBookActions.test.js` | Hoàn thành |
| AC-FE01-015 | UC01 | Trường hợp hộp thoại chính sách có khả năng truy cập trong `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-016 | UC01 | Các nhóm header đã loại bỏ và hành động tài khoản/vai trò được giữ lại trong `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-017 | UC01 | Các hành động chủ đề và tiếp tục theo vai trò trong `publicBrowseFrontend.test.js` | Hoàn thành |
| AC-FE01-018 | UC01-UC04 | Các trường hợp hiển thị theo vai trò trong `publicBrowseFrontend.test.js` | Hoàn thành |

Độ bao phủ: 17/17 BR, 18/18 FR và 18/18 AC có ánh xạ bằng chứng tự động hiện hành.

---

## 17. Danh Sách Kiểm Tra Rà Soát

Danh sách kiểm tra phê duyệt Giai đoạn 1 (hoàn thành vào 2026-06-10):

- [x] Các trường hiển thị công khai đã được phê duyệt.
- [x] Bộ lọc tìm kiếm và hành vi phân trang đã được phê duyệt.
- [x] Chính sách hiển thị tình trạng có sẵn đã được phê duyệt cùng FE06.
- [x] Hành vi đối với sách bị ẩn/ngừng kích hoạt đã được phê duyệt cùng FE05.
- [x] Hợp đồng API đã được phê duyệt trong SPEC.md hoặc được sao chép sang tệp hợp đồng API dùng chung chuyên biệt nếu nhóm đưa tệp đó trở lại.
- [x] Mọi tiêu chí chấp nhận đều có thể chuyển thành test.

---

## 18. Phụ lục hành động lưu thông trung thực v0.5.0

### 18.1 Quy tắc nghiệp vụ

- BR-FE01-018: Tình trạng vật lý `availabilityStatus` không được dùng làm quyết định
  tiếp tục của Thành viên khi bản sao đang có yêu cầu FE07 hoặc lượt giữ FE08 mở.

### 18.2 Yêu cầu chức năng

- FR-FE01-019: Danh sách và chi tiết sách công khai phải bổ sung trường an toàn
  `circulationAction` với đúng bốn giá trị `BORROW`, `RESERVE`, `WAIT`,
  `UNAVAILABLE`; trường này không được làm lộ bản sao, chủ lượt giữ, vị trí hàng đợi
  hoặc danh tính Thành viên.
- FR-FE01-020: Hành động sách của Thành viên trên HomePage phải chỉ dùng
  `circulationAction`; Thủ thư/Quản trị viên tiếp tục dùng `availabilityStatus` và
  route quản lý hiện có.

### 18.3 Tiêu chí chấp nhận

- AC-FE01-019: Bản sao `AVAILABLE` đang có lượt giữ FE08 mở không tạo hành động
  mượn trực tiếp cho Thành viên.
- AC-FE01-020: Bản sao `AVAILABLE` không có yêu cầu/lượt giữ mở tạo `BORROW` và
  cùng tiêu đề xuất hiện trong danh mục ứng viên FE07.
- AC-FE01-021: Khi không có bản sao mượn ngay nhưng có bản sao `BORROWED` hoặc
  `RESERVED` hợp lệ cho FE08, hành động là `RESERVE`.
- AC-FE01-022: Khi chỉ còn trạng thái chờ xử lý, hành động `WAIT` bị vô hiệu hóa;
  khi không có đường tiếp tục, `UNAVAILABLE` bị vô hiệu hóa.

### 18.4 Truy vết triển khai cục bộ

| ID yêu cầu | Use case liên quan | Test dự kiến | Trạng thái |
| --- | --- | --- | --- |
| BR-FE01-018; FR-FE01-019; AC-FE01-019..022 | UC01-UC04 | `publicBrowseRepository.test.js`; `bookAvailabilityRepository.test.js`; `bookRoutes.test.js`; `publicBrowseRoutes.test.js` | FE01-T015 GREEN: backend tập trung `62/62` |
| FR-FE01-020; AC-FE01-019..022 | UC01-UC04 | `homeBookActions.test.js`; `publicBrowseFrontend.test.js` | FE01-T016 GREEN: frontend tập trung `22/22` |
| AC-FE01-019..022 | UC01-UC04 | `fe01-fe07-borrow-candidate-flow.spec.js` | Chromium có kiểm soát `4/4`; H2 ban đầu và CI PR #102 đã đạt, chờ H2 bổ sung cho diff khắc phục H3 |
