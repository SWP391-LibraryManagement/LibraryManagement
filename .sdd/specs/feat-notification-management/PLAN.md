# PLAN.md - FE10 Quản lý thông báo

Trạng thái: HOÀN THÀNH; PR #89 ĐÃ HỢP NHẤT; CI VÀ AZURE ĐÃ CHẠY THÀNH CÔNG TRÊN ĐÚNG COMMIT

Chủ sở hữu: Nhat

Cập nhật: 2026-08-01

Phê duyệt: G1-G7 được phê duyệt 2026-07-13; G8-G10/ADR-004 và G11/ADR-005
được phê duyệt 2026-07-15; ranh giới FE04 G12 được Nhat phê duyệt
2026-07-17

Trạng thái quy trình: mốc chuẩn giao hàng Giai đoạn 2/G1-G12 và v0.4.5 đã được
phê duyệt vẫn hoàn tất. Người dùng đã phê duyệt thiết kế hộp thư thông báo cá
nhân v0.5.0 và SPEC hợp nhất bằng văn bản ngày 2026-07-27, sau đó phê duyệt kế
hoạch triển khai và phân rã nhiệm vụ FE10-I01..I08 dưới H1 ngày 2026-07-28.
PR #70 về quản trị đã vào `main` tại `25c09ec`. Sau khi cập nhật nhánh với phần
thay đổi chỉ gồm tài liệu,
tài liệu `main@30f936d`, H2 đã phê duyệt mã đối chiếu nội dung
`e123345be05b59a9e519d182b301ab5464160e8fc32aed8d17d3c463e28e0a15`.
Commit PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` đã đạt CI đúng commit
`30317424995` và môi trường thử nghiệm Azure `30317621429`, nhận H3 hai trục sạch và phê
duyệt rõ ràng, rồi hợp nhất thành
`b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu hợp nhất chính xác
`30341279111` và môi trường thử nghiệm Azure tự động `30341540847` đều đạt. FE10-I01 đến
FE10-I08 cùng biện pháp khắc phục có giới hạn đã hoàn tất. Hoàn tất tiếp theo
`6189b1a` đã hợp nhất qua PR #89 thành `main@39092fb`; CI `30675444178` và Azure
môi trường thử nghiệm `30675744992` đều đạt đúng commit.

---

> Phần 1-8 giữ lịch sử củng cố G1-G7 đã hoàn tất. Phần 9 thay thế các phát biểu
> lịch sử về liên kết xác minh, nhà cung cấp chỉ mô phỏng và trì hoãn bản cập nhật cơ sở dữ liệu
> FE02. Phần 10 ghi nhận công việc thiết lập FE11 đã hoàn tất, còn Phần 11 là
> phần theo dõi ranh giới kết quả tư cách thành viên FE04 hiện tại.

## Kế hoạch G1-G7 lịch sử (được thay thế khi Phần 9-11 khác biệt)

Nhat đã phê duyệt các khuyến nghị ràng buộc G1-G7 ngày 2026-07-13. Phê duyệt
đó lần đầu cho phép phân rã nhiệm vụ B4. Tài liệu B4 đã được rà soát, B5 sau đó
tiến hành trên `feat/fe10-hardening` và FE10-H01 đến FE10-H08 hoàn tất.
FE10-H09 vượt cổng xác thực và rà soát độc lập B6. Commit
`9185a9a91f41e444e0c4e6bd8c0605a281272ee9` sau đó được hợp nhất vào `main`, và
lượt CI GitHub Actions `29236572558` đạt cho cùng commit. Bằng chứng B7 được
ghi trong `.sdd/reviews/fe10-b7-integration-review-closeout-2026-07-13.md`.

**Mục tiêu G1-G7 lịch sử:** cung cấp đợt củng cố backend FE10 nhỏ nhất đã được
phê duyệt khi đó. Phần 9-11 là nguồn chuẩn về quyền sở hữu OTP, thiết lập tài
khoản và kết quả tư cách thành viên.

**Mốc chuẩn bằng chứng lịch sử (2026-07-13):** chỉ được giữ để giải thích lịch
sử triển khai G1-G7. Đây không phải hợp đồng OTP hiện tại; Phần 9 và
`SPEC.md` v0.4.1 thay thế các phát biểu về mẫu liên kết và trì hoãn FE02.

## 1. Phân loại LÕI và VỎ

| Phân loại | Thành phần | Cơ sở lý do và cách tiếp cận đã được phê duyệt để rà soát |
| --- | --- | --- |
| LÕI | Ranh giới gửi xác thực nhạy cảm | SPEC FE10 hiện tại cấm lưu vào cơ sở dữ liệu nội dung OTP nhạy cảm. Với `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`, kiểm tra hợp lệ `templateData` thô, tạo nội dung từ mẫu rồi gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình trong FE10, chỉ lưu vào cơ sở dữ liệu bản tóm tắt thông báo/`safePayload` đã che dữ liệu, trạng thái và lần gửi. Mẫu chuẩn yêu cầu `{{otp}}` và `{{expiresInMinutes}}`. Không bao giờ lưu vào cơ sở dữ liệu, ghi log, ghi kiểm toán hoặc trả về OTP thô hay tiêu đề/nội dung nhạy cảm đã tạo từ mẫu. Khi nhà cung cấp thất bại, chỉ ghi bản tóm tắt thất bại an toàn. FE02 vẫn là chủ sở hữu duy nhất của việc tạo và xác thực OTP. |
| LÕI | Gửi thông báo không nhạy cảm đã xếp hàng | Các thông báo đặt chỗ, hạn trả, quá hạn, tiền phạt và thông báo chung vẫn được xếp hàng. Khi tạo yêu cầu, FE10 tạo tiêu đề/nội dung từ mẫu rồi lưu vào cơ sở dữ liệu. `process-pending` chỉ chọn các bản ghi `PENDING` không nhạy cảm để gửi. Hệ thống duyệt đệ quy đối tượng và mảng `templateData`, chuyển khóa về chữ thường và bỏ dấu gạch dưới, gạch nối, khoảng trắng. Yêu cầu bị từ chối nếu khóa sau khi chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink` hoặc `resetlink`. Quy tắc này phát hiện cả `OTP`, `reset_token`, `verification-link` và dữ liệu lồng nhau trước khi bí mật có thể đi vào `Body` đã lưu. `safePayload` cũng được che dữ liệu theo cùng quy tắc. |
| LÕI | Hợp đồng loại/mẫu | Mã phía máy chủ, không phải cờ do người gọi cung cấp, thực thi các cặp: `ACCOUNT_VERIFICATION -> ACCOUNT_VERIFICATION`; `PASSWORD_RESET -> PASSWORD_RESET`; `RESERVATION_AVAILABLE -> RESERVATION_READY`; `DUE_DATE_REMINDER -> DUE_DATE_REMINDER`; `OVERDUE_NOTICE -> OVERDUE_NOTICE`; `FINE_NOTICE -> FINE_NOTICE`; `GENERAL_SYSTEM -> MEMBERSHIP_RESULT`. Từ chối mọi trường hợp không khớp. `DUE_OR_FINE_NOTICE` không phải chuẩn nếu chưa được phê duyệt riêng. |
| LÕI | Hợp đồng phản hồi API công khai | Thao tác tạo/xử lý hiện làm lộ bản ghi đầy đủ, bao gồm nội dung và dữ liệu an toàn. Lỗi xác thực/mẫu vẫn trả phản hồi 4xx an toàn thông thường. Thành công từ nhà cung cấp nhạy cảm lưu thông báo/lần thử `SENT` và trả về `201 { notificationId, status: "SENT" }`; thất bại của nhà cung cấp nhạy cảm lưu thông báo/lần thử `FAILED` với lý do an toàn và vẫn trả về `201 { notificationId, status: "FAILED" }` vì yêu cầu đã được chấp nhận và luồng nguồn không được hoàn tác. Việc tạo không nhạy cảm trả về cùng DTO tối thiểu với trạng thái đã lưu. Mọi phát lại lũy đẳng trả `200 { notificationId, status }` cho trạng thái hiện có; xử lý trả `200 { processed, failed }`. Không trả về đối tượng hoặc mảng đầy đủ. |
| LÕI | Ranh giới tác nhân và nguồn nội bộ | `createSourceNotificationRequester(sourceFeature)` ràng buộc một nguồn trong `FE02`, `FE07`, `FE08`, `FE09`, `FE11` hoặc `SYSTEM`; nguồn được ràng buộc khi khởi tạo thay vì tin đầu vào. Quyền sở hữu nguồn/loại được thực thi trước khi tạo nội dung từ mẫu hoặc lưu vào cơ sở dữ liệu. Các tuyến API HTTP vẫn là `LIBRARIAN`/`ADMIN` cho loại không nhạy cảm. |
| LÕI | Mô hình trạng thái thử lại và lũy đẳng | Q-FE10-005 hứa hẹn thử lại thủ công nhưng không có chuyển đổi, và chỉ mục cơ sở dữ liệu áp dụng mọi trạng thái trong khi tra cứu chỉ trạng thái hoạt động. Chính sách được khuyến nghị: một bản ghi cho mỗi khóa chống gửi trùng xuyên suốt mọi trạng thái; tra cứu bao phủ mọi trạng thái; giữ chỉ mục duy nhất mọi trạng thái hiện tại; thử lại dùng lại cùng bản ghi/khóa/lịch sử đã xếp hàng không nhạy cảm. |
| LÕI | Loại tham chiếu nguồn và khóa mẫu | Hợp đồng dữ liệu ghi số nguyên/chuỗi nhưng mọi PK nguồn và tầng thực thi FE10 là `INT`; FE02 trực tiếp dùng `EMAIL_VERIFY` trong khi khóa SQL/đặc tả chuẩn bao gồm `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`. Quyết định Giai đoạn 1 được khuyến nghị là chỉ số nguyên, kèm sửa SPEC FE10. Xác định `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` là khóa chuẩn; không bổ sung bí danh `EMAIL_VERIFY` không được lập tài liệu. |
| VỎ | Hệ thống kết nối HTTP/bộ điều khiển/validator | Các thành phần này thực hiện hợp đồng phản hồi và thử lại đã được phê duyệt nhưng không quyết định quyền hoặc quy tắc nghiệp vụ. Giữ tuyến API mỏng. |
| VỎ | Tầng truy cập dữ liệu trong bộ nhớ và kiểm thử | Dữ liệu kiểm thử và khẳng định kiểm thử phải phản chiếu việc gửi đồng bộ nhạy cảm, xếp hàng không nhạy cảm, khả năng xử lý lặp an toàn và ngữ nghĩa thử lại; chúng là bằng chứng cho hành vi LÕI. |
| VỎ | Mô tả OpenAPI | Nó ghi lại hợp đồng tuyến API/phản hồi đã được phê duyệt trong B5 sau sửa SPEC; nó không đưa ra quyết định sản phẩm. |

## 2. Các quyết định cụ thể được phê duyệt cho B4

| Cổng | Chênh lệch đã chứng minh | Khuyến nghị ràng buộc để phê duyệt | Phương án thay thế và hệ quả |
| --- | --- | --- | --- |
| G1: kiến trúc gửi nhạy cảm | Việc làm sạch chạy trước khi tạo nội dung từ mẫu; danh sách kiểm tra rà soát FE10 cấm lưu nội dung OTP nhạy cảm; xử lý bình thường cần nội dung xếp hàng đã lưu vào cơ sở dữ liệu. | Tách theo cặp loại/mẫu do máy chủ thực thi. Dữ liệu kiểm thử SQL/kiểm thử yêu cầu `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` chứa `{{otp}}` và `{{expiresInMinutes}}`; tạo nội dung từ mẫu rồi gửi đồng bộ và chỉ lưu bản tóm tắt/`safePayload` đã che dữ liệu, trạng thái gửi và lần thử. Không lưu tiêu đề/nội dung nhạy cảm đã tạo từ mẫu hoặc giá trị OTP thô. Chỉ xếp hàng các cặp loại/mẫu đã quy định không nhạy cảm; duyệt đệ quy đối tượng/mảng, chuẩn hóa khóa bằng chữ thường và loại `_`, `-`, khoảng trắng, rồi từ chối nếu khóa chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink` hoặc `resetlink`. Dùng cùng quy tắc đệ quy chuẩn hóa để che `safePayload`. | Nội dung nhạy cảm đã xếp hàng dạng văn bản thuần cần sửa SPEC, chuẩn kiểm soát truy cập cơ sở dữ liệu rõ ràng và chủ sở hữu được chỉ định. Dữ liệu gửi mã hóa sống ngắn bị từ chối vì quá kỹ thuật cho Giai đoạn 1. |
| G2: phản hồi tối thiểu | Bộ điều khiển trả kết quả tầng dịch vụ chứa thông báo/mảng đầy đủ. | Giữ lỗi xác thực/mẫu là phản hồi 4xx an toàn thông thường. Thành công nhà cung cấp nhạy cảm lưu `SENT` cùng lần thử và trả `201 { notificationId, status: "SENT" }`; thất bại nhà cung cấp nhạy cảm lưu `FAILED` cùng lý do lần thử an toàn và trả `201 { notificationId, status: "FAILED" }`. Việc tạo không nhạy cảm trả trạng thái tối thiểu đã lưu. Phát lại lũy đẳng trả `200 { notificationId, status }` cho bất kỳ trạng thái hiện có nào; xử lý trả `200 { processed, failed }`; không bao giờ trả đối tượng/mảng đầy đủ. | Giữ đối tượng đầy đủ mâu thuẫn SPEC hiện tại và để lộ nội dung. |
| G3: thành phần gửi yêu cầu nội bộ | Tuyến API/tầng dịch vụ yêu cầu `LIBRARIAN`/`ADMIN`; tính năng nguồn cần ranh giới trong tiến trình đáng tin cậy. | Dùng `createSourceNotificationRequester(sourceFeature)` với danh sách cho phép `FE02`/`FE07`/`FE08`/`FE09`/`FE11`/`SYSTEM`, siêu dữ liệu ràng buộc khi khởi tạo, quyền sở hữu nguồn/loại, kiểm toán nguồn `userId: null`, lỗi an toàn và catch không chặn ở phía người gọi. | HTTP nội bộ đã xác thực sẽ cần thông tin xác thực dịch vụ và nhiều công việc ranh giới hơn. Không tạo vai trò đăng nhập `SYSTEM`. |
| G4: ID thực thể nguồn | SPEC cho phép số nguyên/chuỗi; validator/tầng truy cập dữ liệu/mô hình/SQL là `INT`, còn khóa chính nguồn hiện tại là số nguyên. | Giai đoạn 1 chỉ dùng số nguyên; sửa yêu cầu dữ liệu SPEC FE10 từ số nguyên/chuỗi thành số nguyên. | Hỗ trợ chuỗi yêu cầu bản cập nhật cơ sở dữ liệu cấu trúc cơ sở dữ liệu phối hợp và cập nhật validator/mô hình/tầng truy cập dữ liệu. Không âm thầm mở rộng/thu hẹp hợp đồng. |
| G5: thử lại thủ công | Không có hành vi tuyến API/tầng dịch vụ/tầng truy cập dữ liệu thử lại; `FAILED` không bao giờ được chọn lại bởi xử lý đang chờ. | Thêm `POST /api/notifications/{id}/retry` được bảo vệ cho `LIBRARIAN`/`ADMIN`. Chỉ cho phép một thông báo đã xếp hàng không nhạy cảm `FAILED` chuyển sang `PENDING`, giữ nguyên bản ghi, khóa chống gửi trùng và lịch sử lần thử; trả `200 { notificationId, status }` và `409` trong trường hợp khác. Thử lại `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET` trả thân lỗi `409` an toàn chuẩn với mã `REISSUE_REQUIRED` và thông điệp chung hướng dẫn tạo sự kiện nguồn mới; không gồm bí mật hay chi tiết nhà cung cấp. | Quy trình vận hành không có endpoint chỉ có thể thực hiện nếu tác nhân, cơ chế, chuyển đổi, kiểm toán và hợp đồng phản hồi của nó được thêm vào SPEC. Không thể thực thi thử lại cho đến khi một phương án được phê duyệt. |
| G6: lũy đẳng trạng thái kết thúc | Chỉ mục duy nhất SQL áp dụng mọi trạng thái; tầng dịch vụ tra cứu chỉ trạng thái hoạt động, vì vậy bản ghi kết thúc có thể chặn chèn mới ngoài dự kiến. | Một bản ghi cho mỗi khóa xuyên suốt mọi trạng thái: đổi ngữ nghĩa tra cứu sang mọi trạng thái, giữ chỉ mục duy nhất mọi trạng thái hiện có và cho thử lại không nhạy cảm dùng lại bản ghi. | Chỉ mục duy nhất đã lọc chỉ trạng thái hoạt động cho phép bản ghi mới sau trạng thái kết thúc nhưng đòi hỏi thay đổi cấu trúc cơ sở dữ liệu/chỉ mục và làm yếu tính duy nhất sự kiện nguồn. Không đổi riêng tra cứu. |
| G7: phụ thuộc FE02 và căn chỉnh khóa mẫu | Đặc tả FE02/FE10 được phê duyệt dựa trên OTP. Code FE02 lịch sử gửi OTP trực tiếp và dùng khóa cũ `EMAIL_VERIFY`, trong khi hợp đồng FE10 chuẩn dùng `ACCOUNT_VERIFICATION` và `PASSWORD_RESET`. | FE10 sở hữu ranh giới gửi và FE02 sở hữu tạo/xác thực OTP. Phần theo dõi FE02 định tuyến xác minh/đặt lại qua thành phần gửi yêu cầu ràng buộc FE02 với khóa mẫu chuẩn, không gửi trực tiếp trùng. | Không giới thiệu bí danh thông báo `EMAIL_VERIFY` không được lập tài liệu. Việc trì hoãn FE02 trước đây được thay thế bởi FE10-S04/FE02-T031 qua B7. |

## 3. Cách tiếp cận được khuyến nghị và các phương án

### Khuyến nghị: củng cố FE10 nhỏ nhất, nhất quán, tuân thủ SPEC hiện tại

1. G1-G7 đã được phê duyệt. B5 bắt đầu với việc chủ sở hữu tính năng cập nhật
   `SPEC.md`/`CHANGELOG.md` FE10 cho các hợp đồng quan sát được đã chọn; chủ
   sở hữu FE02 giải quyết phụ thuộc FE02 riêng trước mọi bản cập nhật cơ sở dữ liệu FE02.
2. Thực thi ánh xạ loại/mẫu chuẩn trước khi gửi. Yêu cầu `{{otp}}` và
   `{{expiresInMinutes}}` trong dữ liệu kiểm thử SQL/kiểm thử `ACCOUNT_VERIFICATION` và
   `PASSWORD_RESET`. Với loại xác thực nhạy cảm, kiểm tra dữ liệu mẫu thô, kết
   xuất và gửi đồng bộ qua bộ điều hợp nhà cung cấp đã cấu hình. Khi nhà cung
   cấp thành công, lưu `SENT` cùng lần thử và trả DTO tối thiểu `201`; khi thất
   bại, lưu `FAILED` cùng lý do an toàn và vẫn trả DTO tối thiểu `201`. Nội
   dung nhạy cảm đã tạo từ mẫu và giá trị thô không vượt ranh giới lưu vào cơ sở dữ liệu, ghi
   log, kiểm toán hoặc HTTP.
3. Với loại không nhạy cảm, duyệt đệ quy đối tượng/mảng trong `templateData`,
   chuẩn hóa khóa bằng chữ thường và loại `_`, `-`, khoảng trắng, từ chối mọi
   khóa chuẩn hóa chứa `token`, `otp`, `password`, `verificationlink` hoặc
   `resetlink`; áp dụng cùng quy tắc khi che `safePayload`. Sau đó kiểm tra,
   tạo nội dung từ mẫu và lưu vào hàng đợi; `process-pending` chỉ chọn bản ghi
   `PENDING` không nhạy cảm. Bổ sung DTO bộ điều khiển tối thiểu, thành phần gửi yêu cầu
   nguồn ràng buộc khi khởi tạo, kiểm tra khóa mẫu chuẩn, xác thực tham chiếu
   nguồn chỉ số nguyên và tra cứu lũy đẳng mọi trạng thái.
4. Chỉ bổ sung thử lại được bảo vệ cho thông báo đã xếp hàng không nhạy cảm thất
   bại; trả `409 REISSUE_REQUIRED` an toàn cho cả hai loại xác thực nhạy cảm.
   Chỉ di chuyển FE07 và FE08 sau khi thành phần gửi yêu cầu nguồn được triển khai và
   rà soát. Sự kiện hạn trả/tiền phạt của FE09 được phê duyệt trong SPEC FE10
   nhưng không có người gọi/tích hợp hiện tại, nên triển khai của nó bị hoãn;
   FE02 vẫn là phụ thuộc hoãn của chủ sở hữu.
5. Giữ nhà cung cấp mô phỏng, phân tầng Express/SQL Server và phạm vi không
   frontend.

### Phương án A: nội dung nhạy cảm đã xếp hàng dạng văn bản thuần

Xếp hàng nội dung xác thực nhạy cảm và lưu nội dung đã tạo từ mẫu để xử lý sau.
Điều này khôi phục một chế độ gửi nhưng vi phạm quy tắc danh sách kiểm tra rà soát
FE10 hiện tại. Nó cần sửa SPEC, chuẩn kiểm soát truy cập cơ sở dữ liệu rõ ràng
và chủ sở hữu vận hành được chỉ định trước khi triển khai.

### Phương án B: dữ liệu đã xếp hàng mã hóa sống ngắn

Mã hóa dữ liệu sống ngắn và giải mã tại thời điểm xử lý. Điều này giảm phơi lộ
văn bản thuần trong cơ sở dữ liệu nhưng đưa vào vòng đời khóa, xoay vòng, khôi
phục lỗi và độ phức tạp vận hành vượt phạm vi Giai đoạn 1. Nó bị từ chối cho đợt
này.

### Phương án C: thành phần gửi yêu cầu HTTP nội bộ đã xác thực

Dùng thông tin xác thực dịch vụ nội bộ để gọi endpoint yêu cầu được bảo vệ. Điều
này hợp lệ cho việc tách dịch vụ trong tương lai nhưng cần xử lý bí mật/cấu hình
được phê duyệt và thay đổi middleware/kiểm thử rộng hơn. Factory trong tiến
trình được khuyến nghị nhỏ hơn cho monolith hiện tại.

## 4. Cấu trúc tác nhân có giới hạn

Ở B5, một tác nhân triển khai có phạm vi ghi độc quyền trên mỗi nhiệm vụ củng
cố FE10 đã được phê duyệt; một người rà soát độc lập xác minh phần thay đổi của mỗi nhiệm
vụ và bằng chứng kiểm thử. Không chạy chỉnh sửa song song trên các tệp tầng dịch vụ,
tầng truy cập dữ liệu, tuyến API hoặc kiểm thử thông báo FE10 dùng chung vì gửi nhạy cảm, xếp
hàng, thử lại, khả năng xử lý lặp an toàn và tích hợp nguồn cùng chia sẻ một hợp đồng. Cơ
hội song song thận trọng duy nhất là các bản cập nhật cơ sở dữ liệu người gọi FE07 và FE08 tách
biệt sau khi phụ thuộc thành phần gửi yêu cầu chung hoàn tất.

## 5. Các tệp dự kiến chính xác

### Bản ghi lập kế hoạch B4 và tệp điều kiện tiên quyết B5

- `.sdd/specs/feat-notification-management/SPEC.md` - nhiệm vụ B5 đầu tiên
  sửa hợp đồng quan sát được G1-G7 đã được phê duyệt trước khi triển khai bắt
  đầu.
- `.sdd/specs/feat-notification-management/CHANGELOG.md` - nhiệm vụ B5 đầu
  tiên ghi nhận sửa đổi hợp đồng đã được phê duyệt.
- `.sdd/specs/feat-notification-management/TASKS.md` - B4 nối thêm các nhiệm
  vụ củng cố FE10 đang chờ trong khi giữ toàn bộ nhiệm vụ phạm vi triển khai ban đầu đã
  hoàn tất làm bằng chứng lịch sử.

### Các tệp triển khai FE10 mặc định

- `backend/src/services/notificationService.js` - ánh xạ loại/mẫu phía máy chủ,
  gửi đồng bộ nhạy cảm so với gửi không nhạy cảm đã xếp hàng, từ chối khóa nhạy
  cảm đệ quy chuẩn hóa đối tượng/mảng cho dữ liệu xếp hàng, che `safePayload`
  đệ quy chuẩn hóa tương ứng, ranh giới lưu vào cơ sở dữ liệu đã che dữ liệu, factory trình
  yêu cầu nguồn, lũy đẳng mọi trạng thái, chuyển đổi thử lại và hành vi kiểm
  toán an toàn.
- `backend/src/controllers/notificationController.js` - DTO tạo/phát lại/xử
  lý/thử lại tối thiểu chính xác.
- `backend/src/routes/notificationRoutes.js` - tuyến API thử lại được bảo vệ trong
  khi giữ các tuyến API yêu cầu/xử lý được bảo vệ.
- `backend/src/validators/notificationValidators.js` - ID nguồn số nguyên và
  kiểm tra ranh giới; mã cấp tầng dịch vụ sở hữu xác thực loại/mẫu chuẩn và dữ liệu
  xếp hàng nhạy cảm đệ quy.
- `backend/src/repositories/notificationRepository.js` - lưu vào cơ sở dữ liệu bản tóm tắt/
  lần thử `SENT`/`FAILED` nhạy cảm không có nội dung đã tạo từ mẫu, lưu vào cơ sở dữ liệu xếp
  hàng không nhạy cảm và chọn đang chờ đã lọc, tra cứu mọi trạng thái, cập nhật
  thất bại sang đang chờ và bảo toàn lịch sử lần thử.
- `backend/src/models/Notification.js` - trạng thái và siêu dữ liệu ID nguồn số
  nguyên khớp ngữ nghĩa cấu trúc cơ sở dữ liệu đã phê duyệt; không bổ sung siêu dữ liệu hết hạn.
- `database/Librarymanagement.sql` - dữ liệu mẫu chuẩn chứa `{{otp}}` và
  `{{expiresInMinutes}}` trong `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` để
  nội dung nhạy cảm chỉ được tạo khi gọi đồng bộ nhà cung cấp; căn chỉnh cấu trúc cơ
  sở dữ liệu cho việc thử lại và chống gửi trùng; không
  có bí danh chuẩn `EMAIL_VERIFY` hoặc `DUE_OR_FINE_NOTICE` và không lưu trữ
  hết hạn.
- `backend/tests/helpers/inMemoryNotificationRepositories.js` - dữ liệu kiểm thử mẫu
  nhạy cảm/không nhạy cảm chứa biến OTP đã được phê duyệt, chọn đang chờ đã lọc,
  lũy đẳng mọi trạng thái và hành vi thử lại không nhạy cảm khớp tầng truy cập dữ liệu.
- `backend/tests/notificationRoutes.test.js` - từ chối không khớp loại/mẫu
  chuẩn, từ chối khóa nhạy cảm đệ quy chuẩn hóa đối tượng/mảng trong hàng đợi
  và che `safePayload`; kiểm thử xác nhận nội dung nhạy cảm chỉ được tạo khi gọi
  nhà cung cấp cho cả hai liên kết
  không rò rỉ qua lưu vào cơ sở dữ liệu/API/kiểm toán/log, phản hồi tối thiểu thành công/thất
  bại nhạy cảm đồng bộ, xếp hàng không nhạy cảm, hành vi phát lại mọi trạng
  thái, xung đột thử lại/trạng thái và kiểm thử lũy đẳng.
- `backend/tests/integration.test.js` - cập nhật khẳng định kiểm thử phản hồi thông báo
  đầy đủ hiện có thành kỳ vọng DTO tối thiểu G2, bất kể bản cập nhật cơ sở dữ liệu FE07/FE08 có
  diễn ra hay không.
- `backend/src/docs/openapi.yaml` - xác thực yêu cầu đã phê duyệt, phản hồi
  `SENT`/`FAILED` 201 nhạy cảm đồng bộ, phản hồi xử lý không nhạy cảm, phát lại
  và hợp đồng lỗi thử lại.

### Các tích hợp đã phê duyệt và phụ thuộc bị hoãn

- `backend/src/services/borrowingService.js` và
  `backend/src/services/reservationService.js` - bản cập nhật cơ sở dữ liệu trong phạm vi từ tạo
  tầng truy cập dữ liệu trực tiếp sang thành phần gửi yêu cầu nguồn đã được phê duyệt sau khi nhiệm
  vụ thành phần gửi yêu cầu được rà soát. Kiểm thử bị ảnh hưởng là
  `backend/tests/borrowingRoutes.test.js` và
  `backend/tests/reservationRoutes.test.js`; `backend/tests/integration.test.js`
  đã ở phạm vi FE10 mặc định cho G2.
- Tích hợp FE09 bị hoãn: sự kiện hạn trả/tiền phạt của nó được phê duyệt trong
  SPEC FE10 nhưng không có người gọi/tích hợp hiện tại. Không có thay đổi tệp
  tầng dịch vụ FE09 nào được lên kế hoạch trong phạm vi triển khai này; việc triển khai do FE09
  sở hữu trong tương lai trước tiên phải xác định sự kiện và điểm tích hợp thực.
- `backend/src/services/authService.js` - không thuộc phạm vi triển khai FE10
  mặc định. Đây là bản cập nhật cơ sở dữ liệu do FE02 sở hữu bị hoãn sau khi chủ sở hữu FE02 định
  tuyến gửi OTP qua thành phần gửi yêu cầu ràng buộc FE02 và thay khóa cũ `EMAIL_VERIFY`
  bằng khóa chuẩn trong `.sdd/specs/feat-auth/SPEC.md`; chỉ cập nhật
  `backend/tests/authRoutes.test.js` trong công việc do FE02 sở hữu đó.

Không dự kiến tệp frontend, thông tin xác thực nhà cung cấp, mã SMTP thực,
phụ thuộc mới, giao diện thử lại, siêu dữ liệu hết hạn, cơ chế bản cập nhật cơ sở dữ liệu
cơ sở dữ liệu hoặc tái cấu trúc không liên quan.

## 6. Các phạm vi triển khai triển khai B5 theo thứ tự

`TASKS.md` sở hữu phân rã B4 nguyên tử. Chuỗi bên dưới là thứ tự thực thi B5:
mỗi phạm vi triển khai triển khai bắt đầu bằng bằng chứng thất bại tập trung, nhận thay đổi
được phê duyệt nhỏ nhất, chạy lại kiểm thử tập trung, rồi chạy bộ bị ảnh hưởng.

1. **Đặc tả hóa hợp đồng đã phê duyệt.** Sau G1-G7 và các sửa SPEC bắt buộc,
   thêm khẳng định kiểm thử thất bại cho mọi cặp loại/mẫu đã quy định và từ chối không khớp;
   từ chối dữ liệu xếp hàng đối tượng/mảng đệ quy chuẩn hóa cho `OTP`,
   `reset_token`, `verification-link` và giá trị lồng nhau; che `safePayload`
   tương ứng; xác nhận nội dung mẫu OTP chỉ được tạo khi gọi nhà cung cấp và
   không đi vào cơ sở dữ liệu, API,
   kiểm toán/log; thành công/thất bại nhạy cảm đồng bộ; xếp hàng/xử lý lọc không
   nhạy cảm; DTO tạo/phát lại/xử lý tối thiểu; ID nguồn số nguyên; lũy đẳng mọi
   trạng thái; và kết quả thử lại nhạy cảm/không nhạy cảm.
2. **Tách gửi và chứa phản hồi.** Triển khai phân loại loại phía máy chủ và ánh
   xạ chuẩn. Yêu cầu xác thực nhạy cảm điền `{{otp}}` và
   `{{expiresInMinutes}}` trong bộ nhớ, gọi bộ điều hợp nhà cung cấp đã cấu hình
   đồng bộ: thành công lưu `SENT`/lần thử và thất bại lưu `FAILED`/lần thử an
   toàn, trong khi cả hai trả DTO `201`. Yêu cầu không nhạy cảm trước tiên qua
   kiểm tra khóa nhạy cảm đối tượng/mảng đệ quy chuẩn hóa và che `safePayload`
   tương ứng, rồi tạo nội dung từ mẫu và đưa vào hàng đợi; `process-pending` chỉ chọn chúng. Xác
   minh OTP thô và nội dung nhạy cảm đã tạo từ mẫu không bao giờ tới lưu vào cơ sở dữ liệu, API,
   kiểm toán hoặc log.
3. **Căn chỉnh cấu trúc cơ sở dữ liệu/mẫu/lũy đẳng.** Áp dụng căn chỉnh dữ liệu mẫu mẫu chuẩn, sửa hợp
   đồng chỉ số nguyên, hành vi trùng lặp mọi trạng thái và lọc đang chờ không
   nhạy cảm trên SQL, tầng truy cập dữ liệu, mô hình và hàm hỗ trợ trong bộ nhớ. Không thêm
   `EMAIL_VERIFY` hoặc coi `DUE_OR_FINE_NOTICE` là chuẩn khi chưa phê duyệt.
4. **Thành phần gửi yêu cầu nguồn và bản cập nhật cơ sở dữ liệu FE07/FE08.** Triển khai và rà soát trình
   yêu cầu trong danh sách cho phép ràng buộc khi khởi tạo, sau đó chỉ bản cập nhật cơ sở dữ liệu
   FE07/FE08. Xác nhận catch an toàn của người gọi giữ luồng nguồn và bản ghi
   kiểm toán nguồn có ID người dùng null cộng siêu dữ liệu nguồn đã ràng buộc.
   Không bản cập nhật cơ sở dữ liệu FE02; hoãn triển khai FE09 mặc dù sự kiện đã được phê duyệt.
5. **Thử lại thủ công.** Bổ sung hành vi `FAILED -> PENDING` được ủy quyền chỉ
   cho thông báo đã xếp hàng không nhạy cảm. Kiểm thử bản tóm tắt `200`, `409`
   cho trạng thái khác, bản ghi/khóa/lịch sử được giữ, kiểm toán và thân
   `409 REISSUE_REQUIRED` an toàn chuẩn cho cả hai loại xác thực nhạy cảm thất
   bại.
6. **Xác minh tích hợp.** Chạy kiểm thử FE10 và FE07/FE08 bị ảnh hưởng, bộ
   backend, kiểm tra truy vết nếu có, `git diff --check`, quét nội dung giữ chỗ,
   quét mâu thuẫn và rà soát phạm vi phần thay đổi cuối.

## 7. Rủi ro tích hợp, giả định và ngoài phạm vi

### Rủi ro tích hợp

- Việc gửi xác thực nhạy cảm hiện phụ thuộc khả dụng ngay lập tức của nhà cung
  cấp mô phỏng. FE10 không thể thử lại lỗi nhà cung cấp vì không có bí mật được
  lưu vào cơ sở dữ liệu; tính năng nguồn phải phát hành sự kiện/khóa mới.
- FE02 hiện sở hữu email OTP trực tiếp trong khi đặc tả được phê duyệt mô tả
  liên kết mã thông báo. Nếu cập nhật cơ sở dữ liệu FE02 trước khi chủ sở hữu
  giải quyết việc này
  sẽ có rủi ro thông điệp xác minh/đặt lại trùng và khóa mẫu sai.
- Thay đổi phản hồi HTTP tối thiểu có thể làm hỏng thành phần sử dụng/kiểm thử không được
  lập tài liệu đọc trường thông báo đầy đủ; SPEC được phê duyệt trở thành hợp
  đồng ghi nhận.
- Ánh xạ loại/mẫu và kiểm tra khóa nhạy cảm đối tượng/mảng đệ quy chuẩn hóa phải
  được thực thi phía máy chủ, bao gồm từ thành phần gửi yêu cầu nguồn, không tin đầu vào
  người gọi; nếu không một yêu cầu không nhạy cảm không khớp hoặc xếp hàng có
  thể lưu nội dung bí mật. Cùng phép duyệt phải che `safePayload`, bao gồm khóa
  `OTP`, `reset_token` và `verification-link`.
- Lỗi nhà cung cấp nhạy cảm trả `201 FAILED` thay vì lỗi gửi 5xx vì FE10 đã
  chấp nhận và ghi yêu cầu mà không hoàn tác luồng nguồn; thành phần sử dụng phải dùng
  trạng thái trả về, không chỉ HTTP, để quan sát trạng thái gửi.
- Thay đổi cấu trúc cơ sở dữ liệu/chỉ mục cần rà soát của chủ sở hữu cơ sở dữ liệu cho instance
  triển khai, không chỉ lần chạy initializer mới.

### Ràng buộc triển khai đã được phê duyệt

- Điều cấm nội dung nhạy cảm trong danh sách kiểm tra rà soát FE10 chi phối triển
  khai; gửi bộ điều hợp nhà cung cấp đồng bộ là bắt buộc cho hai loại xác thực
  nhạy cảm.
- Các cặp loại/mẫu được liệt kê là hợp đồng phía máy chủ đã phê duyệt;
  dữ liệu kiểm thử `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` dùng `{{otp}}` và
  `{{expiresInMinutes}}`; `DUE_OR_FINE_NOTICE` không phải chuẩn nếu chưa được
  phê duyệt riêng.
- FE02 sở hữu tạo/xác thực OTP và bản cập nhật cơ sở dữ liệu thành phần gửi yêu cầu ràng buộc FE02; FE10
  sở hữu gửi OTP chỉ qua nhà cung cấp và thực thi khóa chuẩn.
- Nhà cung cấp mô phỏng vẫn đủ cho Giai đoạn 1 và không đưa vào thông tin xác
  thực nhà cung cấp thực.
- Sự kiện nguồn FE07/FE08 được phê duyệt cho bản cập nhật cơ sở dữ liệu thành phần gửi yêu cầu; sự kiện
  FE09 đã phê duyệt không có người gọi/tích hợp hiện tại và vẫn bị hoãn.

### Ngoài phạm vi

- Nội dung nhạy cảm đã xếp hàng dạng văn bản thuần hoặc mã hóa, màn hình hộp
  thư/thử lại/quản trị frontend, trình chỉnh sửa mẫu, trạng thái đọc trong ứng
  dụng, SMS, thông báo đẩy, tiếp thị, thông tin xác thực SMTP/nhà cung cấp thực,
  tạo hay xác thực mã thông báo, đối soát OTP/liên kết FE02, tính tiền phạt,
  quyết định hàng đợi đặt chỗ, thay đổi trạng thái mượn, và triển khai thông báo
  FE09 mới.

## 8. Danh sách kiểm tra rà soát con người đã phê duyệt

- [x] G1 chấp nhận ánh xạ loại/mẫu chuẩn do máy chủ thực thi; dữ liệu kiểm thử
  `{{otp}}` và `{{expiresInMinutes}}`; gửi xác thực nhạy cảm đồng bộ không lưu
  bền nội dung nhạy cảm đã tạo từ mẫu; và chỉ gửi xếp hàng cho loại không nhạy cảm
  sau khi kiểm tra khóa đối tượng/mảng đệ quy chuẩn hóa cùng che `safePayload`
  tương ứng.
- [x] G2 chấp nhận lỗi xác thực/mẫu 4xx an toàn, bản tóm tắt gửi nhạy cảm
  `201 SENT` và `201 FAILED`, bản tóm tắt phát lại `200` mọi trạng thái và
  không đối tượng hoặc mảng.
- [x] G3 chấp nhận factory nguồn ràng buộc, danh sách cho phép cố định, siêu dữ
  liệu kiểm toán người dùng null, cùng bảo vệ hàng đợi đệ quy chuẩn hóa/ánh xạ
  và che `safePayload` như HTTP, cùng bản cập nhật cơ sở dữ liệu có phạm vi chỉ FE07/FE08.
- [x] G4 chấp nhận Giai đoạn 1 chỉ số nguyên và sửa SPEC FE10.
- [x] G5 chấp nhận tuyến API thử lại không nhạy cảm được bảo vệ, chuyển đổi trạng
  thái, xung đột trạng thái và phản hồi `REISSUE_REQUIRED` an toàn chuẩn cho
  cả hai loại xác thực nhạy cảm.
- [x] G6 chấp nhận một bản ghi trên mỗi khóa chống gửi trùng xuyên suốt mọi trạng thái
  và thử lại không nhạy cảm dùng lại.
- [x] G7 chấp nhận `ACCOUNT_VERIFICATION`/`PASSWORD_RESET` chuẩn, không có bí
  danh `EMAIL_VERIFY` và trì hoãn do chủ sở hữu FE02.
- [x] Sự kiện đã phê duyệt của FE09 được đánh dấu đúng là bị hoãn triển khai vì
  không có người gọi/tích hợp hiện tại, không có thay đổi tệp tầng dịch vụ FE09 nào
  được lập kế hoạch trong phạm vi triển khai này.
- [x] Các mục `TASKS.md` lịch sử đã hoàn tất được giữ nguyên, với phần củng cố
  đang chờ mới chỉ sau phê duyệt B3.
- [x] Phạm vi không frontend, chỉ nhà cung cấp mô phỏng, củng cố nhỏ nhất nhất
  quán là chấp nhận được.

## B4 hoàn tất; B5 đã triển khai; B6 và B7 hoàn tất

Phần này ban đầu dừng công việc sau B4 cho đến khi tài liệu được rà soát và chủ
động chuyển sang nhánh triển khai. Cổng đó đã được đáp ứng; FE10-H01 đến
FE10-H08 đã được triển khai và rà soát độc lập trên `feat/fe10-hardening`, còn
FE10-H09 vượt xác thực cuối và rà soát toàn nhánh. Nhat sau đó phê duyệt tích
hợp, commit `9185a9a` đến `main` và CI cùng commit đạt trong lượt
`29236572558`.

## 9. Phần theo dõi ranh giới bảo mật OTP G8-G10

### 9.1 Mục tiêu và phạm vi

Triển khai ADR-004 như bản sửa liên tính năng nhỏ nhất, nhất quán:

- FE02 sở hữu thông tin xác thực OTP xác minh/đặt lại.
- FE10 chịu trách nhiệm tạo nội dung từ mẫu, gửi qua nhà cung cấp đã cấu hình,
  quản lý trạng thái, số lần thử và siêu dữ liệu nguồn an toàn.
- Chỉ thành phần gửi yêu cầu ràng buộc với `FE02` được gửi `ACCOUNT_VERIFICATION` hoặc
  `PASSWORD_RESET`.
- Chỉ thành phần gửi yêu cầu ràng buộc với `FE11` được gửi `ACCOUNT_SETUP` với
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
| G8 | Thay `verificationLink`/`resetLink` bằng `otp` và `expiresInMinutes` bắt buộc. FE10 chỉ dùng OTP thô trong bộ nhớ nhà cung cấp và không lưu vào cơ sở dữ liệu OTP hay nội dung nhạy cảm đã tạo từ mẫu. |
| G9 | HTTP nhân viên và thành phần gửi yêu cầu không phải FE02 bị từ chối với xác minh/đặt lại FE02; ADR-005 cũng từ chối thành phần gửi yêu cầu thiết lập tài khoản không phải FE11. HTTP không thể cung cấp `sourceFeature`. |
| G11 | `ACCOUNT_SETUP` ràng buộc FE11 gửi đồng bộ, không lưu thông tin xác thực/nội dung thiết lập, dùng ngữ nghĩa nguồn/lũy đẳng ID mã thông báo. |

## Phần theo dõi thiết lập tài khoản FE11

1. Thêm `FE11` vào danh sách cho phép thành phần gửi yêu cầu ràng buộc khi khởi tạo mà
   không làm suy yếu quyền sở hữu FE02.
2. Thêm `ACCOUNT_SETUP -> ACCOUNT_SETUP` chuẩn với `setupLink` và
   `expiresInHours` bắt buộc.
3. Từ chối HTTP nhân viên và mọi thành phần gửi yêu cầu không phải FE11 cho
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

Không có tệp frontend, bản cập nhật cơ sở dữ liệu bảng/chỉ mục cơ sở dữ liệu, phụ thuộc mới,
giao diện thử lại, giao diện hộp thư, người gọi FE09 hoặc bản cập nhật cơ sở dữ liệu
`CHANGE_PASSWORD_OTP` nào được lên kế hoạch.

### 9.4 Các phạm vi triển khai TDD theo thứ tự

1. Thêm kiểm thử tái hiện lỗi trước khi sửa FE10 cho việc từ chối nhạy cảm HTTP/không phải FE02, từ
   chối ghi đè nguồn HTTP và chấp nhận OTP ràng buộc FE02.
2. Triển khai quyền sở hữu nguồn/loại và xác thực mẫu OTP, sau đó nối bộ điều
   hợp nhà cung cấp đã cấu hình trong khi giữ việc chèn nhà cung cấp trong kiểm
   thử.
3. Chứng minh gửi OTP chỉ trong bộ nhớ nhà cung cấp và lưu vào cơ sở dữ liệu siêu dữ liệu
   nguồn/lũy đẳng an toàn.
4. Thêm kiểm thử tái hiện lỗi trước khi sửa FE02 cho một lần gọi thành phần gửi yêu cầu, dữ liệu/lũy đẳng ID mã
   thông báo, không có lời gọi thông báo/email xác minh/đặt lại trực tiếp và
   không có trường mã thông báo debug HTTP.
5. Chỉ bản cập nhật cơ sở dữ liệu xác minh/đặt lại FE02, thu OTP kiểm thử qua phụ thuộc được
   chèn và giữ chấp nhận mã thông báo cũ cùng gửi `CHANGE_PASSWORD_OTP` trực
   tiếp.
6. Khóa hành vi không chặn `FAILED`/ngoại lệ và ngữ nghĩa gửi lại mã thông báo
   mới.
7. Chạy kiểm thử FE10/FE02 tập trung, kiểm thử tích hợp bị ảnh hưởng,
   truy vết, quét rò rỉ/mâu thuẫn và `git diff --check`; sau đó dừng để
   rà soát con người.

## 11. Phần theo dõi ranh giới kết quả tư cách thành viên FE04

1. Xử lý `FE04` là nguồn nội bộ ràng buộc khi khởi tạo mà không đổi hợp đồng tác
   nhân HTTP được bảo vệ.
2. Chỉ cho phép thành phần gửi yêu cầu ràng buộc FE04 gửi
   `GENERAL_SYSTEM -> MEMBERSHIP_RESULT` với siêu dữ liệu nguồn hồ sơ và khóa
   lũy đẳng đã phê duyệt.
3. Giữ phê duyệt/từ chối tư cách thành viên được commit khi FE10 trả `FAILED`
   hoặc ném lỗi thành phần gửi yêu cầu an toàn.
4. Bổ sung kiểm thử hợp đồng và tích hợp tập trung trước khi tuyên bố FE04-T006
   hoặc FE10-S09 hoàn tất.

## 12. Khắc phục tuyên bố gửi bền vững

Người dùng đã phê duyệt thiết kế `PROCESSING` ngày 2026-07-23. Biện pháp khắc
phục giữ lời gọi nhà cung cấp ngoài giao dịch cơ sở dữ liệu trong khi làm quyền
sở hữu gửi bền vững trước lời gọi đó.

1. Yêu cầu mọi yêu cầu nguồn trong tiến trình gồm `sourceEntityType` không rỗng,
   `sourceEntityId` số nguyên dương và khóa chống gửi trùng.
2. Lưu trực tiếp yêu cầu nhạy cảm là `PROCESSING`; nhận nguyên tử yêu cầu không
   nhạy cảm đã xếp hàng bằng `PENDING -> PROCESSING` và commit trước thao tác gọi nhà
   cung cấp.
3. Mở giao dịch ngắn mới cho `PROCESSING -> SENT` hoặc
   `PROCESSING -> FAILED` cùng hàng lần thử khớp.
4. Giữ một hàng `PROCESSING` nếu lưu vào cơ sở dữ liệu kết thúc thất bại sau thao tác gọi nhà cung
   cấp. Loại hàng đó khỏi xử lý tự động và trả
   `409 DELIVERY_STATE_UNCERTAIN` cho thử lại thủ công.
5. Đồng bộ mô hình, SQL chuẩn, OpenAPI, ADR và bản cập nhật cơ sở dữ liệu lũy đẳng; sau đó chạy
   kiểm thử tập trung/đầy đủ và hai lần thực thi bản cập nhật cơ sở dữ liệu dùng một lần trước
   rà soát H2.

## 13. Xác thực mẫu đã lưu chặn an toàn khi kiểm tra không đạt v0.4.4

Kế hoạch thực thi chi tiết là
`docs/superpowers/plans/2026-07-27-fe07-fe10-fe12-business-rule-alignment.md`.

1. Thêm kiểm thử tái hiện lỗi trước khi sửa theo bảng cho thẻ HTML thô, thuộc tính xử lý sự kiện nội
   tuyến và URL `javascript:` trong trường tiêu đề/nội dung mẫu đã lưu.
2. Yêu cầu `400 UNSAFE_TEMPLATE_DEFINITION` an toàn trước khi tạo nội dung từ mẫu người
   nhận, lưu vào cơ sở dữ liệu thông báo/lần thử hoặc thao tác gọi nhà cung cấp.
3. Giữ `sanitizeString()` và `sanitizePayload()` cho giá trị khi chạy; không
   làm yếu phát hiện khóa bí mật đệ quy, che dữ liệu, quyền sở hữu, lũy đẳng,
   DTO tối thiểu hoặc quy tắc `PROCESSING` bền vững.
4. Chạy các hồi quy định nghĩa không an toàn cùng hồi quy làm sạch dữ liệu mẫu
   khi chạy hiện có và toàn bộ bộ tuyến API FE10.
5. Giữ thay đổi triển khai chưa commit cho đến khi bằng chứng L1-L4 liên tính
   năng đạt và Nhat cấp H2.

## 14. Khắc phục gửi email môi trường thử nghiệm v0.4.5

Thiết kế đã được phê duyệt:
`docs/superpowers/specs/2026-07-27-staging-email-delivery-remediation-design.md`.

1. Thêm và xác minh bản cập nhật cơ sở dữ liệu lũy đẳng cho mẫu `ACCOUNT_SETUP` hoạt động chuẩn;
   không xây lại hoặc xóa cơ sở dữ liệu hiện có.
2. Thu kết quả nhà cung cấp nhạy cảm và chỉ lưu `providerMessageId` qua giao
   dịch `markSent` được bảo vệ hiện có.
3. Tách vòng lặp gửi đã xếp hàng hiện có phía sau lõi riêng dùng chung. Giữ
   lớp bao được nhân viên ủy quyền và thêm lớp bao SYSTEM ràng buộc khi khởi tạo
   với siêu dữ liệu kiểm toán tổng hợp người dùng null.
4. Thêm tiến trình bật tùy chọn với lượt chạy ngay khi khởi động, khoảng lặp mặc
   định 60 giây, kích thước lô 20, bảo vệ chồng lấp, mã lỗi an toàn và hành vi
   dừng.
5. Nối tiến trình vào vòng đời HTTP backend mà không thay đổi export ứng dụng
   Express trực tiếp hoặc khởi động bộ hẹn giờ khi nạp mô-đun.
6. Giữ phần triển khai sinh ra chưa commit cho đến khi xác thực tập trung/đầy
   đủ, quét bí mật, kiểm tra an toàn môi trường thử nghiệm và rà soát H2 đạt.

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

Chuỗi triển khai là chỉ bổ sung và ưu tiên backend:

1. thêm và xác minh bản cập nhật cơ sở dữ liệu có thể lặp lại tương thích Azure SQL và
   mô hình/cấu trúc cơ sở dữ liệu chuẩn;
2. thêm thao tác tầng truy cập dữ liệu của chính người dùng được lọc SQL và ánh xạ phép
   chiếu/thao tác an toàn phía máy chủ cố định;
3. thêm API đã xác thực liệt kê, đếm, đánh dấu một và đánh dấu tất cả;
4. thêm phía máy khách/context frontend dùng chung, thăm dò chưa đọc, phần xem trước
   chuông và trang `/notifications`;
5. chứng minh tích hợp FE04/FE07/FE08, hành vi trình duyệt ba vai trò, khả năng
   lặp lại bản cập nhật cơ sở dữ liệu, fan-out tài liệu và rollout môi trường thử nghiệm Azure.

### 15.2 Các phạm vi triển khai TDD theo thứ tự

| Phạm vi triển khai | Kết quả | Chấp nhận chính |
| --- | --- | --- |
| FE10-I01 | Bản cập nhật cơ sở dữ liệu `ReadAt`, điền lùi, chỉ mục, cấu trúc cơ sở dữ liệu/mô hình chuẩn | AC-FE10-011 đến AC-FE10-014 |
| FE10-I02 | Thao tác liệt kê/đếm/đọc do SQL sở hữu và phép chiếu thao tác an toàn | AC-FE10-011 đến AC-FE10-015 |
| FE10-I03 | API đã xác thực, kiểm tra hợp lệ, `404` an toàn trước IDOR, OpenAPI | AC-FE10-011 đến AC-FE10-015 |
| FE10-I04 | Phía máy khách API frontend và context hộp thư dùng chung | AC-FE10-012, AC-FE10-013, AC-FE10-016 |
| FE10-I05 | Chuông khung ứng dụng, huy hiệu `99+`, phần xem trước năm mục chưa đọc, điều hướng an toàn | AC-FE10-015, AC-FE10-016 |
| FE10-I06 | Bộ lọc `/notifications`, phân trang, trạng thái đọc, đánh dấu tất cả | AC-FE10-011, AC-FE10-014, AC-FE10-016 |
| FE10-I07 | Tích hợp FE04/FE07/FE08 cùng E2E MEMBER/LIBRARIAN/ADMIN | AC-FE10-011 đến AC-FE10-016 |
| FE10-I08 | Cổng đầy đủ, tài liệu, bằng chứng bản cập nhật cơ sở dữ liệu, môi trường thử nghiệm Azure ưu tiên backend | AC-FE10-011 đến AC-FE10-016 |

### 15.3 Cổng rà soát và phát hành

- Phê duyệt kế hoạch chỉ mở triển khai; mỗi phạm vi vẫn phải có kiểm thử tái
  hiện lỗi trước khi sửa, kiểm thử đạt sau khi sửa, xác minh tập trung, rà soát
  và commit có giới hạn.
- Bản cập nhật cơ sở dữ liệu phải chạy đạt hai lần trên SQL Server dùng một lần trước H2
  và trước khi dùng môi trường thử nghiệm.
- API backend và bản cập nhật cơ sở dữ liệu triển khai trước frontend. Frontend cũ vẫn tương
  thích xuyên suốt mốc kiểm tra đó.
- H2 rà soát bản thay đổi cục bộ đầy đủ. H3 kiểm tra lại đặc tả, quyền sở hữu, loại
  trừ dữ liệu nhạy cảm, an toàn bản cập nhật cơ sở dữ liệu và bằng chứng môi trường thử nghiệm trước hợp nhất.

### 15.4 Bản thay đổi cuối và trạng thái giao hàng

- Commit PR #75 `778e0a470d8a1083bf571a8007b3c058eee4bb22` chứa gói FE10-I01..I08
  được H2 phê duyệt cuối và biện pháp khắc phục H3 có giới hạn sau cập nhật nhánh chỉ
  tài liệu `main@30f936d`.
- CI đúng commit `30317424995` và triển khai môi trường thử nghiệm Azure `30317621429` đã
  đạt. H3 đã rà soát cùng commit theo trục Tiêu chuẩn và Đặc tả không có phát hiện
  có thể hành động, và người dùng phê duyệt H3 rõ ràng.
- PR #75 đã hợp nhất thành `b75776b10d6cf4b6868d2ba51eb3268073483b8b`. CI hậu
  hợp nhất chính xác `30341279111` và môi trường thử nghiệm Azure tự động `30341540847` đã đạt,
  bao gồm kiểm tra trước bản cập nhật cơ sở dữ liệu, backend, frontend và kiểm tra nhanh.
- Bằng chứng API/trình duyệt ba vai trò lịch sử, bằng chứng Azure SQL
  `ReadAt`/chỉ mục, loại trừ nhạy cảm, phát lại đọc, HTTPS/CORS và dọn dẹp
  probe/firewall tạm thời vẫn là bằng chứng hợp lệ cho hợp đồng không đổi.

### 15.5 Phụ lục triển khai H1

Người dùng đã phê duyệt phụ lục này ngày 2026-07-28 sau khi phần triển khai trước
`main@41282b4` đưa vào triển khai môi trường thử nghiệm tự động có cổng CI:

- giữ triển khai tự động sau CI `main` exact-commit thành công và giữ
  `workflow_dispatch` cho lượt chạy lại của người vận hành;
- yêu cầu cả hai đường dẫn khớp SHA-256 bản cập nhật cơ sở dữ liệu đã checkout với biến Môi
  trường GitHub `staging` không bí mật `FE10_INBOX_MIGRATION_SHA256`;
- bổ sung yêu cầu `fe10_inbox_migration_confirmed=true` cho lượt chạy thủ công;
- giữ thứ tự kiểm tra trước -> backend -> frontend -> kiểm tra nhanh;
- áp dụng/xác minh bản cập nhật cơ sở dữ liệu, loại truy cập firewall tạm thời, lưu mã băm bản cập nhật cơ sở dữ liệu
  và xác minh thủ công commit PR chính xác trước H3/hợp nhất;
- sau hợp nhất, theo dõi CI hậu hợp nhất chính xác và lượt môi trường thử nghiệm tự động kết quả cho
  cùng bằng chứng bản cập nhật cơ sở dữ liệu.

Sau đó người dùng phê duyệt phụ lục chênh lệch phần nghiệp vụ cốt lõi H1 cho `main@5a3c84b` ngày
2026-07-28. Đối soát phải giữ bản cập nhật cơ sở dữ liệu khởi động
`add_change_password_otp_token_type.sql` đóng gói ở phần triển khai trước, tài liệu/kiểm
thử mức sẵn sàng của nó và dữ liệu mẫu xác minh tài khoản tiếng Việt, đồng thời giữ
kiểm tra trước FE10 và triển khai có thứ tự. Các cổng đầy đủ sau chênh lệch và
mã đối chiếu nội dung/H2 mới là bắt buộc trước khi công bố.

Sau cập nhật nhánh đó, phần triển khai trước lại tiến thêm ba commit qua `main@db97f17`. Người dùng
phê duyệt phụ lục chênh lệch phần nghiệp vụ cốt lõi H1 thứ hai ngày 2026-07-28. Đối soát giữ lý do
hủy đặt chỗ mặc định tiếng Việt ở phần triển khai trước và kiểu tab trả/đặt chỗ đáp ứng, cùng
mọi chỉnh sửa vòng hai FE07/FE08/FE10/FE12 khác ở phần triển khai trước, trong khi giữ phía máy khách
hộp thư FE10 và kiểu thông báo theo phạm vi. Các cổng đầy đủ sau chênh lệch và
mã đối chiếu nội dung/H2 mới vẫn bắt buộc trước công bố.

Nhánh chính sau đó tiến qua `main@12faead` bằng cách chỉ xóa tệp đã ngừng dùng dưới
`document/`. Người dùng đã phê duyệt phụ lục chênh lệch H1 thứ ba ngày
2026-07-28. Không có chồng lấp đường dẫn hoặc hợp đồng LÕI với biện pháp khắc
phục H3 FE10, và cập nhật nhánh hoàn tất không xung đột. Các cổng đầy đủ và mã đối chiếu nội dung
H2 mới vẫn bắt buộc; sau công bố, commit chính xác phải thay `main` hiện tại ở
môi trường thử nghiệm Azure và được xác minh tại đó trước H3 lặp lại.

Ma trận cục bộ đầy đủ sau đó đạt: backend 69/69 bộ và 1116/1116 kiểm thử;
frontend 259/259 cùng kiểm tra mã/bản dựng; triển khai 20/20; hệ thống 10/10; trạng thái
truy vết 3/3 và FE10 14/16 (88%); Chromium 11/11; kiểm toán, chuẩn bị cấu trúc cơ sở dữ liệu
Azure, vệ sinh phần thay đổi và quét mâu thuẫn tập trung.

Trước khi có thể dùng phê duyệt H2 vòng 3, lượt đồng bộ bắt buộc trước khi triển
khai lên môi trường thử nghiệm đã đưa nhánh tới `main@a240705`. Người dùng đã
phê duyệt phụ lục chênh
lệch H1 thứ tư ngày 2026-07-28. Đối soát giữ việc phần triển khai trước loại bỏ giao diện API/
UI/kiểm thử chỉnh sửa người dùng Quản trị FE11 trong khi giữ FE10. CI main
`30311801599` và triển khai Azure `30311973740` đã đạt; nhánh được cập nhật mà
không xung đột, và các cổng đầy đủ cùng mã đối chiếu nội dung/H2 mới là bắt buộc.

Xác thực mới trên mốc chuẩn chính xác đó đạt backend 69/69 bộ và 1084/1084 kiểm
thử, frontend 259/259 cùng kiểm tra mã/bản dựng, triển khai 20/20, hệ thống 10/10, trạng
thái truy vết 3/3, truy vết FE10 14/16 (88%), Chromium 11/11, kiểm
toán, chuẩn bị cấu trúc cơ sở dữ liệu Azure và vệ sinh phần thay đổi. Mốc kiểm tra lịch sử đó được thay thế
bởi chuỗi cuối đã hoàn tất trong Phần 15.4.

## 16. Kế hoạch mẫu kết quả FE07 v0.6.0

1. `SL-001`: hợp nhất quy trình phê duyệt kích hoạt.
2. `SL-002` - kiểm thử trước khi sửa: kiểm tra cặp loại/mẫu/nguồn đã quy định,
   quyền sở hữu, điều kiện hiển thị trong hộp thư, đường dẫn thao tác cố định,
   việc gửi lại không tạo bản ghi trùng và loại trừ trường dữ liệu nhạy cảm.
3. `SL-002` - triển khai và kiểm thử sau khi sửa: mở rộng bốn mẫu
   `GENERAL_SYSTEM` của FE07 và chỉ bổ sung dữ liệu mẫu, không thêm bảng hoặc kênh.
4. Chạy bản cập nhật cơ sở dữ liệu theo hợp đồng, kiểm thử tập trung tầng truy
   cập dữ liệu, tuyến API, hộp thư và frontend, rồi chạy `SL-006` tích hợp/E2E.
5. FE10 không quyết định trạng thái FE07/FE08; phần thay đổi của sản phẩm chưa được commit đến H2.
