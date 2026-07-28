# CHANGELOG.md - FE06 Quản lý tồn kho / bản sao sách

## 2026-07-27 - Tôn trọng yêu cầu bản sao đang chờ của FE07 (v0.4.4)

- Thêm kiểm tra xung đột có khóa `PENDING + REQUESTED` cho thay đổi trạng thái thủ công
  và ngừng kích hoạt.
- Giữ trạng thái bản sao vật lý không thay đổi trong khi yêu cầu đang chờ.
- Thêm phản hồi có thể hành động `PENDING_BORROW_REQUEST_CONFLICT` hướng dẫn nhân sự
  đến Quản lý yêu cầu FE07.

## 2026-07-22 - Căn chỉnh các truy vấn tổng hợp tồn kho

- Thêm tìm kiếm nhà xuất bản vào truy vấn tồn kho dùng chung và join siêu dữ liệu nhà xuất bản trong cả truy vấn tổng phân trang lẫn số đếm trạng thái.
- Thêm phạm vi hồi quy ngăn danh sách thành công trong khi một trong các truy vấn tổng hợp thất bại do thiếu JOIN dùng chung.
- Giữ điều kiện tiên quyết triển khai rằng các cơ sở dữ liệu hiện có áp dụng `2026-07-19-fe06-bookcopy-rowversion.sql` trước khi dùng hợp đồng tồn kho chính tắc.
- Thêm bộ phân giải tương thích triển khai cho các cơ sở dữ liệu vẫn công khai rowversion tương đương là `BookCopies.RowVersion`, giữ đồng thời lạc quan cho lượt đọc và thay đổi trong khi triển khai migration bắt kịp.
- Thay lỗi 500 không rõ ràng bằng `INVENTORY_SCHEMA_MIGRATION_REQUIRED`/503 khi không có cột rowversion được hỗ trợ nào.

## 2026-07-21 - Hiệu chỉnh tìm kiếm tồn kho và trạng thái lỗi

- Thêm tìm kiếm tồn kho liên trường có tham số và kết hợp nó với các bộ lọc bản sao chính tắc.
- Thay đổi UI để áp dụng rõ ràng bộ lọc nháp thay vì yêu cầu ở mọi lần gõ phím.
- Giữ hàng, tổng, phân trang và số đếm trạng thái được căn chỉnh, đồng thời tách lỗi backend khỏi kết quả rỗng hợp lệ.

## 2026-07-20 - Bản địa hóa giao diện tiếng Việt và kiểu chữ

- Bản địa hóa nhãn, trạng thái, tên trợ năng và phản hồi lỗi an toàn do frontend tạo cho tính năng này.
- Giữ nguyên hợp đồng API, giá trị enum thô, quyền, quy tắc nghiệp vụ và dữ liệu danh mục/hồ sơ do người dùng sở hữu.
- Áp dụng hợp đồng kiểu chữ dùng chung `Be Vietnam Pro` cho thân bài và `Noto Serif` cho tiêu đề, kèm font dự phòng hỗ trợ Unicode.

## 2026-07-19 - Hoàn tất đầu ra giai đoạn 2

- feat-inventory-book-copy được chấp nhận trong đợt đối soát hoàn chỉnh Giai đoạn 2 FE01-FE12 ghi nhận bởi PR #40/#41; việc xác thực và các ranh giới còn lại được tổng hợp trong `.sdd/reviews/phase2-full-exit-validation-2026-07-19.md`.
- Các giới hạn đã hoãn và phạm vi tương lai vẫn được nêu rõ, không bị mở rộng bởi đợt hoàn tất này.

## 2026-07-19 - Hiệu chỉnh kiểm tra lại giao dịch và nguồn sự thật

- Thêm hồi quy RED/GREEN cho trạng thái mượn, đặt trước và sách cha thay đổi sau kiểm tra trước ở service.
- Làm cho các thay đổi repository tạo và trạng thái/ngừng kích hoạt thực thi trạng thái sách cha/quy trình có khóa trước khi cập nhật.
- Thêm phạm vi race SQL tĩnh và trực tiếp cùng lệnh `test:sql:fe06` tập trung.
- Đối soát `SPEC.md` v0.4.2 và `CONTEXT.md` với hợp đồng rowversion, audit nguyên tử, bảo vệ sách cha, lý do bắt buộc, API và truy vết đã triển khai.

## 2026-07-19 - Bằng chứng đối soát tồn kho kết hợp

- Thực hiện FE06-T001 đến FE06-T008 từ kiểm thử RED đến xác thực cục bộ tập trung và đầy đủ trong `feat/fe06-inventory-reconciliation`.
- Thêm rowversion `BookCopies.Version`, `If-Match` lạc quan, thứ tự khóa cố định, giao dịch audit nguyên tử, xác thực vị trí/lý do/phân trang nghiêm ngặt và ngừng kích hoạt idempotent.
- Thay quyền sở hữu tồn kho mock bằng trạng thái danh sách/số đếm/bản sao chính tắc dựa trên máy chủ cùng hướng dẫn xung đột FE07/FE08/cũ trung thực.
- Cập nhật bằng chứng OpenAPI, ADR/model/schema/migration, truy vết và kiểm thử.
- Áp dụng migration FE06 hai lần và đạt bộ SQL FE06 hoàn chỉnh 6/6 trên SQL Server dùng một lần cùng bằng chứng dọn dẹp.
- Chấp nhận trên trình duyệt, xác nhận chủ sở hữu liên tính năng và tích hợp của con người vẫn đang mở.

## 2026-07-17 - Phê duyệt mốc cơ sở giai đoạn 1

- Nhật xác nhận hợp đồng tồn kho FE06 được chuẩn hóa là mốc cơ sở Giai đoạn 1; triển khai đối soát prototype vẫn đang chờ.

## 2026-07-17 - Rà soát hợp đồng cuối cùng

- Làm rõ bộ lọc tồn kho và từ vựng trạng thái bản sao trong luồng chính.
- Thay cách diễn đạt hiệu năng tra cứu không thể xác minh bằng các yêu cầu khóa/bộ lọc cơ sở dữ liệu.

## 2026-07-16 - Phê duyệt rà soát của con người cho việc lập kế hoạch

- Nhat đã phê duyệt kế hoạch đối soát prototype FE06 và yêu cầu phân rã tác vụ.
- Đánh dấu `PLAN.md` và `TASKS.md` là `APPROVED`; các tác vụ triển khai vẫn chưa được chọn và chưa bắt đầu.

## 2026-07-16 - Phân rã lập kế hoạch triển khai

- Thay `PLAN.md` và `TASKS.md` giữ chỗ bằng kế hoạch đối soát `READY FOR REVIEW` cho SPEC v0.4.0 đã được phê duyệt.
- Thêm các tác vụ RED/GREEN có thứ tự cho rowversion/`If-Match` `BookCopies`, kiểm tra xung đột trong cùng giao dịch, thứ tự khóa cố định, bảo vệ sách cha đang hoạt động, lý do bắt buộc, audit nguyên tử và ngừng kích hoạt idempotent.
- Lập kế hoạch thay quyền sở hữu frontend mock bằng tồn kho dựa trên máy chủ và ánh xạ mọi yêu cầu BR/FR/AC trong tổng số 56 tới các tệp, phụ thuộc, lệnh và cổng rà soát cụ thể.

## 2026-07-16 - Phê duyệt rà soát của con người

- Nhat xác nhận đã có rà soát của con người cho bản sửa đổi v0.4.0.
- Đánh dấu `SPEC.md` và `CONTEXT.md` là `APPROVED` và hoàn thành cổng rà soát bản sửa đổi.

## 2026-07-15 - Hợp đồng tồn kho xác định (v0.4.0)

- Yêu cầu `Books.Status = ACTIVE` của sách cha cho việc tạo/chuyển đổi thủ công FE06 sang `AVAILABLE`, đồng thời giữ quy tắc khả dụng hiệu lực cho các lần giải phóng FE07/FE08.
- Loại bỏ xóa cứng vật lý; DELETE chỉ là ngừng kích hoạt mềm xác định.
- Thay mọi phương án từ chối/chuyển hướng/chuẩn hóa bằng một chính sách phản hồi và làm ngừng kích hoạt trùng lặp có tính idempotent.
- Thêm SQL `rowversion`/`If-Match`, kiểm tra xung đột trong cùng giao dịch bắt buộc, thứ tự khóa và ghi audit bắt buộc.
- Sửa trạng thái tạo ban đầu, xác thực vị trí, quyền sở hữu thay đổi API và truy vết hoàn chỉnh không có ánh xạ kiểm thử `TBD`.
- Sửa siêu dữ liệu triển khai cũ: các route/layer/kiểm thử prototype FE06 tồn tại nhưng cần đối soát v0.4.0 trước khi hoàn thành.
- Áp dụng bảo vệ sách cha cho mọi chuyển đổi do FE06 sở hữu sang `AVAILABLE`, loại bỏ trường `condition` bị hoãn và giữ dữ liệu người mượn/chủ sở hữu đặt trước ngoài phản hồi FE06.
- Xác định phân trang tồn kho xác định: `page = 1`, `limit = 20`, giới hạn `page >= 1` và `limit = 1..100`, trong đó giá trị được cung cấp không hợp lệ bị từ chối thay vì chuẩn hóa.

## 2026-06-25 - Đánh dấu triển khai là hoãn lại (v0.3.1)

- Thêm ghi chú rõ ràng “Tình trạng triển khai: CHƯA TRIỂN KHAI (đã hoãn)” vào phần đầu đặc tả.
- Ghi nhận (phát hiện của Cổng xác thực) rằng chưa có layer backend FE06 ngoài model `BookCopies`:
  các endpoint API (Phần 11) và transition guard/invariant (Phần 10.3) chưa được thực thi
  trong mã; trạng thái bản sao chỉ thay đổi gián tiếp bởi FE07/FE08. Một layer FE06 chuyên biệt được hoãn lại.
- Không thay đổi mã; đặc tả vẫn APPROVED cho một vòng lặp triển khai trong tương lai.

## 2026-06-25 - Thêm mô hình trạng thái bản sao sách và quy tắc chuyển đổi

- Tăng phiên bản `SPEC.md` từ 0.2.0 -> 0.3.0; Cập nhật lần cuối 2026-06-25; Trạng thái không đổi (APPROVED).
- Thêm phần “10.3 Mô hình trạng thái & quy tắc chuyển đổi (bản sao sách)” chính thức hóa vòng đời của `BookCopy.status` trên tập trạng thái đã phê duyệt (`AVAILABLE`, `BORROWED`, `RESERVED`, `DAMAGED`, `LOST`, `INACTIVE` theo Q-FE06-001 / phần 10.2). Không thêm trạng thái mới.
- Phần gồm 5 phần: (a) sơ đồ Mermaid `stateDiagram-v2` với bắt đầu/kết thúc; (b) bảng mô tả trạng thái; (c) bảng Chuyển đổi hợp lệ kèm trigger/điều kiện/ai điều khiển (thủ công FE06 / FE07 / FE08) và truy vết FR/BR; (d) Chuyển đổi không hợp lệ bị cấm tường minh; (e) Bất biến (INV-FE06-ST-001..006).
- Phản ánh ranh giới tính năng: chuyển vào/ra `BORROWED`/`RESERVED` do FE07/FE08 điều khiển, không thao tác thủ công FE06 (FR-FE06-014, BR-FE06-014, Q-FE06-002); chuyển thủ công từ BORROWED/RESERVED sang AVAILABLE bị chặn, phải qua FE07/FE08 (FR-FE06-015/016); không ngừng kích hoạt bản sao đang BORROWED/RESERVED; mọi đổi trạng thái ghi AuditLog và cùng commit/rollback.

## 2026-06-25 - Tăng bao phủ yêu cầu hành vi không mong muốn

- Tăng phiên bản `SPEC.md` từ 0.1.0 -> 0.2.0; cập nhật Cập nhật lần cuối thành 2026-06-25; Trạng thái không đổi (APPROVED).
- Thêm phần “7.1 Yêu cầu hành vi không mong muốn” với 11 yêu cầu EARS hành vi không mong muốn (FR-FE06-011 đến FR-FE06-021) được suy ra từ Luồng thay thế, Quy tắc nghiệp vụ và Trường hợp biên hiện có. Không thêm logic mới; mỗi FR mới truy vết tới nguồn (AF/BR/EC/NFR/Q).
- Bao phủ các nhánh bất thường/lỗi: thiếu sách cha, mã vạch rỗng, trạng thái không được hỗ trợ, đặt thủ công BORROWED/RESERVED, thay đổi khả dụng thủ công trên bản sao đã mượn/đặt trước, ngừng kích hoạt trùng lặp, cập nhật đồng thời (khóa lạc quan), hoàn tác giao dịch bản sao+audit, truy cập không được phân quyền và định dạng vị trí không hợp lệ.
- Nâng tỷ lệ FR Không mong muốn từ 3/10 (30%) lên 14/21 (~67%).
- Mở rộng “16. Ma trận truy vết” để thêm hàng thiếu cho FR-FE06-008/009/010 và một hàng cho mỗi FR mới (FR-FE06-011..021), ánh xạ ca sử dụng nguồn và ca kiểm thử ("TBD" khi chưa có ca kiểm thử).

## 2026-06-10

- Tạo cấu trúc đặc tả tính năng Quản lý tồn kho / bản sao sách FE06.
- Thiết lập các tệp đặc tả: CONTEXT.md, SPEC.md, PLAN.md, TASKS.md và CHANGELOG.md.
- Cập nhật chủ sở hữu và phạm vi phân công hiện tại sau khi phân công lại nhóm: Dat sở hữu UC25-UC28 và FT26-FT29.
- Căn chỉnh lại chủ sở hữu FE06 với `Library Management (5).xlsx`.
- Xác định FE06 là quản lý tồn kho cấp bản sao tách biệt với siêu dữ liệu danh mục FE05, quy trình mượn FE07 và đặt trước FE08.
- Làm rõ chính sách hợp đồng API để endpoint REST có thể ở trong SPEC.md trừ khi nhóm khôi phục một tệp hợp đồng API dùng chung.

## 2026-06-10 - Phê duyệt quyết định rà soát giai đoạn 1

- Phê duyệt các quyết định câu hỏi mở từ `.sdd/reviews/open-questions-resolution-packet-2026-06-10.md`.
- Cập nhật trạng thái quyết định `SPEC.md` từ draft/proposed/open thành approved ở nơi áp dụng.
- Giữ các biện pháp kiểm soát phạm vi Giai đoạn 1 và nêu rõ các hạng mục công việc tương lai bị hoãn.

## 2026-07-18 - Làm rõ nhãn điều hướng

- Đổi tên điều hướng của thủ thư và tiêu đề trang từ “Quản lý kho sách” thành “Quản lí kho”.

## 2026-07-22

- Thêm hành động quản lý bản sao rõ ràng trên từng hàng và xác minh bộ lọc máy chủ chính tắc.
- Đổi thứ tự tồn kho xác định sang CopyId tăng dần và làm cho mọi thao tác tải lại của thanh công cụ/phân trang giữ các bộ lọc đã áp dụng.
