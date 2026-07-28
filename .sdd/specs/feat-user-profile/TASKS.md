# TASKS.md - Hồ sơ người dùng FE03

# Phiên bản: 0.2.2

# Trạng thái: COMPLETE - ĐÃ GHI NHẬN BẰNG CHỨNG CHỐT GIAI ĐOẠN 2
Implementation State: COMPLETE

# Chủ sở hữu: Dat

# Cập nhật lần cuối: 2026-07-24

Trạng thái quy trình: COMPLETE cho phạm vi Giai đoạn 2 đã phê duyệt; H3, merge và CI
`main` chính xác sau merge được ghi tại
`.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`. Các phát biểu xác minh
thủ công chưa được đánh dấu bên dưới là snapshot thực thi lịch sử đã được bằng chứng đó thay thế,
không phải nhiệm vụ triển khai đang mở hiện tại.

---

## Chú giải trạng thái nhiệm vụ

- `[ ]` Chưa bắt đầu
- `[~]` Đang thực hiện
- `[x]` Hoàn tất

---

## Nhiệm vụ backend

### T-FE03-001 - Rà soát mẫu xác thực và cơ sở dữ liệu ở backend

- [x] Tìm entry point ứng dụng Express hiện có, kiểu mount route, middleware xác thực và helper cơ sở dữ liệu SQL Server.
- [x] Xác nhận cách `userId` đã xác thực được cung cấp trên request object.
- [x] Xác nhận thiết lập kiểm thử hiện tại cho kiểm thử backend route.

Traceability: PRE-FE03-001, NFR-FE03-SEC-001

### T-FE03-002 - Xác định DTO hồ sơ an toàn

- [x] Tạo DTO/helper chỉ trả về các trường hồ sơ an toàn.
- [x] Bao gồm các trường tóm tắt tài khoản được phê duyệt để hiển thị: `userId`, `username`, `email`, `phone`, `status`, `createdAt`.
- [x] Bao gồm các trường hồ sơ: `profileId`, `fullName`, `address`, `dateOfBirth`, `avatarUrl`.
- [x] Loại trừ `PasswordHash`, token, nội bộ quản lý vai trò và nội bộ audit.

Traceability: BR-FE03-004, BR-FE03-010, FR-FE03-001, FR-FE03-007, AC-FE03-008

### T-FE03-003 - Thêm xác thực dữ liệu hồ sơ

- [x] Xác thực các trường cập nhật được phép: `fullName`, `address`, `dateOfBirth` và `phone`; từ chối thay đổi trực tiếp `avatarUrl`.
- [x] Từ chối các trường được bảo vệ: `password`, `passwordHash`, `role`, `roles`, `roleId`, `status`, `email`, `membershipStatus`, `membershipApproval`, `userId`, `profileId`.
- [x] Trả về lỗi xác thực dữ liệu ở cấp trường.
- [x] Bảo đảm request không hợp lệ không ghi dữ liệu dở dang.

Traceability: BR-FE03-005, BR-FE03-006, BR-FE03-007, BR-FE03-008, BR-FE03-009, FR-FE03-005, FR-FE03-006, AC-FE03-006, AC-FE03-007

### T-FE03-004 - Thêm repository/model hồ sơ

- [x] Thêm truy vấn có tham số để tìm thông tin tóm tắt tài khoản người dùng theo `UserId`.
- [x] Thêm truy vấn có tham số để tìm hồ sơ theo `UserId`.
- [x] Thêm truy vấn có tham số để tạo bản ghi `UserProfiles` trống.
- [x] Thêm truy vấn có tham số để cập nhật `Users.Phone`.
- [x] Thêm truy vấn có tham số để cập nhật `UserProfiles.FullName`, `Address` và `DateOfBirth`; giữ `AvatarUrl` trong thao tác repository chỉ dành cho tải tệp.
- [x] Thêm insert audit log khi schema hiện có hỗ trợ.

Traceability: PRE-FE03-002, PRE-FE03-003, Q-FE03-003, Q-FE03-005, SAFE-003

### T-FE03-005 - Thêm service hồ sơ

- [x] Triển khai `getMyProfile(userId)`.
- [x] Tự động tạo hồ sơ trống nếu thiếu.
- [x] Triển khai `updateMyProfile(userId, payload)`.
- [x] Giữ việc cập nhật hồ sơ và số điện thoại là nguyên tử.
- [x] Trả về DTO hồ sơ an toàn đã cập nhật.

Traceability: FR-FE03-001, FR-FE03-004, AC-FE03-001, AC-FE03-002, AC-FE03-005, EC-FE03-003, NFR-FE03-TXN-001

### T-FE03-006 - Thêm controller và route hồ sơ

- [x] Thêm `GET /api/profile/me`.
- [x] Thêm `PUT /api/profile/me`.
- [x] Bảo vệ cả hai endpoint bằng xác thực.
- [x] Không chấp nhận `userId` do client kiểm soát cho các thao tác hồ sơ của chính mình trong FE03.
- [x] Trả về lỗi an toàn không chứa stack trace.

Traceability: BR-FE03-001, BR-FE03-002, BR-FE03-003, FR-FE03-002, FR-FE03-003, NFR-FE03-SEC-001, NFR-FE03-SEC-002, SAFE-004, SAFE-005

### T-FE03-007 - Thêm kiểm thử backend cho việc xem hồ sơ

- [x] Kiểm thử Thành viên đã xác thực có thể xem hồ sơ an toàn của chính mình.
- [x] Kiểm thử Thủ thư/quản trị viên đã xác thực có thể xem hồ sơ an toàn của chính mình nếu fixture xác thực hỗ trợ vai trò.
- [x] Kiểm thử request của Khách trả về unauthorized.
- [x] Kiểm thử hồ sơ thiếu được tự động tạo.
- [x] Kiểm thử response không bao gồm `PasswordHash`.

Traceability: FT12, AC-FE03-001, AC-FE03-002, AC-FE03-003, AC-FE03-008

### T-FE03-008 - Thêm kiểm thử backend cho việc cập nhật hồ sơ

- [x] Kiểm thử cập nhật hồ sơ hợp lệ lưu các trường được phép.
- [x] Kiểm thử cập nhật số điện thoại lưu vào `Users.Phone`.
- [x] Kiểm thử ngày sinh không hợp lệ bị từ chối.
- [x] Kiểm thử ngày sinh trong tương lai bị từ chối.
- [x] Kiểm thử số điện thoại không hợp lệ bị từ chối.
- [x] Kiểm thử gửi trực tiếp `avatarUrl` bị từ chối vì chỉ đọc.
- [x] Kiểm thử trường được bảo vệ bị từ chối và không bị thay đổi.
- [x] Kiểm thử cập nhật không hợp lệ không thay đổi dở dang dữ liệu hồ sơ.

Traceability: FT13, AC-FE03-005, AC-FE03-006, AC-FE03-007, BR-FE03-008

### T-FE03-009 - Chạy xác thực

- [x] Chạy kiểm thử backend bằng `npm --prefix backend test`.
- [x] Đã kiểm tra package script; không có lệnh lint/build backend được cấu hình.
- [x] Ghi nhận mọi lỗi kiểm thử liên quan môi trường trong ghi chú triển khai cuối cùng.

Traceability: Định nghĩa hoàn tất, `.agents/AGENTS.md` Quy tắc kiểm thử

---

## Nhiệm vụ sửa đổi tải avatar

### T-FE03-010 - Cập nhật hợp đồng tải avatar

- [x] Xác nhận endpoint tải avatar cuối cùng: `POST /api/profile/me/avatar`.
- [x] Xác nhận tên trường multipart: `avatar`.
- [x] Xác nhận phần mở rộng tệp được chấp nhận: JPG, JPEG, PNG, WebP.
- [x] Xác nhận kích thước tệp tối đa: 2 MB.
- [x] Xác nhận public path được tạo được lưu trong `UserProfiles.AvatarUrl`.

Traceability: PRE-FE03-006, BR-FE03-012, BR-FE03-013, BR-FE03-014

### T-FE03-011 - Thêm xử lý tải avatar ở backend

- [x] Thêm middleware tải multipart cho endpoint avatar.
- [x] Xác thực người dùng trước khi chấp nhận tải avatar.
- [x] Xác thực loại tệp và phần mở rộng.
- [x] Xác thực kích thước tệp tối đa.
- [x] Tạo tên tệp an toàn ở server.
- [x] Lưu tệp trong thư mục uploads do backend kiểm soát.
- [x] Phục vụ tệp avatar đã tải qua static path an toàn.
- [x] Từ chối tải lên không hợp lệ mà không thay đổi `avatarUrl` hiện có.

Traceability: BR-FE03-011, BR-FE03-012, BR-FE03-013, BR-FE03-014, FR-FE03-008, FR-FE03-009, NFR-FE03-SEC-005, NFR-FE03-SEC-006

### T-FE03-012 - Thêm service avatar ở backend và cập nhật repository

- [x] Thêm hàm service cập nhật avatar của người dùng hiện tại sau khi tải lên thành công.
- [x] Tái sử dụng tra cứu chỉ hồ sơ của chính mình bằng `userId` đã xác thực.
- [x] Chỉ lưu URL/đường dẫn avatar được tạo vào `UserProfiles.AvatarUrl`.
- [x] Trả về DTO hồ sơ an toàn đã cập nhật.
- [x] Ghi audit log cho cập nhật avatar khi có sẵn ghi log audit.

Traceability: FR-FE03-008, AC-FE03-009, Q-FE03-005

### T-FE03-013 - Thêm kiểm thử backend cho tải avatar

- [x] Kiểm thử người dùng đã xác thực có thể tải avatar hợp lệ.
- [x] Kiểm thử việc tải avatar của Khách là unauthorized.
- [x] Kiểm thử thiếu tệp avatar bị từ chối.
- [x] Kiểm thử loại tệp avatar không được hỗ trợ bị từ chối.
- [x] Kiểm thử tệp avatar vượt kích thước bị từ chối.
- [x] Kiểm thử tải avatar không hợp lệ giữ `avatarUrl` hiện có.
- [x] Kiểm thử đường dẫn/tên tệp cục bộ gốc không được lưu.

Traceability: AC-FE03-009, AC-FE03-010, AC-FE03-011, EC-FE03-012, EC-FE03-013, EC-FE03-014, EC-FE03-015, EC-FE03-016

### T-FE03-014 - Thêm UI tải avatar ở frontend

- [x] Thêm bộ chọn tệp avatar vào luồng chỉnh sửa hồ sơ.
- [x] Gửi avatar đã chọn dưới dạng multipart form-data đến `POST /api/profile/me/avatar`.
- [x] Hiển thị trạng thái tiến trình/đang tải.
- [x] Hiển thị lỗi xác thực dữ liệu rõ ràng về loại tệp và kích thước tệp.
- [x] Làm mới trạng thái hồ sơ bằng DTO hồ sơ an toàn được trả về.

Traceability: MF-FE03-003, NFR-FE03-UX-003

### T-FE03-015 - Chạy xác thực tải avatar

- [x] Chạy kiểm thử backend.
- [x] Chạy lint/build frontend.
- [x] Xác minh tải lên từ màn hình hồ sơ bằng ảnh hợp lệ qua tự động hóa trình duyệt Playwright.
- [x] Xác minh lỗi loại tệp không hợp lệ và tệp vượt kích thước từ màn hình hồ sơ qua tự động hóa trình duyệt Playwright.

Traceability: Định nghĩa hoàn tất, `.agents/AGENTS.md` Quy tắc kiểm thử

---

## Công việc tiếp theo theo hợp đồng xác định dành cho code owner

### T-FE03-016 - Đồng bộ hành vi PUT và audit của hồ sơ

- [x] Xóa `avatarUrl` khỏi các trường `PUT /api/profile/me` được phép và từ chối nguyên tử trường được bảo vệ, không xác định hoặc chỉ đọc.
- [x] Yêu cầu một audit entry an toàn cho mỗi lần cập nhật trường hồ sơ và avatar trong cơ sở dữ liệu thành công.
- [x] Xác nhận việc tạo hồ sơ thiếu duy trì tính xác định và `status` tài khoản vẫn chỉ đọc trong DTO an toàn.
- [x] Thêm kiểm thử tập trung cho AC-FE03-012..014 mà không thay đổi hành vi FE03 không liên quan.

Traceability: BR-FE03-016..017, FR-FE03-001, FR-FE03-006, FR-FE03-010, AC-FE03-012..014

Bằng chứng: `.sdd/reviews/fe03-deterministic-profile-validation-2026-07-19.md`.

---

## Ghi chú triển khai

- Triển khai nhiệm vụ theo thứ tự.
- Không thêm dependency mới trừ khi các công cụ backend hiện có không thể đáp ứng nhiệm vụ.
- Không thay đổi schema cơ sở dữ liệu trong FE03 trừ khi cập nhật spec/RFC riêng được phê duyệt.
- Giữ công việc frontend trong phạm vi UI tải avatar đã phê duyệt và đối soát allowlist PUT tại T-FE03-014/T-FE03-016.

## Giai đoạn 1: Hội tụ

- [x] T017 Từ chối giá trị `fullName`, `address` và `phone` không phải chuỗi trước khi thay đổi hồ sơ theo BR-FE03-007 và NFR-FE03-SEC-004 (partial)
- [x] T018 Chuẩn hóa giá trị hồ sơ có thể so sánh để metadata audit chỉ chứa trường thực sự thay đổi theo BR-FE03-017 và FR-FE03-010 (partial)
- [x] T019 Hiển thị lỗi API hồ sơ/avatar đọc được ở cấp trường trên frontend theo NFR-FE03-UX-001 và NFR-FE03-UX-003 (partial)

Bằng chứng: kiểm thử backend FE03 tập trung vượt qua 53/53; kiểm thử backend đầy đủ vượt qua 1025/1025; kiểm thử frontend tập trung vượt qua 5/5; kiểm thử frontend đầy đủ vượt qua 218/218; lint/build frontend và traceability vượt qua ngày 2026-07-24.

## Giai đoạn 2: Hội tụ

- [x] T020 Xác thực request trường hồ sơ và avatar trước khi tự động tạo hồ sơ thiếu, để request không hợp lệ không thể thay đổi trạng thái hồ sơ theo BR-FE03-008, FR-FE03-005, FR-FE03-006 và FR-FE03-009 (contradicts)
- [x] T021 Xóa huy hiệu trạng thái thành viên FE04 và prop membership không dùng khỏi header hồ sơ FE03 theo ranh giới FE04 tại §10/§14 của SPEC (contradicts)

Bằng chứng: kiểm thử backend FE03 tập trung vượt qua 55/55; kiểm thử hồ sơ frontend vượt qua 6/6 và kiểm thử frontend đầy đủ vượt qua 219/219; lint/build frontend và traceability vượt qua ngày 2026-07-24. Kiểm tra FE03 bằng Playwright vượt qua 3/3 cho các luồng avatar hợp lệ, loại không được hỗ trợ và vượt kích thước. Lần chạy toàn bộ backend vượt qua 1025/1027; chỉ các trường hợp tách biệt mock của `dbConfig.test.js` tồn tại từ trước không liên quan thất bại do cố phân giải DNS cho `sql.example.test`.

## Giai đoạn 3: Hội tụ

- [x] T022 Cho phép origin frontend kết xuất tệp avatar được quản lý sau khi tải lên theo MF-FE03-003 và T-FE03-014 (partial)

Bằng chứng: kiểm thử hồi quy avatar static và kiểm thử backend FE03 tập trung vượt qua 47/47; kiểm thử frontend đầy đủ vượt qua 233/233; lint/build frontend và traceability FE03 vượt qua ngày 2026-07-28. Lần chạy toàn bộ backend chỉ còn lỗi phân giải DNS/mock của `dbConfig.test.js` tồn tại từ trước cho `sql.example.test`.

## Giai đoạn 4: Hội tụ

- [x] T023 Tải avatar đã chọn khi người dùng submit biểu mẫu chỉnh sửa hồ sơ theo MF-FE03-003 và T-FE03-014 (partial)

Bằng chứng: E2E lưu hồ sơ/avatar FE03 vượt qua 3/3; kiểm thử frontend tập trung vượt qua 6/6; lint/build frontend và traceability FE03 vượt qua ngày 2026-07-28. Lần chạy toàn bộ frontend còn 10 lỗi kỳ vọng không liên quan được đưa vào bởi baseline UI đã merge hiện tại.
