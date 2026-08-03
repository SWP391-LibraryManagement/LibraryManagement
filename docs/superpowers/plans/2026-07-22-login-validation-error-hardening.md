# Kế hoạch thực hiện tăng cường xác thực đăng nhập và phản hồi lỗi

> **Đối với nhân viên đại lý:** SUB-SKILL BẮT BUỘC: Sử dụng siêu năng lực:phát triển theo định hướng phụ (được khuyến nghị) hoặc siêu năng lực:thực hiện các kế hoạch để triển khai kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Làm cho xác thực đăng nhập FE02 và phản hồi lỗi trở nên chính xác, có thể thực hiện
được, được bản địa hóa và nhất quán với hợp đồng email 255 ký tự đã được phê duyệt.

**Kiến trúc:** Thêm các trình trợ giúp trình bày thuần túy vào `authUx.js`, kết nối chúng vào biểu
mẫu đăng nhập/bộ chuyển đổi API hiện có và duy trì xác thực Express bắt buộc. Mã máy chủ ổn định
được ánh xạ tới bản sao tiếng Việt an toàn thay vì hiển thị thông báo máy chủ thô.

**bộ công nghệ công nghệ:** React 19, MUI 9, Axios, Trình chạy kiểm thử nút, Express 5, trình xác
thực nhanh, Jest/Supertest.

## Ràng buộc toàn cầu

- Không tiết lộ liệu email có tồn tại hay tài khoản không hoạt động.
- Không đăng nhập hoặc hiển thị mật khẩu, mã thông báo, lỗi thô, dấu vết bộ công nghệ hoặc thông tin xác thực.
- Giữ xác thực máy chủ có thẩm quyền.
- Chấp nhận email hoặc tên người dùng trong trường mã định danh đăng nhập kết hợp.
- Phù hợp với độ dài email tối đa được phê duyệt là 255 ký tự.
- Chỉ thực hiện các thay đổi mang tính phẫu thuật đối với FE02 và không cam kết triển khai đã tạo cho đến khi có sự đánh giá của con người.

---

### Nhiệm vụ 1: Hợp đồng trình bày đăng nhập giao diện

**Tệp:**
- Sửa đổi: `frontend/test/authUxFrontend.test.js`
- Sửa đổi: `frontend/test/loginFrontend.test.js`
- Sửa đổi: `frontend/src/utils/authUx.js`

**Giao diện:**
- Sản xuất: `validateLoginFields(values = {}) -> Record<string, string>`.
- Sản xuất: `getLoginErrorMessage(error) -> string`.

- [x] **Bước 1: Viết các kiểm thử thuần trợ giúp thất bại**

Thêm xác nhận rằng mã nhận dạng khoảng trắng và mật khẩu trống trả về lỗi trường, giá trị 256 ký tự
bị từ chối, giá trị tên người dùng/mật khẩu hợp lệ trả về `{}`, `INVALID_CREDENTIALS` vẫn chung
chung, `ACCOUNT_LOCKED` giải thích việc đặt lại/chờ khôi phục và lỗi mạng sử dụng bản sao trung tính
với môi trường.

- [x] **Bước 2: Chạy kiểm thử để xác minh RED**

Chạy: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js`

Dự kiến: không thành công vì `validateLoginFields` và `getLoginErrorMessage` không được xuất và
không có hệ thống dây đăng nhập.

- [x] **Bước 3: Triển khai pure helpers**

Chỉ thực hiện kiểm tra bắt buộc/tối đa cho các trường đăng nhập. Ánh xạ mã đăng nhập ổn định mà
không cần đọc `error.response.data.error.message` thô hoặc chi tiết.

- [x] **Bước 4: Chạy kiểm thử để xác minh GREEN**

Chạy: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js`

Dự kiến: vượt qua các kiểm thử trợ giúp; xác nhận nối dây nguồn có thể vẫn là RED cho đến Nhiệm vụ 2.

### Nhiệm vụ 2: Mẫu đăng nhập và nối dây API

**Tệp:**
- Sửa đổi: `frontend/src/component/login/LoginForm.jsx`
- Sửa đổi: `frontend/src/component/login/AuthCard.jsx`
- Sửa đổi: `frontend/src/page/LoginPage.jsx`
- Sửa đổi: `frontend/src/api/authApi.js`
- Kiểm tra: `frontend/test/authUxFrontend.test.js`
- Kiểm tra: `frontend/test/loginFrontend.test.js`

**Giao diện:**
- Tiêu thụ: `validateLoginFields` và `getLoginErrorMessage` từ `authUx.js`.
- Tạo ra: phản hồi MUI cấp trường và phản hồi API cấp trang an toàn.

- [x] **Bước 1: Giữ nguyên xác nhận nối dây nguồn RED**

Xác nhận rằng biểu mẫu nhập/gọi `validateLoginFields`, hiển thị `error` và `helperText`, tắt xác
thực biểu mẫu gốc, giới hạn cả bộ đệm đầu vào HTML ở 256 ký tự để nhánh trên 255 vẫn có thể quan sát
được, bảo vệ `isSubmitting` và gọi `onInputChange` trong khi chỉnh sửa. Khẳng định rằng `authApi.js`
gọi `getLoginErrorMessage` để đăng nhập.

- [x] **Bước 2: Thực hiện nối dây tối thiểu**

Thêm trạng thái `fieldErrors`, xác thực trước khi gửi, chỉ cắt bớt mã nhận dạng, xóa phản hồi cũ về
các chỉnh sửa, tắt các trường trong khi đang chờ xử lý và định tuyến các lỗi đăng nhập Axios thông
qua trình ánh xạ an toàn.

- [x] **Bước 3: Chạy kiểm thử giao diện người dùng tập trung**

Chạy: `node --test test/authUxFrontend.test.js test/loginFrontend.test.js test/vietnameseUi.test.js`

Dự kiến: tất cả các kiểm thử tập trung đều vượt qua mà không cho phép các thông báo máy chủ thô.

### Nhiệm vụ 3: Ranh giới định danh máy chủ

**Tệp:**
- Sửa đổi: `backend/tests/authRoutes.test.js`
- Sửa đổi: `backend/src/validators/authValidators.js`

**Giao diện:**
- Tạo ra: `/api/auth/login` chấp nhận số nhận dạng chuỗi tối đa 255 ký tự và từ chối đầu vào dài hơn với `VALIDATION_ERROR`.

- [x] **Bước 1: Viết kiểm thử tích hợp thất bại**

Đăng ký và xác minh email hợp lệ theo tiêu chuẩn dài hơn 100 ký tự, sau đó xác nhận thông tin đăng
nhập sẽ trả về `200`.

- [x] **Bước 2: Chạy kiểm thử tập trung để xác minh RED**

Chạy: `npm test -- --runTestsByPath tests/authRoutes.test.js`

Dự kiến: trường hợp mới nhận được `400 VALIDATION_ERROR` từ trình xác thực đăng nhập 100 ký tự.

- [x] **Bước 3: Căn chỉnh trình xác thực máy chủ**

Thay đổi giá trị nhận dạng đăng nhập kết hợp tối đa thành 255 và thêm thông báo xác thực an toàn rõ
ràng đối với trường hợp đầu vào sai loại, thiếu giá trị và quá dài.

- [x] **Bước 4: Chạy bộ máy chủ tập trung để xác minh GREEN**

Chạy: `npm test -- --runTestsByPath tests/authRoutes.test.js`

Dự kiến: tất cả các kiểm thử lộ trình xác thực đều vượt qua.

### Nhiệm vụ 4: Cổng truy vết và hoàn thiện

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-auth/SPEC.md`
- Sửa đổi: `.sdd/specs/feat-auth/TASKS.md`
- Sửa đổi: `.sdd/specs/feat-auth/CHANGELOG.md`

**Giao diện:**
- Bản ghi: xác thực bản trình bày đăng nhập, ánh xạ lỗi cục bộ an toàn và ranh giới mã định danh 255 ký tự theo quy tắc FE02 hiện có.

- [x] **Bước 1: Cập nhật bản ghi FE02**

Làm rõ rằng hướng dẫn về độ mạnh mật khẩu được áp dụng khi tạo/thay đổi/đặt lại mật khẩu thay vì khi
nhập mật khẩu hiện có khi đăng nhập. Thêm nhiệm vụ bảo trì và bằng chứng thay đổi.

- [x] **Bước 2: Chạy xác minh đầy đủ**

Chạy kiểm thử giao diện người dùng, tìm lỗi mã nguồn và xây dựng; chạy kiểm thử xác thực máy chủ tập
trung; chạy truy vết và `git diff --check`; kiểm tra các tệp đã thay đổi để ghi nhật ký thông tin
xác thực và hiển thị lỗi máy chủ thô.

- [x] **Bước 3: Để lại các thay đổi để con người xem xét**

Không cam kết, đẩy hoặc hợp nhất cho đến khi bằng chứng xác minh và khác biệt cục bộ được xem xét.
