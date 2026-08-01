# FE07-FE12 Traceability Status Reconciliation Design

## Mục tiêu

Đồng bộ trạng thái hiển thị trong các ma trận truy vết của FE07, FE08, FE10
và FE12 với trạng thái phát hành hiện hành `COMPLETE` đã được xác nhận trong
`TASKS.md` và biên bản hoàn tất ngày 2026-08-01.

## Quyết định đã được duyệt

Nhat duyệt phạm vi triển khai trong cuộc trao đổi ngày 2026-08-01 sau khi xác
nhận rằng các nhãn `Sẵn sàng`, `Đã lên kế hoạch` và `Đang chờ` còn lại chỉ là
dữ liệu lịch sử gây hiểu nhầm.

## Phạm vi thay đổi

- Chuẩn hóa cột cuối `Trạng thái` của mọi hàng yêu cầu trong Phần 16 của bốn
  `SPEC.md` thành `Hoàn thành`.
- Giữ nguyên ID yêu cầu, trường hợp sử dụng, trường hợp kiểm thử, nhiệm vụ và
  nội dung bằng chứng của từng hàng.
- Cập nhật kiểm tra tiêu đề phát hành để chấp nhận câu tiếng Việt hiện hành.
- Bổ sung kiểm tra hồi quy đọc trực tiếp bốn `SPEC.md` và từ chối mọi hàng ma
  trận có trạng thái khác `Hoàn thành` khi bốn feature đang là `COMPLETE`.

## Ngoài phạm vi

- Không đổi trạng thái vòng đời nghiệp vụ như `PENDING`, `ACTIVE`, `NOTIFIED`
  hoặc `BORROWED`.
- Không đổi code frontend, backend, API, cơ sở dữ liệu, quyền hoặc quy tắc
  nghiệp vụ.
- Không viết lại nội dung bằng chứng hay bổ sung tuyên bố hoàn thành mới.

## Phương án

Chọn kiểm tra hồi quy trong `scripts/traceability-state.test.js` vì file này
đã sở hữu quy tắc `Implementation State: COMPLETE` và kiểm tra trạng thái phát
hành của đúng bốn feature. Kiểm tra chỉ phân tích các hàng Markdown nằm trong
Phần 16, nên không nhầm trạng thái vòng đời nghiệp vụ ở các phần khác của đặc
tả với trạng thái hoàn tất tài liệu.

## Tiêu chí hoàn thành

1. Kiểm tra mới thất bại trên dữ liệu ma trận hiện tại vì còn trạng thái cũ.
2. Sau khi sửa, mọi hàng yêu cầu trong Phần 16 của bốn feature có cột cuối là
   `Hoàn thành`.
3. `npm run test:traceability-state`, kiểm tra văn phong tài liệu,
   `npm run trace:enforce` và `git diff --check` đều đạt.
