# FE07 FE08 FE10 FE12 — packet đóng truy vết 100% (2026-08-01)

## 1. Phạm vi và cổng cao nhất

- Baseline review: `37be6e0b0a4435c011f13504331ebc139f35a1c8`.
- Branch review: `feat/fe07-fe08-fe10-fe12-closeout-100`.
- Phạm vi: đóng truy vết production-source và kiểm chứng hành vi đã có cho FE07,
  FE08, FE10 và FE12; không thêm API, schema, role, state transition hoặc
  business rule.
- H2: **APPROVED** bởi Nhat trong task ngày 2026-08-01 cho fingerprint cuối bên
  dưới; commit/push và draft PR đã được ủy quyền.
- Cổng cao nhất còn mở: H3 trước merge/deploy.
- Fingerprint exact tracked diff (packet này và plan untracked được loại khỏi
  phạm vi hash): `9acd9a09a6a90c976d4e920cfe95ab2142e8336b`.

## 2. Bằng chứng authoritative và phân loại sai lệch

| Nguồn | Kết quả | Phân loại |
| --- | --- | --- |
| `.sdd/specs/feat-*/SPEC.md` | Nguồn yêu cầu/actor/state chính tắc; bốn feature đã có hành vi tương ứng | Approved requirement |
| `backend/src`, `frontend/src` | Mọi FR của FE07/08/10/12 đều có owner `@spec` | Observed implementation evidence |
| `backend/tests`, `frontend/test`, `tests/e2e` | Unit/contract/integration/browser regression xanh | Observed verification evidence |
| SQL concurrency/system suites | Fixture cũ dùng cùng `BookId`, ngày động và template cũ; đã căn chỉnh fixture theo BR/FR hiện hành, không đổi production behavior | Test-fixture reconciliation |
| Azure staging | Sau reset quota: App Service `Running`, SQL `Online`, smoke bản đang deploy PASS | Runtime recovered; closeout candidate chưa deploy |

## 3. Traceability dashboard

| Feature | FR | Tagged | Coverage | State | Gate |
| --- | ---: | ---: | ---: | --- | --- |
| FE07 borrowing | 44 | 44 | 100% | COMPLETE | PASS |
| FE08 reservation | 39 | 39 | 100% | COMPLETE | PASS |
| FE10 notification | 20 | 20 | 100% | COMPLETE | PASS |
| FE12 reporting | 15 | 15 | 100% | COMPLETE | PASS |

Gate implementation: `COMPLETE` yêu cầu 100%; `PARTIAL` vẫn yêu cầu tối thiểu
70%. `npm run trace:enforce` báo `below required coverage: 0`.

## 4. Ranh giới actor và quyền sở hữu

- Thành viên: tạo/đọc yêu cầu mượn của chính mình, đặt chỗ/cancel bản ghi của
  chính mình, đọc/mark-read inbox của chính mình; không approve/reject/return,
  không xử lý queue và không xem báo cáo nhân sự.
- Thủ thư/Quản trị viên: approve/reject/return/renew FE07; xử lý reservation
  queue FE08; xem FE12; không được vượt qua ownership/filter của bản ghi.
- FE07 sở hữu transaction mượn/trả/gia hạn và phát sự kiện kết quả sau commit.
- FE08 sở hữu queue/hold state; FE07 chỉ nhận handoff exact `copyId` và không
  tự mutation reservation khi trả.
- FE10 sở hữu validate/template/idempotency/inbox projection; caller nguồn
  không được ghi đè source metadata hoặc `actionPath`.
- FE12 chỉ đọc snapshot/metrics server-derived và dùng fixed drill-down routes.

## 5. Delta triển khai đã review

- Traceability gate theo state trong `scripts/check-traceability.js` và CI.
- Bổ sung `@spec` tại đúng owner production cho FR-FE07-040..044,
  FR-FE08-007/036..038, FR-FE10-015..020 và FR-FE12-015.
- Bốn `TASKS.md` chuyển `Implementation State: COMPLETE`; changelog ghi rõ
  closeout không đổi behavior/API/schema và Azure acceptance vẫn độc lập.
- SQL test fixtures được sửa để tôn trọng BR-FE07-034, ngày nghiệp vụ xác định,
  bốn template kết quả FE07 và cleanup notification an toàn. Đây là test-only
  reconciliation, không phải product behavior change.

## 6. Verification dashboard

| Command/evidence | Result |
| --- | --- |
| `npm test` (backend) | 73 suites, 1140 tests PASS |
| `npm test` (frontend) | 272 tests PASS |
| `npm run lint` + `npm run build` | PASS |
| `npm run test:traceability-state` + `npm run trace:enforce` | 6/6 PASS; 4 target features 100% |
| Disposable SQL Server 2022 (`npm run test:sql:fe07`) | 9 suites; 46 passed, 25 skipped; DB/login removed and verified |
| `npm run test:deployment` | 20/20 PASS |
| `npm run test:secrets` | 5/5 PASS |
| `npm run test:e2e` Chromium | 12/12 PASS, including connected FE07→FE08→FE10→FE12 and system golden path |
| `git diff --check` | PASS |

## 7. Azure runtime state

Inspection sau reset quota:

- Subscription: `Azure for Students`.
- Web App: `app-library-api-staging-nhat714` in `rg-library-staging`, state
  `Running`; `/health` trả HTTP 200.
- SQL server: `sql-library-staging-ea-nhat714`.
- Database: `LibraryManagementStaging`, `status=Online`, SKU `GP_S_Gen5`,
  `resumedDate=2026-08-01T00:02:19.683000+00:00`.
- `npm run smoke:staging` PASS cho frontend, health, schema-readiness,
  SQL catalog, allowed/blocked CORS và protected route.
- Public frontend `https://www.thuvienhub.io.vn/` và `/login` trả HTTP 200;
  đây vẫn là bản đã deploy trước closeout candidate.

Closeout candidate chưa deploy; migration/deploy vẫn chờ H3. SQL serverless tự
resume khi có traffic kiểm tra sau quota reset; không có lệnh resume thủ công.

## 8. Human decisions required

1. H2: **APPROVED** cho fingerprint cuối sau khi cập nhật trạng thái Azure.
2. Commit/push và draft PR: **AUTHORIZED**; H3 vẫn bắt buộc.
3. Sau H3, authorize migration, deploy và exact-head staging smoke. Cho đến lúc
   đó chỉ runtime cũ được xác minh; closeout candidate chưa được nghiệm thu Azure.
