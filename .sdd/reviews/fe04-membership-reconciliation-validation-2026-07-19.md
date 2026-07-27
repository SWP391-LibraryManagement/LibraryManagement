# Xác thực đối soát Thành viên FE04 - 2026-07-19

Trạng thái: TỰ ĐỘNG KHÔNG SQL ĐÃ CẤU HÌNH ĐẠT; SQL TRỰC TIẾP, HỘI TỤ XUYÊN TÍNH NĂNG VÀ CHẤP THUẬN CỦA CON NGƯỜI ĐANG CHỜ

Nhánh: `feat/fe04-membership-reconciliation`

## Quyết định

Dùng phương thức bàn giao Kết hợp với độ sâu Đầy đủ cho Lõi vòng đời Thành viên. SDD kiểm soát
điều kiện đủ chuẩn, lịch sử bất biến, đồng thời, tính nguyên tử giao dịch/kiểm toán, API/quyền riêng tư và quyền sở hữu FE10.
ADD được giới hạn ở phép chiếu và nội dung UI có thể đảo ngược theo hợp đồng đã phê duyệt đó.

## Phạm vi

- Người dùng đang hoạt động đã xác thực có thể đăng ký và chỉ đọc vỏ trạng thái của chính họ theo chuẩn.
- `Members.Status` vẫn là chuẩn; lịch sử đăng ký được giữ lại và sắp xếp tất định.
- Một đơn đang chờ và một kết quả đánh giá cuối được thực thi tại ranh giới lưu trữ lâu dài.
- Ghi đơn/Thành viên/kiểm toán dùng chung một giao dịch; việc gửi FE10 chỉ xảy ra sau commit và
  không chặn, với siêu dữ liệu nguồn FE04 chính xác và tính lũy đẳng.
- Danh sách/tìm kiếm/phân trang của nhân viên và frontend sử dụng sự thật máy chủ mà không có trình diễn hoặc trạng thái dự phòng `NONE`
  sai.

## Bằng chứng tự động

| Kiểm tra | Kết quả |
| --- | --- |
| Backend trọng tâm | PASS - 1 bộ, 18 kiểm thử |
| Hợp đồng SQL tĩnh | PASS - 4 kiểm thử; bỏ qua 6 kiểm thử SQL có thể thay đổi khi không có cấu hình DB |
| Frontend trọng tâm | PASS - 5 kiểm thử |
| Toàn bộ backend | PASS - 38 bộ, 619 kiểm thử |
| Độ bao phủ backend | PASS - câu lệnh 92.51%, nhánh 82.46%, hàm 97.10%, dòng 92.44% |
| Toàn bộ frontend | PASS - 122 kiểm thử |
| Lint/bản dựng frontend | PASS |
| Tình trạng nhập backend | PASS |
| Truy vết nguồn FE04 | PASS - 12/12 thẻ FR, 100% |
| Vệ sinh diff | PASS - `git diff --check` |

## Các lớp xác thực

| Lớp | Trạng thái | Bằng chứng / Khoảng trống |
| --- | --- | --- |
| L1 Tự động | MỘT PHẦN | Mọi cổng không SQL đã cấu hình đều đạt; sáu ca SQL có thể thay đổi bắt buộc và E2E trình duyệt chưa chạy |
| L2 Tuân thủ đặc tả | ĐẠT cho phạm vi cục bộ | Yêu cầu về trạng thái chuẩn, lịch sử, tranh chấp, kiểm toán, quyền riêng tư, thông báo và frontend ánh xạ tới nguồn/kiểm thử |
| L3 Hiến chương/an toàn | ĐẠT cho diff hiện tại | SQL tham số hóa, tuyến được bảo vệ, DTO/lỗi an toàn, không có phụ thuộc, bí mật, PII, gán vai trò hoặc xóa vật lý lịch sử mới |
| L4 Chấp thuận | ĐANG CHỜ | Xác nhận của chủ sở hữu Dat/FE07/FE08 và đánh giá trình duyệt của người dùng cuối chưa diễn ra |

## Các cổng còn lại

- Chạy phần di chuyển hai lần và mọi ca SQL có thể thay đổi trên SQL Server dùng một lần đã phê duyệt.
- Hội tụ FE04, FE10, FE02 và đường cơ sở lược đồ FE11 vào một nhánh rồi chạy lại các bộ xuyên tính năng.
- Thu thập bằng chứng trình duyệt của người đăng ký/nhân viên, gồm lỗi mạng và đăng ký lại bị từ chối.
- Nhận đánh giá độ phù hợp hệ thống của con người trước khi commit, đẩy, công bố PR hoặc hợp nhất.

## Xác thực lại sau đồng bộ Origin

- Tua nhanh worktree tính năng đang có thay đổi từ `62ac2d1` lên `origin/main@b2ad9b1` mà không chồng lấn, commit, cất tạm hoặc mất thay đổi cục bộ.
- Xác minh trọng tâm mới sau đồng bộ: `membershipRoutes.test.js` đạt 18/18.

## Kiểm soát phạm vi

- Không thêm việc gán vai trò, quy trình mượn/đặt trước, hành vi hết hạn/thanh toán, phụ thuộc hoặc
  trạng thái Thành viên ngoài phạm vi nào.
- Không tạo commit, thao tác đẩy, PR hoặc hợp nhất.
- Diff FE11 chính xác và checkout chính không bị sửa.
