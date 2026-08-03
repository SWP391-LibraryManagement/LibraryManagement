# Xác minh email Kế hoạch triển khai 15 phút OTP

> **Đối với Codex:** Thực hiện nội tuyến kế hoạch này bằng quá trình phát triển dựa trên kiểm thử. Không đẩy, hợp nhất hoặc triển khai mã mà không có yêu cầu riêng của người dùng.

**Mục tiêu:** Giảm thời gian tồn tại của OTP xác minh email tự đăng ký từ 24 giờ xuống 15 phút và
giữ cho giai đoạn Azure nhất quán với hợp đồng mã.

**Kiến trúc:** FE02 vẫn chịu trách nhiệm tạo, băm, hết hạn, thu hồi và xác thực OTP. FE10 tiếp tục
nhận `expiresInMinutes` từ FE02 và chỉ hiển thị/gửi email. Cài đặt môi trường dựa trên phút mới là
chuẩn; cài đặt dựa trên giờ cũ vẫn là phương án dự phòng tạm thời cho các môi trường được triển
khai.

**bộ công nghệ công nghệ:** Node.js, Express, Jest, SQL Server được hỗ trợ bởi Azure App Service,
Gmail SMTP đến FE10.

---

### Nhiệm vụ 1: Khóa hợp đồng đã được phê duyệt trong các kiểm thử và đặc tả

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-auth/PLAN.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `backend/tests/authRoutes.test.js`
- Tạo: `backend/tests/envConfig.test.js`

1. Thay đổi đăng ký và gửi lại kỳ vọng từ 14h40 đến 15 phút.
2. Thêm kiểm tra cấu hình cho cài đặt phút chuẩn, dự phòng giờ cũ và giá trị phút phân đoạn không hợp lệ.
3. Chạy các kiểm thử tập trung và ghi lại lỗi RED dự kiến trong quá trình triển khai 24 giờ.

### Nhiệm vụ 2: Thực hiện thay đổi cấu hình tương thích nhỏ nhất

**Tệp:**
- Sửa đổi: `backend/src/config/env.js`
- Sửa đổi: `backend/src/services/authService.js`
- Sửa đổi: `backend/.env.example`

1. Thêm `EMAIL_VERIFICATION_TTL_MINUTES` đã xác thực, mặc định là 15.
2. Nếu không có, hãy chuyển đổi giá trị `EMAIL_VERIFICATION_TTL_HOURS` cũ thành phút.
3. Sử dụng trực tiếp giá trị phút để đăng ký và gửi lại việc tạo/phân phối mã thông báo.
4. Chạy lại các kiểm thử tập trung cho đến GREEN.

### Nhiệm vụ 3: Xác minh hành vi cục bộ và Azure

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`
- Sửa đổi: `.sdd/specs/feat-auth/CONTEXT.md`

1. Chạy bộ máy chủ đầy đủ, truy vết, kiểm tra bí mật/rò rỉ và `git diff --check`.
2. Đặt Môi trường tiền sản xuất Azure thành `EMAIL_VERIFICATION_TTL_MINUTES=15` và `EMAIL_VERIFICATION_TTL_HOURS=0.25` cũ cho đến khi mã mới được triển khai.
3. Khởi động lại quá trình chạy thử, kiểm tra `/health`, yêu cầu gửi lại một lần xác minh và xác nhận Gmail hiển thị hết hạn trong 15 phút mà không để lộ OTP trong nhật ký dự án hoặc báo cáo cuối cùng.
4. Để lại tất cả các thay đổi mã ở trạng thái không được đẩy và chưa được hợp nhất để người dùng xem xét.
