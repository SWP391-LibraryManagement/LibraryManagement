# Kế hoạch triển khai Full Project Closeout PR C - FE04 và FE02

> **Dành cho agent triển khai:** BẮT BUỘC dùng executing-plans cho từng nhiệm vụ, dùng test-driven-development nếu một kiểm thử tập trung hợp lệ chuyển RED vì hành vi sản phẩm, và dùng verification-before-completion trước mọi tuyên bố hoàn tất. Giữ toàn bộ diff bền vững chưa commit cho đến khi Nhat duyệt H2.

**Mục tiêu:** Hoàn tất bằng chứng runtime/nghiệm thu người dùng của FE04 bằng đúng luồng Admin từ chối -> Member nộp lại -> Admin phê duyệt trên Azure Staging, chứng minh phân quyền phía server và responsive ở bốn viewport, dọn sạch tài khoản test; đồng thời chốt FE02-T049 bằng liên kết review H3 có thật thay vì dựng lại một phê duyệt lịch sử không tồn tại.

**Kiến trúc thực thi:** Giữ nguyên API, schema, vai trò, dependency và mã sản phẩm đang xanh. Một harness tạm thời, bị gitignore, chỉ điều phối đúng ba tài khoản tổng hợp và dùng API chuẩn cùng truy vấn kiểm chứng có manifest chính xác. Chỉ tạo thay đổi sản phẩm khi một assertion acceptance đã phê duyệt thất bại vì yêu cầu FE04 thực sự không được đáp ứng; lỗi hạ tầng, fixture hoặc teardown không cho phép sửa sản phẩm. Diff bền vững mặc định chỉ gồm tài liệu SDD và hồ sơ validation.

**Tech stack:** Node.js 22, Express 5, React 19, SQL Server/Azure SQL, Jest 30, Node test runner, Playwright Chromium, PowerShell, Azure CLI, GitHub CLI, Hybrid SDD + ADD.

## 1. Baseline và thẩm quyền

- Worktree: D:\SWP391\library-management-system\.worktrees\full-project-closeout-pr-c-fe04-fe02.
- Branch: feat/full-project-closeout-pr-c-fe04-fe02.
- Baseline cố định: origin/main@850b01b55e4e9091751402a7ef8678906159f173, merge commit của PR #106.
- Thiết kế được phê duyệt: docs/superpowers/specs/2026-08-02-full-project-closeout-v1.0.3-design.md.
- Architecture amendment cho acceptance FE04 sau ba lần thử: docs/superpowers/specs/2026-08-03-pr-c-fe04-acceptance-context-isolation-amendment-design.md.
- PR C phụ thuộc PR B đã merge. Các PR #101-#106 chỉ thay đổi FE01/FE07/FE10, workflow và trace checker, không chạm phạm vi FE02/FE04/FE11 của PR C. CI main 30779430709 và deploy staging 30779592574 phải vẫn success trên đúng baseline trước khi mutation.
- Frontend staging: https://www.thuvienhub.io.vn.
- Backend staging: https://app-library-api-staging-nhat714.azurewebsites.net.
- Web App: app-library-api-staging-nhat714 trong resource group rg-library-staging.
- SQL server dự kiến: sql-library-staging-ea-nhat714; tên database thực phải được lấy read-only từ App Service configuration và đối chiếu với allowlist staging trước khi ghi.
- Checkout gốc D:\SWP391\library-management-system do người dùng sở hữu và đang bẩn với 11 đường dẫn có trước. Không sửa, stage, stash, clean hoặc đổi branch tại đó.
- Không cần video demo.

## 2. Bằng chứng nền đã tái hiện trên baseline

| Bằng chứng | Kết quả hiện tại |
| --- | --- |
| trace:enforce | PASS; FE02 27/27, FE04 14/14, FE11 43/43; các feature còn PARTIAL theo cổng thủ công |
| Backend FE04 + system integration | 2 suite, 31/31 PASS |
| Frontend FE04/Admin | 36/36 PASS |
| Playwright FE04 + FE11 | 2/2 PASS, thoát sạch trong 31,5 giây |
| npm ci root/backend | PASS, 0 vulnerability |
| npm ci frontend | PASS; npm generic còn advisory React Router đã có guard fail-closed riêng |

Kết luận baseline:

1. FE04-ADM04 và FE04-CONV-001 không còn lỗi teardown tái hiện được.
2. Luồng local đã chứng minh từ chối, nộp lại, phê duyệt và bốn viewport.
3. Không có căn cứ cho thay đổi mã sản phẩm ở thời điểm lập kế hoạch.
4. FE04 vẫn cần một lần nghiệm thu staging chuyên biệt trên đúng SHA, phân quyền server, cleanup và phê duyệt thủ công.
5. FE02-T049 chỉ còn khoảng trống CG-FE02-003 về liên kết H3 riêng cho FE02-T043.

### Nhật ký thực thi 2026-08-03

- Task 1 và Task 2 đã hoàn tất trên `850b01b`; contract harness tại checkpoint ban đầu 10/10 PASS và preflight read-only PASS.
- Lượt mutation đầu tiên `lms-fe04-acceptance-20260803-8b923a37` đã chứng minh submit -> reject, sau đó dừng vì assertion harness dùng sai exact toast text; đây không phải lỗi product.
- Cleanup remediation của đúng run này đã đưa active user/token/member/pending application về 0 và xóa runtime/helper về 404/404.
- Lượt đầu chưa chứng minh resubmit -> approve hoặc bốn viewport. Marker mutation vẫn được giữ; không chạy lượt thứ hai khi chưa có phê duyệt mới.
- Sau phê duyệt mới, lượt hai `lms-fe04-acceptance-20260803-fef1cff6` đã chứng minh resubmit tạo application thứ hai nhưng Admin directory giữ state rỗng sau reject; cleanup PASS và không có approval action.
- Lượt ba `lms-fe04-acceptance-20260803-418d15cc` đã poll thấy server truth nhưng đếm sidebar ngay sau `domcontentloaded`, trước khi React render; assertion nhận `0 !== 8`. Cleanup PASS và preflight sau lỗi xác nhận không còn remote runtime/helper hay trạng thái fixture hoạt động.
- Ba lượt deterministic đã chạm stop condition. Người dùng đã duyệt phương án architecture amendment: mỗi quyết định dùng một Admin browser context mới, chờ navigation visible và đủ tám mục; API polling chỉ xác nhận readiness, còn reject/approve vẫn do UI thực hiện.
- Không sửa harness hoặc chạy lượt mutation bổ sung cho đến khi amendment bằng văn bản được commit và người dùng review. Sau review, amendment chỉ cho đúng một run ID mới; nếu run đó thất bại thì không có lượt thứ năm.
- Bằng chứng chi tiết nằm tại `.sdd/reviews/full-project-closeout-pr-c-fe04-fe02-validation-2026-08-03.md`.

### Architecture amendment sau stop condition ba lần thử

1. Context Admin dùng để từ chối application A phải được đóng sau khi quyết định hoàn tất.
2. Sau khi Member nộp lại và canonical API trả application B `PENDING`, harness mở một Admin context hoàn toàn mới để phê duyệt.
3. Mỗi Admin context phải chờ navigation `Điều hướng quản trị` visible và mục nav thứ tám visible trước khi assert số lượng/thứ tự.
4. Không dùng `page.reload()` để tái sử dụng cây React hoặc state của Admin directory giữa hai quyết định.
5. UI vẫn là tác nhân thực hiện cả reject và approve; API polling không được thay thế mutation UI.
6. Contract test phải chuyển RED trước thay đổi harness và chứng minh hai context riêng, readiness wait rõ ràng, không còn reload.
7. Chỉ một mutation bổ sung được phép sau written-review gate; mọi lỗi đều cleanup trong `finally` và dừng để đánh giá lại, không tự retry.

## 3. Ranh giới thay đổi

### Tệp bền vững dự kiến sửa

- .sdd/specs/feat-membership-management/SPEC.md
- .sdd/specs/feat-membership-management/PLAN.md
- .sdd/specs/feat-membership-management/TASKS.md
- .sdd/specs/feat-membership-management/TEST_PLAN.md
- .sdd/specs/feat-membership-management/CHANGELOG.md
- .sdd/specs/feat-auth/SPEC.md
- .sdd/specs/feat-auth/PLAN.md
- .sdd/specs/feat-auth/TASKS.md
- .sdd/specs/feat-auth/TEST_PLAN.md
- .sdd/specs/feat-auth/CHANGELOG.md
- .sdd/reviews/full-project-closeout-pr-c-fe04-fe02-validation-2026-08-03.md
- docs/superpowers/specs/2026-08-03-pr-c-fe04-acceptance-context-isolation-amendment-design.md
- docs/superpowers/plans/2026-08-03-full-project-closeout-pr-c-fe04-fe02.md

### Tệp tạm thời bị gitignore

- tmp/staging-fe04-acceptance/orchestrate.js
- tmp/staging-fe04-acceptance/fixture.js
- tmp/staging-fe04-acceptance/orchestrate.contract.test.js
- tmp/staging-fe04-acceptance/artifacts/ chỉ tồn tại trong lúc chạy và phải được xóa sau khi trích bằng chứng đã redacted.

### Tệp sản phẩm/test chỉ được mở khóa khi có RED hợp lệ

Nếu và chỉ nếu acceptance đã phê duyệt thất bại ở một yêu cầu FE04 thực tế, dừng staging, dọn fixture, báo nguyên nhân và lập amendment kế hoạch trước khi sửa. Candidate có thể chạm đúng tệp nguồn/test trực tiếp gây lỗi; không được tự mở rộng sang API alias, schema, role hoặc dependency.

### Bất biến

- Không thêm endpoint /api/admin/membership.
- Chỉ dùng membershipApi và các endpoint FE04 chuẩn hiện có.
- Admin sidebar giữ chính xác tám mục; Duyệt hội viên nằm sau Người dùng; không có mục Phân quyền độc lập.
- Không đổi database schema, migration, public DTO, role hoặc permission.
- Không dùng PII thật, email thật hoặc mật khẩu dùng chung/lưu bền vững.
- Không đưa publishing credential, bearer token, connection string, password hash đầy đủ hoặc artifact thô vào git/log review.
- Không chạy npm audit fix --force và không đổi lockfile để xử lý advisory đã có ngoại lệ fail-closed.
- Mỗi kế hoạch/amendment được duyệt chỉ cho phép một lần mutation staging. Architecture amendment ngày 2026-08-03 chỉ mở khóa một run ID mới sau written-review gate; lỗi sau mutation phải cleanup rồi dừng và không được tự mở lượt thứ năm.

---

### Task 1: Khóa baseline và hợp đồng harness tạm

**Tệp:**

- Đọc: thiết kế closeout và toàn bộ SPEC/PLAN/TASKS/TEST_PLAN/CHANGELOG của FE04, FE02.
- Tạo tạm: tmp/staging-fe04-acceptance/orchestrate.js.
- Tạo tạm: tmp/staging-fe04-acceptance/fixture.js.
- Tạo tạm: tmp/staging-fe04-acceptance/orchestrate.contract.test.js.

**Giao diện:** Harness nhận run ID do operator tạo, không nhận secret qua source hoặc CLI argument; credential chỉ đi qua environment của process. Output chỉ là JSON event allowlist đã redacted.

- [x] **Step 1: Xác minh isolation và baseline chưa trôi**

~~~powershell
git status --short --branch
git rev-parse HEAD
git rev-parse origin/main
git check-ignore -v .worktrees tmp
git -C D:\SWP391\library-management-system status --short --branch
~~~

Expected:

- worktree ở branch feat/full-project-closeout-pr-c-fe04-fe02;
- HEAD và origin/main đều là 850b01b55e4e9091751402a7ef8678906159f173;
- chỉ plan này là thay đổi bền vững;
- checkout gốc vẫn đúng tập 11 đường dẫn bẩn đã ghi nhận.

Nếu origin/main hoặc tập dirty gốc thay đổi, dừng để đánh giá drift; không tự rebase hay đụng checkout gốc.

- [x] **Step 2: Viết contract RED trước harness**

orchestrate.contract.test.js phải assert các điều kiện cụ thể:

1. manifest có đúng ba actor MEMBER, LIBRARIAN, ADMIN và ba user ID/run username khác nhau;
2. email dùng miền .invalid; password chỉ sinh runtime, khác nhau, tối thiểu 20 ký tự và không xuất hiện trong event;
3. phase allowlist chính xác: preflight, seed, inspect, cleanup, verify-cleanup;
4. acceptance flow chính xác: submit -> reject -> resubmit -> approve;
5. ma trận quyền gồm 401 khi chưa đăng nhập, 403 cho Member, 200 cho Librarian/Admin ở list/review phù hợp;
6. viewport chính xác 1440x900, 1366x768, 1280x720 và 390x844;
7. UI có tám navigation item, Duyệt hội viên sau Người dùng, không có Phân quyền;
8. cleanup chỉ nhận đúng ba user ID trong manifest và từ chối wildcard/manifest rỗng;
9. cleanup yêu cầu token ACTIVE bằng 0, user ACTIVE bằng 0, member ACTIVE/PENDING bằng 0, application PENDING bằng 0;
10. remote runtime và cleanup helper trả 404/404 sau cleanup;
11. URL chứa userinfo, Authorization, Set-Cookie, connection string, token, password hoặc hash bị redactor chặn.
12. reject và approve dùng hai Admin browser context khác nhau; mỗi context chờ navigation visible và mục thứ tám visible; source không reload Admin page giữa hai quyết định.

~~~powershell
node --test tmp/staging-fe04-acceptance/orchestrate.contract.test.js
~~~

Expected RED: thất bại vì orchestrate.js và fixture.js chưa cung cấp manifest/phase/flow contract; không được thất bại do syntax hoặc module path.

- [x] **Step 3: Triển khai harness tối thiểu và chạy GREEN**

orchestrate.js phải:

- kiểm tra Node major 22 và các binary az, gh, npx;
- kiểm tra branch/baseline/clean diff;
- lấy Azure publishing profile và App Service configuration trong memory, không ghi file;
- tạo credential-free Kudu URL và gắn Basic Authorization chỉ trong request process;
- upload fixture.js đến đường dẫn riêng theo run ID dưới /home/data;
- vì Kudu container hiện chỉ có Node 18.17.1 và không còn đường Oryx Node 22, tải tạm đúng `node-v22.22.2-linux-x64.tar.xz` từ `nodejs.org`, bắt buộc khớp SHA256 `88fd1ce767091fd8d4a99fdb2356e98c819f93f3b1f8663853a2dee9b438068a`, giải nén dưới runtime riêng và xóa cùng runtime sau cleanup;
- dùng mssql đã deploy trong App Service để truy vấn SQL có tham số;
- dùng Playwright browser context mới cho từng actor và tuyệt đối không lưu storageState;
- đăng ký finally cleanup ngay sau khi seed đầu tiên thành công;
- phát JSON event chỉ gồm event, runId, phase, status, HTTP status, count, SHA rút gọn và URL host/path không credential;
- xóa artifact thô tại local sau khi tổng hợp kết quả redacted.

fixture.js phải:

- từ chối chạy nếu database/server không khớp staging allowlist;
- nhận đúng phase allowlist;
- parameterize mọi SQL value;
- seed Users, UserRoles và UserProfiles cho đúng ba ID;
- không seed book, copy, loan, reservation hoặc notification;
- inspect theo đúng ba ID và application IDs trả về từ API;
- cleanup bằng transaction: thu hồi AuthTokens còn ACTIVE, đặt Members tương ứng INACTIVE, xác nhận không còn application PENDING, đặt ba Users INACTIVE và DeactivatedAt;
- không xóa lịch sử application terminal/audit cần để chứng minh transition;
- verify-cleanup fail nếu còn user/token/member active hoặc application pending.

~~~powershell
node --test tmp/staging-fe04-acceptance/orchestrate.contract.test.js
node --check tmp/staging-fe04-acceptance/orchestrate.js
node --check tmp/staging-fe04-acceptance/fixture.js
~~~

Expected GREEN: toàn bộ contract pass và hai file parse sạch.

---

### Task 2: Preflight staging chỉ đọc và khóa exact SHA

**Tệp:** Không có thay đổi bền vững.

**Giao diện:** Chỉ đọc GitHub, Azure control plane, public HTTP và Kudu VFS. Không seed, login hoặc ghi SQL.

- [x] **Step 1: Xác minh GitHub exact SHA**

~~~powershell
gh run view 30779430709 --json databaseId,headSha,conclusion,event,workflowName,url
gh run view 30779592574 --json databaseId,headSha,conclusion,event,workflowName,url
gh api repos/SWP391-LibraryManagement/LibraryManagement/commits/850b01b55e4e9091751402a7ef8678906159f173/status
~~~

Expected: cả hai run success và headSha đúng 850b01b55e4e9091751402a7ef8678906159f173.

- [x] **Step 2: Xác minh public runtime**

~~~powershell
$env:STAGING_FRONTEND_URL='https://www.thuvienhub.io.vn'
$env:STAGING_API_URL='https://app-library-api-staging-nhat714.azurewebsites.net'
npm.cmd run smoke:staging
Invoke-WebRequest -UseBasicParsing https://www.thuvienhub.io.vn/login
Invoke-RestMethod https://app-library-api-staging-nhat714.azurewebsites.net/health
~~~

Expected: smoke pass, frontend HTTP 200, health HTTP 200. Nếu health payload có build SHA thì phải trùng 850b01b; nếu không có, dùng exact deploy run và read-only Kudu deployment metadata để chứng minh.

- [x] **Step 3: Xác minh Azure target và transport**

~~~powershell
az account show --query "{tenant:tenantId,subscription:id,user:user.name}" -o json
az webapp show --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "{state:state,host:defaultHostName}" -o json
az webapp config appsettings list --resource-group rg-library-staging --name app-library-api-staging-nhat714 --query "[?name=='NODE_ENV' || name=='DB_SERVER' || name=='DB_NAME'].{name:name,value:value}" -o json
~~~

Expected:

- App Service Running;
- NODE_ENV là staging/production-compatible như deploy policy hiện hành;
- host đúng app-library-api-staging-nhat714.azurewebsites.net;
- DB server/database khớp target staging đã phê duyệt;
- Kudu có `curl`, `tar`, `sha256sum`, truy cập được gói Node 22.22.2 chính thức và module mssql đã deploy tồn tại;
- runtime Node 22.22.2 tạm cùng module mssql phải được xác minh sau setup nhưng trước phase `seed`;
- không có runtime/helper cũ cùng run ID, VFS trả 404/404.

Không in publishing credential hoặc connection string. Bất kỳ mismatch nào đều dừng trước mutation.

---

### Task 3: Chạy đúng một nghiệm thu FE04 staging có mutation

**Tệp:** Chỉ harness/artifact tạm bị gitignore.

**Giao diện:** Dùng API chuẩn hiện có:

- POST /api/auth/login
- GET /api/auth/me
- POST /api/membership/applications
- GET /api/membership/status
- GET /api/membership/applications?q=&status=&page=&limit=
- PATCH endpoint review FE04 chuẩn mà membershipApi đang gọi

Tên endpoint review chính xác phải được đọc từ frontend/src/api/libraryFeatureApi.js và backend route trước khi khóa contract; không hard-code alias mới.

- [x] **Step 1: Seed đúng ba tài khoản tổng hợp**

Quy ước:

- run ID: lms-fe04-acceptance-YYYYMMDD-<8 hex>;
- username: fe04_member_<suffix>, fe04_librarian_<suffix>, fe04_admin_<suffix>;
- email: cùng prefix tại example.invalid;
- password: ba giá trị crypto-random riêng, chỉ tồn tại trong process memory;
- role: đúng một role MEMBER, LIBRARIAN, ADMIN;
- profile đủ fullName, phone tổng hợp, dateOfBirth và address Test Fixture.

Sau seed, inspect phải trả đúng ba user ACTIVE, đúng ba role mapping và chưa có MembershipApplications/Member active cho ba ID.

- [x] **Step 2: Chứng minh phân quyền server trước happy path**

Assert:

1. không token: list/review trả 401;
2. Member: list và reject/approve trả 403;
3. Librarian: list chuẩn trả 200 theo hợp đồng FE04 dành cho reviewer;
4. Admin: list chuẩn trả 200;
5. response Member status không lộ reviewer ID, audit nội bộ hoặc dữ liệu applicant khác.

Nếu status khác do UI masking nhưng server cho phép sai, acceptance FAIL và cleanup; không tiếp tục.

- [x] **Step 3: Chạy reject -> resubmit -> approve**

1. Member submit body rỗng; expect 201/response chuẩn và application A trạng thái PENDING.
2. Mở Admin context R mới, chờ navigation visible và đủ tám mục, xác nhận Duyệt hội viên nằm sau Người dùng.
3. Chờ GET canonical list có q, status, page, limit=10; expect 200 và thấy application A.
4. Admin context R từ chối A với lý do tổng hợp dài 1..500; expect success, sau đó đóng context R.
5. SQL/API inspect: A REJECTED, rejection reason đúng, Members REJECTED/không active theo contract, audit decision tăng đúng một; notification failure nếu có chỉ là warning sau commit.
6. Member xem lý do của chính mình, nộp lại body rỗng; expect application B mới PENDING.
7. Inspect và canonical API polling: A vẫn REJECTED bất biến, B PENDING, không ghi đè lịch sử.
8. Mở Admin context A mới, chờ navigation visible và đủ tám mục; không reload hoặc tái sử dụng state context R.
9. Admin context A chạy bốn viewport rồi approve B bằng UI.
10. Inspect: B APPROVED, Members APPROVED/ACTIVE theo contract, ApprovedAt/ReviewedAt nhất quán, audit tăng đúng một và không còn application PENDING.
11. Thử lại quyết định trên record terminal; expect conflict an toàn, không thêm audit hoặc notification.

- [x] **Step 4: Nghiệm thu responsive UI**

Tại từng viewport:

| Viewport | Assertion |
| --- | --- |
| 1440x900 | shell tám mục; bảng desktop/card contract đúng theo CSS hiện hành; không document overflow |
| 1366x768 | filter, pagination, review state và feedback nhìn thấy; không overflow |
| 1280x720 | không che CTA/modal; không overflow |
| 390x844 | card mobile, modal reject/feedback thao tác được; không overflow |

Mỗi viewport assert document.documentElement.scrollWidth <= clientWidth. Không phụ thuộc screenshot thủ công; screenshot redacted chỉ giữ local đến khi ghi kết quả tổng hợp rồi xóa.

- [x] **Step 5: Cleanup bắt buộc trong finally**

Theo exact manifest ba ID:

1. revoke mọi active refresh token;
2. đặt Member record tương ứng INACTIVE nếu tồn tại;
3. xác nhận A/B đều terminal và application PENDING bằng 0;
4. đặt ba User INACTIVE và DeactivatedAt;
5. verify active token/user/member/pending application đều 0;
6. cả ba login bằng credential cũ trả 401;
7. một bearer token đã giữ từ trước cleanup gọi /api/auth/me trả 401;
8. xóa remote fixture/runtime và helper; VFS 404/404;
9. xóa toàn bộ tmp/staging-fe04-acceptance/artifacts;
10. ghi duy nhất event cleanup_verified với các count bằng 0.

Lệnh operator chỉ chạy sau khi plan được duyệt:

~~~powershell
node tmp/staging-fe04-acceptance/orchestrate.js --preflight
node tmp/staging-fe04-acceptance/orchestrate.js --run-once
~~~

Expected: preflight PASS, acceptance PASS, cleanup PASS, exit code 0. Nếu --run-once đã bắt đầu seed thì tuyệt đối không gọi lại trong cùng approval.

---

### Task 4: Chốt hồ sơ FE04 từ bằng chứng thực

**Tệp:**

- Sửa: .sdd/specs/feat-membership-management/SPEC.md
- Sửa: .sdd/specs/feat-membership-management/PLAN.md
- Sửa: .sdd/specs/feat-membership-management/TASKS.md
- Sửa: .sdd/specs/feat-membership-management/TEST_PLAN.md
- Sửa: .sdd/specs/feat-membership-management/CHANGELOG.md
- Tạo: .sdd/reviews/full-project-closeout-pr-c-fe04-fe02-validation-2026-08-03.md

**Giao diện:** Tài liệu chỉ ghi facts đã quan sát: exact SHA/run/host, số test, actor/status transition, viewport, cleanup count và reviewer decision.

- [x] **Step 1: Ghi validation record FE04**

Validation record phải có:

- baseline/deploy exact SHA và GitHub run URL;
- local baseline 31/31 backend, 36/36 frontend, 2/2 Playwright sạch;
- run ID staging, ba actor tổng hợp, không ghi username đầy đủ nếu không cần;
- ma trận 401/403/200;
- application A REJECTED và B APPROVED;
- bốn viewport và overflow result;
- cleanup count bằng 0, ba login cũ và token cũ bị từ chối;
- Kudu runtime/helper 404/404;
- không có PII/secret/artifact thô;
- mục Nhat/manual acceptance chờ phê duyệt H2 nếu chưa được duyệt.

- [x] **Step 2: Đồng bộ trạng thái FE04**

Chỉ sau staging PASS và cleanup PASS:

- FE04-ADM04: [x], ghi local Playwright 2/2 thoát sạch;
- FE04-CONV-001: [x], bỏ mô tả teardown cũ;
- FE04-ADM05: chuyển [~] trong candidate H2, chỉ [x] khi H2/manual acceptance được duyệt;
- FE04-CONV-002: chuyển [~] trong candidate H2, chỉ [x] khi H2/manual acceptance được duyệt;
- FE04-T009: chuyển [~] trong candidate H2, chỉ [x] khi các cổng L1 và H2 đều có bằng chứng;
- các completion gate tương ứng chỉ [x] khi đúng điều kiện;
- Implementation State chỉ COMPLETE sau khi các mục trên đều [x].

SPEC/PLAN/TEST_PLAN/CHANGELOG phải bỏ câu nói staging/clean exit chưa tồn tại và thay bằng bằng chứng exact; không đổi requirement.

- [x] **Step 3: Xác nhận chủ sở hữu liên tính năng**

Chạy tập trung FE07/FE08/FE10/FE12 có sử dụng membership state và ghi kết quả vào validation record. Xác nhận:

- FE07 đọc trạng thái FE04 chuẩn để áp dụng hạn mức ngày: `APPROVED` là 5 bản, còn `NONE/PENDING/REJECTED/INACTIVE` là 3 bản; FE04 không tự chặn tài khoản `MEMBER` đang hoạt động;
- FE08 không dùng trạng thái FE04 để chặn đặt chỗ; eligibility yêu cầu vai trò `MEMBER` và `Users.Status = ACTIVE`;
- FE10 notification failure không rollback quyết định FE04;
- FE12 chỉ đọc trạng thái phát sinh, không sở hữu transition FE04.

Không sửa tài liệu owner khác trong PR C; mismatch phải dừng và lập plan amendment.

---

### Task 5: Đối soát FE02-T049 bằng H3 có thật

**Tệp:**

- Sửa: .sdd/specs/feat-auth/SPEC.md
- Sửa: .sdd/specs/feat-auth/PLAN.md
- Sửa: .sdd/specs/feat-auth/TASKS.md
- Sửa: .sdd/specs/feat-auth/TEST_PLAN.md
- Sửa: .sdd/specs/feat-auth/CHANGELOG.md
- Sửa: validation record của PR C.

**Bằng chứng lịch sử bất biến:**

- FE02-T043 implementation commit: 241907d09760055022393bdc9176da85bbeff3f4.
- PR lịch sử: #60, head 50e9091362777d3892d5d4e048a21118326b2dd9.
- Merge commit: c052b5051deb1e29b66cde2668bca612cc27dc35.
- Exact-head CI 29875668029: success.
- Post-merge CI 29875885463: success.
- Post-merge staging deploy 29876046500: success.
- GitHub không có review record lịch sử cho PR #60; không được tuyên bố ngược lại.

- [x] **Step 1: Ghi reconciliation candidate trung thực**

Trong validation record:

- liên kết PR #60, commit và ba run nêu trên;
- ghi rõ code/CI/deploy của FE02-T043 đã tích hợp;
- ghi rõ thiếu historical H3 là gap CG-FE02-003 duy nhất;
- kết quả rerun FE02 focused/full, security/secret/trace gates hiện tại;
- đánh giá thủ công source -> test -> requirement cho lỗi validation feedback của T043;
- đề nghị H3 vòng 1 của chính PR C làm review hồi cứu có thẩm quyền, không backdate.

Trước H3 vòng 1, FE02-T049 vẫn [~] và CG-FE02-003 vẫn OPEN.

- [x] **Step 2: Sau H2 đầu tiên, publish PR C và yêu cầu H3 vòng 1**

H3 vòng 1 phải trả lời rõ:

1. bằng chứng PR #60/commit/run có đúng và bất biến không;
2. implementation T043 hiện vẫn phù hợp SPEC/Standards không;
3. reviewer có chấp nhận review hồi cứu hiện tại để đóng CG-FE02-003 không;
4. FE04 staging/manual evidence có đủ để chuyển COMPLETE không.

Lưu permalink review/comment H3 vòng 1. Nếu reviewer không chấp nhận cách đối soát hồi cứu, FE02-T049 giữ mở và PR C không được tuyên bố hoàn tất mục tiêu FE02.

- [x] **Step 3: Amendment tài liệu tối thiểu sau H3 vòng 1**

Chỉ khi H3 vòng 1 chấp nhận:

- thêm permalink H3 thật vào validation record, SPEC/PLAN/TEST_PLAN/CHANGELOG;
- đổi CG-FE02-003 từ OPEN sang RESOLVED BY CURRENT RETROSPECTIVE H3, giữ chú thích không có historical review;
- đổi FE02-T049 từ [~] sang [x];
- cập nhật Implementation State FE02 thành COMPLETE nếu không xuất hiện gap mới;
- không thay đổi source, test, workflow, dependency hoặc tài liệu feature khác.

Amendment này làm đổi HEAD nên phải chạy lại cổng, H2 lần 2 và H3 cuối; H3 vòng 1 không được dùng để merge một SHA mới.

---

### Task 6: Chạy cổng đầy đủ và chuẩn bị H2

**Tệp:** Toàn bộ diff bền vững trong ranh giới.

- [x] **Step 1: Chạy L1 đầy đủ trước H2 đầu tiên**

~~~powershell
npm.cmd run trace:enforce
npm.cmd run test:secrets
npm.cmd audit --audit-level=high
npm.cmd --prefix backend audit --audit-level=high
npm.cmd --prefix frontend run audit:high
npm.cmd --prefix backend test
npm.cmd --prefix backend run test:integration:system
npm.cmd --prefix backend run test:coverage:ci
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
git diff --check
~~~

Expected:

- mọi lệnh exit 0;
- frontend audit guard chỉ chấp nhận đúng ngoại lệ React Router đã khóa hash/version và fail với advisory high mới;
- không suite mutable bị skip;
- Playwright thoát sạch;
- trace FE02/FE04 100% và trạng thái task khớp bằng chứng, không bị tô xanh giả.

- [x] **Step 2: Audit diff và secret**

~~~powershell
git status --short
git diff --stat
git diff --name-only
git diff -- . ':!package-lock.json' ':!backend/package-lock.json' ':!frontend/package-lock.json'
git diff --check
git ls-files tmp/staging-fe04-acceptance
~~~

Expected:

- chỉ các tệp SDD/review/plan trong responsibility map;
- không product/test/dependency/lockfile/workflow;
- git ls-files cho harness trả rỗng;
- không token, password, connection string, publishing credential, account thật hoặc artifact screenshot.

- [x] **Step 3: Trình H2 lần 1**

Trình cho Nhat:

- exact diff fingerprint và danh sách file;
- kết quả L1;
- exact staging SHA/run/host;
- luồng reject/resubmit/approve;
- server auth matrix;
- bốn viewport;
- cleanup và revoked-login evidence;
- FE02 historical facts cùng khoảng trống H3 chưa bịa đặt.

H2 lần 1 phê duyệt candidate để commit/push và yêu cầu H3 vòng 1; không tự động phê duyệt amendment hoặc merge.

---

### Task 7: Publish, H3 vòng 1, amendment và H3 cuối

- [x] **Step 1: Commit/push sau H2 lần 1**

~~~powershell
git add .sdd/specs/feat-membership-management .sdd/specs/feat-auth .sdd/reviews/full-project-closeout-pr-c-fe04-fe02-validation-2026-08-03.md docs/superpowers/plans/2026-08-03-full-project-closeout-pr-c-fe04-fe02.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: close FE04 acceptance and reconcile FE02"
git push -u origin feat/full-project-closeout-pr-c-fe04-fe02
~~~

Không dùng git add -A. Xác minh tmp và artifact không được stage.

- [x] **Step 2: Tạo Draft PR và chờ CI**

~~~powershell
gh pr create --base main --head feat/full-project-closeout-pr-c-fe04-fe02 --draft --title "docs: close FE04 acceptance and reconcile FE02" --body-file tmp/pr-c-body.md
gh pr checks --watch
~~~

PR body phải nêu:

- docs/evidence-only mặc định, không đổi product/API/schema/dependency;
- staging acceptance exact SHA và cleanup;
- FE02 T043 historical H3 không tồn tại;
- H3 vòng 1 được yêu cầu để đối soát hồi cứu;
- không video.

Body tạm phải được tạo bằng apply_patch dưới tmp và xóa sau khi PR được tạo; không commit tmp/pr-c-body.md.

- [x] **Step 3: H3 vòng 1 và amendment**

Sau CI xanh, chuyển PR ready và yêu cầu review Standards + Spec trên exact head. Khi có permalink H3 vòng 1 chấp nhận, thực hiện đúng amendment Task 5 Step 3.

Chạy lại tối thiểu:

~~~powershell
npm.cmd run trace:enforce
npm.cmd run test:secrets
npm.cmd --prefix frontend run audit:high
npm.cmd --prefix backend test
npm.cmd --prefix frontend test
npm.cmd --prefix frontend run lint
npm.cmd --prefix frontend run build
npm.cmd run test:e2e
npm.cmd run test:deployment
git diff --check
~~~

Trình H2 lần 2 cho amendment, sau đó commit riêng:

~~~powershell
git add .sdd/specs/feat-membership-management .sdd/specs/feat-auth .sdd/reviews/full-project-closeout-pr-c-fe04-fe02-validation-2026-08-03.md docs/superpowers/plans/2026-08-03-full-project-closeout-pr-c-fe04-fe02.md
git diff --cached --check
git diff --cached --name-only
git commit -m "docs: record PR C H3 round 1 closeout"
git push
~~~

- [ ] **Step 4: CI và H3 cuối trên exact head**

Chờ mọi required check xanh trên head mới. H3 cuối phải xác nhận:

- không finding Standards/Spec actionable;
- link H3 vòng 1 chính xác;
- FE02-T049/CG-FE02-003 được đóng trung thực;
- FE04 COMPLETE khớp staging/manual/cleanup evidence;
- diff không có product/secret/harness.

Không thay đổi head sau H3 cuối.

---

### Task 8: Merge và handoff PR D

- [ ] **Step 1: Merge chỉ sau explicit H3 cuối**

Ghi exact head, review URL và check rollup. Merge bằng phương thức repo cho phép; không force push.

- [ ] **Step 2: Xác minh sau merge**

Chờ CI main và deploy staging trên exact merge SHA. Chạy public smoke read-only:

~~~powershell
npm.cmd run smoke:staging
Invoke-WebRequest -UseBasicParsing https://www.thuvienhub.io.vn/login
Invoke-RestMethod https://app-library-api-staging-nhat714.azurewebsites.net/health
~~~

PR C không cần mutation staging lần hai vì chỉ có diff tài liệu. Nếu source/product bất ngờ xuất hiện trong diff, điều kiện này vô hiệu và phải lập kế hoạch nghiệm thu mới.

- [ ] **Step 3: Handoff PR D**

Chuyển cho PR D:

- PR C URL, head, merge SHA;
- H3 vòng 1 và H3 cuối;
- CI/deploy run IDs;
- validation record;
- xác nhận FE04 và FE02 COMPLETE;
- residual feature/release gates còn lại;
- không có video demo.

## 4. Điều kiện dừng fail-closed

Dừng ngay, cleanup nếu cần, và báo người dùng khi:

- staging không phục vụ đúng 850b01b trước mutation;
- Azure account/resource/database không đúng target;
- public smoke, health, Kudu runtime hoặc deployed mssql không đạt;
- manifest không đúng ba account hoặc có dấu hiệu trùng fixture cũ;
- server authorization không đạt 401/403/200 mong đợi;
- reject/resubmit/approve tạo transition/audit không đúng;
- cleanup không đưa active user/token/member/pending application về 0;
- remote runtime/helper không về 404/404;
- xuất hiện secret/PII/artifact thô;
- focused acceptance RED vì hạ tầng/fixture thay vì requirement;
- cần đổi API/schema/role/dependency/lockfile;
- H3 vòng 1 không chấp nhận đối soát hồi cứu FE02;
- amendment làm thay đổi source/test hoặc head thay đổi sau H3 cuối.

## 5. Tiêu chí hoàn tất PR C

- FE04 local và staging acceptance đều PASS, Playwright thoát sạch.
- Admin reject, Member resubmit, Admin approve được chứng minh trên API/UI thật.
- Server auth matrix, canonical endpoint/query và tám-item Admin shell được chứng minh.
- Bốn viewport không overflow.
- Đúng ba account tổng hợp được vô hiệu hóa; active token/user/member và pending application đều 0; login/token cũ bị từ chối.
- Không còn remote runtime/helper hoặc local artifact.
- FE04 TASKS/SPEC/PLAN/TEST_PLAN/CHANGELOG và validation record nhất quán; FE04 COMPLETE chỉ sau H2/manual approval.
- FE02-T043 có historical integration evidence và current retrospective H3 permalink thật.
- FE02-T049/CG-FE02-003 chỉ COMPLETE/RESOLVED sau H3 vòng 1 và amendment; PR C chỉ được merge sau H2 vòng 2, exact-head CI và H3 cuối.
- Full gates pass, diff chỉ gồm tài liệu đã liệt kê, không secret.
- PR C merge, post-merge CI/deploy/smoke exact SHA xanh.

## 6. Phạm vi phê duyệt kế hoạch

Phê duyệt kế hoạch gốc đã cho phép thực hiện Tasks 1-6 đến checkpoint H2 lần 1; mỗi lần chạy lại sau lỗi đều cần phê duyệt riêng, run ID mới và cleanup bắt buộc. Sau khi ba lần thử chạm stop condition, architecture amendment ngày 2026-08-03 chỉ cho phép đúng một mutation bổ sung sau khi người dùng review văn bản amendment. Phê duyệt này không tự động duyệt lượt thứ năm, H2, H3 vòng 1, amendment FE02, H2 lần 2, H3 cuối hoặc merge.
