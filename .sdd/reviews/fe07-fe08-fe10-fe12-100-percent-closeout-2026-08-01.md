# FE07 FE08 FE10 FE12 — packet đóng truy vết 100% (2026-08-01)

## 1. Phạm vi và cổng cao nhất

- Baseline review: `37be6e0b0a4435c011f13504331ebc139f35a1c8`.
- Branch review: `feat/fe07-fe08-fe10-fe12-closeout-100`.
- Phạm vi: đóng truy vết production-source và kiểm chứng hành vi đã có cho FE07,
  FE08, FE10 và FE12; không thêm runtime API, schema, role, state transition
  hoặc business rule. Follow-up chỉ tài liệu hóa endpoint FE07 đã tồn tại.
- H2: **APPROVED** bởi Nhat trong task ngày 2026-08-01 cho fingerprint cuối bên
  dưới; commit/push và draft PR đã được ủy quyền.
- H3: **APPROVED** bởi Nhat trong task; GitHub không tạo formal review object
  cho PR #89 nhưng quyết định tích hợp được ghi trong task/commit closeout.
- Cổng closeout PR #89: **CLOSED** sau merge, CI và Azure exact-head.
- Fingerprint exact tracked diff (packet này và plan untracked được loại khỏi
  phạm vi hash): `9acd9a09a6a90c976d4e920cfe95ab2142e8336b`.

## 2. Bằng chứng authoritative và phân loại sai lệch

| Nguồn | Kết quả | Phân loại |
| --- | --- | --- |
| `.sdd/specs/feat-*/SPEC.md` | Nguồn yêu cầu/actor/state chính tắc; bốn feature đã có hành vi tương ứng | Approved requirement |
| `backend/src`, `frontend/src` | Mọi FR của FE07/08/10/12 đều có owner `@spec` | Observed implementation evidence |
| `backend/tests`, `frontend/test`, `tests/e2e` | Unit/contract/integration/browser regression xanh | Observed verification evidence |
| SQL concurrency/system suites | Fixture cũ dùng cùng `BookId`, ngày động và template cũ; đã căn chỉnh fixture theo BR/FR hiện hành, không đổi production behavior | Test-fixture reconciliation |
| Azure staging | App Service `Running`, SQL `Online`; exact-head smoke PASS | PR #89 đã deploy thành công trên `main@39092fb` |

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
- Follow-up closeout tài liệu hóa endpoint FE07 đã tồn tại
  `GET /api/borrow-requests/candidates` trong SPEC/OpenAPI và khóa hợp đồng bằng
  test; không thêm route hoặc thay đổi runtime behavior.

## 6. Verification dashboard

| Command/evidence | Result |
| --- | --- |
| `npm test` (backend) | 73 suites, 1140 tests PASS |
| `npm test` (frontend) | 272 tests PASS |
| `npm run lint` + `npm run build` | PASS |
| `npm run test:traceability-state` + `npm run trace:enforce` | 6/6 PASS; 4 target features 100% |
| `borrowingContract.test.js` | RED đúng vì thiếu OpenAPI path; GREEN 8/8 sau khi bổ sung hợp đồng |
| Disposable SQL Server 2022 (`npm run test:sql:fe07`) | 9 suites; 48 passed, 23 skipped ngoài FE07/FE08/system; disposable DB removed and verified |
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
  console không có lỗi trong lượt kiểm tra hậu deploy.

Closeout candidate `6189b1a` đã merge qua PR #89 thành `main@39092fb`. CI
`30675444178` và Azure staging `30675744992` đều `success` trên exact head;
migration preflight, backend, frontend và smoke đã đạt. SQL serverless tự resume
khi có traffic kiểm tra sau quota reset; không có lệnh resume thủ công.

## 8. Quyết định và kết quả tích hợp

1. H2: **APPROVED** cho fingerprint cuối sau khi cập nhật trạng thái Azure.
2. Commit/push và PR #89: **AUTHORIZED**, sau đó đã merge thành `39092fb`.
3. H3 được Nhat phê duyệt trong task; PR #89 không có formal GitHub review
   object, nên task/commit là bằng chứng quyết định con người.
4. CI hậu merge và Azure exact-head đều đạt; closeout candidate đã được nghiệm
   thu kỹ thuật trên staging.

## 9. Acceptance staging còn tách riêng

- Anonymous authorization đã xác minh: API bảo vệ trả `401`, 10 route FE07/08/
  FE10/FE12 chuyển về `/login` và console không có lỗi.
- Walkthrough có đăng nhập bằng tài khoản `MEMBER` và `LIBRARIAN` trên Azure
  vẫn cần phiên đăng nhập của người dùng; đây là cổng acceptance vận hành sau
  closeout kỹ thuật, không phải finding mã nguồn hay dữ liệu.

## 10. Follow-up hợp đồng và hồ sơ closeout

- Nhánh: `codex/fe07-fe12-final-closeout`; base `main@39092fb`.
- Phương pháp: SDD Light. Core là hợp đồng đọc FE07 đã tồn tại; Shell là metadata
  closeout. Không đổi route runtime, schema, role, state hoặc business rule.
- Fingerprint tracked diff, loại packet này để tránh self-reference:
  `e02ff19354255a18a642ad4fc1b2fb294f11a1b8`.
- TDD: contract test RED vì thiếu `/api/borrow-requests/candidates`, sau đó GREEN
  `8/8` khi SPEC/OpenAPI/schema phản hồi được đồng bộ.
- H2 local diff review: **PASS**. Cả 20 header CONTEXT/SPEC/PLAN/TASKS/TEST_PLAN
  có cùng trạng thái exact-head; marker chưa chọn còn lại chỉ là lựa chọn độ sâu
  spec, không phải công việc đang mở.
- Verification: traceability state `6/6`; bốn target 100%; backend coverage
  `1.141/1.141`; frontend `272/272`, lint/build; system `11/11`; E2E `12/12`;
  deployment `20/20`; secret/dependency audits và `git diff --check` đạt.
- Cổng còn lại của follow-up PR: H3 trước merge; acceptance Azure có đăng nhập
  vẫn cần phiên `MEMBER` và `LIBRARIAN` của người dùng.
