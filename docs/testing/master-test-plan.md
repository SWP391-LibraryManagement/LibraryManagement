# Kế hoạch kiểm tra tổng thể - Hệ thống quản lý thư viện

Phiên bản: 0.3.0

Trạng thái: H1 GOVERNANCE ACTIVATION - APPROVED; AWAITING H3/hợp nhất

Cập nhật lần cuối: 2026-07-29

> Lưu ý chính sách chuẩn: chính sách kiểm tra chính thức cho dự án này hiện có trong `D:\SWP391\library-management-system\.sdd\test-plan.md`. Tài liệu này vẫn là tài liệu tham khảo kiểm thử mở rộng và không mâu thuẫn với `.sdd/test-plan.md` chuẩn.
---

## 1. Mục đích

Tài liệu này xác định kế hoạch kiểm thử cấp dự án cho Hệ thống quản lý thư viện SWP391.

Nó áp dụng hướng dẫn kiểm tra và xác thực từ cẩm nang Phát triển theo hướng đặc tả và theo hướng tác
nhân cho kho lưu trữ này:

- đặc tả xác định hành vi dự định;
- tiêu chí chấp nhận trở thành bằng chứng có thể kiểm chứng được;
- nhiệm vụ chỉ được thực hiện khi chúng có thể kiểm chứng được;
- việc triển khai và kiểm tra được tạo ra hoặc cập nhật cùng nhau;
- xác thực kiểm tra mã theo đặc tả trước khi hợp nhất;
- CI kiểm tra tự động hóa, trong khi con người xác minh sự tuân thủ đặc tả và bằng chứng demo.

Tài liệu này là tài liệu tham khảo kiểm thử mở rộng. Chính sách kiểm thử dự án chuẩn có trong
`.sdd/test-plan.md`. Nó không thay thế các tệp `SPEC.md`, `PLAN.md`, `TASKS.md` hoặc `CHANGELOG.md`
cấp chức năng.

---

## 2. Sắp xếp cẩm nang

cẩm nang không yêu cầu tệp có tên chính xác là `master-test-plan.md` nhưng nó liên tục yêu cầu các
hành vi kiểm thử/xác thực sau đây. Tài liệu này là tạo phẩm của dự án giúp làm rõ những hành vi đó.

| Hướng dẫn cẩm nang | Quy tắc dự án trong kế hoạch này |
| --- | --- |
| Tiêu chí chấp nhận phải có thể kiểm chứng được. | Mỗi AC mới hoặc đã thay đổi phải ánh xạ tới ít nhất một mục bằng chứng kiểm tra tự động hoặc thủ công. |
| Các mục TASKS.md phải được kiểm chứng. | Mỗi nhiệm vụ thực hiện nên bao gồm các tiêu chí đã thực hiện và các kiểm thử dự kiến. |
| Việc triển khai generate/cập nhật cần tiến hành đồng thời các kiểm thử. | Mã PR phải bao gồm các kiểm thử liên quan trừ khi có ngoại lệ được ghi lại. |
| Xác thực so sánh đặc tả, mã và kiểm tra. | Sử dụng ma trận nhất quán trong phần 9 trước khi hợp nhất. |
| Cổng xác thực có các bước kiểm tra tự động cộng với việc tuân thủ đặc tả và bản demo chấp nhận. | Sử dụng cổng hợp nhất bốn lớp ở phần 10. |
| Chỉ vượt qua các kiểm thử là không đủ. | Cần phải có CI nhưng chưa đủ; người đánh giá phải kiểm tra phạm vi và sự tuân thủ đặc tả. |
| Thay đổi mã mà không yêu cầu đồng bộ lại đặc tả là nợ kỹ thuật. | Những thay đổi về hành vi phải cập nhật spec/changelog/tasks. |

---

## 3. Tài liệu nguồn có thẩm quyền

Việc kiểm tra phải tuân theo các tạo phẩm kho lưu trữ sau:

- `D:\SWP391\library-management-system\.sdd\constitution.md`
- `D:\SWP391\library-management-system\.sdd\shared_context.md`
- `D:\SWP391\library-management-system\.sdd\constraints\global.md`
- `D:\SWP391\library-management-system\.sdd\constraints\business.md`
- `D:\SWP391\library-management-system\.sdd\constraints\safety.md`
- `D:\SWP391\library-management-system\.agents\AGENTS.md`
- `D:\SWP391\library-management-system\.agents\CLAUDE.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\SPEC.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\PLAN.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\TASKS.md`
- `D:\SWP391\library-management-system\.sdd\specs\feat-{name}\CHANGELOG.md`

Khi mã và đặc tả không đồng nhất, các quy tắc của dự án coi đặc tả là nguồn chuẩn trừ khi
đặc tả đó được cập nhật và xem xét.

---

## 4. Phạm vi kiểm tra

### 4.1 Trong phạm vi

Kế hoạch tổng thể này bao gồm việc kiểm thử chức năng Giai đoạn 1:

| ID chức năng | Tên chức năng | Ghi chú Rủi ro |
| --- | --- | --- |
| FE01 | Công khai / Duyệt | Tính chính xác của search/display công khai |
| FE02 | Xác thực | Bảo mật quan trọng |
| FE03 | Hồ sơ người dùng | Xử lý dữ liệu cá nhân |
| FE04 | Quản lý thành viên | Phụ thuộc điều kiện đủ để mượn sách |
| FE05 | Quản lý sách | Tính toàn vẹn dữ liệu danh mục |
| FE06 | Quản lý kho / bản sao sách | Khả năng sẵn có và phụ thuộc trạng thái bản sao |
| FE07 | Quản lý lượt mượn | quy tắc nghiệp vụ cốt lõi |
| FE08 | Quản lý đặt chỗ | Quy tắc xếp hàng và đủ điều kiện |
| FE09 | Quản lý khoản phạt | Quy tắc tính toán Money/khoản phạt |
| FE10 | Quản lý thông báo | Tải trọng thông báo và kênh email an toàn |
| FE11 | Quản lý người dùng & vai trò | Ủy quyền quan trọng |
| FE12 | Báo cáo và thống kê | Tính chính xác và quyền riêng tư tổng hợp |

### 4.2 Ngoài phạm vi của dự thảo này

Những điều sau đây chưa được triển khai đầy đủ trong kho lưu trữ và được theo dõi dưới dạng các khoảng trống:

- ngưỡng bảo hiểm bắt buộc trong CI;
- tự động hóa trình duyệt E2E;
- kiểm tra thành phần lối vào;
- cơ sở dữ liệu kiểm thử SQL Server giống như sản xuất;
- kiểm thử performance/load;
- kiểm thử thâm nhập;
- tự động hóa kiểm thử thao tác ghi.

Đây là những mục cần củng cố trong tương lai, không phải là lý do để hợp nhất các hành vi cốt lõi bị
hỏng hoặc chưa được kiểm tra.

---

## 5. Yêu cầu kiểm tra mục tiêu

Trạng thái mục tiêu tuân theo các kỳ vọng kiểm thử kiểu capstone của cẩm nang, được điều chỉnh cho
phù hợp với dự án Node.js + Express + React + SQL Server này.

### 5.1 Quy tắc phổ quát

- Các kiểm thử hiện tại phải vượt qua trước khi hợp nhất.
- Không có kiểm thử nào có thể bị bỏ qua, làm suy yếu hoặc bị xóa chỉ để vượt qua PR.
- Các quy tắc nghiệp vụ cốt lõi phải có các kiểm thử tự động.
- Mọi điểm cuối được bảo vệ đều phải có kiểm tra xác thực và ủy quyền.
- Đường dẫn phù hợp, đường dẫn lỗi, giá trị biên và các trường hợp biên quan trọng phải được đề cập.
- Các kiểm thử không được sử dụng bí mật thực, thông tin xác thực sản xuất hoặc dữ liệu cá nhân thực.
- Các kiểm thử nhạy cảm với ngày phải sử dụng đồng hồ cố định hoặc ngày xác định.
- Các kiểm thử phải được truy nguyên theo ID chức năng và tiêu chí chấp nhận đặc tả.

### 5.2 Mục tiêu máy chủ

- Kiểm thử đơn vị cho logic dịch vụ/nghiệp vụ.
- Kiểm thử tích hợp/API cho các điểm cuối REST, bao gồm luồng thành công và luồng lỗi chính.
- Kiểm tra tích hợp nhiều chức năng khi một chức năng kích hoạt hoặc phụ thuộc vào chức năng khác.
- Mục tiêu vùng phủ sóng: ít nhất 80 phần trăm cho mã mới sau khi bật công cụ vùng phủ sóng.
- Cơ sở dữ liệu kiểm thử SQL Server nên được xem xét cho các kiểm thử tích hợp có độ chính xác cao sau này. Các kiểm thử trong bộ nhớ hiện tại phù hợp cho phản hồi nhanh ở Giai đoạn 1 nhưng không thay thế hoàn toàn kiểm thử tích hợp có cơ sở dữ liệu hỗ trợ.

### 5.3 Mục tiêu giao diện người dùng

- kiểm tra mã và bản dựng phải vượt qua.
- Cần phải kiểm tra giao diện người dùng thủ công cho mỗi PR đối mặt với người dùng.
- hooks/utilities phức tạp phải có các kiểm thử tự động sau khi công cụ kiểm tra giao diện người dùng được thống nhất.
- Các luồng quan trọng hướng tới người dùng sau này sẽ có các kiểm thử E2E.

### 5.4 Mục tiêu an toàn

- Không có bí mật trong kiểm thử, fixture, ảnh chụp màn hình, log hoặc commit.
- Phản hồi lỗi không được để lộ dấu vết bộ công nghệ cho khách hàng.
- Quy tắc ủy quyền phải được kiểm tra ở phía máy chủ.
- Kiểm tra thông báo phải xác minh hành vi tải trọng an toàn đối với dữ liệu nhạy cảm.

---

## 6. Quy trình lập kế hoạch kiểm thử cho mỗi chức năng

Đối với mỗi chức năng hoặc thay đổi có ý nghĩa, việc kiểm tra phải tuân theo cùng một quy trình SDD.

### Bước 1 - SPEC.md Xác định hành vi có thể kiểm tra

Trước khi mã hóa, hãy xác nhận `SPEC.md` có liên quan chứa:

- quy chế kinh doanh có ID ổn định;
- yêu cầu chức năng;
- tiêu chí chấp nhận;
- Mẫu unwanted/error;
- trường hợp cạnh;
- các mục ngoài phạm vi;
- ma trận truy vết.

Nếu một hành vi dự kiến không có trong đặc tả, trước tiên hãy cập nhật đặc tả hoặc ghi lại rằng thay
đổi nằm ngoài phạm vi.

### Bước 2 - PLAN.md Bao gồm chiến lược kiểm thử

Mỗi chức năng hoạt động `PLAN.md` phải nêu rõ:

- những kiểm thử đơn vị nào là cần thiết;
- những kiểm thử API/integration nào là cần thiết;
- cần kiểm tra giao diện người dùng thủ công nào;
- rủi ro quan trọng và các trường hợp nguy hiểm;
- yêu cầu dữ liệu kiểm thử;
- phụ thuộc hoặc mocks/kiểm thử tăng gấp đôi.

### Bước 3 - TASKS.md giúp công việc có thể được xác minh

Mỗi nhiệm vụ thực hiện nên bao gồm:

- ID nhiệm vụ;
- tập tin cần thay đổi;
- tài liệu tham khảo đặc tả;
- sự phụ thuộc;
- tiêu chí thực hiện;
- kiểm tra dự kiến hoặc xác minh thủ công.

Một nhiệm vụ quá mơ hồ nếu người đánh giá không thể biết được kiểm thử nào chứng tỏ nó đã được thực hiện.

### Bước 4 - Triển khai mã và kiểm tra cùng nhau

PR triển khai nên bao gồm mã và các kiểm thử cùng nhau khi hành vi thay đổi.

Thiết kế kiểm thử dự kiến:

- kiểm tra con đường hạnh phúc;
- kiểm tra mẫu error/unwanted;
- kiểm tra giá trị biên;
- Các kiểm thử vai trò/permission;
- kiểm tra chức năng chéo khi áp dụng.

### Bước 5 - Xác thực đặc tả đối với mã và kiểm tra

Trước khi hợp nhất, hãy chạy Cổng xác thực trong phần 10 và ghi lại bằng chứng trong PR.

---

## 7. Tiêu chuẩn thiết kế kiểm thử

### 7.1 Đặt tên

Tên kiểm thử phải mô tả hành vi chứ không phải chi tiết triển khai.

Các mẫu ưa thích:

```text
<actor/action> <condition> <expected result>
```

Ví dụ:

```text
thành viên chỉ tạo yêu cầu đang chờ cho các bản sao sẵn có, không trùng lặp
thủ thư phê duyệt yêu cầu và thành viên chỉ thấy lịch sử của mình
từ chối biến mẫu bị thiếu và che dữ liệu mã thông báo đặt lại mật khẩu
```

### 7.2 BDD / Phong cách cho trước

Đối với các kiểm thử thủ công, kiểm thử E2E hoặc các kiểm thử tích hợp phức tạp, hãy sử dụng tư duy
Cho trước khi nào:

```text
Cho trước một thành viên đã được phê duyệt
Khi thành viên yêu cầu một bản sao sẵn có
Thì hệ thống tạo một yêu cầu mượn đang chờ xử lý
```

Điều này phản ánh ý tưởng của cẩm nang rằng các tiêu chí chấp nhận phải được kiểm tra trực tiếp.

### 7.3 Các loại kịch bản bắt buộc

Đối với mỗi chức năng không tầm thường, hãy bao gồm các tình huống có liên quan từ danh sách này:

| Loại kịch bản | Bắt buộc Khi nào |
| --- | --- |
| Con đường hạnh phúc | Luôn luôn thực hiện hành vi |
| Lỗi xác thực | Đầu vào của người dùng có thể không hợp lệ |
| Lỗi ủy quyền | điểm cuối/hành động được bảo vệ |
| Giá trị biên | Có tồn tại giới hạn, ngày tháng, số tiền, số lượng hoặc độ dài |
| Chuyển đổi trạng thái | Thực thể có các trạng thái như đang chờ/approved/returned |
| chức năng chéo | chức năng kích hoạt hành vi thông báo, khoản phạt, báo cáo, kiểm kê hoặc xác thực |
| Bảo vệ ngoài phạm vi | Có nguy cơ xảy ra lỗi chức năng hoặc hành vi trái phép |
| Kiểm tra hồi quy | Sửa lỗi thay đổi hành vi |

---

## 8. Cấp độ kiểm tra

| Cấp độ | Mục đích | Vị trí hiện tại | Tình trạng hiện tại |
| --- | --- | --- | --- |
| Kiểm tra đơn vị | Xác minh logic utility/service | `backend/tests/*.test.js` | Trình bày cho các mô-đun đã chọn |
| Kiểm tra API/tuyến | Xác minh điểm cuối REST và kiểm tra vai trò | `backend/tests/*Routes.test.js` | Trình bày một số chức năng máy chủ |
| Kiểm tra tích hợp nhiều chức năng | Xác minh luồng chức năng này sang chức năng khác | `backend/tests/integration.test.js` | Hiện tại |
| Kiểm tra kiểm tra mã/bản dựng giao diện người dùng | Xác minh chất lượng mã lối vào và bản dựng | `frontend/` qua CI | Hiện tại |
| Kiểm tra giao diện người dùng thủ công | Xác minh hành vi giao diện người dùng một cách trực quan | Phần 14 của tài liệu này | Cần thiết để thay đổi giao diện người dùng |
| Kiểm tra hợp đồng/API | Xác minh khả năng tương thích hợp đồng API | Chưa chính thức | Khoảng trống |
| Kiểm tra E2E | Xác minh luồng người dùng cấp trình duyệt | Chưa được tạo | Tương lai |
| Kiểm tra thao tác ghi/adversarial | Thử thách chất lượng bộ kiểm thử | Chưa được tạo | Tương lai |

---

## 9. Ma trận nhất quán

Trước khi hợp nhất tác phẩm chức năng, người đánh giá nên kiểm tra tính nhất quán của tạo tác.

| Kiểm tra | Câu hỏi | Bằng chứng |
| --- | --- | --- |
| SPEC so với PLAN | Kế hoạch có thực hiện được các yêu cầu đã được phê duyệt không? | Các phần `PLAN.md` liên quan |
| SPEC so với TASKS | Mọi tác vụ triển khai có tham chiếu đến đặc tả không? | Các hàng `TASKS.md` liên quan |
| SPEC so với CODE | Mã có triển khai hành vi được yêu cầu và tránh hành vi ngoài phạm vi không? | Đánh giá khác biệt và tập tin nguồn |
| SPEC so với TESTS | Mỗi tiêu chí chấp nhận có bằng chứng kiểm tra tự động hoặc thủ công không? | Kiểm tra các tập tin và danh sách kiểm tra thủ công |
| PLAN so với TASKS | Mỗi thành phần được lên kế hoạch có nhiệm vụ không? | So sánh `PLAN.md` và `TASKS.md` |
| PLAN so với CODE | Mã có tuân theo kiến ​​trúc đã chọn không? | Cấu trúc tệp nguồn và các phụ thuộc |
| CODE so với TESTS | Các kiểm thử có xác minh hành vi hơn là tai nạn thực hiện không? | Đánh giá kiểm thử và kết quả chạy thử |

Quy tắc tối thiểu:

```text
Không có mã nguồn mồ côi. Không có yêu cầu đặc tả mồ côi. Không có kiểm thử mồ côi.
```

Ý nghĩa:

- mã phải truy nguyên spec/Nhiệm vụ đã được phê duyệt;
- các yêu cầu về đặc tả sẽ theo dõi tới mã nguồn/tests hoặc trạng thái đang chờ xử lý được ghi lại;
- các kiểm thử nên theo dõi hành vi dự kiến chứ không phải việc thực hiện ngẫu nhiên.

---

## 10. Cổng xác thực trước khi hợp nhất

Cổng xác thực bắt đầu khi việc triển khai được xác nhận là đã hoàn tất. Nó không phải là tùy chọn.

### L1 - Kiểm tra tự động

- [ ] Kiểm tra máy chủ vượt qua.
- [ ] giao diện kiểm tra mã đi qua.
- [ ] Thẻ xây dựng giao diện.
- [ ] CI vượt qua.
- [ ] Không có kiểm thử nào bị bỏ qua mà không có sự chấp thuận bằng văn bản.
- [ ] Không có kiểm thử hiện tại nào bị yếu đi để vượt qua PR.

Lệnh:

```powershell
npm.cmd --prefix backend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
node scripts/check-traceability.js
```

### L2 - Tuân thủ đặc tả

- [ ] `SPEC.md` liên quan đã được đọc.
- [ ] `PLAN.md` và `TASKS.md` liên quan đã được kiểm tra.
- [ ] Việc thực hiện phù hợp với phạm vi đã được phê duyệt.
- [ ] Hành vi ngoài phạm vi không được thêm vào.
- [ ] Tiêu chí chấp nhận được thỏa mãn.
- [ ] Các mẫu Error/unwanted được xử lý.
- [ ] Cập nhật thay đổi hành vi tài liệu spec/changelog/Nhiệm vụ.

### L3 - Tuân thủ Hiến pháp và An toàn

- [ ] Không có bí mật, mã thông báo, thông tin xác thực hoặc dữ liệu cá nhân thực sự nào được cam kết.
- [ ] Xác thực đầu vào phía máy chủ được giữ nguyên.
- [ ] Quyền truy cập dựa trên vai trò được thực thi ở phần máy chủ.
- [ ] Dấu vết bộ công nghệ nội bộ không được hiển thị cho người dùng.
- [ ] bộ công nghệ được phê duyệt không thay đổi trừ khi có bản cập nhật RFC/spec.
- [ ] Các phần phụ thuộc không được thêm vào mà không có lý do chính đáng.

### L4 - Bản trình diễn tiêu chí chấp nhận

- [ ] Luồng người dùng cốt lõi được thể hiện hoặc xác minh thủ công.
- [ ] Thay đổi giao diện người dùng được kiểm tra trong trình duyệt.
- [ ] Bằng chứng về danh sách kiểm tra thủ công được ghi lại khi các kiểm thử tự động không bao gồm giao diện người dùng.
- [ ] Những khoảng trống còn lại trong kiểm thử được liệt kê trong ghi chú PR hoặc các nhiệm vụ tiếp theo.

Đừng kết hợp với lời giải thích "gần như đã xong". Một chức năng chỉ có thể được đánh dấu là hoàn
chỉnh khi có bằng chứng cổng yêu cầu hoặc các lỗ hổng được trưởng nhóm chấp nhận rõ ràng.

---

## 11. Khoảng không quảng cáo kiểm thử tự động hiện tại

Các tệp kiểm tra tự động máy chủ hiện tại:

| Tệp kiểm thử | Bảo hiểm chính |
| --- | --- |
| `backend/tests/app.test.js` | Nền tảng ứng dụng và hành vi sức khỏe |
| `backend/tests/authRoutes.test.js` | Xác thực FE02 Luồng API |
| `backend/tests/authUtils.test.js` | Logic tiện ích xác thực FE02 |
| `backend/tests/borrowingRoutes.test.js` | FE07 mượn API và các quy tắc nghiệp vụ |
| `backend/tests/fineRoutes.test.js` | FE09 phạt API và các quy tắc nghiệp vụ |
| `backend/tests/integration.test.js` | Luồng FE02/FE07/FE08/FE09/FE10/FE12 đa chức năng |
| `backend/tests/models.test.js` | Kiểm tra cấp độ mô hình máy chủ |
| `backend/tests/notificationInboxMigration.test.js` | Hợp đồng di chuyển lược đồ/backfill/index phụ gia FE10 và idempotence |
| `backend/tests/notificationInboxRepository.test.js` | FE10 SQL hoạt động sở hữu, danh sách cho phép, phân trang, đếm và trạng thái đọc |
| `backend/tests/notificationRoutes.test.js` | Thông báo FE10 API và hành vi an toàn |
| `backend/tests/profileRoutes.test.js` | Hồ sơ người dùng FE03 Hành vi API |
| `backend/tests/profileService.test.js` | Hành vi dịch vụ hồ sơ FE03 |
| `backend/tests/reportRoutes.test.js` | FE12 báo cáo API và tổng hợp |
| `backend/tests/reservationRoutes.test.js` | đặt chỗ FE08 API và các quy tắc nghiệp vụ |
| `backend/tests/userManagementRoutes.test.js` | Quản lý vai trò và người dùng FE11 Hành vi API |

---

## 12. Ma trận bao phủ chức năng

| chức năng | Kiểm tra máy chủ tự động | giao diện / Bằng chứng thủ công | Trạng thái |
| --- | --- | --- | --- |
| FE01 Công khai / Duyệt | Chưa được xác định | Cần kiểm tra thủ công UI/API | Khoảng trống |
| Xác thực FE02 | `authRoutes.test.js`, `authUtils.test.js`, `integration.test.js` | Kiểm tra thủ công giao diện đăng nhập/đăng ký/đặt lại mật khẩu | Backend được bao phủ; cần có bằng chứng UI |
| Hồ sơ người dùng FE03 | `profileRoutes.test.js`, `profileService.test.js` | Kiểm tra thủ công giao diện hồ sơ | Backend được bao phủ; cần có bằng chứng UI |
| Quản lý thành viên FE04 | Chưa được xác định | Cần kiểm tra thủ công UI/API | Khoảng trống |
| Quản lý sách FE05 | Chưa được xác định | Cần kiểm tra thủ công UI/API | Khoảng trống |
| FE06 Kho / Bản sao sách | Chưa xác định | Cần kiểm tra thủ công giao diện quản lý kho | Khoảng trống |
| Quản lý mượn sách FE07 | `borrowingRoutes.test.js`, `integration.test.js` | Kiểm tra thủ công giao diện mượn sách | Backend được bao phủ; cần có bằng chứng UI |
| Quản lý đặt chỗ FE08 | `reservationRoutes.test.js`, `integration.test.js` | Kiểm tra thủ công giao diện đặt chỗ | Backend được bao phủ; cần có bằng chứng UI |
| FE09 Quản lý khoản phạt | `fineRoutes.test.js`, `integration.test.js` | Kiểm tra thủ công luồng khoản phạt | Backend được bao phủ; cần có bằng chứng UI |
| Quản lý thông báo FE10 | `notificationInboxMigration.test.js`, `notificationInboxRepository.test.js`, `notificationRoutes.test.js`, `integration.test.js` | `frontend/test/notificationInboxFrontend.test.js`, `frontend/test/appShellFrontend.test.js` và `tests/e2e/fe10-notification-inbox.spec.js` bao gồm Thành viên/Thủ thư/Quản trị viên, giao diện người dùng phản hồi, quyền riêng tư, trạng thái bộ lọc/đã đọc và điều hướng lỗi an toàn | Đầu PR #75 `778e0a4` đã vượt qua đầu chính xác CI `30317424995` và môi trường tiền sản xuất Azure `30317621429`, nhận được H3 hai trục sạch và phê duyệt rõ ràng, sau đó được hợp nhất thành `b75776b`; CI `30341279111` sau hợp nhất và Môi trường tiền sản xuất Azure tự động đã vượt qua |
| FE11 Quản lý vai trò và người dùng | `userManagementRoutes.test.js` | Kiểm tra thủ công giao diện người dùng/vai trò nếu được triển khai | Backend được bao phủ |
| Báo cáo và thống kê FE12 | `reportRoutes.test.js`, `integration.test.js` | Kiểm tra thủ công giao diện báo cáo | Backend được bao phủ; cần có bằng chứng UI |

---

## 13. Lệnh chuẩn

Chạy tất cả các kiểm thử máy chủ:

```powershell
npm.cmd --prefix backend test
```

Chỉ chạy kiểm thử tích hợp:

```powershell
npm.cmd --prefix backend test -- integration
```

Chạy kiểm tra mã giao diện người dùng:

```powershell
npm.cmd --prefix frontend run lint
```

Xây dựng giao diện người dùng:

```powershell
npm.cmd --prefix frontend run build
```

Chạy bộ chấp nhận trình duyệt FE10:

```powershell
npx.cmd playwright test tests/e2e/fe10-notification-inbox.spec.js --project=chromium
```

Chạy báo cáo truy vết:

```powershell
node scripts/check-traceability.js
```

---

## 14. Danh sách kiểm tra giao diện người dùng thủ công

Sử dụng danh sách kiểm tra này để thay đổi giao diện người dùng trước khi hợp nhất.

### 14.1 Giao diện người dùng chung

- [ ] Tải trang mà không gặp lỗi hỏng bảng điều khiển.
- [ ] Bố cục có thể đọc được trên máy tính để bàn.
- [ ] Các hành động chính có thể nhìn thấy được và dễ hiểu.
- [ ] Các nút và liên kết có nhãn rõ ràng.
- [ ] Các trạng thái trống, đang tải và lỗi đều được xử lý.
- [ ] Biểu mẫu bảo toàn thông tin đầu vào của người dùng khi thích hợp.
- [ ] Thông báo thành công và lỗi là điều dễ hiểu.

### 14.2 Khái niệm cơ bản về trợ năng

- [ ] Đầu vào có nhãn.
- [ ] Điều hướng bằng bàn phím hoạt động cho các điều khiển chính.
- [ ] Các trạng thái tiêu điểm có thể nhìn thấy được.
- [ ] Độ tương phản màu sắc có thể chấp nhận được.
- [ ] Bảng có tiêu đề có thể đọc được.
- [ ] Biểu tượng không phải là cách duy nhất để hiểu một hành động.

### 14.3 FE07 Giao diện người dùng mượn

- [ ] Danh sách yêu cầu mượn hiển thị chính xác.
- [ ] Phù hiệu trạng thái rõ ràng.
- [ ] Các luồng tạo, phê duyệt, từ chối và trả sách hiển thị phản hồi chính xác.
- [ ] Người dùng trái phép không thể truy cập các hành động chỉ dành cho nhân viên.

### 14.4 FE08 Giao diện người dùng đặt chỗ

- [ ] Danh sách đặt chỗ hiển thị chính xác.
- [ ] Thông tin Queue/trạng thái có thể đọc được.
- [ ] Hành động Cancel/process hiển thị phản hồi chính xác.
- [ ] Các trạng thái lỗi được xử lý.

### 14.5 FE12 Giao diện người dùng báo cáo

- [ ] Bộ lọc báo cáo hoạt động.
- [ ] Thẻ và bảng tóm tắt hiển thị chính xác.
- [ ] Dữ liệu báo cáo trống không phá vỡ bố cục.
- [ ] Các hành động Export/refresh, nếu có, sẽ hoạt động chính xác.

---

## 15. Chiến lược dữ liệu kiểm thử

Kiểm tra tự động nên sử dụng dữ liệu kiểm tra xác định:

- kho lưu trữ trong bộ nhớ để kiểm tra tuyến/service máy chủ nhanh;
- người dùng giả mạo có địa chỉ kiểu `example.test` hoặc `example.com`;
- không có dữ liệu thực về sinh viên, thủ thư hoặc sản xuất;
- không có thông tin xác thực SMTP/cơ sở dữ liệu thực sự;
- đồng hồ cố định nơi kiểm tra logic nhạy cảm với ngày;
- các đồ đạc tập trung nhỏ thay vì các bãi chứa dữ liệu mờ đục lớn.

Hạn chế đã biết:

- Các kiểm thử trong bộ nhớ rất nhanh và hữu ích nhưng chúng không chứng minh đầy đủ hành vi của SQL Server lược đồ/truy vấn. Thêm các kiểm thử tích hợp được DB hỗ trợ sau khi thiết lập cơ sở dữ liệu kiểm thử được thống nhất.

---

## 16. Quy tắc đồng bộ hóa ngược

Nếu việc triển khai thay đổi hành vi theo cách ảnh hưởng đến đặc tả, hãy cập nhật các thành phần đặc
tả trước hoặc cùng với thay đổi mã.

Cần phải đồng bộ lại khi:

- một hotfix thay đổi hành vi lỗi;
- một bộ tái cấu trúc thay đổi hình dạng dữ liệu hoặc hình dạng phản hồi API;
- một bản vá bảo mật thay đổi luồng xác thực;
- thay đổi UI/API thêm hành vi không được mô tả trong đặc tả;
- một kiểm thử cho thấy đặc tả không rõ ràng hoặc sai.

Các tệp cập nhật bắt buộc có thể bao gồm:

- liên quan `SPEC.md`;
- liên quan `PLAN.md`;
- liên quan `TASKS.md`;
- liên quan `CHANGELOG.md`;
- kế hoạch kiểm tra tổng thể này nếu chính sách kiểm tra toàn dự án thay đổi.

---

## 17. Báo cáo lỗi

Khi phát hiện lỗi, ghi lại:

- ID chức năng;
- hành vi dự kiến từ `SPEC.md`;
- hành vi thực tế;
- các bước sinh sản;
- mức độ nghiêm trọng;
- tệp/screens bị ảnh hưởng;
- trường hợp kiểm thử được thêm vào hoặc thực hiện xác minh thủ công;
- được liên kết PR/bản ghi Git.

Mức độ nghiêm trọng:

| Mức độ nghiêm trọng | Ý nghĩa |
| --- | --- |
| Quan trọng | Sự cố bảo mật, mất dữ liệu hoặc hệ thống không sử dụng được |
| Cao | Luồng kinh doanh cốt lõi bị hỏng |
| Trung bình | Quy trình làm việc quan trọng bị xuống cấp |
| Thấp | Vấn đề về mỹ phẩm hoặc vấn đề nhỏ |

Quy tắc sửa lỗi:

- Xác định nguyên nhân gốc rễ đầu tiên.
- Thêm hoặc cập nhật kiểm thử hồi quy khi khả thi.
- Chạy bộ kiểm tra bị ảnh hưởng và bộ kiểm tra máy chủ đầy đủ trước khi hợp nhất.

---

## 18. Cổng CI hiện tại

Quy trình làm việc CI hiện tại là:

`D:\SWP391\library-management-system\.github\workflows\ci.yml`

Kiểm tra CI hiện tại:

- cài đặt phụ thuộc gốc;
- chạy báo cáo truy vết đặc tả;
- cài đặt phụ thuộc máy chủ;
- cài đặt phụ thuộc lối vào;
- chạy kiểm thử máy chủ;
- chạy kiểm tra mã giao diện người dùng;
- xây dựng giao diện người dùng;
- chạy kiểm tra nhập tình trạng máy chủ.

Việc thông qua CI không thay thế sự đánh giá của con người. CI xác minh các điều kiện tự động; người
đánh giá vẫn xác minh phạm vi, sự tuân thủ đặc tả và bằng chứng tiêu chí chấp nhận.

---

## 19. Những khoảng trống đã biết và nhiệm vụ tiếp theo

| Khoảng trống | Tại sao nó lại quan trọng | Hành động được đề xuất |
| --- | --- | --- |
| Chưa có ngưỡng bảo hiểm được thực thi | Mục tiêu của cẩm nang là phạm vi có thể đo lường được cho logic nghiệp vụ | Thêm tập lệnh bảo hiểm Jest và ngưỡng đồng ý |
| Phạm vi bảo hiểm tự động của giao diện không đồng đều bên ngoài các luồng quan trọng hiện tại | Hồi quy giao diện người dùng có thể vượt qua kiểm tra chỉ thủ công | Mở rộng chức năng của bộ giao diện người dùng và Playwright hiện có theo chức năng |
| Trình duyệt E2E chưa bao gồm mọi chức năng | Một số hành trình vẫn là bằng chứng API/manual | Mở rộng Playwright ra ngoài luồng nghiệp vụ chuẩn và hộp thư đến FE10 theo yêu cầu ưu tiên |
| Vùng phủ sóng được hỗ trợ bởi SQL có tính chọn lọc | Các kiểm thử trong bộ nhớ không phát hiện được mọi vấn đề về lược đồ/truy vấn | Tiếp tục các buổi diễn tập di chuyển SQL dùng một lần và mở rộng các kiểm thử tích hợp SQL có kiểm soát thao tác ghi |
| Một số chức năng chưa có kiểm thử máy chủ nào được xác định | Phạm vi chức năng không đồng đều | Thêm kiểm thử hoặc đánh dấu đang chờ xử lý với chủ sở hữu và lý do |
| Không phải tất cả các tệp `PLAN.md` đều có chiến lược kiểm thử | PLAN.md nên bao gồm chiến lược kiểm thử trước khi triển khai | Cập nhật các gói chức năng đang hoạt động trong lần chuyển tài liệu SDD tiếp theo |
| Bằng chứng giao diện người dùng thủ công không được lưu trữ mỗi lần phát hành | Bằng chứng đánh giá có thể biến mất trong nhận xét chat/PR | Thêm ghi chú bằng chứng kiểm tra PR hoặc phát hành theo `docs/testing/` |
| kiểm thử hợp đồng/API chưa được chính thức hóa | Tích hợp giao diện/máy chủ có thể trôi dạt | Thêm kiểm tra hợp đồng OpenAPI/API khi hợp đồng API ổn định |

---

## 20. Định nghĩa hoàn thành để kiểm tra

Một chức năng hoặc PR đã sẵn sàng để kiểm thử khi:

- đặc tả, kế hoạch và nhiệm vụ liên quan được xác định;
- phạm vi triển khai phù hợp với đặc tả đã được phê duyệt;
- các kiểm thử tự động được thêm hoặc cập nhật cho hoạt động kinh doanh máy chủ;
- các hành động được bảo vệ có độ bao phủ xác thực/vai trò;
- kiểm tra giao diện người dùng thủ công được hoàn thành đối với những thay đổi đối với người dùng;
- tất cả các kiểm thử tự động hiện có đều vượt qua;
- CI vượt qua;
- không có bí mật nào được cam kết;
- người đánh giá xác minh việc tuân thủ đặc tả;
- những khoảng trống kiểm tra còn lại được ghi lại với chủ sở hữu hoặc nhiệm vụ tiếp theo.

Một chức năng không được thực hiện chỉ vì các kiểm thử có màu xanh. Nó được thực hiện khi các kiểm
thử có màu xanh và danh sách kiểm tra đặc tả được đáp ứng.

## 21. Cổng trình diễn liên hoàn FE07-FE12

Lô: `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.

- L1: các bộ FE10, FE07, FE08 và FE12 RED/GREEN tập trung; backend/frontend đầy đủ;
  kiểm tra mã/bản dựng; Chính sách di chuyển dữ liệu/deployment; truy vết và vệ sinh khác nhau.
- L2: BR/FR/AC v0.9.0/v0.6.0/v0.6.0/v0.3.0 ánh xạ tới `AT-001..AT-013`.
- L3: Ma trận vai trò/quyền sở hữu, lỗi an toàn, đường dẫn hành động cố định, trường nhạy cảm
  quét, FE12 chỉ đọc và thông báo sau cam kết không chặn.
- L4: Dòng vàng Chrome `1440x900` dành cho máy tính để bàn xuyên suốt Thành viên A, Thành viên B và
  thủ thư/quản trị viên với các chuyển đổi trạng thái chuẩn.
- Hồi quy đồng hồ: đóng băng đồng hồ dịch vụ, chạy ngày đến hạn trước/sau
ranh giới và yêu cầu tính chẵn lẻ của hợp đồng/trong bộ nhớ/hệ thống SQL độc lập với ngày lưu trữ.
Trạng thái mong đợi của SIT-002/SIT-008 không được viết lại để che giấu sự trôi dạt.
- Azure: sau H3/hợp nhất, áp dụng hoặc xác minh quá trình di chuyển SQL đã được xem xét đối với
Azure SQL, sau đó xác minh chính xác các bản sửa đổi môi trường tiền sản xuất App Service máy chủ và
giao diện người dùng Static Web Apps; Chỉ riêng `/health` là không đủ bằng chứng kinh doanh.
