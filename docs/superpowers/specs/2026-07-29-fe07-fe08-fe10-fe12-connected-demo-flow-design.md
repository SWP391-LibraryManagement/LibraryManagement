# Thiết kế luồng trình diễn liên hoàn FE07/FE08/FE10/FE12

**Trạng thái:** WRITTEN DESIGN APPROVED 2026-07-29

**Ngày duyệt thiết kế trong thảo luận:** 2026-07-29

**Người duyệt trong tác vụ hiện tại:** Người dùng

**Chủ sở hữu các SPEC liên quan:** Nhat

**Mục tiêu bàn giao:** Demo-safe, ưu tiên giao diện web desktop, không thêm bảng
dữ liệu mới và không tự động hóa hàng đợi ngoài tầm kiểm soát của Thủ thư.

## 1. Quyết Định Và Phạm Vi

Thiết kế này bổ sung một luồng demo liên hoàn, giúp người xem quan sát được cách
FE07, FE08, FE10 và FE12 phối hợp trên cùng một chuỗi trạng thái:

```text
Member tạo yêu cầu mượn
  -> Librarian duyệt
  -> FE10 thông báo kết quả
  -> Member khác đặt chỗ
  -> sách được trả
  -> Librarian xử lý hàng đợi
  -> FE10 thông báo sách sẵn sàng
  -> Member tạo yêu cầu mượn bản sao đã giữ
  -> FE07 hoàn tất lượt giữ FE08
  -> FE12 phản ánh trạng thái mới
```

Thiết kế giữ nguyên các quyết định mốc cơ sở đã được phê duyệt:

- tối đa 5 bản sao đang mượn;
- hạn mức hằng ngày 5 bản sao cho tư cách thành viên FE04 `APPROVED`, 3 bản sao
  cho tài khoản `MEMBER` đang hoạt động khác;
- thời hạn mượn 14 ngày theo lịch;
- tối đa 3 lượt đặt chỗ mở;
- lượt giữ `NOTIFIED` có hiệu lực 2 ngày theo lịch;
- hàng đợi FIFO theo hợp đồng FE08 hiện tại;
- mỗi tài khoản có đúng một vai trò đăng nhập;
- FE12 chỉ đọc;
- lỗi gửi thông báo FE10 không hoàn tác nghiệp vụ nguồn đã được ghi nhận.

Các yêu cầu mới trong tài liệu này đã hoàn tất rà soát thiết kế, SPEC fan-out và
H1 nên được phân loại là `approved-decision`. Quyền triển khai product vẫn chỉ
có hiệu lực sau khi quản trị activation hợp nhất và tuân theo cổng H2/H3.

Tài liệu này không tự cấp quyền sửa product mã nguồn, lược đồ, API hoặc triển khai.

## 2. Nguồn Bằng Chứng

| nguồn ID | Nguồn | Revision/ngày | Có thể chứng minh | Mức thẩm quyền | Chủ sở hữu | Xung đột |
| --- | --- | --- | --- | --- | --- | --- |
| S-001 | Quyết định người dùng trong tác vụ hiện tại | 2026-07-29 | Chọn hướng demo-safe, chọn luồng liên hoàn, duyệt ba phần thiết kế và duyệt tệp viết | Cao nhất cho lát cắt đề xuất | Người dùng | Không |
| S-002 | `.sdd/constitution.md`, `.sdd/shared_context.md`, `.sdd/constraints/*.md` | mốc cơ sở hiện hành khi đọc ngày 2026-07-29 | Quy tắc dự án, vai trò, giới hạn mượn, bảo mật và quyền sở hữu | mốc cơ sở dự án đã phê duyệt | Nhóm | Không |
| S-003 | FE07 `SPEC.md` v0.8.3 | 2026-07-28 | Trạng thái mượn, trả, gia hạn, hàng đợi và hoàn tất lượt giữ | SPEC chức năng | Nhat | Đang trong vòng rà soát con người của revision hiện tại |
| S-004 | FE08 `SPEC.md` v0.5.10 | 2026-07-27 | FIFO, vị trí hàng đợi, xử lý thủ công, `NOTIFIED` và `FULFILLED` | SPEC chức năng đã phê duyệt | Nhat | Không |
| S-005 | FE10 `SPEC.md` v0.5.0 | 2026-07-28 | Hộp thư cá nhân, lũy đẳng, hành động path và lỗi không chặn nguồn | SPEC chức năng đã hoàn tất | Nhat | Chưa có các mẫu kết quả mượn mới của thiết kế này |
| S-006 | FE12 `SPEC.md` v0.2.0 | 2026-07-27 | Báo cáo chỉ đọc, KPI hiện có và quyền nhân viên | SPEC chức năng đã phê duyệt | Nhat | Chưa có thao tác tóm tắt của thiết kế này |
| S-007 | Mã nguồn, kiểm thử và thời gian chạy cục bộ hiện tại | Working tree ngày 2026-07-29 | Hành vi quan sát được và bề mặt UI hiện tại | Bằng chứng quan sát, không phải chính sách | Nhóm kỹ thuật | Không được dùng để tự suy ra yêu cầu mới |

## 3. Quyết Định Thiết Kế

| Decision ID | Câu hỏi | Quyết định đề xuất | Lý do | Phân loại |
| --- | --- | --- | --- | --- |
| BD-001 | Mở rộng bốn FE theo cách nào? | Tạo một golden luồng xuyên FE07 -> FE08 -> FE10 -> FE12 | Dễ trình bày trước hội đồng và chứng minh ranh giới chức năng | `approved-decision` |
| BD-002 | Hàng đợi có tự xử lý sau khi trả không? | Không. FE07 chỉ hiển thị bàn giao; thủ thư xác nhận FE08 xử lý | Giữ demo ổn định và đúng mốc cơ sở xử lý thủ công | `approved-decision` |
| BD-003 | Có thêm bảng/kênh thông báo mới không? | Không. Tái sử dụng `Notifications` và hộp thư web v0.5.0 | Tránh dual-write và di chuyển dữ liệu lược đồ không cần thiết | `approved-decision` |
| BD-004 | Thông báo kết quả mượn được mô hình hóa thế nào? | Dùng bản ghi không nhạy cảm `GENERAL_SYSTEM` với mẫu key chuẩn do FE07 sở hữu sự kiện nguồn | Không thêm giá trị liệt kê/kênh mới nhưng vẫn có hành động path an toàn | `approved-decision` |
| BD-005 | bảng điều khiển có tự đếm dữ liệu trên giao diện không? | Không. FE12 cung cấp thao tác tóm tắt chỉ đọc từ cơ sở dữ liệu | Số liệu phải tái tạo, phân quyền và kiểm thử được | `approved-decision` |
| BD-006 | Ưu tiên giao diện thích ứng nào? | Máy tính 1440x900 là tiêu chí nghiệm thu chính; không chủ động mở rộng di động trong lát cắt | Phù hợp mục tiêu trình diễn website của người dùng | `approved-decision` |
| BD-007 | Ngày nghiệp vụ FE12 được lấy ở đâu? | Service tạo một `businessDate` từ clock có kiểm soát rồi truyền rõ ràng cho cả SQL kho mã nguồn và in-memory kho mã nguồn | Ngăn kết quả quá hạn phụ thuộc ngày chạy máy chủ và giữ kiểm thử/thời gian chạy cùng một nguồn thời gian | `approved-addendum-2026-07-29` |

## 4. Ranh Giới Tác Nhân Và quyền sở hữu

Mọi ô không được trích trực tiếp từ mốc cơ sở hiện hành đã được duyệt trong H1
và được phân loại là `approved-decision`.

| tác nhân | Mục tiêu nghiệp vụ | Có thể khởi tạo | Không được thực hiện | Chuyển trạng thái sở hữu | Phạm vi dữ liệu | bàn giao | Lỗi chính |
| --- | --- | --- | --- | --- | --- | --- | --- |
| thành viên | Mượn sách, theo dõi khoản mượn và nhận sách đã giữ | Yêu cầu mượn của mình, đặt chỗ của mình, yêu cầu mượn bản sao `NOTIFIED` của mình, đọc thông báo của mình | Duyệt/từ chối, xử lý hàng đợi, xem báo cáo nhân viên hoặc thao tác dữ liệu người khác | Không sở hữu giao dịch; service chức năng sở hữu | Dữ liệu của chính tài khoản | FE07 -> FE10, FE08 -> FE10 | `401/403/404/409` an toàn |
| thủ thư | Xử lý lưu thông và hàng đợi | Duyệt/từ chối, trả, gia hạn, xử lý hàng đợi, xem bảng điều khiển | Bỏ qua điều kiện hợp lệ, tự quyết định thông báo hoặc sửa số liệu báo cáo | Cho phép FE07/FE08 thực hiện giao dịch | Phạm vi nghiệp vụ nhân viên | FE07 -> FE08 -> FE10 -> FE12 | Stale trạng thái trả `409`, không giả lập thành công |
| quản trị viên | Có quyền nghiệp vụ nhân viên theo SPEC hiện hành | Các thao tác thủ thư và xem báo cáo | Bỏ qua quy tắc theo chủ sở hữu khoản mượn hoặc quyền sở hữu đặt chỗ | Như thủ thư | Phạm vi đã được vai trò guard cho phép | Như thủ thư | Như thủ thư |
| FE07 | Sở hữu yêu cầu mượn, bàn giao, trả, gia hạn | Xử lý lệnh FE07 hợp lệ | Chọn người trong hàng đợi hoặc quyết định trạng thái gửi | `BorrowRequests`, `BorrowDetails`, trạng thái bản sao trong giao dịch đã phê duyệt, hoàn tất đúng lượt giữ `NOTIFIED` | Dữ liệu mượn và quyền sở hữu đặt chỗ chỉ đọc cần thiết | Trả bàn giao hàng đợi cho FE08; yêu cầu FE10 sau khi giao dịch được ghi nhận | hoàn tác giao dịch FE07; lỗi FE10 không hoàn tác |
| FE08 | Sở hữu đặt chỗ, FIFO, lượt giữ và hết hạn | Tạo/hủy/xử lý hàng đợi hợp lệ | Duyệt mượn, trả sách hoặc gửi email trực tiếp | `Reservations` và trạng thái giữ bản sao theo hợp đồng | Dữ liệu đặt chỗ/hàng đợi | Gọi FE10 sau khi giao dịch được ghi nhận; FE07 hoàn tất đúng lượt giữ của chủ sở hữu | Tranh chấp đồng thời chỉ có một người thắng; lỗi FE10 không hoàn tác lượt giữ |
| FE10 | Gửi và hiển thị thông báo cá nhân | Nhận yêu cầu nguồn đã ràng buộc | Quyết định trạng thái mượn/đặt chỗ hoặc nhận URL tùy ý | `Notifications`, số lần thử, trạng thái gửi/đọc | Bản ghi thông báo đủ điều kiện của đúng người dùng | Trả đường dẫn hành động trong danh sách cho phép | Lỗi an toàn, lũy đẳng và không chặn nguồn |
| FE12 | Cung cấp dữ liệu tổng hợp chỉ đọc | Nhận yêu cầu báo cáo đã phân quyền | Sửa nguồn hoặc tính số liệu từ danh sách giao diện không đầy đủ | Không có chuyển đổi trạng thái nghiệp vụ | Dữ liệu tổng hợp/chi tiết đã phê duyệt | Xem chi tiết tới FE07/FE08/báo cáo | KPI lỗi riêng, không biến thành số 0 |

## 5. Luồng Nghiệp Vụ Chuẩn Được Đề Xuất

### 5.1 Tạo Và Duyệt Yêu Cầu Mượn

1. thành viên A chọn một bản sao đủ điều kiện và gửi yêu cầu FE07.
2. FE07 tạo `BorrowRequests.Status = PENDING` và
   `BorrowDetails.Status = REQUESTED`.
3. Giao diện Thành viên hiển thị dòng thời gian với bước `Chờ duyệt`.
4. thủ thư mở bối cảnh yêu cầu và phê duyệt.
5. Giao dịch FE07 cập nhật dữ liệu mượn/bản sao/kiểm toán theo SPEC hiện hành.
6. Sau khi giao dịch được ghi nhận, FE07 yêu cầu FE10 tạo thông báo kết quả mượn không nhạy cảm.
7. FE10 lưu/gửi một bản ghi lũy đẳng và hành động path `/borrowing/history`.

Nếu yêu cầu bị từ chối, FE07 giữ lý do trong audit như mốc cơ sở hiện hành và
FE10 tạo thông báo kết quả từ chối an toàn, không đưa lý do tùy ý vào hành động
path hoặc siêu dữ liệu nhạy cảm.

### 5.2 Đặt Chỗ Và Trả Sách

1. thành viên B tạo đặt chỗ FE08 cho bản sao đang được mượn.
2. FE08 giữ FIFO hiện hành và trả `queuePosition`.
3. thành viên A trả bản sao qua FE07.
4. FE07 ghi nhận kết quả trả sách và giữ nguyên quyền sở hữu hàng đợi `ACTIVE`.
5. Kết quả FE07 bổ sung chỉ đọc `reservationQueueAction`:

```json
{
  "copyId": 123,
  "hasActiveQueue": true,
  "actionPath": "/librarian/reservations"
}
```

Trường này được tính từ trạng thái đã khóa/đọc có thẩm quyền trong luồng trả;
nó không chuyển trạng thái FE08.

6. UI thủ thư chỉ hiển thị “Xử lý hàng đợi đặt chỗ” khi
   `hasActiveQueue = true`.
7. Nút chỉ điều hướng tới màn FE08; không tự gọi thao tác ghi.

### 5.3 Xử Lý Hàng Đợi Và Bàn Giao

1. thủ thư mở FE08 và xác nhận “Giữ sách & thông báo”.
2. FE08 giao dịch chọn người hợp lệ đầu tiên theo FIFO hiện hành.
3. FE08 chuyển đúng đặt chỗ sang `NOTIFIED`, giữ bản sao và đặt
   `ExpiresAt` theo mốc cơ sở hai ngày.
4. Sau bản ghi Git, FE08 yêu cầu FE10 tạo `RESERVATION_READY`.
5. thành viên B nhấn thông báo và được điều hướng tới `/reservations/mine`.
6. UI của đặt chỗ `NOTIFIED` hiển thị “Tạo yêu cầu mượn sách đã giữ”.
7. FE07 nhận đúng `copyId`; mọi quy tắc server-side vẫn được đánh giá lại.
8. Khi phê duyệt thành công, FE07 hoàn tất đúng đặt chỗ thành `FULFILLED`
   trong cùng giao dịch đã được phê duyệt.

### 5.4 Quan Sát Qua FE12

thao tác tóm tắt chỉ đọc phản ánh trạng thái mới sau mỗi thao tác ghi đã được ghi nhận.
Không có optimistic count và không có số liệu do giao diện tự suy ra từ một
trang dữ liệu phân trang.

## 6. Thiết Kế Thành Phần

### 6.1 FE07 - Hành trình vay mượn

Màn lịch sử/chi tiết mượn bổ sung timeline được suy ra từ dữ liệu chuẩn:

- `REQUESTED/PENDING`: Chờ duyệt;
- `BORROWED`: Đang mượn;
- `RETURNED`: Đã trả;
- yêu cầu sở hữu `REJECTED`: Đã từ chối;
- `LOST/DAMAGED`: trạng thái kết thúc tương ứng.

Chỉ hiển thị dấu thời gian đã có trong DTO chuẩn. Không tạo thời gian giả khi
trường nguồn vắng mặt.

Lỗi nghiệp vụ được ánh xạ từ mã lỗi máy chủ sang mô tả tiếng Việt và hành
động tiếp theo. Các nhóm tối thiểu:

- sách/khoản mượn quá hạn;
- khoản phạt `UNPAID`;
- vượt hạn mức;
- trùng quy trình cùng đầu sách;
- bản sao thuộc yêu cầu chờ khác;
- hàng đợi/lượt giữ FE08 có quyền ưu tiên;
- dữ liệu đã thay đổi và cần tải lại.

### 6.2 FE08 - Xếp Hàng Và Nhận Hàng

Màn thành viên hiển thị:

- vị trí hàng đợi khi có giá trị;
- `Chưa xác định` khi máy chủ trả `null`;
- trạng thái và thời hạn nhận từ `ExpiresAt`;
- CTA mượn bản sao đã giữ chỉ khi đặt chỗ thuộc người dùng và là
  `NOTIFIED`.

Màn thủ thư gom bản sao, người đầu hàng đợi, tính đủ điều kiện và thao tác
“Giữ sách & thông báo” trong một decision surface. UI không tuyên bố gửi thành
công nếu FE10 trả cảnh báo thất bại sau khi lượt giữ đã được ghi nhận.

### 6.3 FE10 - Thông báo có thể hành động

Tái sử dụng `Notifications`. Không thêm bảng hoặc kênh `IN_APP`.

Các mẫu key mới được đề xuất dưới loại không nhạy cảm
`GENERAL_SYSTEM`:

- `BORROW_REQUEST_APPROVED`;
- `BORROW_REQUEST_REJECTED`;
- `BORROW_RENEWED`;
- `BORROW_RETURNED`.

Các hàng trên được bổ sung vào hộp thư đến eligibility và ánh xạ cố định tới
`/borrowing/history`. `RESERVATION_READY` tiếp tục ánh xạ tới
`/reservations/mine`.

Caller không được cung cấp hành động URL. máy chủ suy ra hành động path từ cặp
type/mẫu chuẩn. Nhấn mục thực hiện mark-read best-effort rồi điều hướng;
lỗi mark-read không chặn mở màn nghiệp vụ.

### 6.4 FE12 - Tóm tắt hoạt động

Đề xuất điểm cuối:

```text
GET /api/reports/operations-summary
Roles: LIBRARIAN, ADMIN
Query: none
```

phản hồi tối thiểu:

```json
{
  "pendingBorrowRequests": 0,
  "activeLoans": 0,
  "overdueLoans": 0,
  "openReservations": 0,
  "availableCopies": 0,
  "lowStockBooks": 0,
  "generatedAt": "server timestamp"
}
```

Định nghĩa:

- `pendingBorrowRequests`: `BorrowRequests.Status = PENDING`;
- `activeLoans`: chi tiết `BORROWED`;
- `overdueLoans`: chi tiết `BORROWED` có `DueDate` trước ngày nghiệp vụ
  `Asia/Ho_Chi_Minh`;
- `openReservations`: đặt chỗ `ACTIVE` hoặc `NOTIFIED`;
- `availableCopies`: bản sao khả dụng hiệu lực có
  `Books.Status = 'ACTIVE'` và `BookCopies.Status = 'AVAILABLE'`;
- `lowStockBooks`: sách `ACTIVE` có 0..2 bản sao
  `BookCopies.Status = 'AVAILABLE'`; sách không hoạt động bị loại khỏi KPI.

bảng điều khiển desktop hiển thị các KPI và fixed drill-down:

| KPI | Đích |
| --- | --- |
| Yêu cầu chờ duyệt | `/librarian/borrow-requests` |
| Đang mượn / Quá hạn | `/reports/borrowing` |
| Đặt chỗ đang mở | `/librarian/reservations` |
| Bản sao sẵn có / Sắp hết | `/reports/inventory` |

Mọi phép phân loại quá hạn FE12, gồm báo cáo mượn hiện hành và thao tác
tóm tắt mới, phải nhận cùng một `businessDate` do service tạo từ clock đã
inject. kho mã nguồn SQL và kho mã nguồn in-memory không được tự gọi `new Date()`
để quyết định trạng thái quá hạn. `generatedAt` và `businessDate` phải được suy
ra từ cùng một lần đọc clock cho mỗi yêu cầu.

## 7. Hợp Đồng Lỗi

| Điều kiện | Kết quả |
| --- | --- |
| Thiếu xác thực | `401` an toàn |
| Sai vai trò | `403` an toàn |
| Dữ liệu của người khác hoặc bản ghi không được phép tiết lộ | `404` an toàn khi quyền sở hữu cần được che |
| Trạng thái đã thay đổi trước xác nhận | `409`; UI tải lại trạng thái chuẩn |
| FE10 thất bại sau khi giao dịch FE07/FE08 được ghi nhận | Nghiệp vụ nguồn giữ nguyên; trả cảnh báo không chặn |
| FE10 nhận lại cùng khóa lũy đẳng | Trả bản ghi hiện có; không tạo hàng/lần gửi trùng |
| Hai nhân viên xử lý cùng hàng đợi/bản sao | Tối đa một giao dịch thành công; bên còn lại nhận lỗi xung đột an toàn |
| Không có đặt chỗ đủ điều kiện | Không thao tác ghi; hiển thị “Chưa có thành viên đủ điều kiện” |
| Một KPI FE12 lỗi | KPI đó hiển thị lỗi/thử lại; không hiển thị số 0 giả |
| Toàn bộ thao tác tóm tắt lỗi | Lỗi an toàn; không lộ SQL, bộ công nghệ hoặc bộ lọc nội bộ |

## 8. Bất Biến

- Một bản sao có nhiều nhất một quyền sở hữu yêu cầu mượn đang hoạt động.
- Một thành viên có nhiều nhất một quy trình mượn đang hoạt động trên mỗi
  `BookId`.
- Chỉ chủ sở hữu đặt chỗ `NOTIFIED` mới được yêu cầu bản sao `RESERVED`.
- FE07 chỉ hoàn tất đúng đặt chỗ liên quan sau khi phê duyệt mượn được ghi nhận.
- FE08 xử lý FIFO dưới giao dịch; UI không chọn người chiến thắng.
- FE10 không thay đổi trạng thái FE07/FE08.
- Lỗi FE10 không hoàn tác nghiệp vụ nguồn.
- FE12 không tạo/cập nhật/xóa dữ liệu nguồn.
- Mọi KPI FE12 tái tạo được từ định nghĩa nguồn đã ghi trong SPEC.
- giao diện vai trò guards chỉ là UX; server ủy quyền luôn có thẩm quyền.

## 9. Tiêu Chí Chấp Nhận

| Acceptance ID | Tình huống | Kết quả bắt buộc |
| --- | --- | --- |
| AT-001 | thành viên tạo yêu cầu hợp lệ | FE07 tạo `PENDING/REQUESTED`, timeline hiện `Chờ duyệt` |
| AT-002 | thủ thư duyệt yêu cầu | Bản sao thành `BORROWED`, FE10 tạo đúng một thông báo kết quả |
| AT-003 | thủ thư từ chối yêu cầu | UI hiện `Đã từ chối`, FE10 tạo đúng một thông báo từ chối |
| AT-004 | Bản sao được trả và có hàng đợi | FE07 ghi nhận việc trả sách, không tự động xử lý FE08, phản hồi bàn giao có `hasActiveQueue = true` |
| AT-005 | thủ thư xử lý hàng đợi | Người hợp lệ đầu tiên thành `NOTIFIED`, bản sao được giữ, FE10 nhận một yêu cầu |
| AT-006 | thành viên nhấn thông báo đặt chỗ | Mục được mark read best-effort và mở `/reservations/mine` |
| AT-007 | Owner `NOTIFIED` tạo yêu cầu mượn | FE07 nhận đúng `copyId`; phê duyệt hoàn tất đặt chỗ thành `FULFILLED` |
| AT-008 | Hai thao tác hàng đợi đồng thời | Chỉ một thao tác được ghi nhận; không có hai lượt giữ/thông báo |
| AT-009 | FE10 lỗi sau khi giao dịch được ghi nhận | FE07/FE08 giữ trạng thái đã ghi nhận và giao diện hiện cảnh báo trung thực |
| AT-010 | thủ thư/quản trị viên xem thao tác tóm tắt | KPI khớp nguồn và drill-down đúng tuyến |
| AT-011 | thành viên/khách gọi thao tác tóm tắt | Server từ chối; không trả số liệu |
| AT-012 | Desktop browser golden luồng | Toàn bộ luồng hoạt động ở 1440x900, không tràn ngang và không lỗi console ngoài lỗi được chủ động kiểm thử |
| AT-013 | Chạy FE12 với clock cố định trước và sau hạn trả | SQL kho mã nguồn, in-memory kho mã nguồn và HTTP dữ liệu chiếu phân loại quá hạn giống nhau, không phụ thuộc ngày thật của máy chạy kiểm thử |

## 10. Chiến Lược Kiểm Thử

### 10.1 Đơn vị

- mapping timeline và error mã nguồn FE07;
- mapping trạng thái/vị trí/CTA FE08;
- FE10 hộp thư đến eligibility, mẫu danh sách cho phép và hành động path;
- định nghĩa từng KPI FE12 và drill-down map.

### 10.2 Tích hợp dịch vụ/kho lưu trữ

- FE07 trả sách tạo queue bàn giao từ dữ liệu có thẩm quyền nhưng không thao tác ghi
  đặt phòng;
- FE08 giao dịch FIFO và race hai nhân viên;
- FE10 idempotent replay và không đạt isolation;
- FE12 thao tác tóm tắt khớp dữ liệu kiểm thử nguồn trước/sau từng chuyển đổi;
- vai trò/quyền sở hữu matrix cho thành viên, thủ thư, quản trị viên và khách.

### 10.3 chức năng chéo

Một dữ liệu kiểm thử liên hoàn phải chứng minh:

```text
FE07 PENDING
-> FE07 BORROWED + kết quả mượn FE10
-> FE08 ACTIVE
-> FE07 RETURNED + queue handoff
-> FE08 NOTIFIED + FE10 RESERVATION_READY
-> FE07 BORROWED + FE08 FULFILLED
-> số liệu FE12 phản ánh các trạng thái đã ghi nhận
```

### 10.4 Trình duyệt

- máy tính để bàn Chrome 1440x900;
- thành viên A, thành viên B và thủ thư/quản trị viên;
- timeline, queue position, queue bàn giao, thông báo navigation và
  tóm tắt hoạt động;
- stale-trạng thái refresh và FE10 non-blocking warning;
- không bắt buộc thêm mobile E2E trong lát cắt này.

### 10.5 Hồi quy

- giới hạn 5 bản đang mượn và hạn mức hằng ngày;
- một quy trình cùng đầu sách;
- FIFO và tối đa 3 đặt chỗ mở;
- thời hạn giữ 2 ngày;
- hạn trả 14 ngày và nghiệp vụ date `Asia/Ho_Chi_Minh`;
- clock cố định được truyền xuyên service/kho mã nguồn cho mọi phép phân loại quá
  hạn FE12; không dùng ngày máy chủ ẩn trong kho mã nguồn;
- FE10 sensitive exclusions và hộp thư đến quyền sở hữu;
- FE12 báo cáo hiện hành, truy vấn danh sách cho phép và chỉ đọc điều kiện bất biến.

## 11. Lộ Trình Lát Cắt

| Thứ tự | ID phần việc | Kết quả | Phụ thuộc | Rủi ro | Cổng vào | Bằng chứng đầu ra |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | SL-001 | Phân bổ SPEC và ID nghiệp vụ được phê duyệt | Tệp thiết kế được rà soát | Mơ hồ/xung đột phạm vi hiện hành | Thiết kế bằng văn bản đã được duyệt | SPEC/CONTEXT/CHANGELOG thống nhất |
| 2 | SL-002 | Mở rộng mẫu/đường dẫn hành động FE10 | SL-001 | Thông báo lộ dữ liệu hoặc trùng | G3 đạt | RED/GREEN FE10 + bảo mật |
| 3 | SL-003 | Dòng thời gian FE07, chặn bản sao và bàn giao hàng đợi | SL-001/SL-002 | Trạng thái cũ hoặc FE07 chiếm quyền sở hữu FE08 | G3 đạt | Kiểm thử FE07 tập trung/bằng chứng tích hợp |
| 4 | SL-004 | Bề mặt quyết định hàng đợi FE08 và lời kêu gọi hành động cho bản sao được giữ | SL-003 | Sai FIFO/tranh chấp/chủ sở hữu | G4/G5 cho SL-003 | Bằng chứng giao dịch/đồng thời FE08 |
| 5 | SL-005 | Thao tác tóm tắt FE12 và bảng điều khiển | SL-001 | KPI sai hoặc lộ dữ liệu | G3 đạt | Bằng chứng tương đương báo cáo/quyền |
| 6 | SL-006 | Luồng nghiệp vụ chuẩn trên trình duyệt và bằng chứng phát hành | SL-002..SL-005 | Sai lệch giữa giao diện và thời gian chạy | G6 đạt từng phần việc | E2E máy tính, đầy đủ cổng, nghiệm thu của con người |

## 12. Ngoài Phạm Vi

- bảng hoặc kênh thông báo mới;
- WebSocket, SSE, thông báo đẩy di động hoặc SMS;
- xử lý hàng đợi hoàn toàn tự động;
- tự động hết hạn/chuyển người tiếp theo ngoài hợp đồng FE08 hiện hành;
- bộ lập lịch nhắc sắp hết thời hạn giữ mới;
- CSV, PDF hoặc bảng tính;
- bảng điều khiển BI thời gian thực;
- quy tắc ưu tiên ngoài FIFO;
- từ chối/phê duyệt từng phần của một mượn sách yêu cầu;
- RFID/QR và thanh toán trực tuyến;
- thay đổi lược đồ phá vỡ hoặc thay đổi các giới hạn mốc cơ sở;
- mở rộng riêng cho di động ngoài việc không làm hỏng CSS hiện có.

## 13. Phân Bổ Tài Liệu Bắt Buộc

Việc phân bổ tài liệu đã được cập nhật, rà soát và đưa vào bước kích hoạt quản trị:

- FE07 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE08 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE10 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- FE12 `SPEC.md`, `CONTEXT.md`, `CHANGELOG.md`;
- bản đồ tích hợp chức năng và hợp đồng API; OpenAPI thời gian chạy chờ Nhiệm vụ sản phẩm có
  tuyến tương ứng;
- `PLAN.md`/`TASKS.md` của lô H1 đã duyệt;
- kế hoạch kiểm thử tổng thể, hướng dẫn người dùng và các tệp truy vết trong quá trình bàn
  hàng.

BR/FR/AC, ranh giới tác nhân và kế hoạch triển khai/H1 đã ổn định. Mã nguồn sản phẩm
vẫn bị chặn đến khi bước kích hoạt quản trị được hợp nhất và phải giữ chưa commit đến H2.

## 14. Tự Rà Soát Thiết Kế

- Quét nội dung giữ chỗ: không còn mục tạm, ghi chú triển khai sau hoặc yêu cầu chưa định nghĩa.
- Tính nhất quán: FE07/FE08/FE10/FE12 giữ quyền sở hữu hiện hành; FE12 chỉ đọc; FE10
  không hoàn tác nghiệp vụ nguồn.
- Phạm vi: không thêm bảng, kênh hoặc bộ lập lịch; luồng đủ nhỏ để chia thành các
  lát cắt tuần tự.
- Tính rõ ràng: KPI, chuyển đổi trạng thái, đường dẫn hành động, hành vi lỗi và bằng chứng nghiệm thu
  bằng chứng đã có định nghĩa cụ thể.
- Thẩm quyền: thiết kế, phân bổ SPEC và H1 đã được duyệt; bước kích hoạt vẫn phải qua
  CI/H3/hợp nhất trước khi quyền triển khai sản phẩm có hiệu lực.
