# Bối Cảnh Dùng Chung — Hệ Thống Quản Lý Thư Viện

# Phiên bản: 1.0.0

# Trạng thái: ĐÃ PHÊ DUYỆT

# Cập nhật lần cuối: 2026-06-25

---

## 1. Tóm Tắt Dự Án

Đây là dự án Hệ thống Quản lý Thư viện dành cho SWP391.

Hệ thống giúp thư viện quản lý:

- Sách
- Thể loại sách
- Thành viên / độc giả
- Giao dịch mượn sách
- Giao dịch trả sách
- Khoản phạt quá hạn
- Báo cáo và thống kê
- Tài khoản và vai trò người dùng

Mục tiêu chính là giảm công việc thủ công, cải thiện độ chính xác của dữ liệu và giúp Thủ thư theo dõi tình trạng có sẵn của sách cũng như trạng thái mượn sách.

---

## 1.1 Công Nghệ Đã Được Phê Duyệt

| Tầng     | Quyết định             |
| -------- | --------------------- |
| Backend  | Node.js + Express.js  |
| Frontend | React + Bootstrap     |
| Database | SQL Server            |
| API      | RESTful API           |

Các lựa chọn công nghệ này được cố định cho giai đoạn hiện tại của dự án. Mọi thay đổi đều phải cập nhật Hiến chương, bối cảnh dùng chung và các file ADR/đặc tả liên quan.

---

## 2. Phương Pháp Phát Triển

Nhóm áp dụng phương pháp Phát triển Kết hợp Hướng Đặc tả và Hướng Tác nhân.

### Phát Triển Hướng Đặc Tả Được Sử Dụng Cho:

- Yêu cầu nghiệp vụ cốt lõi
- Quy tắc mượn và trả sách
- Tính tiền phạt
- Quyền theo vai trò
- Thiết kế cơ sở dữ liệu
- Hợp đồng API
- Logic nhạy cảm về bảo mật

### Phát Triển Hướng Tác Nhân Được Sử Dụng Cho:

- Soạn thảo tài liệu
- Phân rã đặc tả thành các nhiệm vụ
- Triển khai các nhiệm vụ đã được phê duyệt
- Viết kiểm thử
- Tái cấu trúc
- Tạo mã khung
- Review các trường hợp biên có thể xảy ra

Đầu ra của AI/tác nhân luôn phải được con người review trước khi commit hoặc merge.

---

## 3. Người Dùng / Tác Nhân Hệ Thống

| Tác nhân      | Mô tả                                                                                      |
| --------- | --------------------------------------------------------------------------------- |
| Khách         | Khách truy cập chưa xác thực, có thể xem thông tin công khai nếu hệ thống hỗ trợ           |
| Thành viên    | Độc giả thư viện có thể mượn sách và xem lịch sử mượn                                     |
| Thủ thư       | Nhân viên quản lý việc mượn, trả sách, sách và thành viên                                  |
| Quản trị viên | Người quản lý hệ thống, phụ trách người dùng, vai trò, thiết lập hệ thống và báo cáo        |

---

## 4. Các Mô-đun Cốt Lõi

| Mô-đun                         | Mô tả |
| ------------------------------ | ----------- |
| Công khai / Duyệt sách         | Tìm kiếm, duyệt và xem thông tin sách công khai. |
| Xác thực                       | Đăng ký, đăng nhập, đăng xuất, quên mật khẩu và đặt lại mật khẩu. |
| Hồ sơ người dùng               | Xem và cập nhật thông tin hồ sơ cá nhân. |
| Quản lý tư cách thành viên     | Đăng ký tư cách thành viên và quản lý việc phê duyệt/trạng thái thành viên. |
| Quản lý sách                   | Quản lý thông tin sách. |
| Kho / Bản sao sách             | Quản lý bản sao sách vật lý, barcode, vị trí, trạng thái và tình trạng có sẵn. |
| Quản lý mượn sách              | Quản lý việc mượn, trả, gia hạn và lịch sử mượn sách. |
| Quản lý đặt chỗ                | Quản lý việc đặt chỗ sách và hàng đợi đặt chỗ. |
| Quản lý khoản phạt             | Tính tiền phạt và ghi nhận việc thu phạt/trạng thái đã thanh toán. |
| Quản lý thông báo              | Gửi thông báo về tài khoản, đặt chỗ, hạn trả và khoản phạt. |
| Quản lý người dùng và vai trò  | Quản lý người dùng, Thủ thư, vai trò và quyền. |
| Báo cáo và thống kê            | Tạo báo cáo và thống kê cơ bản. |

---

## 5. Quy Tắc Nghiệp Vụ Cốt Lõi

- BR-GEN-001: Sách phải có mã định danh duy nhất.
- BR-GEN-002: Thành viên phải có mã định danh duy nhất.
- BR-GEN-003: Chỉ người dùng được cấp quyền mới có thể quản lý sách, thành viên, việc mượn sách, trả sách và khoản phạt.
- BR-GEN-004: Không thể mượn sách khi số lượng có sẵn bằng 0.
- BR-GEN-005: Thành viên không được mượn quá 5 bản sao đang mượn tại cùng một thời điểm. Trong mỗi ngày nghiệp vụ, thành viên đã được FE04 phê duyệt có thể yêu cầu/nhận tối đa 5 bản sao, trong khi tài khoản `MEMBER` chưa có tư cách thành viên FE04 được phê duyệt có thể yêu cầu/nhận tối đa 3 bản sao.
- BR-GEN-006: Thành viên có sách quá hạn hoặc khoản phạt chưa thanh toán có thể bị hạn chế mượn sách.
- BR-GEN-007: Mọi giao dịch mượn phải lưu thành viên, sách, ngày mượn, hạn trả, trạng thái và người tạo. Thời hạn mượn mặc định là 14 ngày theo lịch.
- BR-GEN-008: Mọi giao dịch trả sách phải cập nhật giao dịch mượn liên quan.
- BR-GEN-009: Việc tính tiền phạt phải có khả năng truy vết và kiểm thử. Trong Giai đoạn 1, mức phạt quá hạn là 5,000 VND cho mỗi ngày quá hạn trên mỗi bản sao, bắt đầu từ ngày sau hạn trả.
- BR-GEN-010: Các hành động quản trị quan trọng phải được ghi nhật ký.

---

## 5.1 Quyết Định Nghiệp Vụ Baseline Của Giai Đoạn 1

Các quyết định này khép lại những câu hỏi nghiệp vụ dùng chung của Giai đoạn 0 để các đặc tả chức năng sử dụng cùng một tập giả định. Nếu giảng viên hoặc trưởng nhóm thay đổi bất kỳ quyết định nào, hãy cập nhật file này trước, sau đó cập nhật các đặc tả chức năng bị ảnh hưởng.

| Mã quyết định | Quyết định | Áp dụng cho |
| ----------- | -------- | ---------- |
| DEC-GEN-001 | Thành viên có thể có tối đa 5 bản sao đang mượn tại cùng một thời điểm. | FE07 Mượn sách, FE08 Đặt chỗ, FE09 Khoản phạt, FE12 Báo cáo |
| DEC-GEN-002 | Thời hạn mượn mặc định là 14 ngày theo lịch, tính từ ngày yêu cầu mượn được phê duyệt. | FE07 Mượn sách, FE10 Thông báo, FE12 Báo cáo |
| DEC-GEN-003 | Mức phạt quá hạn là 5,000 VND cho mỗi ngày quá hạn trên mỗi bản sao, bắt đầu từ ngày sau hạn trả. | FE07 Mượn sách, FE09 Khoản phạt, FE10 Thông báo, FE12 Báo cáo |
| DEC-GEN-004 | Các vai trò người dùng cuối cùng trong Giai đoạn 1 là Khách, Thành viên, Thủ thư và Quản trị viên. Hệ thống/Bộ lập lịch là tác nhân nội bộ, không phải vai trò đăng nhập. | FE02 Xác thực, FE10 Thông báo, FE11 Người dùng và vai trò |
| DEC-GEN-005 | Mỗi tài khoản được lưu trữ có đúng một vai trò đăng nhập loại trừ lẫn nhau. Việc đổi vai trò thay thế vai trò hiện tại theo cách nguyên tử; vì vậy mảng tương thích `roles` chứa đúng một phần tử. | FE01 Công khai/Duyệt sách, FE02 Xác thực, FE07 Mượn sách, FE08 Đặt chỗ, FE11 Người dùng và vai trò |

---

## 6. Thực Thể Dữ Liệu (Đã Xác Nhận)

Đây là các bảng thực tế trong schema dùng chung (`database/Librarymanagement.sql`). Để biết cách chúng
liên hệ với nhau, hãy xem ERD hệ thống trong
[`docs/architecture/feature-integration-map.md`](../docs/architecture/feature-integration-map.md) (Mục 4.1).

| Thực thể | Mục đích | Chức năng sở hữu |
| ------ | ------- | ----------------- |
| `Users` | Thông tin và trạng thái tài khoản đăng nhập | FE02, FE11 |
| `Roles` | Các vai trò quyền trong hệ thống | FE11 |
| `UserRoles` | Lưu đúng một ánh xạ vai trò cho mỗi người dùng; `UX_UserRoles_UserId` thực thi số lượng vai trò của tài khoản | FE02, FE11 |
| `UserProfiles` | Chi tiết hồ sơ cá nhân | FE03 |
| `Members` | Hồ sơ độc giả thư viện | FE04 |
| `MembershipApplications` | Hồ sơ đăng ký/phê duyệt tư cách thành viên | FE04 |
| `AuthTokens` | Token xác minh/đặt lại/làm mới đã được băm | FE02 |
| `Categories` | Thể loại sách | FE05 |
| `Authors` | Thông tin tác giả | FE05 |
| `Publishers` | Thông tin nhà xuất bản | FE05 |
| `Books` | Metadata của sách | FE05 |
| `BookCopies` | Bản sao vật lý, barcode, trạng thái, tình trạng có sẵn | FE06 |
| `BorrowRequests` | Phần đầu của yêu cầu mượn sách | FE07 |
| `BorrowDetails` | Hồ sơ mượn/trả/gia hạn theo từng bản sao | FE07 |
| `Reservations` | Hàng đợi đặt chỗ / hồ sơ giữ chỗ | FE08 |
| `Fines` | Hồ sơ phạt quá hạn/mất/hư hỏng | FE09 |
| `NotificationTemplates` | Mẫu thông báo có thể tái sử dụng | FE10 |
| `Notifications` | Hồ sơ thông báo | FE10 |
| `NotificationAttempts` | Các lần thử gửi / trạng thái | FE10 |
| `AuditLogs` | Các hành động quản trị quan trọng | Liên chức năng |

Mọi thay đổi schema đều phải cập nhật `database/Librarymanagement.sql`, `SPEC.md` của chức năng liên quan và
`ADR-002-database-design.md` trước khi triển khai (xem Chính sách Migration trong ADR-002).

---

## 7. Danh Sách Chức Năng

Nguồn chuẩn chính thức của danh sách chức năng dự án là [`docs/phase_1_foundation/07_master_feature_list.md`](../docs/phase_1_foundation/07_master_feature_list.md).

| Mã chức năng | Tên chức năng                         | Thư mục chức năng            | Mức đặc tả |
| ---------- | -------------------------------- | ---------------------------- | ---------- |
| FE01       | Công khai / Duyệt sách               | feat-public-browse           | Tiêu chuẩn |
| FE02       | Xác thực                              | feat-auth                    | Đầy đủ     |
| FE03       | Hồ sơ người dùng                      | feat-user-profile            | Tiêu chuẩn |
| FE04       | Quản lý tư cách thành viên            | feat-membership-management   | Tiêu chuẩn |
| FE05       | Quản lý sách                          | feat-book-management         | Tiêu chuẩn |
| FE06       | Quản lý kho / Bản sao sách            | feat-inventory-book-copy     | Đầy đủ     |
| FE07       | Quản lý mượn sách                     | feat-borrowing-management    | Đầy đủ     |
| FE08       | Quản lý đặt chỗ                       | feat-reservation-management  | Tiêu chuẩn |
| FE09       | Quản lý khoản phạt                    | feat-fine-management         | Đầy đủ     |
| FE10       | Quản lý thông báo                     | feat-notification-management | Tiêu chuẩn |
| FE11       | Quản lý người dùng và vai trò         | feat-user-role-management    | Đầy đủ     |
| FE12       | Báo cáo và thống kê                   | feat-reporting-statistics    | Tiêu chuẩn |

Chỉ nên tạo thư mục chức năng khi nhóm bắt đầu soạn thảo `SPEC.md` liên quan. Không được giữ các thư mục chức năng trống.

---

## 8. Cấu Trúc Tài Liệu

Dự án sử dụng cấu trúc sau:

```text
.sdd/
├── constitution.md
├── shared_context.md
├── constraints/
│   ├── global.md
│   ├── business.md
│   └── safety.md
└── specs/
    ├── _template.md
    └── feat-{name}/
```

Mỗi thư mục chức năng phải chứa:

- SPEC.md
- CONTEXT.md
- PLAN.md
- TASKS.md
- CHANGELOG.md

Bộ nhớ dành cho tác nhân nằm trong [`.agents/`](../.agents/) (xem `.agents/AGENTS.md` và `.agents/CLAUDE.md`). `AGENTS.md` và `CLAUDE.md` ở cấp root dẫn tác nhân tới các file đó.

Cấu trúc repository hiện tại cũng bao gồm các thư mục còn lại của Dự án Hybrid theo playbook:

```text
.sdd/skills/
.sdd/rfcs/
.sdd/reviews/
backend/
frontend/
tests/unit/
tests/integration/
tests/e2e/
database/
.github/workflows/
```

---

## 9. Quy Trình Phát Triển

Đối với mỗi chức năng, nhóm tuân theo quy trình sau:

1. Viết hoặc cập nhật CONTEXT.md.
2. Soạn thảo SPEC.md.
3. Review SPEC.md với con người và AI.
4. Giải quyết các câu hỏi còn mở.
5. Phê duyệt hoặc khóa SPEC.md.
6. Tạo PLAN.md.
7. Tạo TASKS.md.
8. Triển khai các nhiệm vụ.
9. Viết kiểm thử.
10. Xác thực phần triển khai theo SPEC.md.
11. Con người review trước khi merge.

---

## 10. Các Cổng Xác Thực

Trước khi một chức năng được xem là hoàn thành:

- SPEC.md phải hoàn chỉnh và đã được review.
- PLAN.md phải khớp với SPEC.md.
- TASKS.md phải truy vết được về các yêu cầu.
- Mã nguồn phải đáp ứng các tiêu chí chấp nhận.
- Kiểm thử phải bao phủ các quy tắc nghiệp vụ cốt lõi.
- Không được commit thông tin bí mật hoặc thông tin xác thực.
- Review của con người phải hoàn thành.

---

## 11. Quyết Định Baseline Giai Đoạn 1

| ID    | Câu hỏi                                                           | Chủ sở hữu     | Trạng thái |
| ----- | ----------------------------------------------------------------- | -------------- | ------ |
| Q-001 | Nhóm sẽ sử dụng công nghệ nào cho backend và frontend?            | Nhóm           | Đã giải quyết: Node.js + Express.js, React + Bootstrap, SQL Server, RESTful API |
| Q-002 | Số bản sao tối đa mà thành viên có thể mượn là bao nhiêu?         | Nhóm / Giảng viên | Đã giải quyết cho Giai đoạn 1: 5 bản sao đang mượn cho mỗi thành viên |
| Q-003 | Thành viên có thể giữ sách đã mượn trong bao nhiêu ngày?          | Nhóm / Giảng viên | Đã giải quyết cho Giai đoạn 1: 14 ngày theo lịch |
| Q-004 | Khoản phạt quá hạn được tính như thế nào?                         | Nhóm / Giảng viên | Đã giải quyết cho Giai đoạn 1: 5,000 VND cho mỗi ngày quá hạn trên mỗi bản sao, bắt đầu từ ngày sau hạn trả |
| Q-005 | Hệ thống cuối cùng cần những vai trò nào?                         | Nhóm           | Đã giải quyết cho Giai đoạn 1: Khách, Thành viên, Thủ thư, Quản trị viên. Hệ thống/Bộ lập lịch chỉ là tác nhân nội bộ |

Đây là các quyết định baseline của Giai đoạn 1. Chỉ được sửa đổi sau khi nhóm/giảng viên phê duyệt và phải cập nhật tới mọi đặc tả chức năng bị ảnh hưởng.

---

## 12. Ghi Chú Cho AI/Tác Nhân

Khi hỗ trợ dự án này, AI/tác nhân phải:

- Đọc [`.sdd/constitution.md`](constitution.md) trước tiên.
- Đọc bối cảnh dùng chung này trước khi soạn thảo đặc tả.
- Không bao giờ triển khai chức năng cốt lõi khi không có SPEC.md tương ứng.
- Đặt câu hỏi khi thiếu quy tắc nghiệp vụ.
- Giữ dự án phù hợp với một dự án kỹ thuật phần mềm SWP391 dành cho sinh viên.
