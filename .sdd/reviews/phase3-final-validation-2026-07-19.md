# Xác thực cuối cùng Giai đoạn 3 - 2026-07-19

Commit xác thực: `80d81e4`

## Quyết định

Giai đoạn 3 đã được **tích hợp và xác thực** trên `main` tại commit merge `4d02fc4`.
Gói này đáp ứng bốn lớp xác thực Hybrid SDD cho phạm vi
được quan sát. Chấp nhận Azure có xác thực và gửi đến hộp thư SMTP thật sau đó
được xác minh trong lần chạy trực tiếp `c6e0c46421f0`. Lưu trữ ảnh đại diện bền vững, CI SQL dùng chung và
SLA production vẫn là các ranh giới còn lại rõ ràng; không hạng mục nào được đánh dấu đạt
bằng suy luận.

## L1 - Kiểm tra tự động

Tất cả lệnh bên dưới đã được chạy trong worktree Giai đoạn 3 cô lập.

| Lệnh | Kết quả |
| --- | --- |
| `npm.cmd run trace:enforce` | PASS; 12/12 tính năng, độ bao phủ FR 100%, không có mục dưới ngưỡng. |
| `npm.cmd run test:deployment` | PASS; 8/8 kiểm thử tiện ích triển khai. |
| `npm.cmd --prefix backend run test:coverage:ci` | PASS; 916 kiểm thử, 53 bộ; câu lệnh 92.68%, nhánh 81.66%, hàm 96.59%, dòng 92.61%. |
| `npm.cmd --prefix backend run test:integration:system` | PASS; 10/10 kiểm thử tích hợp hệ thống. |
| `npm.cmd --prefix frontend test` | PASS; 151/151 kiểm thử. |
| `npm.cmd --prefix frontend run lint` | PASS. |
| `npm.cmd --prefix frontend run build` | PASS; 57 tài nguyên JS, tệp đầu vào 320,688 byte, không có cảnh báo phân đoạn đầu vào. |
| `E2E_FRONTEND_PORT=4273 E2E_BACKEND_PORT=3200 E2E_FRONTEND_URL=http://127.0.0.1:4273 E2E_BACKEND_URL=http://127.0.0.1:3200 npm.cmd run test:e2e` | PASS; 4/4 kiểm thử Playwright trong 24.4 giây. |
| `npm.cmd run phase3:performance` | PASS; p95 đăng nhập 66.95 ms, p95 `/auth/me` 1.45 ms, chi phí bcrypt 10. |
| `npm.cmd run smoke:staging` với các URL staging quan sát được | PASS; frontend, sức khỏe, danh mục SQL, CORS được phép, CORS bị chặn, tuyến được bảo vệ. |
| `git diff --check` | PASS; không có lỗi khoảng trắng. |

Quét phần giữ chỗ/bí mật chỉ trả về chính lệnh quét và
các ví dụ kế hoạch thiết lập trong lịch sử như `JWT_SECRET=<App Service secret>`;
không có giá trị bí mật đã commit hay phần giữ chỗ URL phát hành chưa được theo dõi trong
các sản phẩm bàn giao Giai đoạn 3.

## L2 - Đặc tả và truy vết

- Giai đoạn 3 giữ nguyên các hợp đồng FE01-FE12 đã chấp nhận; không có quy tắc nghiệp vụ hay
  quyền vai trò mới nào được đưa vào.
- Bản sửa di chuyển FE05 được bao phủ bằng kiểm thử RED-GREEN và được ghi tài liệu
  trong `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Tải lười cấp tuyến được bao phủ bằng kiểm thử hợp đồng frontend và giữ
  chốt bảo vệ tuyến, máy khách API cùng ranh giới phân quyền trong mô-đun đầu vào.
- Các sản phẩm bàn giao ánh xạ tới thiết kế/kế hoạch Giai đoạn 3, báo cáo hiệu năng, bản ghi
  kiểm thử người dùng, bản trình bày bảo vệ/bản ghi nguồn và gói xác thực này.

## L3 - Hiến chương và an toàn

- Ngăn xếp đã phê duyệt vẫn là Node.js + Express.js, React + Bootstrap, SQL Server
  và các API REST.
- Không có bí mật, token, OTP thô, mật khẩu cơ sở dữ liệu, nội dung SMTP hay PII thật
  trong bằng chứng Giai đoạn 3 được theo dõi.
- Quyền truy cập tường lửa tạm thời của người vận hành Azure SQL đã bị xóa và chính sách
  kết nối được khôi phục thành `Default` sau khi chẩn đoán.
- Smoke staging công khai xác minh chính xác CORS được phép và việc từ chối một
  nguồn không đáng tin; truy cập ẩn danh vào tài nguyên được bảo vệ trả về cấu trúc bao `401` an toàn.
- App Service `TRUST_PROXY=true` được ghi tài liệu là cấu hình không bí mật để
  thực thi HTTPS chính xác phía sau proxy của Azure.
- Sự cố SMTP trực tiếp nằm ở hình dạng cấu hình, không phải thay đổi mã ứng dụng:
  đầu vào `SMTP_USER` sai định dạng đã được sửa thành địa chỉ `MAIL_FROM` hợp lệ;
  không có giá trị bí mật nào trong bằng chứng.

## L4 - Xác minh chấp nhận

Kết quả chấp nhận quan sát được được chủ ý tách theo ranh giới bằng chứng:

| Hạng mục chấp nhận | Trạng thái | Bằng chứng |
| --- | --- | --- |
| Frontend và backend công khai | PASS | Sáu kiểm tra smoke staging độc lập. |
| Danh mục công khai dựa trên SQL | PASS | `/api/books?page=1&limit=1` trả về cấu trúc bao chuẩn sau khi năm lần di chuyển được chạy hai lần. |
| CORS nghiêm ngặt | PASS | Cho phép chính xác nguồn staging; chặn nguồn không đáng tin. |
| Tuyến bảo vệ truy cập ẩn danh | PASS | `/api/auth/me` trả về `401`. |
| Luồng chuẩn cục bộ tổng hợp có xác thực | PASS | 4/4 bộ Playwright; đăng nhập -> mượn -> phê duyệt -> trả -> phạt -> báo cáo. |
| Bằng chứng bố cục đáp ứng | PASS | Ảnh chụp màn hình máy tính/di động và khẳng định không tràn ngang. |
| Luồng Thành viên/Thủ thư Azure có xác thực | PASS | Lần chạy trực tiếp `c6e0c46421f0` xác minh đăng nhập ba vai trò, lượt đọc được bảo vệ, yêu cầu mượn, phê duyệt và trả. |
| Gửi đến hộp thư SMTP thật | PASS | Thông báo `8` ở trạng thái `SENT` trong một lần thử; đã quan sát việc nhà cung cấp chấp nhận và tìm kiếm IMAP Gmail. |
| Lưu trữ ảnh đại diện bền vững | LIMITATION | Hệ thống tệp App Service không phải kho lưu trữ bền vững cho production. |
| CI SQL dùng chung | LIMITATION | CI không cung cấp dịch vụ SQL Server dùng một lần. |
| SLA production | OUT OF SCOPE | Chỉ dành cho môi trường staging bằng tín dụng sinh viên. |

## Khả năng tái lập và sản phẩm

- Điểm cuối staging và chẩn đoán SQL: `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Đo lường hiệu năng: `docs/performance/phase3-performance-report-2026-07-19.md`.
- Kiểm thử người dùng và diễn tập: `docs/release/phase3-user-testing-record-2026-07-19.md` và `docs/testing/system-integration-demo-runbook.md`.
- Nội dung tường thuật cuối cùng và luồng có định thời: `docs/release/phase3-final-report.md` và `docs/release/phase3-rehearsal-record.md`.
- Nguồn bản trình bày và tuyên bố: `docs/presentation/phase3-defense-deck.pptx` và `docs/presentation/phase3-defense-deck-source.md`.
- QA kết xuất: đã kết xuất 10 trang chiếu; `slides_test.py` báo cáo `Test passed. No overflow detected.`

## Cổng tích hợp

Nhánh đã được merge dưới dạng PR #48. Lần chạy CI `main` sau merge `29696519912` đã đạt
và quy trình staging mới `29696612260` đã đạt cổng chất lượng, cả hai lần triển khai
cùng sáu kiểm tra smoke hiện tại có nhận biết SQL. Lần chạy lịch sử `29694280002` chỉ còn là
ngữ cảnh vì diễn ra trước khẳng định smoke có nhận biết SQL.

Quan sát có xác thực/SMTP đã dùng các fixture tạm thời và hoàn tất
dọn dẹp mà không còn fixture xác thực, sách hay thông báo nào, đồng thời không còn
quy tắc tường lửa `phase3-live-observation*` tạm thời.
