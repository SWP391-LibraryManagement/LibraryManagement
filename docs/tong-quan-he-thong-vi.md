# Tổng quan Hệ thống Quản lý Thư viện

Tài liệu này là bản tổng hợp cấp cao bằng tiếng Việt về Hệ thống Quản lý Thư viện trong phạm vi Giai
đoạn 1. Nội dung được diễn giải từ các `SPEC.md`, `CONTEXT.md` và Hiến chương hiện có để phục vụ
người đọc, giảng viên, hội đồng và phần thuyết trình. Tài liệu này không thay thế đặc tả; các
`SPEC.md` trong `.sdd/specs/feat-*/` vẫn là nguồn chuẩn duy nhất.

## 1. Giới thiệu hệ thống

Hệ thống Quản lý Thư viện hỗ trợ thư viện quản lý vòng đời sách, bản sao sách, thành viên, mượn - trả, đặt chỗ, phí phạt, thông báo, tài khoản người dùng và báo cáo vận hành. Mục tiêu tổng thể là giảm thao tác thủ công, tăng độ chính xác dữ liệu và giúp Thủ thư / Quản trị viên theo dõi tình trạng sách cũng như hoạt động sử dụng thư viện.

Phạm vi giai đoạn 1 tập trung vào các nghiệp vụ cốt lõi: tra cứu sách công khai, xác thực tài khoản,
hồ sơ người dùng, tư cách thành viên, quản lý sách, quản lý bản sao sách, mượn sách, đặt chỗ, phí
phạt, thông báo, vai trò người dùng và báo cáo thống kê. Các chức năng được tách thành 12 đặc tả độc
lập để dễ phân công, nhưng vẫn liên kết với nhau thông qua xác thực, dữ liệu sách, trạng thái kho
sách, tư cách thành viên, phí phạt và quyền truy cập.

Đối tượng người dùng chính gồm:

- Khách: người chưa đăng nhập, có thể xem và tìm kiếm thông tin sách công khai.
- Thành viên: người dùng đã đăng ký/đăng nhập, có thể quản lý hồ sơ cá nhân, xin tư cách thành viên, mượn sách, đặt chỗ và xem thông tin liên quan đến mình.
- Thủ thư: nhân sự thư viện xử lý sách, kho sách, mượn - trả, đặt chỗ, phí phạt và một số báo cáo nghiệp vụ.
- Quản trị viên: người quản lý hệ thống, có quyền cao nhất với tài khoản, vai trò, dữ liệu nghiệp vụ và báo cáo được phê duyệt.

## 2. Kiến trúc & nguyên tắc chung

- Hệ thống sử dụng kiến trúc web với máy chủ `Node.js + Express.js`, giao diện `React + Bootstrap`, cơ sở dữ liệu `SQL Server` và API kiểu `RESTful API`.
- Dự án áp dụng Phát triển Hướng Đặc tả kết hợp Phát triển Hướng Tác nhân: nghiệp vụ, bảo mật, API và dữ liệu phải bám theo đặc tả; AI/tác nhân chỉ hỗ trợ soạn thảo, kiểm thử, triển khai và rà soát.
- Mỗi chức năng cốt lõi có `SPEC.md` làm nguồn chuẩn. Nếu mã nguồn khác đặc tả, mặc định mã nguồn là sai cho đến khi đặc tả được cập nhật và phê duyệt.
- Hệ thống phải xác thực và phân quyền cho mọi hành động được bảo vệ. Quyền của người dùng được kiểm tra ở máy chủ, không chỉ dựa vào giao diện.
- Dữ liệu đầu vào phải được kiểm tra hợp lệ; thao tác cơ sở dữ liệu phải dùng ORM hoặc truy vấn có tham số để giảm rủi ro chèn lệnh SQL.
- Không được mã hóa cứng hoặc commit mật khẩu, khóa API, mã thông báo, khóa riêng, thông tin xác thực cơ sở dữ liệu hay dữ liệu nhạy cảm.
- Các hành động quan trọng như đăng nhập, đổi mật khẩu, quản lý người dùng, quản lý sách, mượn - trả và phí phạt cần có nhật ký kiểm toán để phục vụ truy vết.
- Các đặc tả ưu tiên giữ dữ liệu nghiệp vụ bằng trạng thái như `INACTIVE`, `DELETED`, `AVAILABLE`, `BORROWED`, `RESERVED` thay vì xóa vật lý tùy tiện; ví dụ tài khoản không bị xóa vĩnh viễn mà được vô hiệu hóa, bản sao sách cũng được quản lý bằng trạng thái.
- Các nghiệp vụ quan trọng như mượn sách, trả sách và tính phí phạt phải có kiểm thử vì ảnh hưởng trực tiếp đến tính đúng đắn của hệ thống.

## 3. Danh sách 12 chức năng

| Mã | Tên chức năng (Việt) | Mức độ phạm vi | Mô tả 1 dòng |
| --- | --- | --- | --- |
| FE01 | Tra cứu công khai | tiêu chuẩn | Cho phép Khách và Thành viên tìm kiếm, xem thông tin sách công khai ở chế độ chỉ đọc. |
| FE02 | Xác thực | đầy đủ | Quản lý đăng ký, xác minh email, đăng nhập, mã thông báo/phiên, đổi mật khẩu và đặt lại mật khẩu. |
| FE03 | Hồ sơ người dùng | tiêu chuẩn | Cho phép người dùng đã đăng nhập xem và cập nhật các trường hồ sơ cá nhân được phép. |
| FE04 | Quản lý tư cách thành viên | tiêu chuẩn | Quản lý quy trình nộp, duyệt, từ chối và xem trạng thái tư cách thành viên. |
| FE05 | Quản lý sách | tiêu chuẩn | Quản lý siêu dữ liệu của sách như tên, ISBN, danh mục và trạng thái hiển thị / sử dụng. |
| FE06 | Quản lý kho sách / bản sao sách | đầy đủ | Quản lý từng bản sao vật lý, mã vạch, vị trí và trạng thái mượn / đặt chỗ / hư hỏng. |
| FE07 | Quản lý mượn sách | đầy đủ | Xử lý yêu cầu mượn, duyệt mượn, trả sách, gia hạn và lịch sử mượn. |
| FE08 | Quản lý đặt chỗ | tiêu chuẩn | Cho phép Thành viên đặt chỗ sách chưa sẵn có và quản lý hàng đợi đặt chỗ. |
| FE09 | Quản lý phí phạt | đầy đủ | Tính, ghi nhận và theo dõi phí phạt quá hạn dựa trên dữ liệu mượn - trả. |
| FE10 | Quản lý thông báo | tiêu chuẩn | Tạo, gửi và theo dõi thông báo từ các sự kiện tài khoản, đặt chỗ, hạn trả và phí phạt. |
| FE11 | Quản lý người dùng & vai trò | đầy đủ | Cho phép quản trị viên quản lý tài khoản, vai trò, trạng thái người dùng và tài khoản Thủ thư. |
| FE12 | Báo cáo và thống kê | tiêu chuẩn | Cung cấp báo cáo chỉ đọc về mượn sách, kho sách, người dùng và các số liệu liên quan. |

## 4. Mô tả chi tiết từng chức năng

### FE01 - Tra cứu công khai

FE01 giúp người chưa đăng nhập tìm hiểu thư viện trước khi đăng ký hoặc xin tư cách thành viên. Chức
năng này cho phép Khách xem trang chủ, tìm kiếm danh mục sách và xem thông tin sách công khai. Thành
viên đã đăng nhập cũng có thể dùng cùng các chức năng tra cứu, nhưng mọi hành động như mượn, đặt chỗ
hoặc chỉnh sửa sách thuộc chức năng khác.

Tác nhân chính là Khách và Thành viên. Khách được xem dữ liệu công khai; Thủ thư và Quản trị viên không có quyền ghi đặc biệt trong FE01 vì quản lý sách thuộc FE05, quản lý bản sao sách thuộc FE06. Luồng chính gồm xem trang chủ, tìm kiếm sách, xem thông tin tóm tắt và xem chi tiết sách.

Quy tắc quan trọng: FE01 là chỉ đọc; khách/thành viên chỉ tìm theo tên sách hoặc tác giả và phản
hồi danh sách/chi tiết công khai không chứa ISBN; chỉ hiển thị sách được phép công khai; dữ liệu tìm
kiếm phải được kiểm tra hợp lệ; kết quả cần hỗ trợ phân trang; phản hồi công khai không được lộ dữ liệu người
dùng, bản ghi mượn, hàng đợi đặt chỗ, phí phạt, nhật ký kiểm toán hay trường nội bộ. Nếu hiển thị
tình trạng sẵn có, dữ liệu phải lấy từ FE06. ISBN thuộc FE05 và chỉ thủ thư/quản trị viên đã được FE11
xác thực vai trò mới được xem/tìm trong giao diện quản lý.

Ngoài phạm vi: tạo/sửa/xóa sách, quản lý bản sao sách, tạo yêu cầu mượn, đặt chỗ, xác thực, duyệt
thành viên, phí phạt và bảng điều khiển quản trị.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-public-browse/SPEC.md`

### FE02 - Xác thực

FE02 là nền tảng bảo mật vì mọi chức năng được bảo vệ đều cần biết người dùng là ai và phiên đăng
nhập có hợp lệ không. Chức năng này quản lý đăng ký, xác minh email, đăng nhập, đăng xuất, đổi mật
khẩu, quên/đặt lại mật khẩu và kiểm tra mã thông báo/phiên cho yêu cầu được bảo vệ.

Tác nhân gồm Khách, Thành viên, Thủ thư, Quản trị viên, Dịch vụ email và hệ thống nhật ký kiểm toán. Khách
có thể đăng ký, đăng nhập và yêu cầu đặt lại mật khẩu. Người dùng đã đăng nhập có thể đăng xuất, đổi
mật khẩu và truy cập đúng vai trò. Dịch vụ email gửi liên kết xác minh/đặt lại; hệ thống nhật ký kiểm toán ghi
sự kiện xác thực.

Luồng chính gồm đăng ký với email xác minh, chuyển tài khoản sang `ACTIVE`, đăng nhập bằng email/tên
người dùng và mật khẩu, xử lý đăng nhập thất bại, đăng xuất và thu hồi mã thông báo, đổi mật khẩu,
quên/đặt lại mật khẩu, kiểm tra phiên/mã thông báo trên mỗi yêu cầu API được bảo vệ.

Quy tắc quan trọng: mật khẩu phải được băm bằng `bcrypt`; không lưu/truyền mật khẩu dạng rõ; lỗi đăng
nhập không làm lộ email có tồn tại hay không; lần đăng nhập thất bại cần được theo dõi và có thể khóa
tài khoản; mã thông báo/phiên có thời hạn và bị vô hiệu hóa khi đăng xuất; mọi yêu cầu được bảo vệ phải
kiểm tra mã thông báo; sự kiện xác thực phải kiểm toán được; đăng nhập/mật khẩu/mã thông báo phải đi qua HTTPS.

Ngoài phạm vi: MFA/2FA, OAuth/OpenID Connect, LDAP/Active Directory, đăng nhập mạng xã hội, SSO,
xác thực sinh trắc học và phần quản trị người dùng của FE11.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-auth/SPEC.md`

### FE03 - Hồ sơ người dùng

FE03 giúp Thành viên, Thủ thư và Quản trị viên xem/cập nhật thông tin cá nhân của chính mình để thư
viện có dữ liệu liên hệ chính xác. Chức năng này chỉ xử lý hồ sơ cá nhân, không can thiệp thông tin
xác thực, vai trò, trạng thái tài khoản hay tư cách thành viên đã phê duyệt.

Tác nhân chính là người dùng đã đăng nhập. Thành viên, Thủ thư và Quản trị viên có thể xem/cập nhật hồ sơ của mình và tải ảnh đại diện lên nếu thỏa điều kiện. Việc sửa hồ sơ người khác thuộc FE11. Khách không được truy cập.

Luồng chính gồm xem hồ sơ, cập nhật trường được phép và tải ảnh đại diện lên. Dữ liệu phải được kiểm
tra hợp lệ ở máy chủ; yêu cầu không hợp lệ không được cập nhật một phần. Việc tải ảnh đại diện yêu cầu
xác thực, chỉ cập nhật hồ sơ hiện tại, giới hạn tệp/dung lượng và dùng tên tệp do máy chủ tạo.

Quy tắc quan trọng: người dùng chỉ xem/sửa hồ sơ của chính mình; không trả về `passwordHash` hoặc
thông tin xác thực bí mật; FE03 không sửa mật khẩu, vai trò, trạng thái tài khoản hay tư cách thành viên
đã phê duyệt; dữ liệu hồ sơ chỉ trả về cho tác nhân được phép.

Ngoài phạm vi: đăng nhập/đăng xuất/đăng ký, đặt lại mật khẩu, xác minh hoặc đổi email nếu FE02
chưa duyệt, tạo/vô hiệu hóa người dùng, gán vai trò, duyệt thành viên, lịch sử mượn/đặt chỗ/phí
phạt.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-user-profile/SPEC.md`

### FE04 - Quản lý tư cách thành viên

FE04 tách việc có tài khoản đăng nhập khỏi việc được công nhận là Thành viên. Một người dùng có thể
đã đăng ký nhưng vẫn cần được duyệt tư cách thành viên trước khi mượn sách, đặt chỗ hoặc dùng dịch vụ dành
cho thành viên. Việc tách này giúp xác thực, phân quyền và phê duyệt nghiệp vụ rõ ràng hơn.

Tác nhân gồm Khách, Người đăng ký tư cách thành viên, Thành viên, Thủ thư và Quản trị viên. Khách chưa đăng nhập
không thể nộp đơn. Người dùng đã đăng ký có thể nộp đơn và xem trạng thái của mình. Thủ thư hoặc Quản trị
viên có thể duyệt/từ chối đơn nếu chính sách cho phép.

Luồng chính gồm nộp đơn đăng ký tư cách thành viên, phê duyệt đơn, từ chối đơn và xem trạng thái tư
cách thành viên. Đơn mới bắt đầu với `PENDING`; chỉ đơn `PENDING` mới được phê duyệt/từ chối. Khi phê
duyệt cần ghi thời điểm; khi từ chối có thể ghi lý do nếu lược đồ được duyệt.

Quy tắc quan trọng: chỉ người dùng đã xác thực và đủ điều kiện mới được nộp đơn; một người dùng
không có nhiều đơn `PENDING`; người dùng đã được phê duyệt không nộp lại nếu quy trình gia hạn/đăng ký
lại chưa được duyệt; người dùng chỉ xem trạng thái của mình; trạng thái tư cách thành viên phục vụ FE07/FE08 kiểm tra
điều kiện; thao tác phê duyệt/từ chối cần truy vết.

Ngoài phạm vi: đăng ký/đăng nhập, mật khẩu/mã thông báo, sửa hồ sơ, gán vai trò, vô hiệu hóa tài khoản,
thực thi mượn/trả/gia hạn/đặt chỗ, tính phí phạt và thanh toán tư cách thành viên.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-membership-management/SPEC.md`

### FE05 - Quản lý sách

FE05 quản lý siêu dữ liệu sách: tên sách, ISBN, danh mục và thông tin mô tả phục vụ tra cứu, kho
sách, mượn sách, đặt chỗ và báo cáo. Nếu dữ liệu sách sai, các nghiệp vụ như tìm kiếm, kho sách,
mượn sách, đặt chỗ và báo cáo đều có thể bị ảnh hưởng.

Tác nhân gồm Khách, Thành viên, Thủ thư và Quản trị viên. Khách và Thành viên chỉ tìm theo tên
sách/tác giả và xem chi tiết công khai không có ISBN. Thủ thư và Quản trị viên được xem/tìm ISBN
trong danh sách quản trị, thêm sách, cập nhật thông tin sách và vô hiệu hóa sách khi cần. FE05 không
quản lý từng bản sao vật lý; phần đó thuộc FE06.

Luồng chính gồm tìm kiếm sách, xem chi tiết sách, xem danh sách sách, thêm sách, cập nhật thông tin
sách và vô hiệu hóa sách. Các hành động ghi dữ liệu cần được kiểm soát bằng vai trò và ghi
kiểm toán.

Quy tắc quan trọng: khách/thành viên chỉ được đọc dữ liệu công khai không có ISBN; chỉ thủ thư/quản trị viên
được xem/tìm ISBN và thêm, sửa hoặc vô hiệu hóa sách; ISBN phải duy nhất; tên sách là bắt buộc; Giai
đoạn 1 mỗi sách thuộc đúng một thể loại; sách bị vô hiệu hóa không được mượn và không nên xuất hiện
trong tìm kiếm công khai; mọi thao tác tạo/cập nhật/vô hiệu hóa phải kiểm toán được.

Ngoài phạm vi: quản lý mã vạch/vị trí/bản sao vật lý, mượn/trả/gia hạn, hàng đợi đặt chỗ, tính phí
hoặc thanh toán, thiết kế trang chủ công khai, quản lý người dùng/vai trò/tư cách thành viên, nhập/xuất
hàng loạt nếu chưa được duyệt.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-book-management/SPEC.md`

### FE06 - Quản lý kho sách / bản sao sách

FE06 quản lý từng bản sao vật lý của sách, vì danh mục chỉ cho biết thư viện có đầu sách nào, còn
mượn/trả phụ thuộc vào từng bản sao. Mỗi bản sao cần mã vạch duy nhất, vị trí và trạng thái như
`AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST` hoặc `INACTIVE`. Đây là nguồn dữ liệu cho tra
cứu, mượn sách, đặt chỗ, phí phạt và báo cáo.

Tác nhân chính là Thủ thư và Quản trị viên. Họ có thể xem kho sách, kiểm tra trạng thái, thêm/cập
nhật/vô hiệu hóa bản sao. Thành viên và Khách chỉ thấy tình trạng sẵn có qua FE01/FE05. FE07 cập
nhật trạng thái bản sao khi mượn/trả; FE08 dùng trạng thái khi đặt chỗ.

Luồng chính gồm xem kho sách, kiểm tra trạng thái bản sao của sách, cập nhật tình trạng sẵn có/trạng
thái và quản lý bản sao sách. Thay đổi trạng thái phải tránh xung đột với bản ghi mượn hoặc đặt chỗ
đang hoạt động.

Quy tắc quan trọng: chỉ Thủ thư/Quản trị viên quản lý trực tiếp bản sao; mỗi bản sao thuộc một sách
hiện có; mã vạch phải duy nhất; chỉ `AVAILABLE` mới được tính là có thể mượn; `BORROWED`, `RESERVED`,
`DAMAGED`, `LOST`, `INACTIVE` không được tính là sẵn có; vô hiệu hóa dựa trên trạng thái; FE06 không
sửa siêu dữ liệu sách và không duyệt mượn/trả/đặt chỗ.

Ngoài phạm vi: quản lý tên sách/ISBN/tác giả/thể loại/nhà xuất bản, duyệt mượn hoặc trả sách, xử lý
hàng đợi đặt chỗ, tính phí mất/hư hỏng/quá hạn, giao diện duyệt sách công khai và tích hợp phần cứng
RFID/QR ngoài việc lưu/quét văn bản mã vạch.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-inventory-book-copy/SPEC.md`

### FE07 - Quản lý mượn sách

FE07 là nghiệp vụ lưu thông chính: Thành viên tạo yêu cầu mượn, Thủ thư hoặc Quản trị viên duyệt/từ
chối, bản sao được bàn giao, sau đó được trả hoặc gia hạn nếu chính sách cho phép. Dữ liệu mượn ảnh
hưởng đến kho sách, đặt chỗ, khoản phạt, báo cáo và lịch sử kiểm toán, nên chức năng này thuộc mức đầy đủ.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Khách và Dịch vụ thông báo. Thành viên có thể tạo
yêu cầu mượn cho chính mình, xem lịch sử mượn và yêu cầu gia hạn nếu hợp lệ. Thủ thư/Quản trị
viên xử lý yêu cầu, duyệt/từ chối, bàn giao và nhận trả. Khách không có quyền mượn.

Luồng chính gồm tạo yêu cầu mượn, phê duyệt và xử lý yêu cầu mượn, từ chối yêu cầu mượn, xử lý trả
sách, gia hạn sách đang mượn và xem lịch sử mượn.

Quy tắc quan trọng: Thành viên phải có tài khoản `ACTIVE` và tư cách thành viên đã được duyệt; không
quá 5 bản sao đang mượn; lượt mượn quá hạn hoặc khoản phạt `UNPAID` lớn hơn 0 chặn mượn/gia hạn;
bản sao chỉ được mượn khi `BookCopies.Status = AVAILABLE`; khi duyệt phải kiểm tra lại tình trạng sẵn
có và điều kiện mượn; bản sao được mượn chuyển sang `BORROWED`; hạn trả mặc định 14 ngày; mỗi chi tiết mượn gia
hạn tối đa 1 lần; FE07 cung cấp dữ liệu cho FE09, không tự tạo khoản phạt.

Ngoài phạm vi: triển khai FE08 ngoài việc đọc đặt chỗ khi kiểm tra gia hạn, tính phí FE09, gửi thông
báo FE10, cổng thanh toán, phần cứng RFID/QR và đặt chỗ ghế học.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-borrowing-management/SPEC.md`

### FE08 - Quản lý đặt chỗ

FE08 xử lý tình huống sách chưa sẵn có nhưng Thành viên muốn xếp hàng chờ. chức năng này đảm bảo
công bằng, tránh nhầm lẫn khi nhiều người muốn cùng một sách, và giúp Thủ thư theo dõi hàng đợi để
thông báo cho người tiếp theo.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, Khách và Dịch vụ thông báo. Thành viên có thể tạo
đặt chỗ, hủy đặt chỗ của chính mình và xem trạng thái. Thủ thư/Quản trị viên xem danh sách đặt chỗ,
xử lý hàng đợi, phát hành/hết hạn đặt chỗ nếu được phép. Khách không được đặt chỗ.

Luồng chính gồm đặt chỗ sách, hủy đặt chỗ, xem danh sách đặt chỗ, xử lý hàng đợi và kích hoạt thông
báo sách sẵn sàng. Khi một bản sao được giữ cho Thành viên, FE08 cần yêu cầu FE10 gửi thông
báo, nhưng FE10 mới là nơi thực hiện gửi.

Quy tắc quan trọng: chỉ người dùng đã xác thực và có tư cách thành viên được duyệt mới đặt chỗ; không
tạo đặt chỗ đang hoạt động trùng cho cùng đối tượng; hàng đợi giữ thứ tự `ReservedAt` nếu chưa có
chính sách ưu tiên; đặt chỗ `CANCELLED` hoặc `EXPIRED` không được chọn; bản sao được giữ cho người
khác không được mượn bình thường; đặt chỗ đang hoạt động/bản sao được giữ cho người khác chặn FE07
gia hạn cho cùng đối tượng; thay đổi trạng thái cần truy vết.

Ngoài phạm vi: phê duyệt/trả sách của FE07, gửi thông báo thực tế của FE10, tính phí, thanh toán trực
tuyến, đặt chỗ ghế học và các quy tắc ưu tiên phức tạp nếu chưa được duyệt.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-reservation-management/SPEC.md`

### FE09 - Quản lý phí phạt

FE09 cung cấp cách tính và ghi nhận phí phạt minh bạch khi sách trả quá hạn hoặc vi phạm chính sách. Phí phạt ảnh hưởng đến quyền mượn tiếp, xử lý của Thủ thư và dữ liệu báo cáo, nên logic phải nhất quán, truy vết được và tránh tính trùng.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, chức năng mượn sách và chức năng thông báo.
Thành viên chỉ xem khoản phạt của mình. Thủ thư/Quản trị viên xem khoản phạt của mọi Thành viên, tính
và xác nhận khoản phạt, ghi nhận thu tiền và đánh dấu đã thanh toán. FE07 cung cấp hạn trả, ngày trả
và dữ liệu quá hạn; FE10 gửi thông báo khi có yêu cầu.

Luồng chính gồm xem thông tin khoản phạt, tính khoản phạt, ghi nhận việc thu khoản phạt và đánh dấu
khoản phạt đã thanh toán.

Quy tắc quan trọng: Khách không xem/quản lý khoản phạt; thành viên chỉ xem khoản phạt của mình; chỉ
Thủ thư/Quản trị viên ghi nhận thu hoặc đánh dấu đã thanh toán; Giai đoạn 1 tính 5.000 VND/ngày quá
hạn/bản sao, từ
ngày sau hạn trả; việc tính khoản phạt dùng ngày ở máy chủ và ngày đến hạn/ngày trả đã lưu; máy khách
không gửi số tiền phạt để tự tính; không có khoản phạt quá hạn đang hoạt động trùng cho cùng chi tiết
mượn/lý do; khoản phạt `UNPAID` lớn hơn 0 chặn mượn/gia hạn; khi đã thanh toán phải đặt trạng thái
`PAID` và `PaidAt`.

Ngoài phạm vi: duyệt mượn, xử lý trả sách, gán hạn trả, quản lý tình trạng bản sao, thanh toán
cổng thanh toán trực tuyến, gửi thông báo, bảng điều khiển báo cáo và duyệt tư cách thành viên.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-fine-management/SPEC.md`

### FE10 - Quản lý thông báo

FE10 là trung tâm tạo, gửi, lưu và theo dõi thông báo từ sự kiện tài khoản và nghiệp vụ thư viện.
Nếu thông báo không đáng tin cậy, người dùng có thể bỏ lỡ xác minh tài khoản, đặt lại mật khẩu, sách
đặt chỗ sẵn sàng, hạn trả, quá hạn hoặc phí phạt. FE10 nhận yêu cầu từ chức năng nguồn; quyết định
nghiệp vụ vẫn thuộc chức năng nguồn.

Tác nhân gồm Thành viên, Thủ thư, Quản trị viên, chức năng nguồn, tiến trình thông báo, nhà cung cấp
email và Khách. Thành viên nhận email hoặc thông báo trong ứng dụng cho đặt chỗ, hạn trả, quá hạn và
phí phạt. Khách có thể nhận email xác minh tài khoản hoặc đặt lại mật khẩu.

Luồng chính gồm gửi thông báo xác minh tài khoản, đặt lại mật khẩu, sách đặt chỗ sẵn sàng, hạn trả
hoặc phí phạt. Trạng thái thông báo gồm `PENDING`, `SENT`, `DELIVERED`, `FAILED` hoặc `SKIPPED`.

Quy tắc quan trọng: FE10 không quyết định sự kiện nghiệp vụ; phải kiểm tra loại thông báo, kênh, khóa
mẫu, người nhận và dữ liệu mẫu; không tạo/kiểm tra mã thông báo xác thực; không ghi mã thông báo thô,
thông tin xác thực nhà cung cấp hoặc dấu vết bộ công nghệ; yêu cầu trùng khóa lũy đẳng không tạo thông
báo đang hoạt động trùng; gửi thất bại được ghi nhận nhưng không hoàn tác giao dịch nguồn; thông tin
xác thực của nhà cung cấp email phải nằm ngoài mã nguồn.

Ngoài phạm vi: SMS, thông báo đẩy di động, tiếp thị/bản tin, thông báo thanh toán trực tuyến, tạo/xác
thực mã thông báo, tính khoản phạt, quyết định hàng đợi đặt chỗ, duyệt mượn/trả, giao diện hộp thư,
trình soạn mẫu/nhật ký/thử lại và lưu thông tin xác thực thật trong kho mã nguồn.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-notification-management/SPEC.md`

### FE11 - Quản lý người dùng & vai trò

FE11 cho phép Quản trị viên quản lý vòng đời tài khoản và phân quyền. Đây là chức năng cốt lõi vì dữ
liệu người dùng/vai trò sai có thể phá vỡ kiểm soát truy cập hoặc lộ dữ liệu nhạy cảm. FE11 quản lý
người dùng ở cấp
quản trị viên; đăng ký tự phục vụ thuộc FE02, hồ sơ cá nhân thuộc FE03.

Tác nhân gồm Quản trị viên, Thủ thư, Thành viên, Khách và hệ thống nhật ký kiểm toán. Chỉ Quản trị viên
được xem người dùng, tạo tài khoản Thành viên/Thủ thư, cập nhật thông tin, vô hiệu hóa người dùng/Thủ
thư và quản lý vai trò. Thủ thư/Thành viên không quản lý người dùng khác.

Luồng chính gồm xem danh sách người dùng, xem thông tin người dùng, tạo/cập nhật/vô hiệu hóa tài
khoản người dùng, tạo/cập nhật/vô hiệu hóa tài khoản Thủ thư và quản lý vai trò.

Quy tắc quan trọng: chỉ Quản trị viên đã xác thực truy cập quản lý người dùng; người dùng không bị xóa
vĩnh viễn mà được đặt `INACTIVE`; email phải duy nhất; tài khoản do Quản trị viên tạo bắt đầu `INACTIVE`
và chỉ đăng nhập bằng mật khẩu sau khi thiết lập qua FE02; vô hiệu hóa người dùng phải vô hiệu hóa phiên/mã thông báo
đang hoạt động; mỗi tài khoản có đúng một vai trò; đổi vai trò là thao tác thay thế nguyên tử; không
được thay vai trò
của quản trị viên đang hoạt động cuối cùng; quản trị viên không nhập/xem/tạo mật khẩu trực tiếp; mọi
thay đổi vai trò/người dùng phải kiểm toán được.

Ngoài phạm vi: người dùng tự sửa hồ sơ, người dùng tự đặt lại mật khẩu, quản trị viên đặt lại mật
khẩu nếu chưa bổ
sung, mở khóa sau khi bị khóa, kích hoạt lại tài khoản nếu chưa duyệt, xóa vĩnh viễn, nhập CSV hàng
loạt, báo cáo theo vai trò, tự đăng ký, LDAP/Active Directory và SSO.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-user-role-management/SPEC.md`

### FE12 - Báo cáo và thống kê

FE12 cung cấp góc nhìn tổng hợp để Thủ thư và Quản trị viên hiểu tình hình thư viện: lượng mượn,
sách đã trả/quá hạn, trạng thái kho sách, thống kê người dùng/thành viên và vận hành. Đây là chức
năng chỉ đọc; dữ liệu nghiệp vụ do chức năng nguồn tạo.

Tác nhân gồm Thủ thư, Quản trị viên, Thành viên, Khách và nguồn chức năng. Thủ thư xem báo cáo vận
hành nếu được phê duyệt. Quản trị viên xem toàn bộ báo cáo được duyệt và người dùng thống kê. Thành viên
và Khách không có quyền truy cập báo cáo nội bộ.

Luồng chính gồm xem báo cáo mượn sách, xem báo cáo kho và xem thống kê người dùng. Bộ lọc báo cáo
phải được kiểm tra hợp lệ; khoảng ngày phải có ngày bắt đầu/kết thúc hợp lệ.

Quy tắc quan trọng: báo cáo chỉ đọc và không sửa dữ liệu nguồn; quyền truy cập được bảo vệ ở máy chủ;
báo cáo mượn sách lấy FE07 làm nguồn chuẩn; báo cáo kho lấy FE06/`BookCopies`; thống kê người dùng lấy
FE11/Users/Roles; thống kê tư cách thành viên nếu hiển thị lấy FE04; trạng thái dùng định nghĩa từ
chức năng nguồn; thống kê người dùng không lộ dữ liệu cá nhân không cần thiết; số lượng tổng hợp phải
tái tạo được.

Ngoài phạm vi: sửa bản ghi mượn/kho/người dùng/tư cách thành viên/khoản phạt/đặt chỗ, xử lý mượn/trả,
quản lý bản sao sách, quản lý người dùng/vai trò, tính hoặc thu khoản phạt, kho dữ liệu BI/phân tích
bên ngoài, xuất CSV/PDF nếu chưa duyệt và bảng điều khiển thời gian thực nếu chưa duyệt.

Đặc tả gốc (nguồn chuẩn): `.sdd/specs/feat-reporting-statistics/SPEC.md`

## 5. Mối liên hệ giữa các chức năng

Các chức năng được tách thành đặc tả riêng để dễ quản lý nhưng không vận hành độc lập. FE02 cung cấp xác thực và
phiên đăng nhập cho hầu hết chức năng được bảo vệ; FE11 cung cấp vai trò và quyền để kiểm soát hành
động của quản trị viên, Thủ thư và Thành viên. FE01 đọc siêu dữ liệu sách từ FE05 và trạng thái khả dụng
công khai từ FE06. FE04 quyết định tư cách thành viên, là điều kiện quan trọng để FE07 cho mượn và
FE08 cho đặt chỗ.

Nghiệp vụ mượn sách là điểm giao giữa nhiều chức năng: FE07 cần tài khoản hợp lệ từ FE02, tư cách
thành viên hợp lệ từ FE04, bản sao `AVAILABLE` từ FE06, kiểm tra đặt chỗ từ FE08 khi gia hạn và kiểm tra khoản phạt
chưa thanh toán từ FE09. Khi mượn/trả/gia hạn thay đổi trạng thái, dữ liệu đó tiếp tục phục vụ FE09
tính phí, FE10 gửi thông báo và FE12 tổng hợp báo cáo. FE10 không tự quyết định nghiệp vụ mà chỉ xử
lý yêu cầu thông báo từ FE02, FE07, FE08 và FE09. FE12 là lớp tổng hợp cuối, đọc dữ liệu từ các chức
năng nguồn nhưng không sửa bản ghi nghiệp vụ.
