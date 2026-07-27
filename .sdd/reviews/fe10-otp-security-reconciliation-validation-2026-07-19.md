# Xác thực đối soát bảo mật OTP FE10 - 2026-07-19

Trạng thái: HOÀN TẤT ĐẾN B7 - CON NGƯỜI CHẤP NHẬN, ĐÃ MERGE VÀ CI MAIN SAU MERGE ĐÃ PASS

Nhánh triển khai: `feat/phase2-fe10-otp-integration`

Nhánh hoàn tất: `docs/phase2-fe10-otp-closeout`

Commit thiết kế: `d6f4600`

Các commit kế hoạch: `32b03c2`, `30fca57`

PR triển khai: #42

Đầu nhánh triển khai: `e52b4ac94c9ed0f3bb799d0c0ceb4b763555a1ee`

CI của PR triển khai: `29688102867` - PASS

Merge triển khai: `34d918030580a6a36b943f187eec7fd95838a66b`

CI `main` sau merge: `29688222757` - PASS

## Quyết định

Sử dụng phương thức bàn giao Hybrid với mức độ sâu Đầy đủ cho Core OTP nhạy cảm và mức độ Nhẹ cho việc hoàn tất chỉ gồm bằng chứng. FE02 sở hữu việc tạo và xác thực OTP; FE10 sở hữu phân quyền nguồn bị ràng buộc khi khởi tạo, hiển thị trong bộ nhớ nhà cung cấp, lưu trữ an toàn, tính lũy đẳng và các lần gửi.

Phần triển khai trên `origin/main@e89c10b` đã tuân thủ ADR-004. Lát cắt này mở rộng bằng chứng xác minh trực tiếp và đối soát cổng con người/tích hợp mà không tạo ra thay đổi mã sản phẩm giả tạo.

## Phạm vi

- Các yêu cầu `ACCOUNT_VERIFICATION` và `PASSWORD_RESET` bị ràng buộc với FE02 chấp nhận dữ liệu OTP chuẩn, ID `AuthToken` dương và khóa lũy đẳng chính xác được suy ra từ nguồn.
- HTTP của Nhân viên và mọi bên yêu cầu ngoài FE02 có trong danh sách cho phép đều bị từ chối đối với các loại nhạy cảm đó.
- `sourceFeature` qua HTTP trả về chính xác lỗi hợp đồng an toàn mà không có tác dụng phụ lên lưu trữ, lần thử, nhà cung cấp hay kiểm toán.
- Nội dung nhạy cảm chỉ đến nhà cung cấp được chèn/cấu hình và tiếp tục không xuất hiện trong hàng thông báo, payload an toàn, kiểm toán, nhật ký, lần thử, phản hồi và DTO phát lại.
- Xác minh/đặt lại thực hiện một lần gọi bên yêu cầu cho mỗi token; yêu cầu xác minh hoặc đặt lại lặp lại tạo ID token và khóa sự kiện mới mà không gửi trực tiếp trùng lặp.
- `CHANGE_PASSWORD_OTP`, chấp nhận token cũ, thiết lập FE11, gửi kết quả FE04, tích hợp bên gọi FE09, hành vi frontend, SMTP thật, bảng/chỉ mục lược đồ và phần phụ thuộc mới vẫn nằm ngoài lát cắt này.

## Kiểm toán yêu cầu

| Hạng mục xác minh ADR-004 | Bằng chứng trực tiếp | Kết quả |
| --- | --- | --- |
| 1. HTTP của Nhân viên không thể gửi bất kỳ loại nhạy cảm nào | Ma trận từ chối HTTP chuẩn trong `notificationRoutes.test.js` | PASS |
| 2. Bên yêu cầu ngoài FE02 không thể gửi bất kỳ loại nhạy cảm nào | Tích Descartes đầy đủ của cả hai loại và `FE04`, `FE07`, `FE08`, `FE09`, `FE11`, `SYSTEM` | PASS |
| 3. FE02 có thể gửi cả hai mẫu OTP chuẩn | Kiểm thử bên yêu cầu bị ràng buộc và tuyến xác thực FE02 | PASS |
| 4. Nhà cung cấp nhận OTP còn các bề mặt lưu/hiển thị thì không | Các khẳng định về bộ nhớ nhà cung cấp, lưu trữ, kiểm toán, nhật ký, phản hồi, lỗi và phát lại | PASS |
| 5. FE02 thực hiện một yêu cầu cho mỗi token mà không gửi trực tiếp trùng lặp | Các khẳng định bên yêu cầu cho đăng ký, gửi lại và quên mật khẩu | PASS |
| 6. Gửi thất bại không hoàn tác luồng nguồn | Kiểm thử ngoại lệ bên yêu cầu và trạng thái `FAILED` an toàn | PASS |
| 7. Gửi lại tạo ID token và khóa mới | Kiểm thử gửi lại xác minh cùng sự kiện đặt lại mật khẩu lặp lại | PASS |

Không có khẳng định mới nào làm lộ sự không tuân thủ ở production. Các tệp production vẫn không thay đổi.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Ranh giới sở hữu thông báo | PASS - 1 bộ, 125 kiểm thử |
| Ranh giới bên yêu cầu xác thực FE02 | PASS - 1 bộ, 31 kiểm thử |
| Cổng FE10/FE02/di chuyển/tích hợp tập trung | PASS - 4 bộ, 170 kiểm thử |
| Toàn bộ bộ kiểm thử backend | PASS - 53 bộ, 916 kiểm thử |
| Độ bao phủ backend | PASS - 92.68% câu lệnh, 81.66% nhánh, 96.59% hàm, 92.61% dòng |
| Kiểm thử frontend | PASS - 149/149 |
| Lint/bản dựng frontend | PASS; bản dựng vẫn giữ cảnh báo đã biết và không gây chặn về phân đoạn |
| Tích hợp hệ thống | PASS - 10/10 |
| Kiểm thử triển khai | PASS - 7/7 |
| E2E trên trình duyệt | PASS - 4/4 trên các cổng cô lập `4187/3102` |
| Nhập OpenAPI/backend | PASS |
| Truy vết FE10/FE02 | PASS - 10/10 và 26/26; thực thi toàn dự án PASS |
| Vệ sinh phần khác biệt | PASS tại điểm kiểm tra trước H2 hiện tại |

Lần thử E2E đầu tiên thất bại trước khi thực thi kiểm thử vì một worktree lịch sử khác đang chiếm cổng `4173`. Kiểm tra tiến trình đã xác định máy chủ Vite đó; sau đó bộ kiểm thử đạt trên các cổng cô lập được hỗ trợ mà không dừng hay chỉnh sửa worktree kia.

## Các lớp xác thực

| Lớp | Trạng thái | Bằng chứng / ranh giới còn lại |
| --- | --- | --- |
| L1 Tự động | PASS | Backend tập trung/toàn bộ, độ bao phủ, frontend, hệ thống, triển khai, E2E, OpenAPI/nhập, truy vết và kiểm tra phần khác biệt đều đạt |
| L2 Tuân thủ đặc tả | PASS | Cả bảy hạng mục xác minh ADR-004 ánh xạ trực tiếp tới mã/kiểm thử; truy vết FR FE10/FE02 đạt 100% |
| L3 Hiến chương/an toàn | PASS | Quyền sở hữu máy chủ, không lưu/ghi nhật ký OTP, lỗi an toàn, kho lưu trữ tham số hóa hiện có, ngăn xếp đã phê duyệt và không mở rộng lược đồ/phần phụ thuộc được giữ nguyên |
| L4 Chấp nhận | PASS | Người dùng đã phê duyệt thiết kế và chấp nhận thường trực phạm vi nhà cung cấp được chèn vào ngày 2026-07-19; PR triển khai #42 đã merge và CI `main` chính xác sau merge đã đạt; SMTP thật vẫn ngoài phạm vi |

## Bằng chứng SQL và tích hợp hiện có

Lát cắt này không thay đổi lược đồ, di chuyển, SQL của kho lưu trữ hay hành vi production. Việc di chuyển mẫu OTP chuẩn và đồng bộ lược đồ dùng chung trước đó đã đạt hai lần thực thi SQL Server dùng một lần và được merge qua PR #40. Chỉnh sửa SQL mới không bắt buộc cũng không được cấp quyền cho việc mở rộng ranh giới chỉ gồm bằng chứng này.

## Ranh giới H2/H3 và tích hợp

- Hàm băm phạm vi rà soát H2 không gồm gói xác thực tự ghi nhận này: `9d8e3920600a1e515392459ebb022e981c99213a`.
- Kết quả H2: PASS và không có phát hiện. Phần khác biệt được tạo đã rà soát chỉ thay đổi hai tệp kiểm thử cùng Markdown FE02/FE10/thiết kế/kế hoạch/bằng chứng; không có thay đổi về nguồn sản phẩm, lược đồ, phần phụ thuộc, sản phẩm frontend, bên gọi FE09 hay hành vi `CHANGE_PASSWORD_OTP`.
- Phê duyệt thường trực của người dùng cho phép commit, công bố PR, merge H3, giám sát sau merge và hoàn tất cơ học chính xác sau khi các kiểm tra bắt buộc đạt.
- FE10-S05 và FE02-T033 đã hoàn tất đến B7. Các ranh giới duy nhất còn lại là gửi qua nhà cung cấp thật, UI hộp thư đến và tích hợp bên gọi FE09 đã được hoãn rõ ràng.

## Hoàn tất cuối cùng

- Không có nguồn sản phẩm, lược đồ, phần phụ thuộc, sản phẩm frontend, bên gọi FE09 hay hành vi `CHANGE_PASSWORD_OTP` nào thay đổi trong PR triển khai.
- Tài liệu hoàn tất giữ nguyên các ranh giới tương lai đã phê duyệt và không tuyên bố hoàn tất toàn bộ tính năng vượt quá lát cắt OTP FE10/FE02.
