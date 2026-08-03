# AGENTS.md — Hệ thống Quản lý Thư viện

# Phiên bản: 0.1.3

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

## 5.1 Fast-Track Hybrid theo đợt công việc

### Mục đích

Fast-Track Hybrid là quy trình tùy chọn để xử lý nhanh một nhóm công việc có liên quan nhưng vẫn giữ các bước kiểm soát của con người. Quy trình này chỉ được sử dụng khi tài liệu thiết kế đã được con người phê duyệt và xác định rõ phạm vi được phép thực hiện.

Trong mục này, **đợt công việc** là một nhóm nhiệm vụ có liên quan và được phê duyệt cùng nhau. Mỗi nhiệm vụ độc lập bên trong đợt được gọi là một **phần việc** (`slice`). Ví dụ, một đợt có thể gồm ba phần việc: sửa API, cập nhật giao diện và bổ sung kiểm thử cho cùng một tính năng.

### Quy trình H1–H2–H3

H1, H2 và H3 là ba cổng phê duyệt của con người. Mỗi cổng trả lời một câu hỏi khác nhau:

- **H1:** Nhóm có cho phép bắt đầu đợt công việc này không?
- **H2:** Phần mã do AI tạo ra đã đủ an toàn để commit và đưa lên pull request chưa?
- **H3:** Pull request đã đủ điều kiện để hợp nhất vào nhánh chính chưa?

```text
H1: Duyệt phạm vi và cách thực hiện
        ↓
AI triển khai nhưng chưa commit mã
        ↓
H2: Con người kiểm tra mã và kết quả cục bộ
        ↓
Commit, đẩy nhánh và tạo pull request
        ↓
H3: Con người rà soát tích hợp và quyết định hợp nhất
```

#### H1 — Phê duyệt trước khi triển khai

H1 xác định chính xác:

- Những nhiệm vụ nào thuộc đợt công việc.
- Thứ tự thực hiện và mối quan hệ phụ thuộc giữa các nhiệm vụ.
- Người hoặc tác nhân AI nào được sửa từng file.
- Phần nào thuộc `PLAN.md`, `TASKS.md` và đặc tả đã phê duyệt.
- Những lệnh build, kiểm thử và xác minh bắt buộc phải chạy.
- Những công việc nào được thực hiện song song.

Sau H1, tác nhân AI được phép tạo worktree, phân tích song song ở chế độ chỉ đọc và thực hiện chu trình viết kiểm thử trước rồi sửa mã cho kiểm thử đạt (`RED–GREEN`). Mã triển khai do AI tạo ra phải được giữ ở trạng thái chưa commit cho đến khi vượt qua H2. H1 không cho phép đẩy nhánh chứa mã sản phẩm hoặc hợp nhất pull request.

Nếu H1 đã rà soát chính xác phần tài liệu dùng để kích hoạt quy trình quản trị, phần tài liệu đó có thể được commit và tạo pull request ngay sau H1. Tuy nhiên, pull request này vẫn phải vượt qua các bước kiểm tra bắt buộc và H3 trước khi hợp nhất. Quyền bắt đầu triển khai mã sản phẩm, kích hoạt nhiệm vụ mới hoặc ghi nhận nợ kỹ thuật mới chỉ có hiệu lực sau khi pull request kích hoạt được hợp nhất vào `main`.

#### H2 — Kiểm tra mã trước khi commit

H2 là bước con người rà soát toàn bộ thay đổi cục bộ và các bằng chứng kiểm tra L1–L4 trước khi mã do AI tạo ra được commit.

Các mức bằng chứng L1–L4 gồm:

- **L1 — Kiểm tra tự động:** kết quả kiểm thử, build, quét bí mật, kiểm tra bảo mật, khả năng truy vết và CI.
- **L2 — Đối chiếu đặc tả:** chứng minh ID yêu cầu trong `SPEC.md` được liên kết với nhiệm vụ, mã nguồn và kiểm thử tương ứng.
- **L3 — Rà soát quy tắc và an toàn:** kiểm tra việc tuân thủ Hiến chương, phân quyền, xác thực, bảo mật, ghi nhật ký và phạm vi đã duyệt.
- **L4 — Xác nhận chấp nhận:** con người kiểm tra luồng thực tế qua giao diện hoặc API và ghi nhận rõ những rủi ro hay giới hạn môi trường còn lại.

Khi H2 đạt, nhóm được phép:

- Commit đúng tập thay đổi đã được rà soát.
- Đẩy nhánh lên kho mã nguồn từ xa.
- Tạo pull request ở trạng thái nháp.
- Chuyển pull request sang trạng thái sẵn sàng rà soát sau khi mọi kiểm tra bắt buộc đều đạt.

H2 chỉ xác nhận rằng mã cục bộ đủ điều kiện để đưa lên pull request. H2 không thay thế bước rà soát tích hợp cuối cùng và không cấp quyền hợp nhất.

#### H3 — Rà soát cuối cùng và quyết định hợp nhất

H3 được thực hiện sau khi pull request đã vượt qua các bước kiểm tra bắt buộc và nhánh vẫn đủ điều kiện hợp nhất. Tại H3, con người rà soát tác động tích hợp và quyết định có hợp nhất pull request hay không.

Sau khi hợp nhất, H3 cho phép theo dõi đúng lượt CI của commit đã hợp nhất và cập nhật các bằng chứng trong hồ sơ hoàn tất theo mẫu đã được duyệt. H3 áp dụng cho mọi loại pull request, gồm pull request quản trị, triển khai, chỉ bổ sung bằng chứng hoặc hoàn tất hồ sơ.

### Tần suất thực hiện

- H1 thực hiện một lần cho mỗi đợt công việc đã được phê duyệt.
- H2 thực hiện một lần cho mỗi pull request chứa mã do AI tạo ra hoặc bằng chứng bổ sung cho `SPEC.md`. Riêng phần tài liệu kích hoạt quản trị đã được H1 rà soát chính xác thì không cần lặp lại H2.
- H3 thực hiện một lần trước mỗi lần hợp nhất pull request.

### Vai trò trong quy trình

- **Trưởng nhóm tích hợp** (`Integration Lead`): phân chia công việc, xác định quyền sửa file, điều phối thứ tự thực hiện, tổng hợp kết quả và chuẩn bị pull request.
- **Tác nhân triển khai** (`Builder`): viết kiểm thử và mã nguồn cho phần việc được giao. Tại một thời điểm, chỉ một Builder được sửa các file mã nguồn sản phẩm dùng chung của phần việc hiện tại.
- **Tác nhân xác minh** (`Verifier`): kiểm tra độc lập kết quả của Builder và không được đồng thời sửa lại các file mà Builder đang phụ trách.

Nếu nhiều phần việc cần sử dụng cùng file `SPEC.md`, các tác nhân chỉ được đọc file đó song song. Trưởng nhóm tích hợp phải sắp xếp từng lượt chỉnh sửa để tránh ghi đè hoặc tạo nội dung mâu thuẫn.

### Khi nào phải dừng

Phải dừng quy trình và yêu cầu con người xử lý khi:

- Phạm vi hoặc yêu cầu chưa rõ ràng.
- Nhiều phần việc tạo ra thay đổi xung đột trong cùng file mã nguồn.
- Phát hiện thông tin bí mật bị lộ.
- Thay đổi làm mở rộng quyền truy cập, lược đồ cơ sở dữ liệu hoặc hợp đồng API ngoài phạm vi đã duyệt.
- Các tác nhân AI đang sử dụng những giả định không thống nhất.
- Một bước build, kiểm thử hoặc xác minh bắt buộc thất bại.

Với lỗi có thể tái hiện ổn định, chỉ được thử khắc phục tối đa ba lần trước khi báo cáo cho con người. Với lỗi kiểm thử E2E bị nghi là không ổn định (`flaky`), chỉ được chạy lại một lần và phải lưu bằng chứng của cả hai lần chạy.

Tài liệu quy định đầy đủ của chế độ này là `docs/superpowers/specs/2026-07-18-fast-track-hybrid-delivery-mode-design.md`.

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
