# PLAN.md - FE10 Quản lý thông báo

Trạng thái: COMPLETE; PR #89 ĐÃ MERGE; CI VÀ AZURE DEPLOY EXACT-HEAD ĐẠT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Phê duyệt: G1-G7 được phê duyệt 2026-07-13; G8-G10/ADR-004 và G11/ADR-005
được phê duyệt 2026-07-15; ranh giới FE04 G12 được Nhat phê duyệt
2026-07-17

Trạng thái quy trình: baseline giao hàng Giai đoạn 2/G1-G12 và v0.4.5 đã được
phê duyệt vẫn hoàn tất. Người dùng đã phê duyệt thiết kế hộp thư thông báo cá
nhân v0.5.0 và SPEC hợp nhất bằng văn bản ngày 2026-07-27, sau đó phê duyệt kế
hoạch triển khai và phân rã nhiệm vụ FE10-I01..I08 dưới H1 ngày 2026-07-28.
Governance PR #70 đã vào `main` dưới dạng `25c09ec`. Sau rebase chênh lệch chỉ
tài liệu `main@30f936d`, H2 đã phê duyệt fingerprint
`e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
Head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đã đạt CI exact-head
`30317424995` và Azure staging `30317621429`, nhận H3 hai trục sạch và phê
duyệt rõ ràng, rồi merge thành
`b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu merge chính xác
`30341279111` và Azure staging tự động `30341540847` đều đạt. FE10-I01 đến
FE10-I08 cùng biện pháp khắc phục có giới hạn đã hoàn tất. Closeout tiếp theo
`6189b1a` đã merge qua PR #89 thành `main@39092fb`; CI `30675444178` và Azure
staging `30675744992` đều đạt exact-head.

---

> Phần 1-8 giữ lịch sử củng cố G1-G7 đã hoàn tất. Phần 9 thay thế các phát biểu
> lịch sử về liên kết xác minh, nhà cung cấp chỉ mô phỏng và trì hoãn migration
> FE02. Phần 10 ghi nhận công việc thiết lập FE11 đã hoàn tất, còn Phần 11 là
> phần theo dõi ranh giới kết quả tư cách thành viên FE04 hiện tại.

## Kế hoạch G1-G7 lịch sử (được thay thế khi Phần 9-11 khác biệt)

Nhat đã phê duyệt các khuyến nghị ràng buộc G1-G7 ngày 2026-07-13. Phê duyệt
đó lần đầu cho phép phân rã nhiệm vụ B4. Tài liệu B4 đã được rà soát, B5 sau đó
tiến hành trên `feat/fe10-hardening` và FE10-H01 đến FE10-H08 hoàn tất.
FE10-H09 vượt cổng xác thực và review độc lập B6. Commit
`9185a9a91f41e444e0c4e6bd8c0605a281272ee9` sau đó được merge vào `main`, và
lượt CI GitHub Actions `29236572558` đạt cho cùng commit. Bằng chứng B7 được
ghi trong `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`.

**Mục tiêu G1-G7 lịch sử:** cung cấp đợt củng cố backend FE10 nhỏ nhất đã được
phê duyệt khi đó. Phần 9-11 là nguồn chuẩn về quyền sở hữu OTP, thiết lập tài
khoản và kết quả tư cách thành viên.

**Baseline bằng chứng lịch sử (2026-07-13):** chỉ được giữ để giải thích lịch
sử triển khai G1-G7. Đây không phải hợp đồng OTP hiện tại; Phần 9 và
`SPEC.md` v0.4.1 thay thế các phát biểu về mẫu liên kết và trì hoãn FE02.

## 1. Phân loại LÕI và VỎ

| Phân loại | Thành phần | Cơ sở lý do và cách tiếp cận đã được phê duyệt để rà soát |
| --- | --- | --- |
| LÕI | Ranh giới gửi xác thực nhạy cảm | SPEC FE10 hiện tại cấm lưu bền nội dung OTP nhạy cảm. Với `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`, kiểm tra hợp lệ `templateData` thô, kết xuất và gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình trong FE10, chỉ lưu bền bản tóm tắt thông báo/`safePayload` đã che dữ liệu, trạng thái và lần gửi. Mẫu chuẩn yêu cầu `{{otp}}` và `{{expiresInMinutes}}`. Không bao giờ lưu bền, ghi log, ghi kiểm toán hoặc trả về OTP thô hay tiêu đề/nội dung nhạy cảm đã kết xuất. Khi nhà cung cấp thất bại, chỉ ghi bản tóm tắt thất bại an toàn. FE02 vẫn là chủ sở hữu duy nhất của việc tạo và xác thực OTP. |
| LÕI | Gửi không nhạy cảm đã xếp hàng | Các thông báo đặt chỗ, hạn trả, quá hạn, tiền phạt và chung vẫn được xếp hàng. Kết xuất và lưu bền tiêu đề/nội dung đã xếp hàng của chúng khi tạo yêu cầu, rồi gửi qua `process-pending`, chỉ chọn bản ghi `PENDING` không nhạy cảm. Duyệt đệ quy đối tượng và mảng `templateData`; chuẩn hóa mỗi khóa bằng chữ thường và loại dấu gạch dưới, gạch nối, khoảng trắng; từ chối yêu cầu xếp hàng khi bất kỳ khóa chuẩn hóa nào chứa `token`, `otp`, `password`, `verificationlink` hoặc `resetlink`. Việc này bắt `OTP`, `reset_token`, `verification-link` và các giá trị đối tượng/mảng lồng nhau trước khi một loại không nhạy cảm có thể đưa bí mật vào `Body` đã lưu bền. Áp dụng cùng phép duyệt đệ quy chuẩn hóa đó khi che `safePayload`. |
| LÕI | Hợp đồng loại/mẫu | Mã phía máy chủ, không phải cờ do người gọi cung cấp, thực thi các cặp: `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`; `PASSWORD_RESET -> PASSWORD_RESET`; `RESERVATION_AVAILABLE -> RESERVATION_READY`; `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`; `OVERDUE_NOTICE -> OVERDUE_NOTICE`; `FINE_NOTICE -> FINE_NOTICE`; `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. Từ chối mọi trường hợp không khớp. `DUE_OR_FINE_NOTICE` không phải chuẩn nếu chưa được phê duyệt riêng. |
| LÕI | Hợp đồng phản hồi API công khai | Thao tác tạo/xử lý hiện làm lộ bản ghi đầy đủ, bao gồm nội dung và payload an toàn. Lỗi xác thực/mẫu vẫn trả phản hồi 4xx an toàn thông thường. Thành công từ nhà cung cấp nhạy cảm lưu thông báo/lần thử `SENT` và trả về `201 { notificationId, status: "SENT" }`; thất bại của nhà cung cấp nhạy cảm lưu thông báo/lần thử `FAILED` với lý do an toàn và vẫn trả về `201 { notificationId, status: "FAILED" }` vì yêu cầu đã được chấp nhận và luồng nguồn không được hoàn tác. Việc tạo không nhạy cảm trả về cùng DTO tối thiểu với trạng thái đã lưu. Mọi phát lại lũy đẳng trả `200 { notificationId, status }` cho trạng thái hiện có; xử lý trả `200 { processed, failed }`. Không trả về đối tượng hoặc mảng đầy đủ. |
| LÕI | Ranh giới tác nhân và nguồn nội bộ | `createSourceNotificationRequester(sourceFeature)` ràng buộc một nguồn trong `FE02`, `FE07`, `FE08`, `FE09`, `FE11` hoặc `SYSTEM`; nguồn được ràng buộc khi khởi tạo thay vì tin đầu vào. Quyền sở hữu nguồn/loại được thực thi trước khi kết xuất hoặc lưu bền. Các route HTTP vẫn là `LIBRARIAN`/`ADMIN` cho loại không nhạy cảm. |
| LÕI | Mô hình trạng thái thử lại và lũy đẳng | Q-FE10-005 hứa hẹn thử lại thủ công nhưng không có chuyển đổi, và chỉ mục cơ sở dữ liệu áp dụng mọi trạng thái trong khi tra cứu chỉ trạng thái hoạt động. Chính sách được khuyến nghị: một bản ghi cho mỗi khóa lũy đẳng xuyên suốt mọi trạng thái; tra cứu bao phủ mọi trạng thái; giữ chỉ mục duy nhất mọi trạng thái hiện tại; thử lại dùng lại cùng bản ghi/khóa/lịch sử đã xếp hàng không nhạy cảm. |
| LÕI | Loại tham chiếu nguồn và khóa mẫu | Hợp đồng dữ liệu ghi số nguyên/chuỗi nhưng mọi PK nguồn và tầng thực thi FE10 là `INT`; FE02 trực tiếp dùng `EMAIL_VERIFY` trong khi khóa SQL/đặc tả chuẩn bao gồm `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`. Quyết định Giai đoạn 1 được khuyến nghị là chỉ số nguyên, kèm sửa SPEC FE10. Xác định `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` là khóa chuẩn; không bổ sung bí danh `EMAIL_VERIFY` không được lập tài liệu. |
| VỎ | Hệ thống kết nối HTTP/controller/validator | Các thành phần này thực hiện hợp đồng phản hồi và thử lại đã được phê duyệt nhưng không quyết định quyền hoặc quy tắc nghiệp vụ. Giữ route mỏng. |
| VỎ | Repository trong bộ nhớ và kiểm thử | Fixture và assertion phải phản chiếu việc gửi đồng bộ nhạy cảm, xếp hàng không nhạy cảm, tính lũy đẳng và ngữ nghĩa thử lại; chúng là bằng chứng cho hành vi LÕI. |
| VỎ | Mô tả OpenAPI | Nó ghi lại hợp đồng route/phản hồi đã được phê duyệt trong B5 sau sửa SPEC; nó không đưa ra quyết định sản phẩm. |

## 2. Các quyết định cụ thể được phê duyệt cho B4

| Cổng | Chênh lệch đã chứng minh | Khuyến nghị ràng buộc để phê duyệt | Phương án thay thế và hệ quả |
| --- | --- | --- | --- |
| G1: kiến trúc gửi nhạy cảm | Việc làm sạch chạy trước khi kết xuất; danh sách kiểm tra review FE10 cấm lưu nội dung OTP nhạy cảm; xử lý bình thường cần nội dung xếp hàng đã lưu bền. | Tách theo cặp loại/mẫu do máy chủ thực thi. Fixture SQL/kiểm thử yêu cầu `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` chứa `{{otp}}` và `{{expiresInMinutes}}`; kết xuất/gửi đồng bộ và chỉ lưu bản tóm tắt/`safePayload` đã che dữ liệu, trạng thái gửi và lần thử. Không lưu tiêu đề/nội dung nhạy cảm đã kết xuất hoặc giá trị OTP thô. Chỉ xếp hàng các cặp chuẩn không nhạy cảm; duyệt đệ quy đối tượng/mảng, chuẩn hóa khóa bằng chữ thường và loại `_`, `-`, khoảng trắng, rồi từ chối nếu khóa chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink` hoặc `resetlink`. Dùng cùng quy tắc đệ quy chuẩn hóa để che `safePayload`. | Nội dung nhạy cảm đã xếp hàng dạng văn bản thuần cần sửa SPEC, chuẩn kiểm soát truy cập cơ sở dữ liệu rõ ràng và chủ sở hữu được chỉ định. Payload mã hóa sống ngắn bị từ chối vì quá kỹ thuật cho Giai đoạn 1. |
| G2: phản hồi tối thiểu | Controller trả kết quả service chứa thông báo/mảng đầy đủ. | Giữ lỗi xác thực/mẫu là phản hồi 4xx an toàn thông thường. Thành công nhà cung cấp nhạy cảm lưu `SENT` cùng lần thử và trả `201 { notificationId, status: "SENT" }`; thất bại nhà cung cấp nhạy cảm lưu `FAILED` cùng lý do lần thử an toàn và trả `201 { notificationId, status: "FAILED" }`. Việc tạo không nhạy cảm trả trạng thái tối thiểu đã lưu. Phát lại lũy đẳng trả `200 { notificationId, status }` cho bất kỳ trạng thái hiện có nào; xử lý trả `200 { processed, failed }`; không bao giờ trả đối tượng/mảng đầy đủ. | Giữ đối tượng đầy đủ mâu thuẫn SPEC hiện tại và để lộ nội dung. |
| G3: trình yêu cầu nội bộ | Route/service yêu cầu `LIBRARIAN`/`ADMIN`; tính năng nguồn cần ranh giới trong tiến trình đáng tin cậy. | Dùng `createSourceNotificationRequester(sourceFeature)` với danh sách cho phép `FE02`/`FE07`/`FE08`/`FE09`/`FE11`/`SYSTEM`, siêu dữ liệu ràng buộc khi khởi tạo, quyền sở hữu nguồn/loại, kiểm toán nguồn `userId: null`, lỗi an toàn và catch không chặn ở phía người gọi. | HTTP nội bộ đã xác thực sẽ cần thông tin xác thực dịch vụ và nhiều công việc ranh giới hơn. Không tạo vai trò đăng nhập `SYSTEM`. |
| G4: ID thực thể nguồn | SPEC cho phép số nguyên/chuỗi; validator/repository/model/SQL là `INT`, còn khóa chính nguồn hiện tại là số nguyên. | Giai đoạn 1 chỉ dùng số nguyên; sửa yêu cầu dữ liệu SPEC FE10 từ số nguyên/chuỗi thành số nguyên. | Hỗ trợ chuỗi yêu cầu migration schema phối hợp và cập nhật validator/model/repository. Không âm thầm mở rộng/thu hẹp hợp đồng. |
| G5: thử lại thủ công | Không có hành vi route/service/repository thử lại; `FAILED` không bao giờ được chọn lại bởi xử lý pending. | Thêm `POST /api/notifications/{id}/retry` được bảo vệ cho `LIBRARIAN`/`ADMIN`. Chỉ cho phép một thông báo đã xếp hàng không nhạy cảm `FAILED` chuyển sang `PENDING`, giữ nguyên bản ghi, khóa lũy đẳng và lịch sử lần thử; trả `200 { notificationId, status }` và `409` trong trường hợp khác. Thử lại `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET` trả thân lỗi `409` an toàn chuẩn với mã `REISSUE_REQUIRED` và thông điệp chung hướng dẫn tạo sự kiện nguồn mới; không gồm bí mật hay chi tiết nhà cung cấp. | Quy trình vận hành không có endpoint chỉ có thể thực hiện nếu tác nhân, cơ chế, chuyển đổi, kiểm toán và hợp đồng phản hồi của nó được thêm vào SPEC. Không thể thực thi thử lại cho đến khi một phương án được phê duyệt. |
| G6: lũy đẳng trạng thái kết thúc | Chỉ mục duy nhất SQL áp dụng mọi trạng thái; service tra cứu chỉ trạng thái hoạt động, vì vậy bản ghi kết thúc có thể chặn chèn mới ngoài dự kiến. | Một bản ghi cho mỗi khóa xuyên suốt mọi trạng thái: đổi ngữ nghĩa tra cứu sang mọi trạng thái, giữ chỉ mục duy nhất mọi trạng thái hiện có và cho thử lại không nhạy cảm dùng lại bản ghi. | Chỉ mục duy nhất đã lọc chỉ trạng thái hoạt động cho phép bản ghi mới sau trạng thái kết thúc nhưng đòi hỏi thay đổi schema/chỉ mục và làm yếu tính duy nhất sự kiện nguồn. Không đổi riêng tra cứu. |
| G7: phụ thuộc FE02 và căn chỉnh khóa mẫu | Đặc tả FE02/FE10 được phê duyệt dựa trên OTP. Code FE02 lịch sử gửi OTP trực tiếp và dùng khóa cũ `EMAIL_VERIFY`, trong khi hợp đồng FE10 chuẩn dùng `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`. | FE10 sở hữu ranh giới gửi và FE02 sở hữu tạo/xác thực OTP. Phần theo dõi FE02 định tuyến xác minh/đặt lại qua trình yêu cầu ràng buộc FE02 với khóa mẫu chuẩn, không gửi trực tiếp trùng. | Không giới thiệu bí danh thông báo `EMAIL_VERIFY` không được lập tài liệu. Việc trì hoãn FE02 trước đây được thay thế bởi FE10-S04/FE02-T031 qua B7. |

## 3. Cách tiếp cận được khuyến nghị và các phương án

### Khuyến nghị: củng cố FE10 nhỏ nhất, nhất quán, tuân thủ SPEC hiện tại

1. G1-G7 đã được phê duyệt. B5 bắt đầu với việc chủ sở hữu tính năng cập nhật
   `SPEC.md`/`CHANGELOG.md` FE10 cho các hợp đồng quan sát được đã chọn; chủ
   sở hữu FE02 giải quyết phụ thuộc FE02 riêng trước mọi migration FE02.
2. Thực thi ánh xạ loại/mẫu chuẩn trước khi gửi. Yêu cầu `{{otp}}` và
   `{{expiresInMinutes}}` trong fixture SQL/kiểm thử `ACCOUNT_VERIFICATION` và
   `PASSWORD_RESET`. Với loại xác thực nhạy cảm, kiểm tra dữ liệu mẫu thô, kết
   xuất và gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình. Khi nhà cung
   cấp thành công, lưu `SENT` cùng lần thử và trả DTO tối thiểu `201`; khi thất
   bại, lưu `FAILED` cùng lý do an toàn và vẫn trả DTO tối thiểu `201`. Nội
   dung nhạy cảm đã kết xuất và giá trị thô không vượt ranh giới lưu bền, ghi
   log, kiểm toán hoặc HTTP.
3. Với loại không nhạy cảm, duyệt đệ quy đối tượng/mảng trong `templateData`,
   chuẩn hóa khóa bằng chữ thường và loại `_`, `-`, khoảng trắng, từ chối mọi
   khóa chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink` hoặc
   `resetlink`; áp dụng cùng quy tắc khi che `safePayload`. Sau đó kiểm tra,
   kết xuất và lưu nội dung đã xếp hàng; `process-pending` chỉ chọn bản ghi
   `PENDING` không nhạy cảm. Bổ sung DTO controller tối thiểu, trình yêu cầu
   nguồn ràng buộc khi khởi tạo, kiểm tra khóa mẫu chuẩn, xác thực tham chiếu
   nguồn chỉ số nguyên và tra cứu lũy đẳng mọi trạng thái.
4. Chỉ bổ sung thử lại được bảo vệ cho thông báo đã xếp hàng không nhạy cảm thất
   bại; trả `409 REISSUE_REQUIRED` an toàn cho cả hai loại xác thực nhạy cảm.
   Chỉ di chuyển FE07 và FE08 sau khi trình yêu cầu nguồn được triển khai và
   rà soát. Sự kiện hạn trả/tiền phạt của FE09 được phê duyệt trong SPEC FE10
   nhưng không có người gọi/tích hợp hiện tại, nên triển khai của nó bị hoãn;
   FE02 vẫn là phụ thuộc hoãn của chủ sở hữu.
5. Giữ nhà cung cấp mô phỏng, phân tầng Express/SQL Server và phạm vi không
   frontend.

### Phương án A: nội dung nhạy cảm đã xếp hàng dạng văn bản thuần

Xếp hàng nội dung xác thực nhạy cảm và lưu nội dung đã kết xuất để xử lý sau.
Điều này khôi phục một chế độ gửi nhưng vi phạm quy tắc danh sách kiểm tra review
FE10 hiện tại. Nó cần sửa SPEC, chuẩn kiểm soát truy cập cơ sở dữ liệu rõ ràng
và chủ sở hữu vận hành được chỉ định trước khi triển khai.

### Phương án B: payload đã xếp hàng mã hóa sống ngắn

Mã hóa payload sống ngắn và giải mã tại thời điểm xử lý. Điều này giảm phơi lộ
văn bản thuần trong cơ sở dữ liệu nhưng đưa vào vòng đời khóa, xoay vòng, khôi
phục lỗi và độ phức tạp vận hành vượt phạm vi Giai đoạn 1. Nó bị từ chối cho đợt
này.

### Phương án C: trình yêu cầu HTTP nội bộ đã xác thực

Dùng thông tin xác thực dịch vụ nội bộ để gọi endpoint yêu cầu được bảo vệ. Điều
này hợp lệ cho việc tách dịch vụ trong tương lai nhưng cần xử lý bí mật/cấu hình
được phê duyệt và thay đổi middleware/kiểm thử rộng hơn. Factory trong tiến
trình được khuyến nghị nhỏ hơn cho monolith hiện tại.

## 4. Cấu trúc tác nhân có giới hạn

Ở B5, một tác nhân triển khai có phạm vi ghi độc quyền trên mỗi nhiệm vụ củng
cố FE10 đã được phê duyệt; một người review độc lập xác minh diff của mỗi nhiệm
vụ và bằng chứng kiểm thử. Không chạy chỉnh sửa song song trên các tệp service,
repository, route hoặc kiểm thử thông báo FE10 dùng chung vì gửi nhạy cảm, xếp
hàng, thử lại, tính lũy đẳng và tích hợp nguồn cùng chia sẻ một hợp đồng. Cơ
hội song song thận trọng duy nhất là các migration người gọi FE07 và FE08 tách
biệt sau khi phụ thuộc trình yêu cầu chung hoàn tất.

## 5. Các tệp dự kiến chính xác

### Bản ghi lập kế hoạch B4 và tệp điều kiện tiên quyết B5

- `.sdd/specs/feat-notification-management/SPEC.md` - nhiệm vụ B5 đầu tiên
  sửa hợp đồng quan sát được G1-G7 đã được phê duyệt trước khi triển khai bắt
  đầu.
- `.sdd/specs/feat-notification-management/CHANGELOG.md` - nhiệm vụ B5 đầu
  tiên ghi nhận sửa đổi hợp đồng đã được phê duyệt.
- `.sdd/specs/feat-notification-management/TASKS.md` - B4 nối thêm các nhiệm
  vụ củng cố FE10 đang chờ trong khi giữ toàn bộ nhiệm vụ lát cắt ban đầu đã
  hoàn tất làm bằng chứng lịch sử.

### Các tệp triển khai FE10 mặc định

- `backend/src/services/notificationService.js` - ánh xạ loại/mẫu phía máy chủ,
  gửi đồng bộ nhạy cảm so với gửi không nhạy cảm đã xếp hàng, từ chối khóa nhạy
  cảm đệ quy chuẩn hóa đối tượng/mảng cho dữ liệu xếp hàng, che `safePayload`
  đệ quy chuẩn hóa tương ứng, ranh giới lưu bền đã che dữ liệu, factory trình
  yêu cầu nguồn, lũy đẳng mọi trạng thái, chuyển đổi thử lại và hành vi kiểm
  toán an toàn.
- `backend/src/controllers/notificationController.js` - DTO tạo/phát lại/xử
  lý/thử lại tối thiểu chính xác.
- `backend/src/routes/notificationRoutes.js` - route thử lại được bảo vệ trong
  khi giữ các route yêu cầu/xử lý được bảo vệ.
- `backend/src/validators/notificationValidators.js` - ID nguồn số nguyên và
  kiểm tra ranh giới; mã cấp service sở hữu xác thực loại/mẫu chuẩn và dữ liệu
  xếp hàng nhạy cảm đệ quy.
- `backend/src/repositories/notificationRepository.js` - lưu bền bản tóm tắt/
  lần thử `SENT`/`FAILED` nhạy cảm không có nội dung đã kết xuất, lưu bền xếp
  hàng không nhạy cảm và chọn pending đã lọc, tra cứu mọi trạng thái, cập nhật
  thất bại sang pending và bảo toàn lịch sử lần thử.
- `backend/src/models/Notification.js` - trạng thái và siêu dữ liệu ID nguồn số
  nguyên khớp ngữ nghĩa schema đã phê duyệt; không bổ sung siêu dữ liệu hết hạn.
- `database/Librarymanagement.sql` - mẫu seed chuẩn chứa `{{otp}}` và
  `{{expiresInMinutes}}` trong `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` để
  kết xuất chỉ ở nhà cung cấp đồng bộ; căn chỉnh schema thử lại/lũy đẳng; không
  có bí danh chuẩn `EMAIL_VERIFY` hoặc `DUE_OR_FINE_NOTICE` và không lưu trữ
  hết hạn.
- `backend/tests/helpers/inMemoryNotificationRepositories.js` - fixture mẫu
  nhạy cảm/không nhạy cảm chứa biến OTP đã được phê duyệt, chọn pending đã lọc,
  lũy đẳng mọi trạng thái và hành vi thử lại không nhạy cảm khớp repository.
- `backend/tests/notificationRoutes.test.js` - từ chối không khớp loại/mẫu
  chuẩn, từ chối khóa nhạy cảm đệ quy chuẩn hóa đối tượng/mảng trong hàng đợi
  và che `safePayload`, kiểm thử kết xuất chỉ nhà cung cấp cho cả hai liên kết
  không rò rỉ qua lưu bền/API/kiểm toán/log, phản hồi tối thiểu thành công/thất
  bại nhạy cảm đồng bộ, xếp hàng không nhạy cảm, hành vi phát lại mọi trạng
  thái, xung đột thử lại/trạng thái và kiểm thử lũy đẳng.
- `backend/tests/integration.test.js` - cập nhật assertion phản hồi thông báo
  đầy đủ hiện có thành kỳ vọng DTO tối thiểu G2, bất kể migration FE07/FE08 có
  diễn ra hay không.
- `backend/src/docs/openapi.yaml` - xác thực yêu cầu đã phê duyệt, phản hồi
  `SENT`/`FAILED` 201 nhạy cảm đồng bộ, phản hồi xử lý không nhạy cảm, phát lại
  và hợp đồng lỗi thử lại.

### Các tích hợp đã phê duyệt và phụ thuộc bị hoãn

- `backend/src/services/borrowingService.js` và
  `backend/src/services/reservationService.js` - migration trong phạm vi từ tạo
  repository trực tiếp sang trình yêu cầu nguồn đã được phê duyệt sau khi nhiệm
  vụ trình yêu cầu được rà soát. Kiểm thử bị ảnh hưởng là
  `backend/tests/borrowingRoutes.test.js` và
  `backend/tests/reservationRoutes.test.js`; `backend/tests/integration.test.js`
  đã ở phạm vi FE10 mặc định cho G2.
- Tích hợp FE09 bị hoãn: sự kiện hạn trả/tiền phạt của nó được phê duyệt trong
  SPEC FE10 nhưng không có người gọi/tích hợp hiện tại. Không có thay đổi tệp
  service FE09 nào được lên kế hoạch trong lát cắt này; việc triển khai do FE09
  sở hữu trong tương lai trước tiên phải xác định sự kiện và điểm tích hợp thực.
- `backend/src/services/authService.js` - không thuộc phạm vi triển khai FE10
  mặc định. Đây là migration do FE02 sở hữu bị hoãn sau khi chủ sở hữu FE02 định
  tuyến gửi OTP qua trình yêu cầu ràng buộc FE02 và thay khóa cũ `EMAIL_VERIFY`
  bằng khóa chuẩn trong `.sdd/specs/feat-auth/SPEC.md`; chỉ cập nhật
  `backend/tests/authRoutes.test.js` trong công việc do FE02 sở hữu đó.

Không dự kiến tệp frontend, thông tin xác thực nhà cung cấp, mã SMTP thực,
dependency mới, giao diện thử lại, siêu dữ liệu hết hạn, framework migration
cơ sở dữ liệu hoặc tái cấu trúc không liên quan.

## 6. Các lát cắt triển khai B5 theo thứ tự

`TASKS.md` sở hữu phân rã B4 nguyên tử. Chuỗi bên dưới là thứ tự thực thi B5:
mỗi lát cắt triển khai bắt đầu bằng bằng chứng thất bại tập trung, nhận thay đổi
được phê duyệt nhỏ nhất, chạy lại kiểm thử tập trung, rồi chạy bộ bị ảnh hưởng.

1. **Đặc tả hóa hợp đồng đã phê duyệt.** Sau G1-G7 và các sửa SPEC bắt buộc,
   thêm assertion thất bại cho mọi cặp loại/mẫu chuẩn và từ chối không khớp;
   từ chối dữ liệu xếp hàng đối tượng/mảng đệ quy chuẩn hóa cho `OTP`,
   `reset_token`, `verification-link` và giá trị lồng nhau; che `safePayload`
   tương ứng; kết xuất chỉ nhà cung cấp cho mẫu OTP không có đầu ra lưu bền/API/
   kiểm toán/log; thành công/thất bại nhạy cảm đồng bộ; xếp hàng/xử lý lọc không
   nhạy cảm; DTO tạo/phát lại/xử lý tối thiểu; ID nguồn số nguyên; lũy đẳng mọi
   trạng thái; và kết quả thử lại nhạy cảm/không nhạy cảm.
2. **Tách gửi và chứa phản hồi.** Triển khai phân loại loại phía máy chủ và ánh
   xạ chuẩn. Yêu cầu xác thực nhạy cảm kết xuất `{{otp}}` và
   `{{expiresInMinutes}}` trong bộ nhớ, gọi bộ điều hợp nhà cung cấp đã cấu hình
   đồng bộ: thành công lưu `SENT`/lần thử và thất bại lưu `FAILED`/lần thử an
   toàn, trong khi cả hai trả DTO `201`. Yêu cầu không nhạy cảm trước tiên qua
   kiểm tra khóa nhạy cảm đối tượng/mảng đệ quy chuẩn hóa và che `safePayload`
   tương ứng, rồi kết xuất vào hàng đợi; `process-pending` chỉ chọn chúng. Xác
   minh OTP thô và nội dung nhạy cảm đã kết xuất không bao giờ tới lưu bền, API,
   kiểm toán hoặc log.
3. **Căn chỉnh schema/mẫu/lũy đẳng.** Áp dụng căn chỉnh seed mẫu chuẩn, sửa hợp
   đồng chỉ số nguyên, hành vi trùng lặp mọi trạng thái và lọc pending không
   nhạy cảm trên SQL, repository, model và helper trong bộ nhớ. Không thêm
   `EMAIL_VERIFY` hoặc coi `DUE_OR_FINE_NOTICE` là chuẩn khi chưa phê duyệt.
4. **Trình yêu cầu nguồn và migration FE07/FE08.** Triển khai và review trình
   yêu cầu trong danh sách cho phép ràng buộc khi khởi tạo, sau đó chỉ migration
   FE07/FE08. Xác nhận catch an toàn của người gọi giữ luồng nguồn và bản ghi
   kiểm toán nguồn có ID người dùng null cộng siêu dữ liệu nguồn đã ràng buộc.
   Không migration FE02; hoãn triển khai FE09 mặc dù sự kiện đã được phê duyệt.
5. **Thử lại thủ công.** Bổ sung hành vi `FAILED -> PENDING` được ủy quyền chỉ
   cho thông báo đã xếp hàng không nhạy cảm. Kiểm thử bản tóm tắt `200`, `409`
   cho trạng thái khác, bản ghi/khóa/lịch sử được giữ, kiểm toán và thân
   `409 REISSUE_REQUIRED` an toàn chuẩn cho cả hai loại xác thực nhạy cảm thất
   bại.
6. **Xác minh tích hợp.** Chạy kiểm thử FE10 và FE07/FE08 bị ảnh hưởng, bộ
   backend, kiểm tra traceability nếu có, `git diff --check`, quét placeholder,
   quét mâu thuẫn và review phạm vi diff cuối.

## 7. Rủi ro tích hợp, giả định và ngoài phạm vi

### Rủi ro tích hợp

- Việc gửi xác thực nhạy cảm hiện phụ thuộc khả dụng ngay lập tức của nhà cung
  cấp mô phỏng. FE10 không thể thử lại lỗi nhà cung cấp vì không có bí mật được
  lưu bền; tính năng nguồn phải phát hành sự kiện/khóa mới.
- FE02 hiện sở hữu email OTP trực tiếp trong khi đặc tả được phê duyệt mô tả
  liên kết mã thông báo. Migration FE02 trước khi chủ sở hữu giải quyết việc này
  sẽ có rủi ro thông điệp xác minh/đặt lại trùng và khóa mẫu sai.
- Thay đổi phản hồi HTTP tối thiểu có thể làm hỏng consumer/kiểm thử không được
  lập tài liệu đọc trường thông báo đầy đủ; SPEC được phê duyệt trở thành hợp
  đồng ghi nhận.
- Ánh xạ loại/mẫu và kiểm tra khóa nhạy cảm đối tượng/mảng đệ quy chuẩn hóa phải
  được thực thi phía máy chủ, bao gồm từ trình yêu cầu nguồn, không tin đầu vào
  người gọi; nếu không một yêu cầu không nhạy cảm không khớp hoặc xếp hàng có
  thể lưu nội dung bí mật. Cùng phép duyệt phải che `safePayload`, bao gồm khóa
  `OTP`, `reset_token` và `verification-link`.
- Lỗi nhà cung cấp nhạy cảm trả `201 FAILED` thay vì lỗi gửi 5xx vì FE10 đã
  chấp nhận và ghi yêu cầu mà không hoàn tác luồng nguồn; consumer phải dùng
  trạng thái trả về, không chỉ HTTP, để quan sát trạng thái gửi.
- Thay đổi schema/chỉ mục cần review của chủ sở hữu cơ sở dữ liệu cho instance
  triển khai, không chỉ lần chạy initializer mới.

### Ràng buộc triển khai đã được phê duyệt

- Điều cấm nội dung nhạy cảm trong danh sách kiểm tra review FE10 chi phối triển
  khai; gửi bộ điều hợp nhà cung cấp đồng bộ là bắt buộc cho hai loại xác thực
  nhạy cảm.
- Các cặp loại/mẫu được liệt kê là hợp đồng phía máy chủ đã phê duyệt;
  fixture `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` dùng `{{otp}}` và
  `{{expiresInMinutes}}`; `DUE_OR_FINE_NOTICE` không phải chuẩn nếu chưa được
  phê duyệt riêng.
- FE02 sở hữu tạo/xác thực OTP và migration trình yêu cầu ràng buộc FE02; FE10
  sở hữu gửi OTP chỉ qua nhà cung cấp và thực thi khóa chuẩn.
- Nhà cung cấp mô phỏng vẫn đủ cho Giai đoạn 1 và không đưa vào thông tin xác
  thực nhà cung cấp thực.
- Sự kiện nguồn FE07/FE08 được phê duyệt cho migration trình yêu cầu; sự kiện
  FE09 đã phê duyệt không có người gọi/tích hợp hiện tại và vẫn bị hoãn.

### Ngoài phạm vi

- Nội dung nhạy cảm đã xếp hàng dạng văn bản thuần hoặc mã hóa, màn hình hộp
  thư/thử lại/quản trị frontend, trình chỉnh sửa mẫu, trạng thái đọc trong ứng
  dụng, SMS, thông báo đẩy, tiếp thị, thông tin xác thực SMTP/nhà cung cấp thực,
  tạo hay xác thực mã thông báo, đối soát OTP/liên kết FE02, tính tiền phạt,
  quyết định hàng đợi đặt chỗ, thay đổi trạng thái mượn, và triển khai thông báo
  FE09 mới.

## 8. Danh sách kiểm tra review con người đã phê duyệt

- [x] G1 chấp nhận ánh xạ loại/mẫu chuẩn do máy chủ thực thi; fixture
  `{{otp}}` và `{{expiresInMinutes}}`; gửi xác thực nhạy cảm đồng bộ không lưu
  bền nội dung nhạy cảm đã kết xuất; và chỉ gửi xếp hàng cho loại không nhạy cảm
  sau khi kiểm tra khóa đối tượng/mảng đệ quy chuẩn hóa cùng che `safePayload`
  tương ứng.
- [x] G2 chấp nhận lỗi xác thực/mẫu 4xx an toàn, bản tóm tắt gửi nhạy cảm
  `201 SENT` và `201 FAILED`, bản tóm tắt phát lại `200` mọi trạng thái và
  không đối tượng hoặc mảng.
- [x] G3 chấp nhận factory nguồn ràng buộc, danh sách cho phép cố định, siêu dữ
  liệu kiểm toán người dùng null, cùng bảo vệ hàng đợi đệ quy chuẩn hóa/ánh xạ
  và che `safePayload` như HTTP, cùng migration có phạm vi chỉ FE07/FE08.
- [x] G4 chấp nhận Giai đoạn 1 chỉ số nguyên và sửa SPEC FE10.
- [x] G5 chấp nhận route thử lại không nhạy cảm được bảo vệ, chuyển đổi trạng
  thái, xung đột trạng thái và phản hồi `REISSUE_REQUIRED` an toàn chuẩn cho
  cả hai loại xác thực nhạy cảm.
- [x] G6 chấp nhận một bản ghi trên mỗi khóa lũy đẳng xuyên suốt mọi trạng thái
  và thử lại không nhạy cảm dùng lại.
- [x] G7 chấp nhận `ACCOUNT_VERIFICATION`/`PASSWORD_RESET` chuẩn, không có bí
  danh `EMAIL_VERIFY` và trì hoãn do chủ sở hữu FE02.
- [x] Sự kiện đã phê duyệt của FE09 được đánh dấu đúng là bị hoãn triển khai vì
  không có người gọi/tích hợp hiện tại, không có thay đổi tệp service FE09 nào
  được lập kế hoạch trong lát cắt này.
- [x] Các mục `TASKS.md` lịch sử đã hoàn tất được giữ nguyên, với phần củng cố
  đang chờ mới chỉ sau phê duyệt B3.
- [x] Phạm vi không frontend, chỉ nhà cung cấp mô phỏng, củng cố nhỏ nhất nhất
  quán là chấp nhận được.

## B4 hoàn tất; B5 đã triển khai; B6 và B7 hoàn tất

Phần này ban đầu dừng công việc sau B4 cho đến khi tài liệu được review và chủ
động chuyển sang nhánh triển khai. Cổng đó đã được đáp ứng; FE10-H01 đến
FE10-H08 đã được triển khai và review độc lập trên `feat/fe10-hardening`, còn
FE10-H09 vượt xác thực cuối và review toàn nhánh. Nhat sau đó phê duyệt tích
hợp, commit `9185a9a` đến `main` và CI cùng commit đạt trong lượt
`29236572558`.

## 9. Phần theo dõi ranh giới bảo mật OTP G8-G10

### 9.1 Mục tiêu và phạm vi

Triển khai ADR-004 như bản sửa liên tính năng nhỏ nhất, nhất quán:

- FE02 sở hữu thông tin xác thực OTP xác minh/đặt lại.
- FE10 sở hữu kết xuất, gửi qua nhà cung cấp đã cấu hình, trạng thái, lần thử
  và siêu dữ liệu nguồn an toàn.
- Chỉ trình yêu cầu ràng buộc với `FE02` được gửi `ACCOUNT_VERIFICATION` hoặc
  `PASSWORD_RESET`.
- Chỉ trình yêu cầu ràng buộc với `FE11` được gửi `ACCOUNT_SETUP` với
  `setupLink`, `expiresInHours` và siêu dữ liệu nguồn `AuthToken`.
- HTTP không thể gửi loại xác thực nhạy cảm hoặc `sourceFeature` do người gọi
  kiểm soát.
- Các lần ghi thông báo trực tiếp và gửi email trực tiếp để xác minh/đặt lại
  bị loại khỏi FE02.
- `CHANGE_PASSWORD_OTP`, chấp nhận mã thông báo cũ, tích hợp FE09, thay đổi
  frontend và tái cấu trúc không liên quan vẫn ngoài phạm vi.

### 9.2 Hợp đồng đã được phê duyệt

| Cổng | Quyết định đã phê duyệt |
| --- | --- |
| G8 | Thay `verificationLink`/`resetLink` bằng `otp` và `expiresInMinutes` bắt buộc. FE10 chỉ dùng OTP thô trong bộ nhớ nhà cung cấp và không lưu bền OTP hay nội dung nhạy cảm đã kết xuất. |
| G9 | HTTP nhân viên và trình yêu cầu không phải FE02 bị từ chối với xác minh/đặt lại FE02; ADR-005 cũng từ chối trình yêu cầu thiết lập tài khoản không phải FE11. HTTP không thể cung cấp `sourceFeature`. |
| G11 | `ACCOUNT_SETUP` ràng buộc FE11 gửi đồng bộ, không lưu thông tin xác thực/nội dung thiết lập, dùng ngữ nghĩa nguồn/lũy đẳng ID mã thông báo. |

## Phần theo dõi thiết lập tài khoản FE11

1. Thêm `FE11` vào danh sách cho phép trình yêu cầu ràng buộc khi khởi tạo mà
   không làm suy yếu quyền sở hữu FE02.
2. Thêm `ACCOUNT_SETUP -> ACCOUNT_SETUP` chuẩn với `setupLink` và
   `expiresInHours` bắt buộc.
3. Từ chối HTTP nhân viên và mọi trình yêu cầu không phải FE11 cho
   `ACCOUNT_SETUP`.
4. Gửi đồng bộ qua nhà cung cấp đã cấu hình và chỉ lưu siêu dữ liệu `AuthToken`
   an toàn, trạng thái, bản tóm tắt lỗi chung và lần thử.
5. Yêu cầu gửi lại FE11 tạo ID mã thông báo mới và khóa
   `FE11:ACCOUNT_SETUP:<tokenId>`; thử lại thủ công vẫn `REISSUE_REQUIRED`.
| G10 | FE02 dùng `AuthTokens.TokenId` cho tham chiếu nguồn và lũy đẳng, tạo một yêu cầu FE10 trên mỗi mã OTP, bảo toàn trạng thái nguồn khi thất bại và tạo sự kiện mới khi gửi lại. |

### 9.3 Các tệp dự kiến

- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.agents/CLAUDE.md`
- `.sdd/specs/feat-notification-management/{CONTEXT,SPEC,PLAN,TASKS,CHANGELOG}.md`
- `.sdd/specs/feat-auth/{CONTEXT,SPEC,PLAN,TASKS,CHANGELOG}.md`
- `backend/src/services/notificationService.js`
- `backend/src/services/authService.js`
- `backend/src/services/emailService.js`
- `backend/src/repositories/authTokenRepository.js`
- `backend/src/validators/notificationValidators.js`
- `backend/src/controllers/notificationController.js`
- `backend/src/docs/openapi.yaml`
- `database/Librarymanagement.sql`
- `backend/tests/notificationRoutes.test.js`
- `backend/tests/authRoutes.test.js`
- `backend/tests/helpers/inMemoryNotificationRepositories.js`
- `backend/tests/helpers/inMemoryAuthRepositories.js`
- `backend/tests/integration.test.js`

Không có tệp frontend, migration bảng/chỉ mục cơ sở dữ liệu, dependency mới,
giao diện thử lại, giao diện hộp thư, người gọi FE09 hoặc migration
`CHANGE_PASSWORD_OTP` nào được lên kế hoạch.

### 9.4 Các lát cắt TDD theo thứ tự

1. Thêm kiểm thử RED FE10 cho việc từ chối nhạy cảm HTTP/không phải FE02, từ
   chối ghi đè nguồn HTTP và chấp nhận OTP ràng buộc FE02.
2. Triển khai quyền sở hữu nguồn/loại và xác thực mẫu OTP, sau đó nối bộ điều
   hợp nhà cung cấp đã cấu hình trong khi giữ việc chèn nhà cung cấp trong kiểm
   thử.
3. Chứng minh gửi OTP chỉ trong bộ nhớ nhà cung cấp và lưu bền siêu dữ liệu
   nguồn/lũy đẳng an toàn.
4. Thêm kiểm thử RED FE02 cho một lần gọi trình yêu cầu, payload/lũy đẳng ID mã
   thông báo, không có lời gọi thông báo/email xác minh/đặt lại trực tiếp và
   không có trường mã thông báo debug HTTP.
5. Chỉ migration xác minh/đặt lại FE02, thu OTP kiểm thử qua dependency được
   chèn và giữ chấp nhận mã thông báo cũ cùng gửi `CHANGE_PASSWORD_OTP` trực
   tiếp.
6. Khóa hành vi không chặn `FAILED`/ngoại lệ và ngữ nghĩa gửi lại mã thông báo
   mới.
7. Chạy kiểm thử FE10/FE02 tập trung, kiểm thử tích hợp bị ảnh hưởng,
   traceability, quét rò rỉ/mâu thuẫn và `git diff --check`; sau đó dừng để
   review con người.

## 11. Phần theo dõi ranh giới kết quả tư cách thành viên FE04

1. Xử lý `FE04` là nguồn nội bộ ràng buộc khi khởi tạo mà không đổi hợp đồng tác
   nhân HTTP được bảo vệ.
2. Chỉ cho phép trình yêu cầu ràng buộc FE04 gửi
   `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` với siêu dữ liệu nguồn hồ sơ và khóa
   lũy đẳng đã phê duyệt.
3. Giữ phê duyệt/từ chối tư cách thành viên được commit khi FE10 trả `FAILED`
   hoặc ném lỗi trình yêu cầu an toàn.
4. Bổ sung kiểm thử hợp đồng và tích hợp tập trung trước khi tuyên bố FE04-T006
   hoặc FE10-S09 hoàn tất.

## 12. Khắc phục tuyên bố gửi bền vững

Người dùng đã phê duyệt thiết kế `PROCESSING` ngày 2026-07-23. Biện pháp khắc
phục giữ lời gọi nhà cung cấp ngoài giao dịch cơ sở dữ liệu trong khi làm quyền
sở hữu gửi bền vững trước lời gọi đó.

1. Yêu cầu mọi yêu cầu nguồn trong tiến trình gồm `sourceEntityType` không rỗng,
   `sourceEntityId` số nguyên dương và khóa lũy đẳng.
2. Lưu trực tiếp yêu cầu nhạy cảm là `PROCESSING`; nhận nguyên tử yêu cầu không
   nhạy cảm đã xếp hàng bằng `PENDING -> PROCESSING` và commit trước I/O nhà
   cung cấp.
3. Mở giao dịch ngắn mới cho `PROCESSING -> SENT` hoặc
   `PROCESSING -> FAILED` cùng hàng lần thử khớp.
4. Giữ một hàng `PROCESSING` nếu lưu bền kết thúc thất bại sau I/O nhà cung
   cấp. Loại hàng đó khỏi xử lý tự động và trả
   `409 DELIVERY_STATE_UNCERTAIN` cho thử lại thủ công.
5. Đồng bộ model, SQL chuẩn, OpenAPI, ADR và migration lũy đẳng; sau đó chạy
   kiểm thử tập trung/đầy đủ và hai lần thực thi migration dùng một lần trước
   review H2.

## 13. Xác thực mẫu đã lưu fail-closed v0.4.4

Kế hoạch thực thi chi tiết là
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Thêm kiểm thử RED theo bảng cho thẻ HTML thô, thuộc tính xử lý sự kiện nội
   tuyến và URL `javascript:` trong trường tiêu đề/nội dung mẫu đã lưu.
2. Yêu cầu `400 UNSAFE_TEMPLATE_DEFINITION` an toàn trước khi kết xuất người
   nhận, lưu bền thông báo/lần thử hoặc I/O nhà cung cấp.
3. Giữ `sanitizeString()` và `sanitizePayload()` cho giá trị khi chạy; không
   làm yếu phát hiện khóa bí mật đệ quy, che dữ liệu, quyền sở hữu, lũy đẳng,
   DTO tối thiểu hoặc quy tắc `PROCESSING` bền vững.
4. Chạy các hồi quy định nghĩa không an toàn cùng hồi quy làm sạch dữ liệu mẫu
   khi chạy hiện có và toàn bộ bộ route FE10.
5. Giữ thay đổi triển khai chưa commit cho đến khi bằng chứng L1-L4 liên tính
   năng đạt và Nhat cấp H2.

## 14. Khắc phục gửi email staging v0.4.5

Thiết kế đã được phê duyệt:
`docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.

1. Thêm và xác minh migration lũy đẳng cho mẫu `ACCOUNT_SETUP` hoạt động chuẩn;
   không xây lại hoặc xóa cơ sở dữ liệu hiện có.
2. Thu kết quả nhà cung cấp nhạy cảm và chỉ lưu `providerMessageId` qua giao
   dịch `markSent` được bảo vệ hiện có.
3. Tách vòng lặp gửi đã xếp hàng hiện có phía sau lõi riêng dùng chung. Giữ
   wrapper được nhân viên ủy quyền và thêm wrapper SYSTEM ràng buộc khi khởi tạo
   với siêu dữ liệu kiểm toán tổng hợp người dùng null.
4. Thêm tiến trình bật tùy chọn với lượt chạy ngay khi khởi động, khoảng lặp mặc
   định 60 giây, kích thước lô 20, bảo vệ chồng lấp, mã lỗi an toàn và hành vi
   dừng.
5. Nối tiến trình vào vòng đời HTTP backend mà không thay đổi export ứng dụng
   Express trực tiếp hoặc khởi động timer khi import module.
6. Giữ phần triển khai sinh ra chưa commit cho đến khi xác thực tập trung/đầy
   đủ, quét bí mật, kiểm tra an toàn staging và review H2 đạt.

## 15. Hộp thư thông báo cá nhân v0.5.0

Kế hoạch thực thi chi tiết:
`docs/superpowers/plans/2026-07-27-fe10-personal-notification-inbox.md`.

### 15.1 Mục tiêu và kiến trúc

Đưa ra một hộp thư chỉ chứa bản ghi của chính mình cho các tài khoản
`MEMBER`, `LIBRARIAN` và `ADMIN` đã xác thực bằng cách thêm
`Notifications.ReadAt` có thể null. Tái sử dụng mỗi hàng thông báo không nhạy
cảm đủ điều kiện hiện có cho cả xử lý email và hiển thị hộp thư; không tạo kênh,
bảng, sự kiện trùng, nhật ký toàn nhân viên, thao tác xóa hay trạng thái lưu trữ
khác.

Chuỗi triển khai là additive và ưu tiên backend:

1. thêm và xác minh migration có thể lặp lại tương thích Azure SQL và
   model/schema chuẩn;
2. thêm thao tác repository của chính người dùng được lọc SQL và ánh xạ phép
   chiếu/thao tác an toàn phía máy chủ cố định;
3. thêm API đã xác thực liệt kê, đếm, đánh dấu một và đánh dấu tất cả;
4. thêm client/context frontend dùng chung, thăm dò chưa đọc, phần xem trước
   chuông và trang `/notifications`;
5. chứng minh fan-in FE04/FE07/FE08, hành vi trình duyệt ba vai trò, khả năng
   lặp lại migration, fan-out tài liệu và rollout Azure staging.

### 15.2 Các lát cắt TDD theo thứ tự

| Lát cắt | Kết quả | Chấp nhận chính |
| --- | --- | --- |
| FE10-I01 | Migration `ReadAt`, điền lùi, chỉ mục, schema/model chuẩn | AC-FE10-011 đến AC-FE10-014 |
| FE10-I02 | Thao tác liệt kê/đếm/đọc do SQL sở hữu và phép chiếu thao tác an toàn | AC-FE10-011 đến AC-FE10-015 |
| FE10-I03 | API đã xác thực, kiểm tra hợp lệ, `404` an toàn trước IDOR, OpenAPI | AC-FE10-011 đến AC-FE10-015 |
| FE10-I04 | Client API frontend và context hộp thư dùng chung | AC-FE10-012, AC-FE10-013, AC-FE10-016 |
| FE10-I05 | Chuông shell, huy hiệu `99+`, phần xem trước năm mục chưa đọc, điều hướng an toàn | AC-FE10-015, AC-FE10-016 |
| FE10-I06 | Bộ lọc `/notifications`, phân trang, trạng thái đọc, đánh dấu tất cả | AC-FE10-011, AC-FE10-014, AC-FE10-016 |
| FE10-I07 | Fan-in FE04/FE07/FE08 cùng E2E MEMBER/LIBRARIAN/ADMIN | AC-FE10-011 đến AC-FE10-016 |
| FE10-I08 | Cổng đầy đủ, tài liệu, bằng chứng migration, Azure staging ưu tiên backend | AC-FE10-011 đến AC-FE10-016 |

### 15.3 Cổng review và phát hành

- Phê duyệt kế hoạch chỉ mở triển khai; mỗi lát cắt vẫn theo RED, GREEN, xác
  minh tập trung, review và commit có giới hạn.
- Migration phải đạt hai lần với cơ sở dữ liệu SQL Server dùng một lần trước H2
  và trước khi dùng staging.
- API backend và migration triển khai trước frontend. Frontend cũ vẫn tương
  thích xuyên suốt checkpoint đó.
- H2 review candidate cục bộ đầy đủ. H3 kiểm tra lại đặc tả, quyền sở hữu, loại
  trừ dữ liệu nhạy cảm, an toàn migration và bằng chứng staging trước merge.

### 15.4 Candidate cuối và trạng thái giao hàng

- Head PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` chứa gói FE10-I01..I08
  được H2 phê duyệt cuối và biện pháp khắc phục H3 có giới hạn sau rebase chỉ
  tài liệu `main@30f936d`.
- CI exact-head `30317424995` và triển khai Azure staging `30317621429` đã
  đạt. H3 đã review cùng head theo trục Tiêu chuẩn và Đặc tả không có finding
  có thể hành động, và người dùng phê duyệt H3 rõ ràng.
- PR #75 đã merge thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu
  merge chính xác `30341279111` và Azure staging tự động `30341540847` đã đạt,
  bao gồm preflight migration, backend, frontend và smoke.
- Bằng chứng API/trình duyệt ba vai trò lịch sử, bằng chứng Azure SQL
  `ReadAt`/chỉ mục, loại trừ nhạy cảm, phát lại đọc, HTTPS/CORS và dọn dẹp
  probe/firewall tạm thời vẫn là bằng chứng hợp lệ cho hợp đồng không đổi.

### 15.5 Phụ lục triển khai H1

Người dùng đã phê duyệt phụ lục này ngày 2026-07-28 sau khi upstream
`main@41282b4` đưa vào triển khai staging tự động có cổng CI:

- giữ triển khai tự động sau CI `main` exact-commit thành công và giữ
  `workflow_dispatch` cho lượt chạy lại của operator;
- yêu cầu cả hai đường dẫn khớp SHA-256 migration đã checkout với biến Môi
  trường GitHub `staging` không bí mật `FE10_INBOX_MIGRATION_SHA256`;
- bổ sung yêu cầu `fe10_inbox_migration_confirmed=true` cho lượt chạy thủ công;
- giữ thứ tự preflight -> backend -> frontend -> smoke;
- áp dụng/xác minh migration, loại truy cập firewall tạm thời, lưu hash migration
  và xác minh thủ công head PR chính xác trước H3/merge;
- sau merge, theo dõi CI hậu merge chính xác và lượt staging tự động kết quả cho
  cùng bằng chứng migration.

Sau đó người dùng phê duyệt phụ lục chênh lệch Core H1 cho `main@5a3c84b` ngày
2026-07-28. Đối soát phải giữ migration khởi động
`add_change_password_otp_token_type.sql` đóng gói ở upstream, tài liệu/kiểm
thử readiness của nó và seed xác minh tài khoản tiếng Việt, đồng thời giữ
preflight FE10 và triển khai có thứ tự. Các cổng đầy đủ sau chênh lệch và
fingerprint/H2 mới là bắt buộc trước khi công bố.

Sau rebase đó, upstream lại tiến thêm ba commit qua `main@db97f17`. Người dùng
phê duyệt phụ lục chênh lệch Core H1 thứ hai ngày 2026-07-28. Đối soát giữ lý do
hủy đặt chỗ mặc định tiếng Việt ở upstream và kiểu tab trả/đặt chỗ đáp ứng, cùng
mọi chỉnh sửa vòng hai FE07/FE08/FE10/FE12 khác ở upstream, trong khi giữ client
hộp thư FE10 và kiểu thông báo theo phạm vi. Các cổng đầy đủ sau chênh lệch và
fingerprint/H2 mới vẫn bắt buộc trước công bố.

Upstream sau đó tiến qua `main@12faead` bằng cách chỉ xóa tệp đã ngừng dùng dưới
`document/`. Người dùng đã phê duyệt phụ lục chênh lệch H1 thứ ba ngày
2026-07-28. Không có chồng lấp đường dẫn hoặc hợp đồng LÕI với biện pháp khắc
phục H3 FE10, và rebase hoàn tất không xung đột. Các cổng đầy đủ và fingerprint
H2 mới vẫn bắt buộc; sau công bố, head chính xác phải thay `main` hiện tại ở
Azure staging và được xác minh tại đó trước H3 lặp lại.

Ma trận cục bộ đầy đủ sau đó đạt: backend 69/69 bộ và 1116/1116 kiểm thử;
frontend 259/259 cùng lint/build; triển khai 20/20; hệ thống 10/10; trạng thái
traceability 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị schema
Azure, vệ sinh diff và quét mâu thuẫn tập trung.

Trước khi H2 vòng 3 đã phê duyệt có thể được dùng, lượt fetch tiền staging bắt
buộc đã tiến upstream tới `main@a240705`. Người dùng đã phê duyệt phụ lục chênh
lệch H1 thứ tư ngày 2026-07-28. Đối soát giữ việc upstream loại bỏ bề mặt API/
UI/kiểm thử chỉnh sửa người dùng Quản trị FE11 trong khi giữ FE10. CI main
`30311801599` và triển khai Azure `30311973740` đã đạt, nhánh rebase không xung
đột, và các cổng đầy đủ cùng fingerprint/H2 mới là bắt buộc.

Xác thực mới trên baseline chính xác đó đạt backend 69/69 bộ và 1084/1084 kiểm
thử, frontend 259/259 cùng lint/build, triển khai 20/20, hệ thống 10/10, trạng
thái traceability 3/3, traceability FE10 14/16 (88%), Chromium 11/11, kiểm
toán, chuẩn bị schema Azure và vệ sinh diff. Checkpoint lịch sử đó được thay thế
bởi chuỗi cuối đã hoàn tất trong Phần 15.4.

## 16. Kế hoạch template kết quả FE07 v0.6.0

1. `SL-001`: merge governance activation.
2. `SL-002` RED: canonical type/template/source ownership, inbox eligibility,
   fixed action path, idempotent replay và sensitive-field exclusions.
3. `SL-002` GREEN: mở rộng bốn `GENERAL_SYSTEM` template FE07 và migration seed
   additive, không thêm bảng/kênh.
4. Chạy migration contract, repository/routes/inbox/frontend focused tests rồi
   `SL-006` integration/E2E.
5. FE10 không quyết định trạng thái FE07/FE08; product diff uncommitted đến H2.
