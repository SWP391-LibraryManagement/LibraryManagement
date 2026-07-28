# CHANGELOG.md - Xác thực FE02

## 2026-07-28 - Đặc tả kiểm tra khả dụng của định danh đăng ký

- Yêu cầu cả username và email đều khả dụng trước khi tạo trạng thái xác minh hoặc yêu cầu gửi OTP.
- Giữ phản hồi trùng lặp trên biểu mẫu đăng ký và duy trì ràng buộc duy nhất của cơ sở dữ liệu làm nguồn có thẩm quyền cho đăng ký đồng thời.
- Tái sử dụng endpoint đăng ký hiện có; không giới thiệu endpoint kiểm tra khả dụng riêng.
- Backend tập trung vượt qua 62/62, frontend vượt qua 242/242, đồng thời lint/build frontend và traceability đều vượt qua.

## 2026-07-28 - Vô hiệu hóa submission đăng nhập trong thời gian khóa tài khoản

- Trả về `ACCOUNT_LOCKED` cùng `retryAfterSeconds` ở lần nhập sai mật khẩu thứ năm và các lần thử tiếp theo trong thời gian khóa.
- Vô hiệu hóa nút đăng nhập frontend trong khoảng thời gian server cung cấp và tự động bật lại khi hết thời gian khóa.
- Đã thêm kiểm thử hồi quy backend và frontend tập trung; kiểm thử route/repository FE02 vượt qua 60/60, kiểm thử frontend vượt qua 235/235 và lint/build frontend vượt qua.

## 2026-07-28 - Đối soát ràng buộc token OTP thay đổi mật khẩu trên staging

- Đã bổ sung cơ chế sẵn sàng fail closed khi khởi động cho khả năng tương thích của `CK_AuthTokens_TokenType` đã triển khai với `CHANGE_PASSWORD_OTP`.
- Đóng gói và áp dụng migration ràng buộc idempotent đã rà soát chỉ khi schema đã triển khai bị cũ.
- Đồng bộ SPEC v0.6.17, PLAN, TASKS, TEST_PLAN v0.3.15, hướng dẫn triển khai và kiểm thử hồi quy tập trung.

## 2026-07-28 - Thất bại an toàn khi không gửi được OTP thay đổi mật khẩu

- Ngăn `/change-password/request-otp` tuyên bố thành công khi SMTP không khả dụng hoặc nhà cung cấp email gặp lỗi.
- Trả về response `EMAIL_DELIVERY_FAILED` an toàn và chỉ ghi audit request sau khi adapter email FE02 trực tiếp xác nhận gửi thành công.
- Đã thêm một kiểm thử hồi quy tập trung; route xác thực vượt qua 50/50, frontend hồ sơ vượt qua 6/6 và traceability FE02 vượt qua 27/27.

## 2026-07-27 - Đồng bộ hướng dẫn về OTP xác minh đã triển khai

- Sửa nhãn 24 giờ đã cũ trên màn hình xác minh đăng ký thành thời hạn OTP xác minh chuẩn 15 phút.
- Làm rõ staging yêu cầu cấu hình SMTP của App Service; triển khai mã ứng dụng không cung cấp hoặc thay thế thông tin xác thực của nhà cung cấp email.

## 2026-07-27 - Liên kết bằng chứng hiệu năng FE02 có thể lặp lại

- Đóng FE02-T048 bằng performance harness xác định hiện có: p95 đăng nhập hợp lệ `61.46 ms` so với `< 1,000 ms` và p95 `/api/auth/me` `1.52 ms` so với `< 50 ms`, với chi phí bcrypt 10.
- Ghi nhận môi trường 30/50 mẫu, kết quả kiểm thử harness 3/3 và các giới hạn SQL/mạng rõ ràng trong SPEC, PLAN, TASKS, TEST_PLAN v0.3.14 và báo cáo hiệu năng.
- FE02 duy trì `PARTIAL` chỉ do FE02-T049: liên kết H3 riêng cho FE02-T043 và phê duyệt đối soát thủ công.

## 2026-07-27 - Đóng tranh chấp đăng ký đồng thời và trạng thái đăng nhập

- Ánh xạ conflict đăng ký unique-email đồng thời sang response `409 EMAIL_ALREADY_REGISTERED` đã phê duyệt.
- Bảo vệ các thao tác ghi khi đăng nhập thất bại, đăng nhập/tạo phiên thành công và khóa hết hạn trước trạng thái tài khoản mới hơn đã được lưu.
- Thêm kiểm thử hồi quy route/repository và đồng bộ SPEC v0.6.16, PLAN, TASKS, TEST_PLAN v0.3.13 cùng hợp đồng API dùng chung; kiểm thử FE02 tập trung vượt qua 66/66, traceability vượt qua 27/27 và toàn bộ backend vượt qua 60/61 suite (1048/1050 kiểm thử), chỉ còn các lỗi tách biệt DNS/mock đã biết trong `dbConfig.test.js`.

## 2026-07-27 - Giữ trạng thái hủy kích hoạt trong quá trình xác minh email

- Ngăn thông tin xác thực OTP và xác minh cũ kích hoạt lại tài khoản bị FE11 hủy kích hoạt hoặc không đủ điều kiện.
- Bảo vệ cập nhật kích hoạt đã lưu trước tranh chấp hủy kích hoạt đồng thời và làm cho việc kích hoạt, tiêu thụ thông tin xác thực cùng audit xác minh bắt buộc trở thành nguyên tử.
- Thêm kiểm thử hồi quy route/repository tập trung và đồng bộ SPEC v0.6.15, PLAN, TASKS và TEST_PLAN v0.3.12.
- Kiểm thử FE02 tập trung vượt qua 61/61 và traceability duy trì 27/27; lần chạy lại toàn bộ backend vẫn chỉ bị chặn bởi hai assertion tách biệt DNS/mock đã biết trong `dbConfig.test.js`.

## 2026-07-27 - Hoàn tất lượt hội tụ mã nguồn/đặc tả FE02

- Loại tài khoản tự đăng ký đang chờ đã bị FE11 hủy kích hoạt khỏi cơ chế khôi phục xác minh khi đăng nhập/gửi lại bằng cách ánh xạ và thực thi `DeactivatedAt`.
- Áp dụng dung sai đồng hồ JWT 30 giây đã phê duyệt và hoàn tất ghi log an toàn cho đăng nhập/khóa/xác thực token mà không ghi thông tin xác thực hoặc token thô.
- Đồng bộ kỳ vọng integration về tài khoản không hoạt động của FE04/FE07/FE08 với hợp đồng `401 INVALID_TOKEN` trước handler của FE02.
- Đối soát SPEC v0.6.14, CONTEXT v0.2.6, PLAN, TASKS, TEST_PLAN v0.3.11 và hợp đồng API dùng chung với mã nguồn và bằng chứng hiện tại.
- Xác thực vượt qua 58/58 kiểm thử FE02 tập trung, 114/114 kiểm thử liên tính năng bị ảnh hưởng, 220/220 kiểm thử frontend, lint/build frontend và traceability FE02 27/27. Toàn bộ backend vượt qua 60/61 suite và 1040/1042 kiểm thử; chỉ còn lỗi tách biệt DNS/mock trong `dbConfig.test.js` đã ghi nhận.

## 2026-07-27 - Khôi phục xác minh đăng ký bị gián đoạn khi đăng nhập

- Thêm response đăng nhập `EMAIL_VERIFICATION_REQUIRED` sau khi chứng minh mật khẩu cho tài khoản tự đăng ký chưa được xác minh và điều hướng frontend đến `/verify-email` mà không cấp phiên.
- Giữ định danh không xác định, sai mật khẩu, tài khoản đã hủy kích hoạt và tài khoản `ACCOUNT_SETUP` do quản trị viên tạo ngoài nhánh khôi phục; gửi lại xác minh hiện sử dụng cùng ranh giới đủ điều kiện.
- Thêm kiểm thử hồi quy backend và frontend tập trung, đồng thời đồng bộ SPEC v0.6.13, PLAN, TASKS, TEST_PLAN và hợp đồng API dùng chung.
- Xác thực vượt qua 48/48 kiểm thử backend tập trung, 220/220 kiểm thử frontend, lint/build frontend và traceability FE02 27/27; kết quả toàn bộ backend và lỗi còn lại không liên quan được ghi trong `TEST_PLAN.md`.

## 2026-07-27 - Hội tụ hợp đồng và phần triển khai xác thực

- Đóng CG-FE02-002, CG-FE02-004, CG-FE02-006 và CG-FE02-008 bằng kiểm thử hồi quy tập trung và thực thi trên production.
- Thực thi trạng thái tài khoản đã lưu hiện tại và vai trò hiện tại phía server trong xác thực được bảo vệ.
- Thêm theo dõi chính xác lỗi đăng nhập trong cửa sổ trượt 15 phút bằng migration SQL, đồng thời giữ thời gian khóa 30 phút đã phê duyệt.
- Thay bộ tạo OTP `Math.random()` bằng `crypto.randomInt()` và giữ sáu chữ số, bao gồm số 0 ở đầu.
- Làm cho việc tạo token đăng ký, đăng nhập/tạo phiên, thay đổi mật khẩu/tiêu thụ OTP/audit và đặt lại mật khẩu/vô hiệu hóa token trở thành nguyên tử.
- Kiểm thử xác thực FE02 tập trung vượt qua 47/47; toàn bộ backend đạt 60/61 suite và 1036/1038 kiểm thử, chỉ có lỗi tách biệt DNS/mock tồn tại từ trước trong `dbConfig.test.js` đối với `sql.example.test`.
- FE02 duy trì `PARTIAL`: bằng chứng hiệu năng FE02-T048 và phần chốt thủ công/H3 FE02-T049 vẫn đang mở.

## 2026-07-23 - Đóng CG007 về khôi phục phiên hồ sơ

- Bổ sung khôi phục bằng một lần refresh, lưu token trong cơ chế lưu trữ đã chọn, dọn dẹp đầy đủ trạng thái xác thực và chuyển hướng đến trang đăng nhập cho request được bảo vệ của `profileApi`.
- Thêm một kiểm thử hồi quy frontend cho hành vi `NFR-FE02-UX-009` đã phê duyệt.
- Đóng CG-FE02-007 và FE02-T051; CG-FE02-001 vẫn tuân theo hợp đồng 30 phút đã phê duyệt trong khi chờ làm rõ yêu cầu 15 phút mới.

## 2026-07-23 - Đóng CG001 về thời lượng khóa chính xác

- Thay đổi giá trị mặc định runtime backend và ví dụ triển khai của `LOGIN_LOCKOUT_MINUTES` từ 15 thành 30.
- Thêm kiểm thử hồi quy cấu hình và đăng nhập chứng minh giá trị mặc định cùng thời lượng `lockedUntil` chính xác.
- Đóng CG-FE02-001 và FE02-T047; không thay đổi khoảng trống đối soát nào khác.

## 2026-07-23 - Đối soát tạo phẩm FE02 với bối cảnh đã phê duyệt

- Đồng bộ SPEC v0.6.9 với cả hai đường thay đổi mật khẩu đã triển khai: cập nhật trực tiếp bằng mật khẩu hiện tại và request/confirm `CHANGE_PASSWORD_OTP` do FE02 sở hữu.
- Sửa cách diễn đạt chính sách mật khẩu thành quy tắc đã phê duyệt gồm 8 ký tự, chữ hoa, chữ số và ký tự đặc biệt.
- Thêm các endpoint OTP thay đổi mật khẩu còn thiếu vào PLAN, sửa thuật ngữ khóa tài khoản đã biết và thay đường dẫn hook frontend không tồn tại bằng các tệp tích hợp hiện tại.
- Thay cách diễn đạt hoàn tất vô điều kiện trong PLAN/TASKS/TEST_PLAN bằng cách diễn đạt baseline đã hoàn tất/đối soát đang mở.
- Thêm nhiệm vụ rõ ràng cho độ bao phủ hồi quy OTP, phân quyền theo vai trò hiện tại, cấu hình khóa chính xác 30 phút, bằng chứng hiệu năng và phần chốt thủ công/H3 cuối cùng.
- Thêm nhiệm vụ tuân thủ MEDIUM+ cho việc thực thi trạng thái tài khoản đã lưu hiện tại, khôi phục bằng refresh ở frontend FE02 và tính nguyên tử của giao dịch/audit xác thực.
- Không thay đổi hành vi mã nguồn production.

## 2026-07-22 - Tăng cường xác thực dữ liệu đăng nhập và phản hồi lỗi bản địa hóa

- Thêm xác thực dữ liệu tiếng Việt ở cấp trường cho giá trị đăng nhập trống, chỉ có khoảng trắng và quá dài trong khi giữ backend làm nguồn có thẩm quyền về xác thực dữ liệu.
- Ánh xạ các mã lỗi đăng nhập ổn định, an toàn để thông tin xác thực không hợp lệ vẫn chống dò tìm tài khoản, còn tài khoản bị khóa nhận hướng dẫn đặt lại hoặc chờ đã phê duyệt mà không làm lộ thông báo backend thô.
- Thay nội dung lỗi mạng phụ thuộc localhost trên màn hình đăng nhập bằng thông báo trung lập với môi trường và xóa phản hồi đã cũ khi người dùng chỉnh sửa thông tin xác thực.
- Đồng bộ validator email/username kết hợp phía server với ranh giới email 255 ký tự đã phê duyệt và thêm kiểm thử hồi quy đăng ký/xác minh/đăng nhập với email dài.
- Làm rõ hướng dẫn độ mạnh mật khẩu áp dụng khi tạo mật khẩu mới, không áp dụng khi nhập mật khẩu hiện có để đăng nhập.
- Vô hiệu hóa xác thực native của biểu mẫu khi gửi đăng nhập để hiển thị thông báo tiếng Việt ở cấp trường đã phê duyệt thay vì prompt tiếng Anh mặc định của trình duyệt, đồng thời giữ ngữ nghĩa trường bắt buộc.
- Giới hạn buffer đầu vào ở 256 ký tự để lỗi quá dài ở cấp trường có thể quan sát được tại ranh giới 255 ký tự mà không cho phép đầu vào client không giới hạn.

## 2026-07-21 - Giảm thời hạn OTP xác minh email xuống 15 phút

- Phê duyệt thời hạn 15 phút cho OTP đăng ký và gửi lại xác minh, đồng thời giữ quyền sở hữu FE02/FE10 và khả năng tương thích token xác minh cũ.
- Thêm cấu hình môi trường chuẩn theo phút cùng cơ chế fallback tạm thời theo số giờ cũ và độ bao phủ hồi quy cho cả hai đường.
- Đồng bộ cấu hình Azure staging và xác minh email do nhà cung cấp kết xuất hiển thị thời hạn 15 phút sau khi khởi động lại toàn bộ service.

## 2026-07-20 - Đối soát nguồn sự thật OTP FE02/FE10

- Cập nhật đặc tả FE02 để khớp ADR-004 đã phê duyệt và phần triển khai đã merge: FE02 sở hữu thông tin xác thực OTP, còn bên yêu cầu FE10 gắn với FE02 sở hữu việc gửi xác minh/đặt lại và kết quả thông báo an toàn.
- Giữ khả năng tương thích token cũ, lỗi gửi không chặn luồng, tính idempotent theo ID token và đường `CHANGE_PASSWORD_OTP` trực tiếp riêng.

## 2026-07-20 - Phân tích nghiêm ngặt header phân quyền Bearer

- Từ chối header `Authorization` sai định dạng có phân đoạn thừa trước khi xác minh token.
- Giữ Bearer token hợp lệ trong khi ngăn việc phân tích header không rõ nghĩa đến các service được bảo vệ.
- Thêm độ bao phủ hồi quy backend cho ranh giới header sai định dạng.

## 2026-07-20 - Khôi phục xác minh email độc lập

- Thêm route `/verify-email` độc lập để người dùng có thể khôi phục việc xác minh đăng ký sau khi đóng hoặc tải lại trang đăng ký.
- Việc xử lý đăng ký trùng lặp giờ điều hướng người dùng đến xác minh email thay vì để lại ngõ cụt tại `EMAIL_ALREADY_REGISTERED`.
- UI khôi phục mật khẩu giờ liên kết đến xác minh tài khoản mà không thay đổi quy tắc backend về tài khoản không hoạt động và chống dò tìm.
- Thêm độ bao phủ hồi quy frontend cho route, chuyển hướng đăng ký trùng lặp, thời gian chờ gửi lại OTP và đường khôi phục tài khoản không hoạt động.

## 2026-07-20 - Bản địa hóa UI tiếng Việt và typography

- Bản địa hóa nhãn, trạng thái, tên hỗ trợ khả năng truy cập và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu catalog/hồ sơ thuộc người dùng.
- Áp dụng hợp đồng typography dùng chung với `Be Vietnam Pro` cho phần thân và `Noto Serif` cho heading cùng các font fallback hỗ trợ Unicode.

## 2026-07-19 - Chốt thoát Giai đoạn 2

- feat-auth được chấp nhận trong đợt đối soát đầy đủ FE01-FE12 của Giai đoạn 2 được ghi nhận bởi PR #40/#41; kết quả xác thực và ranh giới còn lại được hợp nhất trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Công việc tiếp theo về gửi OTP FE02/FE10 cũng được đóng qua PR #42/#43/#44 với bằng chứng CI `main` chính xác sau merge.
- Các giới hạn hoãn lại và thuộc phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi lần chốt này.

## 2026-07-19 - Chốt B7 việc gửi OTP

- FE02-T033 hoàn tất đến B7 sau khi PR #42 merge thành `34d9180`; PR CI `29688102867` và CI `main` chính xác sau merge `29688222757` đều vượt qua.
- Ranh giới gửi OTP FE10 gắn với FE02 đã phê duyệt hiện có bằng chứng đầy đủ về quyền sở hữu, rò rỉ, lỗi và luân chuyển token. SMTP thực và công việc FE02 không liên quan vẫn ngoài phạm vi.

## 2026-07-19 - Bằng chứng nghiệm thu và ranh giới gửi OTP

- Mở rộng bằng chứng ADR-004 để mọi bên yêu cầu không phải FE02 trong allowlist đều bị từ chối đối với cả loại xác minh và đặt lại mà không gây tác dụng phụ về lưu trữ, lần thử, audit hoặc nhà cung cấp.
- Thêm độ bao phủ quên mật khẩu lặp lại để chứng minh ID token và khóa idempotent mới được tạo mà không có đường email FE02 trực tiếp.
- Xác thực FE02/FE10 tập trung vượt qua 170/170; toàn bộ backend vượt qua 916/916 với độ bao phủ cao hơn ngưỡng đã cấu hình; traceability duy trì 26/26.
- Người dùng đã phê duyệt thiết kế OTP FE10 và cấp nghiệm thu thủ công thường trực cho phạm vi nhà cung cấp được inject. PR tích hợp và CI `main` chính xác sau merge vẫn là yêu cầu trước khi chốt B7.

## 2026-07-19 - Thực thi giao thức HTTPS

- Thêm middleware HTTPS nhận biết môi trường triển khai trước khi phân tích JSON và phân luồng route xác thực.
- Request xác thực qua HTTP thuần hiện mặc định bị từ chối với `400 HTTPS_REQUIRED`; tùy chọn `HTTPS_REDIRECT=true` chỉ chuyển hướng đến `HTTPS_CANONICAL_HOST` đã xác thực.
- Triển khai reverse proxy đáng tin cậy chỉ có thể truyền `X-Forwarded-Proto: https` khi `TRUST_PROXY=true`; kiểm thử giao thức tập trung vượt qua `3/3`.

## 2026-07-19 - Đối soát bằng chứng API và dò tìm tài khoản khi đăng nhập

- Thêm kiểm thử hồi quy API cho đăng ký trùng lặp và mật khẩu đăng ký/đặt lại yếu cùng assertion rõ ràng rằng không lưu dữ liệu.
- Thêm độ bao phủ xác minh và đặt lại mật khẩu chuẩn bằng `{ email, otp }`, bao gồm assertion tiêu thụ OTP và trạng thái mật khẩu.
- Giữ sự kiện audit nội bộ `AUTH_LOGIN_INACTIVE` trong khi trả về cùng envelope công khai `401 INVALID_CREDENTIALS` cho tài khoản không hoạt động và không xác định.
- Đóng câu hỏi giới hạn tốc độ trên toàn IP như một nội dung không phải mục tiêu của Giai đoạn 1 đã phê duyệt theo `Q-FE02-005`, `BR-FE02-008` và `NFR-FE02-SEC-005`.
- Xác thực `authRoutes.test.js` tập trung vượt qua 30/30; kiểm thử hồi quy toàn bộ backend vượt qua 893/893 cùng độ bao phủ, integration hệ thống và traceability xanh; PR CI run `29680011551` vượt qua trên commit triển khai `0040e0f`.

## 2026-07-19 - Đối soát bên yêu cầu OTP và refresh

- Hội tụ bên yêu cầu xác minh/đặt lại FE02 vào ranh giới nhà cung cấp nhạy cảm chuẩn của FE10 cùng tính idempotent theo ID token và không có đường gửi trực tiếp trùng lặp.
- Giữ lỗi nhà cung cấp không chặn luồng, luân chuyển token khi gửi lại, chấp nhận token cũ và quyền sở hữu trực tiếp `CHANGE_PASSWORD_OTP`.
- Đồng bộ việc đổi refresh với FR-FE02-026 bằng cách trả về refresh token đã gửi mà không thay đổi.
- Cổng liên tính năng FE02/FE10 tập trung hiện tại vượt qua 154/154 cùng traceability FE02 26/26; phần chốt thủ công cuối cùng vẫn đang mở.

## 2026-07-19 - Kích hoạt hợp đồng schema hoàn tất FE11

- Tăng `SPEC.md` lên 0.6.3 và kích hoạt phụ thuộc migration dùng chung của FE11 mà không thay đổi hành vi đăng nhập, đăng ký, OTP, refresh hoặc tiêu thụ thiết lập của FE02.
- Xác nhận `Users.Email` ở 255 ký tự và ghi nhận phiên bản đồng thời không null cho người dùng được FE11 quản lý là `COALESCE(UpdatedAt, CreatedAt)` đối với hàng cũ có thể null.
- Migration schema dùng chung FE11 sau đó vượt qua hai lần chạy SQL Server dùng một lần; xem phần rà soát Live SQL của đợt đối soát đầy đủ.

## 2026-07-17 - Phê duyệt baseline Giai đoạn 1

- Nhật phê duyệt đặc tả FE02 đã chuẩn hóa và hợp đồng triển khai làm baseline Giai đoạn 1; tại mốc lịch sử đó, công việc tiếp theo về gửi OTP vẫn đang chờ triển khai và sau đó được thay thế bằng phần triển khai FE02/FE10 ghi nhận ngày 2026-07-19.
- Làm rõ rà soát baseline đã hoàn tất, trong khi thay đổi triển khai vẫn yêu cầu xác thực tập trung và rà soát thủ công trước khi merge.

## 2026-07-17 - Audit vòng đời và hợp đồng cuối cùng

- Giới hạn khôi phục trạng thái khóa ở đặt lại mật khẩu thành công hoặc tự động hết hạn; Giai đoạn 1 không có hành động mở khóa của quản trị viên.
- Xác định điều kiện đặt lại mật khẩu cho tài khoản `ACTIVE`/`LOCKED` và ghi nhận hành vi `CHANGE_PASSWORD_OTP` chỉ nhằm tương thích.
- Thay cách diễn đạt không xác định về hiệu năng và gửi lại bằng quy tắc hợp đồng Giai đoạn 1 rõ ràng.

## 2026-07-17 - Tăng cường chính sách xác thực và vòng đời tài khoản

- Tăng `SPEC.md` lên 0.6.2.
- Cố định việc khóa ở 5 lần thất bại liên tiếp trong 15 phút, 10 request đăng nhập trên mỗi IP trong 15 phút và tự động mở khóa sau 30 phút.
- Xác định việc luân chuyển refresh token, thu hồi khi đăng xuất và thu hồi các phiên khác khi thay đổi mật khẩu.
- Đồng bộ trạng thái tài khoản đã lưu với SQL và giới thiệu `Users.DeactivatedAt` có thể null làm migration bắt buộc cho ngữ nghĩa hủy kích hoạt FE11.

## 2026-07-17 - Hợp đồng đăng ký, thiết lập và refresh có tính xác định

- Tăng `SPEC.md` lên 0.6.1 và giữ bản sửa đổi ở trạng thái `READY FOR REVIEW`.
- Làm cho tự đăng ký gán đúng vai trò `Member`; FE11 độc quyền tạo tài khoản Librarian/Admin.
- Cố định thời hạn `ACCOUNT_SETUP` chính xác 24 giờ và loại bỏ chuyển đổi kích hoạt đặt lại mật khẩu đã cũ.
- Làm rõ việc đổi refresh token xác thực chính refresh token đó và không yêu cầu access token.
- Thêm độ bao phủ nghiệm thu và traceability có tính xác định cho việc gán vai trò, kiểm tra vai trò phía server và thực thi HTTPS.

## 2026-07-15 - Triển khai và xác thực thiết lập tài khoản

- Thêm cơ chế tiêu thụ `ACCOUNT_SETUP` FE11 nguyên tử cho tài khoản không hoạt động đủ điều kiện do quản trị viên tạo.
- Hoàn tất thiết lập giờ lưu mật khẩu được chọn, xác minh/kích hoạt tài khoản, đặt lại trường khóa, tiêu thụ một token, thu hồi token cùng nhóm và ghi audit xác thực trong một transaction.
- Thêm chế độ frontend `/forgot-password?token=...` chỉ thiết lập mật khẩu, phản hồi liên kết không hợp lệ an toàn và không kết xuất, ghi log hoặc lưu token.
- Thông tin xác thực đặt lại mật khẩu vẫn không thể kích hoạt tài khoản không hoạt động.
- Bằng chứng tự động của Nhiệm vụ 7 vượt qua: 170/170 kiểm thử backend bị ảnh hưởng, 75/75 kiểm thử frontend, lint tệp đã sửa, production build, traceability, quét thông tin xác thực và kiểm tra diff.
- Nhat xác nhận gói xác thực liên tính năng cuối cùng; `FE02-T037` đã hoàn tất.

## 2026-07-15 - Sửa đổi cơ chế tiêu thụ thiết lập tài khoản FE11

- Tăng `SPEC.md` lên 0.6.0 và đánh dấu bản sửa đổi OTP/thiết lập tài khoản kết hợp là sẵn sàng rà soát.
- Tách đặt lại mật khẩu khỏi thiết lập tài khoản FE11 chuẩn trong khi giữ cấu trúc request token hiện có.
- Xác định FE02 là bên tiêu thụ token thiết lập và sở hữu kích hoạt nguyên tử; FE11 vẫn sở hữu việc cấp/gửi lại, còn FE10 vẫn sở hữu việc gửi.
- Thêm BR-FE02-023..025, FR-FE02-024..025, AC-FE02-020..021, EC-FE02-016..017, Q-FE02-013 và NFR-FE02-TXN-005.
- Thêm FE02-T034..T037 cho kiểm thử RED, triển khai nguyên tử và xác thực liên tính năng.

## 2026-07-15 - Đồng bộ quyền sở hữu gửi OTP FE10

- Tăng `SPEC.md` từ phiên bản `0.4.0` lên `0.5.0` và đồng bộ `CONTEXT.md` với ADR-004.
- Giữ FE02 làm chủ sở hữu việc tạo, hash, hết hạn, thu hồi, xác thực OTP dùng cho xác minh/đặt lại và khả năng tương thích token cũ.
- Đặt bên yêu cầu FE10 gắn với `FE02` làm ranh giới gửi duy nhất cho email OTP xác minh tài khoản và đặt lại mật khẩu.
- Xác định khả năng truy vết nguồn và tính idempotent của `AuthTokens.TokenId`; gửi lại tạo ID token và khóa thông báo mới.
- Cấm gửi email trực tiếp trùng lặp và ghi trực tiếp bản ghi thông báo cho xác minh/đặt lại, đồng thời giữ email FE02 trực tiếp cho `CHANGE_PASSWORD_OTP`.
- Cấm các trường response HTTP `debugOtp`, `debugVerificationToken` và `debugResetToken`; kiểm thử triển khai phải thu OTP xác định thông qua dependency được inject.
- Xác định ngữ nghĩa lỗi FE10 không chặn luồng: trạng thái người dùng/token và response công khai chung vẫn hợp lệ, OTP không bị lộ và gửi lại vẫn khả dụng.
- Thay các bảng/trường token khái niệm trong phần dữ liệu bằng hợp đồng `AuthTokens` dùng chung thực tế.

## 2026-07-15 - Chốt B7 UX Xác thực/OTP

- Ghi nhận nghiệm thu thủ công và bằng chứng merge cho `FE02-T024` đến `FE02-T028`.
- Khắc phục golden path hệ thống để sử dụng textbox mật khẩu có khả năng truy cập, đích đăng nhập `/home` đã phê duyệt và đồng hồ integration xác định.
- GitHub Actions CI run `29358045198` vượt qua trên commit `main` cuối cùng `6eee459`; bằng chứng chi tiết nằm trong `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`.

## 2026-07-14 - Đồng bộ hợp đồng UX OTP

- Tăng phiên bản `SPEC.md` từ 0.3.0 -> 0.4.0 để ghi nhận luồng OTP email sáu chữ số đã triển khai cho xác minh đăng ký và đặt lại mật khẩu.
- Giữ payload token xác minh/đặt lại cũ để tương thích và thiết lập tài khoản FE11.
- Phê duyệt thời gian chờ gửi lại 60 giây ở client và ghi nhận kế hoạch tăng cường UX Xác thực/OTP trong `docs/superpowers/plans/2026-07-14-auth-otp-ux.md`.

## 2026-06-25 - Mô hình trạng thái chính thức FE02

- Tăng phiên bản SPEC.md từ 0.2.0 -> 0.3.0 (MINOR); trạng thái không đổi (APPROVED).
- Thêm Mô hình trạng thái và Quy tắc chuyển đổi chính thức (sơ đồ trạng thái + chuyển đổi hợp lệ/không hợp lệ + invariant) cho vòng đời tài khoản Người dùng.

## 2026-06-03

- Tạo cấu trúc đặc tả tính năng Xác thực FE02.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và CHANGELOG.md.
- Chuẩn bị cho yêu cầu xác thực chi tiết, bao gồm đăng nhập, đăng xuất, quản lý phiên và kiểm soát truy cập dựa trên vai trò.
- Sẵn sàng thêm ID yêu cầu ổn định cho quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí nghiệm thu, trường hợp biên và câu hỏi mở.
- Làm rõ hỗ trợ thiết lập mật khẩu cho tài khoản không hoạt động do quản trị viên FE11 tạo.

## 2026-06-10

- Cập nhật ánh xạ phân công FE02 để khớp bảng Excel mới nhất: UC05-UC10 và FT05-FT11.
- Thay chủ sở hữu placeholder trong CONTEXT.md bằng Dat.
- Cập nhật ánh xạ kiểm thử trong ma trận truy vết từ khoảng FT01-FT08 cũ sang khoảng FT05-FT11 hiện tại.
- Cập nhật chính sách hợp đồng API để cho phép phê duyệt trong `SPEC.md`, trừ khi nhóm giới thiệu lại tài liệu hợp đồng API dùng chung.
- Điều chỉnh ghi chú mô hình dữ liệu hiện tại để khớp script SQL hơn.

## 2026-06-10 - Phê duyệt quyết định rà soát Giai đoạn 1

- Phê duyệt các quyết định cho câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định trong `SPEC.md` từ draft/proposed/open thành approved khi phù hợp.
- Giữ rõ các biện pháp kiểm soát phạm vi Giai đoạn 1 và hạng mục công việc tương lai được hoãn.

## 2026-06-10 - Triển khai lát cắt nền tảng FE02

- Thêm các thư mục nền tảng backend cho config, route, controller, service, repository, middleware, validator và utils.
- Thay script kiểm thử placeholder ở backend bằng Jest và thêm kiểm thử health baseline.
- Triển khai route lát cắt dọc FE02 cho `register`, `verify-email`, `login` và `/me` được bảo vệ.
- Thêm chính sách mật khẩu phía server, hàm hỗ trợ token, xử lý lỗi an toàn và middleware xác thực.
- Thêm khung repository SQL Server với truy vấn có tham số cho người dùng, auth token, audit log và thông báo.
- Thêm repository kiểm thử in-memory để lát cắt FE02 có thể chạy trong CI mà không cần cơ sở dữ liệu thực.
- Cập nhật CI để chạy kiểm thử backend và lint frontend trước build.

## 2026-06-10 - FE02 sẵn sàng rà soát

- Hoàn tất các endpoint xác thực còn lại: gửi lại xác minh, refresh token, đăng xuất, thay đổi mật khẩu, quên mật khẩu và đặt lại mật khẩu.
- Thêm kiểm thử cho các trường hợp FE02 từ FT05 đến FT11.
- Kết nối các màn hình đăng nhập, đăng ký và quên mật khẩu hiện tại với API xác thực.
- Đánh dấu `PLAN.md`, `TASKS.md` và traceability của FE02 là sẵn sàng rà soát.

## 2026-06-25 - Tăng cường yêu cầu EARS cho hành vi không mong muốn của FE02

- Tăng phiên bản SPEC.md từ 0.1.0 -> 0.2.0 (MINOR); trạng thái không đổi (APPROVED).
- Nâng các nhánh xử lý lỗi thành FR hành vi không mong muốn chính thức (FR-FE02-015..FR-FE02-021) để đáp ứng tiêu chuẩn EARS ≥30% yêu cầu không mong muốn từ Phát triển dựa trên đặc tả. Không giới thiệu logic mới; mỗi FR truy vết đến AF/EC/BR hiện có.
  - FR-FE02-015: Từ chối đăng ký bằng email đã đăng ký; không tạo người dùng mới. (AF-FE02-001, EC-FE02-003, BR-FE02-001)
  - FR-FE02-016: Từ chối token xác minh hết hạn/sai định dạng; giữ tài khoản ở trạng thái INACTIVE, cho phép gửi lại. (AF-FE02-002, BR-FE02-004)
  - FR-FE02-017: Từ chối đăng nhập tài khoản LOCKED cùng thông báo khóa. (AF-FE02-003, BR-FE02-009)
  - FR-FE02-018: Từ chối token đặt lại đã dùng/hết hạn; không thay đổi mật khẩu. (AF-FE02-005, BR-FE02-014)
  - FR-FE02-019: Từ chối mật khẩu không đáp ứng chính sách độ phức tạp; không lưu. (AF-FE02-007, BR-FE02-005, Q-FE02-001)
  - FR-FE02-020: Từ chối thay đổi mật khẩu nếu tái sử dụng mật khẩu hiện tại. (AF-FE02-006)
  - FR-FE02-021: Từ chối request được bảo vệ có token sai định dạng/không hợp lệ/hết hạn (401). (AF-FE02-004, EC-FE02-014, BR-FE02-012)
- Thêm tiểu mục "7.1 Yêu cầu về hành vi không mong muốn (EARS)" và bảng traceability FR không mong muốn trong Mục 16; cập nhật Tóm tắt độ bao phủ (Tổng FR 14 -> 21, FR không mong muốn 7 = 33.3%).

## 2026-06-19 - Rà soát sửa lỗi xác thực FE02

- Sửa xử lý khóa khi đăng nhập thất bại để tài khoản được đánh dấu `LOCKED` khi đạt ngưỡng đã cấu hình.
- Điều chỉnh đăng xuất để có thể thu hồi refresh token hợp lệ mà không yêu cầu access token vẫn còn hiệu lực.
- Cập nhật kiểm thử auth route và hành vi repository in-memory cho các sửa lỗi khóa/đăng xuất.
