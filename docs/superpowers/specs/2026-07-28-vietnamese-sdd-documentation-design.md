# Thiết Kế Việt Hóa Toàn Bộ Tài Liệu SDD

Ngày: 2026-07-28

Trạng thái: Đã được người dùng phê duyệt phương án ngày 2026-07-28

Phạm vi nguồn: `.sdd/` tại commit `7bf76b5` trên `origin/main`

## 1. Mục Tiêu

Chuyển toàn bộ nội dung tài liệu Markdown trong `.sdd/` từ tiếng Anh sang tiếng Việt để nhóm SWP391 dễ đọc, thuyết trình, bảo vệ và bảo trì dự án. Bản dịch phải bảo toàn đầy đủ ý nghĩa nghiệp vụ, cấu trúc Spec-Driven Development, trạng thái phê duyệt và khả năng truy vết từ tài liệu sang mã nguồn và kiểm thử.

Đây là thay đổi ngôn ngữ trình bày, không phải thay đổi yêu cầu, thiết kế hệ thống hoặc hành vi phần mềm.

## 2. Phạm Vi

Phạm vi gồm toàn bộ 149 file Markdown trong `.sdd/`, tổng cộng 26.503 dòng tại commit nguồn:

| Nhóm | Số file | Số dòng | Nội dung |
| --- | ---: | ---: | --- |
| File cấp cao nhất | 3 | 812 | Constitution, shared context và test plan |
| `constraints/` | 3 | 60 | Ràng buộc toàn cục, nghiệp vụ và an toàn |
| `specs/` | 73 | 18.640 | Template và sáu tài liệu của mỗi FE01-FE12 |
| `rfcs/` | 6 | 657 | ADR và quyết định kiến trúc |
| `reviews/` | 63 | 6.324 | Biên bản review, validation và bằng chứng lịch sử |
| `skills/` | 1 | 10 | Hướng dẫn skill nội bộ |

Hai file `.gitkeep` không có nội dung cần dịch và không thuộc phạm vi sửa đổi.

## 3. Hợp Đồng Bảo Toàn Ngữ Nghĩa

### 3.1 Nội dung được dịch

- Tiêu đề, đoạn văn diễn giải, ghi chú và chú thích.
- Tên cột, tên hàng và nội dung ngôn ngữ tự nhiên trong bảng.
- Tên luồng nghiệp vụ, điều kiện trước, luồng chính, luồng thay thế và trường hợp biên.
- Mô tả business rule, functional requirement, acceptance criterion và non-functional requirement.
- Nội dung kế hoạch, nhiệm vụ, test plan, changelog, review, validation và ADR/RFC.
- Trạng thái tài liệu khi trạng thái đó chỉ là văn bản trình bày, với ý nghĩa tương đương bản tiếng Anh.

### 3.2 Nội dung phải giữ nguyên tuyệt đối

- Mọi định danh truy vết như `FE01`, `BR-*`, `FR-*`, `AC-*`, `NFR-*`, `DEC-*`, `ADR-*`, `TD-*`, `G1-G12`, `B1-B7` và mã test.
- Tên file, tên thư mục, đường dẫn tương đối, fragment liên kết và URL.
- Tên endpoint, phương thức HTTP, header, query parameter và field trong request/response.
- Tên bảng, cột, index, constraint, entity, class, function, biến và package.
- Giá trị enum hoặc literal được hệ thống sử dụng như `MEMBER`, `LIBRARIAN`, `ADMIN`, `APPROVED`, `PENDING`, `REJECTED` và mã lỗi.
- Nội dung trong code fence, inline code mang nghĩa kỹ thuật, JSON, SQL, JavaScript, lệnh shell và biểu thức chính quy.
- Số liệu, ngày tháng, phiên bản, commit, số PR, CI run và kết quả kiểm chứng lịch sử.
- Đích liên kết Markdown và cấu trúc bảng/list của tài liệu.

### 3.3 Nội dung không được thay đổi

- Business rule, phạm vi tính năng, actor permission và acceptance criterion.
- Trạng thái phê duyệt, trạng thái triển khai, version và `Last Updated` chỉ vì thao tác dịch.
- Quyết định kiến trúc, schema, API contract, security constraint hoặc test expectation.
- Các tuyên bố lịch sử trong changelog và review.

Nếu một câu tiếng Anh có nhiều cách hiểu làm thay đổi yêu cầu, quá trình dịch phải dừng tại câu đó, ghi rõ file và mục liên quan, rồi yêu cầu người dùng xác nhận. Không được tự chọn một cách hiểu có thể làm thay đổi hành vi hệ thống.

## 4. Thuật Ngữ Chuẩn

| Tiếng Anh | Bản dịch chuẩn |
| --- | --- |
| Guest | Khách |
| Member | Thành viên |
| Librarian | Thủ thư |
| Admin / Administrator | Quản trị viên |
| Book | Sách |
| Book copy | Bản sao sách |
| Borrow request | Yêu cầu mượn sách |
| Borrowing | Mượn sách |
| Return | Trả sách |
| Renewal | Gia hạn |
| Reservation | Đặt chỗ |
| Fine | Khoản phạt |
| Overdue fine | Phạt quá hạn |
| Business rule | Quy tắc nghiệp vụ |
| Functional requirement | Yêu cầu chức năng |
| Non-functional requirement | Yêu cầu phi chức năng |
| Acceptance criterion | Tiêu chí chấp nhận |
| Preconditions | Điều kiện tiên quyết |
| Main flow | Luồng chính |
| Alternative flow | Luồng thay thế |
| Edge case | Trường hợp biên |
| Out of scope | Ngoài phạm vi |
| Traceability | Khả năng truy vết |
| Source of truth | Nguồn chuẩn |

Khi thuật ngữ là enum hoặc định danh kỹ thuật, giữ nguyên dạng inline code và có thể dùng bản dịch tiếng Việt ở phần diễn giải, ví dụ: vai trò Thành viên (`MEMBER`).

## 5. Kiến Trúc Triển Khai Theo Lớp

### Lớp 1: Nền tảng và ràng buộc

Dịch `constitution.md`, `shared_context.md`, `test-plan.md` và ba file trong `constraints/`. Lớp này thiết lập thuật ngữ chuẩn cho các lớp còn lại.

### Lớp 2: Template và 12 bộ tài liệu chức năng

Dịch `_template.md`, sau đó xử lý lần lượt FE01-FE12. Mỗi feature được xem là một đơn vị hoàn chỉnh gồm `CONTEXT.md`, `SPEC.md`, `PLAN.md`, `TASKS.md`, `TEST_PLAN.md` và `CHANGELOG.md`.

Thứ tự ưu tiên trong từng feature là `CONTEXT.md` → `SPEC.md` → `PLAN.md` → `TASKS.md` → `TEST_PLAN.md` → `CHANGELOG.md`. Cách này giúp thuật ngữ và mã truy vết đi từ nguồn yêu cầu sang kế hoạch, nhiệm vụ và kiểm thử.

### Lớp 3: RFC và ADR

Dịch sáu file trong `rfcs/` sau khi thuật ngữ feature đã ổn định. Mọi tên kiến trúc, schema và API literal tiếp tục được giữ nguyên.

### Lớp 4: Review và bằng chứng lịch sử

Dịch 63 file trong `reviews/` theo thứ tự thời gian/tên file. Các claim, trạng thái PASS/FAIL, commit, PR và CI run phải giữ nguyên để tránh viết lại lịch sử dự án.

### Lớp 5: Skill nội bộ và kiểm tra toàn cục

Dịch file Markdown trong `skills/`, sau đó chạy toàn bộ kiểm tra bảo toàn cấu trúc và truy vết trên `.sdd/`.

## 6. Quy Trình Xử Lý Mỗi Lớp

1. Ghi lại baseline của file nguồn: số định danh, liên kết, code fence và bảng.
2. Dịch nội dung ngôn ngữ tự nhiên theo bảng thuật ngữ chuẩn.
3. So sánh bản dịch với baseline để phát hiện mất hoặc phát sinh định danh.
4. Kiểm tra liên kết và cấu trúc Markdown.
5. Quét phần tiếng Anh còn sót, loại trừ code, định danh và thuật ngữ kỹ thuật phải giữ nguyên.
6. Đọc chéo các câu có số liệu, điều kiện, phủ định, quyền actor và trạng thái để xác nhận ý nghĩa không đổi.
7. Chỉ chuyển sang lớp tiếp theo khi lớp hiện tại đạt các kiểm tra bắt buộc.

## 7. Xử Lý Lỗi Và Mơ Hồ

- Nếu mã truy vết bị thiếu hoặc thay đổi, khôi phục đúng mã nguồn trước khi tiếp tục.
- Nếu liên kết bị hỏng, giữ nguyên đích liên kết gốc và chỉ dịch nhãn hiển thị.
- Nếu code fence hoặc bảng bị hỏng cấu trúc, hoàn nguyên riêng phần đó rồi dịch lại.
- Nếu thuật ngữ chưa có trong bảng chuẩn nhưng không ảnh hưởng hành vi, bổ sung một bản dịch thống nhất và dùng xuyên suốt.
- Nếu câu mơ hồ liên quan business rule, actor permission, security, API, dữ liệu hoặc acceptance criterion, dừng và xin xác nhận thay vì suy đoán.
- Nếu tài liệu nguồn thay đổi trên `origin/main` trong lúc dịch, đánh giá diff và chỉ đồng bộ sau khi xác định không làm mất phần đã dịch.

## 8. Kiểm Chứng

Các kiểm tra bắt buộc trước khi xác nhận hoàn tất:

- `git diff --check` không báo lỗi khoảng trắng hoặc marker xung đột.
- Số lần xuất hiện của từng nhóm định danh truy vết trước và sau dịch phải bằng nhau.
- Không có định danh đã tồn tại bị đổi chính tả hoặc dịch sang tiếng Việt.
- Số code fence trong từng file không thay đổi và mọi fence đều đóng.
- Tất cả liên kết Markdown nội bộ vẫn trỏ tới file/fragment hợp lệ khi đích đã hợp lệ ở baseline.
- Script kiểm tra traceability hiện có của dự án vẫn chạy thành công.
- Quét tiếng Anh còn sót chỉ còn code, enum, tên riêng, tên công nghệ hoặc thuật ngữ đã được phép giữ nguyên.
- Kiểm tra thủ công tối thiểu các phần actor permission, business rules, acceptance criteria, security constraint và quyết định ADR.
- Diff cuối chỉ chứa `.sdd/**/*.md` cùng tài liệu thiết kế/kế hoạch được phê duyệt; không chứa thay đổi code ứng dụng của người dùng.

Không cần chạy bộ kiểm thử ứng dụng đầy đủ vì thay đổi không tác động runtime. Nếu script traceability hoặc link checker đọc trực tiếp nội dung Markdown và thất bại, lỗi phải được xử lý trước khi bàn giao.

## 9. Kiểm Soát Git Và Bàn Giao

- Công việc được thực hiện trên nhánh `docs/vietnamese-sdd` tạo từ `origin/main` mới nhất tại thời điểm bắt đầu.
- Checkout gốc có thay đổi code chưa commit không được sửa, stage hoặc commit.
- Mỗi lớp là một đơn vị review độc lập; commit chỉ thực hiện sau khi lớp đó vượt qua kiểm tra bắt buộc và được phép theo quy trình dự án.
- Bản dịch cuối phải kèm báo cáo file đã đổi, kiểm tra đã chạy, phần tiếng Anh cố ý giữ lại và mọi điểm cần người duyệt xác nhận.

## 10. Tiêu Chí Hoàn Thành

Công việc hoàn thành khi toàn bộ 149 file Markdown trong `.sdd/` thuộc phạm vi đã được Việt hóa theo hợp đồng này; cấu trúc Markdown, liên kết, code block, dữ kiện lịch sử và toàn bộ định danh truy vết được bảo toàn; các kiểm tra bắt buộc đạt yêu cầu; không có thay đổi runtime; và bản dịch đã được người dùng hoặc đại diện nhóm xác nhận không làm sai lệch ý nghĩa.
