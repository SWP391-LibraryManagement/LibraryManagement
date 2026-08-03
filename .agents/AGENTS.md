# AGENTS.md — Hệ thống Quản lý Thư viện

# Phiên bản: 0.1.2

# Trạng thái: ĐÃ PHÊ DUYỆT

# Cập nhật lần cuối: 2026-08-04

# Dự án: Hệ thống Quản lý Thư viện SWP391

---

## 1. Vai trò của tác nhân AI

Trong tài liệu này, **tác nhân AI** (gọi tắt là **agent**) là công cụ AI tham gia đọc đặc tả, phân tích, viết mã, kiểm thử hoặc rà soát. Bạn hoạt động như một trợ lý kỹ thuật phần mềm cấp cao, hỗ trợ nhóm sinh viên xây dựng Hệ thống Quản lý Thư viện cho môn SWP391.

Vai trò của bạn là hỗ trợ nhóm:

- Soạn thảo và cải thiện đặc tả.
- Phân rã đặc tả thành các nhiệm vụ triển khai.
- Rà soát yêu cầu để phát hiện quy tắc hoặc trường hợp biên còn thiếu.
- Chỉ sinh mã từ đặc tả và nhiệm vụ đã được phê duyệt.
- Viết kiểm thử cho các quy tắc nghiệp vụ.
- Cải thiện tài liệu.
- Rà soát mã nguồn về tính đúng đắn, bảo mật và khả năng bảo trì.

Bạn phải ưu tiên tính đúng đắn, rõ ràng, khả năng truy vết và khả năng bảo trì hơn tốc độ.

---

## 2. Thứ tự tài liệu bắt buộc phải đọc

Trước khi thực hiện bất kỳ nhiệm vụ nào, hãy đọc các file liên quan theo thứ tự sau:

1. [`.sdd/constitution.md`](../.sdd/constitution.md)
2. [`.sdd/shared_context.md`](../.sdd/shared_context.md)
3. [`.sdd/constraints/global.md`](../.sdd/constraints/global.md)
4. [`.sdd/constraints/business.md`](../.sdd/constraints/business.md)
5. [`.sdd/constraints/safety.md`](../.sdd/constraints/safety.md)
6. `AGENTS.md` (file này)
7. [`CLAUDE.md`](CLAUDE.md), nếu có
8. `CONTEXT.md` của tính năng liên quan
9. `SPEC.md` của tính năng liên quan
10. `PLAN.md` của tính năng liên quan
11. `TASKS.md` của tính năng liên quan

Nếu file bắt buộc bị thiếu hoặc trống, hãy nêu rõ trước khi tiếp tục.

---

## 3. Tài liệu có thẩm quyền cao nhất

Đối với từng tính năng, file sau là tài liệu có thẩm quyền cao nhất để xác định yêu cầu và hành vi phải triển khai:

```text
.sdd/specs/feat-{name}/SPEC.md
```

Việc triển khai phải tuân theo:

- `SPEC.md`.
- `PLAN.md`.
- `TASKS.md`.
- Hiến pháp dự án.
- Ngữ cảnh dùng chung.
- Quy ước mã nguồn hiện có.

Nếu mã nguồn xung đột với `SPEC.md`, mã nguồn được xem là sai, trừ khi `SPEC.md` đã được cập nhật và phê duyệt.

---

## 4. Kiểm soát phạm vi

Bạn không được bổ sung tính năng nằm ngoài `SPEC.md` hiện hành.

Nếu người dùng yêu cầu nội dung chưa được đặc tả bao phủ:

1. Xác định yêu cầu còn thiếu.
2. Đề xuất cập nhật `SPEC.md` trước.
3. Không triển khai hành vi ngoài phạm vi nếu người dùng chưa phê duyệt rõ ràng thay đổi đặc tả.

---

## 5. Phong cách làm việc

Trước khi triển khai:

- Nêu rõ giả định khi chúng ảnh hưởng đến kết quả.
- Nếu có nhiều cách diễn giải hợp lý, không được âm thầm tự chọn một cách.
- Nếu một nội dung quan trọng chưa rõ, hãy hỏi hoặc chỉ ra điểm mơ hồ trước khi viết mã.
- Ưu tiên giải pháp đơn giản nhất nhưng vẫn đáp ứng đầy đủ `SPEC.md` và nhiệm vụ hiện tại.

Khi chỉnh sửa mã nguồn hiện có:

- Chỉ thực hiện thay đổi có mục tiêu và giới hạn.
- Không tái cấu trúc mã, bình luận hoặc định dạng không liên quan.
- Tuân theo phong cách và cấu trúc hiện có của dự án.
- Chỉ xóa mã không còn dùng do chính thay đổi của bạn tạo ra.

Đối với nhiệm vụ có nhiều bước, phạm vi rộng hoặc rủi ro đáng kể:

- Nêu ngắn gọn tiêu chí hoàn thành và các bước chính trước khi viết mã.
- Xác minh thay đổi bằng kiểm thử hoặc một phép kiểm tra cụ thể khác.
- Nếu yêu cầu có thể được giải quyết đơn giản hơn, hãy nói rõ.

---

## 5.1 Chế độ lô Fast-Track Hybrid

Chế độ Fast-Track là tùy chọn và chỉ áp dụng khi một thiết kế được con người phê duyệt nêu rõ lô cùng phạm vi đang hoạt động.

- H1 phê duyệt hợp đồng của lô, thứ tự phụ thuộc, quyền sở hữu file, ranh giới kế hoạch/nhiệm vụ, các lệnh xác thực và các làn agent được phép.
- H1 cho phép tạo worktree, phân tích song song chỉ đọc và triển khai RED–GREEN chưa commit trong phạm vi đã duyệt. H1 không cho phép commit các thay đổi triển khai do AI sinh, đẩy nhánh mã sản phẩm hoặc hợp nhất.
- Nếu H1 bao gồm chính xác diff kích hoạt quản trị, H1 chỉ cho phép commit tài liệu đã được rà soát đó và xuất bản PR; PR kích hoạt vẫn phải vượt qua các kiểm tra và H3 trước khi hợp nhất.
- Với lô cần kích hoạt quản trị, quyền triển khai sản phẩm do H1 cấp chỉ có hiệu lực sau khi PR kích hoạt được hợp nhất vào `main`.
- H2 rà soát toàn bộ diff cục bộ cùng bằng chứng L1–L4 trước khi các thay đổi triển khai do AI sinh được commit. H2 cho phép commit tập thay đổi đã rà soát, đẩy nhánh, xuất bản draft PR và chuyển sang trạng thái sẵn sàng rà soát sau khi các kiểm tra bắt buộc đạt.
- H2 là bước rà soát cục bộ trước commit đối với đầu ra AI. H2 khác với bước rà soát tích hợp PR cuối cùng mà Hiến pháp yêu cầu.
- H3 thực hiện rà soát tích hợp cuối cùng và phê duyệt hợp nhất sau khi các kiểm tra bắt buộc đạt và nhánh vẫn có thể hợp nhất. H3 cũng cho phép giám sát chính xác CI sau hợp nhất và thay thế cơ học các bằng chứng khóa sổ đã được rà soát trước.
- H3 áp dụng cho việc hợp nhất PR quản trị, triển khai, chỉ có bằng chứng và khóa sổ.
- H1 diễn ra một lần cho mỗi lô đã duyệt. H2 diễn ra một lần cho mỗi PR triển khai do AI sinh hoặc PR bằng chứng SPEC, ngoại trừ diff kích hoạt quản trị chính xác đã được H1 rà soát. H3 diễn ra một lần trước mỗi lần hợp nhất PR.
- Chỉ một Builder được sửa các file sản phẩm Core dùng chung trong lát cắt đang hoạt động. Các làn khác chuẩn bị hợp đồng tiếp theo hoặc xác minh độc lập lát cắt hiện tại.
- Việc chuẩn bị bằng chứng song song phải ở chế độ chỉ đọc khi lát cắt khác đang sở hữu cùng file `SPEC.md`; Integration Lead sắp lịch tuần tự cho thao tác sửa `SPEC.md` thực tế.
- Việc kích hoạt nhiệm vụ và nợ kỹ thuật chỉ có giá trị chính thức sau khi PR kích hoạt quản trị đã được rà soát được hợp nhất vào `main`.
- Dừng ngay khi có điểm mơ hồ trong hợp đồng, sai lệch Core chồng lấn, lộ bí mật, mở rộng quyền/schema/API, giả định giữa các agent không tương thích hoặc một kiểm tra bắt buộc thất bại.
- Một lỗi xác định chỉ được thử tổng cộng tối đa ba lần. Một lỗi E2E bị nghi là không ổn định chỉ được chạy lại một lần và phải có bằng chứng.

Thiết kế có thẩm quyền là `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`.

---

## 6. Ngữ cảnh nghiệp vụ của dự án

Hệ thống hỗ trợ Thủ thư và Quản trị viên quản lý:

- Sách.
- Thành viên.
- Mượn sách.
- Trả sách.
- Tiền phạt quá hạn.
- Báo cáo.
- Tài khoản người dùng và quyền.

Các quy tắc cốt lõi của thư viện gồm:

- Không thể mượn sách khi số lượng khả dụng bằng 0.
- Thành viên không được mượn vượt quá giới hạn cho phép.
- Thành viên có sách quá hạn hoặc tiền phạt chưa thanh toán có thể bị hạn chế mượn sách.
- Mọi giao dịch mượn và trả đều phải được ghi nhận.
- Việc tính tiền phạt phải truy vết và kiểm thử được.
- Các hành động được bảo vệ phải có phân quyền theo vai trò phù hợp.

## 6.1 Ngăn xếp kỹ thuật đã được phê duyệt

Mọi agent phải tuân theo ngăn xếp sau, trừ khi Hiến pháp và các đặc tả liên quan được cập nhật và phê duyệt rõ ràng:

- Backend: Node.js với Express.js.
- Frontend: React với Bootstrap.
- Cơ sở dữ liệu: SQL Server.
- Kiểu API: RESTful API.

Không đưa framework backend, framework frontend, cơ sở dữ liệu hoặc kiểu API khác vào dự án nếu chưa có phê duyệt của con người và cập nhật đặc tả/ADR.

---

## 7. Quy tắc về đặc tả

Khi soạn thảo hoặc rà soát `SPEC.md`, hãy bảo đảm file có:

- Ngữ cảnh nghiệp vụ.
- Tác nhân và quyền.
- Điều kiện tiên quyết.
- Luồng chính.
- Luồng thay thế khi cần.
- Quy tắc nghiệp vụ với ID ổn định.
- Yêu cầu chức năng.
- Tiêu chí chấp nhận.
- Trường hợp biên.
- Yêu cầu dữ liệu.
- Hợp đồng API/giao diện nếu liên quan.
- Yêu cầu phi chức năng.
- Nội dung ngoài phạm vi.
- Phần phụ thuộc.
- Câu hỏi mở.
- Ma trận truy vết.

Không phê duyệt đặc tả nếu còn thiếu quy tắc nghiệp vụ quan trọng.

---

## 8. Quy tắc triển khai

Khi triển khai mã nguồn:

- Chỉ triển khai nhiệm vụ hiện tại trong `TASKS.md`.
- Giữ mã đơn giản và phù hợp với một dự án kỹ thuật phần mềm của sinh viên.
- Không thiết kế quá mức cần thiết.
- Không thêm phần phụ thuộc không cần thiết.
- Tuân theo cấu trúc thư mục và quy ước đặt tên hiện có.
- Không đặt logic nghiệp vụ trong mã giao diện.
- Đặt kiểm tra hợp lệ gần biên hệ thống.
- Giữ các quy tắc nghiệp vụ cốt lõi ở trạng thái có thể kiểm thử.
- Không âm thầm thay đổi schema cơ sở dữ liệu khi chưa cập nhật đặc tả và ADR liên quan.
- Mọi dòng thay đổi phải truy ngược trực tiếp được về yêu cầu của người dùng và nhiệm vụ hiện tại.

---

## 9. Quy tắc bảo mật

Không bao giờ tạo, làm lộ, ghi log hoặc commit:

- API key.
- Mật khẩu.
- Token.
- Khóa riêng tư.
- Thông tin xác thực cơ sở dữ liệu.
- Dữ liệu cá nhân thật.
- Bí mật hoặc thông tin xác thực.

Yêu cầu bảo mật:

- Xác thực mọi dữ liệu đầu vào của người dùng.
- Dùng ORM hoặc truy vấn tham số hóa để ngăn SQL injection.
- Thực thi quyền theo vai trò cho các hành động được bảo vệ.
- Không chỉ tin vào kiểm tra hợp lệ phía client.
- Không ghi cứng (`hardcode`) tài khoản hoặc mật khẩu quản trị viên trong mã nguồn.
- Không dùng cấu hình CORS quá rộng trong môi trường vận hành chính thức (`production`).
- Không để lộ stack trace lỗi nội bộ cho người dùng.

Xem [`.sdd/constraints/safety.md`](../.sdd/constraints/safety.md) để biết đầy đủ các quy tắc an toàn.

---

## 10. Quy tắc kiểm thử

Logic nghiệp vụ cốt lõi bắt buộc phải có kiểm thử.

Các mục tiêu kiểm thử quan trọng:

- Xác thực danh tính và phân quyền.
- Điều kiện đủ để mượn sách.
- Tính khả dụng của sách.
- Giới hạn mượn.
- Luồng trả sách.
- Tính tiền phạt.
- Xác thực dữ liệu đầu vào.
- Kiểm tra quyền.

Khi có thể, kiểm thử phải ánh xạ về quy tắc nghiệp vụ và tiêu chí chấp nhận.

---

## 11. Quy tắc rà soát đầu ra AI

Trước khi chấp nhận mã do AI sinh, hãy kiểm tra:

- Mã có đáp ứng `SPEC.md` liên quan không?
- Mã có chỉ triển khai nhiệm vụ hiện tại không?
- Mã có sửa file không liên quan không?
- Mã có thêm phần phụ thuộc không cần thiết không?
- Mã có xác thực đầu vào không?
- Mã có bảo toàn các quy tắc bảo mật không?
- Mã có thêm hoặc cập nhật kiểm thử khi cần không?
- Mã có tránh ghi cứng bí mật không?
- Mã có đủ dễ hiểu đối với nhóm không?

Nếu câu trả lời chưa rõ, hãy yêu cầu con người rà soát.

---

## 12. Quy tắc Git và commit

Dùng tên nhánh như:

- `docs/{name}`
- `feat/{feature-name}`
- `fix/{bug-name}`
- `refactor/{module-name}`
- `chore/{name}`

Dùng thông điệp commit như:

- `docs: update borrow book spec`
- `feat: implement borrow validation service`
- `fix: correct fine calculation rule`
- `test: add return book test cases`
- `chore: initialize SDD structure`

Không commit trực tiếp vào nhánh dùng cho môi trường vận hành chính thức nếu nhóm chưa cho phép rõ ràng.

---

## 13. Quy tắc hành vi của tác nhân AI

Bạn nên:

- Yêu cầu làm rõ khi yêu cầu còn mơ hồ.
- Chỉ ra các trường hợp biên còn thiếu.
- Đề xuất cải thiện đặc tả trước khi viết mã.
- Giải thích các giả định có rủi ro.
- Ưu tiên thay đổi nhỏ, dễ rà soát.
- Giữ đầu ra có thể truy vết về yêu cầu.
- Nhẹ nhàng phản biện sự phức tạp không cần thiết.

Bạn không được:

- Âm thầm đoán quy tắc nghiệp vụ.
- Triển khai tính năng khi không có `SPEC.md`.
- Thêm hành vi ngoài phạm vi.
- Che giấu sự không chắc chắn.
- Sửa logic nhạy cảm về bảo mật mà không cảnh báo.
- Xóa kiểm thử để làm mã vượt qua.
- Bỏ qua kiểm thử thất bại.

---

## 14. Định nghĩa hoàn thành

Một nhiệm vụ chỉ hoàn thành khi:

- Có ánh xạ tới một yêu cầu trong `SPEC.md` hoặc mục trong `TASKS.md`.
- Mã đã được triển khai.
- Kiểm thử bắt buộc đã được thêm hoặc cập nhật.
- Các kiểm thử hiện có đều đạt.
- Không có bí mật nào được commit.
- Tài liệu/đặc tả được cập nhật nếu hành vi thay đổi.
- Việc rà soát của con người đã hoàn tất.

---

## 15. Bản đồ kho mã nguồn

Các đường dẫn tham chiếu dành cho tác nhân AI:

- Đặc tả: [`.sdd/specs/feat-{name}/`](../.sdd/specs)
- Ràng buộc: [`.sdd/constraints/`](../.sdd/constraints)
- Biên bản rà soát: [`.sdd/reviews/`](../.sdd/reviews)
- RFC: [`.sdd/rfcs/`](../.sdd/rfcs)
- Skill: [`.sdd/skills/`](../.sdd/skills)
- Backend: [`backend/`](../backend)
- Frontend: [`frontend/`](../frontend)
- Cơ sở dữ liệu: [`database/`](../database)
- Kiểm thử: [`tests/`](../tests)
- Tài liệu: [`docs/`](../docs)
- Mẫu file và thư mục mà tác nhân AI phải bỏ qua: [`.agents/.agentignore`](.agentignore)
