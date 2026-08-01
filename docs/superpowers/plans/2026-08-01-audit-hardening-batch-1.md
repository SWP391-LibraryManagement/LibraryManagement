# Audit Hardening Batch 1 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Make Admin catalog-reference mutations and the security-sensitive authentication runtime fail closed, transactionally audited, and aligned with the approved FE02/FE05/FE11 contracts.

**Architecture:** Activate the SDD tasks in a governance-only PR first. After that PR reaches `main`, implement two serial TDD slices: Admin metadata mutation plus audit in one SQL transaction, then authentication configuration/transport/session-audit hardening using the existing transaction and repository patterns.

**Tech Stack:** Node.js 22, Express 5, CommonJS, SQL Server through `mssql`, Jest 30, Supertest, React/Vite regression gates, PowerShell on Windows.

## Global Constraints

- Baseline is `main@2abd87b36e418ba1d1ad3d529ea864eed8f606cf`; design approval is commit `e7a12af` on `codex/audit-hardening`.
- Use the approved design at `docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md` as the batch contract.
- Do not start product RED-GREEN until the governance activation PR has passed H2-G, required checks, H3-G, and reached `main`.
- Do not commit generated governance changes before H2-G. Do not commit product test/code changes before H2-P.
- After H2-P, preserve the reviewed diff as two product commits: one Admin commit and one Auth commit; make no code edits between H2-P approval and those commits.
- Keep one Builder for shared Core production files. Do not edit the same Core file concurrently from another lane.
- No schema, migration, dependency, endpoint, role, or successful-response expansion.
- `BCRYPT_COST` is an integer `>= 10` outside `NODE_ENV=test`; test-only cost is an integer `>= 4`.
- Public HTTP responses never include OTP, even in test/dev.
- Production HTTPS enforcement covers `/api` and `/api/*`; `/`, `/health`, `/health/ready`, `/api-docs`, and static assets keep their existing deployment behavior.
- Never run SQL mutation tests against Azure staging or production.
- Stop for contract ambiguity, Core drift, secret exposure, permission/schema/API expansion, a required-check failure, or three repeated deterministic failures.

---

## File Responsibility Map

### Governance activation

- `.sdd/specs/feat-book-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`: clarify that Admin reference-data mutations inherit FE05 atomic audit rules and activate `FE05-T019`.
- `.sdd/specs/feat-user-role-management/{SPEC,PLAN,TASKS,CHANGELOG}.md`: define the Admin metadata mutation/audit/error contract and activate `FE11-CAT01`.
- `.sdd/specs/feat-auth/{SPEC,PLAN,TASKS,CHANGELOG}.md`: clarify HTTPS scope and login/logout audit atomicity, then activate `FE02-T067`.

### Slice A — Admin metadata

- `backend/src/controllers/adminController.js`: derive trusted actor/IP/user-agent context from the authenticated request.
- `backend/src/services/adminService.js`: own validation, target/action mapping, transaction orchestration, required audit writes, not-found mapping, and audit detail projection.
- `backend/src/repositories/adminRepository.js`: own SQL transaction lifecycle and transaction-aware parameterized metadata queries.
- `backend/tests/adminLibraryRoleBoundary.test.js`: prove controller context and unchanged role boundary.
- `backend/tests/adminCatalogMetadataService.test.js`: prove service transaction/audit/error contracts.
- `backend/tests/adminCatalogMetadataRepository.test.js`: prove transaction request use, update row detection, commit, and rollback.
- `backend/tests/adminAuditLogService.test.js`: prove allowlisted projection of the three new audit actions.

### Slice B — Authentication

- `backend/src/config/env.js`: validate bcrypt cost at module load.
- `backend/src/middleware/httpsEnforcement.js`: enforce HTTPS for the full API namespace while retaining trusted-proxy and canonical-host behavior.
- `backend/src/services/authService.js`: remove debug OTP output and move successful login/logout audit into required transactions.
- `backend/src/repositories/authTokenRepository.js`: make single-token revoke transaction-aware.
- `backend/tests/envConfig.test.js`: prove runtime/test bcrypt floors.
- `backend/tests/httpsEnforcement.test.js`: prove non-auth API protection, proxy compatibility, redirect safety, and health exclusions.
- `backend/tests/authRoutes.test.js`: prove OTP absence and login/logout rollback/audit behavior.
- `backend/tests/helpers/inMemoryAuthRepositories.js`: preserve rollback evidence for token, user, and audit state.
- Backend test files that only set `AUTH_EXPOSE_TEST_TOKENS`: remove the obsolete assignment; do not otherwise rewrite those suites.

---

### Task 1: Activate the FE02/FE05/FE11 governance contract

**Files:**

- Modify: `.sdd/specs/feat-book-management/SPEC.md:3-9,370,387,402`
- Modify: `.sdd/specs/feat-book-management/PLAN.md:1-17` and append one bounded remediation section
- Modify: `.sdd/specs/feat-book-management/TASKS.md` after `FE05-T018`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md:1-3`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md:3-9,318,351,535-553,694,718,726-728`
- Modify: `.sdd/specs/feat-user-role-management/PLAN.md` by appending one bounded remediation section
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md` by appending `FE11-CAT01`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md:1-3`
- Modify: `.sdd/specs/feat-auth/SPEC.md:3-9,338,492,509,661`
- Modify: `.sdd/specs/feat-auth/PLAN.md` by appending one bounded remediation section
- Modify: `.sdd/specs/feat-auth/TASKS.md` after `FE02-T066`
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md:1-3`
- Retain: `docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md`
- Retain: `docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md`

**Interfaces:**

- Consumes: Approved H1 design `AUDIT-HARDENING-2026-08-01`.
- Produces: Active task IDs `FE05-T019`, `FE11-CAT01`, and `FE02-T067`, plus exact requirement text used by all product tasks.

- [x] **Step 1: Apply the exact FE05 governance clarification**

Set the FE05 header to version `0.6.11`, last updated `2026-08-01`. Extend the existing integration and NFR lines with this content:

```markdown
- Thư viện quản trị FE11 có thể tạo/cập nhật/vô hiệu hóa bản ghi tham chiếu danh mục, tác giả và nhà xuất bản qua ranh giới `/api/admin/library/*` chỉ dành cho Quản trị viên. Mỗi mutation phải ghi actor và audit catalog trong cùng giao dịch; cập nhật hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND`. Thủ thư chỉ nhận các lựa chọn `/api/books/metadata` đang hoạt động cần thiết cho việc thay đổi sách FE05.

- NFR-FE05-TXN-001: Tạo/cập nhật/vô hiệu hóa/kích hoạt lại sách hoặc dữ liệu tham chiếu catalog và log audit bắt buộc phải cùng thành công hoặc cùng rollback.

- NFR-FE05-LOG-001: Thao tác thêm, cập nhật, vô hiệu hóa và kích hoạt lại sách hoặc dữ liệu tham chiếu catalog phải truy vết được bằng tác nhân, dấu thời gian, loại/ID mục tiêu, trạng thái cũ/mới và lý do khi áp dụng.
```

Append this plan/task content:

```markdown
## 2026-08-01 Củng cố mutation dữ liệu tham chiếu catalog

1. Thêm kiểm thử RED cho context tác nhân, not-found, action/target audit và rollback khi audit lỗi.
2. Làm ba mutation `/api/admin/library/*` dùng cùng transaction với `AuditLogs`.
3. Giữ role, endpoint, schema, envelope thành công và soft-deactivate hiện có.
4. Xác minh backend tập trung/đầy đủ, coverage, traceability, secret scan, system/E2E/deployment và vệ sinh diff trước H2-P.

- [ ] **FE05-T019 - Ghi audit nguyên tử cho mutation dữ liệu tham chiếu catalog.**
  - Ánh xạ tới: NFR-FE05-TXN-001, NFR-FE05-LOG-001; tích hợp FE11 `BR-FE11-033`, `FR-FE11-043`, `AC-FE11-026`.
  - RED: actor context, ba action audit allowlist, update/deactivate không tồn tại và rollback audit.
  - GREEN: mutation và audit dùng một transaction SQL tham số hóa; update không có hàng trả null để service ánh xạ `404`.
  - Ranh giới: không đổi schema, endpoint, role, envelope thành công hoặc quyền sở hữu trạng thái bản sao FE06.
```

Add the changelog entry without claiming implementation:

```markdown
## 2026-08-01 - Kích hoạt củng cố audit dữ liệu tham chiếu catalog (v0.6.11)

- Làm rõ mutation tác giả/nhà xuất bản/thể loại của Quản trị viên chịu ranh giới transaction/audit FE05 hiện có.
- Kích hoạt `FE05-T019`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Step 2: Apply the exact FE11 governance clarification**

Set the FE11 header to version `0.6.14`, last updated `2026-08-01`. Extend the existing stable IDs and NFRs as follows:

```markdown
- BR-FE11-033: Vai trò hiện tại duy nhất của tài khoản kiểm soát quyền truy cập dữ liệu tham chiếu danh mục: `ADMIN` có thể liệt kê/tạo/cập nhật/vô hiệu hóa tác giả, nhà xuất bản và danh mục qua `/api/admin/library/*`; mọi mutation được phép phải ghi actor và audit catalog trong cùng giao dịch. `LIBRARIAN` chỉ được đọc lựa chọn đang hoạt động qua FE05 `/api/books/metadata`; `MEMBER` và Khách không được thực hiện hai nhóm thao tác này.

- FR-FE11-043: NẾU Thủ thư, Thành viên hoặc Khách gọi bất kỳ điểm cuối `/api/admin/library/{authors|publishers|categories}` nào, máy chủ phải từ chối yêu cầu trước khi gọi tầng lưu bền siêu dữ liệu. KHI Quản trị viên đã xác thực tạo/cập nhật/vô hiệu hóa dữ liệu tham chiếu, mutation và audit catalog phải cùng commit/rollback; cập nhật ID không tồn tại hoặc vô hiệu hóa ID không tồn tại/không còn hoạt động trả `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` mà không ghi audit thành công.

- NFR-FE11-TXN-007: Tạo, cập nhật hoặc vô hiệu hóa tác giả/nhà xuất bản/thể loại và bản ghi audit tương ứng phải dùng cùng một giao dịch SQL.

- NFR-FE11-LOG-003: Audit mutation dữ liệu tham chiếu catalog phải dùng `CATALOG_METADATA_CREATE`, `CATALOG_METADATA_UPDATE` hoặc `CATALOG_METADATA_DEACTIVATE`, chứa ID Quản trị viên, IP, user-agent, target type/ID và metadata theo allowlist; không chứa body thô hoặc credential.
```

Replace the `AC-FE11-026` row and `FR-FE11-043` trace row with:

```markdown
| AC-FE11-026 | Chỉ Quản trị viên truy cập quản lý tác giả/nhà xuất bản/danh mục; mutation được phép ghi audit nguyên tử và ID không tồn tại trả 404; Thủ thư vẫn dùng lựa chọn chỉ đọc của FE05 | FR-FE11-043 | BR-FE11-033 | `backend/tests/adminLibraryRoleBoundary.test.js`; `backend/tests/adminCatalogMetadataService.test.js`; `backend/tests/adminCatalogMetadataRepository.test.js`; `backend/tests/adminAuditLogService.test.js` | PARTIAL: ROLE BOUNDARY COMPLETE; FE11-CAT01 PENDING |

| FR-FE11-043 | Ranh giới role metadata và mutation/audit nguyên tử | BR-FE11-033 | AC-FE11-026 | FE11-CAT01 và các kiểm thử metadata Admin tập trung | PARTIAL: ROLE BOUNDARY COMPLETE; FE11-CAT01 PENDING |
```

Keep the total counts at 26 AC, 43 FR, and 33 BR because no new BR/FR/AC ID is added. Append:

```markdown
## 2026-08-01 Củng cố mutation metadata Quản trị

1. Giữ role đơn hiện tại làm nguồn ủy quyền duy nhất.
2. Truyền actor/IP/user-agent từ request đã xác thực, không từ body/query.
3. Ghi ba action catalog allowlist trong cùng transaction với mutation.
4. Ánh xạ update/deactivate không có hàng sang `404 ADMIN_RESOURCE_ITEM_NOT_FOUND` và không ghi audit thành công.

- [ ] **FE11-CAT01 - Làm mutation metadata Quản trị có audit nguyên tử.**
  - Ánh xạ tới: BR-FE11-033, FR-FE11-043, AC-FE11-026, NFR-FE11-TXN-007, NFR-FE11-LOG-003; FE05-T019.
  - DoD: ba mutation giữ role/endpoint/envelope, dùng một transaction cho nguồn + audit, update không tồn tại không trả thành công giả và projector audit chỉ chiếu metadata allowlist.
  - Bằng chứng yêu cầu: RED-GREEN controller/service/repository/projector, backend đầy đủ/coverage, traceability, secret scan, system/E2E/deployment và review H2-P/H3-P.
```

Add the changelog entry:

```markdown
## 2026-08-01 - Kích hoạt audit nguyên tử cho metadata Quản trị (v0.6.14)

- Khóa action/target allowlist, context tác nhân, transaction và lỗi not-found cho `/api/admin/library/*`.
- Kích hoạt `FE11-CAT01`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Step 3: Apply the exact FE02 governance clarification**

Set the FE02 header to version `0.6.20`, last updated `2026-08-01`. Replace the existing AC/NFR text with:

```markdown
- AC-FE02-024: Với request `/api` hoặc `/api/*` truyền credential/token qua HTTP không mã hóa trong môi trường triển khai, khi yêu cầu đến, hệ thống phải chuyển hướng sang HTTPS hoặc từ chối trước khi parse body hoặc dispatch route; liveness/readiness và static asset ngoài namespace API không bị gate này chặn.

- NFR-FE02-SEC-003: HTTPS phải được thực thi cho tất cả request `/api` và `/api/*` có thể mang credential hoặc token; request HTTP phải được chuyển hướng bằng canonical host đã cấu hình hoặc bị từ chối trước khi xử lý. `/`, `/health`, `/health/ready`, `/api-docs` và static assets giữ hợp đồng triển khai riêng.

- NFR-FE02-TXN-002: Đăng nhập thành công phải commit việc đặt lại trạng thái đăng nhập, tạo refresh token và `AUTH_LOGIN_SUCCESS` trong cùng giao dịch; đăng xuất phải commit việc thu hồi refresh token hiện tại khi có và `AUTH_LOGOUT` trong cùng giao dịch. Lỗi audit bắt buộc làm rollback state transition tương ứng.
```

Replace the AC trace row with:

```markdown
| AC-FE02-024 | Request HTTP tới namespace API đã triển khai bị chuyển hướng hoặc từ chối trước khi xử lý credential/token; health/static exclusions vẫn hoạt động | NFR-FE02-SEC-003 | BR-FE02-017 | `backend/tests/httpsEnforcement.test.js` | PENDING FE02-T067 |
```

Append plan/task content:

```markdown
## 18. Củng cố runtime và session-audit 2026-08-01

1. Thêm RED cho bcrypt floor production/test, OTP response, HTTPS toàn API và rollback login/logout khi audit lỗi.
2. Loại debug OTP path; test lấy OTP qua dependency được inject/fake delivery.
3. Dùng transaction hiện có cho login success và logout; giữ các event login failure/lock ngoài phạm vi batch này.
4. Không đổi schema, token format, role, endpoint hoặc response thành công ngoài việc loại trường debug bị cấm.

- [ ] **FE02-T067 - Củng cố bcrypt, OTP response, HTTPS và audit session nguyên tử.**
  - Ánh xạ tới: BR-FE02-005, BR-FE02-011, BR-FE02-016, BR-FE02-017, BR-FE02-020; AC-FE02-024; NFR-FE02-SEC-001/003/015, NFR-FE02-TXN-002, NFR-FE02-LOG-001/002.
  - RED: production bcrypt dưới 10, `debugOtp`, HTTP API ngoài auth, trusted proxy/health exclusions, login/logout audit rollback và audit context.
  - GREEN: fail-fast config, xóa debug response, gate `/api`, transaction audit bắt buộc cho login success/logout và revoke nhận transaction.
  - Ranh giới: audit login attempt/failure/lock/auto-unlock vẫn là follow-up riêng; không tuyên bố đã chuyển chúng sang fail-closed.
```

Add the changelog entry:

```markdown
## 2026-08-01 - Kích hoạt củng cố runtime và session-audit FE02 (v0.6.20)

- Làm rõ bcrypt floor, cấm debug OTP, HTTPS namespace API và transaction audit cho đăng nhập thành công/đăng xuất.
- Kích hoạt `FE02-T067`; chưa ghi nhận bằng chứng triển khai sản phẩm.
```

- [x] **Step 4: Validate the governance-only diff**

Run from the worktree root:

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
git status --short
```

Expected: all commands exit `0`; status contains the new plan and the 12 FE02/FE05/FE11 governance files only (the design is already committed as `e7a12af`); no backend/frontend/database/workflow file is modified.

Run the exact ID/status scan:

```powershell
rg -n "FE05-T019|FE11-CAT01|FE02-T067|NFR-FE11-TXN-007|NFR-FE11-LOG-003" .sdd/specs
git diff -- .sdd/specs/feat-auth .sdd/specs/feat-book-management .sdd/specs/feat-user-role-management | Select-String -Pattern '^\+.*(TBD|TODO|FIXME|PLACEHOLDER)'
```

Expected: the first scan finds each activated ID in its SPEC/PLAN/TASKS/CHANGELOG context; the second command prints no newly added unresolved marker.

- [x] **Step 5: Stop for H2-G; only after approval commit and publish governance**

Present the complete governance diff and validation output. Do not commit until the user grants H2-G. After H2-G, run:

```powershell
git add docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md .sdd/specs/feat-auth .sdd/specs/feat-book-management .sdd/specs/feat-user-role-management
git diff --cached --check
git commit -m "docs: activate audit hardening batch"
git push -u origin codex/audit-hardening
```

Expected: one governance commit after `e7a12af`; push succeeds without product files.

Open a governance-only PR:

```powershell
gh pr create --base main --head codex/audit-hardening --title "docs: activate audit hardening batch" --body-file docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md
gh pr checks --watch
gh pr view --json number,headRefOid,mergeable,statusCheckRollup,url
```

Expected: required checks pass on the exact governance head and the PR is mergeable. Stop for H3-G. Only after explicit H3-G may it merge:

```powershell
gh pr merge --merge
gh run list --branch main --limit 5
```

After the exact post-merge CI run succeeds, prepare the same worktree for product work:

```powershell
git fetch origin
git status --short
git switch -c codex/audit-hardening-product origin/main
git merge-base --is-ancestor origin/main HEAD
```

Expected: clean worktree on `codex/audit-hardening-product`, based on the `main` commit containing `FE05-T019`, `FE11-CAT01`, and `FE02-T067`.

---

### Task 2: Implement Admin metadata mutation and audit atomically

**Files:**

- Create: `backend/tests/adminCatalogMetadataService.test.js`
- Modify: `backend/tests/adminLibraryRoleBoundary.test.js:7-52`
- Modify: `backend/tests/adminCatalogMetadataRepository.test.js:1-49`
- Modify: `backend/tests/adminAuditLogService.test.js:85-115`
- Modify: `backend/src/controllers/adminController.js:3-62`
- Modify: `backend/src/services/adminService.js:8-39,193-412,462-545`
- Modify: `backend/src/repositories/adminRepository.js:1,168-246,420-432`

**Interfaces:**

- Consumes: Active `FE05-T019` and `FE11-CAT01`; existing `auditLogRepository.create({ ..., transaction })`.
- Produces: `adminRepository.withTransaction(work)`, transaction-aware `createResource(resource, name, transaction)`, `updateResource(resource, id, name, transaction) -> row|null`, and `deactivateResource(resource, id, transaction) -> number`.
- Produces: service signatures `createResource(resource, body, context)`, `updateResource(resource, id, body, context)`, `deactivateResource(resource, id, context)` where `context = { actorId, ip, userAgent }`.

- [ ] **Step 1: Install dependencies in the product worktree when absent**

```powershell
if (-not (Test-Path node_modules)) { npm ci }
if (-not (Test-Path backend/node_modules)) { npm --prefix backend ci }
if (-not (Test-Path frontend/node_modules)) { npm --prefix frontend ci }
```

Expected: each required install exits `0`; lockfiles remain unchanged.

- [ ] **Step 2: Write failing controller and service tests**

Add this route-level assertion to `adminLibraryRoleBoundary.test.js`:

```js
test('Admin metadata mutations pass trusted request audit context', async () => {
  const adminService = {
    createResource: jest.fn(async () => ({ data: { id: 1, name: 'Author' } })),
    updateResource: jest.fn(async () => ({ data: { id: 1, name: 'Updated' } })),
    deactivateResource: jest.fn(async () => ({ deactivated: true, data: { id: 1, status: 'INACTIVE' } })),
  };
  const app = makeApp('ADMIN', adminService);

  await request(app)
    .post('/api/admin/library/authors')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Author' })
    .expect(201);
  await request(app)
    .put('/api/admin/library/authors/1')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .send({ name: 'Updated' })
    .expect(200);
  await request(app)
    .patch('/api/admin/library/authors/1/deactivate')
    .set('Authorization', 'Bearer admin-token')
    .set('User-Agent', 'catalog-audit-test')
    .expect(200);

  const context = { actorId: 7, ip: expect.any(String), userAgent: 'catalog-audit-test' };
  expect(adminService.createResource).toHaveBeenCalledWith('authors', { name: 'Author' }, context);
  expect(adminService.updateResource).toHaveBeenCalledWith('authors', '1', { name: 'Updated' }, context);
  expect(adminService.deactivateResource).toHaveBeenCalledWith('authors', '1', context);
});
```

Create `adminCatalogMetadataService.test.js` with a transaction sentinel and assertions for all three actions:

```js
const mockTransaction = { name: 'catalog-transaction' };

jest.mock('../src/repositories/adminRepository', () => ({
  getResourceConfig: jest.fn(),
  withTransaction: jest.fn(),
  createResource: jest.fn(),
  updateResource: jest.fn(),
  deactivateResource: jest.fn(),
}));
jest.mock('../src/repositories/auditLogRepository', () => ({
  create: jest.fn(),
  listAuditLogs: jest.fn(),
}));

const adminRepository = require('../src/repositories/adminRepository');
const auditLogRepository = require('../src/repositories/auditLogRepository');
const adminService = require('../src/services/adminService');

const context = { actorId: 7, ip: '203.0.113.7', userAgent: 'jest-catalog' };

beforeEach(() => {
  jest.clearAllMocks();
  adminRepository.getResourceConfig.mockImplementation((resource) => ({ resource }));
  adminRepository.withTransaction.mockImplementation((work) => work(mockTransaction));
});

test.each([
  ['authors', 'AUTHOR'],
  ['publishers', 'PUBLISHER'],
  ['categories', 'CATEGORY'],
])('create %s writes required catalog audit in the mutation transaction', async (resource, targetType) => {
  adminRepository.createResource.mockResolvedValue({ id: 11, name: 'Name', status: 'ACTIVE' });

  await expect(adminService.createResource(resource, { name: ' Name ' }, context)).resolves.toEqual({
    data: { id: 11, name: 'Name', status: 'ACTIVE' },
  });
  expect(adminRepository.createResource).toHaveBeenCalledWith(resource, 'Name', mockTransaction);
  expect(auditLogRepository.create).toHaveBeenCalledWith({
    userId: 7,
    action: 'CATALOG_METADATA_CREATE',
    targetType,
    targetId: 11,
    metadata: { resource },
    ipAddress: '203.0.113.7',
    userAgent: 'jest-catalog',
    transaction: mockTransaction,
  });
});

test('update returns not found and does not write a success audit when no row exists', async () => {
  adminRepository.updateResource.mockResolvedValue(null);

  await expect(adminService.updateResource('authors', 404, { name: 'Missing' }, context))
    .rejects.toMatchObject({ statusCode: 404, code: 'ADMIN_RESOURCE_ITEM_NOT_FOUND' });
  expect(auditLogRepository.create).not.toHaveBeenCalled();
});

test('update and deactivate use allowlisted audit payloads in the same transaction', async () => {
  adminRepository.updateResource.mockResolvedValue({ id: 3, name: 'Updated' });
  adminRepository.deactivateResource.mockResolvedValue(1);

  await adminService.updateResource('authors', 3, { name: 'Updated' }, context);
  await adminService.deactivateResource('authors', 3, context);

  expect(auditLogRepository.create).toHaveBeenNthCalledWith(1, expect.objectContaining({
    action: 'CATALOG_METADATA_UPDATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', changedFields: ['name'] },
    transaction: mockTransaction,
  }));
  expect(auditLogRepository.create).toHaveBeenNthCalledWith(2, expect.objectContaining({
    action: 'CATALOG_METADATA_DEACTIVATE',
    targetType: 'AUTHOR',
    targetId: 3,
    metadata: { resource: 'authors', newStatus: 'INACTIVE' },
    transaction: mockTransaction,
  }));
});

test('audit failure rejects the transaction work instead of reporting mutation success', async () => {
  adminRepository.createResource.mockResolvedValue({ id: 5, name: 'Atomic' });
  auditLogRepository.create.mockRejectedValue(new Error('audit insert failed'));

  await expect(adminService.createResource('authors', { name: 'Atomic' }, context))
    .rejects.toThrow('audit insert failed');
});
```

- [ ] **Step 3: Write failing repository and projector tests**

Replace the DB mock prelude in `adminCatalogMetadataRepository.test.js` with this complete transaction-capable mock:

```js
const mockQuery = jest.fn();
const mockInput = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockSqlRequest = jest.fn(() => ({ input: mockInput, query: mockQuery }));
const mockTransactionBegin = jest.fn();
const mockTransactionCommit = jest.fn();
const mockTransactionRollback = jest.fn();
const mockTransaction = {
  begin: mockTransactionBegin,
  commit: mockTransactionCommit,
  rollback: mockTransactionRollback,
};
const mockSqlTransaction = jest.fn(() => mockTransaction);

jest.mock('../src/config/db', () => ({
  getPool: jest.fn(async () => ({ request: mockRequest })),
  sql: {
    Int: 'INT',
    NVarChar: jest.fn((length) => `NVARCHAR(${length})`),
    Request: mockSqlRequest,
    Transaction: mockSqlTransaction,
  },
}));
```

Reset the queued SQL results and clear the transaction/request call history in `beforeEach`:

```js
beforeEach(() => {
  mockQuery.mockReset();
  [
    mockInput,
    mockRequest,
    mockSqlRequest,
    mockTransactionBegin,
    mockTransactionCommit,
    mockTransactionRollback,
    mockSqlTransaction,
  ].forEach((mock) => mock.mockClear());
});
```

Then add:

```js
test('update returns null when SQL Server updates no resource row', async () => {
  mockQuery.mockResolvedValueOnce({ recordset: [] });

  await expect(adminRepository.updateResource('authors', 999, 'Missing')).resolves.toBeNull();
  expect(mockQuery.mock.calls[0][0]).toContain('OUTPUT INSERTED.AuthorId AS id');
});

test('metadata mutations use the supplied SQL transaction request', async () => {
  const transaction = { id: 'tx' };
  mockQuery.mockResolvedValueOnce({
    recordset: [{ id: 7, name: 'Transactional', status: 'ACTIVE', createdAt: new Date() }],
  });

  await adminRepository.createResource('authors', 'Transactional', transaction);

  expect(mockSqlRequest).toHaveBeenCalledWith(transaction);
  expect(mockRequest).not.toHaveBeenCalled();
});

test('withTransaction rolls back when its work rejects', async () => {
  const failure = new Error('audit failed');

  await expect(adminRepository.withTransaction(async () => { throw failure; }))
    .rejects.toBe(failure);
  expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
  expect(mockTransactionRollback).toHaveBeenCalledTimes(1);
  expect(mockTransactionCommit).not.toHaveBeenCalled();
});

test('withTransaction commits and returns successful work', async () => {
  await expect(adminRepository.withTransaction(async () => 'committed')).resolves.toBe('committed');
  expect(mockTransactionBegin).toHaveBeenCalledTimes(1);
  expect(mockTransactionCommit).toHaveBeenCalledTimes(1);
  expect(mockTransactionRollback).not.toHaveBeenCalled();
});
```

Add these cases to `projectorCases` in `adminAuditLogService.test.js`:

```js
{ actions: ['CATALOG_METADATA_CREATE'], metadata: { resource: 'authors', name: 'omit' }, expected: { resource: 'authors' } },
{ actions: ['CATALOG_METADATA_UPDATE'], metadata: { resource: 'publishers', changedFields: ['name', 'token'] }, expected: { resource: 'publishers', changedFields: ['name'] } },
{ actions: ['CATALOG_METADATA_DEACTIVATE'], metadata: { resource: 'categories', newStatus: 'INACTIVE', reason: 'omit' }, expected: { resource: 'categories', newStatus: 'INACTIVE' } },
```

- [ ] **Step 4: Run the focused tests and confirm RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js
```

Expected: FAIL only on the new contracts: controller has no context argument, service does not call `withTransaction`/audit, update returns success for a missing row, repository lacks transaction helpers, and projector returns `{}` for new actions.

- [ ] **Step 5: Implement the minimal controller context**

Add once near the top of `adminController.js`:

```js
function auditContext(req) {
  return {
    actorId: req.user.userId,
    ip: req.ip,
    userAgent: req.get('user-agent'),
  };
}
```

Pass `auditContext(req)` as the final argument to `createResource`, `updateResource`, and `deactivateResource`; leave read handlers unchanged.

- [ ] **Step 6: Implement transaction-aware repository methods**

Add this helper and export it:

```js
async function withTransaction(work) {
  const transaction = new sql.Transaction(await getPool());
  await transaction.begin();
  try {
    const result = await work(transaction);
    await transaction.commit();
    return result;
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

async function resourceRequest(transaction) {
  return transaction ? new sql.Request(transaction) : (await getPool()).request();
}
```

Change the three mutation signatures to accept `transaction`, obtain the request through `resourceRequest(transaction)`, and make update return a real row:

```js
async function updateResource(resource, id, name, transaction) {
  const config = getResourceConfig(resource);
  const result = await (await resourceRequest(transaction))
    .input('id', sql.Int, id)
    .input('name', sql.NVarChar(100), name)
    .query(`
      UPDATE ${config.table}
      SET ${config.name} = @name
      OUTPUT INSERTED.${config.id} AS id, INSERTED.${config.name} AS name
      WHERE ${config.id} = @id;
    `);
  return result.recordset[0] || null;
}
```

Use the same request pattern in create/deactivate without changing their response fields or SQL semantics.

- [ ] **Step 7: Implement service transaction/audit orchestration and projection**

Add fixed mappings:

```js
const RESOURCE_TARGET_TYPES = Object.freeze({
  authors: 'AUTHOR',
  publishers: 'PUBLISHER',
  categories: 'CATEGORY',
});
const CATALOG_METADATA_CHANGED_FIELDS = new Set(['name']);
```

Add a projector helper:

```js
function readCatalogResource(value) {
  const resource = readText(value, { max: 20 });
  return resource !== INVALID_AUDIT_VALUE && RESOURCE_NAMES.has(resource)
    ? resource
    : INVALID_AUDIT_VALUE;
}
```

Add three `projectAuditDetails` cases that use `readCatalogResource`, `readChangedFields`, and `readText`:

```js
case 'CATALOG_METADATA_CREATE':
  projected = buildAuditDetails({ resource: readCatalogResource(metadata.resource) });
  break;
case 'CATALOG_METADATA_UPDATE':
  projected = buildAuditDetails({
    resource: readCatalogResource(metadata.resource),
    changedFields: readChangedFields(metadata.changedFields, CATALOG_METADATA_CHANGED_FIELDS),
  });
  break;
case 'CATALOG_METADATA_DEACTIVATE':
  projected = buildAuditDetails({
    resource: readCatalogResource(metadata.resource),
    newStatus: readText(metadata.newStatus, { max: 20 }),
  });
  break;
```

Add this internal audit helper and call it inside each transaction:

```js
async function writeCatalogAudit({ resource, targetId, action, metadata, context, transaction }) {
  await auditLogRepository.create({
    userId: context.actorId,
    action,
    targetType: RESOURCE_TARGET_TYPES[resource],
    targetId,
    metadata,
    ipAddress: context.ip || null,
    userAgent: context.userAgent || null,
    transaction,
  });
}
```

For create/update, pass the returned row ID as `targetId`; for deactivate, pass the validated request ID. For update, throw before the audit if repository returns `null`. For deactivate, throw before the audit if affected rows are zero. Preserve the existing SQL `547 -> RESOURCE_IN_USE` mapping around the whole deactivate transaction.

- [ ] **Step 8: Run Slice A GREEN and regression tests**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js tests/adminPermissionService.test.js
```

Expected: all listed suites PASS, `0` failed.

Do not commit. Record intended post-H2-P commit:

```powershell
git add backend/src/controllers/adminController.js backend/src/services/adminService.js backend/src/repositories/adminRepository.js backend/tests/adminLibraryRoleBoundary.test.js backend/tests/adminCatalogMetadataService.test.js backend/tests/adminCatalogMetadataRepository.test.js backend/tests/adminAuditLogService.test.js
git commit -m "fix: make catalog metadata audit atomic"
```

---

### Task 3: Enforce bcrypt/OTP/HTTPS runtime contracts

**Files:**

- Modify: `backend/tests/envConfig.test.js:1-101`
- Modify: `backend/tests/httpsEnforcement.test.js:1-107`
- Modify: `backend/tests/authRoutes.test.js:1-20,785-880`
- Modify: `backend/src/config/env.js:1-25,71-79`
- Modify: `backend/src/middleware/httpsEnforcement.js:1-50`
- Modify: `backend/src/services/authService.js:54-68,699-704`
- Modify only to delete obsolete env assignments: `backend/tests/{bookRoutes,borrowingRoutes,integration,inventoryRoutes,membershipRoutes,notificationRoutes,reportRoutes,reservationRoutes,systemIntegration}.test.js`
- Modify only to delete obsolete service option: `backend/tests/userManagementService.test.js`

**Interfaces:**

- Consumes: Active `FE02-T067`.
- Produces: `bcryptCostFromEnv() -> integer`, no debug-token response option, and HTTPS middleware whose protected namespace is exactly `/api` plus `/api/*`.

- [ ] **Step 1: Write failing bcrypt configuration tests**

Extend the environment snapshot/restore in `envConfig.test.js` to include `BCRYPT_COST` and `NODE_ENV`, then add:

```js
test('defaults bcrypt cost to 10 outside test', () => {
  process.env.NODE_ENV = 'production';
  delete process.env.BCRYPT_COST;
  jest.resetModules();
  expect(require('../src/config/env').bcryptCost).toBe(10);
});

test.each(['4', '9'])('rejects production bcrypt cost %s below 10', (value) => {
  process.env.NODE_ENV = 'production';
  process.env.BCRYPT_COST = value;
  jest.resetModules();
  expect(() => require('../src/config/env')).toThrow(
    'BCRYPT_COST must be an integer >= 10 outside NODE_ENV=test'
  );
});

test.each(['0', '3', '4.5'])('rejects invalid test bcrypt cost %s', (value) => {
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_COST = value;
  jest.resetModules();
  expect(() => require('../src/config/env')).toThrow();
});

test('allows bcrypt cost 4 only in test', () => {
  process.env.NODE_ENV = 'test';
  process.env.BCRYPT_COST = '4';
  jest.resetModules();
  expect(require('../src/config/env').bcryptCost).toBe(4);
});
```

- [ ] **Step 2: Write the failing no-debug-OTP assertion**

In the successful change-password OTP request at `authRoutes.test.js:828`, retain the response and assert the exact public shape:

```js
const otpResponse = await request(app)
  .post('/api/auth/change-password/request-otp')
  .set('Authorization', authorization)
  .send({
    currentPassword: 'Password1!',
    newPassword: 'NewPassword1!',
    confirmNewPassword: 'NewPassword1!',
  })
  .expect(200);

expect(otpResponse.body).toEqual({
  message: 'OTP đã được gửi đến email của bạn.',
  maskedEmail: 'o***e@example.test',
});
expect(otpResponse.body.maskedEmail).toBe('o***e@example.test');
expect(Object.keys(otpResponse.body).sort()).toEqual(['maskedEmail', 'message']);
expect(otpResponse.body).not.toHaveProperty('debugOtp');
```

The assertions intentionally avoid reading OTP from the response; `capturedOtp(app)` remains the test-only injected capture.

- [ ] **Step 3: Write failing full-API HTTPS tests**

Add these cases to `httpsEnforcement.test.js`:

```js
test('deployed plain-HTTP non-auth API requests are rejected before route dispatch', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps();
    const adminService = { listResource: jest.fn() };
    const authService = { authenticateToken: jest.fn() };
    const app = createApp({ authService, adminService });

    const response = await request(app).get('/api/admin/library/authors');

    expect(response.status).toBe(400);
    expect(response.body.error).toEqual({
      code: 'HTTPS_REQUIRED',
      message: 'HTTPS is required for API requests.',
    });
    expect(authService.authenticateToken).not.toHaveBeenCalled();
    expect(adminService.listResource).not.toHaveBeenCalled();
  } finally {
    restoreEnvironment(snapshot);
  }
});

test('trusted proxy HTTPS allows a protected non-auth API request', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps({ TRUST_PROXY: 'true' });
    const adminService = { listResource: jest.fn(async () => ({ data: [] })) };
    const authService = {
      authenticateToken: jest.fn(async () => ({ userId: 7, roles: ['ADMIN'] })),
    };
    const app = createApp({ authService, adminService });

    await request(app)
      .get('/api/admin/library/authors')
      .set('Authorization', 'Bearer test-token')
      .set('X-Forwarded-Proto', 'https')
      .expect(200);
    expect(adminService.listResource).toHaveBeenCalledWith('authors', {});
  } finally {
    restoreEnvironment(snapshot);
  }
});

test('production liveness remains available over the internal HTTP hop', async () => {
  const snapshot = envSnapshot();
  try {
    withProductionHttps();
    const response = await request(createApp()).get('/health');
    expect(response.status).toBe(200);
    expect(response.body.status).toBe('ok');
  } finally {
    restoreEnvironment(snapshot);
  }
});
```

- [ ] **Step 4: Run focused tests and confirm RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/envConfig.test.js tests/httpsEnforcement.test.js tests/authRoutes.test.js
```

Expected: new production bcrypt floor tests fail, OTP response contains `debugOtp`, and the non-auth HTTP API request reaches routing instead of returning `HTTPS_REQUIRED`.

- [ ] **Step 5: Implement the bcrypt floor**

Add in `env.js`:

```js
function bcryptCostFromEnv() {
  const value = positiveIntegerFromEnv('BCRYPT_COST', 10);
  const minimum = process.env.NODE_ENV === 'test' ? 4 : 10;
  if (value < minimum) {
    const suffix = process.env.NODE_ENV === 'test' ? 'in NODE_ENV=test' : 'outside NODE_ENV=test';
    throw new Error(`BCRYPT_COST must be an integer >= ${minimum} ${suffix}`);
  }
  return value;
}
```

Export `bcryptCost: bcryptCostFromEnv()` instead of `numberFromEnv('BCRYPT_COST', 10)`.

- [ ] **Step 6: Remove the debug OTP path and obsolete test flags**

Delete `exposeDebugTokens` from the `createAuthService` parameter list and delete:

```js
if (exposeDebugTokens) response.debugOtp = otp;
```

Return the response object directly. Remove every `process.env.AUTH_EXPOSE_TEST_TOKENS = 'true';` under `backend/tests` and the `exposeDebugTokens: true` option from `userManagementService.test.js`. Do not change historical planning documents.

Verify source/test removal:

```powershell
rg -n "AUTH_EXPOSE_TEST_TOKENS|exposeDebugTokens|debugOtp" backend/src backend/tests
```

Expected: only negative assertions containing `debugOtp` may remain; no source/config/assignment occurrence remains.

- [ ] **Step 7: Expand HTTPS enforcement to the exact API namespace**

Add:

```js
function isApiRequest(req) {
  return req.path === '/api' || req.path.startsWith('/api/');
}
```

Change the middleware guard and safe message to:

```js
if (!enabled || !isApiRequest(req) || requestProtocol(req) === 'https') {
  return next();
}

return res.status(400).json({
  error: {
    code: 'HTTPS_REQUIRED',
    message: 'HTTPS is required for API requests.',
  },
});
```

Keep the existing canonical-host regex and `308` redirect code unchanged.

- [ ] **Step 8: Run Slice B runtime GREEN tests**

```powershell
npm --prefix backend test -- --runTestsByPath tests/envConfig.test.js tests/httpsEnforcement.test.js tests/authRoutes.test.js
```

Expected: all three suites PASS; `0` failed.

Do not commit; Task 4 adds the remaining reviewed Auth diff before H2-P.

---

### Task 4: Make successful login and logout audit fail closed atomically

**Files:**

- Modify: `backend/tests/authRoutes.test.js:624-749` and append rollback cases near existing atomicity tests
- Modify: `backend/tests/helpers/inMemoryAuthRepositories.js:309-317` so `markTokenUsed` and `revokeToken` explicitly accept an unused `_transaction` argument while the surrounding transaction snapshot continues to provide rollback evidence
- Modify: `backend/src/services/authService.js:100-123,592-620,643-659`
- Modify: `backend/src/repositories/authTokenRepository.js:90-111`

**Interfaces:**

- Consumes: `authTransactionRepository.withTransaction(work)`, `auditLogRepository.create({ transaction })`, and the active `FE02-T067` contract.
- Produces: `revokeToken(tokenId, transaction)` and required same-transaction `AUTH_LOGIN_SUCCESS`/`AUTH_LOGOUT` writes.

- [ ] **Step 1: Write the failing login rollback/audit tests**

Add to `authRoutes.test.js`:

```js
test('login rolls back session state when required success audit fails', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'login-audit-rollback@example.test');
  dependencies.state.users[0].failedLoginCount = 2;
  dependencies.state.users[0].lastLoginAt = null;
  const originalCreate = dependencies.auditLogRepository.create;
  jest.spyOn(dependencies.auditLogRepository, 'create').mockImplementation(async (entry) => {
    if (entry.action === 'AUTH_LOGIN_SUCCESS') throw new Error('login audit failed');
    return originalCreate(entry);
  });

  const response = await login(app, 'login-audit-rollback@example.test');

  expect(response.status).toBe(500);
  expect(response.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error.' });
  expect(dependencies.state.tokens.filter((token) => token.tokenType === 'REFRESH')).toHaveLength(0);
  expect(dependencies.state.users[0].failedLoginCount).toBe(2);
  expect(dependencies.state.users[0].lastLoginAt).toBeNull();
  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGIN_SUCCESS')).toHaveLength(0);
});

test('successful login records one required audit with request context', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'login-audit-context@example.test');

  await request(app)
    .post('/api/auth/login')
    .set('User-Agent', 'login-audit-agent')
    .send({ email: 'login-audit-context@example.test', password: 'Password1!' })
    .expect(200);

  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGIN_SUCCESS')).toEqual([
    expect.objectContaining({
      userId: dependencies.state.users[0].userId,
      targetType: 'USER',
      targetId: dependencies.state.users[0].userId,
      ipAddress: expect.any(String),
      userAgent: 'login-audit-agent',
    }),
  ]);
});
```

- [ ] **Step 2: Write the failing logout rollback/idempotency tests**

```js
test('logout rolls back refresh-token revoke when required audit fails', async () => {
  const { app, dependencies } = makeTestApp();
  await registerAndVerify(app, 'logout-audit-rollback@example.test');
  const loginResponse = await login(app, 'logout-audit-rollback@example.test');
  const refreshTokenId = dependencies.state.tokens.find(
    (token) => token.tokenType === 'REFRESH'
  ).tokenId;
  const originalCreate = dependencies.auditLogRepository.create;
  jest.spyOn(dependencies.auditLogRepository, 'create').mockImplementation(async (entry) => {
    if (entry.action === 'AUTH_LOGOUT') throw new Error('logout audit failed');
    return originalCreate(entry);
  });

  const response = await request(app)
    .post('/api/auth/logout')
    .send({ refreshToken: loginResponse.body.refreshToken });

  expect(response.status).toBe(500);
  expect(response.body.error).toEqual({ code: 'INTERNAL_ERROR', message: 'Internal server error.' });
  expect(dependencies.state.tokens.find((token) => token.tokenId === refreshTokenId).revokedAt)
    .toBeNull();
  await request(app)
    .get('/api/auth/me')
    .set('Authorization', `Bearer ${loginResponse.body.accessToken}`)
    .expect(200);
});

test('logout stays idempotent and writes one required audit when the token is absent', async () => {
  const { app, dependencies } = makeTestApp();

  await request(app)
    .post('/api/auth/logout')
    .set('User-Agent', 'logout-idempotent-agent')
    .send({ refreshToken: 'missing-refresh-token' })
    .expect(200, { message: 'Logged out' });

  expect(dependencies.state.auditLogs.filter((entry) => entry.action === 'AUTH_LOGOUT')).toEqual([
    expect.objectContaining({
      userId: null,
      targetType: 'USER',
      targetId: null,
      ipAddress: expect.any(String),
      userAgent: 'logout-idempotent-agent',
    }),
  ]);
});
```

- [ ] **Step 3: Run focused Auth tests and confirm RED**

```powershell
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js
```

Expected: login audit failure returns `500` but leaves a refresh token/last-login mutation, and logout audit failure leaves the token revoked; these new assertions fail before implementation.

- [ ] **Step 4: Move successful login audit inside the existing transaction**

Change the successful login transaction to:

```js
const storedRefreshToken = await authTransactionRepository.withTransaction(async (transaction) => {
  const prepared = await userRepository.resetFailedLoginsAndSetLastLogin(user.userId, transaction);
  if (!prepared) {
    throw errors.unauthorized('INVALID_CREDENTIALS', 'Invalid email or password.');
  }
  const storedToken = await createStoredToken(
    user.userId,
    'REFRESH',
    addDays(clock(), env.refreshTokenTtlDays),
    context,
    transaction
  );
  await writeAudit(context, 'AUTH_LOGIN_SUCCESS', {
    userId: user.userId,
    targetId: user.userId,
    metadata: { identifier, reason: 'AUTHENTICATED' },
    transaction,
    required: true,
  });
  return storedToken;
});
```

Delete the old post-transaction `AUTH_LOGIN_SUCCESS` call. Keep access-token signing and response creation after commit.

- [ ] **Step 5: Make revoke transaction-aware and move logout audit into a transaction**

Change the repository function to:

```js
async function revokeToken(tokenId, transaction) {
  const request = transaction ? new sql.Request(transaction) : (await getPool()).request();
  await request
    .input('TokenId', sql.Int, tokenId)
    .query(`
      UPDATE AuthTokens
      SET RevokedAt = COALESCE(RevokedAt, GETDATE())
      WHERE TokenId = @TokenId
    `);
}
```

Keep the in-memory repository interface aligned without changing its snapshot behavior:

```js
async markTokenUsed(tokenId, _transaction) {
  const token = tokens.find((item) => item.tokenId === Number(tokenId));
  token.usedAt = new Date();
},

async revokeToken(tokenId, _transaction) {
  const token = tokens.find((item) => item.tokenId === Number(tokenId));
  token.revokedAt = new Date();
},
```

Change logout to:

```js
async function logout(input, context = {}) {
  const refreshTokenHash = hashToken(String(input.refreshToken || '').trim());
  const tokenRecord = await authTokenRepository.findActiveTokenByHash('REFRESH', refreshTokenHash);

  await authTransactionRepository.withTransaction(async (transaction) => {
    if (tokenRecord) {
      const revoke = typeof authTokenRepository.revokeToken === 'function'
        ? authTokenRepository.revokeToken
        : authTokenRepository.markTokenUsed;
      await revoke(tokenRecord.tokenId, transaction);
    }
    await writeAudit(context, 'AUTH_LOGOUT', {
      userId: context.userId || tokenRecord?.userId || null,
      targetId: context.userId || tokenRecord?.userId || null,
      transaction,
      required: true,
    });
  });

  return { message: 'Logged out' };
}
```

Update the `writeAudit` comment to state “best effort by default; required writes propagate errors” without changing unrelated event behavior.

- [ ] **Step 6: Run focused Auth GREEN tests**

```powershell
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Expected: all listed suites PASS; `0` failed. Login/logout failure tests show rollback, and idempotent logout still returns `200`.

Record the intended post-H2-P Auth commit, but do not run it yet:

```powershell
git add backend/src/config/env.js backend/src/middleware/httpsEnforcement.js backend/src/services/authService.js backend/src/repositories/authTokenRepository.js backend/tests/authRoutes.test.js backend/tests/envConfig.test.js backend/tests/httpsEnforcement.test.js backend/tests/helpers/inMemoryAuthRepositories.js backend/tests/bookRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/integration.test.js backend/tests/inventoryRoutes.test.js backend/tests/membershipRoutes.test.js backend/tests/notificationRoutes.test.js backend/tests/reportRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/systemIntegration.test.js backend/tests/userManagementService.test.js
git commit -m "fix: harden authentication runtime"
```

---

### Task 5: Run L1-L4, obtain H2-P, commit, publish, and close H3-P

**Files:**

- Verify all product files from Tasks 2-4.
- Do not change `.github/workflows`, `database`, frontend source, Azure settings, branch protection, release tags, or Batch 2 documents.

**Interfaces:**

- Consumes: Complete uncommitted Slice A + Slice B product diff.
- Produces: Two reviewed product commits, one product PR, exact-head CI evidence, H3-P decision, and post-merge verification.

- [ ] **Step 1: Run L1 focused gates**

```powershell
npm --prefix backend test -- --runTestsByPath tests/adminLibraryRoleBoundary.test.js tests/adminCatalogMetadataService.test.js tests/adminCatalogMetadataRepository.test.js tests/adminAuditLogService.test.js tests/adminPermissionService.test.js
npm --prefix backend test -- --runTestsByPath tests/authRoutes.test.js tests/envConfig.test.js tests/httpsEnforcement.test.js
```

Expected: every listed suite PASS; `0` failed.

- [ ] **Step 2: Run L2 backend regression and coverage**

```powershell
npm --prefix backend test
npm --prefix backend run test:coverage:ci
```

Expected: exit `0`; every backend suite passes; global statements/branches/functions/lines remain at or above `80%`.

- [ ] **Step 3: Run L3 governance and repository safety**

```powershell
npm run trace:enforce
npm run test:secrets
git diff --check
git status --short
```

Expected: traceability and secret checks exit `0`; no whitespace error; status contains only the approved product files.

Run scope/security scans:

```powershell
rg -n "AUTH_EXPOSE_TEST_TOKENS|exposeDebugTokens" backend/src backend/tests
rg -n "debugOtp" backend/src
rg -n "CATALOG_METADATA_(CREATE|UPDATE|DEACTIVATE)" backend/src backend/tests
git diff --name-only origin/main...HEAD
git diff --name-only
```

Expected: first two scans return no source/config match; catalog actions occur only in Admin service/tests; committed and working-tree file lists stay inside the approved scope.

- [ ] **Step 4: Run L4 observable integration gates**

```powershell
npm run test:system
npm run test:e2e
npm run test:deployment
```

Expected: system, Chromium E2E, and deployment suites all exit `0`. If E2E alone appears flaky, rerun it once with captured output; do not rerun deterministic failures without a code diagnosis.

- [ ] **Step 5: Perform the H2-P review checkpoint**

Present:

- full product diff against the governance-enabled `origin/main`;
- L1-L4 command outputs and counts;
- explicit mapping to `FE05-T019`, `FE11-CAT01`, `FE02-T067`;
- residual risk that login attempt/failure/lock/auto-unlock audit remains best-effort;
- confirmation of no schema/dependency/API/role expansion and no OTP/secret exposure.

Do not stage or commit until the user grants H2-P.

- [ ] **Step 6: After H2-P, create the two reviewed product commits without editing**

```powershell
git add backend/src/controllers/adminController.js backend/src/services/adminService.js backend/src/repositories/adminRepository.js backend/tests/adminLibraryRoleBoundary.test.js backend/tests/adminCatalogMetadataService.test.js backend/tests/adminCatalogMetadataRepository.test.js backend/tests/adminAuditLogService.test.js
git diff --cached --check
git commit -m "fix: make catalog metadata audit atomic"

git add backend/src/config/env.js backend/src/middleware/httpsEnforcement.js backend/src/services/authService.js backend/src/repositories/authTokenRepository.js backend/tests/authRoutes.test.js backend/tests/envConfig.test.js backend/tests/httpsEnforcement.test.js backend/tests/helpers/inMemoryAuthRepositories.js backend/tests/bookRoutes.test.js backend/tests/borrowingRoutes.test.js backend/tests/integration.test.js backend/tests/inventoryRoutes.test.js backend/tests/membershipRoutes.test.js backend/tests/notificationRoutes.test.js backend/tests/reportRoutes.test.js backend/tests/reservationRoutes.test.js backend/tests/systemIntegration.test.js backend/tests/userManagementService.test.js
git diff --cached --check
git commit -m "fix: harden authentication runtime"

git status --short
```

Expected: exactly two new product commits; worktree clean; no file outside the H2-P reviewed set is committed.

- [ ] **Step 7: Push and open the product PR**

```powershell
git push -u origin codex/audit-hardening-product
gh pr create --base main --head codex/audit-hardening-product --title "fix: harden catalog and authentication audit" --body "Design: docs/superpowers/specs/2026-08-01-audit-hardening-batch-1-design.md. Plan: docs/superpowers/plans/2026-08-01-audit-hardening-batch-1.md. Tasks: FE05-T019, FE11-CAT01, FE02-T067. Evidence: L1-L4 results are included in the PR checks/review record. Residual boundary: login attempt/failure/lock/auto-unlock audit remains best-effort."
gh pr checks --watch
gh pr view --json number,headRefOid,mergeable,statusCheckRollup,url
```

In the PR description, retain the design document's references to:

- design `2026-08-01-audit-hardening-batch-1-design.md`;
- plan `2026-08-01-audit-hardening-batch-1.md`;
- tasks `FE05-T019`, `FE11-CAT01`, `FE02-T067`;
- L1-L4 evidence;
- residual best-effort audit boundary.

Expected: required `foundation-checks` run against the exact product head; PR remains unmerged.

- [ ] **Step 8: Stop for H3-P, then merge and verify only after approval**

Before H3-P, confirm exact PR head SHA, required checks success, mergeability, final diff, and no new commits after H2-P. Only explicit H3-P authorizes merge.

After merge, verify the exact merge commit on `main`:

```powershell
gh pr merge --merge
git fetch origin
git log -1 --oneline origin/main
gh run list --branch main --limit 5
```

Wait for exact post-merge CI/deployment evidence. Report final branch/commit/PR/run identifiers and state clearly whether staging smoke passed. Do not create a release tag or change repository/Azure settings.

---

## Self-Review Checklist

- Requirement coverage: Task 1 activates all FE02/FE05/FE11 rules; Task 2 covers Admin correctness/audit; Tasks 3-4 cover bcrypt/OTP/HTTPS/session audit; Task 5 covers all L1-L4 and H2/H3 gates.
- Interface consistency: controller uses `{ actorId, ip, userAgent }`; audit repository receives `{ userId, ipAddress, userAgent, transaction }`; resource repository methods receive transaction last; token revoke receives transaction last.
- Scope consistency: no schema, dependency, frontend behavior, endpoint, role, workflow, release tag, GitHub setting, Azure setting, SQL CI, or Batch 2 change.
- Residual risk is explicit: non-success login event audit remains best-effort and is not claimed complete.
- Commit consistency: governance commit only after H2-G; product commits only after H2-P; each PR still requires its own H3.
