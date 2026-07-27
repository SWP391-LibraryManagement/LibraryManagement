# Quyết định vỏ Sách công khai FE01

Ngày: 2026-07-19

Trạng thái: ĐƯỢC NGƯỜI DÙNG PHÊ DUYỆT VÀO 2026-07-19

## Phạm vi quyết định

FE01-T001 và FE01-T005 yêu cầu một vỏ phản hồi đã phê duyệt cho danh sách sách công khai dùng chung
FE01/FE05. Các đặc tả đã phê duyệt yêu cầu tóm tắt sách công khai an toàn có phân trang,
nhưng hiện chưa đặt tên cho các trường JSON cấp cao nhất.

Quyết định này được giới hạn ở `GET /api/books`. Nó không thay đổi trường công khai,
quy tắc tính khả dụng, trường truy vấn, giới hạn phân trang hoặc quyền sở hữu FE05/FE06.

## Bằng chứng

- Phần 5 trong PLAN FE01 yêu cầu vỏ đọc công khai FE05 dùng chung kèm
  siêu dữ liệu phân trang.
- TASKS FE01 đánh dấu xác nhận của chủ sở hữu FE05 là phụ thuộc của FE01-T001 và
  FE01-T005.
- SPEC FE05 mô tả `GET /api/books` là tóm tắt sách có phân trang nhưng không
  định nghĩa khóa JSON cấp cao nhất.
- Hợp đồng API dùng chung cho phép JSON thành công riêng theo tài nguyên và
  không định nghĩa vỏ thành công toàn cục.
- Quy ước danh sách phân trang FE11 đã phê duyệt dùng chính xác các khóa cấp cao nhất
  `data` và `pagination`.

## Hợp đồng được khuyến nghị

Phê duyệt vỏ danh sách chính xác sau:

```json
{
  "data": [],
  "pagination": {
    "page": 1,
    "limit": 20,
    "total": 0,
    "totalPages": 0
  }
}
```

Quy tắc:

- Cấp cao nhất chứa chính xác `data` và `pagination`.
- `data` chỉ chứa DTO tóm tắt công khai an toàn FE01.
- `pagination.page` và `pagination.limit` là các giá trị yêu cầu đã xác thực.
- `pagination.total` là tổng số sách công khai đang hoạt động khớp.
- `pagination.totalPages` là `0` khi `total` là `0`; nếu không thì là
  `ceil(total / limit)`.
- Các trường cũ `success` và `message` không thuộc hợp đồng công khai này.
- Số lượng bản sao chính xác, siêu dữ liệu bản sao, trường nhân viên và bản ghi được bảo vệ vẫn
  bị cấm.

## Lý do

Khuyến nghị tái sử dụng quy ước danh sách phân trang đã được phê duyệt,
cung cấp siêu dữ liệu FE01/FE05 yêu cầu và tránh duy trì một vỏ nguyên mẫu
không thuộc các quy tắc API dùng chung đã phê duyệt.

## Cổng phê duyệt

- [x] Người dùng phê duyệt vỏ chính xác được khuyến nghị vào 2026-07-19 (`duyệt hết`).
- [x] Tài liệu nguồn chân lý FE01 và FE05 được làm rõ cùng nhau trước khi
  triển khai production.
- [x] Kiểm thử ĐỎ FE01-T001 khóa vỏ đã phê duyệt sau khi làm rõ.

Bằng chứng triển khai:

- `backend/tests/publicBrowseRoutes.test.js` khóa danh sách trắng truy vấn chính xác,
  vỏ `data` + `pagination`, lược đồ danh sách/chi tiết công khai an toàn và hợp đồng duyệt
  với q trống.
- `backend/tests/bookRoutes.test.js` khóa chính xác trường DTO công khai khi chạy,
  siêu dữ liệu tùy chọn null và việc không có số lượng bản sao.
- `frontend/test/publicBrowseFrontend.test.js` khóa việc dùng API danh sách/chi tiết chuẩn
  và loại bỏ luồng mượn giả cục bộ.
