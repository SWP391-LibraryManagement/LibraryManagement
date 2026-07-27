# Gói chấp nhận bởi con người cho đối soát đầy đủ FE01-FE12 - 2026-07-19

Trạng thái: COMPLETE - H3 ĐÃ PHÊ DUYỆT, ĐÃ MERGE, CI MAIN SAU MERGE ĐÃ PASS

Nhánh: `feat/full-reconciliation`

PR nháp: #40

Đầu nhánh triển khai/bằng chứng đã ghi: `d820ab75d0c4042bd8a7317b054e72518faaeffd`

CI đã ghi: `29685337907` - PASS

Đầu nhánh triển khai mới nhất đã kiểm tra: `d820ab75d0c4042bd8a7317b054e72518faaeffd`

CI triển khai mới nhất: `29685337907` - PASS

Theo dõi bằng chứng chỉ gồm tài liệu: đầu nhánh `c9aa4ba`, CI `29685476077` - PASS

Đầu nhánh bằng chứng H3: `24680ffe9052f35298cbef4a2555bcb39e333824`, CI `29685838610` - PASS

Commit merge: `1555111e895a1850da5daee7ade3453479c3a82b`

CI `main` sau merge: `29685953839` - PASS

## Mục đích

Gói này tách xác thực tự động khỏi các quyết định bởi con người được Hiến chương,
quy tắc bàn giao Hybrid Fast-Track và Định nghĩa Hoàn tất của dự án yêu cầu. Đây chưa phải bằng chứng chấp nhận
cho đến khi một người rà soát được nêu tên ghi lại quyết định rõ ràng.

## Bằng chứng tự động dành cho người rà soát

| Cổng | Bằng chứng |
| --- | --- |
| Hồi quy backend | 53/53 bộ, 905/905 kiểm thử |
| Độ bao phủ backend | 92.68% câu lệnh, 81.66% nhánh, 96.59% hàm, 92.61% dòng |
| Hồi quy frontend | 149/149 kiểm thử |
| Chất lượng frontend | lint PASS; bản dựng production PASS cùng cảnh báo phân đoạn đã biết và không gây chặn |
| Tích hợp hệ thống | 10/10 kiểm thử |
| SQL trực tiếp | đường cơ sở PASS; năm lần di chuyển chạy hai lần; 9/9 bộ, 69/69 kiểm thử; FE06 `10/10`; `DB_CLEAN`, `LOGIN_CLEAN` |
| Trình duyệt/L4 | FE08 tập trung 1/1 và toàn bộ bộ FE08/FE09/FE11/hệ thống 4/4 trên các cổng cô lập `4185/3101` |
| Truy vết | toàn bộ FE01-FE12 đạt 100%; FE08 đạt 29/29; thực thi PASS |
| An toàn | kiểm tra phần phụ thuộc, bí mật, phạm vi, OpenAPI, nhập và vệ sinh phần khác biệt PASS |
| Pull request | PR #40 đạt CI cuối `29685838610`, được merge thành `1555111` và CI `main` chính xác sau merge `29685953839` đã đạt. |

Bằng chứng hợp nhất có thẩm quyền:

- `.sdd/reviews/full-reconciliation-validation-2026-07-19.md`
- `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`
- `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`
- `.sdd/reviews/fe02-auth-debt-closure-validation-2026-07-19.md`
- `.sdd/reviews/fe09-fine-reconciliation-validation-2026-07-19.md`
- `.sdd/reviews/fe11-finalization-wave-a-validation-2026-07-19.md`
- `.sdd/reviews/fe11-finalization-wave-b-validation-2026-07-19.md`

## Cổng Quyết định A - Hợp đồng ứng viên đặt chỗ FE08

`TD-028` được giải quyết cho triển khai và xác thực phía tác nhân. Hợp đồng ứng viên chỉ dành cho thành viên
đã phê duyệt giờ thay `DEMO_RESERVABLE` bằng phép chiếu an toàn dựa trên SQL:

- FE08 yêu cầu `CopyId` vật lý để tạo đặt chỗ.
- Duyệt công khai FE01 chỉ hiển thị khả dụng cấp cao và ẩn định danh bản sao vật lý.
- Lượt đọc bản sao trực tiếp FE06 chỉ dành cho Thủ thư/Quản trị viên.

Không phần triển khai nào được bịa đặt hay mở rộng hợp đồng liên tính năng này nếu không có phê duyệt rõ ràng từ con người.
Người yêu cầu đã phê duyệt Phương án A và thiết kế bằng văn bản như sau:

Người rà soát: Người yêu cầu là con người (phê duyệt qua trò chuyện)

Ngày: 2026-07-19

Quyết định: APPROVED - Phương án A

Tham chiếu hoặc ghi chú hợp đồng đã phê duyệt: `docs/superpowers/specs/2026-07-19-fe08-reservation-candidate-catalog-design.md`; `GET /api/reservations/candidates` chỉ dành cho thành viên, hàng sáu trường đã che dữ liệu, tìm kiếm/phân trang do máy chủ sở hữu và `POST /api/reservations { copyId }` có thẩm quyền.

## Ngoại lệ quản trị - Thứ tự H2 hậu kiểm

Các commit triển khai/bằng chứng đối soát đầu tiên và việc công bố PR nháp diễn ra trước lần rà soát phần khác biệt H2 đầy đủ theo quy tắc Hybrid Fast-Track. Gói này ghi rõ vi phạm thứ tự đó thay vì coi lần công bố trước là bằng chứng H2 hợp lệ.

- Phạm vi ngoại lệ: các commit đến đầu nhánh đã công bố `199fa36` và việc tạo PR nháp #40.
- Hành động khắc phục: giữ mọi bản sửa P1 hiện tại chưa commit, chạy lần rà soát H2 toàn bộ phần khác biệt mới cùng mọi xác thực bắt buộc, rồi chỉ commit/push phần khác biệt cuối đã rà soát.
- Trạng thái khắc phục hiện tại: lần rà soát H2 toàn bộ phần khác biệt mới và xác thực không dùng SQL bắt buộc đã đạt; phần khác biệt đã rà soát và phần hoàn tất bằng chứng H3 cơ học được merge qua PR #40, với CI `main` sau merge đạt.
- Ranh giới thẩm quyền: bản ghi ngoại lệ này không miễn phát hiện H2, phê duyệt merge hay thay thế H3.
- Điều kiện H3: người rà soát phải đánh giá đầu nhánh được push cuối cùng cùng lần chạy CI mới của nó, không phải các đầu nhánh xanh trước đó.

## Quy trình duyệt sản phẩm bởi con người

Chỉ dùng dữ liệu tổng hợp. Không làm lộ thông tin xác thực, token, chuỗi kết nối, OTP thô,
nội dung thông báo hay dữ liệu cá nhân thật.

- [x] Duyệt/tìm kiếm/chi tiết công khai FE01 hiển thị khả dụng an toàn công khai hiện tại và không có dữ liệu bản sao hay người dùng được bảo vệ.
- [x] Đăng ký, xác minh/đặt lại OTP chuẩn, đăng nhập, lỗi chung cho tài khoản không hoạt động, làm mới, đăng xuất, thiết lập tài khoản và thực thi HTTPS đã triển khai của FE02 hoạt động đúng đặc tả.
- [x] Ranh giới đọc/cập nhật/ảnh đại diện hồ sơ FE03 giữ quy tắc chỉ đọc và xác thực.
- [x] Nộp/rà soát đơn thành viên FE04 phản ánh trạng thái máy chủ chuẩn và ranh giới vai trò.
- [x] Quản lý sách FE05 dùng phân trang máy chủ, chỉnh sửa có phiên bản, lý do và khả dụng suy ra.
- [x] Kho FE06 dùng trạng thái máy chủ, `If-Match`, lý do chuyển tiếp, hướng dẫn xung đột và hành vi kiểm toán có giao dịch.
- [x] Yêu cầu mượn, phê duyệt, trả, gia hạn, điều kiện và lịch sử FE07 giữ quy tắc khóa/thứ tự cùng an toàn đã phê duyệt.
- [x] Vòng đời đặt chỗ của thành viên/nhân viên FE08 khớp `ACTIVE`, `NOTIFIED`, `FULFILLED`, `CANCELLED` và `EXPIRED`; lựa chọn ứng viên chỉ được rà soát sau khi Cổng Quyết định A được triển khai.
- [x] Tìm kiếm/lọc/phân trang tiền phạt FE09 do máy chủ kiểm soát; việc tính, thu toàn bộ và xử lý cuối vẫn có thể truy vết.
- [x] Gửi OTP nhạy cảm, thông báo đặt chỗ/thành viên, xử lý lỗi và siêu dữ liệu kiểm toán FE10 không làm lộ bí mật thô.
- [x] Điều hướng Quản trị viên, người dùng, vai trò, vòng đời, quyền, Nhật ký Kiểm toán và Quản lý Yêu cầu FE11 khớp các hợp đồng đã phê duyệt.
- [x] Báo cáo FE12 vẫn xác định, dựa trên máy chủ, được bảo vệ theo vai trò và chỉ đọc.
- [x] Bố cục máy tính và di động không có hiện tượng tràn gây chặn, điều khiển không thể truy cập hay trạng thái thành công gây hiểu lầm.
- [x] Dọn dẹp không để lại trạng thái SQL tổng hợp, cơ sở dữ liệu/đăng nhập, tệp thông tin xác thực hay tiến trình nền không giải thích được.

## Cổng Quyết định B - Tích hợp cuối cùng / H3

Cổng này chỉ có thể được phê duyệt sau khi Cổng Quyết định A được triển khai, các kiểm tra tập trung/đầy đủ của nó đạt,
PR #40 vẫn sạch trên đầu nhánh cuối và người rà soát hoàn tất quy trình duyệt bên trên.

Người rà soát: Người yêu cầu là con người (phê duyệt qua trò chuyện)

Ngày: 2026-07-19

Quyết định: PHÊ DUYỆT MERGE

Đầu nhánh PR đã rà soát: `165da3f9d8221cc68d6a2e708e022beac8a2ff27`

Lần chạy CI đã rà soát: `29685574438` - PASS

Ghi chú: Người yêu cầu trả lời `duyệt` sau khi tác nhân trình bày ranh giới quy trình duyệt FE01-FE12 đầy đủ, đầu nhánh PR cuối cùng và CI xanh. Nội dung này ghi nhận phê duyệt merge H3; CI `main` bắt buộc sau merge giờ được ghi bên dưới.

Ranh giới hoàn tất cơ học: commit phê duyệt chỉ gồm bằng chứng này không thay đổi hành vi sản phẩm, được H3 cho phép và đã đạt CI PR trước khi merge.

## Hoàn tất sau merge

- Đầu nhánh PR cuối cùng: `24680ffe9052f35298cbef4a2555bcb39e333824`.
- CI PR cuối cùng: `29685838610` - PASS.
- Commit merge: `1555111e895a1850da5daee7ade3453479c3a82b`.
- CI `main` sau merge: `29685953839` - PASS.
- Bằng chứng GitHub lâu dài: bình luận hoàn tất sau merge của PR #40 `issuecomment-5015618240`.
- Không tồn tại phần khác biệt sản phẩm giữa đầu nhánh PR đã phê duyệt và nội dung `main` đã merge.

## Quy tắc hoàn tất

Cả hai cổng quyết định đều được phê duyệt, PR #40 đã merge và bằng chứng CI `main` bắt buộc sau merge
được ghi nhận. Quy tắc hoàn tất đối soát FE01-FE12 đã được đáp ứng.
