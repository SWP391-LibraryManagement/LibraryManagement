# Báo cáo Cuối cùng Giai đoạn 3 - Hoàn thiện và bàn giao

Ngày: 2026-07-19
nhánh: `docs/phase3-polish-delivery`
Quyết định: **Tích hợp trên `main`**

## Phạm vi

Giai đoạn 3 tăng cường và chứng minh bản phát hành FE01-FE12 được chấp nhận mà không cần thêm phạm
vi kinh doanh mới. Công việc bao gồm bằng chứng môi trường tiền sản xuất Azure, đối chiếu SQL trực
tiếp, hoàn thiện hiệu suất giao diện người dùng, diễn tập trình duyệt tổng hợp và tài liệu phát hành.
Tại thời điểm Giai đoạn 3, bộ slide bảo vệ đồ án có liên kết nguồn cũng là một phần của bàn giao;
artifact này về sau đã được xóa theo quyết định của người dùng như ghi tại phần tài liệu bên dưới.

Bằng chứng tích hợp: PR #48 được hợp nhất thành `4d02fc4`; `main` CI `29696519912` sau hợp nhất đã
được thông qua; Quy trình môi trường tiền sản xuất `29696612260` đã vượt qua ngưỡng chất lượng, cả
hai quá trình triển khai và kiểm thử nhanh sáu bước có truy vấn SQL.

Tại thời điểm thực hiện báo cáo này, `v1.0.2` là bản phát hành nguồn chuẩn tiếp theo. Hiện nó đã
được xuất bản tại `c988af1`; `main@cce59d0` là cơ sở ứng dụng sau phát hành đã được xác thực sau PR
#57/#58, không phải là bản phát hành `v1.0.3` được ủy quyền trước SHA. Mọi `v1.0.3` trong tương lai
đều phải sử dụng `main` SHA sau H2, H3 và CI chính xác sau hợp nhất.

## Kiến trúc và truy vết

The approved Node.js/Express, React/Bootstrap, SQL Server, and REST stack is
unchanged. Runtime boundaries are React on Azure Static Web Apps, Express on
Azure App Service, and Azure SQL. The historical PR #48 snapshot recorded all
12 feature packages at 100% FR traceability; the 2026-08-02 closeout refresh
below supersedes that count. Route guards and backend authorization remain authoritative.

## Tóm tắt bằng chứng

Bảng bên dưới lưu giữ ảnh chụp nhanh PR #48 Giai đoạn 3 lịch sử. Số lượng kiểm tra 916 máy chủ và
151 giao diện người dùng của nó không phải là tổng số đối chiếu hiện tại.

| Khu vực | Kết quả quan sát |
| --- | --- |
| Chất lượng máy chủ | 916 kiểm thử trên 53 bộ kiểm thử; số liệu độ bao phủ 92,68%, nhánh 81,66%, chức năng 96,59%, dòng 92,61%. |
| Chất lượng giao diện người dùng | 151 kiểm thử, vượt qua kiểm tra mã, vượt qua bản dựng sản xuất. |
| Tiện ích triển khai | Các kiểm thử 8/8 đã vượt qua. |
| Tích hợp hệ thống | Các kiểm thử 10/10 đã vượt qua. |
| Diễn tập trình duyệt | 4/4 luồng Playwright đạt trong 24,4 giây trên các cổng tùy chỉnh. |
| Gói giao diện người dùng | Mục nhập ban đầu giảm từ 999.203 xuống 320.688 byte (-67,9%); 57 asset theo cấp route. |
| Thời gian xác thực cục bộ | Đăng nhập p95 66,95 ms; `/auth/me` p95 1,45 ms với bcrypt với hệ số 10. |
| Môi trường tiền sản xuất Azure | Giao diện người dùng, sức khỏe, danh mục SQL, CORS cho phép/từ chối chính xác và vượt qua kiểm tra tuyến đường được bảo vệ ẩn danh. |
| Azure đã được xác thực | `c6e0c46421f0` chạy trực tiếp đã vượt qua thông tin đăng nhập quản trị viên/thành viên/thủ thư, các lần đọc được bảo vệ, yêu cầu mượn, phê duyệt và trả sách. |
| bàn giao SMTP | Thông báo `8` là `SENT` trong một lần thử; sự chấp nhận của nhà cung cấp và tìm kiếm tin nhắn Gmail IMAP đã được thông qua. |

## Full-project closeout refresh — 2026-08-02

The current pre-batch baseline is `main@161cc28ddd8fed522a90d8bcbcd0daf6b0e51b27` after PR #97. CI `30726791185` and staging deployment `30726924615` pass for that exact SHA. The staging smoke covers frontend, health, schema readiness, SQL catalog, allowed and blocked CORS, and an anonymous protected route.

The enforced traceability baseline passes while preserving implementation truth: FE02 is `PARTIAL` at 27/27 FR tags, FE04 is `PARTIAL` at 14/14, FE11 is `PARTIAL` at 35/43, and the other nine feature packages are `COMPLETE` at 100%. PR #95 already proves FE02-T067, FE05-T019, and FE11-CAT01; PR A publishes only those bounded documentation closeouts.

The remaining work is governed by the approved four-PR design: PR B FE11 Core, PR C FE04 acceptance and FE02 reconciliation, and PR D final integration/release evidence. `v1.0.3` is not authorized by this interim report. Demonstration video is `WAIVED — NOT REQUIRED` by Nhat on 2026-08-02; no link or artifact will be fabricated.

Historical localized desktop/mobile acceptance passed on 2026-07-21. The later responsive corrections are integrated in the current pre-batch candidate and covered by its exact CI/deployment evidence, but they remain outside published `v1.0.2` until the final closeout release decision.

## SQL trực tiếp và kết quả di chuyển

kiểm thử nhanh có truy vấn SQL đã làm lộ ra `Books.RowVersion` bị thiếu và phần phụ thuộc chỉ mục
ISBN được lọc
trong quá trình di chuyển FE05. Quá trình di chuyển hiện giảm xuống và tạo lại chỉ mục đã lọc trong
cùng một giao dịch. Quá trình di chuyển FE04, FE05, FE06, FE10 và FE11 đã chạy hai lần so với
`LibraryManagementStaging`; 20 bảng và các cột rowversion/width bắt buộc đã được xác thực. Quy tắc
tường lửa tạm thời đã bị xóa và chính sách kết nối SQL được khôi phục về `Default`.

## Ranh giới chấp nhận

Bề mặt môi trường tiền sản xuất công khai, luồng vai trò Azure đã được xác thực và phân phối hộp thư
đến SMTP thực được coi là đã vượt qua. Cuộc chạy trực tiếp sử dụng dữ liệu kiểm thử tổng hợp tạm
thời; việc dọn dẹp trả về 0 fixture xác thực, sách và thông báo. Bộ lưu trữ hình đại diện bền
bỉ, SQL CI dùng chung và SLA sản xuất vẫn còn những hạn chế được ghi nhận.

Sự cố SMTP được bắt nguồn từ cấu trúc cấu hình `SMTP_USER` không đúng định dạng. Cài đặt App
Service đã được sửa thành địa chỉ `MAIL_FROM` hợp lệ và ứng dụng đã được khởi động lại; không có
thông tin xác thực hoặc nội dung tin nhắn nào được đưa vào báo cáo này.

## Lệnh tái hiện

```powershell
npm.cmd run trace:enforce
npm.cmd run test:deployment
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
$env:E2E_FRONTEND_PORT='4273'; $env:E2E_BACKEND_PORT='3200'
$env:E2E_FRONTEND_URL='http://127.0.0.1:4273'; $env:E2E_BACKEND_URL='http://127.0.0.1:3200'
npm.cmd run test:e2e
npm.cmd run phase3:performance
$env:STAGING_FRONTEND_URL='https://lemon-wave-04db51100.7.azurestaticapps.net'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
```

## Tệp bàn giao

- Bằng chứng môi trường tiền sản xuất và SQL: `docs/release/phase3-staging-evidence-2026-07-19.md`.
- Báo cáo hiệu suất: `docs/performance/phase3-performance-report-2026-07-19.md`.
- Nhật ký kiểm toán người dùng: `docs/release/phase3-user-testing-record-2026-07-19.md`.
- Biên bản diễn tập: `docs/release/phase3-rehearsal-record.md`.
- Các tệp DOCX/PPTX hỗ trợ thuyết trình đã được xóa theo yêu cầu; dùng bộ tài liệu Markdown đã Việt hóa khi cần tra cứu.
- Xác thực bốn lớp: `.sdd/reviews/phase3-final-validation-2026-07-19.md`.
