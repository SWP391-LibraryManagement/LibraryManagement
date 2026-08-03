# Bằng chứng về giai đoạn 3 - 2026-07-19

## Quyết định

Trạng thái triển khai hiện tại: **Vượt qua WITH EXPLICIT ACCEPTANCE BOUNDARIES**.

Giao diện người dùng công khai, thời gian chạy máy chủ, danh mục được hỗ trợ bởi SQL, CORS nghiêm
ngặt, từ chối tuyến đường được bảo vệ ẩn danh, luồng vai trò được xác thực và phân phối hộp thư đến
SMTP thực đều được quan sát. Bằng chứng được giới hạn ở lần chạy trực tiếp được ghi lại và không lưu
giữ thông tin xác thực, mã thông báo, nội dung thư hoặc bí mật của nhà cung cấp.

## mốc cơ sở đã triển khai

| Mục | Giá trị quan sát |
| --- | --- |
| Cam kết nguồn | `64831fea844d8bd0554520fe9466f865d7f11d22` |
| Giao diện người dùng | `https://lemon-wave-04db51100.7.azurestaticapps.net` |
| máy chủ | `https://app-library-api-staging-nhat714.azurewebsites.net` |
| Sức khỏe máy chủ | `https://app-library-api-staging-nhat714.azurewebsites.net/health` |
| Cơ sở dữ liệu SQL | `LibraryManagementStaging` trên `sql-library-staging-ea-nhat714` |
| Môi trường GitHub | `staging` |

Cấu hình môi trường GitHub chỉ được kiểm tra theo tên. Các bí mật triển khai bắt buộc tồn tại và môi
trường xác định `AZURE_WEBAPP_NAME`, `STAGING_API_URL` và `STAGING_FRONTEND_URL`. Không có giá trị
bí mật nào được in hoặc ghi vào bản ghi này.

## Bằng chứng CI/CD

| Chạy | Kết quả | Ý nghĩa |
| --- | --- | --- |
| `29693848682` | ĐẠT Quality/deploy; kiểm thử nhanh THẤT BẠI | Lần chạy chính hiện tại đầu tiên đã đạt đến phần máy chủ trong quá trình khởi động lại App Service và quan sát thấy `503`. Sau khi khởi động, `/health` trả về `200`. |
| `29694280002` | ĐẠT | Cổng chất lượng chính hiện tại, triển khai máy chủ, triển khai giao diện người dùng, trình duyệt E2E, các tiện ích triển khai và cổng kiểm thử nhanh năm kiểm tra ban đầu đã vượt qua. |

Lần chạy đầu tiên cũng cho thấy `TRUST_PROXY=true` bị thiếu: các yêu cầu xác thực HTTPS sản xuất
được hiểu là bước nhảy proxy HTTP nội bộ và trả về `400 HTTPS_REQUIRED`. Cài đặt App Service đã được
thêm, ứng dụng khởi động lại và một `GET /api/auth/me` ẩn danh sau đó trả sách phong bì `401` an
toàn cần thiết.

## Chẩn đoán và hiệu chỉnh SQL trực tiếp

Tập lệnh kiểm thử nhanh ban đầu đã kiểm tra `/health`, không truy vấn SQL. kiểm thử nhanh đầu tiên kiểm thử
mới hiện đọc `/api/books?page=1&limit=1` và xác thực phong bì danh sách công khai.

Kiểm tra đó ban đầu trả về `500`. Chuỗi bằng chứng là:

1. Trạng thái tài nguyên Azure SQL là `Online`; cơ sở dữ liệu chứa 20 bảng.
2. Quy tắc tường lửa tạm thời của nhà điều hành cho phép truy vấn trực tiếp không bí mật bằng cách sử dụng
cài đặt App Service; nó trả về `LibraryManagementStaging`, 20 bảng và bị xóa ngay sau đó.
3. Chạy truy vấn danh mục công khai FE05 sản xuất trên cùng một cơ sở dữ liệu
   SQL trả về lỗi 207: thiếu `Books.RowVersion`.
4. Quá trình di chuyển FE05 hiện tại sau đó đã tái tạo lỗi SQL 4922 vì
   Chỉ mục ISBN được lọc kế thừa phụ thuộc vào cột được thu hẹp.
5. Quá trình di chuyển đã được sửa chữa thông qua độ bao phủ RED-GREEN sang drop/recreate
   `UX_Books_ISBN_NotNull` trong cùng một giao dịch.
6. Tất cả năm lần di chuyển đối chiếu đã được phê duyệt đều chạy thành công hai lần trong lần di chuyển này
   đặt hàng: FE04, FE05, FE06, FE10, FE11.

Xác thực sau di chuyển được trả về:

```text
DatabaseName=LibraryManagementStaging
TableCount=20
Books.RowVersion=8 bytes
BookCopies.Version=8 bytes
Users.DeactivatedAt=8 bytes
UserProfiles.Department=200 bytes
UserProfiles.Specialization=200 bytes
Notifications.RecipientEmail=510 bytes
```

Quy tắc tường lửa tạm thời của nhà điều hành đã bị xóa. Chính sách kết nối SQL đã được khôi phục về
`Default` sau khi kiểm thử `Proxy` chẩn đoán không ảnh hưởng đến lỗi lược đồ.

## Khói dàn độc lập

Lệnh:

```powershell
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

Kết quả được quan sát sau khi di chuyển: **ĐẠT**.

```text
frontend
health
sql-catalog
allowed-cors
blocked-cors
protected-route
```

Workflow sau hợp nhất `29696612260` chạy từ merge commit
`4d02fc423c2fc06374d71ec945b7593dfd10c7e6` và đã vượt qua cổng chất lượng, triển khai máy chủ, triển
khai giao diện người dùng và công việc `smoke-test` sáu bước kiểm tra. Đây là bằng chứng chấp nhận
giai đoạn nhận biết SQL hiện tại.

## Quan sát Azure và SMTP đã được xác thực

Lần quan sát trực tiếp cuối cùng: `c6e0c46421f0`.

| Kịch bản | Kết quả quan sát | Trạng thái |
| --- | --- | --- |
| Đăng nhập vai trò | Đăng nhập tổng hợp của Quản trị viên, Thành viên và Thủ thư đã hoàn tất. | ĐẠT |
| Xác minh vai trò | `/api/auth/me` trả sách vai trò mong đợi cho mỗi lần đăng nhập. | ĐẠT |
| Thành viên đọc dữ liệu được bảo vệ | Endpoint lịch sử mượn của thành viên trả về phản hồi được bảo vệ. | ĐẠT |
| Đọc được bảo vệ bởi thủ thư | Điểm cuối hàng đợi thư viện trả về phản hồi được bảo vệ. | ĐẠT |
| Vòng đời mượn | Đã hoàn thành yêu cầu của Thành viên, phê duyệt của Thủ thư và trả sách bởi Thủ thư. | ĐẠT |
| Thông báo SMTP | Thông báo `8` đạt `SENT` trong một lần thử; 2 được xử lý và 0 không thành công. | ĐẠT |
| Sự chấp nhận của nhà cung cấp | Nhà cung cấp SMTP đã chấp nhận bàn giao. | ĐẠT |
| Quan sát hộp thư đến | Tìm kiếm Gmail IMAP đã quan sát thấy thông báo (`MESSAGE_SEARCHED`). | ĐẠT |

Cuộc điều tra SMTP đã tìm thấy cấu trúc cấu hình `SMTP_USER` không đúng định dạng với hai ký tự
`@`. Cài đặt App Service đã được sửa thành địa chỉ người gửi hợp lệ đã được định cấu hình là
`MAIL_FROM`, sau đó ứng dụng được khởi động lại và tình trạng được kiểm tra lại. Không có địa chỉ
email, mật khẩu, OTP, mã thông báo, nội dung thư hoặc chuỗi kết nối được ghi lại ở đây.

Cuộc chạy đã sử dụng dữ liệu kiểm thử tổng hợp tạm thời. Xác minh dọn dẹp cuối cùng trả về
`AuthFixtures=0`, `BookFixtures=0` và `NotificationFixtures=0`; tất cả các quy tắc tường lửa
`phase3-live-observation*` SQL tạm thời đã bị xóa.

## Ranh giới chấp nhận

| Ranh giới | Trạng thái | Lý do |
| --- | --- | --- |
| Giao diện/máy chủ/SQL công khai | ĐẠT | Được quan sát bằng kiểm thử nhanh sáu bước chỉ đọc. |
| CORS nghiêm ngặt | ĐẠT | Giao diện môi trường tiền sản xuất chính xác được cho phép; nguồn gốc không đáng tin cậy bị chặn. |
| Tuyến đường được bảo vệ ẩn danh | ĐẠT | `/api/auth/me` trả về `401`. |
| Luồng nghiệp vụ chuẩn Azure có xác thực | ĐẠT | Lượt chạy trực tiếp `c6e0c46421f0` đã xác minh đăng nhập theo vai trò, dữ liệu được bảo vệ, yêu cầu mượn, phê duyệt và trả sách. |
| Gửi email thực qua SMTP | ĐẠT | Thông báo `8` có trạng thái `SENT`; đã quan sát việc nhà cung cấp chấp nhận và tìm thấy thư bằng Gmail IMAP. |
| Lưu trữ ảnh đại diện bền vững | GIỚI HẠN | Hệ thống tệp App Service không phải bộ lưu trữ lâu bền cho môi trường sản xuất. |
| SLA sản xuất | NGOÀI PHẠM VI | Môi trường tiền sản xuất sử dụng tín dụng sinh viên nên không có cam kết về tính sẵn có ở cấp sản xuất. |

## Quy trình làm việc sau hợp nhất

| Quy trình làm việc | Cam kết | Kết quả |
| --- | --- | --- |
| `deploy-staging.yml` chạy `29696612260` | `4d02fc4` | đạt: cổng chất lượng, triển khai máy chủ, triển khai giao diện người dùng và kiểm thử nhanh sáu bước có truy vấn SQL. |
