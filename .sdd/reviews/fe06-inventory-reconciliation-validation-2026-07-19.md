# Xác thực đối soát Kho sách FE06 - 2026-07-19

## Quyết định

- Phương pháp: SDD+ADD kết hợp, độ sâu Đầy đủ cho Lõi trạng thái kho sách, lược đồ, đồng thời và kiểm toán; ADD giới hạn cho Khung frontend.
- Phạm vi: FE06-T001 đến FE06-T008 trong `feat/fe06-inventory-reconciliation`.
- Trạng thái tích hợp: sẵn sàng để con người đánh giá; chưa thực hiện commit, đẩy, PR hoặc hợp nhất.

## Bằng chứng mới

| Cổng | Lệnh / kiểm tra | Kết quả |
| --- | --- | --- |
| Backend trọng tâm | `npm.cmd --prefix backend test -- --runTestsByPath tests/inventoryRoutes.test.js --silent` | 31/31 đạt |
| Hợp đồng SQL FE06 | `npm.cmd --prefix backend run test:sql:fe06 -- --silent` | 5/5 kiểm tra tĩnh đạt; bỏ qua 1 kiểm thử SQL trực tiếp |
| Frontend FE06 | `node --test frontend/test/inventoryOperationalFrontend.test.js` | 6/6 đạt |
| Toàn bộ backend | `npm.cmd --prefix backend test -- --silent` | 633/633 đạt |
| Toàn bộ frontend | `npm.cmd --prefix frontend test` | 124/124 đạt |
| Độ bao phủ | `npm.cmd --prefix backend run test:coverage:ci -- --silent` | câu lệnh 92.51%, nhánh 82.46%, hàm 97.10%, dòng 92.44% |
| Lint/bản dựng frontend | `npm.cmd --prefix frontend run lint` và `npm.cmd --prefix frontend run build` | đạt; chỉ có cảnh báo kích thước khối Vite |
| Truy vết | `npm.cmd run trace:enforce` | FE06 24/24 (100%); thực thi đạt |
| OpenAPI | Nạp PyYAML cùng các xác nhận tuyến FE06 | đạt |
| Kiểm tra nhanh nhập mô-đun | yêu cầu nạp ứng dụng/tuyến/dịch vụ backend | đạt |
| Vệ sinh diff | `git diff --check` | đạt |

## Kiểm tra đặc tả và an toàn

- Danh sách kho sách trả về chính xác vỏ trang/số lượng do máy chủ sở hữu và chỉ cho phép các trường tóm tắt bản sao/sách trong danh sách trắng.
- Tạo mới do máy chủ kiểm soát ở `AVAILABLE`, từ chối sách cha không hoạt động và không bao giờ sửa siêu dữ liệu FE05.
- Thao tác thay đổi bản sao hiện có yêu cầu `If-Match` mờ; trạng thái cũ trả về `409 STALE_COPY_STATE` mà không thay đổi.
- Thay đổi trạng thái thủ công từ chối trực tiếp `BORROWED`/`RESERVED`, yêu cầu lý do đã cắt khoảng trắng và chuyển xung đột đến FE07/FE08.
- Thứ tự khóa kho dữ liệu là `BookCopies -> BorrowDetails -> Reservations`; thao tác thay đổi và kiểm toán dùng chung một giao dịch.
- Vô hiệu hóa chỉ là mềm và việc lặp lại vô hiệu hóa phiên bản hiện tại có tính lũy đẳng mà không tạo kiểm toán chuyển trạng thái lần hai.
- Phản hồi FE06 không để lộ bí mật, danh tính người mượn, danh tính chủ đặt trước, dữ liệu tiền phạt hoặc siêu dữ liệu kiểm toán được bảo vệ.

## Các cổng còn mở

- Thực thi rowversion/đồng thời SQL trực tiếp yêu cầu `DB_SERVER`/`DB_NAME` và `FE06_SQL_TEST_ALLOW_MUTATION=true` trong môi trường SQL Server có thể thay đổi đã phê duyệt.
- Chấp thuận Trình duyệt/L4 và xác nhận quyền sở hữu/thứ tự khóa FE05/FE07/FE08 vẫn đang chờ.
- Đánh giá tích hợp B7 của con người vẫn bắt buộc trước khi commit, công bố hoặc hợp nhất.

## Xác thực lại sau đồng bộ Origin

- Tua nhanh worktree tính năng đang có thay đổi từ `62ac2d1` lên `origin/main@b2ad9b1` mà không chồng lấn, commit, cất tạm hoặc mất thay đổi cục bộ.
- Xác minh trọng tâm mới sau đồng bộ: `inventoryRoutes.test.js` đạt 31/31.

## Sửa tranh chấp giao dịch sau H2

- Nguyên nhân gốc: kiểm tra trước của dịch vụ chạy trước giao dịch, trong khi `lockCopyForMutation` trả về trạng thái mượn/đặt trước đã khóa mà `updateCopyStatus` bỏ qua; trạng thái cha cũng không có thẩm quyền bên trong giao dịch tạo/trạng thái.
- ĐỎ: bốn hồi quy tuyến nhận `201/200` thay vì `409` bắt buộc cho tranh chấp tạo-cha, mượn, đặt trước và trạng thái-cha.
- XANH: `inventoryRoutes.test.js` đạt `35/35`; frontend FE06 đạt `6/6`; truy vết vẫn là `24/24`; vệ sinh diff đạt.
- SQL trực tiếp: `npm.cmd --prefix backend run test:sql:fe06 -- --silent` đạt `10/10` sau khi áp dụng phần di chuyển FE06 hai lần lên cơ sở dữ liệu dùng một lần.
- Dọn dẹp: `DB_CLEAN` và `LOGIN_CLEAN`; mật khẩu SQL được tạo chỉ tồn tại trong bộ nhớ tiến trình.
- Trạng thái con người: xác nhận quyền sở hữu FE05/FE07/FE08, xác nhận UX của Dat, H3 cuối, hợp nhất và CI `main` sau hợp nhất vẫn còn mở.
