# Release Closeout & Staging Acceptance — Design

- Date: 2026-08-02
- Baseline: `main@e01585a9aa7d603daf932f7ac6459eaa0752746c`
- Batch: `RELEASE-CLOSEOUT-STAGING-ACCEPTANCE-2026-08-02`
- Design branch: `codex/release-closeout-staging-acceptance-design`
- Delivery method: Hybrid SDD + ADD
- Depth: Standard/Full cho Core; Light cho Shell
- Status: Design approved; implementation plan and execution require the next human gate

## 1. Outcome

Batch này đóng ba khoảng trống còn lại của đợt release bằng bằng chứng kiểm chứng được:

1. Đồng bộ task, changelog và review record với những gì đã merge ở PR #95 và những gì thật sự vượt qua staging acceptance.
2. Chạy một acceptance flow có đăng nhập trên Azure staging bằng tài khoản và dữ liệu tổng hợp tạm thời, phủ chuỗi nghiệp vụ liên vai trò.
3. Dọn các worktree cũ theo cách không làm mất 31 file đang thay đổi, đồng thời tái xác nhận ngoại lệ bảo mật React Router hiện có.

Kết quả mong muốn không phải là “mọi checkbox đều xanh”. Mỗi task chỉ được đóng khi có bằng chứng đúng với acceptance criteria của chính task đó; phần chưa được kiểm chứng vẫn giữ trạng thái mở.

## 2. Non-goals

Batch này không:

- thêm endpoint, route, role, schema, migration hay business rule mới;
- tạo tài khoản dùng chung lâu dài hoặc lưu mật khẩu trong repo/log/artifact;
- chạy trên production hoặc tạo production workflow;
- nâng cấp/hạ cấp React Router một cách tự động;
- hard-delete user, audit log hay lịch sử nghiệp vụ;
- xóa thay đổi chưa commit trong worktree;
- dùng `/health`, CI xanh hoặc smoke không đăng nhập thay thế cho kiểm thử nghiệp vụ thật.

## 3. Delivery classification

### 3.1 Core

Các phần sau có blast radius cao và dùng mức Standard/Full:

- auth, session và token revocation;
- role/permission của Member, Librarian và Admin;
- seed/cleanup trực tiếp trên Azure SQL staging;
- borrow, reservation queue, return, fine, notification và audit trail;
- điều kiện đóng task dựa trên live acceptance.

Core phải có traceability, negative authorization checks, cleanup invariant và bằng chứng L1-L4.

### 3.2 Shell

Các phần sau có thể hoàn tác và dùng mức Light:

- cập nhật task/changelog/review record;
- tái xác nhận security exception đã tồn tại;
- lưu bằng chứng QA không chứa bí mật;
- đồng bộ root checkout và dọn worktree sau khi tạo recovery commit.

Shell vẫn phải qua diff review, link được tới nguồn bằng chứng và không được đưa tuyên bố rộng hơn kết quả thực tế.

## 4. Verified baseline and current gaps

Baseline trước khi thiết kế:

- staging đang chạy đúng revision `e01585a9aa7d603daf932f7ac6459eaa0752746c`;
- CI run `30711057582` và staging deployment run `30711210037` đã thành công;
- public frontend, `/health`, schema readiness, SQL catalog, CORS và protected-route smoke đã qua;
- backend có 1,175/1,175 tests, system 11/11, E2E 12/12 và deployment 20/20;
- traceability hiện là 9 COMPLETE và 3 PARTIAL: auth, membership management, user-role management;
- backend/root dependency audit không có finding; frontend còn advisory đã được kiểm soát cho `react-router` và `react-router-dom` 7.18.1;
- worktree `h3-fe07-fe12-governance` có 31 file thay đổi chưa commit và tuyệt đối không được xóa trực tiếp.

Khoảng trống còn lại:

- chưa có acceptance evidence có đăng nhập theo từng vai trò trên staging hiện tại;
- task/changelog chưa phản ánh đầy đủ PR #95;
- một số task cần human/runtime acceptance nên chưa thể đóng chỉ bằng test tự động;
- advisory record React Router cần gắn current evidence, owner và review trigger;
- worktree cũ cần được hợp nhất về trạng thái dễ khôi phục mà không làm mất nội dung.

## 5. Operator-side acceptance architecture

Không tạo đường seed trong ứng dụng. Acceptance dùng một operator harness tạm thời ở máy cục bộ và một lần thực thi giới hạn qua Azure Kudu/SCM:

```text
Local operator process
  |-- generates runId + four random passwords in memory
  |-- sends parameterized seed/cleanup commands to staging Kudu
  |-- drives staging UI with Playwright/browser automation
  |-- records only non-secret IDs, observations and screenshots
  `-- always executes cleanup/final verification

Azure staging app/Kudu
  |-- reuses deployed runtime and staging connection configuration
  `-- can mutate only rows tagged by the exact runId/manifest IDs
```

Constraints:

- harness là file tạm, nằm ngoài source control và bị xóa sau run;
- không có permanent API, backdoor, admin page hay CI workflow mới;
- mọi SQL value phải parameterized; object names phải lấy từ schema đã kiểm tra, không ghép từ input;
- lệnh bắt buộc khai báo rõ `environment=staging` và đúng Azure resource;
- mật khẩu chỉ tồn tại trong memory/environment của operator process, không xuất stdout/stderr;
- manifest chỉ chứa non-secret identifiers, run timestamps và cleanup status;
- artifact có token, cookie, connection string, password hoặc response header nhạy cảm phải bị loại bỏ/redact.

## 6. Synthetic fixture contract

### 6.1 Run identity

Mỗi run có marker duy nhất:

```text
runId = lms-acceptance-20260802-<random-suffix>
```

Mọi account, membership application, book/copy và nghiệp vụ được tạo phải truy ngược được về `runId` hoặc manifest ID chính xác. Cleanup không dùng wildcard theo tên/email.

### 6.2 Accounts

Bốn account tổng hợp:

| Alias | Role | Purpose |
|---|---|---|
| `member-a` | Member | membership approval, borrow, return/fine |
| `member-b` | Member | reservation queue and notification |
| `librarian` | Librarian | approve borrow, process return |
| `admin` | Admin | approve membership, audit/report checks |

Account contract:

- email dùng domain `.invalid` và có `runId`;
- tên, địa chỉ và dữ liệu profile đều là synthetic, không sao chép người thật;
- mỗi account có mật khẩu ngẫu nhiên riêng, chỉ giữ trong memory;
- role assignment là tối thiểu, không cấp role phụ để “cho test chạy”;
- initial state chỉ đủ để UI/API thực hiện flow thật; các state nghiệp vụ phải chuyển qua product flow khi có thể.

### 6.3 Catalog fixture

Tạo đúng một book và một copy chuyên dụng, có marker `runId`, không dùng catalog đang có. Copy này là đối tượng duy nhất được borrow/reserve/return trong run, giúp tránh cạnh tranh với dữ liệu demo hoặc người dùng staging khác.

### 6.4 Time-dependent setup

Nếu cần kiểm tra overdue/fine, operator chỉ được điều chỉnh due date của borrowing detail thuộc manifest sau khi borrow đã được approve qua product flow. Không sửa clock hệ thống, policy chung hoặc bản ghi ngoài manifest.

## 7. Acceptance scenario

### 7.1 Setup checks

Trước khi seed:

1. xác nhận frontend/API host và deployed revision;
2. xác nhận database là staging target;
3. xác nhận không tồn tại `runId` trùng;
4. chạy schema-readiness và kiểm tra các bảng/cột cần dùng;
5. khởi tạo local manifest không chứa secret.

Nếu bất kỳ check nào không khớp, không seed.

### 7.2 Role and auth checks

Với từng account:

- đăng nhập bằng UI;
- xác nhận identity/role từ product UI hoặc authenticated `/me` contract;
- xác nhận route hợp lệ của role;
- logout và xác nhận session kết thúc.

Negative checks tối thiểu:

- Member không truy cập được admin/librarian operation;
- Librarian không có admin-only membership/role operation;
- unauthenticated request không truy cập protected operation;
- permission denial phải là expected response, không phải client-only hidden UI.

### 7.3 Cross-role business flow

Flow chuẩn:

```text
Admin approves synthetic memberships
  -> Member A requests borrow of synthetic copy
  -> Librarian approves the borrowing request
  -> Member B reserves the now-unavailable title
  -> operator changes only the fixture due date
  -> Librarian processes Member A return
  -> system calculates applicable fine/state transition
  -> reservation queue advances for Member B
  -> notification/audit/report views reflect resulting state
```

Evidence cho mỗi bước phải ghi:

- actor và route UI;
- action/click;
- API method/path quan sát được;
- request identifiers nhưng không chứa credential/token;
- server-derived state trước/sau;
- expected result và actual result;
- screenshot hoặc structured observation khi hữu ích.

### 7.4 Required invariants

Run chỉ PASS khi tất cả điều kiện sau đúng:

- role isolation đúng ở cả UI và server response;
- Member A không tự approve borrowing của mình;
- Member B có queue state nhất quán khi copy không available;
- return không tạo double-processing khi lặp request/refresh;
- fine, borrowing status và copy availability không mâu thuẫn;
- queue advancement/notification xuất hiện đúng người nhận;
- audit/report view không để role ngoài phạm vi xem hoặc sửa dữ liệu;
- không có row nghiệp vụ ngoài manifest bị thay đổi.

## 8. Cleanup and retained audit

Cleanup chạy trong `finally`, kể cả khi setup hoặc acceptance thất bại giữa chừng.

Thứ tự:

1. dừng hoặc terminalize các open reservation/borrow state của fixture theo contract hiện có;
2. revoke toàn bộ refresh/access session có thể thu hồi của bốn account;
3. logout browser contexts và xóa local cookies/storage;
4. deactivate bốn account tổng hợp;
5. deactivate/retire book và copy fixture, không hard-delete reference đã đi vào audit/history;
6. giữ lại audit trail tối thiểu theo policy hiện hành;
7. chạy post-cleanup queries theo exact IDs;
8. xác nhận account không đăng nhập lại được và token cũ không dùng được.

Post-cleanup invariants:

- không còn active synthetic account;
- không còn active session/token của account;
- không còn open borrow/reservation trên fixture;
- synthetic book/copy không xuất hiện như catalog active;
- audit trail vẫn truy ngược được actor, action và timestamp;
- manifest ghi `CLEANED`, `PARTIAL_CLEANUP` hoặc `FAILED_CLEANUP` cho từng object.

Nếu cleanup không hoàn tất:

- không chạy lại bằng runId mới;
- không đóng các task phụ thuộc live acceptance;
- báo exact non-secret IDs còn sót và bước remediation;
- giữ manifest cho tới khi xác nhận sạch.

## 9. Evidence and task closeout

### 9.1 Evidence record

Tạo một review record mới tại:

`.sdd/reviews/release-closeout-staging-acceptance-2026-08-02.md`

Record phải chứa:

- baseline commit, deployment/CI run và staging hosts;
- runId đã redact phần ngẫu nhiên nếu cần;
- scenario matrix PASS/FAIL;
- role/route/API/state evidence;
- cleanup result;
- link tới task/spec/changelog liên quan;
- unresolved items và owner;
- không chứa secret, token, cookie hoặc PII.

Screenshot/raw artifact nếu có được giữ ngoài Git trong output tạm; review record chỉ giữ bằng chứng đã redact và đủ tái kiểm tra.

### 9.2 Existing PR #95 closeout

Các task đã có merge/test evidence từ PR #95 được đối chiếu lại acceptance criteria rồi mới cập nhật:

- FE02-T067;
- FE05-T019;
- FE11-CAT01.

Việc cập nhật phải link tới commit/PR/run cụ thể, không dùng mô tả chung “đã hoàn thành”.

### 9.3 Live-acceptance-dependent closeout

Các task FE04/FE11 chỉ được đóng nếu scenario thật sự phủ toàn bộ criteria của task. Đặc biệt, các item về admin approval, cross-feature convergence, role UX, personal-data operation hoặc runtime catalog chỉ được chuyển trạng thái khi evidence record có mapping trực tiếp.

Các item chỉ yêu cầu human review/owner confirmation nhưng chưa có phê duyệt tương ứng vẫn để mở. Không tự động đóng FE02-T049, FE09-B7 hoặc item tương tự chỉ vì flow chính PASS.

### 9.4 Documents to update

Phạm vi tối thiểu:

- feature `TASKS.md` bị ảnh hưởng;
- feature `CHANGELOG.md`/validation review tương ứng;
- `.sdd/traceability.yaml` chỉ khi evidence mới thật sự thay đổi trạng thái feature;
- release-closeout review record mới;
- không sửa requirement text để phù hợp với implementation hiện tại.

## 10. React Router advisory revalidation

Không tạo một ngoại lệ trùng lặp. Cập nhật record hiện có:

`docs/security/react-router-rsc-audit-exception-2026-07-25.md`

Required evidence:

- chạy lại full frontend audit trên lockfile hiện tại;
- kiểm tra advisory ID/range từ nguồn upstream/official hiện hành;
- xác nhận app vẫn dùng Declarative `BrowserRouter`/`Routes`/`Route`;
- xác nhận không có RSC, Framework Mode, server actions hoặc data-router APIs bị chặn;
- xác nhận `frontend/scripts/audit-high.js` vẫn fail với finding khác, version drift hoặc blocked API;
- ghi owner, review date và trigger để gỡ exception.

Nếu có phiên bản ổn định đã vá và tương thích, việc upgrade là một batch riêng có regression plan. Batch này không thay đổi dependency chỉ để làm audit output xanh.

## 11. Worktree preservation and cleanup

### 11.1 Dirty worktree

Đối với `.worktrees/h3-fe07-fe12-governance`:

1. xác nhận absolute path, branch, HEAD và 31 file thay đổi;
2. chạy secret scan và diff review phạm vi;
3. tạo local recovery branch có timestamp từ đúng HEAD;
4. commit toàn bộ thay đổi hiện tại vào recovery branch với message chỉ rõ nguồn;
5. xác nhận commit chứa đủ file và worktree sạch;
6. không push recovery branch;
7. chỉ sau đó mới remove worktree bằng Git;
8. xác nhận recovery branch/commit còn đọc được từ root checkout.

Nếu secret scan có finding thật, không commit/remove; dừng và báo vị trí đã redact, không in secret.

### 11.2 Clean merged worktrees

Đối với `audit-hardening` và `connected-circulation-flow`:

- xác nhận worktree sạch;
- xác nhận commit/PR tương ứng đã nằm trong `main` (kể cả squash mapping);
- remove từng exact path;
- không xóa branch nếu chưa có bằng chứng merge/recovery rõ ràng.

### 11.3 Root checkout

Root đã được fast-forward tới baseline trước khi tạo design branch. Sau batch, root phải:

- không có untracked secret/artifact;
- có branch/commit rõ ràng;
- không tham chiếu worktree path đã remove;
- giữ recovery branch cục bộ cho tới khi người dùng chủ động yêu cầu xóa.

## 12. Failure handling

| Failure | Required response |
|---|---|
| Wrong host/revision/database | Abort before seed |
| Partial seed | Cleanup exact created IDs; mark run failed |
| Browser/API assertion fails | Capture redacted evidence; continue to cleanup |
| Authorization unexpectedly succeeds | Treat as security failure; stop downstream flow; cleanup |
| Cleanup incomplete | Mark `FAILED_CLEANUP`; do not close dependent tasks |
| Advisory assumptions drift | Keep exception unresolved; do not edit dependency automatically |
| Worktree secret finding | Do not commit or remove worktree |
| Recovery commit verification fails | Do not remove worktree |

Không rollback bằng cách xóa hàng loạt hoặc reset repository. Mọi remediation phải giới hạn theo exact manifest IDs hoặc exact worktree path đã xác minh.

## 13. Validation model

### L1 — Automated correctness

- existing unit/system/E2E/deployment suites;
- traceability and contract checks;
- frontend audit guard;
- parameterized seed/cleanup assertions;
- post-cleanup invariant queries;
- `git diff --check` and changed-file review.

### L2 — Spec and task conformance

- map từng task được đóng tới acceptance criteria và evidence;
- xác nhận không sửa business requirement;
- xác nhận 3 việc ban đầu đều có result riêng, không gộp bằng một CI status.

### L3 — Security and privacy

- synthetic-only identity/data;
- no credential/token/log leakage;
- server-side negative authorization;
- least-privilege role assignment;
- token revocation and account deactivation;
- audit retained without hard-delete.

### L4 — Live staging acceptance

- UI login and role navigation trên real staging hosts;
- end-to-end cross-role business flow;
- observed API/state transitions;
- cleanup verified against staging database/runtime.

## 14. Human gates and commit boundaries

1. **Design gate:** tài liệu này được commit riêng và người dùng duyệt trước khi lập implementation plan.
2. **Plan/H1 gate:** implementation plan phải liệt kê exact files, commands, Azure targets, run order và rollback. Phê duyệt plan mới cho phép tạo fixture, chạy live acceptance và tạo local recovery commit.
3. **H2 gate:** sau khi chạy verification, review toàn bộ generated closeout diff và evidence trước khi commit/push implementation changes.
4. **H3 gate:** merge PR chỉ sau CI/security/traceability checks và human approval theo project governance.

Staging fixture/cleanup là external state change nhưng nằm trong phạm vi đã thiết kế; nó vẫn không được thực thi ở design-only commit này.

## 15. Acceptance criteria for this batch

Batch hoàn thành khi và chỉ khi:

- PR #95 task/changelog closeout phản ánh đúng evidence;
- authenticated staging flow có kết quả PASS, hoặc FAIL được ghi trung thực kèm cleanup đầy đủ;
- mọi synthetic account/token/fixture đã inactive/terminal theo cleanup contract;
- task chỉ đóng đúng phần có evidence, phần khác vẫn mở;
- React Router exception có current evidence, owner và review trigger;
- dirty worktree được bảo toàn bằng verified local recovery commit trước khi remove;
- clean merged worktrees được remove an toàn;
- full verification sau thay đổi không tạo regression;
- final report nêu exact branch/commit/PR/run và các residual risks.

Nếu live scenario FAIL nhưng cleanup PASS, batch có thể hoàn thành về mặt điều tra/evidence nhưng không được tuyên bố release closeout thành công và không được đóng task phụ thuộc scenario.
