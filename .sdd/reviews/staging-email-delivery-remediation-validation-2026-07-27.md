# Xác thực khắc phục gửi email staging - 2026-07-27

Trạng thái: HOÀN TẤT - H3 ĐÃ PHÊ DUYỆT; PR #65 ĐÃ MERGE; CI SAU MERGE ĐẠT

Mốc cơ sở: `a408bf0808ed79eeb9dd4f2a6f9253f587dffa4b`

Nhánh: `codex/fix-staging-email-delivery`

Worktree: `.worktrees/fix-staging-email-delivery`

Commit product đã được H2 review:

- `7920d4b` - khôi phục template thiết lập tài khoản FE10;
- `2134d44` - giữ bằng chứng gửi FE10 và ranh giới xử lý SYSTEM;
- `ccb590c` - tự động xử lý notification đã xếp hàng.
- `a98f459` - dùng lock claim notification tương thích Azure (addendum H2).

## Phạm vi

- Khôi phục template `ACCOUNT_SETUP` active chuẩn trong database đang tồn tại
  bằng migration bổ sung, transactional và lặp lại được.
- Chỉ lưu message ID của SMTP adapter cho các lần gửi thành công nhạy cảm FE02
  và FE11.
- Chỉ xử lý notification `PENDING` không nhạy cảm qua worker SYSTEM opt-in,
  được quản lý vòng đời và không chồng lấn.
- Giữ nguyên xử lý HTTP của con người được bảo vệ, retry thất bại chỉ thủ công,
  ranh giới vai trò hiện tại, DTO tối thiểu và credential chỉ trong bộ nhớ
  provider.
- Nêu rõ giới hạn Azure App Service F1: worker chỉ chạy khi process ứng dụng
  đang thức.

## Bằng chứng RED

| Lát cắt | Lệnh RED | Lỗi đã chứng minh trước triển khai |
| --- | --- | --- |
| FE10-S13 | `npx jest --runInBand --runTestsByPath tests/notificationRepository.test.js` | Kiểm thử contract lỗi `ENOENT` vì migration `ACCOUNT_SETUP` có ngày tháng chưa tồn tại. |
| FE10-S14 | `npx jest --runInBand --runTestsByPath tests/notificationRoutes.test.js` | Ba assertion thành công FE02/FE11 mong message ID mock provider nhưng nhận `null`. |
| FE10-S15 | `npx jest --runInBand --runTestsByPath tests/envConfig.test.js tests/notificationWorker.test.js tests/serverRuntime.test.js` | Module cấu hình/factory/runtime worker vắng mặt, nên kiểm thử khởi tạo và vòng đời lỗi trước các thay đổi production. |
| Regression poll rỗng SYSTEM | `npx jest --runInBand tests/notificationRoutes.test.js -t "does not audit empty SYSTEM queue polls"` | Poll rỗng tạo một audit `NOTIFICATION_PROCESS_PENDING` với không dòng nào được xử lý hoặc lỗi. |

Việc sửa poll rỗng được khoanh vùng có chủ đích: SYSTEM chỉ bỏ qua audit no-op,
trong khi công việc SYSTEM thực tế và endpoint con người hiện có vẫn được audit.

## Bằng chứng tự động mới

| Kiểm tra | Kết quả |
| --- | --- |
| Cổng FE10/config/runtime tập trung | ĐẠT - 6 suite, 165 kiểm thử |
| Backend đầy đủ | ĐẠT - 64 suite, 1,079 kiểm thử |
| Kiểm thử frontend | ĐẠT - 232/232 |
| Kiểm thử triển khai | ĐẠT - 9/9 |
| Tích hợp hệ thống | ĐẠT - 10/10 |
| Lint frontend | ĐẠT |
| Build production frontend | ĐẠT với Vite 8.0.16 |
| Ép truy vết | ĐẠT - FE10 10/10; không feature đã triển khai nào dưới 70% |
| Kiểm tra khoảng trắng diff | ĐẠT |

## Rà soát yêu cầu và an toàn

| Hạng mục rà soát | Kết quả |
| --- | --- |
| Migration có tính bổ sung và transactional | ĐẠT cục bộ: update-or-insert, `XACT_ABORT`, transaction, rollback/rethrow, không xoá |
| Migration chạy hai lần với một dòng active chuẩn | ĐẠT - cả hai lần chạy staging và aggregate `1|1|1|1|1` được ghi bên dưới |
| SYSTEM bị ràng buộc khi khởi tạo, không phải vai trò đăng nhập | ĐẠT |
| Phân quyền HTTP của con người và DTO phản hồi không đổi | ĐẠT |
| Bằng chứng thành công nhạy cảm chỉ lưu message ID adapter | ĐẠT |
| Nội dung OTP/thiết lập nhạy cảm không vào persistence, audit, log, attempt hay response | ĐẠT qua các assertion regression hiện có |
| Ngăn worker chồng lấn và các lần chạy sau có thể khôi phục | ĐẠT |
| Xử lý tự động loại trừ mã định danh hàng đợi nhạy cảm | ĐẠT |
| Gửi `FAILED` vẫn chỉ thủ công | ĐẠT |
| Chế độ tắt không tạo timer và shutdown xoá scheduling | ĐẠT |
| Poll SYSTEM rỗng không làm ngập storage audit | ĐẠT |
| Lỗi worker log mã cố định, không có văn bản lỗi recipient/provider | ĐẠT |
| Route công khai, schema, dependency và quyền vai trò đã thay đổi | KHÔNG |
| Tìm thấy credential đã commit hoặc dữ liệu recipient thực | KHÔNG |

Quét bí mật chỉ khớp các giá trị giả có chủ đích `provider-secret` và
`example.test` trong kiểm thử che log worker. Không tìm thấy giá trị credential
production hoặc log production mới không an toàn.

## Các lớp xác minh

| Lớp | Trạng thái | Bằng chứng / ranh giới còn lại |
| --- | --- | --- |
| L1 tự động | ĐẠT | Các cổng cục bộ tập trung và đầy đủ ở trên đều mới sau lần sửa regression cuối |
| Tuân thủ spec L2 | ĐẠT | FE10-S13 đến FE10-S15 ánh xạ tới triển khai/kiểm thử và bằng chứng staging đã sửa |
| Constitution và bảo mật L3 | ĐẠT | Không mở rộng vai trò, đổi DTO/schema/dependency công khai, rò nội dung nhạy cảm, log mới không an toàn hay rule firewall còn sót |
| Chấp nhận con người L4 | H2 ĐẠT | H1 đã phê duyệt thiết kế; người dùng đã phê duyệt ứng viên đầy đủ này ngày 2026-07-27; H3 vẫn chờ trước merge |

## Quyết định H2

Người dùng đã phê duyệt H2 ngày 2026-07-27 sau khi review ứng viên đầy đủ chưa
commit và bằng chứng L1-L3 mới. H2 xác nhận:

- migration có tính bổ sung và lặp lại được;
- SYSTEM không trở thành vai trò đăng nhập;
- xử lý con người được bảo vệ và retry thất bại thủ công không đổi;
- chỉ message ID provider được giữ lại cho các lần gửi thành công nhạy cảm;
- các lần chạy tự động không thể chồng lấn hoặc retry `FAILED`;
- hành vi best-effort F1 và rollback bằng
  `NOTIFICATION_WORKER_ENABLED=false` được nêu chính xác;
- không secret hoặc dữ liệu recipient thực nào xuất hiện trong tập đã review.

Tập product chính xác đã review được commit ở trên. Publish và CI tại exact
head vẫn bắt buộc trước mọi mutation staging. Bằng chứng staging chỉ được ghi
tên setting, aggregate count đã che, sự hiện diện provider ID, hai lần chạy
migration, lần chạy/commit triển khai, dọn firewall tạm thời và giới hạn F1.

## Bằng chứng publish và staging ban đầu

- PR #65 đã publish head
  `8f39baa0b58b772c462ea8d11a2049a1bfe102ce`.
- Lần chạy CI `30272237192` đã đạt audit dependency, truy vết, kiểm thử và độ
  bao phủ backend, kiểm thử/lint/build frontend, E2E trình duyệt, tiện ích triển
  khai và kiểm tra import backend.
- Migration chạy hai lần qua một rule firewall tạm thời exact-IP.
- Aggregate sau migration là `1|1|1|1|1`: một dòng khớp, một dòng ACTIVE, một
  subject chuẩn và một dòng chứa từng biến bắt buộc.
- Rule firewall migration tạm thời đã bị xoá; số rule còn lại do task tạo là
  không.
- Ba setting worker đã review được áp dụng mà không in SMTP hoặc SQL secret.
- Lần triển khai thủ công `30272792025` dùng exact head `8f39baa` và đạt các
  job backend, frontend và smoke staging.
- Kiểm tra độc lập trả về API health 200, frontend `/home` 200 và xử lý queue
  thủ công ẩn danh 401.

## Phát hiện worker staging và rollback an toàn

Lần kiểm tra queue đã che đầu tiên phát hiện:

- 15 dòng `PENDING` không nhạy cảm;
- không có attempt gửi mới sau triển khai;
- các mục mã cố định `NOTIFICATION_WORKER_BATCH_FAILED` tại lúc khởi động và
  interval tiếp theo.

Một probe rollback transaction tái hiện lỗi SQL Server 650 trước bất kỳ thay
đổi trạng thái notification nào:

```text
You can only specify the READPAST lock in the READ COMMITTED or REPEATABLE READ
isolation levels.
```

Nguyên nhân gốc: `claimNextPending()` kết hợp `READPAST` với `HOLDLOCK`;
`HOLDLOCK` yêu cầu isolation serializable và không tương thích với `READPAST`.
Worker lập tức được rollback bằng `NOTIFICATION_WORKER_ENABLED=false`. Không
dòng queue nào bị claim, không attempt nào được tạo và mọi rule firewall do task
tạo đã bị xoá.

## Quyết định addendum H2

Phạm vi bị giới hạn ở:

- `backend/src/repositories/notificationRepository.js`;
- `backend/tests/notificationRepository.test.js`;
- bản cập nhật bằng chứng/trạng thái FE10 này.

Ứng viên thay `HOLDLOCK` bằng `READCOMMITTEDLOCK`, đồng thời giữ `UPDLOCK`,
`READPAST` và `ROWLOCK`. Probe rollback transaction Azure SQL trực tiếp trả về
một dòng có thể claim với các hint đã sửa.

Bằng chứng addendum mới:

| Kiểm tra | Kết quả |
| --- | --- |
| Hợp đồng lock repository RED | ĐẠT với RED - hint cũ không đạt kỳ vọng mới tương thích Azure |
| Probe rollback hint đã sửa Azure SQL | ĐẠT - một dòng có thể claim, không mutation |
| Cổng FE10/config/runtime tập trung | ĐẠT - 6 suite, 165 kiểm thử |
| Backend đầy đủ | ĐẠT - 64 suite, 1,079 kiểm thử |
| Tích hợp hệ thống | ĐẠT - 10/10 |
| Tiện ích triển khai | ĐẠT - 9/9 |
| Rule firewall còn lại do task tạo | ĐẠT - 0 |

Người dùng đã phê duyệt addendum H2 ngày 2026-07-27 sau khi review product diff
được khoanh vùng gồm hai tệp và bằng chứng mới ở trên. Bản sửa được commit là
`a98f459`.

## Bằng chứng redeploy đã sửa và staging cuối cùng

- Head PR đã cập nhật `9240525129a8e0d5badf753ef5ef89d105caa232` đạt lần chạy
  CI `30274110435`.
- Lần redeploy `30274367534` đạt backend, frontend và smoke staging trong khi
  worker vẫn được tắt an toàn.
- Worker đã sửa sau đó được bật tại `2026-07-27T14:19:30Z`; API trả về health
  200 sau khi restart setting.
- Snapshot giữa batch cho thấy 8 attempt SENT và 8 provider ID, chứng minh có
  tiến trình hoạt động thay vì no-op.
- Aggregate queue không nhạy cảm cuối cùng là `0|0|15|0`: không PENDING, không
  PROCESSING, 15 SENT và không FAILED.
- Aggregate attempt cuối cùng là `15|15`: toàn bộ 15 attempt mới giữ message ID
  provider.
- Aggregate persistence nhạy cảm là `21|0`: đã kiểm tra 21 dòng nhạy cảm và
  không dòng nào chứa title/body được persist hoặc safe payload chưa che.
- Aggregate audit SYSTEM là `1|0`: một audit batch thực tế và không audit poll
  rỗng.
- API health và frontend `/home` trả về 200. Truy cập ẩn danh tới endpoint xử
  lý thủ công được bảo vệ trả về 401; việc từ chối MEMBER vẫn được bao phủ bằng
  kiểm thử phân quyền CI tại exact head.
- Mọi rule firewall SQL tạm thời exact-IP đã bị xoá; số rule còn lại do task
  tạo là không.
- Không token thiết lập hết hạn nào được tái sử dụng. Xác thực hộp thư nhạy cảm
  môi trường sống vẫn là hành động Admin-resend tường minh, phải tạo token/event
  mới.

## Đóng tích hợp

- App Service F1 vẫn best-effort: xử lý tự động tạm dừng khi process ngủ.
- Rollback vẫn là `NOTIFICATION_WORKER_ENABLED=false`.
- Người dùng đã phê duyệt H3 rõ ràng trước merge.
- PR #65 được merge với commit `01807f043a9273f9c664b647dd84512307e8c86c`.
- Lần chạy CI `main` chính xác sau merge `30275341156` đã đạt.
- Triển khai Azure staging FE10 sau đó `30307855616` đạt, với baseline
  template/provider/worker v0.4.5 vẫn active.
