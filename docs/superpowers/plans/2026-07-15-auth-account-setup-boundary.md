# Kế hoạch thực hiện ranh giới thiết lập tài khoản xác thực

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Không sử dụng đại lý phụ cho dự án này.

**Mục tiêu:** Làm cho các tài khoản do quản trị viên tạo không hoạt động cho đến khi mã thông báo
thiết lập FE11 sử dụng một lần được phân phối bởi FE10 và được FE02 tiêu thụ nguyên tử.

**Kiến trúc:** Thêm một chính sách quyền sở hữu thông báo nhạy cảm theo giới hạn xây dựng được chia
sẻ bởi FE02 và FE11. Đặt các giao dịch trong vòng đời thiết lập nhiều bảng trong
`accountSetupRepository` tập trung; các dịch vụ chỉ tạo thông tin xác thực thô trong bộ nhớ và gọi
FE10 sau khi xác nhận nguồn. Giữ nguyên điểm cuối tương thích `/api/auth/reset-password` hiện có và
thêm chức năng gửi lại thiết lập chỉ dành cho Quản trị viên.

**bộ công nghệ công nghệ:** Node.js, Express, SQL Server (`mssql`), Jest/Supertest, React/Vite, Material UI.

## Ràng buộc toàn cầu

- Tài khoản do quản trị viên tạo bắt đầu `INACTIVE`; chỉ việc hoàn thành `ACCOUNT_SETUP` hợp lệ mới thay đổi chúng thành `ACTIVE`.
- FE11 vấn đề/gửi lại mã thông báo thiết lập; FE10 mang lại; FE02 tiêu thụ/kích hoạt.
- Chỉ lưu trữ các hàm băm mã thông báo SHA-256 và các hàm băm mật khẩu bcrypt hợp lệ.
- Không bao giờ lưu giữ, ghi nhật ký, kiểm tra, trả sách hoặc chụp nhanh OTP thô, mã thông báo thiết lập, liên kết thiết lập hoặc hiển thị nội dung nhạy cảm.
- Sử dụng các khóa nguồn chính xác `FE02:ACCOUNT_VERIFICATION:<tokenId>`, `FE02:PASSWORD_RESET:<tokenId>` và `FE11:ACCOUNT_SETUP:<tokenId>`.
- Giao dịch nguồn và hoàn thành FE02 là nguyên tử; việc phân phối của nhà cung cấp là sau cam kết và không chặn.
- Chỉ hoạt động trên `fix/auth-account-setup-boundary`; không chạm vào các tập tin dọn dẹp/do người dùng sở hữu.

---

### Nhiệm vụ 1: Quyền sở hữu nguồn nhạy cảm FE10

**Tệp:**
- Sửa đổi: `backend/src/services/notificationService.js`
- Sửa đổi: `backend/src/validators/notificationValidators.js`
- Sửa đổi: `backend/src/models/Notification.js`
- Sửa đổi: `backend/tests/notificationRoutes.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Sửa đổi: `database/Librarymanagement.sql`

**Giao diện:**
- Sản xuất: `createSourceNotificationRequester('FE02' | 'FE11' | existing sources)`.
- FE02 sở hữu `ACCOUNT_VERIFICATION`/`PASSWORD_RESET`; FE11 sở hữu `ACCOUNT_SETUP`.

- [ ] Thêm các kiểm thử thất bại để loại bỏ HTTP đối với tất cả các loại nhạy cảm và ghi đè nguồn.
- [ ] Thêm các kiểm thử thất bại cho các loại OTP chỉ FE02 và `ACCOUNT_SETUP` chỉ FE11.
- [ ] Thêm các kiểm thử không thành công yêu cầu `AuthToken`, ID mã thông báo dương, khóa bình thường chính xác và các biến mẫu bắt buộc.
- [ ] Thêm các kiểm thử không thành công chứng minh siêu dữ liệu nguồn nhạy cảm vẫn tồn tại trong khi nội dung thô/kết xuất thì không.
- [ ] Chạy `npm.cmd test -- notificationRoutes.test.js` và xác nhận các kiểm thử mới không thành công do thiếu quyền sở hữu FE11/loại.
- [ ] Thêm `ACCOUNT_SETUP` vào số nhận dạng được hỗ trợ/chuẩn/nhạy cảm và biên tập `setuplink`.
- [ ] Thêm `sensitiveTypeOwners = { ACCOUNT_VERIFICATION: 'FE02', PASSWORD_RESET: 'FE02', ACCOUNT_SETUP: 'FE11' }` và thực thi nó trước các cuộc gọi liên tục/nhà cung cấp.
- [ ] Duy trì `sourceFeature: owner`, `sourceEntityType: 'AuthToken'`, `sourceEntityId` an toàn và khóa bình thường mã thông báo-ID chính xác cho các bản ghi nhạy cảm.
- [ ] Thêm hỗ trợ SQL/model/mẫu cho `ACCOUNT_SETUP` với `{{setupLink}}` và `{{expiresInHours}}`.
- [ ] Chạy kiểm thử tập trung và xác nhận ĐẠT.
- [ ] Cam kết: `feat: enforce sensitive notification source ownership`.

### Nhiệm vụ 2: Bộ điều hợp nhà cung cấp FE10 được định cấu hình

**Tệp:**
- Sửa đổi: `backend/src/services/emailService.js`
- Sửa đổi: `backend/src/services/notificationService.js`
- Kiểm tra: `backend/tests/notificationRoutes.test.js`

**Giao diện:**
- Sản xuất: `emailService.sendNotificationEmail({ to, subject, body }) -> { sent, providerMessageId?, reason? }`.

- [ ] Thêm một kiểm thử thất bại chứng minh ủy quyền phân phối FE10 mặc định vào bộ điều hợp email đã định cấu hình thay vì mô phỏng dấu thời gian.
- [ ] Xuất `sendNotificationEmail` từ `emailService`, ủy quyền cho `sendMail` riêng tư hiện có với văn bản an toàn/HTML.
- [ ] Đặt nhà cung cấp thông báo mặc định gọi `sendNotificationEmail`; giữ các nhà cung cấp dịch vụ tiêm để xét nghiệm.
- [ ] Ánh xạ `sent: false` tới lỗi bàn giao an toàn mà không có thông tin chi tiết về nhà cung cấp.
- [ ] Chạy kiểm tra thông báo tập trung và xác nhận ĐẠT.
- [ ] Cam kết: `feat: connect notifications to configured email provider`.

### Nhiệm vụ 3: Tạo tài khoản FE11 giao dịch

**Tệp:**
- Tạo: `backend/src/repositories/accountSetupRepository.js`
- Tạo: `backend/tests/userManagementService.test.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/src/app.js`
- Sửa đổi: `backend/tests/helpers/inMemoryAuthRepositories.js`

**Giao diện:**
- Sản xuất: `accountSetupRepository.createPendingAccount(input) -> { user, tokenId }`.
- Tiêu thụ: Người yêu cầu được ràng buộc FE11 từ Nhiệm vụ 1.

- [ ] Thêm các kiểm thử dịch vụ RED cho `INACTIVE`, vai trò được yêu cầu, trình giữ chỗ bcrypt hợp lệ, mã thông báo băm 24 giờ và một yêu cầu FE10.
- [ ] Thêm các kiểm thử khôi phục RED cho các lỗi hồ sơ, vai trò, mã thông báo và kiểm tra.
- [ ] Thêm tài khoản chứng minh kiểm tra lỗi bàn giao RED vẫn là `INACTIVE` và phản hồi là `FAILED` an toàn.
- [ ] Triển khai `createPendingAccount` với một giao dịch SQL chèn `Users`, `UserProfiles`, `UserRoles`, `AuthTokens` và `AuditLogs`.
- [ ] Tạo một giá trị bị loại bỏ ngẫu nhiên và băm nó bằng chính sách FE02 bcrypt; xóa `ACCOUNT_SETUP_PENDING` theo nghĩa đen.
- [ ] Tạo mã thông báo thiết lập thô bằng `generateRandomToken`, chỉ lưu trữ `hashToken`, sau đó tạo `${frontendBaseUrl}/forgot-password?token=...` trong bộ nhớ.
- [ ] Yêu cầu FE10 `ACCOUNT_SETUP` sau khi xác nhận với siêu dữ liệu `AuthToken` và `FE11:ACCOUNT_SETUP:<tokenId>`.
- [ ] Trả về `{ userId, email, status: 'INACTIVE', roles, setupDeliveryStatus, message }` không có trường gỡ lỗi.
- [ ] Chạy `npm.cmd test -- userManagementService.test.js userManagementRoutes.test.js` và xác nhận đạt.
- [ ] Cam kết: `feat: create inactive accounts with setup tokens`.

### Nhiệm vụ 4: Hoàn tất thiết lập Atomic FE02

**Tệp:**
- Sửa đổi: `backend/src/repositories/accountSetupRepository.js`
- Sửa đổi: `backend/src/services/authService.js`
- Sửa đổi: `backend/tests/authRoutes.test.js`
- Sửa đổi: `backend/tests/helpers/inMemoryAuthRepositories.js`

**Giao diện:**
- Sản xuất: `accountSetupRepository.completeSetup({ tokenHash, passwordHash, now, context })`.

- [ ] Thêm các kiểm thử RED để hoàn thành `INACTIVE -> ACTIVE` hợp lệ bằng mật khẩu, `EmailVerifiedAt`, đặt lại khóa, sử dụng/thu hồi mã thông báo và cam kết kiểm tra cùng nhau.
- [ ] Thêm các kiểm thử RED để phát hiện các lần thử mã thông báo đồng thời, đã sử dụng, đã hết hạn, tài khoản đang hoạt động, sai mục đích và đồng thời.
- [ ] Thêm kiểm thử RED chứng minh thông tin xác thực đặt lại mật khẩu không thể kích hoạt các tài khoản không hoạt động.
- [ ] Triển khai một giao dịch SQL bị khóa để chọn mã thông báo/người dùng thiết lập, xác thực vòng đời, cập nhật người dùng, đánh dấu một mã thông báo đã sử dụng, thu hồi các mã thông báo anh em và chèn kiểm tra.
- [ ] Chia `authService.resetPassword` thành các nhánh thiết lập tài khoản và đặt lại mật khẩu rõ ràng trong khi vẫn giữ nguyên hình dạng yêu cầu.
- [ ] Chạy `npm.cmd test -- authRoutes.test.js` và xác nhận đạt.
- [ ] Cam kết: `feat: complete account setup atomically`.

### Nhiệm vụ 5: Cài đặt quản trị Gửi lại

**Tệp:**
- Sửa đổi: `backend/src/repositories/accountSetupRepository.js`
- Sửa đổi: `backend/src/services/userManagementService.js`
- Sửa đổi: `backend/src/controllers/userManagementController.js`
- Sửa đổi: `backend/src/routes/userManagementRoutes.js`
- Tạo: `backend/src/validators/userManagementValidators.js`
- Sửa đổi: `backend/tests/userManagementService.test.js`
- Sửa đổi: `backend/tests/userManagementRoutes.test.js`

**Giao diện:**
- Sản xuất: `POST /api/users/:userId/resend-setup`.

- [ ] Thêm các kiểm thử RED để gửi lại đủ điều kiện, thu hồi mã thông báo cũ, mã thông báo/khóa mới, thời gian hồi chiêu 60 giây và lỗi nhà cung cấp an toàn.
- [ ] Thêm các kiểm thử từ chối RED cho các mục tiêu đang hoạt động, bị khóa, tự đăng ký không hoạt động, thiết lập đã hoàn tất, bị thiếu và không phải quản trị viên.
- [ ] Triển khai giao dịch `rotateSetupToken` với khóa hàng, tính đủ điều kiện của lịch sử mã thông báo, thời gian hồi chiêu, thu hồi, mã thông báo mới và kiểm tra.
- [ ] Thêm tuyến đường/bộ điều khiển/trình xác thực và phân phối sau cam kết FE10.
- [ ] Chạy các kiểm thử FE11 tập trung và xác nhận ĐẠT.
- [ ] Cam kết: `feat: add admin account setup resend`.

### Nhiệm vụ 6: Luồng liên kết thiết lập giao diện người dùng

**Tệp:**
- Sửa đổi: `frontend/src/api/authApi.js`
- Sửa đổi: `frontend/src/component/forgotpassword/ForgotPasswordForm.jsx`
- Sửa đổi: `frontend/src/utils/authUx.js`
- Kiểm tra: các tệp kiểm tra UX xác thực giao diện người dùng hiện có trong `frontend/src`.

**Giao diện:**
- Sản xuất: `resetPasswordWithToken({ token, newPassword })`.

- [ ] Thêm các kiểm thử RED cho chế độ truy vấn mã thông báo, xác thực mật khẩu, không có biểu mẫu OTP/email, thành công và lỗi liên kết không hợp lệ an toàn.
- [ ] Phân tích `token` bằng `useSearchParams`; vào chế độ thiết lập khi có mặt.
- [ ] Gửi `{ token, newPassword }` thông qua `resetPasswordWithToken` và giữ lại hành động đăng nhập/thành công hiện có.
- [ ] Đảm bảo mã thông báo thô không bao giờ được ghi lại, lưu trữ hoặc hiển thị trong bản sao trang.
- [ ] Chạy kiểm thử giao diện người dùng có mục tiêu và tìm lỗi mã nguồn cho các tệp được chạm.
- [ ] Cam kết: `feat: support account setup links in recovery flow`.

### Nhiệm vụ 7: Xác thực chức năng chéo

**Tệp:**
- Chỉ sửa đổi các tệp bằng chứng nhiệm vụ/thay đổi/xem lại theo yêu cầu của đặc tả đã được phê duyệt.

- [ ] Chạy các kiểm thử máy chủ FE02/FE10/FE11 tập trung.
- [ ] Chạy các kiểm thử tích hợp hệ thống bị ảnh hưởng, chứ không phải bộ SQL đầy đủ không liên quan.
- [ ] Chỉ chạy các kiểm thử giao diện người dùng được nhắm mục tiêu, tìm lỗi mã nguồn và bản dựng nếu các tệp giao diện người dùng đã thay đổi yêu cầu.
- [ ] Chạy `node scripts/check-traceability.js --enforce`.
- [ ] Quét các dòng đã thay đổi để tìm `debugOtp`, `debugSetupToken`, nhật ký mã thông báo/liên kết thô, hàm băm giữ chỗ theo nghĩa đen và bí mật.
- [ ] Chạy `git diff --check`.
- [ ] Ghi lại những rủi ro còn lại và yêu cầu con người Nhật xem xét trước khi sáp nhập.
