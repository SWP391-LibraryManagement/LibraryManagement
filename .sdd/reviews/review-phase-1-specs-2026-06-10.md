# Rà soát - Đặc tả tính năng Giai đoạn 1

Ngày: 2026-06-10

Trạng thái: ĐÃ BỊ THAY THẾ - ĐƯỢC GIẢI QUYẾT BỞI CLOSEOUT TUẦN 3

Ghi chú thay thế: Đây là lần rà soát Giai đoạn 1 ban đầu. Các blocker của nó sau
đó được giải quyết bởi
`.sdd/reviews/open-questions-resolution-packet-2026-06-10.md` và đóng bởi
`.sdd/reviews/week-3-spec-finalization-closeout-2026-06-10.md`. Giữ tệp này là
bằng chứng lịch sử, không phải verdict sẵn sàng hiện tại.

Phạm vi: Rà soát cả 12 đặc tả tính năng trước khi chuyển từ Đặc tả Giai đoạn 1
sang Lập kế hoạch Giai đoạn 2.

Nguồn:

- `.sdd/specs/*/SPEC.md`
- `.sdd/specs/*/CONTEXT.md`
- `docs/phase_1_foundation/07_master_feature_list.md`
- `C:\Users\admin\Downloads\Library Management (3).xlsx`
- `.sdd/shared_context.md`
- `.sdd/constraints/*.md`

Căn chỉnh sách:

- Đầu ra Giai đoạn 1 phải là `SPEC.md` đã review.
- Câu hỏi mở phải được giải quyết hoặc hoãn rõ ràng.
- Spec phải được phê duyệt/khóa trước `PLAN.md`, `TASKS.md` chi tiết hoặc triển
  khai.
- Mỗi thư mục tính năng nên giữ `SPEC.md`, `CONTEXT.md`, `PLAN.md`, `TASKS.md`
  và `CHANGELOG.md`.

---

## 1. Verdict điều hành

Các blocker về cấu trúc và truy vết phân công được tìm thấy trong lượt review
đầu tiên đã được sửa.

Toàn dự án vẫn chưa sẵn sàng chuyển sang Lập kế hoạch Giai đoạn 2 vì đa số spec
tính năng chưa được reviewer đội phê duyệt. FE07 Quản lý mượn hiện đã được phê
duyệt cho lập kế hoạch Giai đoạn 2.

Lý do:

1. Phần lớn tệp `SPEC.md` vẫn `DRAFT` hoặc `DRAFT (Proposed Design)`.
2. Nhiều câu hỏi mở hoặc quyết định đề xuất còn chưa giải quyết xuyên tính năng.
3. Một số quyết định liên tính năng phải được phê duyệt cùng nhau để tránh triển
   khai xung đột sau này.

Hành động tiếp theo được đề xuất:

1. Tổ chức họp phê duyệt đội dùng Phần 5 và Phần 6 của review này.
2. Cập nhật spec bị ảnh hưởng với quyết định đã phê duyệt.
3. Chỉ đổi trạng thái thành `APPROVED` sau khi mục checklist review được đáp ứng.

---

## 2. Tóm tắt mức sẵn sàng tính năng

| Tính năng | Chủ sở hữu | Trạng thái | Ánh xạ phân công | Cấu trúc | Số Q mở | Verdict Giai đoạn 2 |
| ------- | ----- | ------ | ---------------- | -------- | ------ | ------------------- |
| FE01 Công khai / Duyệt | Dung | DRAFT | OK | OK | 5 | Chưa sẵn sàng |
| FE02 Xác thực | Dat | DRAFT (Proposed Design) | OK | OK | 10 | Chưa sẵn sàng |
| FE03 Hồ sơ người dùng | Dat | DRAFT | OK | OK | 5 | Chưa sẵn sàng |
| FE04 Quản lý tư cách thành viên | Dat | DRAFT | OK | OK | 6 | Chưa sẵn sàng |
| FE05 Quản lý sách | Dung | DRAFT | OK | OK | 7 | Chưa sẵn sàng |
| FE06 Quản lý kho / bản sao sách | Dat | DRAFT | OK | OK | 6 | Chưa sẵn sàng |
| FE07 Quản lý mượn | Nhat | APPROVED | OK | OK | 0 | Sẵn sàng cho Giai đoạn 2 |
| FE08 Quản lý đặt chỗ | Nhat | DRAFT | OK | OK | 5 | Chưa sẵn sàng |
| FE09 Quản lý tiền phạt | Dung | DRAFT | OK | OK | 5 | Chưa sẵn sàng |
| FE10 Quản lý thông báo | Nhat | DRAFT (Proposed Design) | OK | OK | 7 | Chưa sẵn sàng |
| FE11 Quản lý người dùng và vai trò | Dung | DRAFT (Proposed Design) | OK | OK | 9 | Chưa sẵn sàng |
| FE12 Báo cáo và thống kê | Nhat | DRAFT | OK | OK | 6 | Chưa sẵn sàng |

Ghi chú:

- Ánh xạ phân công được kiểm tra với bảng Excel mới nhất.
- Cấu trúc nghĩa là `SPEC.md` chứa phần bắt buộc từ quy tắc dự án: tổng quan,
  actor, tiền điều kiện, luồng, quy tắc nghiệp vụ, yêu cầu chức năng, tiêu chí
  chấp nhận, edge case, dữ liệu, API/interface, NFR, ngoài phạm vi, phụ thuộc,
  câu hỏi mở, truy vết và checklist review.

---

## 3. Phát hiện chặn hiện tại

### BLOCKER-001: Mọi spec vẫn là bản nháp

Tệp: mọi `.sdd/specs/feat-*/SPEC.md`

Vấn đề:

Mọi `SPEC.md` vẫn là `DRAFT` hoặc `DRAFT (Proposed Design)`.

Tác động:

Theo quy trình SDD, Lập kế hoạch Giai đoạn 2 không nên bắt đầu cho đến khi tệp
`SPEC.md` liên quan được phê duyệt.

Hành động bắt buộc:

Giải quyết hoặc hoãn rõ ràng câu hỏi mở, rồi cập nhật trạng thái thành
`APPROVED` sau review đội.

---

### BLOCKER-002: Câu hỏi mở và quyết định đề xuất vẫn cần phê duyệt

Tệp: mọi feature spec

Tác động:

Triển khai có thể lệch giữa các tính năng nếu đội bắt đầu lập kế hoạch trước khi
quyết định dùng chung được phê duyệt.

Hành động bắt buộc:

Phê duyệt, thay đổi hoặc hoãn rõ ràng câu hỏi trong Phần 5.

---

## 3.1 Phát hiện đã sửa

Các vấn đề sau từ lượt review đầu tiên đã được sửa:

- `SPEC.md` FE05 hiện chứa mọi phần bắt buộc từ Phần 8 đến Phần 17.
- Mức phạm vi FE05 hiện khớp Master Feature List dưới dạng Standard Spec.
- ID UC/FT FE02 hiện khớp bảng phân công Excel mới nhất: UC05-UC10 và FT05-FT11.
- Policy hợp đồng API hiện nhất quán: hợp đồng API có thể được phê duyệt trong
  từng `SPEC.md` trừ khi đội đưa lại tài liệu hợp đồng API dùng chung chuyên
  dụng.
- Câu hỏi mở FE07, review luồng, hợp đồng API, kiểm tra phụ thuộc FE08/FE09 và
  review khả năng kiểm thử tiêu chí chấp nhận đã hoàn tất; `SPEC.md` FE07 hiện
  `APPROVED`.

---

## 4. Rủi ro phạm vi và phụ thuộc liên tính năng

### RISK-001: FE01 và FE05 cùng bao phủ tìm kiếm sách/chi tiết cho khách/thành viên

Tính năng bị ảnh hưởng:

- FE01 Công khai / Duyệt
- FE05 Quản lý sách

Lý do quan trọng:

FE01 sở hữu trải nghiệm công khai duyệt/trang chủ/tìm kiếm/chi tiết. FE05 cũng
gồm tìm kiếm/xem chi tiết sách cho Khách và Thành viên trong bảng phân công.

Ranh giới đề xuất:

- FE01: trải nghiệm UI/điều hướng/trang chủ/duyệt công khai và hành vi chỉ đọc
  an toàn công khai.
- FE05: quy tắc dữ liệu catalog và quản lý sách staff; API đọc dùng chung có thể
  phục vụ FE01.

Cần phê duyệt:

Xác nhận FE01 triển khai trang công khai trong khi FE05 sở hữu dữ liệu/API
catalog, hay đội muốn một cách tách khác.

---

### RISK-002: FE02, FE10 và FE11 chồng lấp quanh email thiết lập tài khoản/mật khẩu

Tính năng bị ảnh hưởng:

- FE02 Xác thực
- FE10 Quản lý thông báo
- FE11 Quản lý người dùng và vai trò

Lý do quan trọng:

FE11 đề xuất thiết lập người dùng do quản trị tạo qua liên kết dùng một lần. FE02
sở hữu tạo/xác thực mã thông báo. FE10 hiện bao phủ thông báo xác minh tài khoản
và đặt lại mật khẩu, nhưng thông báo thiết lập mật khẩu bị loại khỏi phạm vi phân
công FE10 để khớp Excel.

Cần phê duyệt:

Chọn một:

- Email thiết lập mật khẩu được xem là một phần của FE02/FE11, không phải FE10.
- FE10 hỗ trợ rõ ràng thông báo thiết lập mật khẩu như phụ thuộc nội bộ, dù Excel
  chỉ nêu thông báo đặt lại mật khẩu.

Không triển khai cho đến khi quyết định này được đưa ra.

---

### RISK-003: FE03 và FE11 chồng lấp quanh cập nhật dữ liệu người dùng

Tính năng bị ảnh hưởng:

- FE03 Hồ sơ người dùng
- FE11 Quản lý người dùng và vai trò

Lý do quan trọng:

FE03 cho phép người dùng cập nhật hồ sơ của mình. FE11 cho phép quản trị cập nhật
thông tin người dùng. Ranh giới email/điện thoại/trạng thái/vai trò phải rõ.

Ranh giới đề xuất:

- FE03: chỉ trường hồ sơ của chính mình.
- FE11: metadata tài khoản do quản trị quản lý, trạng thái, vai trò, tài khoản
  thủ thư.
- FE02: hành vi mật khẩu và xác minh email.

Cần phê duyệt:

Quyết định FE03 có thể cập nhật `Users.Phone` và thay đổi email chỉ được phép
qua FE02 hay không.

---

### RISK-004: FE04 và FE11 chồng lấp quanh tư cách thành viên và vai trò

Tính năng bị ảnh hưởng:

- FE04 Quản lý tư cách thành viên
- FE11 Quản lý người dùng và vai trò

Lý do quan trọng:

FE04 phê duyệt đơn đăng ký tư cách thành viên. FE11 quản lý vai trò người dùng.
Nếu phê duyệt tự động đổi vai trò, cả hai tính năng cần cùng quy tắc.

Ranh giới đề xuất:

- FE04 sở hữu trạng thái đơn đăng ký tư cách thành viên.
- FE11 sở hữu gán vai trò.

Cần phê duyệt:

Quyết định tư cách thành viên được phê duyệt chỉ đổi trạng thái tư cách hay cũng
cập nhật vai trò.

---

### RISK-005: FE06, FE07 và FE08 phải dùng chung quy tắc trạng thái bản sao

Tính năng bị ảnh hưởng:

- FE06 Quản lý kho / bản sao sách
- FE07 Quản lý mượn
- FE08 Quản lý đặt chỗ

Lý do quan trọng:

Mượn và đặt chỗ phụ thuộc `BookCopies.Status`. Chuyển trạng thái xung đột có thể
cho phép mượn hai lần hoặc lượng sẵn có không hợp lệ.

Tập trạng thái Giai đoạn 1 đề xuất:

- `AVAILABLE`
- `BORROWED`
- `RESERVED`
- `DAMAGED`
- `LOST`
- `INACTIVE`

Cần phê duyệt:

Quyết định tính năng nào có thể đặt từng trạng thái và liệu cập nhật staff thủ
công có thể ghi đè `BORROWED` hoặc `RESERVED` hay không.

---

### RISK-006: FE07 và FE09 phải thống nhất chặn tiền phạt chưa trả và hành vi tiền phạt hư hỏng/mất

Tính năng bị ảnh hưởng:

- FE07 Quản lý mượn
- FE09 Quản lý tiền phạt

Lý do quan trọng:

FE07 phải biết liệu tiền phạt chưa trả có chặn mượn không. FE09 phải biết khi nào
tiền phạt được tạo từ trả quá hạn/hư hỏng/mất.

Baseline đã phê duyệt đã tồn tại:

- Tiền phạt quá hạn = 5.000 VND mỗi ngày quá hạn mỗi bản sao.
- Tiền phạt bắt đầu từ ngày sau ngày đến hạn.

Vẫn cần phê duyệt:

- Liệu mọi tiền phạt chưa trả chặn mượn.
- Liệu tiền phạt hư hỏng/mất thuộc Giai đoạn 1.
- Liệu FE07 tạo yêu cầu tiền phạt tự động khi trả, hay FE09 tính thủ công/theo
  lịch.

---

### RISK-007: FE07 và FE08 phải thống nhất tác động đặt chỗ lên gia hạn

Tính năng bị ảnh hưởng:

- FE07 Quản lý mượn
- FE08 Quản lý đặt chỗ

Lý do quan trọng:

Nếu thành viên khác đặt chỗ sách/bản sao, gia hạn có thể cần bị chặn.

Cần phê duyệt:

Quyết định đặt chỗ hoạt động có chặn gia hạn không và mục tiêu đặt chỗ là
`BookId` hay `CopyId`.

---

### RISK-008: Lập lịch FE10 phụ thuộc FE07 và FE09

Tính năng bị ảnh hưởng:

- FE07 Quản lý mượn
- FE09 Quản lý tiền phạt
- FE10 Quản lý thông báo

Lý do quan trọng:

Thông báo ngày đến hạn/tiền phạt cần nguồn trigger. FE10 nên gửi thông báo nhưng
không quyết định sự kiện mượn/phạt.

Cần phê duyệt:

Quyết định nhắc ngày đến hạn được lập lịch tự động, kích hoạt thủ công hay bỏ khỏi
triển khai Giai đoạn 1.

---

### RISK-009: Báo cáo FE12 phụ thuộc giá trị trạng thái đã chốt

Tính năng bị ảnh hưởng:

- FE06 Kho
- FE07 Mượn
- FE09 Tiền phạt
- FE11 Người dùng và vai trò
- FE12 Báo cáo

Lý do quan trọng:

Báo cáo sẽ sai nếu tính năng nguồn dùng giá trị trạng thái không nhất quán.

Cần phê duyệt:

Phê duyệt giá trị trạng thái nguồn trước lập kế hoạch FE12.

---

## 5. Câu hỏi mở cần giải quyết

Danh sách này chứa câu hỏi chặn phê duyệt trừ khi đội hoãn rõ ràng chúng là ngoài
phạm vi.

### FE01 Công khai / Duyệt - Dung

- Q-FE01-001: Sách không hoạt động/đã vô hiệu hóa có nên bị ẩn khỏi mọi chế độ
  xem tìm kiếm/chi tiết công khai?
- Q-FE01-002: Khách có nên thấy số bản sao sẵn có chính xác, trạng thái đơn giản
  có sẵn/không có sẵn hay không thông tin sẵn có?
- Q-FE01-003: Bộ lọc tìm kiếm nào bắt buộc trong Giai đoạn 1?
- Q-FE01-004: ISBN có nên hiển thị với Khách?
- Q-FE01-005: Trang chủ có nên hiển thị sách nổi bật/gần đây hay chỉ điều hướng
  và tìm kiếm?

### FE02 Xác thực - Dat

- Q-FE02-001: Độ dài và độ phức tạp mật khẩu tối thiểu là gì?
- Q-FE02-002: Thời lượng timeout phiên là bao nhiêu?
- Q-FE02-003: Hệ thống có nên ép xác minh email khi đăng ký hay tùy chọn?
- Q-FE02-004: Hệ thống có nên cho phép nhiều phiên đồng thời mỗi người dùng?
- Q-FE02-005: Lần đăng nhập thất bại có nên bị rate-limit?
- Q-FE02-006: Thời gian hết hạn mã thông báo đặt lại mật khẩu là bao lâu?
- Q-FE02-007: Hệ thống có nên ghi lần thử đổi mật khẩu và lỗi đăng nhập?
- Q-FE02-008: Người dùng không hoạt động có nên tự động bị khóa?
- Q-FE02-009: Chiến lược quản lý phiên: JWT, cookie hay refresh token?
- Q-FE02-010: Đặt lại mật khẩu có nên chỉ yêu cầu xác minh email hay thêm kiểm
  tra phục hồi?

### FE03 Hồ sơ người dùng - Dat

- Q-FE03-001: FE03 có thể cập nhật `Users.Phone` hay điện thoại được quản lý
  nơi khác?
- Q-FE03-002: FE03 có thể cập nhật email hay đổi email phải qua xác minh FE02?
- Q-FE03-003: Bản ghi hồ sơ thiếu có nên tự tạo khi xem lần đầu?
- Q-FE03-004: Cần upload avatar hay chỉ văn bản URL avatar?
- Q-FE03-005: Cập nhật hồ sơ có nên ghi audit log?

### FE04 Quản lý tư cách thành viên - Dat

- Q-FE04-001: Người dùng bị từ chối có thể đăng ký lại?
- Q-FE04-002: Lý do từ chối có bắt buộc?
- Q-FE04-003: Tư cách thành viên có hết hạn hoặc cần gia hạn?
- Q-FE04-004: Tư cách thành viên được phê duyệt có đổi vai trò người dùng hay chỉ
  trạng thái đơn?
- Q-FE04-005: Cả Thủ thư và Quản trị có phê duyệt/từ chối hay chỉ Quản trị?
- Q-FE04-006: Phê duyệt/từ chối có kích hoạt thông báo FE10?

### FE05 Quản lý sách - Dung

- Q-FE05-001: ISBN có bắt buộc cho mọi sách?
- Q-FE05-002: Nhiều sách có thể cùng tiêu đề?
- Q-FE05-003: Sách đã vô hiệu hóa có nên còn tìm kiếm được?
- Q-FE05-004: Có cần soft delete cho sách?
- Q-FE05-005: Sách có thể thuộc nhiều thể loại?
- Q-FE05-006: Ảnh bìa sách nên lưu trong cơ sở dữ liệu hay file storage?
- Q-FE05-007: Có nên chặn vô hiệu hóa khi bản sao hoạt động đang được mượn hoặc
  đặt chỗ?

### FE06 Quản lý kho / bản sao sách - Dat

- Q-FE06-001: Giá trị `BookCopies.Status` được phép cuối cùng cho Giai đoạn 1 là
  gì?
- Q-FE06-002: Staff có thể đặt thủ công `BORROWED` hoặc `RESERVED`, hay chúng
  chỉ phải đến từ FE07/FE08?
- Q-FE06-003: `DELETE /api/book-copies/{id}` có nên vô hiệu hóa thay vì xóa vật
  lý?
- Q-FE06-004: `Location` có bắt buộc cho mọi bản sao?
- Q-FE06-005: Tình trạng bản sao có nên tách khỏi trạng thái bản sao?
- Q-FE06-006: Thao tác bản sao nào phải ghi `AuditLogs`?

### FE07 Quản lý mượn - Nhat

- Không còn câu hỏi mở FE07 sau cập nhật quyết định 2026-06-10.

Ghi chú:

- Q-FE07-001 và Q-FE07-002 được giải quyết trong FE07 dùng
  `.sdd/shared_context.md`: 5 bản sao đang mượn hoạt động và 14 ngày lịch.
- Q-FE07-003 đến Q-FE07-008 được giải quyết trong FE07 dùng quyết định chủ sở
  hữu đã phê duyệt: 1 lần gia hạn, tiền phạt chưa trả chặn mượn/gia hạn, thành
  viên tạo yêu cầu của mình, chi tiết đang chờ dùng `REQUESTED`, yêu cầu tự hoàn
  tất khi mọi chi tiết kết thúc và FE09 sở hữu tạo tiền phạt.

### FE08 Quản lý đặt chỗ - Nhat

- Q-FE08-001: Đặt chỗ ở cấp sách (`BookId`) hay cấp bản sao vật lý (`CopyId`)?
- Q-FE08-002: Thành viên có thể đặt chỗ sách nếu một bản sao hiện đang có sẵn?
- Q-FE08-003: Số đặt chỗ hoạt động tối đa mỗi thành viên?
- Q-FE08-004: Đặt chỗ đã thông báo còn hiệu lực bao lâu trước hết hạn?
- Q-FE08-005: Xử lý hàng đợi nên tự động sau trả, thủ công bởi Thủ thư hay cả
  hai?

Ghi chú:

- Q-FE08-006 được giải quyết với FE07: đặt chỗ hoạt động/bản sao giữ cho thành
  viên khác chặn gia hạn.

### FE09 Quản lý tiền phạt - Dung

- Q-FE09-001: Tiền phạt mất/hư hỏng bắt buộc trong Giai đoạn 1 hay chỉ tiền phạt
  quá hạn?
- Q-FE09-003: Thu tiền phạt có nên hỗ trợ thanh toán một phần?
- Q-FE09-004: Thu tiền có nên lưu ID người thu và ghi chú trong bảng riêng?
- Q-FE09-005: Quản trị có thể miễn hoặc hủy tiền phạt?
- Q-FE09-006: Tính toán có nên chạy tự động khi trả, thủ công bởi Thủ thư, lập
  lịch hàng ngày hay tất cả?

Ghi chú:

- Q-FE09-002 được giải quyết với FE07: mọi tiền phạt `UNPAID` có số tiền lớn hơn
  0 chặn mượn mới và gia hạn.

### FE10 Quản lý thông báo - Nhat

- Q-FE10-001: Kênh nào bắt buộc Giai đoạn 1: chỉ email, chỉ in-app hay cả hai?
- Q-FE10-002: Nhà cung cấp email hoặc chiến lược mock nào dùng trong phát triển?
- Q-FE10-003: Thành viên có thể tắt nhắc nhở tùy chọn hay mọi thông báo bắt buộc?
- Q-FE10-004: Bản ghi gửi nên giữ trong bao lâu?
- Q-FE10-005: Nhắc ngày đến hạn có nên lập lịch tự động và bao nhiêu ngày trước
  ngày đến hạn?
- Q-FE10-006: Mẫu thông báo nên cố định ở cấu hình seed/static cho Giai đoạn 1?
- Q-FE10-007: Lỗi gửi thông báo có nên chặn workflow nghiệp vụ nguồn?

### FE11 Quản lý người dùng và vai trò - Dung

- Q-FE11-001: Quản trị có thể tự vô hiệu hóa mình?
- Q-FE11-002: Hệ thống có nên ngăn vô hiệu hóa người dùng có lượt mượn hoạt động
  hay chỉ cảnh báo?
- Q-FE11-003: Yêu cầu độ phức tạp mật khẩu khi người dùng hoàn tất thiết lập qua
  FE02 là gì?
- Q-FE11-004: Email nên phân biệt hoa/thường hay không khi đăng nhập và kiểm tra
  duy nhất?
- Q-FE11-005: Tạo người dùng có nên tự gửi email thiết lập mật khẩu với liên kết
  một lần?
- Q-FE11-006: Dữ liệu người dùng đã vô hiệu hóa nên giữ bao lâu trước khi xóa
  vĩnh viễn?
- Q-FE11-007: Hệ thống có nên hỗ trợ phân cấp vai trò?
- Q-FE11-008: Quản trị có thể xem trường tài khoản nhạy cảm của quản trị khác?
- Q-FE11-009: Vô hiệu hóa người dùng có nên thông báo cho người dùng qua email?

### FE12 Báo cáo và thống kê - Nhat

- Q-FE12-001: Vai trò nào có thể xem báo cáo mượn, kho và người dùng?
- Q-FE12-002: Metric mượn nào bắt buộc?
- Q-FE12-003: Metric kho nào bắt buộc?
- Q-FE12-004: Thống kê người dùng nào bắt buộc?
- Q-FE12-005: Xuất CSV/PDF có bắt buộc Giai đoạn 1?
- Q-FE12-006: Truy cập báo cáo có nên được audit?

---

## 6. Quyết định phê duyệt được đề xuất

Đây là mặc định đề xuất giúp đội phê duyệt spec nhanh. Chúng không cuối cùng cho
đến khi đội chấp nhận.

| Khu vực | Khuyến nghị |
| ---- | ------------ |
| Trường công khai FE01 | Hiển thị tiêu đề, tác giả, thể loại, nhà xuất bản, năm xuất bản, mô tả, bìa và lượng sẵn có đơn giản. Ẩn chi tiết bản sao/barcode nội bộ khỏi Khách. |
| Tìm kiếm FE01 | Hỗ trợ tìm kiếm từ khóa theo tiêu đề/tác giả/thể loại và phân trang. |
| Mật khẩu FE02 | 8+ ký tự, ít nhất 1 chữ hoa, 1 số, 1 ký tự đặc biệt. |
| Phiên FE02 | JWT access token cùng refresh token; access token ngắn hạn; thời lượng chính xác do đội phê duyệt. |
| Xác minh email FE02 | Bắt buộc khi mock FE10/email khả dụng; nếu không, đánh dấu đã lên kế hoạch/mock cho Giai đoạn 1. |
| Hồ sơ FE03 | Người dùng có thể cập nhật họ tên, địa chỉ, ngày sinh, URL avatar và điện thoại của chính mình. Thay đổi email giữ ở FE02. |
| Tư cách thành viên FE04 | Phê duyệt chỉ đổi trạng thái đơn đăng ký tư cách, không đổi vai trò. Thủ thư/Quản trị có thể phê duyệt/từ chối. Lý do từ chối bắt buộc. Không hết hạn trong Giai đoạn 1. |
| Sách FE05 | ISBN tùy chọn nhưng duy nhất khi cung cấp; tiêu đề bắt buộc; vô hiệu hóa mềm; cho phép nhiều tiêu đề giống nhau. |
| Trạng thái bản sao FE06 | Dùng `AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE`. |
| Chuyển trạng thái FE06 | FE07 sở hữu `BORROWED`; FE08 sở hữu `RESERVED`; thay đổi staff FE06 không thể ghi đè mượn/đặt chỗ hoạt động. |
| Baseline mượn FE07 | Tối đa 5 bản sao đang mượn hoạt động; thời lượng mượn mặc định 14 ngày. Các giá trị này đã được phê duyệt trong ngữ cảnh dùng chung. |
| Gia hạn FE07 | Cho phép 1 lần gia hạn nếu không quá hạn, không tiền phạt chặn và không xung đột đặt chỗ hoạt động. |
| Mục tiêu FE08 | Dùng `CopyId` SQL hiện tại cho Giai đoạn 1 trừ khi đội phê duyệt thay đổi DB sang đặt chỗ cấp sách. |
| Hàng đợi FE08 | Xử lý thủ công bởi Thủ thư cho Giai đoạn 1; trigger tự động có thể là công việc tương lai. |
| Tiền phạt FE09 | Giai đoạn 1 chỉ tiền phạt quá hạn; 5.000 VND/ngày/bản sao; mọi tiền phạt chưa trả chặn mượn trừ khi đội thay đổi. |
| Thu tiền FE09 | Không thanh toán một phần trong Giai đoạn 1; đánh dấu toàn bộ tiền phạt đã trả bằng `PaidAt`. |
| Kênh FE10 | Email với mock provider bắt buộc; in-app tùy chọn nếu thời gian cho phép. |
| Lỗi FE10 | Lỗi thông báo không được rollback workflow nghiệp vụ nguồn. |
| Vai trò FE11 | Vai trò phẳng: Khách, Thành viên, Thủ thư, Quản trị. Không phân cấp trong Giai đoạn 1. |
| Vô hiệu hóa FE11 | Không xóa vĩnh viễn người dùng; dùng trạng thái không hoạt động. Ngăn vô hiệu hóa Quản trị hoạt động cuối. |
| Báo cáo FE12 | Chỉ báo cáo chỉ đọc. Không xuất CSV/PDF trừ khi đội yêu cầu rõ ràng. |

---

## 7. Checklist phê duyệt cho đội

Trước khi bất kỳ tính năng nào vào Lập kế hoạch Giai đoạn 2:

- [x] `SPEC.md` FE05 hoàn tất.
- [x] ID UC/FT FE02 căn chỉnh Excel mới nhất.
- [x] Mọi câu hỏi mở được giải quyết hoặc hoãn rõ ràng.
- [x] Ranh giới liên tính năng trong Phần 4 được phê duyệt.
- [x] Quyết định dùng chung được lan truyền tới spec bị ảnh hưởng.
- [x] Trạng thái mỗi `SPEC.md` đổi từ `DRAFT` thành `APPROVED`.
- [x] Mỗi `PLAN.md` giữ `NOT STARTED` đến khi `SPEC.md` được phê duyệt.
- [x] Mỗi `TASKS.md` giữ `NOT STARTED` đến khi `PLAN.md` được phê duyệt.
- [x] Policy hợp đồng API nhất quán trên mọi spec.
- [x] Reviewer ký xác nhận trước triển khai. (Ký review đội ghi ngày 2026-06-10.)

---

## 8. Thứ tự công việc được gợi ý

1. Phê duyệt quyết định liên tính năng dùng chung:
   - trạng thái bản sao
   - giới hạn mượn/thời lượng mượn/gia hạn
   - mục tiêu đặt chỗ và hành vi hàng đợi
   - chặn tiền phạt và hành vi tính toán
   - kênh/nhà cung cấp thông báo
   - ranh giới hồ sơ/người dùng/vai trò
2. Cập nhật mỗi `SPEC.md` bị ảnh hưởng.
3. Đánh dấu spec đã phê duyệt là `APPROVED`.
4. Bắt đầu Giai đoạn 2 bằng cách viết `PLAN.md` chỉ cho tính năng đã phê duyệt.
