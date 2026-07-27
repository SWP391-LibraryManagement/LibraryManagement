# Xác thực đối soát đầy đủ FE01-FE12 - 2026-07-19

Trạng thái: COMPLETE - MỌI LỚP XÁC THỰC ĐỀU PASS; PR ĐÃ MERGE; CI MAIN SAU MERGE ĐÃ PASS

Nhánh: `feat/full-reconciliation`

Đường cơ sở ban đầu: `origin/main@b2ad9b1`

Upstream đã tích hợp: `origin/main@3f63a13`

## Quyết định

- Phương thức bàn giao: Hybrid SDD + ADD.
- Độ sâu đặc tả: Đầy đủ.
- Core: quy tắc nghiệp vụ, phân quyền, hợp đồng API công khai và được bảo vệ, lược đồ cùng di chuyển SQL, tương tranh, hành vi kiểm toán, báo cáo xác định và chuyển đổi trạng thái vòng đời.
- Shell: phần trình bày frontend, bố cục vận hành, định dạng CSV, cấu thành bộ kiểm thử và tài liệu bằng chứng.

Độ sâu này bắt buộc vì hoạt động đối soát trải rộng FE01-FE12 và thay đổi các tuyến nhạy cảm về bảo mật, hợp đồng dùng chung, trạng thái bền vững cùng hành vi SQL tương tranh. Công việc UI và bộ kiểm thử có thể hoàn nguyên vẫn bị giới hạn bởi các hợp đồng Core đã phê duyệt.

## Sản phẩm bắt buộc

- Hiến chương, ngữ cảnh dùng chung, ràng buộc toàn cục/nghiệp vụ/an toàn, ADR-002 và các tệp SPEC/PLAN/TASKS/TEST_PLAN/CHANGELOG tính năng bị ảnh hưởng đã được đối soát.
- Bản ghi xác thực riêng cho tính năng tồn tại trong `.sdd/reviews/` cho FE01, FE03-FE06, FE09-FE12 cùng Đợt hoàn thiện A và B của FE11.
- Bằng chứng hoàn tất nợ FE02 được ghi trong `.sdd/reviews/fe02-auth-debt-closure-validation-2026-07-19.md`.
- Bằng chứng danh mục ứng viên FE08 được ghi trong `.sdd/reviews/fe08-reservation-candidate-catalog-validation-2026-07-19.md`.
- Bằng chứng SQL trực tiếp được ghi trong `.sdd/reviews/full-reconciliation-live-sql-validation-2026-07-19.md`.
- Các ranh giới còn lại được chấp nhận được ghi trong `TECH_DEBT.md` thay vì bị âm thầm thể hiện là hành vi hoàn tất.

## Bằng chứng xác thực cục bộ cuối cùng

| Cổng | Ranh giới lệnh | Kết quả |
| --- | --- | --- |
| Hồi quy backend | `backend`: `npm test -- --runInBand` | PASS - 53/53 bộ, 905/905 kiểm thử |
| Độ bao phủ backend | `backend`: `npm run test:coverage:ci` | PASS - 92.68% câu lệnh, 81.66% nhánh, 96.59% hàm, 92.61% dòng |
| Hồi quy frontend | `frontend`: `npm test` | PASS - 149/149 kiểm thử |
| Lint frontend | `frontend`: `npm run lint` | PASS |
| Bản dựng frontend | `frontend`: `npm run build` | PASS; cảnh báo kích thước phân đoạn không gây chặn vẫn còn |
| Tích hợp hệ thống | `backend`: `npm run test:integration:system` | PASS - 10/10 kiểm thử |
| Tiện ích triển khai | gốc: `npm run test:deployment` | PASS - 7/7 kiểm thử |
| Chấp nhận trên trình duyệt | Playwright trên các cổng frontend/backend cô lập `4185/3101` với cả hai URL E2E rõ ràng | PASS - FE08, FE09, FE11 và luồng chuẩn hệ thống, 4/4; FE08 tập trung 1/1 |
| Truy vết | gốc: `npm run trace:enforce` | PASS - mọi tính năng FE01-FE12 được gắn thẻ 100% |
| OpenAPI | phân tích `backend/src/docs/openapi.yaml` bằng `yamljs` | `OPENAPI_PARSE_OK` |
| Nhập sức khỏe backend | nhập `backend/src/app.js` | `BACKEND_IMPORT_OK` |
| Kiểm toán phần phụ thuộc | gốc/backend/frontend: `npm audit --omit=dev --audit-level=high` | PASS - 0 lỗ hổng trong cả ba phạm vi |
| Quét bí mật | chữ ký token/khóa riêng độ tin cậy cao trên các dòng phần khác biệt được thêm | PASS - không có kết quả khớp |
| Quét phạm vi | đường dẫn thay đổi giới hạn trong bằng chứng/đặc tả SDD, ứng dụng, cơ sở dữ liệu và kiểm thử | PASS |
| Quét sai lệch FE11 | tên truy vấn yêu cầu lỗi thời, biến phân trang máy khách, `STRING_AGG` và bí danh chỉnh sửa Quản trị viên | PASS trong ranh giới hợp đồng FE11 |
| Quét sai lệch sản phẩm | phần xuất demo dùng chung lỗi thời và bộ chuyển đổi chỉnh sửa FE05 trùng lặp | PASS - chỉ còn `DEMO_BORROW_CATALOG` đã ghi tài liệu; `DEMO_RESERVABLE` FE08 và bí danh chỉnh sửa sách FE11 đã bị xóa |
| Vệ sinh phần khác biệt | `git diff --check` | PASS |

## Bằng chứng Pull Request và CI

- PR nháp: `#40` (`feat/full-reconciliation` -> `main`).
- Đầu nhánh triển khai/bằng chứng đã xác thực: `d820ab75d0c4042bd8a7317b054e72518faaeffd`.
- Lần chạy GitHub Actions trên đầu nhánh đó: `29685337907`.
- Kết quả: PASS - `foundation-checks` đã hoàn tất truy vết, kiểm thử backend, tích hợp hệ thống, độ bao phủ, lint/kiểm thử/bản dựng frontend, E2E Playwright và nhập sức khỏe backend trên đầu nhánh được push đã qua rà soát H2.
- Đầu nhánh bằng chứng H3 cuối cùng: `24680ffe9052f35298cbef4a2555bcb39e333824`; CI PR `29685838610` - PASS.
- PR #40 được merge thành `1555111e895a1850da5daee7ade3453479c3a82b`.
- CI `main` chính xác sau merge `29685953839` - PASS.

## Tích hợp upstream

Sau khi PR nháp #40 được mở, `origin/main` đã tiến tới `3f63a13`. Nhánh tính năng merge trạng thái đó mà không force-push hay loại bỏ các tài liệu phát hành/RDS/SDS mới.

- Xung đột FE01/FE05 giữ cấu trúc bao công khai chuẩn của hoạt động đối soát, quyết định không có điểm cuối thể loại, phân trang quản lý do máy chủ sở hữu, rowversion `If-Match`, kiểm toán có giao dịch và phép chiếu khả dụng an toàn công khai.
- FE09 tích hợp ranh giới production v0.4.1 mới hơn từ main: các chỉnh sửa tạo/cập nhật/xóa tiền phạt cũ vẫn không được đăng ký và trả về `404`, trong khi phần triển khai múi giờ, phân trang, tương tranh, thanh toán toàn bộ và kiểm toán nguyên tử của hoạt động đối soát vẫn có thẩm quyền.
- Kiểm tra tập trung sau merge đã đạt: 77/77 kiểm thử backend, 17/17 kiểm thử frontend và truy vết FE01-FE12 ở mức 100%.
- Kiểm tra đầy đủ sau merge đã đạt: backend 888/888, frontend 145/145, tích hợp hệ thống 10/10, triển khai 7/7, Playwright 2/2, độ bao phủ/lint/bản dựng/truy vết cùng quét phần phụ thuộc/bảo mật/phạm vi.

## Cổng SQL trực tiếp

Lần chạy lại cuối cùng, được lặp lại sau khi tích hợp `origin/main@3f63a13`, dùng cơ sở dữ liệu SQL Server cục bộ và thông tin đăng nhập SQL dùng một lần. Thông tin xác thực chỉ tồn tại trong bộ nhớ tiến trình và chưa từng được ghi vào tệp hay đầu ra.

- `database/Librarymanagement.sql` chuẩn: PASS.
- Năm lần di chuyển đối soát theo thứ tự chuẩn: PASS ở lần thực thi 1/2 và 2/2.
- Các bộ Jest dựa trên SQL: PASS - 9/9 bộ, 69/69 kiểm thử, gồm kiểm tra lại tranh chấp sau bước kiểm tra trước FE06 và trường hợp đặt chỗ mở/ứng viên FE08.
- Dọn dẹp: `DB_CLEAN` và `LOGIN_CLEAN`.
- Cơ sở dữ liệu ứng dụng và tiến trình frontend hiện có trên cổng `4173` không bị sử dụng hay chỉnh sửa.

## Dọn dẹp sai lệch sản phẩm

Một kiểm thử RED xác định năm phần xuất demo dùng chung không được dùng: `DEMO_MY_RESERVATIONS`, `DEMO_ALL_RESERVATIONS`, `DEMO_BORROW_ROWS`, `DEMO_ADMIN_REQUESTS` và `DEMO_MEMBERS`. Chúng đã bị xóa mà không thay đổi hành vi lúc chạy.

- RED tập trung: 18 đạt, 1 thất bại.
- GREEN tập trung: 19/19 đạt.
- Hồi quy frontend đầy đủ sau dọn dẹp: 145/145, lint PASS, bản dựng PASS.

`DEMO_BORROW_CATALOG` vẫn là phần phụ thuộc ứng viên FE07 tạm thời đã ghi tài liệu. FE08 không còn nhập hay kết xuất `DEMO_RESERVABLE`; TD-028 được giải quyết cho lát cắt triển khai phía tác nhân và xác thực tự động.

## Theo dõi hoàn tất nợ FE02

- `TD-018` được hoàn tất bằng hồi quy API cho hành vi không chỉnh sửa khi trùng lặp và mật khẩu yếu cùng việc sử dụng xác minh email/OTP và đặt lại chuẩn.
- `TD-019` được hoàn tất theo chính sách Giai đoạn 1 đã phê duyệt: khóa tài khoản đã biết được triển khai còn giới hạn toàn IP được tuyên bố rõ là không có.
- `TD-020` được hoàn tất bằng cách trả cùng cấu trúc bao công khai `401 INVALID_CREDENTIALS` cho tài khoản không hoạt động và không xác định, đồng thời giữ sự kiện kiểm toán đăng nhập tài khoản không hoạt động nội bộ.
- Xác thực tập trung đạt 30/30 và truyền tải HTTPS đạt 3/3; hồi quy backend đầy đủ đạt 905/905; độ bao phủ, tích hợp hệ thống, truy vết, cú pháp và vệ sinh phần khác biệt đạt cục bộ.

## Các bản sửa P1 sau H2

- Tuyến đơn/trạng thái thành viên FE04 giờ yêu cầu vai trò `MEMBER`; kiểm thử tuyến tập trung đạt 19/19.
- FE05 xóa điều khiển/bộ chuyển đổi chỉnh sửa sách trùng lặp trong Bảng điều khiển Quản trị viên; BookManagement chuẩn vẫn có thẩm quyền về phiên bản/lý do; frontend đạt 149/149.
- Chỉnh sửa kho lưu trữ FE06 giờ thực thi trạng thái mượn/đặt chỗ/cha đã khóa sau bước kiểm tra trước của dịch vụ; tuyến 35/35 và SQL trực tiếp 10/10 đạt.
- Đặt chỗ mở FE08 đếm cả `ACTIVE` và `NOTIFIED` cho giới hạn/trùng lặp; hồi quy tuyến và SQL trực tiếp đạt.
- Yêu cầu xác thực FE02 đã triển khai thực thi HTTPS trước khi điều phối JSON/xác thực; kiểm thử truyền tải đạt 3/3.

## Theo dõi hoàn tất L4 FE09

- `TD-004` được hoàn tất: Quản lý Tiền phạt giờ giao tìm kiếm, lọc trạng thái, trang, giới hạn, thứ tự và tổng số cho hợp đồng máy chủ chuẩn.
- Lọc/cắt phía trình duyệt đã bị xóa; KPI theo phạm vi trang được ghi nhãn rõ để không ngụ ý tổng hợp toàn cục.
- Frontend tập trung đạt 6/6; frontend đầy đủ hiện tại đạt 149/149; lint/bản dựng đạt; chấp nhận FE09 trên trình duyệt đạt 1/1; toàn bộ bộ trình duyệt cô lập đạt 4/4.
- Phần triển khai không thêm tuyến backend, lược đồ, phần phụ thuộc, hành vi chỉnh sửa, kho lưu trữ trình duyệt hay chính sách tiền phạt mới.

## Các lớp xác thực

| Lớp | Trạng thái | Bằng chứng hoặc ranh giới còn lại |
| --- | --- | --- |
| 1. Kiểm tra tự động | PASS cục bộ | Kiểm thử đơn vị, tích hợp, độ bao phủ, lint, bản dựng, triển khai, E2E, SQL trực tiếp, OpenAPI, nhập, kiểm toán, truy vết và kiểm tra phần khác biệt đều đạt |
| 2. Tuân thủ đặc tả | PASS | Truy vết FE01-FE12 đạt 100%; đặc tả/tác vụ/bằng chứng tính năng được đối soát; các ranh giới hoãn lại đã phê duyệt vẫn rõ ràng |
| 3. Hiến chương và an toàn | PASS cục bộ | Ngăn xếp đã phê duyệt được giữ; hành động được bảo vệ vẫn do máy chủ phân quyền; chỉnh sửa SQL được cô lập; không phát hiện thông tin xác thực đã lưu hay bí mật độ tin cậy cao |
| 4. Xác minh chấp nhận | PASS | Người yêu cầu là con người đã phê duyệt quy trình duyệt FE01-FE12 và H3; PR #40 được merge thành `1555111` và CI `main` sau merge `29685953839` đã đạt |

## Rà soát phần khác biệt H2 cuối cùng - Worktree hiện tại

Trạng thái: PASS sau khắc phục; phần khác biệt triển khai đã rà soát được commit và push trên `feat/full-reconciliation`.

- Đã rà soát toàn bộ phần khác biệt từ `origin/main` tới worktree trên mã ứng dụng, di chuyển, kiểm thử, đặc tả, bằng chứng, tài liệu phát hành và bộ nhớ tác nhân.
- Kiểm tra cú pháp JavaScript: `146` tệp `.js/.mjs/.cjs` đã thay đổi đều đạt `node --check`.
- Hồi quy truyền tải FE02 tập trung: `3/3` đạt sau khi tăng cường chuyển hướng; hồi quy và độ bao phủ backend đầy đủ vẫn là `905/905` và `92.68% / 81.66% / 96.59% / 92.61%`.
- Quét chữ ký bí mật, quét phạm vi, kiểm tra sản phẩm được tạo, phân tích/nhập OpenAPI, thực thi truy vết và `git diff --check` đã đạt.
- H2-001 (đã sửa): `HTTPS_REDIRECT=true` trước đây tin tưởng `Host` của yêu cầu; chuyển hướng giờ yêu cầu `HTTPS_CANONICAL_HOST` đã xác thực, nếu không middleware từ chối với `HTTPS_REQUIRED`.
- Bằng chứng SQL dùng một lần mới nhất đã ghi vẫn là `9/9` bộ và `69/69` kiểm thử cùng `DB_CLEAN`/`LOGIN_CLEAN`; worktree này không có cấu hình SQL có thể chỉnh sửa để chạy lại và không có mã SQL nào thay đổi sau lần chạy đã ghi đó.

## Rủi ro và quyết định còn lại

- Đầu ra production frontend chứa cảnh báo Vite cho một phân đoạn JavaScript đã rút gọn trên 500 kB; bản dựng đạt nhưng chia tách mã vẫn là một cải tiến hiệu năng.
- Phần khác biệt đã merge lớn vì đối soát cả mười hai tính năng; bằng chứng H3 cuối cùng, merge và CI sau merge đã hoàn tất.

## Ranh giới thực thi

PR #40 được merge vào `main` thành `1555111`; CI sau merge `29685953839` đã đạt. Không còn ranh giới xác thực hay tích hợp nào cho phạm vi đối soát FE01-FE12 đã phê duyệt.
