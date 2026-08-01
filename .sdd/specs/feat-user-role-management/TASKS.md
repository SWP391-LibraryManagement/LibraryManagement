# TASKS.md - FE11 Quản lý người dùng và vai trò

Trạng thái: ĐÃ TRIỂN KHAI - XÁC THỰC TỰ ĐỘNG CỤC BỘ HOÀN TẤT
Implementation State: PARTIAL

Ngày: 2026-07-28

Phần mở rộng hiện tại: FE11-AGB01 triển khai Q-FE11-029 bằng cách giới hạn thay
đổi Quản trị đối với người dùng hiện có vào thay vai trò và vô hiệu hóa đủ điều
kiện; chấp nhận trình duyệt đã xác thực và con người vẫn mở.

Phần mở rộng đồng thời: phạm vi sản phẩm/kiểm thử nguồn FE11-UXR09 được triển
khai qua API FE04 chuẩn; trình duyệt đáp ứng, Azure Staging và chấp nhận con
người vẫn mở.

Chủ sở hữu: Dung

## Nhiệm vụ thiết lập tài khoản

- [x] **FE11-S01 - Soạn hợp đồng thiết lập tài khoản liên tính năng.**
  - Ánh xạ tới: BR-FE11-005, BR-FE11-021..025; FR-FE11-003, 009, 036..038;
    AC-FE11-003, 006, 010, 020..022; ADR-005.
  - DoD: FE02, FE10, FE11, API, trạng thái, giao dịch, gửi, lỗi và ngữ nghĩa
    gửi lại dùng một hợp đồng xác định; tệp triển khai không đổi.

- [x] **FE11-S02 - Thêm kiểm thử RED tạo FE11.**
  - Tệp: `backend/tests/userManagementService.test.js`,
    `backend/tests/userManagementRoutes.test.js`, helper kiểm thử.
  - DoD: kiểm thử thất bại chứng minh tạo `INACTIVE`, hash bcrypt không thể dùng
    hợp lệ, rollback nguyên tử người dùng/hồ sơ/vai trò/mã thông báo/audit, không
    phản hồi thông tin xác thực và trạng thái gửi an toàn.
  - Bằng chứng: triển khai qua TDD trong `ff885b7`.

- [x] **FE11-S03 - Thêm kiểm thử RED ranh giới thiết lập tài khoản FE10.**
  - Tệp: `backend/tests/notificationRoutes.test.js`, helper thông báo.
  - DoD: kiểm thử thất bại chứng minh chỉ requester gắn FE11 chấp nhận
    `ACCOUNT_SETUP`, biến bắt buộc được ép, nguồn staff HTTP/không-phải-FE11 bị
    từ chối và không mã thông báo/liên kết/nội dung render nào được lưu hay trả.
  - Bằng chứng: triển khai qua TDD trong `547f986`.

- [x] **FE11-S04 - Triển khai tạo tài khoản không hoạt động có giao dịch và gửi FE10.**
  - Phụ thuộc: FE11-S02, FE11-S03.
  - Tệp: service/repository quản lý người dùng, service/cấu hình thông báo, hợp
    đồng mẫu/kiểu SQL.
  - DoD: trạng thái nguồn commit nguyên tử; gửi chạy sau commit; phản hồi báo
    `SENT`/`FAILED` an toàn; không còn placeholder theo nghĩa đen hoặc lộ thông
    tin xác thực.
  - Bằng chứng: ranh giới nhà cung cấp `3e25875`; tạo tài khoản có giao dịch
    `ff885b7`.

- [x] **FE11-S05 - Thêm kiểm thử RED hoàn tất thiết lập FE02 và triển khai kích hoạt nguyên tử.**
  - Ánh xạ tới: yêu cầu thiết lập tài khoản FE02 và ADR-005.
  - Tệp: `backend/tests/authRoutes.test.js`,
    `backend/src/services/authService.js`, repository auth/người dùng/mã thông
    báo/audit.
  - DoD: mã hợp lệ lưu mật khẩu nguyên tử, đánh dấu email đã xác minh/hoạt động,
    đánh dấu mã đã dùng và audit; mã hết hạn/đã dùng/đã thu hồi/đồng thời không
    thể kích hoạt hay cập nhật một phần.
  - Bằng chứng: triển khai qua TDD trong `57068d2`.

- [x] **FE11-S06 - Thêm kiểm thử RED gửi lại và triển khai gửi lại của Quản trị.**
  - Tệp: route/validator/service/repository quản lý người dùng và kiểm thử.
  - DoD: chỉ tài khoản chưa hoàn tất đủ điều kiện qua; mã hoạt động trước bị thu
    hồi; cooldown 60 giây được ép; mỗi lần gửi lại dùng ID/sự kiện/khóa mã mới;
    lỗi gửi vẫn an toàn/không chặn.
  - Bằng chứng: triển khai qua TDD trong `d80b8f2`; tiêu thụ liên kết thiết lập
    frontend thêm trong `fa63acc`.

- [x] **FE11-S07 - Qua cổng xác thực thiết lập tài khoản.**
  - Phụ thuộc: FE11-S02..S06.
  - DoD: kiểm thử tích hợp tập trung và bị ảnh hưởng đạt; truy vết, quét bí mật
    và `git diff --check` đạt; xác nhận review con người.
  - Trạng thái xác thực: ĐẠT ngày 2026-07-15.

- [x] **FE11-S08 - Chuẩn hóa hợp đồng đặc tả FE11 còn lại.**
  - Ánh xạ tới: BR-FE11-026..027; FR-FE11-002, FR-FE11-023; AC-FE11-002,
    AC-FE11-004, AC-FE11-016..019, AC-FE11-023; Q-FE11-017..018.
  - DoD: phản hồi danh sách/chi tiết/cập nhật dùng DTO an toàn rõ ràng, cập nhật
    cũ trả xác định `409 STALE_USER_STATE`, mọi AC truy vết được và không còn
    ánh xạ kiểm thử `TBD`.
  - Trạng thái review: tài liệu hoàn tất và Nhat xác nhận review con người ngày
    2026-07-17. Nhiệm vụ này không khởi động triển khai bị hoãn.

## Nhiệm vụ quản lý vai trò có giao dịch

- [x] **FE11-R01 - Xác thực ID yêu cầu thay đổi vai trò.**
  - Ánh xạ tới: NFR-FE11-SEC-004; FR-FE11-012..013, FR-FE11-024..026.
  - DoD: yêu cầu Quản trị đã xác thực nhận ID số nguyên dương chuẩn hóa; ID
    không hợp lệ trả `400 VALIDATION_ERROR` trước khi gọi service.
  - Bằng chứng: 25/25 kiểm thử route tập trung đạt sau lỗi RED quan sát được do
    thiếu validator và ID chuỗi.

- [x] **FE11-R02 - Thêm kiểm thử RED repository giao dịch.**
  - Ánh xạ tới: BR-FE11-007..010; FR-FE11-014, FR-FE11-017, FR-FE11-024..027;
    NFR-FE11-TXN-003/006.
  - DoD: kiểm thử thất bại bao phủ tra cứu tác nhân/mục tiêu/vai trò, ánh xạ
    trùng/thiếu, bảo vệ vai trò cuối, số lượng Quản trị bị khóa, audit nguyên tử
    và rollback.
  - Bằng chứng: RED quan sát được vì `userRoleRepository.js` chưa tồn tại; suite
    không thể resolve module bắt buộc.

- [x] **FE11-R03 - Triển khai thay đổi vai trò có giao dịch.**
  - Phụ thuộc: FE11-R02.
  - DoD: một giao dịch SQL có tham số trả kết quả xác định, dùng lock hint bắt
    buộc và commit hoặc rollback ánh xạ cùng audit.
  - Bằng chứng: 14/14 kiểm thử repository đạt, gồm ca lock-hint, tham số hóa,
    kết quả xác định và rollback audit.

- [x] **FE11-R04 - Ánh xạ kết quả repository qua service FE11.**
  - Phụ thuộc: FE11-R03.
  - DoD: kiểm thử RED-GREEN cấp service chứng minh ánh xạ status/code/message
    an toàn và đọc lại người dùng an toàn thành công không có audit thứ hai.
  - Bằng chứng: RED cho thấy đường `userRepository.findRoleById` cũ; 70/70 kiểm
    thử route/service/repository tập trung hiện đạt qua hợp đồng kết quả giao
    dịch.

- [x] **FE11-R05 - Qua cổng xác thực quản lý vai trò có giao dịch.**
  - Phụ thuộc: FE11-R01..R04.
  - DoD: kiểm thử backend tập trung/đầy đủ, truy vết, vệ sinh diff, review bảo
    mật, tài liệu, đối soát nợ và bằng chứng review con người hoàn tất.
  - Bằng chứng tự động: 70/70 kiểm thử tập trung; 399/399 backend đầy đủ;
    coverage repository 100% statement/line/function và 90.24% branch; cổng
    coverage dự án và truy vết đạt.
  - Trạng thái review: review triển khai con người phê duyệt ngày 2026-07-18.
  - Trạng thái tích hợp: PR #25 merge là `0e1ef8f`; lượt CI hậu merge
    `29631406399` đạt.

## Nhiệm vụ danh sách và chi tiết người dùng an toàn

- [x] **FE11-U01 - Ép hợp đồng danh sách người dùng chuẩn.**
  - Ánh xạ tới: FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-004, NFR-FE11-PERF-001.
  - DoD: giá trị bỏ dùng trang 1/giới hạn 20; giá trị cung cấp không hợp lệ bị
    từ chối; trạng thái/vai trò/tìm kiếm được chuẩn hóa; tìm kiếm chỉ dùng email,
    họ tên và ID người dùng; thứ tự giữ `CreatedAt DESC, UserId DESC`.
  - Bằng chứng: RED cho thấy thiếu validator route và service âm thầm ép ngưỡng;
    78/78 backend tập trung đạt với xác thực ưu tiên Quản trị và parse query
    chuẩn.

- [x] **FE11-U02 - Trả allowlist người dùng được quản lý an toàn rõ ràng.**
  - Ánh xạ tới: BR-FE11-026, FR-FE11-001, AC-FE11-001, NFR-FE11-SEC-006.
  - DoD: phản hồi danh sách/đọc lại dùng `phoneNumber`, vai trò chữ hoa xác
    định và không trường thông tin xác thực/mã thông báo/phiên/liên kết/bí mật
    audit.
  - Bằng chứng: kiểm thử repository cột thù địch và kiểm thử hợp đồng frontend
    đạt; suite frontend đầy đủ 77/77 với lint/build xanh.

- [x] **FE11-U03 - Thêm truy vấn tóm tắt liên quan chỉ-chi-tiết.**
  - Ánh xạ tới: FR-FE11-002, AC-FE11-002.
  - DoD: một truy vấn chi tiết có tham số trả số lượt mượn hoạt động, tổng tiền
    phạt chưa trả và số đặt chỗ mở với mặc định số không.
  - Bằng chứng: RED chứng minh phương thức repository chi tiết vắng mặt; kiểm
    thử repository hiện xác minh ba predicate, chuyển đổi số, mặc định số không
    và ranh giới đọc lại thay đổi không có tóm tắt.

- [x] **FE11-U04 - Trả lỗi xác thực chi tiết và không tìm thấy xác định.**
  - Ánh xạ tới: FR-FE11-015, FR-FE11-016, NFR-FE11-SEC-001/002/004.
  - DoD: phân quyền Quản trị trước xác thực; ID không hợp lệ trả
    `400 VALIDATION_ERROR`; ID hợp lệ không có trả `404 USER_NOT_FOUND`.
  - Bằng chứng: RED cho thấy ID route chuỗi và đường `400` cũ; 105/105 kiểm thử
    route/service/repository/vai trò tập trung đạt với đọc chi tiết chuyên dụng
    và `404 USER_NOT_FOUND`.

- [x] **FE11-U05 - Tiêu thụ hợp đồng danh sách/chi tiết an toàn trong UI Quản trị.**
  - Ánh xạ tới: AC-FE11-001, AC-FE11-002.
  - DoD: UI bỏ `ALL`/tìm kiếm rỗng, đọc `phoneNumber`, tìm nạp chi tiết khi chọn
    hàng, render tóm tắt và tải lại danh sách cũ sau chi tiết 404.
  - Bằng chứng: bốn lỗi RED frontend bao phủ luồng chi tiết thiếu; 81/81 kiểm
    thử frontend, lint và production build hiện đạt với tìm nạp chi tiết được ủy
    quyền và phục hồi hàng cũ.

- [x] **FE11-U06 - Qua cổng xác thực danh sách/chi tiết an toàn.**
  - Phụ thuộc: FE11-U01..U05.
  - DoD: kiểm thử tập trung/đầy đủ, coverage, lint/build frontend, truy vết, vệ
    sinh diff, review bảo mật, đối soát nợ, bản ghi xác thực và bằng chứng review
    con người hoàn tất.
  - Bằng chứng tự động: 105/105 backend tập trung; 434/434 backend đầy đủ;
    92.47% statement và 82.35% branch; 81/81 frontend; lint, build, truy vết,
    quét bảo mật và kiểm tra diff đạt.
  - Trạng thái review: review triển khai con người phê duyệt ngày 2026-07-18.
  - Trạng thái tích hợp: PR #27 merge là `ed6bd717`; lượt CI hậu merge
    `29639933730` đạt.

## Đối soát ngữ cảnh và trôi lệch

- [x] **FE11-C01 - Audit trôi ngữ cảnh Admin Console FE11 tại một mốc cố định.**
  - Mốc cố định: base `66642b5`; target `origin/main@8da84bd`.
  - Phạm vi: chỉ FE11/User Management/Admin Console/Audit Logs.
  - DoD: chạy review Standards và Spec riêng; phân loại bằng chứng B7 hữu hạn
    so với hành vi hoãn/không phù hợp; đối soát bộ nhớ dự án, bản ghi API/kiểm
    thử và nợ kỹ thuật mà không thay đổi hành vi sản phẩm hay yêu cầu đã phê
    duyệt.
  - Bằng chứng:
    `.sdd/reviews/fe11-admin-console-context-drift-audit-2026-07-18.md`.
  - Kết quả: đối soát tài liệu hoàn tất; không lát cắt triển khai Admin Console
    nào được phê duyệt hoặc mở lại bởi nhiệm vụ này.
  - Trạng thái review: review con người xác nhận ngày 2026-07-18; `FE11-C01` đã
    đóng.

## Nhiệm vụ hợp đồng UI vai trò Quản trị

- [x] **FE11-UIR01 - Gửi ID vai trò số từ adapter API frontend.**
  - Ánh xạ tới: FR-FE11-012..013; AC-FE11-013..014; FE11 API §11.
  - Hợp đồng bị thay thế: `PUT /users/{userId}/role` gửi một `{ roleId }` số;
    endpoint gán/thu hồi độc lập bị loại.
  - Bằng chứng: RED thất bại ở body/path `roleName` legacy; GREEN qua 6/6 kiểm
    thử API tập trung với helper `roleId` số.

- [x] **FE11-UIR02 - Xác thực và tiêu thụ danh mục vai trò chuẩn.**
  - Ánh xạ tới: PRE-FE11-004; NFR-FE11-SEC-004; TD-022.
  - Phụ thuộc: FE11-UIR01.
  - DoD: chỉ ID dương cho ADMIN/LIBRARIAN/MEMBER kích hoạt modal; dữ liệu danh
    mục không hợp lệ/thiếu không gửi thay đổi và không có fallback mã hóa cứng.
  - Bằng chứng: RED thất bại 2 kiểm thử hợp đồng danh mục trước khi xác thực/kế
    hoạch tồn tại; GREEN qua 4/4 frontend tập trung và ESLint sạch.

- [x] **FE11-UIR03 - Thực thi diff vai trò xác định và lưu no-op.**
  - Ánh xạ tới: BR-FE11-007..009; FR-FE11-012..014, FR-FE11-027;
    AC-FE11-013..015.
  - Phụ thuộc: FE11-UIR02.
  - Hợp đồng bị thay thế: một lựa chọn radio tạo nhiều nhất một yêu cầu thay thế
    nguyên tử; lưu vai trò hiện tại không gửi thay đổi.

- [x] **FE11-UIR04 - Đối soát lỗi một phần với trạng thái máy chủ.**
  - Ánh xạ tới: BR-FE11-010; FR-FE11-024..027; NFR-FE11-UX-001.
  - Phụ thuộc: FE11-UIR03.
  - DoD: thay đổi thất bại đầu tiên dừng chuỗi; chi tiết mục tiêu được tải lại
    vào modal mở; đối soát thất bại vô hiệu Lưu và không báo thành công.
  - Bằng chứng: RED thiếu tải lại lỗi thay đổi và đồng bộ modal; GREEN qua 6/6
    kiểm thử UI tập trung với tải lại chuẩn, hiển thị lỗi cục bộ và khóa Lưu sau
    lỗi đối soát.

- [x] **FE11-UIR05 - Qua cổng xác thực và tích hợp UI vai trò Quản trị.**
  - Phụ thuộc: FE11-UIR01..UIR04.
  - DoD: frontend tập trung/đầy đủ, lint/build, hồi quy vai trò backend tập
    trung, truy vết, review diff/bảo mật, tài liệu, review con người, merge và
    bằng chứng CI hậu merge hoàn tất.
  - Bằng chứng tự động: 12/12 frontend tập trung; 101/101 frontend đầy đủ; 3
    suite và 105/105 kiểm thử vai trò backend tập trung; lint, build, truy vết,
    diff, phạm vi và bảo mật ĐẠT.
  - Trạng thái review: review triển khai con người phê duyệt ngày 2026-07-18.
  - Trạng thái tích hợp: PR #30 merge là `c20d3251`; CI PR `29643619999` và CI
    `main` hậu merge `29644292781` đạt.

## Nhiệm vụ Fast-Track Batch 1

- [x] **FE11-FT01 - Phê duyệt và kích hoạt governance Batch 1.**
  - Phạm vi: TD-024, TD-026, TD-027.
  - Bằng chứng: `.sdd/reviews/fe11-fast-track-batch-1-h1-2026-07-18.md` và PR
    kích hoạt governance đã merge.

- [x] **FE11-AUD01 - Triển khai ranh giới Nhật ký kiểm toán Quản trị chuẩn.**
  - Ánh xạ tới: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018; TD-024.
  - DoD: tên query SPEC, xác thực ưu tiên Quản trị, phép chiếu default-deny nhận
    biết thao tác liên tính năng, phân trang SQL đã lọc ổn định, di chuyển
    frontend, `404 NOT_FOUND` legacy, bằng chứng L1-L4.
  - Trạng thái tích hợp: PR #33 merge là `3c88e432`; lượt CI hậu merge
    `29651173195` đạt.

- [x] **FE11-ENV01 - Khôi phục vỏ danh sách người dùng chuẩn dùng thống kê FE12.**
  - Ánh xạ tới: FR-FE11-001; AC-FE11-001; TD-026.
  - DoD: `/api/users` chỉ trả `data` và `pagination`; bộ đếm Quản trị ánh xạ từ
    `/api/reports/users`; số toàn cục độc lập với hàng trang.
  - Trạng thái tích hợp: PR #34 merge là `411fa25a`; lượt CI hậu merge
    `29652243809` đạt.

- [x] **FE11-META01 - Đối soát siêu dữ liệu bằng chứng FE11 hoàn tất.**
  - Ánh xạ tới: TD-027.
  - Phụ thuộc: TD-026 merge và cửa sổ writer `SPEC.md` nối tiếp của Integration
    Lead.
  - DoD: chỉ ô Test Case/Status hiện có đã phê duyệt thay đổi; yêu cầu và hàng
    hoãn không đổi; H2, kiểm tra, H3, merge và bằng chứng tích hợp đạt.
  - Trạng thái tích hợp: PR #35 merge là `c286cd9b`; lượt CI hậu merge
    `29652617587` đạt.

## Nhiệm vụ điều hướng và quyền Quản trị

- [x] **FE11-PERM01 - Kích hoạt hợp đồng TD-023 đã phê duyệt.**
  - Ánh xạ tới: TD-023; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: PLAN/TASKS/TEST_PLAN/CHANGELOG và trạng thái nợ nêu phạm vi hữu hạn;
    toàn FE11 vẫn hoãn.
  - Bằng chứng: artifact governance nêu lát cắt hữu hạn, `TD-023` là
    `IN PROGRESS`, `TD-025` vẫn mở và toàn FE11 vẫn hoãn.

- [x] **FE11-PERM02 - Thêm policy quyền chuẩn và DTO service mới.**
  - Ánh xạ tới: FR-FE11-032; BR-FE11-017; AC-FE11-017.
  - DoD: backend sở hữu đúng 3 vai trò và 15 quyền; mọi lệnh gọi trả đối tượng
    allowlist độc lập với thứ tự ổn định.
  - Bằng chứng: service RED thất bại vì `getPermissions` vắng mặt; GREEN cùng
    hồi quy Audit Service qua 132/132 kiểm thử.

- [x] **FE11-PERM03 - Cung cấp GET /api/admin/permissions chỉ Quản trị.**
  - Ánh xạ tới: BR-FE11-001/011/012/017; FR-FE11-015/032; AC-FE11-017;
    NFR-FE11-SEC-001/002.
  - DoD: xác thực và phân quyền Quản trị chạy trước gọi controller; Quản trị
    nhận chính xác `{ roles, permissions }`.
  - Bằng chứng: route RED trả 404 cho cả bốn ca; GREEN hồi quy bảo mật tập trung
    qua 28/28 kiểm thử với 401/403 trước dùng controller.

- [x] **FE11-PERM04 - Căn chỉnh điều hướng Quản trị và tiêu thụ API quyền.**
  - Ánh xạ tới: BR-FE11-016/017; FR-FE11-030/032; AC-FE11-016/017.
  - DoD: sidebar có đúng tám mục đã phê duyệt; Permissions có thể truy cập;
    Membership không đổi ngoài sidebar; không còn hằng ma trận frontend.
  - Bằng chứng: frontend RED tập trung cho thấy thiếu adapter/sidebar và ma trận
    mã hóa cứng; GREEN chứng minh điều hướng đúng tám mục và adapter chuẩn.

- [x] **FE11-PERM05 - Kết hợp quyền FE11 với số lượng FE12 độc lập.**
  - Ánh xạ tới: FR-FE11-032; AC-FE11-017; quyết định quyền sở hữu TD-026.
  - DoD: thẻ vai trò dùng `usersByRole` FE12; coverage/ô suy ra từ
    `allowedRoles` FE11; lỗi độc lập giữ lần thành công gần nhất và hiện điều
    khiển thử lại.
  - Bằng chứng: helper RED thất bại 3/3 assertion kỳ vọng; GREEN frontend tập
    trung qua 38/38, frontend đầy đủ qua 120/120, lint/build đạt.

- [x] **FE11-PERM06 - Qua H2/H3/B7 và đóng TD-023.**
  - Phụ thuộc: FE11-PERM01..FE11-PERM05.
  - DoD: bằng chứng L1-L4, review con người, merge PR triển khai, CI main hậu
    merge, PR closeout và CI main cuối được ghi; TD-023 được giải quyết còn
    TD-025 và toàn FE11 hoãn.
  - Trạng thái tích hợp: H2/H3 phê duyệt ngày 2026-07-19; PR #37 qua CI
    `29654621448`, merge là `356130e4` và CI `main` hậu merge `29655548150`
    đạt. Closeout chỉ tài liệu này công bố bản ghi B7; merge và CI cuối được báo
    trong bàn giao cuối.

## Nhiệm vụ Batch hoàn tất FE11

- [x] **FE11-FIN01 - Phê duyệt và kích hoạt Batch hoàn tất FE11.**
  - Ánh xạ tới: TD-012, TD-014, TD-015, TD-016, TD-017, TD-025.
  - DoD: design/plan đã phê duyệt, hợp đồng Core đồng bộ, quyền sở hữu hai wave,
    lệnh xác thực và kích hoạt nợ được merge trước công việc sản phẩm.
  - Bằng chứng: PR #39 qua `foundation-checks` `29658802446`, merge là
    `62ac2d1` và CI `main` hậu merge chính xác `29658912068` đạt.

- [x] **FE11-LIFE01 - Thêm migration schema lũy đẳng và hợp đồng đồng bộ.**
  - Ánh xạ tới: TD-012, TD-016; FR-FE11-010/021; phụ thuộc schema dùng chung
    FE02/FE03/FE10.
  - DoD: năm cột mục tiêu, tính duy nhất email xác định, model, binding,
    baseline, kiểm thử tĩnh và bằng chứng live-twice tùy chọn đồng nhất.
  - Bằng chứng: migration lũy đẳng, đồng bộ baseline/model/binding, kiểm thử
    schema tĩnh và hai lượt SQL Server disposable thành công được ghi trong bản
    xác thực Wave A và full-reconciliation.

- [x] **FE11-LIFE02 - Lưu và trả trường Thủ thư an toàn.**
  - Ánh xạ tới: BR-FE11-015/024..026; FR-FE11-003/005/009/010/017/028;
    AC-FE11-005/011; TD-012/014.
  - DoD: tạo/đọc/cập nhật dùng trường nullable tối đa 100 ký tự chỉ cho mục tiêu
    Thủ thư hiện tại; tạo/gửi lại kiểm tra lại Quản trị hoạt động theo giao dịch;
    xung đột tạo trùng an toàn và xác định.
  - Bằng chứng: ca RED-GREEN repository thiết lập tài khoản, DTO an toàn,
    service, route và trùng/tác nhân được ghi trong bản xác thực Wave A.

- [x] **FE11-LIFE03 - Triển khai cập nhật người dùng được quản lý optimistic và no-op.**
  - Ánh xạ tới: BR-FE11-004/010/014/027; FR-FE11-004/007/020/021/023;
    AC-FE11-004/008/023; TD-014/015/016.
  - DoD: khóa tác nhân/mục tiêu, phiên bản hiệu dụng, ánh xạ trùng, hành vi
    no-op, allowlist audit an toàn và rollback được chứng minh.
  - Bằng chứng: kiểm thử repository/service/route vòng đời chứng minh kết quả
    khóa, cập nhật stale/no-op/hiệu dụng, siêu dữ liệu audit an toàn và rollback.
  - Thay thế: Q-FE11-027 làm mất hiệu lực phần cập nhật cá nhân/email rộng của
    bằng chứng lịch sử này; chỉ hành vi concurrency/no-op trường công việc Thủ
    thư được giữ trong FE11-PDO02..PDO04.

- [x] **FE11-LIFE04 - Triển khai vô hiệu hóa nguyên tử và vô hiệu thông tin xác thực.**
  - Ánh xạ tới: BR-FE11-003/006/010/015/027; FR-FE11-008/011/016..019/023;
    AC-FE11-007/009/012/023; TD-014/015/016.
  - DoD: guard chế độ vòng đời, chặn lượt mượn hoạt động, thu hồi REFRESH,
    audit, rollback và tuần tự phê duyệt FE07 được chứng minh.
  - Bằng chứng: kiểm thử repository vòng đời/mượn và suite race SQL live chứng
    minh kết quả tuần tự cho phép; trạng thái bất khả thi
    thành viên-không-hoạt-động/yêu-cầu-vừa-duyệt không commit.

- [x] **FE11-LIFE05 - Căn chỉnh UI Quản trị và loại quyền truy cập Quản trị phát triển ngầm.**
  - Ánh xạ tới: NFR-FE11-SEC-001/002/004; AC-FE11-004/007/011/012/023; TD-017.
  - DoD: mọi chế độ yêu cầu trạng thái Quản trị đã xác thực được lưu; cập nhật/vô
    hiệu hóa gửi phiên bản hiệu dụng và tải lại trạng thái chuẩn.
  - Bằng chứng: kiểm thử API/trang frontend, hồi quy frontend đầy đủ, lint/build
    và hồi quy trình duyệt được ghi trong bản xác thực Wave A.

- [x] **FE11-LIFE06 - Qua tích hợp Wave A H2/H3/B7.**
  - Phụ thuộc: FE11-LIFE01..FE11-LIFE05.
  - Bằng chứng: review H2/H3 PR #40, merge `1555111`, CI hậu merge
    `29685953839` và bằng chứng Live SQL/trình duyệt trong gói full
    reconciliation.

- [x] **FE11-REQ01 - Chuẩn hóa đọc danh sách và chi tiết yêu cầu Quản trị.**
  - Ánh xạ tới: BR-FE11-019/026; FR-FE11-034; AC-FE11-019; TD-025.
  - Bằng chứng: kiểm thử route/service/repository chuẩn ưu tiên Quản trị đạt;
    chấp nhận trình duyệt chứng minh phân trang máy chủ và chi tiết chuẩn đối
    với trạng thái FE07 dùng chung.

- [x] **FE11-REQ02 - Căn chỉnh phân trang, chi tiết, thao tác và UI DOCX yêu cầu.**
  - Ánh xạ tới: FR-FE11-034/035; AC-FE11-019; TD-025.
  - Bằng chứng: kiểm thử hợp đồng frontend và `E2E-FE11-ACC01` chứng minh dữ
    liệu máy chủ hai trang, DOCX frozen-filter trên mọi 21 hàng khớp và điều
    khiển chi tiết theo trạng thái.

- [x] **FE11-REQ03 - Chứng minh bất biến trạng thái kết thúc FE07.**
  - Ánh xạ tới: BR-FE11-019; FR-FE11-035; bất biến vòng đời yêu cầu FE07; TD-025.
  - Bằng chứng: kiểm thử backend tập trung và chấp nhận trình duyệt chứng minh
    chi tiết đã hoàn tất chỉ đọc và lần thử duyệt/từ chối FE07 trực tiếp đều trả
    `409 BORROW_REQUEST_NOT_PENDING`.

- [x] **FE11-ACC01 - Qua chấp nhận trình duyệt FE11 và tích hợp Wave B.**
  - Phụ thuộc: FE11-REQ01..FE11-REQ03.
  - Bao gồm: bao phủ Dashboard Quản trị chỉ-bằng-chứng cho FR-FE11-031 mà không
    thiết kế lại quyền sở hữu FE12.
  - Bằng chứng: PR #40 merge là `1555111`; CI PR cuối `29685838610` và CI
    `main` hậu merge chính xác `29685953839` đạt; walkthrough con người
    FE01-FE12 và H3 được phê duyệt.

- [x] **FE11-FIN02 - Công bố closeout B7 FE11 cuối.**
  - Phụ thuộc: FE11-LIFE06, FE11-ACC01.
  - Bằng chứng: hoàn tất FE11 được bao gồm trong walkthrough H3 FE01-FE12 đã
    phê duyệt và closeout full reconciliation.
  - DoD: cả bốn PR và lượt CI main chính xác được ghi; FE11 hoàn tất qua B7 và
    không tồn dư SQL hay trình duyệt dưới TD-021.

- [x] **FE11-CLOSE01 - Đối soát hợp đồng trình bày Nhật ký kiểm toán Quản trị cuối.**
  - Ánh xạ tới: BR-FE11-018, BR-FE11-026; FR-FE11-033; AC-FE11-018.
  - DoD: UI Quản trị hiển thị đầu vào lọc `q`, `action`, `actorId`, `from` và
    `to` chuẩn; bằng chứng hồi quy RED-GREEN cấp nguồn tồn tại; API, schema,
    phân quyền, phân trang và che dữ liệu không đổi.
  - Bằng chứng: `frontend/test/userManagementFrontend.test.js`,
    `frontend/src/page/UserManagement.jsx` và
    `.sdd/reviews/final-governance-closeout-validation-2026-07-20.md`.
  - Trạng thái review: checkpoint lịch sử trước tích hợp. PR #54 và `v1.0.2`
    hoàn tất; PR #59 merge các commit đã review H3 `962ceb1` và `daaeea6` thành
    `eed2688`. Mọi `v1.0.3` tương lai vẫn là quyết định phát hành current-main
    riêng.

- [x] **FE11-UIA01 - Đơn giản hóa toolbar lọc Nhật ký kiểm toán Quản trị.**
  - Ánh xạ tới: BR-FE11-018, FR-FE11-033, AC-FE11-018.
  - Tệp: `frontend/src/page/UserManagement.jsx`,
    `frontend/test/userManagementFrontend.test.js`, `SPEC.md`, `CHANGELOG.md`.
  - DoD: loại đầu vào `action` và `actorId` hiển thị, giữ bộ lọc văn bản/ngày
    và hợp đồng query backend không đổi, và qua kiểm thử hồi quy frontend tập
    trung.

- [x] **FE11-UIN01 - Loại Permissions khỏi sidebar Quản trị.**
  - Ánh xạ tới: BR-FE11-016, FR-FE11-030, AC-FE11-016.
  - Tệp: `frontend/src/page/UserManagement.jsx`, kiểm thử frontend bị ảnh hưởng,
    `SPEC.md`, `CHANGELOG.md`.
  - DoD lịch sử: sidebar hiển thị bảy mục không có `Permissions`; FE11-UXR09 chỉ
    thay số hiện tại thành tám bằng cách thêm FE04 Membership Review, còn API
    quyền và hành vi phân quyền không đổi.

## Công việc FE11 bị hoãn

Phạm vi hoàn tất FE11 Giai đoạn 2 đã phê duyệt hoàn tất qua B7. Các cải tiến
tương lai vẫn ngoài phạm vi phát hành đã phê duyệt được hoãn rõ ràng; prototype
lịch sử không được dùng làm bằng chứng hoàn tất.

## Nhiệm vụ tái cấu trúc frontend toàn bộ Admin Console

- [x] **FE11-UXR01 - Thêm hợp đồng trình bày thuần cho điều hướng, dashboard, quyền và audit.**
  - Bằng chứng: kiểm thử helper RED-GREEN thuần bao phủ thứ tự điều hướng, chọn
    biểu đồ, quyết định quyền rõ ràng và trình bày audit an toàn bản địa hóa.
- [x] **FE11-UXR02 - Xây shell Quản trị đáp ứng và primitive trình bày dùng chung.**
  - Bằng chứng: shell được bảo vệ, điều hướng di động có thể truy cập, điều
    khiển có nhãn, focus visibility và hợp đồng reduced-motion qua xác thực
    frontend tập trung và đầy đủ.
- [x] **FE11-UXR03 - Di chuyển Dashboard và Quản lý người dùng với parity desktop/mobile.**
  - Bằng chứng: luồng vòng đời/vai trò/chi tiết người dùng và dashboard dựa API
    qua hợp đồng nguồn; Playwright chứng minh bảng desktop/thẻ mobile và không
    tràn trang.
- [x] **FE11-UXR04 - Di chuyển Requests, Permissions và Audit mà không đổi quyền sở hữu API.**
  - Bằng chứng: thay đổi yêu cầu FE07, đọc quyền/audit FE11, số vai trò FE12,
    phép chiếu audit an toàn, phân trang, thao tác kết thúc và xuất DOCX qua
    kiểm thử tập trung/đầy đủ.
- [x] **FE11-UXR05 - Di chuyển Library/Circulation và loại mã Admin membership/payment không thể tới.**
  - Bằng chứng: thay đổi sách FE05 giữ chuẩn ngoài Admin; circulation giữ quyền
    sở hữu trả/gia hạn FE07; source guard chứng minh không đường Admin FE04/FE09
    ẩn.
- [x] **FE11-UXR06 - Chuyển `/admin/users` và qua xác thực tự động tập trung/đầy đủ.**
  - Bằng chứng: entry legacy là compatibility export một dòng chính xác;
    frontend 191/191, backend 926/926, system 10/10, deployment 8/8, trace FE11
    95%, lint/build và E2E trình duyệt 4/4 đạt.
- [ ] **FE11-UXR07 - Qua chấp nhận Azure Staging desktop/mobile đã xác thực và công bố bằng chứng xác thực.**
  - Bằng chứng tự động: workflow staging `29871576856` triển khai `903a1a2`;
    kiểm tra backend, frontend, smoke, health và direct SPA route đạt.
  - Kết quả review: review con người đã xác thực ngày 2026-07-22 phát hiện ba
    sửa trình bày; chấp nhận vẫn mở đến khi FE11-UXR08 triển khai và review.
- [ ] **FE11-UXR08 - Sửa điều hướng Quản trị đã xác thực, độ đáp ứng Quản lý người dùng và mật độ Audit.**
  - Ánh xạ tới: BR-FE11-016, BR-FE11-017..018; FR-FE11-030/032/033;
    AC-FE11-016..018; Q-FE11-011.
  - DoD: sidebar hiển thị bảy mục không Permissions trong khi Manage Roles vẫn
    ở User Management; bảng người dùng đổi sang thẻ trước cuộn ngang; Audit giữ
    `q`, `action`, `actorId`, `from` và `to` chuẩn, trình bày lựa chọn action
    đã ánh xạ bằng tiếng Việt và tiết lộ chi tiết an toàn từng hàng mà không đổi
    API/hành vi che dữ liệu.
  - Mục tiêu bằng chứng: kiểm thử nguồn RED-GREEN tập trung, frontend đầy đủ/
    lint/build, ảnh chụp trình duyệt đáp ứng tại 1280/1366/1440/390 và review
    con người Azure Staging được làm mới.
  - Bằng chứng: commit triển khai `157b59b`; frontend 192/192, lint, build,
    trace FE11 95%, Chromium tập trung 1/1 và ảnh chụp đáp ứng đã xác thực đạt.
    Workflow staging `29873466035` triển khai `8627508` với backend/frontend/
    smoke thành công; phê duyệt con người đã xác thực làm mới vẫn chờ.
  - Thay thế: FE11-UXR09 chỉ đổi số sidebar cuối hiện tại từ bảy thành tám bằng
    cách thêm FE04 Membership Review; mọi sửa UXR08 về Quản lý người dùng, Audit
    và loại Permissions vẫn bắt buộc.

## 2026-07-22 Batch sửa

- [x] Loại thao tác sửa thông tin người dùng khỏi UI danh sách và chi tiết.
- [x] Loại cột chi tiết an toàn Audit trong khi giữ phép chiếu máy chủ an toàn.
- [x] Chứa bảng người dùng/audit rộng trong khu vực nội dung Quản trị.
- [x] Giữ Permissions vắng mặt khỏi sidebar Quản trị đã phê duyệt.
- [ ] **FE11-UXR09 - Tích hợp Rà soát tư cách thành viên FE04 vào Admin Console.**
  - Ánh xạ tới: BR-FE11-016, FR-FE11-030, AC-FE11-016; FR-FE04-014, AC-FE04-013.
  - Phụ thuộc: FE04-ADM01..FE04-ADM05.
  - DoD: sidebar đúng tám mục với Membership Review sau All Users và không
    Permissions; module FE04 nhúng theo native Admin qua kiểm thử nguồn, trình
    duyệt đáp ứng, Azure Staging và review con người rõ ràng mà không đổi quyền
    sở hữu API/nghiệp vụ FE04.
  - Bằng chứng: kết hợp sản phẩm và hợp đồng nguồn đạt trong suite frontend
    215/215 ngày 2026-07-23; trình duyệt đáp ứng, Azure Staging và review con
    người rõ ràng vẫn chờ.

## Nhiệm vụ sửa quyền sở hữu dữ liệu cá nhân

- [x] **FE11-PDO01 - Đối soát hợp đồng quyền sở hữu dữ liệu cá nhân đã phê duyệt.**
  - Ánh xạ tới: BR-FE11-014/015/026/027; FR-FE11-004/007/010/020/021/023;
    AC-FE11-004/008/011/023; Q-FE11-027.
  - DoD: SPEC, CONTEXT, PLAN, TASKS, TEST_PLAN và CHANGELOG thống nhất FE03 sở
    hữu `fullName`/`phone`/`address` người dùng hiện có, FE02 sở hữu mọi thay
    đổi email đã xác minh tương lai và FE11 chỉ sở hữu cập nhật
    `department`/`specialization` của Thủ thư hiện tại.
  - Bằng chứng: thay đổi chỉ tài liệu ngày 2026-07-22; không khẳng định hành vi
    sản phẩm.

- [x] **FE11-PDO02 - Thêm kiểm thử RED ranh giới quyền sở hữu backend.**
  - Tệp: `backend/tests/userManagementRoutes.test.js`,
    `backend/tests/userManagementService.test.js`,
    `backend/tests/userRepository.test.js`.
  - Ca: từng trường cá nhân, email không đổi, payload trộn được phép/bị cấm,
    trường không rõ, mục tiêu không phải Thủ thư, cập nhật công việc Thủ thư được
    phép, stale state, no-op, rollback và allowlist audit thành công.
  - DoD: kiểm thử chứng minh đường cập nhật rộng hiện tại vi phạm hợp đồng đã
    sửa trước khi thay đổi triển khai.
  - Bằng chứng: bao phủ ranh giới quyền sở hữu route/service/repository được giữ
    trong lượt backend đầy đủ 952/952 ngày 2026-07-23.

- [x] **FE11-PDO03 - Ép hợp đồng cập nhật backend chỉ-trường-công-việc.**
  - Tệp: `backend/src/validators/userManagementValidators.js`,
    `backend/src/services/userManagementService.js`,
    `backend/src/repositories/userRepository.js`,
    `backend/src/docs/openapi.yaml`, `docs/api/api-contract.md`.
  - DoD: `PUT /api/users/{userId}` chỉ chấp nhận phiên bản hiệu dụng cộng trường
    công việc Thủ thư hiện tại; yêu cầu cấm/trộn trả nguyên tử
    `403 PERSONAL_PROFILE_ADMIN_FORBIDDEN`; không cột cá nhân hay audit thành
    công đổi.
  - Xác thực: kiểm thử route/service/repository tập trung đạt, sau đó backend
    đầy đủ, coverage, parse OpenAPI và kiểm tra hồi quy FE02/FE03.
  - Bằng chứng: thay đổi validator/service/repository/OpenAPI/hợp đồng API qua
    suite FE11/FE02/FE03 tập trung và suite backend đầy đủ 952/952 ngày
    2026-07-23.

- [ ] **FE11-PDO04 - Căn chỉnh UI Quản trị và đóng ranh giới chấp nhận đã sửa.**
  - Tệp: `frontend/src/page/admin/users/AdminUsersSection.jsx`,
    `frontend/src/page/admin/users/UserEditorModal.jsx`,
    `frontend/src/page/admin/users/userPresentation.js`,
    `frontend/src/api/userManagementApi.js`,
    `frontend/test/userManagementApi.test.js`,
    `frontend/test/userManagementFrontend.test.js`.
  - DoD: trường cá nhân chỉ đọc với người dùng hiện có; chỉ Thủ thư hiện tại
    hiển thị sửa department/specialization; yêu cầu cập nhật không chứa trường cá
    nhân; lần thử backend trực tiếp vẫn bị từ chối.
  - Xác thực: kiểm thử frontend RED-GREEN tập trung, frontend đầy đủ/lint/build,
    E2E trình duyệt liên quan, `npm.cmd run trace:enforce`, `git diff --check`
    và review Quản trị con người đã xác thực đạt trước khi phạm vi FE11 đã sửa
    được đánh dấu hoàn tất.
  - Bằng chứng: kiểm thử sản phẩm/nguồn, frontend đầy đủ 215/215, lint,
    production build, truy vết FE11 100% và vệ sinh diff đạt ngày 2026-07-23;
    E2E trình duyệt đã xác thực và review con người vẫn phải đóng nhiệm vụ này.

- [x] Loại mọi điều khiển tìm kiếm/lọc Audit trong khi giữ phân trang chỉ đọc,
  phân quyền và che dữ liệu.
- [x] Xây lại shell Quản trị từ `app-shell`, header, sidebar, brand và primitive
  điều hướng đáp ứng dùng chung của Member/Librarian.
- [x] Giữ thao tác quản lý sách trong Admin Library bằng cách nhúng workspace
  FE05 chuẩn thay vì chuyển tới `/librarian/books`.
- [x] Xác minh bộ lọc tìm kiếm/trạng thái Admin Library đi tới query backend và
  thêm bao phủ hồi quy frontend/backend.
- [x] Căn chỉnh chấp nhận trình duyệt FE11 với selector sidebar dùng chung và
  trình bày Activity Log chỉ đọc, không bộ lọc.

- [x] **FE11-PDO05 - Thay trường công việc Thủ thư bằng sửa hồ sơ được quản lý dùng chung.**
  - Ánh xạ tới: Q-FE11-028; BR-FE11-014/015/027;
    FR-FE11-004/007/010/020/023/028.
  - DoD: Quản trị sửa `fullName`, `phone` và `address` cho mọi vai trò được
    quản lý; email giữ chỉ đọc; department/specialization và thông báo lỗi thời
    vắng khỏi UI; FE03 và FE11 dùng chung persistence và concurrency chuẩn.
  - Xác thực: hợp đồng frontend/backend tập trung đạt ngày 2026-07-25; hồi quy
    đầy đủ và chấp nhận trình duyệt/con người được ghi riêng.

- [x] **FE11-RBP01 - Kết nối vai trò tài khoản đơn xuyên các audience tính năng.**
  - Ánh xạ tới: BR-FE11-028; FR-FE07-032, FR-FE08-030.
  - Xem ánh xạ `ADMIN`, `LIBRARIAN` hoặc `MEMBER` duy nhất của tài khoản là
    audience liên tính năng hiệu dụng.
  - Kết nối thao tác Homepage, điều hướng App, guard route member trực tiếp và
    phân quyền FE07/FE08 backend với cùng vai trò đó.
  - Giữ route vận hành staff FE07/FE08 và chỉ cho tự phục vụ member với
    `MEMBER`.

- [x] **FE11-SR01 - Ép đúng một vai trò mỗi tài khoản.**
  - Ánh xạ tới: BR-FE11-007..009/028; FR-FE11-012..014/024..027;
    AC-FE11-013..015; ADR-002.
  - Thay gán/thu hồi bằng một giao dịch thay vai trò có khóa và audit; bảo vệ
    Quản trị hoạt động cuối.
  - Thêm `UX_UserRoles_UserId` vào baseline và migration fail-safe lũy đẳng cho
    môi trường hiện có.
  - Thay checkbox Quản trị bằng một lựa chọn radio và giữ mảng tương thích
    `roles` đúng một mục.
  - Xác thực: kiểm thử backend/frontend tập trung, hồi quy đầy đủ, lint/build,
    truy vết, kiểm tra schema tĩnh và review con người.

- [x] **FE11-SR02 - Củng cố xác thực thay vai trò và hội tụ phiên.**
  - Ánh xạ tới: BR-FE11-008/028; FR-FE11-012/013/015; AC-FE11-013.
  - Chấp nhận chính xác `{ roleId: positive integer }`, từ chối trường không
    rõ/thiếu và xác thực vai trò danh mục đã chọn trong modal Quản trị.
  - Thu hồi refresh/session credential hoạt động của tài khoản mục tiêu trong
    cùng giao dịch thay vai trò duy nhất và audit để mọi tính năng kết nối lại
    qua FE02 với vai trò mới.
  - Áp dụng và xác minh `UX_UserRoles_UserId` trên cơ sở dữ liệu đã cấu hình;
    chạy kiểm thử backend/frontend tập trung, hồi quy đầy đủ, lint/build, truy
    vết và review con người.

- [x] **FE11-SR03 - Kết nối sửa người dùng được quản lý với thay vai trò.**
  - Ánh xạ tới: MF-FE11-009; FR-FE11-012/013; AC-FE11-013.
  - Hiển thị vai trò duy nhất hiện tại trong hộp thoại sửa người dùng được quản
    lý và cung cấp thao tác `Đổi vai trò` rõ ràng mở hộp thoại thay vai trò
    chuẩn dùng radio.
  - Giữ sửa hồ sơ và thay vai trò nguyên tử là lệnh riêng để không ngụ ý giao
    dịch liên-lệnh một phần.

- [~] **FE11-REQ04 - Đối soát quyết định Quản trị với claim bản sao đang chờ FE07.**
  - Ánh xạ tới: BR-FE11-029, FR-FE11-039/040, AC-FE11-024; BR-FE07-033.
  - Chiếu `copyStatus` vật lý trong chi tiết yêu cầu Quản trị an toàn.
  - Tải lại danh sách/chi tiết chuẩn sau cả thành công và xung đột; giữ quyền
    sở hữu từ chối FE07 và lý do bắt buộc.
  - Bằng chứng: backend tập trung 123/123 và frontend 36/36; backend đầy đủ
    1,056/1,056; frontend đầy đủ 232/232; lint/build, truy vết và vệ sinh diff
    đạt cục bộ.
  - Còn lại: trình duyệt đã xác thực và review con người.

- [~] **FE11-REQ05 - Bảo vệ vòng đời vai trò/tài khoản và phê duyệt legacy.**
  - Ánh xạ tới: BR-FE11-030/031, FR-FE11-041/042; FE07 BR-FE07-034.
  - Chặn vô hiệu hóa và loại `MEMBER` khi workflow FE07 còn.
  - Chỉ vô hiệu hóa phê duyệt đã biết không hợp lệ, hiển thị blocker và giữ từ
    chối.
  - Cần bằng chứng hồi quy repository, service, route và frontend; review
    trình duyệt/con người đã xác thực vẫn còn.

- [~] **FE11-DASH01 - Kết nối metric Dashboard Quản trị và module chủ sở hữu.**
  - Ánh xạ tới: BR-FE11-020/032; FR-FE11-031; AC-FE11-025.
  - Đếm Thành viên hoạt động từ ánh xạ vai trò đơn chuẩn và giữ tác giả lấy từ
    catalog tác giả chuẩn.
  - Làm mỗi thẻ tóm tắt mở module chủ sở hữu với bộ lọc trạng thái áp dụng và
    gồm lượt trả có timestamp từ ngày hiện tại.
  - Chỉ đếm hoạt động mượn FE07 đã commit, giữ trình bày năm thẻ/ba biểu đồ đã
    phê duyệt và dùng ngày nghiệp vụ Việt Nam cho lượt trả.
  - Bằng chứng: đọc DB-backed xác nhận 7 lượt mượn lịch sử thực và 0 lượt trả
    hôm nay; backend 1,064/1,064 và frontend 232/232 đạt cùng lint/build, truy
    vết và vệ sinh diff xanh.
  - Còn lại: trình duyệt đã deploy đã xác thực và review con người.

## 2026-07-28 Nhiệm vụ ranh giới quản trị tài khoản Quản trị

- [~] **FE11-AGB01 - Loại sửa hồ sơ người dùng hiện có của Quản trị.**
  - Ánh xạ tới: Q-FE11-029; MF-FE11-004/MF-FE11-007; BR-FE11-014/015;
    FR-FE11-004/007/020/028; AC-FE11-004/008/011.
  - Loại `Chỉnh sửa` khỏi hàng/thẻ/chi tiết người dùng và giữ `Phân quyền`
    cùng `Vô hiệu hóa` đủ điều kiện.
  - Ngừng đường PUT hồ sơ người dùng hiện có FE11 qua mọi layer backend/client
    và loại khỏi OpenAPI.
  - Giữ tạo tài khoản, gửi lại thiết lập, thay vai trò và vô hiệu hóa là workflow
    đã phê duyệt riêng.
  - Triển khai/kiểm thử tự động: đang thực hiện trong workspace hiện tại.
  - Còn lại: xác thực tập trung/đầy đủ cùng review trình duyệt/con người đã xác
    thực.

## 2026-08-01 Củng cố mutation metadata Quản trị

- [ ] **FE11-CAT01 - Làm mutation metadata Quản trị có audit nguyên tử.**
  - Ánh xạ tới: BR-FE11-033, FR-FE11-043, AC-FE11-026, NFR-FE11-TXN-007, NFR-FE11-LOG-003; FE05-T019.
  - DoD: ba mutation giữ role/endpoint/envelope, dùng một transaction cho nguồn + audit, update không tồn tại không trả thành công giả và projector audit chỉ chiếu metadata allowlist.
  - Bằng chứng yêu cầu: RED-GREEN controller/service/repository/projector, backend đầy đủ/coverage, traceability, secret scan, system/E2E/deployment và review H2-P/H3-P.
