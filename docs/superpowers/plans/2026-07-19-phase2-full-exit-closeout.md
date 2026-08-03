# Kế hoạch thực hiện kết thúc hoàn toàn giai đoạn 2

> **Đối với nhân viên đại lý:** BẮT BUỘC SUB-SKILL: Sử dụng siêu năng lực:thực thi các kế hoạch để thực hiện kế hoạch này theo từng nhiệm vụ. Các bước sử dụng cú pháp hộp kiểm (`- [ ]`) để theo dõi.

**Mục tiêu:** Đóng phạm vi Phát triển cốt lõi Giai đoạn 2 hoàn chỉnh sau khi đối chiếu FE01-FE12 và
FE02/FE10 OTP đã được hợp nhất, sau đó chuyển siêu dữ liệu của giai đoạn kho lưu trữ sang hoàn thiện
và Phân phối Giai đoạn 3.

**Kiến trúc:** Coi PR #40/#41 là bằng chứng chấp nhận và đối chiếu sản phẩm FE01-FE12 chuẩn và PR
#42-#44 là bằng chứng tiếp theo OTP chuẩn. Thêm siêu dữ liệu trạng thái triển khai rõ ràng để CI
phân biệt các đặc tả đã được phê duyệt với quá trình triển khai đã hoàn thành, điều chỉnh một cách
máy móc các nhãn đang chờ cấp chức năng cũ mà không cần viết lại các mục nhật ký thay đổi lịch sử và
thêm một bản ghi thoát Giai đoạn 2 liên kết bốn lớp xác thực với cam kết `main` cuối cùng.

**bộ công nghệ công nghệ:** Node.js CommonJS, trình chạy kiểm thử tích hợp sẵn của nút, tạo phẩm
Markdown SDD, hành động GitHub, bằng chứng xác thực Express/React/SQL Server.

## Ràng buộc toàn cầu

- Không có hành vi sản phẩm, hợp đồng API, lược đồ cơ sở dữ liệu, sự phụ thuộc, xác thực, ủy quyền hoặc thay đổi cấu hình thời gian chạy.
- Bảo toàn phạm vi FE01-FE12 đã được phê duyệt và mọi ranh giới trì hoãn/tương lai rõ ràng trong `TECH_DEBT.md`, `README.md`, các phần nằm ngoài phạm vi và `document/FinalRelease.md`.
- Không viết lại các báo cáo về lịch sử thay đổi; thêm mục thoát mới hơn khi phải làm rõ trạng thái hiện tại.
- `SPEC.md` vẫn là nguồn thông tin xác thực về yêu cầu; trạng thái triển khai thuộc về `TASKS.md` và đánh giá kết thúc Giai đoạn 2.
- Giai đoạn 2 chỉ hoàn thành sau khi các cổng cục bộ, PR CI, hợp nhất, `main` CI chính xác sau hợp nhất và kiểm tra trạng thái cũ đã vượt qua.

---

### Nhiệm vụ 1: Làm cho trạng thái triển khai trở nên rõ ràng và có thể kiểm thử được

**Tệp:**
- Tạo: `scripts/traceability-state.js`
- Tạo: `scripts/traceability-state.test.js`
- Sửa đổi: `scripts/check-traceability.js`
- Sửa đổi: `package.json`

**Giao diện:**
- Tiêu thụ: chức năng văn bản `TASKS.md`.
- Sản xuất: `parseImplementationState(text)` và `shouldEnforce(state)` cho `NOT_STARTED`, `PARTIAL`, `COMPLETE` và `DEFERRED`.

- [x] **Bước 1: Thêm lệnh kiểm tra tập trung**

Thêm `"test:traceability-state": "node --test scripts/traceability-state.test.js"` vào tập lệnh gốc.

- [x] **Bước 2: Viết kiểm thử trạng thái RED**

Bao gồm phân tích cú pháp tất cả bốn trạng thái hợp lệ, chỉ thực thi `PARTIAL`/`COMPLETE` và từ chối
siêu dữ liệu bị thiếu hoặc không hợp lệ.

- [x] **Bước 3: Chạy RED**

Chạy: `npm.cmd run test:traceability-state`

Dự kiến: THẤT BẠI vì `scripts/traceability-state.js` không tồn tại.

- [x] **Bước 4: Triển khai trình trợ giúp thuần túy**

Sử dụng một dòng `Implementation State:` được neo và xuất tập hợp trạng thái hợp lệ, trình phân tích
cú pháp và quyết định thực thi.

- [x] **Bước 5: Đi dây máy kiểm tra truy vết**

Thay thế phương pháp phỏng đoán `Status:` cấp cao nhất bằng phân tích cú pháp trạng thái triển khai
rõ ràng. Báo cáo `Implementation state`, không thực thi được siêu dữ liệu bị thiếu/không hợp lệ và
duy trì hoạt động của `--enforce` cộng với `--min=<n>`.

- [x] **Bước 6: Chạy GREEN**

Chạy:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
```

Dự kiến: các kiểm thử trợ giúp ĐẠT; truy vết ban đầu không thành công cho đến khi Nhiệm vụ 2 thêm
siêu dữ liệu vào tất cả các chức năng.

### Nhiệm vụ 2: Đối chiếu tất cả các gói chức năng với bằng chứng thoát khỏi Giai đoạn 2

**Tệp:**
- Sửa đổi: `.sdd/specs/feat-*/TASKS.md` cho tất cả 12 thư mục chức năng.
- Sửa đổi: `.sdd/specs/feat-*/PLAN.md` trong đó trạng thái cấp cao nhất vẫn cho biết con người/tích hợp/hợp nhất đang chờ xử lý.
- Sửa đổi: `.sdd/specs/feat-*/TEST_PLAN.md` trong đó trạng thái cấp cao nhất vẫn cho biết con người/tích hợp/hợp nhất đang chờ xử lý.
- Sửa đổi: `.sdd/specs/feat-*/CHANGELOG.md` bằng cách chỉ thêm mục thoát Giai đoạn 2 hiện tại khi gói chức năng vẫn hiển thị trạng thái đang chờ xử lý.

**Giao diện:**
- Tiêu thụ: Bằng chứng đối chiếu PR #40/#41 và bằng chứng PR #42-#44 OTP.
- Tạo ra: chính xác một dòng `Implementation State: COMPLETE` cho mỗi chức năng và văn bản trạng thái hiện tại trỏ đến đánh giá thoát chuẩn.

- [x] **Bước 1: Thêm siêu dữ liệu triển khai**

Chèn chính xác một dòng vào mỗi chức năng `TASKS.md`:

```text
Implementation State: COMPLETE
```

- [x] **Bước 2: Đóng các tác vụ tích hợp FE11 khỏi bằng chứng hiện có**

Đánh dấu hoàn thành `FE11-LIFE06`, `FE11-ACC01` và `FE11-FIN02`. Trích dẫn PR #40 hợp nhất
`1555111`, PR CI `29685838610` cuối cùng, `main` CI `29685953839`, bộ SQL `9/9` trực tiếp và các
kiểm thử `69/69`, trình duyệt `4/4` và gói chấp nhận của con người đã được phê duyệt.

- [x] **Bước 3: Chuẩn hóa tiêu đề trạng thái chức năng hiện tại**

Sử dụng `COMPLETE - PHASE 2 EXIT EVIDENCE RECORDED` cho các tiêu đề trạng thái PLAN/TASKS/TEST_PLAN
cấp cao nhất đang hoạt động. Bảo tồn các mục lịch sử chi tiết và ranh giới tương lai/hoãn lại rõ
ràng.

- [x] **Bước 4: Thêm các mục kết thúc nhật ký thay đổi hiện tại**

Đối với các chức năng bị ảnh hưởng, hãy thêm mục nhập ngày cho biết việc đối chiếu Giai đoạn 2 được
chấp nhận thông qua PR #40/#41. FE02 và FE10 còn trích dẫn thêm PR #42-#44 để hoàn thành OTP. Không
thay đổi các tuyên bố lịch sử cũ hơn.

- [x] **Bước 5: Xác minh tính nhất quán của siêu dữ liệu**

Chạy xác nhận PowerShell rằng tất cả 12 đối tượng đều chứa chính xác một dòng `triển khai trạng thái:
COMPLETE` và không có tiêu đề hiện tại nào chứa `HUMAN ... PENDING`, `INTEGRATION đang chờ` hoặc
`READY FOR REVIEW`.

### Nhiệm vụ 3: Chuyển bối cảnh dự án sang Giai đoạn 3

**Tệp:**
- Sửa đổi: `plan.md`
- Sửa đổi: `.agents/CLAUDE.md`
- Sửa đổi: `README.md`
- Sửa đổi: `TECH_DEBT.md` chỉ khi từ ngữ của giai đoạn hiện tại xung đột với quyết định thoát.
- Sửa đổi: `document/FinalRelease.md` chỉ khi trạng thái phát hành xung đột với quyết định thoát.

**Giao diện:**
- Tiêu thụ: siêu dữ liệu chức năng và bản ghi xác thực của Giai đoạn 2 đã hoàn thành.
- Tạo ra: một pha dòng điện ổn định: `Phase 3 - Polish and Delivery`.

- [x] **Bước 1: Thay thế văn bản kế hoạch gốc cũ**

Ghi lại Giai đoạn 2 là hoàn chỉnh và xác định các điểm kiểm tra của Giai đoạn 3: bằng chứng triển
khai/môi trường tiền sản xuất, cấu hình vận hành lâu bền, tính sẵn sàng của tài liệu/bản demo/bản
trình bày và hoàn thiện hiệu suất không chặn.

- [x] **Bước 2: Cập nhật bộ nhớ tác nhân**

Thay đổi giai đoạn hiện tại của `.agents/CLAUDE.md` thành Giai đoạn 3, giữ lại bằng chứng chính xác
của Giai đoạn 2 và duy trì các ranh giới bị trì hoãn như phân phối nhà cung cấp thực, giao diện
người dùng hộp thư thông báo, bộ nhớ hình đại diện lâu bền, SQL CI được chia sẻ và chia tách gói.

- [x] **Bước 3: Căn chỉnh trạng thái hướng tới dự án**

Đảm bảo `README.md` và trạng thái phát hành cuối cùng xác định Giai đoạn 2 là được chấp nhận và Giai
đoạn 3 là giai đoạn phân phối hiện tại mà không yêu cầu SLA sản xuất hoặc SMTP thực/bằng chứng môi
trường tiền sản xuất.

### Nhiệm vụ 4: Ghi lại và xác nhận việc thoát Giai đoạn 2

**Tệp:**
- Tạo: `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`

**Giao diện:**
- Tiêu thụ: đầu ra xác thực cục bộ, bằng chứng PR #40-#44, siêu dữ liệu đối tượng và các bản ghi ranh giới còn lại.
- Đưa ra: quyết định thoát khỏi Giai đoạn 2 chuẩn mực trên L1-L4.

- [x] **Bước 1: Chạy siêu dữ liệu và kiểm tra trạng thái cũ**

Xác minh tất cả 12 chức năng là `COMPLETE`, nhiệm vụ thoát FE11 đã được kiểm tra, `plan.md` và
`.agents/CLAUDE.md` đồng ý và không có nguồn hoạt động nào cho biết việc triển khai Giai đoạn 2 hoặc
quá trình tích hợp của con người vẫn đang chờ xử lý.

- [x] **Bước 2: Chạy cổng tự động**

Chạy:

```powershell
npm.cmd run test:traceability-state
npm.cmd run trace:enforce
npm.cmd --prefix backend test -- --runInBand
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:system
npm.cmd run test:deployment
npm.cmd run test:e2e
git diff --check
```

Nếu không có phần phụ thuộc cục bộ, hãy cài đặt từ lockfiles trước khi chạy cổng. Sử dụng các cổng
trình duyệt riêng biệt và không dừng các tiến trình không liên quan.

- [x] **Bước 3: Ghi lại tất cả bốn lớp xác thực**

Quá trình đánh giá phải ghi lại các hoạt động kiểm tra tự động L1, tuân thủ đặc tả/truy vết L2, tuân
thủ Hiến pháp/bảo mật/phạm vi L3 và sự chấp nhận của con người L4 cộng với PR/bằng chứng chính. Các
mục hoãn lại còn lại phải rõ ràng là không bị chặn và nằm ngoài Giai đoạn 2.

- [x] **Bước 4: Chạy kiểm tra phạm vi cuối cùng**

Xác nhận sự khác biệt chỉ chứa công cụ truy vết, tài liệu trạng thái/SDD và bản ghi thoát Giai đoạn
2; không có sản phẩm, lược đồ, API, phần phụ thuộc hoặc hành vi thời gian chạy nào thay đổi.

### Nhiệm vụ 5: Tích hợp và chốt mục tiêu

**Tệp:**
- Chỉ sửa đổi các tệp sửa lỗi đánh giá đã được phê duyệt nếu quá trình kiểm tra PR phát hiện ra lỗi thực sự.

- [x] **Bước 1: Cam kết và đẩy kết thúc đã xem xét**

Sử dụng các cam kết tập trung cho công cụ truy vết, siêu dữ liệu chức năng và bằng chứng kết thúc Giai đoạn 2.

- [x] **Bước 2: Mở PR thoát giai đoạn 2**

Cơ quan PR phải liệt kê các bằng chứng kinh điển, ranh giới trì hoãn, phạm vi hồ sơ đã thay đổi
chính xác và sự chấp thuận thường trực của con người.

- [x] **Bước 3: Yêu cầu PR CI và hợp nhất**

Chỉ hợp nhất sau khi CI được yêu cầu thành công.

- [x] **Bước 4: Yêu cầu chính xác sau khi hợp nhất `main` CI**

Ghi lại cam kết hợp nhất và lần chạy quy trình làm việc `main` thành công chính xác.

- [x] **Bước 5: Chạy kiểm tra kho lưu trữ cuối cùng**

Xác nhận `origin/main`, trạng thái PR, kết quả CI, siêu dữ liệu giai đoạn, trạng thái triển khai
chức năng, độ sạch của cây làm việc và không có từ ngữ đang chờ xử lý Giai đoạn 2 hoạt động nào.

- [x] **Bước 6: Hoàn thành mục tiêu**

Chỉ đánh dấu mục tiêu là hoàn thành khi tất cả các bước trước đó đều vượt qua và Giai đoạn 3 là giai
đoạn hiện tại duy nhất trong bối cảnh kho lưu trữ.
