# PLAN.md - Xác thực FE02

## Kế hoạch khắc phục bảo mật CAPTCHA FE02 (2026-08-04)

- Dùng `crypto` có sẵn của Node.js để sinh challenge 4-6 chữ cái và token ngẫu nhiên opaque 32 byte; không tái sử dụng `JWT_SECRET`, không thêm dependency, database hoặc migration.
- Một CAPTCHA service được inject giữ tối đa 5.000 challenge trong `Map` theo tiến trình, TTL 5 phút và tiêu thụ challenge đã xác định ngay lần xác minh đầu tiên, đúng hoặc sai.
- `GET /api/auth/captcha` render SVG bằng các path segment ngẫu nhiên, không chứa `<text>`, đáp án hoặc metadata làm lộ bộ xác minh. `register` và `login` luôn xác thực trước khi dispatch auth service, không có bypass theo `NODE_ENV`.
- Frontend dùng `CaptchaField` hiện có trong hai biểu mẫu, vô hiệu hóa submit khi chưa có token, giữ dữ liệu đã nhập và tải challenge mới sau lỗi tải hoặc `CAPTCHA_INVALID`.
- Các test không liên quan CAPTCHA inject fake service rõ ràng; browser E2E lấy đáp án qua control endpoint `/__e2e__/` chỉ tồn tại trong test server.
- Ranh giới vận hành hiện tại là một instance: backend restart làm mất challenge đang mở; trước khi scale nhiều instance phải dùng shared TTL store hoặc provider được phê duyệt.

Trạng thái: IMPLEMENTED - H2 APPROVED; PENDING EXACT-HEAD CI/H3
Ngày: 2026-08-04
Chủ sở hữu: Dat

## 1. Mục đích

Triển khai và đối soát Xác thực FE02 theo `CONTEXT.md`, `SPEC.md`, ADR-003 Phương án xác thực đã được phê duyệt, schema SQL Server đã sửa đổi và hợp đồng API Giai đoạn 1.

FE02 là tính năng Cốt lõi. Phần triển khai phải nhỏ gọn, có thể kiểm thử và được rà soát trước khi merge.

## 2. Tài liệu nguồn

- `.sdd/specs/feat-auth/CONTEXT.md`
- `.sdd/specs/feat-auth/SPEC.md`
- `.sdd/rfcs/ADR-003-authentication-approach.md`
- `.sdd/rfcs/ADR-004-auth-otp-notification-boundary.md`
- `.sdd/rfcs/ADR-005-admin-created-account-setup-boundary.md`
- `.sdd/rfcs/ADR-002-database-design.md`
- `database/Librarymanagement.sql`
- `.sdd/constraints/safety.md`

## 3. Phạm vi

### Trong phạm vi

- Đăng ký tài khoản.
- Xác minh email.
- Gửi lại email xác minh.
- Đăng nhập bằng JWT access token và refresh token.
- Làm mới access token.
- Đăng xuất và thu hồi refresh token.
- Thay đổi mật khẩu qua đường dẫn dùng mật khẩu hiện tại trực tiếp hoặc đường dẫn xác nhận OTP do FE02 sở hữu.
- Quên mật khẩu.
- Đặt lại mật khẩu.
- Endpoint người dùng/phiên hiện tại.
- Xác thực dữ liệu phía server.
- Hash mật khẩu bằng bcrypt.
- Lưu token đã hash thông qua `AuthTokens`.
- Xử lý lỗi chung an toàn.
- Ghi log audit cho các sự kiện xác thực.
- Kiểm thử unit/integration ở backend cho các quy tắc xác thực cốt lõi.

### Ngoài phạm vi

- OAuth/OpenID Connect.
- Thiết lập nhà cung cấp email production thực.
- MFA/2FA.
- Đăng nhập qua mạng xã hội.
- Quản lý người dùng quản trị viên FE11 đầy đủ.
- Thiết kế lại frontend không liên quan ngoài phạm vi UX Xác thực/OTP đã phê duyệt.
- Chuyển `CHANGE_PASSWORD_OTP` sang FE10 khi chưa có loại thông báo/use case riêng được phê duyệt.

## 4. Các quyết định kỹ thuật đã phê duyệt

| Lĩnh vực | Quyết định |
| --- | --- |
| Hash mật khẩu | `bcrypt`; hệ số chi phí 10 cho Giai đoạn 1, trừ khi rà soát hiệu năng thay đổi giá trị này. |
| Access token | JWT, hết hạn sau 15 phút. |
| Refresh token | Token ngẫu nhiên, được lưu dưới dạng hash trong `AuthTokens`, hết hạn sau 7 ngày. |
| Thông tin xác thực để xác minh email | Luồng chính là OTP ngẫu nhiên gồm sáu chữ số, được lưu dưới dạng hash trong `AuthTokens`, hết hạn sau 15 phút; liên kết token cũ vẫn được chấp nhận. |
| Thông tin xác thực để đặt lại mật khẩu | Luồng chính là OTP ngẫu nhiên gồm sáu chữ số, được lưu dưới dạng hash trong `AuthTokens`, hết hạn sau 15 phút; token đặt lại mật khẩu cũ vẫn được chấp nhận. |
| Token thiết lập tài khoản | FE11 cấp/luân chuyển token với thời hạn chính xác 24 giờ; FE10 gửi token thông qua bên yêu cầu gắn với FE11; FE02 tiêu thụ token và kích hoạt tài khoản theo cách nguyên tử. |
| Vai trò | Vai trò phẳng từ `Roles`/`UserRoles`. |
| Gửi email xác minh/đặt lại | FE02 tạo/xác thực OTP và gọi bên yêu cầu FE10 gắn với `FE02`; FE10 độc quyền kết xuất, gửi và ghi nhận trạng thái/lần thử. |
| Gửi OTP thay đổi mật khẩu | Tiếp tục là luồng email trực tiếp của FE02 cho đến khi loại thông báo/use case FE10 riêng được phê duyệt. |
| Khóa tài khoản | Các lần thất bại của tài khoản đã biết có timestamp trong `LoginFailureAttempts` quyết định số lượng trong cửa sổ trượt 15 phút; `Users.FailedLoginCount` và `Users.LockedUntil` giữ trạng thái khóa hiện tại. Không tuyên bố có giới hạn trên toàn IP. |

## 5. Phụ thuộc cơ sở dữ liệu

Các bảng/trường bắt buộc tồn tại trong `database/Librarymanagement.sql` và đã vượt qua kiểm thử nhanh SQL Server cục bộ:

- `Users`: `PasswordHash`, `Status`, `EmailVerifiedAt`, `FailedLoginCount`, `LockedUntil`, `LastLoginAt`.
- `Roles`, `UserRoles`.
- `AuthTokens`: `TokenType`, `TokenHash`, `ExpiresAt`, `UsedAt`, `RevokedAt`; quá trình khởi động staging xác minh `CK_AuthTokens_TokenType` cho phép `CHANGE_PASSWORD_OTP` và áp dụng migration tương thích đã rà soát khi dữ liệu cũ.
- `LoginFailureAttempts`: các lần thất bại của tài khoản đã biết có timestamp phục vụ cửa sổ trượt 15 phút.
- `AuditLogs`.
- `NotificationTemplates`, `Notifications`, `NotificationAttempts` là các bản ghi gửi thuộc quyền sở hữu của FE10; FE02 tham chiếu `AuthTokens.TokenId` đã lưu nhưng không ghi trực tiếp bản ghi thông báo.

## 6. Endpoint API

Triển khai các endpoint FE02 chuẩn trong Mục 11 của `SPEC.md`:

| Phương thức | Endpoint | Mục đích |
| --- | --- | --- |
| GET | `/api/auth/captcha` | Phát hành SVG path cùng token opaque dùng một lần, hết hạn sau 5 phút. |
| POST | `/api/auth/register` | Đăng ký tài khoản và tạo OTP xác minh. |
| POST | `/api/auth/verify-email` | Xác minh email bằng OTP/email hoặc token cũ. |
| POST | `/api/auth/resend-verification` | Gửi lại OTP xác minh một cách an toàn. |
| POST | `/api/auth/login` | Trả về access/refresh token cho người dùng đang hoạt động hoặc tín hiệu khôi phục chờ xác minh sau khi đã chứng minh mật khẩu. |
| POST | `/api/auth/refresh-token` | Đổi refresh token hợp lệ lấy access token mới mà không yêu cầu access token hợp lệ. |
| POST | `/api/auth/logout` | Thu hồi refresh token. |
| POST | `/api/auth/change-password` | Thay đổi mật khẩu cho người dùng đã xác thực. |
| POST | `/api/auth/change-password/request-otp` | Xác minh mật khẩu hiện tại và cấp trực tiếp `CHANGE_PASSWORD_OTP` gắn với mục đích thông qua FE02. |
| POST | `/api/auth/change-password/confirm` | Xác nhận OTP thay đổi mật khẩu hợp lệ của người dùng đã xác thực và cập nhật mật khẩu. |
| POST | `/api/auth/forgot-password` | Yêu cầu OTP đặt lại mà không cho phép dò tìm email. |
| POST | `/api/auth/reset-password` | Đặt lại mật khẩu bằng OTP/email hợp lệ hoặc token cũ. |
| GET | `/api/auth/me` | Trả về ngữ cảnh người dùng hiện tại an toàn. |

## 7. Kế hoạch tệp backend

Các tệp backend dự kiến:

```text
backend/src/config/env.js
backend/src/config/db.js
backend/src/routes/authRoutes.js
backend/src/controllers/authController.js
backend/src/services/authService.js
backend/src/repositories/userRepository.js
backend/src/repositories/authTokenRepository.js
backend/src/repositories/auditLogRepository.js
backend/src/services/notificationService.js
backend/src/services/emailService.js
backend/src/middleware/authMiddleware.js
backend/src/middleware/errorHandler.js
backend/src/validators/authValidators.js
backend/src/utils/passwordPolicy.js
backend/src/utils/tokenUtils.js
backend/src/utils/safeErrors.js
```

Không thêm phần triển khai mới vào các đường dẫn placeholder cũ như `backend/src/Controller/Authentication` hoặc `backend/src/Service/...`; giữ nguyên các placeholder hiện có cho đến khi có nhiệm vụ dọn dẹp riêng được phê duyệt và đặt toàn bộ công việc mới trong kiến trúc ADR-001.

## 8. Kế hoạch tệp frontend

Các tệp tích hợp frontend dự kiến:

```text
frontend/src/api/authApi.js
frontend/src/api/profileApi.js
frontend/src/component/userProfile/ProfileActions.jsx
frontend/src/page/LoginPage.jsx
frontend/src/page/VerifyEmailPage.jsx
```

Các trang đăng nhập/đăng ký/quên mật khẩu hiện có có thể được kết nối sau khi các endpoint backend được triển khai. Không được coi hành vi UI là cơ chế thực thi bảo mật đáng tin cậy.

Phần tăng cường UX Xác thực/OTP đã phê duyệt được triển khai theo `docs/superpowers/plans/2026-07-14-auth-otp-ux.md`. Phần này bổ sung xác thực dữ liệu ở lớp trình bày, đăng ký hai bước, focus và che OTP sáu chữ số, thời gian chờ gửi lại 60 giây cùng kiểm tra responsive/khả năng truy cập mà không chuyển cơ chế thực thi bảo mật ra khỏi backend.

## 9. Chiến lược kiểm thử

### Kiểm thử unit

- Phát hành token CAPTCHA opaque, SVG không chứa text/đáp án, expiry, capacity và tiêu thụ sau lần thử đúng, sai hoặc sai định dạng.
- Xác thực chính sách mật khẩu.
- Các hàm hỗ trợ tạo/hash/hết hạn token.
- Các đường dẫn đăng ký/đăng nhập/đặt lại/thay đổi mật khẩu của auth service bằng repository mock.
- Hành vi lỗi an toàn khi đăng nhập không hợp lệ và quên mật khẩu.

### Kiểm thử integration

- Route đăng ký/đăng nhập từ chối CAPTCHA thiếu, sai, hết hạn hoặc replay trước auth service, kể cả khi `NODE_ENV=test`.
- Browser E2E giải challenge qua test-control server mà không thêm endpoint debug vào production app.
- Đăng ký -> xác minh -> đăng nhập.
- Đăng nhập thất bại do sai mật khẩu.
- Đăng nhập thất bại với tài khoản không hoạt động/chưa xác minh.
- Làm mới token thành công/thất bại.
- Đăng xuất làm mất hiệu lực refresh token.
- Quên/đặt lại mật khẩu thành công.
- Token đặt lại đã hết hạn/đã dùng phải thất bại.
- Thay đổi mật khẩu trực tiếp và xác nhận bằng OTP thành công/thất bại, bao gồm việc từ chối OTP hết hạn, đã dùng và sai người dùng.
- `/api/auth/me` được bảo vệ yêu cầu token hợp lệ.
- Phân quyền được bảo vệ sử dụng `UserRoles` hiện tại ở server, không dùng khai báo vai trò từ client.
- Request được bảo vệ phải từ chối người dùng hiện tại có trạng thái đã lưu không còn là `ACTIVE`, ngay cả khi access token và phiên được liên kết chưa hết hạn.
- Request frontend được bảo vệ của FE02 thử lại một lần sau lỗi 401 và xóa trạng thái phiên không hợp lệ khi khôi phục bằng refresh thất bại.
- Luồng xác thực làm thay đổi trạng thái chứng minh ranh giới giao dịch người dùng/token/audit bắt buộc và hành vi rõ ràng khi audit thất bại.
- Đo thời lượng khóa tài khoản chính xác 30 phút và các mục tiêu hiệu năng đã phê duyệt.

## 10. Rủi ro và biện pháp giảm thiểu

| Rủi ro | Biện pháp giảm thiểu |
| --- | --- |
| Token bị lộ trong log | Chỉ lưu hash; không bao giờ ghi log giá trị token thô. |
| Dò tìm email | Response chung cho quên mật khẩu và gửi lại. |
| Xử lý mật khẩu yếu | Thực thi chính sách phía server và hash bằng bcrypt. |
| SQL injection | Chỉ sử dụng truy vấn có tham số của `mssql`. |
| CORS quá rộng | Giữ CORS production có thể cấu hình; không hardcode chính sách production cho phép quá rộng. |
| Chỉ kiểm tra xác thực ở frontend | Thực thi mọi hành động được bảo vệ ở server. |
| Challenge mất khi process restart | Frontend tải challenge mới; không có trạng thái xác thực nào được thay đổi trước khi CAPTCHA hợp lệ. |
| Scale nhiều instance làm challenge không dùng chung | Giữ kiến trúc một instance hiện tại; yêu cầu shared TTL store/provider được phê duyệt trước khi scale. |

## 11. Cổng xác thực

Trước khi FE02 được xem là hoàn tất:

- Tất cả hạng mục trong TASKS.md đều hoàn tất.
- Kiểm thử backend vượt qua.
- Build frontend vượt qua nếu có tích hợp frontend.
- Không commit mật khẩu/token/secret thô.
- Response API khớp với hợp đồng FE02 chuẩn trong Mục 11 của `SPEC.md`.
- Ma trận truy vết từ AC-FE02-001 đến AC-FE02-027 trong `SPEC.md` vẫn được đáp ứng, với mọi khoảng trống tuân thủ đã ghi nhận được đóng rõ ràng hoặc được phê duyệt để hoãn.
- Hoàn tất phê duyệt của người rà soát đối với mã xác thực nhạy cảm về bảo mật.

## 12. Trạng thái B7 của UX Xác thực/OTP

Phần tăng cường frontend từ `FE02-T024` đến `FE02-T028` đã hoàn tất xác thực tự động và rà soát thủ công của Nhat trước khi merge. Merge commit `01c66ef` đã tích hợp App Shell và UX Xác thực/OTP vào `main`.

Lần chạy CI đầu tiên trên cùng commit làm lộ các giả định golden path đã cũ. Commit `232ee4c` đã đồng bộ locator mật khẩu E2E, đích đăng nhập `/home` và đồng hồ trình duyệt với hợp đồng UX/runtime đã phê duyệt. Commit `main` cuối cùng `6eee459` đã vượt qua GitHub Actions CI run `29358045198`.

Bằng chứng chi tiết được ghi tại `.sdd/reviews/library-ux-b7-integration-closeout-2026-07-15.md`. Nội dung này đóng phần tăng cường UX Xác thực/OTP đã phê duyệt. Phần triển khai gửi FE02/FE10 riêng, nghiệm thu thủ công, tích hợp PR #42-#44 và CI chính xác sau merge trên `main` đã hoàn tất và được ghi tại `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.

## 13. Công việc tiếp theo về gửi OTP FE02/FE10

ADR-004 và phê duyệt ngày 2026-07-15 của Nhat cho phép phần triển khai theo thứ tự sau:

1. Thêm kiểm thử FE10 đang thất bại để chứng minh HTTP dành cho nhân viên và bên yêu cầu không phải FE02 không thể gửi `ACCOUNT_VERIFICATION` hoặc `PASSWORD_RESET`.
2. Thêm kiểm thử OTP FE10 đang thất bại để chứng minh bên yêu cầu gắn với FE02 chấp nhận `otp`, `expiresInMinutes` và metadata nguồn `AuthToken`, đồng thời không có OTP nào vượt qua ranh giới lưu trữ/log/audit/response.
3. Cập nhật template FE10, kết nối nhà cung cấp và chính sách nguồn/loại bằng phần triển khai nhỏ nhất vượt qua các kiểm thử tập trung.
4. Thêm kiểm thử FE02 đang thất bại để chứng minh việc gửi xác minh/đặt lại sử dụng một lần gọi bên yêu cầu FE10, tính idempotent theo ID token, không ghi trực tiếp thông báo và không gửi email trực tiếp trùng lặp.
5. Chỉ chuyển việc gửi xác minh/đặt lại trong `authService`; giữ nguyên email trực tiếp `CHANGE_PASSWORD_OTP` và việc chấp nhận token cũ.
6. Xác minh lỗi FE10 không chặn luồng, ngữ nghĩa gửi lại bằng token mới, kiểm thử FE02/FE10 tập trung, kiểm thử integration bị ảnh hưởng, khả năng truy vết và `git diff --check`.

## 14. Công việc tiếp theo về thiết lập tài khoản FE02/FE11

1. Thêm kiểm thử đang thất bại để chứng minh FE02 chỉ chấp nhận thông tin xác thực `ACCOUNT_SETUP` hợp lệ của FE11 cho tài khoản không hoạt động do quản trị viên tạo.
2. Chứng minh việc hoàn tất thiết lập cập nhật nguyên tử mật khẩu, `EmailVerifiedAt`, các trường khóa, `Status`, việc sử dụng/thu hồi token và audit.
3. Chứng minh thông tin xác thực đặt lại mật khẩu không thể kích hoạt tài khoản không hoạt động thông thường.
4. Giữ nguyên cấu trúc tương thích hiện có của `/api/auth/reset-password` trong khi tách các nhánh nghiệp vụ đặt lại và thiết lập.
5. Xác thực lần thử thiết lập hết hạn, đã dùng, bị thu hồi, không đủ điều kiện và đồng thời mà không lưu dữ liệu dở dang.

## 15. Công việc tiếp theo về OTP xác minh 15 phút

1. Thêm kiểm thử RED cho đăng ký/gửi lại và cấu hình môi trường đối với thời hạn OTP xác minh chính xác 15 phút.
2. Giới thiệu `EMAIL_VERIFICATION_TTL_MINUTES=15` chuẩn cùng cơ chế fallback tạm thời theo số giờ cũ.
3. Giữ nguyên quyền sở hữu thông tin xác thực của FE02 và quyền sở hữu việc kết xuất/gửi của FE10.
4. Xác thực kiểm thử backend tập trung và đầy đủ, khả năng truy vết, kiểm tra secret/rò rỉ và bằng chứng email Azure staging trước khi tích hợp.

## 16. Đối soát tính nhất quán với bối cảnh

Baseline triển khai đã phê duyệt vẫn được ghi nhận. Việc thực thi vai trò hiện tại,
độ bao phủ OTP thay đổi mật khẩu, kiểm tra trạng thái tài khoản hiện tại, hành vi
khóa theo cửa sổ trượt chính xác, tạo OTP an toàn, bằng chứng rollback giao dịch,
chốt chặn hủy kích hoạt ở trạng thái cuối cho việc xác minh email nguyên tử,
đăng ký trùng lặp đồng thời có tính xác định và thao tác ghi trạng thái hiện tại khi đăng nhập đã được đóng.
PR C đã xác minh FE02-T043 commit `241907d`, PR #60, exact-head CI `29875668029`,
post-merge CI `29875885463` và staging `29876046500`; PR #60 không có review record lịch sử.
H3 hồi cứu hiện tại đã được chấp nhận tại [PR #107](https://github.com/SWP391-LibraryManagement/LibraryManagement/pull/107#issuecomment-5162255705),
đóng đối soát thủ công SPEC v0.6.22. Các mục tiêu hiệu năng về đăng nhập hợp lệ
và xác thực token có bằng chứng cục bộ có thể lặp lại trong FE02-T048.

## 17. Công việc tiếp theo về khả dụng của định danh đăng ký

1. Tái sử dụng `POST /api/auth/register`; không thêm endpoint kiểm tra khả dụng riêng.
2. Kiểm tra username và email đã chuẩn hóa trước khi hash mật khẩu, tạo tài khoản, tạo token xác minh hoặc gửi OTP.
3. Giữ ràng buộc duy nhất của cơ sở dữ liệu làm nguồn có thẩm quyền cho xử lý đồng thời và ánh xạ tranh chấp username hoặc email sang conflict `409` an toàn tương ứng.
4. Giữ phản hồi trùng lặp trên biểu mẫu đăng ký và chỉ chuyển sang OTP sau khi đăng ký thành công.
5. Thêm kiểm thử hồi quy backend và frontend tập trung, sau đó chạy traceability FE02 và lint/build frontend.

## 18. Củng cố runtime và session-audit 2026-08-01

1. Thêm RED cho bcrypt floor production/test, OTP response, HTTPS toàn API và rollback login/logout khi audit lỗi.
2. Loại debug OTP path; test lấy OTP qua dependency được inject/fake delivery.
3. Dùng transaction hiện có cho login success và logout; giữ các event login failure/lock ngoài phạm vi batch này.
4. Không đổi schema, token format, role, endpoint hoặc response thành công ngoài việc loại trường debug bị cấm.
