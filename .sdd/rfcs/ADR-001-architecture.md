# ADR-001: Kiến trúc

Trạng thái: Đã phê duyệt cho phần dựng khung Tuần 4
Ngày: 2026-06-10

## Bối cảnh

Dự án tuân theo playbook Phát triển kết hợp hướng đặc tả và hướng tác nhân. Các cổng Tuần 1-3 đã đóng và dự án đang bước vào Tuần 4: Kiến trúc & Dựng khung.

Stack đã được Hiến chương phê duyệt:

- Backend: Node.js + Express.js
- Frontend: React + Bootstrap
- Cơ sở dữ liệu: SQL Server
- Kiểu API: RESTful API

Repository đã có bộ khung backend Express và nguyên mẫu frontend React/Vite. Chúng được phép tồn tại như hiện vật dựng khung/nguyên mẫu, nhưng việc triển khai tính năng vẫn phải tuân theo `SPEC.md`, `PLAN.md` và `TASKS.md` đã được phê duyệt.

## Quyết định

Sử dụng kiến trúc mô-đun phân tầng với ranh giới REST API.

### Các tầng backend

Mã backend nằm trong `backend/src` và nên dùng cấu trúc sau:

```text
backend/src/
  index.js
  config/
  routes/
  controllers/
  services/
  repositories/
  models/
  middleware/
  validators/
  utils/
  CustomException/
  Constrant/
```

Trách nhiệm của từng tầng:

| Tầng | Trách nhiệm |
| --- | --- |
| routes | Liên kết phương thức/đường dẫn HTTP với trình xử lý controller. Không chứa logic nghiệp vụ. |
| controllers | Phân tích ngữ cảnh yêu cầu, gọi validator/service và trả về phản hồi HTTP an toàn. |
| validators | Xác thực yêu cầu phía máy chủ gần ranh giới hệ thống. |
| services | Chứa quy tắc nghiệp vụ và điều phối. Phải kiểm thử được mà không cần UI. |
| repositories | Truy cập SQL Server bằng truy vấn tham số hóa thông qua `mssql`. |
| models | Thành phần hỗ trợ/hằng số về cấu trúc dữ liệu; không phải ORM trừ khi được phê duyệt sau này. |
| middleware | Xử lý lỗi, bảo vệ xác thực, bảo vệ vai trò, ghi nhật ký yêu cầu và lớp bọc bảo mật. |
| config | Nạp môi trường và xác thực cấu hình. Không commit bí mật. |

### Các tầng frontend

Mã frontend nằm trong `frontend/src` và nên dùng cấu trúc sau:

```text
frontend/src/
  App.jsx
  main.jsx
  api/
  routes/
  page/
  component/
  hooks/
  styles/
  utils/
```

Trách nhiệm của từng tầng:

| Tầng | Trách nhiệm |
| --- | --- |
| page | Màn hình cấp route và thành phần điều phối quy trình. |
| component | Thành phần UI có thể tái sử dụng. Không chứa quy tắc nghiệp vụ thuộc về máy chủ. |
| api | Lớp bọc Axios/client cho các endpoint REST. |
| hooks | Thành phần hỗ trợ trạng thái frontend. |
| routes | Định nghĩa/bảo vệ route khi cần. |
| styles | Tích hợp CSS và Bootstrap/MUI. |
| utils | Chỉ chứa thành phần hỗ trợ thuần phía client. |

### Ranh giới API

- Các endpoint REST là hợp đồng giữa frontend và backend.
- Hợp đồng API có thể nằm trong các tệp `SPEC.md` đã phê duyệt cho Tuần 4, trừ khi nhóm tạo `docs/api/api-contract.md` làm hợp đồng dùng chung.
- Thay đổi API dùng chung phải được phản ánh trong đặc tả liên quan trước khi triển khai.

## Ràng buộc

- Không đưa vào framework backend, framework frontend, cơ sở dữ liệu hoặc kiểu API khác nếu chưa cập nhật Hiến chương và các ADR.
- Dùng `mssql` với truy vấn tham số hóa để truy cập cơ sở dữ liệu.
- Xác thực mọi đầu vào người dùng ở backend.
- Thực thi phân quyền theo vai trò ở backend.
- Không để lộ stack trace nội bộ cho người dùng.
- Giữ mã đủ đơn giản cho một dự án sinh viên SWP391.

## Hệ quả

- Các nhóm tính năng có thể làm việc song song theo ranh giới thư mục và tầng dùng chung.
- Service trở thành mục tiêu chính của kiểm thử đơn vị.
- Repository cô lập việc truy cập SQL Server và giảm rủi ro SQL injection.
- UI nguyên mẫu hiện có phải được tái cấu trúc theo cấu trúc frontend khi các nhiệm vụ tính năng được phê duyệt.

## Cổng dựng khung Tuần 4

Trước khi bắt đầu triển khai tính năng Tuần 5:

- Các thư mục backend nêu trên phải tồn tại.
- Phải có trình xử lý lỗi dùng chung.
- Phải có mô-đun kết nối cơ sở dữ liệu không chứa thông tin xác thực hardcode.
- Có thể tồn tại placeholder middleware xác thực và vai trò, nhưng hành vi được bảo vệ phải được triển khai qua các nhiệm vụ FE02/FE11 đã phê duyệt.
- Phải có cấu trúc API client frontend.
- Kiểm tra build/import phải đạt trên CI.
