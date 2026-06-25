# Tổng quan Hệ thống Quản lý Thư viện

Tài liệu này là bản tổng hợp cấp cao bằng tiếng Việt về Hệ thống Quản lý Thư viện trong phạm vi Phase 1. Nội dung được diễn giải từ các `SPEC.md`, `CONTEXT.md` và constitution hiện có để phục vụ người đọc, giảng viên, hội đồng và phần thuyết trình. Tài liệu này không thay thế spec; các spec tiếng Anh trong `.sdd/specs/feat-*/SPEC.md` vẫn là nguồn sự thật duy nhất.

## 1. Giới thiệu hệ thống

Hệ thống Quản lý Thư viện hỗ trợ thư viện quản lý vòng đời sách, bản sao sách, thành viên, mượn - trả, đặt chỗ, phí phạt, thông báo, tài khoản người dùng và báo cáo vận hành. Mục tiêu tổng thể là giảm thao tác thủ công, tăng độ chính xác dữ liệu và giúp Thủ thư / Quản trị viên theo dõi tình trạng sách cũng như hoạt động sử dụng thư viện.

Phạm vi Phase 1 tập trung vào các nghiệp vụ cốt lõi: tra cứu sách công khai, xác thực tài khoản, hồ sơ người dùng, tư cách thành viên, quản lý sách, quản lý bản sao sách, mượn sách, đặt chỗ, phí phạt, thông báo, vai trò người dùng và báo cáo thống kê. Các tính năng được tách thành 12 spec độc lập để dễ phân công, nhưng vẫn liên kết với nhau thông qua xác thực, dữ liệu sách, trạng thái kho sách, tư cách thành viên, phí phạt và quyền truy cập.

Đối tượng người dùng chính gồm:

- Khách (Guest): người chưa đăng nhập, có thể xem và tìm kiếm thông tin sách công khai.
- Thành viên (Member): người dùng đã đăng ký / đăng nhập, có thể quản lý hồ sơ cá nhân, xin tư cách thành viên, mượn sách, đặt chỗ và xem thông tin liên quan đến mình.
- Thủ thư (Librarian): nhân sự thư viện xử lý sách, kho sách, mượn - trả, đặt chỗ, phí phạt và một số báo cáo nghiệp vụ.
- Quản trị viên (Admin): người quản lý hệ thống, có quyền cao nhất với tài khoản, vai trò, dữ liệu nghiệp vụ và báo cáo được phê duyệt.

## 2. Kiến trúc & nguyên tắc chung

- Hệ thống sử dụng kiến trúc web với Backend `Node.js + Express.js`, Frontend `React + Bootstrap`, cơ sở dữ liệu `SQL Server` và API kiểu `RESTful API`.
- Dự án đi theo hướng Hybrid Spec-Driven & Agent-Driven Development: nghiệp vụ, bảo mật, API và dữ liệu phải bám theo spec; AI/agent chỉ hỗ trợ soạn, kiểm thử, triển khai và rà soát.
- Mỗi tính năng cốt lõi có `SPEC.md` làm nguồn sự thật. Nếu code khác spec, mặc định code là sai cho đến khi spec được cập nhật và phê duyệt.
- Hệ thống phải xác thực và phân quyền cho mọi hành động được bảo vệ. Quyền của người dùng được kiểm tra ở server, không chỉ dựa vào giao diện.
- Dữ liệu đầu vào phải được validate; thao tác database phải dùng ORM hoặc truy vấn có tham số để giảm rủi ro SQL injection.
- Không được hardcode hoặc commit mật khẩu, API key, token, private key, database credential hay dữ liệu nhạy cảm.
- Các hành động quan trọng như đăng nhập, đổi mật khẩu, quản lý người dùng, quản lý sách, mượn - trả và phí phạt cần có audit log để phục vụ truy vết.
- Các spec ưu tiên giữ dữ liệu nghiệp vụ bằng trạng thái như `INACTIVE`, `DELETED`, `AVAILABLE`, `BORROWED`, `RESERVED` thay vì xóa vật lý tùy tiện; ví dụ tài khoản không bị xóa vĩnh viễn mà được deactivated, bản sao sách cũng được quản lý bằng trạng thái.
- Các nghiệp vụ quan trọng như mượn sách, trả sách và tính phí phạt phải có test vì ảnh hưởng trực tiếp đến tính đúng đắn của hệ thống.

## 3. Danh sách 12 tính năng

| Mã | Tên tính năng (Việt) | Mức độ phạm vi | Mô tả 1 dòng |
| --- | --- | --- | --- |
| FE01 | Tra cứu công khai | Standard | Cho phép Khách và Thành viên tìm kiếm, xem thông tin sách công khai ở chế độ chỉ đọc. |
| FE02 | Xác thực | Full | Quản lý đăng ký, xác minh email, đăng nhập, token/phiên, đổi mật khẩu và đặt lại mật khẩu. |
| FE03 | Hồ sơ người dùng | Standard | Cho phép người dùng đã đăng nhập xem và cập nhật các trường hồ sơ cá nhân được phép. |
| FE04 | Quản lý tư cách thành viên | Standard | Quản lý quy trình nộp, duyệt, từ chối và xem trạng thái tư cách thành viên. |
| FE05 | Quản lý sách | Standard | Quản lý metadata của sách như tên, ISBN, danh mục và trạng thái hiển thị / sử dụng. |
| FE06 | Quản lý kho sách / bản sao sách | Full | Quản lý từng bản sao vật lý, mã vạch, vị trí và trạng thái mượn / đặt chỗ / hư hỏng. |
| FE07 | Quản lý mượn sách | Full | Xử lý yêu cầu mượn, duyệt mượn, trả sách, gia hạn và lịch sử mượn. |
| FE08 | Quản lý đặt chỗ | Standard | Cho phép Thành viên đặt chỗ sách chưa sẵn có và quản lý hàng đợi đặt chỗ. |
| FE09 | Quản lý phí phạt | Full | Tính, ghi nhận và theo dõi phí phạt quá hạn dựa trên dữ liệu mượn - trả. |
| FE10 | Quản lý thông báo | Standard | Tạo, gửi và theo dõi thông báo từ các sự kiện tài khoản, đặt chỗ, hạn trả và phí phạt. |
| FE11 | Quản lý người dùng & vai trò | Full | Cho phép Admin quản lý tài khoản, vai trò, trạng thái người dùng và tài khoản Thủ thư. |
| FE12 | Báo cáo & thống kê | Standard | Cung cấp báo cáo chỉ đọc về mượn sách, kho sách, người dùng và các số liệu liên quan. |

## 4. Mô tả chi tiết từng tính năng

### FE01 - Tra cứu công khai

FE01 giúp người chưa đăng nhập tìm hiểu thư viện trước khi đăng ký hoặc xin tư cách thành viên. Tính năng này cho phép Khách xem trang chủ, tìm kiếm danh mục sách và xem thông tin sách công khai. Thành viên đã đăng nhập cũng có thể dùng cùng các chức năng tra cứu, nhưng mọi hành động như mượn, đặt chỗ hoặc chỉnh sửa sách thuộc feature khác.

Tác nhân chính là Khách và Thành viên. Khách được xem dữ liệu công khai; Thủ thư và Quản trị viên không có quyền ghi đặc biệt trong FE01 vì quản lý sách thuộc FE05, quản lý bản sao sách thuộc FE06. Luồng chính gồm xem trang chủ, tìm kiếm sách, xem thông tin tóm tắt và xem chi tiết sách.

Quy tắc quan trọng: FE01 là read-only; chỉ hiển thị sách public-visible; input tìm kiếm phải được validate; kết quả cần hỗ trợ pagination; phản hồi công khai không được lộ dữ liệu người dùng, bản ghi mượn, hàng đợi đặt chỗ, phí phạt, audit log hay trường nội bộ. Nếu hiển thị availability, dữ liệu phải lấy từ FE06.

Ngoài phạm vi: tạo/sửa/xóa sách, quản lý bản sao sách, tạo yêu cầu mượn, đặt chỗ, xác thực, duyệt thành viên, phí phạt và dashboard quản trị.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-public-browse/SPEC.md`

### FE02 - Xác thực

FE02 là nền tảng bảo mật vì mọi tính năng được bảo vệ đều cần biết người dùng là ai và phiên đăng nhập có hợp lệ không. Tính năng này quản lý đăng ký, xác minh email, đăng nhập, đăng xuất, đổi mật khẩu, quên/đặt lại mật khẩu và kiểm tra token/phiên cho protected request.

Tác nhân gồm Khách, Thành viên, Thủ thư, Quản trị viên, Email Service và Audit Logger. Khách có thể đăng ký, đăng nhập và yêu cầu reset mật khẩu. Người dùng đã đăng nhập có thể đăng xuất, đổi mật khẩu và truy cập đúng vai trò. Email Service gửi link xác minh/reset; Audit Logger ghi sự kiện xác thực.

Luồng chính gồm registration với email verification, chuyển tài khoản sang `ACTIVE`, login bằng email/username và password, xử lý failed login, logout và revoke token, change password, forgot/reset password, validate session/token trên mỗi protected API request.

Quy tắc quan trọng: password phải hash bằng `bcrypt`; không lưu/truyền plaintext password; lỗi login không làm lộ email có tồn tại hay không; failed login cần theo dõi và có thể lock account; token/phiên có expiry và invalidated khi logout; mọi request bảo vệ phải validate token; sự kiện xác thực phải auditable; login/password/token phải đi qua HTTPS.

Ngoài phạm vi: MFA/2FA, OAuth/OpenID Connect, LDAP/Active Directory, social login, SSO, biometric authentication và phần quản trị người dùng của FE11.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-auth/SPEC.md`

### FE03 - Hồ sơ người dùng

FE03 giúp Thành viên, Thủ thư và Quản trị viên xem/cập nhật thông tin cá nhân của chính mình để thư viện có dữ liệu liên hệ chính xác. Tính năng này chỉ xử lý hồ sơ cá nhân, không can thiệp credential, vai trò, trạng thái tài khoản hay membership approval.

Tác nhân chính là người dùng đã đăng nhập. Thành viên, Thủ thư và Quản trị viên có thể xem/cập nhật hồ sơ của mình và upload avatar nếu thỏa điều kiện. Việc sửa hồ sơ người khác thuộc FE11. Khách không được truy cập.

Luồng chính gồm xem hồ sơ, cập nhật trường được phép và upload avatar. Dữ liệu phải validate ở server; request không hợp lệ không được cập nhật một phần. Avatar upload yêu cầu xác thực, chỉ cập nhật hồ sơ hiện tại, giới hạn file/dung lượng và dùng filename do server tạo.

Quy tắc quan trọng: người dùng chỉ xem/sửa hồ sơ của chính mình; không trả về `passwordHash` hoặc credential secret; FE03 không sửa password, role, account status hay membership approval; profile data chỉ trả về cho actor được phép.

Ngoài phạm vi: login/logout/registration, reset mật khẩu, xác minh hoặc đổi email nếu FE02 chưa duyệt, tạo/deactivate user, gán role, duyệt thành viên, lịch sử mượn/đặt chỗ/phí phạt.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-user-profile/SPEC.md`

### FE04 - Quản lý tư cách thành viên

FE04 tách việc có tài khoản đăng nhập khỏi việc được công nhận là Thành viên. Một user có thể đã đăng ký nhưng vẫn cần được duyệt membership trước khi mượn sách, đặt chỗ hoặc dùng dịch vụ dành cho thành viên. Việc tách này giúp xác thực, phân quyền và phê duyệt nghiệp vụ rõ ràng hơn.

Tác nhân gồm Khách, Member Applicant, Member, Thủ thư và Quản trị viên. Khách chưa đăng nhập không thể nộp đơn. User đã đăng ký có thể nộp đơn và xem trạng thái của mình. Thủ thư hoặc Quản trị viên có thể duyệt/từ chối đơn nếu chính sách cho phép.

Luồng chính gồm apply for membership, approve application, reject application và view membership status. Đơn mới bắt đầu với `PENDING`; chỉ đơn `PENDING` mới được approve/reject. Khi approve cần ghi thời điểm; khi reject có thể ghi lý do nếu schema được duyệt.

Quy tắc quan trọng: chỉ user đã xác thực và đủ điều kiện mới được nộp đơn; một user không có nhiều đơn `PENDING`; user đã approve không nộp lại nếu renewal/re-application chưa được duyệt; người dùng chỉ xem trạng thái của mình; membership status phục vụ FE07/FE08 kiểm tra điều kiện; thao tác approve/reject cần truy vết.

Ngoài phạm vi: đăng ký/login, password/token, sửa hồ sơ, gán role, deactivate tài khoản, thực thi mượn/trả/gia hạn/đặt chỗ, tính phí phạt và thanh toán membership.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-membership-management/SPEC.md`

### FE05 - Quản lý sách

FE05 quản lý metadata sách: tên sách, ISBN, danh mục và thông tin mô tả phục vụ tra cứu, kho sách, mượn sách, đặt chỗ và báo cáo. Nếu dữ liệu sách sai, các nghiệp vụ như tìm kiếm, inventory, borrowing, reservation và reporting đều có thể bị ảnh hưởng.

Tác nhân gồm Khách, Thành viên, Thủ thư và Quản trị viên. Khách và Thành viên chỉ được tìm kiếm và xem chi tiết sách. Thủ thư và Quản trị viên được xem danh sách quản trị, thêm sách, cập nhật thông tin sách và deactivate sách khi cần. FE05 không quản lý từng bản sao vật lý; phần đó thuộc FE06.

Luồng chính gồm search books, view book details, view book list, add book, update book information và deactivate book. Các hành động ghi dữ liệu cần được kiểm soát bằng vai trò và ghi audit.

Quy tắc quan trọng: Guest/Member chỉ được đọc; chỉ Librarian/Admin được thêm, sửa hoặc deactivate sách; ISBN phải unique; title là bắt buộc; Phase 1 mỗi sách thuộc đúng một category; sách bị deactivate không được mượn và không nên xuất hiện trong public search; mọi create/update/deactivate phải auditable.

Ngoài phạm vi: quản lý barcode/vị trí/bản sao vật lý, mượn/trả/gia hạn, hàng đợi đặt chỗ, tính phí hoặc thanh toán, thiết kế trang chủ công khai, quản lý user/role/membership, bulk import/export nếu chưa được duyệt.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-book-management/SPEC.md`

### FE06 - Quản lý kho sách / bản sao sách

FE06 quản lý từng bản sao vật lý của sách, vì danh mục chỉ cho biết thư viện có đầu sách nào, còn mượn/trả phụ thuộc vào từng copy. Mỗi bản sao cần barcode duy nhất, vị trí và status như `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST` hoặc `INACTIVE`. Đây là nguồn dữ liệu cho tra cứu, mượn sách, đặt chỗ, phí phạt và báo cáo.

Tác nhân chính là Thủ thư và Quản trị viên. Họ có thể xem inventory, kiểm tra trạng thái, thêm/cập nhật/deactivate bản sao. Thành viên và Khách chỉ thấy availability qua FE01/FE05. FE07 cập nhật copy status khi mượn/trả; FE08 dùng status khi đặt chỗ.

Luồng chính gồm view inventory, check book copy status, update availability/status và manage book copies. Thay đổi trạng thái phải tránh xung đột với bản ghi mượn hoặc đặt chỗ active.

Quy tắc quan trọng: chỉ Librarian/Admin quản lý trực tiếp bản sao; mỗi bản sao thuộc một book hiện có; barcode phải unique; chỉ `AVAILABLE` mới borrow-available; `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE` không được tính là available; deactivate là status-based; FE06 không sửa metadata sách và không duyệt mượn/trả/đặt chỗ.

Ngoài phạm vi: quản lý title/ISBN/author/category/publisher, duyệt mượn hoặc trả sách, xử lý hàng đợi đặt chỗ, tính phí lost/damaged/overdue, UI public browse và tích hợp phần cứng RFID/QR ngoài việc lưu/scan barcode text.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-inventory-book-copy/SPEC.md`

### FE07 - Quản lý mượn sách

FE07 là nghiệp vụ lưu thông chính: Thành viên tạo yêu cầu mượn, Thủ thư hoặc Quản trị viên duyệt/từ chối, bản sao được bàn giao, sau đó được trả hoặc gia hạn nếu chính sách cho phép. Dữ liệu mượn ảnh hưởng đến inventory, reservation, fine, report và audit history, nên feature này thuộc mức Full.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Khách và Notification Service. Thành viên có thể tạo borrow request cho chính mình, xem lịch sử mượn và yêu cầu gia hạn nếu hợp lệ. Thủ thư/Quản trị viên xử lý yêu cầu, duyệt/từ chối, bàn giao và nhận trả. Khách không có quyền mượn.

Luồng chính gồm create borrow request, approve and process borrow request, reject borrow request, process return request, renew borrowed books và view borrowing history.

Quy tắc quan trọng: Thành viên phải có account `ACTIVE` và membership approved; không quá 5 bản sao đang mượn active; overdue loan hoặc fine `UNPAID` lớn hơn 0 chặn mượn/gia hạn; copy chỉ mượn khi `BookCopies.Status = AVAILABLE`; khi duyệt phải recheck availability và eligibility; copy mượn chuyển sang `BORROWED`; hạn trả mặc định 14 ngày; mỗi borrow detail gia hạn tối đa 1 lần; FE07 cung cấp dữ liệu cho FE09, không tự tạo fine.

Ngoài phạm vi: triển khai FE08 ngoài việc đọc reservation khi kiểm tra gia hạn, tính phí FE09, gửi notification FE10, payment gateway, RFID/QR hardware và đặt chỗ ghế học.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-borrowing-management/SPEC.md`

### FE08 - Quản lý đặt chỗ

FE08 xử lý tình huống sách chưa sẵn có nhưng Thành viên muốn xếp hàng chờ. Tính năng này đảm bảo công bằng, tránh nhầm lẫn khi nhiều người muốn cùng một sách, và giúp Thủ thư theo dõi hàng đợi để thông báo cho người tiếp theo.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Khách và Notification Service. Thành viên có thể tạo đặt chỗ, hủy đặt chỗ của chính mình và xem trạng thái. Thủ thư/Quản trị viên xem danh sách đặt chỗ, xử lý queue, release/expire reservation nếu được phép. Khách không được đặt chỗ.

Luồng chính gồm reserve book, cancel reservation, view reservation list, process reservation queue và trigger book available notification. Khi một bản sao được giữ cho Thành viên, FE08 cần yêu cầu FE10 gửi thông báo, nhưng FE10 mới là nơi thực hiện gửi.

Quy tắc quan trọng: chỉ user đã xác thực và membership approved mới đặt chỗ; không tạo duplicate active reservation cho cùng target; queue giữ thứ tự `ReservedAt` nếu chưa có chính sách ưu tiên; reservation `CANCELLED` hoặc `EXPIRED` không được chọn; copy held cho người khác không được mượn bình thường; active reservation/held copy của người khác chặn FE07 renewal cho cùng target; status change cần truy vết.

Ngoài phạm vi: approve/return của FE07, gửi notification thực tế của FE10, tính phí, online payment, study seat reservation và các priority rule phức tạp nếu chưa được duyệt.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-reservation-management/SPEC.md`

### FE09 - Quản lý phí phạt

FE09 cung cấp cách tính và ghi nhận phí phạt minh bạch khi sách trả quá hạn hoặc vi phạm chính sách. Phí phạt ảnh hưởng đến quyền mượn tiếp, xử lý của Thủ thư và dữ liệu báo cáo, nên logic phải nhất quán, truy vết được và tránh tính trùng.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Borrowing Feature và Notification Feature. Thành viên chỉ xem fine của mình. Thủ thư/Quản trị viên xem fine của mọi Thành viên, tính/confirm fine, ghi nhận thu tiền và mark paid. FE07 cung cấp due date, return date và overdue data; FE10 gửi thông báo khi có yêu cầu.

Luồng chính gồm view fine information, calculate fine, record fine collection và mark fine as paid.

Quy tắc quan trọng: Khách không xem/quản lý fine; Member chỉ xem fine của mình; chỉ Librarian/Admin ghi nhận thu hoặc mark paid; Phase 1 tính 5.000 VND/ngày quá hạn/bản sao, từ ngày sau due date; fine calculation dùng server-side date và due/return date đã lưu; client không gửi fine amount để tính; không có duplicate active overdue fine cho cùng borrow detail/reason; fine `UNPAID` lớn hơn 0 chặn mượn/gia hạn; khi paid phải set `PAID` và `PaidAt`.

Ngoài phạm vi: duyệt mượn, xử lý trả sách, gán hạn trả, quản lý tình trạng bản sao, payment gateway online, gửi notification, dashboard báo cáo và duyệt membership.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-fine-management/SPEC.md`

### FE10 - Quản lý thông báo

FE10 là trung tâm tạo, gửi, lưu và theo dõi thông báo từ sự kiện tài khoản và nghiệp vụ thư viện. Nếu thông báo không đáng tin cậy, người dùng có thể bỏ lỡ xác minh tài khoản, reset mật khẩu, sách đặt chỗ sẵn sàng, hạn trả, quá hạn hoặc phí phạt. FE10 nhận yêu cầu từ feature nguồn; quyết định nghiệp vụ vẫn thuộc feature nguồn.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Source Feature, Notification Worker, Email Provider và Khách. Thành viên nhận email hoặc in-app notification cho đặt chỗ, hạn trả, quá hạn và phí phạt. Khách có thể nhận email xác minh tài khoản hoặc reset password.

Luồng chính gồm gửi thông báo xác minh tài khoản, reset mật khẩu, sách đặt chỗ sẵn sàng, hạn trả hoặc phí phạt. Notification status gồm `PENDING`, `SENT`, `DELIVERED`, `FAILED` hoặc `SKIPPED`.

Quy tắc quan trọng: FE10 không quyết định business event; phải validate notification type, channel, template key, recipient và template data; không tạo/validate token xác thực; không log raw token, provider credential hoặc stack trace; request trùng idempotency key không tạo duplicate active notification; delivery failure được ghi nhận nhưng không rollback transaction nguồn; email provider credential phải ở ngoài source code.

Ngoài phạm vi: SMS, push mobile, marketing/newsletter, online payment notification, token generation/validation, fine calculation, quyết định queue đặt chỗ, duyệt mượn/trả, inbox UI, retry/log/template editor và lưu credential thật trong repo.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-notification-management/SPEC.md`

### FE11 - Quản lý người dùng & vai trò

FE11 cho phép Quản trị viên quản lý vòng đời tài khoản và phân quyền. Đây là feature cốt lõi vì dữ liệu user/role sai có thể phá vỡ access control hoặc lộ dữ liệu nhạy cảm. FE11 quản lý user ở cấp admin; self-service registration thuộc FE02, profile cá nhân thuộc FE03.

Tác nhân gồm Quản trị viên, Thủ thư, Thành viên, Khách và Audit Logger. Chỉ Admin được xem user, tạo tài khoản Member/Librarian, cập nhật thông tin, deactivate user/librarian và manage roles. Librarian/Member không quản lý người dùng khác.

Luồng chính gồm view user list, view user information, create/update/deactivate user account, create/update/deactivate librarian account và manage roles.

Quy tắc quan trọng: chỉ authenticated Admin truy cập user management; user không bị xóa vĩnh viễn mà set `INACTIVE`; email phải unique; account do Admin tạo bắt đầu `ACTIVE` nhưng login bằng password chỉ khả dụng sau setup qua FE02; deactivate user phải vô hiệu hóa session/token active; mỗi user cần ít nhất một role; hỗ trợ multiple roles; không được xóa toàn bộ Admin role nếu chỉ còn một Admin; Admin không nhập/xem/tạo password trực tiếp; mọi role/user change phải auditable.

Ngoài phạm vi: user tự sửa profile, user tự reset password, admin reset password nếu chưa bổ sung, unlock sau lockout, reactivate account nếu chưa duyệt, xóa vĩnh viễn, bulk CSV import, báo cáo theo role, self-registration, LDAP/Active Directory và SSO.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-user-role-management/SPEC.md`

### FE12 - Báo cáo & thống kê

FE12 cung cấp góc nhìn tổng hợp để Thủ thư và Quản trị viên hiểu tình hình thư viện: lượng mượn, sách đã trả/quá hạn, trạng thái kho sách, thống kê người dùng/thành viên và vận hành. Đây là feature read-only; dữ liệu nghiệp vụ do feature nguồn tạo.

Tác nhân gồm Thủ thư, Quản trị viên, Thành viên, Khách và Source Features. Thủ thư xem báo cáo vận hành nếu được phê duyệt. Quản trị viên xem toàn bộ báo cáo được duyệt và user statistics. Thành viên và Khách không có quyền truy cập báo cáo nội bộ.

Luồng chính gồm view borrowing report, view inventory report và view user statistics. Bộ lọc báo cáo phải được validate; date range phải có start/end hợp lệ.

Quy tắc quan trọng: report read-only và không sửa dữ liệu nguồn; quyền truy cập bảo vệ ở server; borrowing report lấy FE07 làm source of truth; inventory report lấy FE06/`BookCopies`; user statistics lấy FE11/Users/Roles; membership statistics nếu hiển thị lấy FE04; trạng thái dùng định nghĩa từ feature nguồn; user statistics không lộ dữ liệu cá nhân không cần thiết; aggregate count phải tái tạo được.

Ngoài phạm vi: sửa bản ghi mượn/kho/user/membership/fine/reservation, xử lý mượn/trả, quản lý bản sao sách, quản lý user/role, tính hoặc thu fine, BI/analytics warehouse bên ngoài, CSV/PDF export nếu chưa duyệt và real-time dashboard nếu chưa duyệt.

Spec gốc (nguồn sự thật): `.sdd/specs/feat-reporting-statistics/SPEC.md`

## 5. Mối liên hệ giữa các tính năng

Các tính năng được tách spec để dễ quản lý nhưng không vận hành độc lập. FE02 cung cấp xác thực và phiên đăng nhập cho hầu hết tính năng được bảo vệ; FE11 cung cấp vai trò và quyền để kiểm soát hành động của Admin, Thủ thư và Thành viên. FE01 đọc metadata sách từ FE05 và trạng thái khả dụng công khai từ FE06. FE04 quyết định tư cách thành viên, là điều kiện quan trọng để FE07 cho mượn và FE08 cho đặt chỗ.

Nghiệp vụ mượn sách là điểm giao giữa nhiều feature: FE07 cần tài khoản hợp lệ từ FE02, membership hợp lệ từ FE04, copy `AVAILABLE` từ FE06, kiểm tra reservation từ FE08 khi gia hạn và kiểm tra fine chưa thanh toán từ FE09. Khi mượn/trả/gia hạn thay đổi trạng thái, dữ liệu đó tiếp tục phục vụ FE09 tính phí, FE10 gửi thông báo và FE12 tổng hợp báo cáo. FE10 không tự quyết định nghiệp vụ mà chỉ xử lý yêu cầu thông báo từ FE02, FE07, FE08 và FE09. FE12 là lớp tổng hợp cuối, đọc dữ liệu từ các feature nguồn nhưng không sửa record nghiệp vụ.
