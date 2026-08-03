# Vietnamese Documentation Reconciliation Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hoàn thiện batch Việt hóa tài liệu, khôi phục đầy đủ các hợp đồng kỹ thuật bị dịch sai, xóa bốn artifact đã được người dùng phê duyệt và đưa một diff tài liệu đã kiểm chứng lên nhánh tích hợp sạch.

**Architecture:** Giữ nguyên mã nguồn, schema, API, workflow và kiểm thử; sửa tài liệu theo từng nhóm có thể review độc lập. Các chuỗi tiếng Anh mà deployment tests dùng làm hợp đồng được đặt trong ngữ cảnh song ngữ có nghĩa, còn prose mô tả tiếp tục dùng tiếng Việt. Mỗi nhóm được stage bằng danh sách path giới hạn, sau đó các commit đã review được áp dụng vào worktree sạch từ `origin/main`.

**Tech Stack:** Markdown, PowerShell, Git, Node.js built-in test runner, Jest, Vite, ESLint.

## Global Constraints

- Thiết kế đã phê duyệt: `docs/superpowers/specs/2026-08-03-vietnamese-documentation-reconciliation-design.md`.
- Không thay đổi production code, GitHub Actions workflow, API, schema, role hoặc business rule.
- Không sửa hoặc làm yếu assertions trong `tests/deployment/*.test.js`.
- Giữ prose tiếng Việt nhưng bảo toàn path, command, URL, endpoint, enum, requirement ID, commit SHA, PR/run number, tên sản phẩm và technical anchor.
- Xóa vĩnh viễn đúng bốn artifact đã được người dùng phê duyệt; không tạo file nhị phân thay thế.
- Không stage hoặc công bố `scripts/translate_docs_to_vi.py`, cache Python hay hai plan cục bộ không thuộc batch.
- Không dùng `git add .` hoặc `git add -A`; mọi lần stage phải dùng path tường minh hoặc pathspec giới hạn đã kiểm tra bằng `git diff --cached --name-status`.
- Không tạo nhánh có `codex` trong tên. Nhánh tích hợp là `docs/vietnamese-documentation-reconciliation-pr`.
- Baseline ngày 2026-08-03: `npm run test:deployment` chạy 20 tests, pass 16 và fail 4 do chuỗi hợp đồng trong `docs/deployment/azure-staging-guide.md` bị dịch.

---

### Task 1: Khôi phục hợp đồng tài liệu deployment

**Files:**
- Modify: `docs/deployment/azure-staging-guide.md`
- Test: `tests/deployment/stagingKeepalivePolicy.test.js`
- Test: `tests/deployment/stagingWorkflowPolicy.test.js`

**Interfaces:**
- Consumes: regex contracts đã tồn tại trong hai deployment test files.
- Produces: hướng dẫn Azure bằng tiếng Việt có đủ 10 technical anchor tiếng Anh trong đúng ngữ cảnh vận hành.

- [ ] **Step 1: Chạy lại baseline RED giới hạn**

Run:

```powershell
npm run test:deployment
```

Expected: `tests 20`, `pass 16`, `fail 4`; các lỗi nằm ở operator-guide assertions và không phải workflow/runtime code.

- [ ] **Step 2: Sửa phần CI-gated deployment bằng nội dung song ngữ có nghĩa**

Trong `docs/deployment/azure-staging-guide.md`, đổi tiêu đề phần triển khai liên tục và bổ sung các câu tiếng Anh bắt buộc ngay cạnh phần giải thích tiếng Việt:

```markdown
## CI-Gated Continuous Deployment (Triển khai liên tục qua cổng CI)

Chỉ triển khai tự động sau một successful `main` CI run cho đúng commit. Bằng chứng migration phải
khớp exact migration file hash của các byte thực tế đã được áp dụng. Schema chuẩn có table count `21`.
```

Giữ nguyên các bước vận hành, tên workflow, biến `FE10_INBOX_MIGRATION_SHA256`, thứ tự backend/frontend/browser và mọi cảnh báo bảo mật hiện có.

- [ ] **Step 3: Sửa phần bằng chứng byte rendering**

Đặt hai anchor trong đoạn giải thích hash migration, không đặt thành câu rời vô nghĩa:

```markdown
Đối chiếu chỉ chấp nhận LF and CRLF byte renderings của cùng nội dung đã review. Ghi lại
hash of the bytes actually applied; không dùng hash của một bản nội dung khác hoặc một file đã được
chỉnh sửa lại.
```

- [ ] **Step 4: Sửa phần keepalive và rollback**

Đổi tiêu đề và bổ sung các câu sau ở đúng thứ tự trước các lệnh `alwaysOn=false`, F1 và rollback:

```markdown
## Free-Tier Staging Keepalive (Keepalive cho staging free-tier)

Đây là cơ chế best-effort cho môi trường demo, không phải cam kết uptime hoặc thời gian gửi thông báo.
Chỉ tiếp tục hạ cấu hình sau khi manual `Staging keepalive` run succeeds.
```

Trong đoạn rollback, dùng đúng câu:

```markdown
Nếu keepalive liên tục thất bại, scale the plan back to B1 rồi set `alwaysOn=true`; sau đó chạy lại
health check, public catalog check và kiểm tra worker bằng dữ liệu tổng hợp.
```

Giữ nguyên cảnh báo `60 days` và lệnh `gh workflow enable staging-keepalive.yml`.

- [ ] **Step 5: Chạy deployment tests để xác nhận GREEN**

Run:

```powershell
npm run test:deployment
```

Expected: `tests 20`, `pass 20`, `fail 0`.

- [ ] **Step 6: Review diff và commit riêng**

Run:

```powershell
git diff --check -- docs/deployment/azure-staging-guide.md
git diff -- docs/deployment/azure-staging-guide.md
git add -- docs/deployment/azure-staging-guide.md
git diff --cached --name-status
git commit -m "docs: restore deployment documentation contracts"
```

Expected staged paths before commit: chỉ `M docs/deployment/azure-staging-guide.md`.

---

### Task 2: Đối soát SDD và trạng thái yêu cầu

**Files:**
- Modify: `.sdd/specs/feat-auth/CHANGELOG.md`
- Modify: `.sdd/specs/feat-auth/SPEC.md`
- Modify: `.sdd/specs/feat-auth/TASKS.md`
- Modify: `.sdd/specs/feat-book-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-book-management/TASKS.md`
- Modify: `.sdd/specs/feat-user-role-management/CHANGELOG.md`
- Modify: `.sdd/specs/feat-user-role-management/SPEC.md`
- Modify: `.sdd/specs/feat-user-role-management/TASKS.md`
- Test: `scripts/check-traceability.js`
- Test: `scripts/fe07-fe12-vietnamese-semantics.test.js`

**Interfaces:**
- Consumes: requirement IDs, status markers và evidence hiện có trong từng feature folder.
- Produces: SDD tiếng Việt không đổi nghĩa requirement, actor permission hoặc trạng thái hoàn thành.

- [ ] **Step 1: Chụp diff SDD trước khi chỉnh**

Run:

```powershell
git diff -- .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-book-management/CHANGELOG.md .sdd/specs/feat-book-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/TASKS.md
```

Expected: chỉ thay đổi tài liệu; không có ID mới, xóa ID, đổi enum, đổi role hoặc mở rộng acceptance criteria.

- [ ] **Step 2: Sửa từng lỗi dịch làm đổi nghĩa**

Áp dụng các quy tắc cụ thể sau cho cả tám file:

```text
Giữ nguyên: BR-*, FR-*, AC-*, NFR-*, TD-*, enum, endpoint, field, role MEMBER/LIBRARIAN/ADMIN.
Giữ nguyên: COMPLETE, APPROVED, NOT STARTED khi chúng là status machine-readable hoặc bằng chứng lịch sử.
Dịch: câu mô tả và tiêu đề dành cho người đọc.
Không được: biến yêu cầu bắt buộc thành tùy chọn; đổi actor sở hữu hành động; đổi số lượng, thời hạn hoặc giới hạn.
```

Đối chiếu mỗi thay đổi với version tại `HEAD` bằng `git show "HEAD:$path"`, trong đó `$path` là file
đang review, khi câu tiếng Việt không rõ nghĩa.

- [ ] **Step 3: Chạy traceability và semantic gates**

Run:

```powershell
npm run trace:enforce
node --test scripts/fe07-fe12-vietnamese-semantics.test.js
```

Expected: cả hai command exit `0`; traceability không giảm dưới ngưỡng `70` và semantic tests không có failure.

- [ ] **Step 4: Stage đúng tám file và commit**

Run:

```powershell
git diff --check -- .sdd/specs/feat-auth .sdd/specs/feat-book-management .sdd/specs/feat-user-role-management
git add -- .sdd/specs/feat-auth/CHANGELOG.md .sdd/specs/feat-auth/SPEC.md .sdd/specs/feat-auth/TASKS.md .sdd/specs/feat-book-management/CHANGELOG.md .sdd/specs/feat-book-management/TASKS.md .sdd/specs/feat-user-role-management/CHANGELOG.md .sdd/specs/feat-user-role-management/SPEC.md .sdd/specs/feat-user-role-management/TASKS.md
git diff --cached --name-status
git commit -m "docs: reconcile Vietnamese feature specifications"
```

Expected staged paths before commit: đúng tám file được liệt kê trong task này.

---

### Task 3: Đối soát tài liệu API, kiến trúc và nền tảng

**Files:**
- Modify: `docs/api/api-contract.md`
- Modify: `docs/architecture/feature-integration-map.md`
- Modify: `docs/architecture/system-architecture.md`
- Modify: `docs/phase_1_foundation/01_project_overview.md`
- Modify: `docs/phase_1_foundation/02_scope.md`
- Modify: `docs/phase_1_foundation/03_actor_list.md`
- Modify: `docs/phase_1_foundation/07_master_feature_list.md`
- Modify: `docs/tong-quan-he-thong-vi.md`
- Modify: `docs/user-manual.md`
- Create: `scripts/vietnamese-documentation-semantics.test.js`

**Interfaces:**
- Consumes: API routes, actor names, FE01-FE12 identifiers và architecture relationships hiện có.
- Produces: tài liệu nền tảng tiếng Việt giữ nguyên contract kỹ thuật và topology hệ thống.

- [ ] **Step 1: Viết regression test cho thuật ngữ actor**

Tạo `scripts/vietnamese-documentation-semantics.test.js`:

```javascript
const assert = require('node:assert/strict');
const { readFile } = require('node:fs/promises');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

test('actor list uses software-domain terminology instead of performer wording', async () => {
  const actorList = await readFile(
    path.join(root, 'docs', 'phase_1_foundation', '03_actor_list.md'),
    'utf8'
  );

  assert.doesNotMatch(actorList, /diễn viên|người thực hiện/iu);
  assert.match(actorList, /# Danh sách tác nhân/);
  assert.match(actorList, /Tác nhân con người/);
});
```

Run:

```powershell
node --test scripts/vietnamese-documentation-semantics.test.js
```

Expected: FAIL vì file hiện còn `Danh sách diễn viên`, `Diễn viên con người` và `người thực hiện`.

- [ ] **Step 2: Quét identifier và tên riêng có nguy cơ bị dịch**

Run:

```powershell
rg -n "Azureh|Á hậu|Hành động GitHub|giao diện người dùng|máy chủ|điểm cuối|kho lưu trữ|cam kết" docs/api/api-contract.md docs/architecture/feature-integration-map.md docs/architecture/system-architecture.md docs/phase_1_foundation/01_project_overview.md docs/phase_1_foundation/02_scope.md docs/phase_1_foundation/03_actor_list.md docs/phase_1_foundation/07_master_feature_list.md docs/tong-quan-he-thong-vi.md docs/user-manual.md
```

Expected: mọi hit được phân loại; sửa hit là lỗi dịch máy, giữ hit là tiếng Việt tự nhiên có chủ đích.

- [ ] **Step 3: Đối chiếu các contract kỹ thuật**

Run:

```powershell
rg -n "(/api/|GET |POST |PUT |PATCH |DELETE |MEMBER|LIBRARIAN|ADMIN|FE0[1-9]|FE1[0-2]|BR-|FR-|AC-)" docs/api/api-contract.md docs/architecture/feature-integration-map.md docs/architecture/system-architecture.md docs/phase_1_foundation/01_project_overview.md docs/phase_1_foundation/02_scope.md docs/phase_1_foundation/03_actor_list.md docs/phase_1_foundation/07_master_feature_list.md docs/tong-quan-he-thong-vi.md docs/user-manual.md
```

So sánh các hit thay đổi với `HEAD`; khôi phục chính xác endpoint, HTTP method, role, ID, số lượng và dependency direction nếu bản dịch đã thay đổi chúng.

- [ ] **Step 4: Sửa toàn bộ actor list theo nghĩa miền phần mềm**

Dùng `tác nhân` cho UML/software actor, `Tác nhân con người` cho `Human actor`, và sửa các lỗi dịch
máy liên quan trong cùng file như `fine` thành `khoản phạt`, `book copy` thành `bản sao sách`,
`borrowing history` thành `lịch sử mượn`, `audit log` thành `nhật ký kiểm toán`. Không thêm quyền hoặc
tương tác mới ngoài bản tiếng Anh tại `HEAD`.

- [ ] **Step 5: Review Markdown links và code fences**

Run:

```powershell
rg -n "\]\([^)]*\)|^```" docs/api/api-contract.md docs/architecture/feature-integration-map.md docs/architecture/system-architecture.md docs/phase_1_foundation/01_project_overview.md docs/phase_1_foundation/02_scope.md docs/phase_1_foundation/03_actor_list.md docs/phase_1_foundation/07_master_feature_list.md docs/tong-quan-he-thong-vi.md docs/user-manual.md
```

Expected: path/URL/code fence không bị dịch, không có link tương đối trỏ tới file không tồn tại.

- [ ] **Step 6: Chạy regression test và các gates liên quan**

Run:

```powershell
npm run trace:enforce
npm run test:deployment
node --test scripts/vietnamese-documentation-semantics.test.js
git diff --check -- docs/api docs/architecture docs/phase_1_foundation docs/tong-quan-he-thong-vi.md docs/user-manual.md
git add -- docs/api/api-contract.md docs/architecture/feature-integration-map.md docs/architecture/system-architecture.md docs/phase_1_foundation/01_project_overview.md docs/phase_1_foundation/02_scope.md docs/phase_1_foundation/03_actor_list.md docs/phase_1_foundation/07_master_feature_list.md docs/tong-quan-he-thong-vi.md docs/user-manual.md scripts/vietnamese-documentation-semantics.test.js
git diff --cached --name-status
git commit -m "docs: reconcile Vietnamese system documentation"
```

Expected: deployment `20/20`, regression/traceability exit `0`, staged paths đúng mười file.

---

### Task 4: Xóa artifact đã phê duyệt và sửa tài liệu bàn giao hiện hành

**Files:**
- Delete: `docs/briefing-thuyet-trinh-du-an-vi.docx`
- Delete: `docs/phase_1_foundation/04_context_diagram.drawio (2).png`
- Delete: `docs/presentation/phase3-defense-deck-source.md`
- Delete: `docs/presentation/phase3-defense-deck.pptx`
- Modify: `docs/release/final-submission-checklist-2026-07-20.md`
- Modify: `docs/release/phase3-final-report.md`

**Interfaces:**
- Consumes: quyết định xóa vĩnh viễn của người dùng và các tài liệu Markdown còn tồn tại.
- Produces: repository không còn bốn artifact, checklist/report không tuyên bố chúng còn khả dụng, lịch sử demo vẫn được giữ đúng sự thật.

- [ ] **Step 1: Xác nhận bốn file đã biến mất và Git nhận deletion**

Run:

```powershell
$deleted = @(
  'docs/briefing-thuyet-trinh-du-an-vi.docx',
  'docs/phase_1_foundation/04_context_diagram.drawio (2).png',
  'docs/presentation/phase3-defense-deck-source.md',
  'docs/presentation/phase3-defense-deck.pptx'
)
$deleted | ForEach-Object { "$(Test-Path -LiteralPath $_)`t$_" }
git status --short -- $deleted
```

Expected: `False` cho cả bốn path và Git hiển thị `D` cho cả bốn.

- [ ] **Step 2: Giữ câu bàn giao hiện hành đúng với quyết định xóa**

Trong `docs/release/final-submission-checklist-2026-07-20.md`, giữ ý nghĩa:

```markdown
| Tài liệu hỗ trợ thuyết trình | KHÔNG ÁP DỤNG | Các tệp DOCX/PPTX đã được xóa theo yêu cầu; nội dung dự án được giữ trong bộ tài liệu Markdown đã Việt hóa. |
```

Trong `docs/release/phase3-final-report.md`, giữ ý nghĩa:

```markdown
- Các tệp DOCX/PPTX hỗ trợ thuyết trình đã được xóa theo yêu cầu; dùng bộ tài liệu Markdown đã Việt hóa khi cần tra cứu.
```

Không sửa các câu lịch sử theo hướng phủ nhận buổi demo, rehearsal hoặc review đã diễn ra.

- [ ] **Step 3: Quét mọi tham chiếu chính xác tới file đã xóa**

Run:

```powershell
rg -n -F -e "briefing-thuyet-trinh-du-an-vi.docx" -e "04_context_diagram.drawio (2).png" -e "phase3-defense-deck-source.md" -e "phase3-defense-deck.pptx" . --glob '!node_modules/**' --glob '!frontend/node_modules/**' --glob '!backend/node_modules/**' --glob '!docs/superpowers/specs/2026-08-03-vietnamese-documentation-reconciliation-design.md' --glob '!docs/superpowers/plans/2026-08-03-vietnamese-documentation-reconciliation.md'
```

Expected: chỉ còn các ghi chú lịch sử trong ba plan ngày 2026-07-13/14 nói file DOCX từng là untracked và được bảo toàn. Không còn link hoặc tuyên bố hiện hành rằng bốn artifact có thể tải/mở từ repository.

- [ ] **Step 4: Stage đúng sáu path và commit**

Run:

```powershell
git diff --check -- docs/release/final-submission-checklist-2026-07-20.md docs/release/phase3-final-report.md
git add -- docs/briefing-thuyet-trinh-du-an-vi.docx "docs/phase_1_foundation/04_context_diagram.drawio (2).png" docs/presentation/phase3-defense-deck-source.md docs/presentation/phase3-defense-deck.pptx docs/release/final-submission-checklist-2026-07-20.md docs/release/phase3-final-report.md
git diff --cached --name-status
git commit -m "docs: remove obsolete presentation artifacts"
```

Expected: bốn `D` và hai `M`; không có path khác trong index.

---

### Task 5: Đối soát tài liệu release, testing, performance và security còn lại

**Files:**
- Modify: `docs/performance/phase3-performance-report-2026-07-19.md`
- Modify: `docs/release/phase3-rehearsal-record.md`
- Modify: `docs/release/phase3-staging-evidence-2026-07-19.md`
- Modify: `docs/release/phase3-user-testing-record-2026-07-19.md`
- Modify: `docs/release/week13-acceptance-record.md`
- Modify: `docs/security/react-router-rsc-audit-exception-2026-07-25.md`
- Modify: `docs/testing/master-test-plan.md`
- Modify: `docs/testing/system-integration-demo-runbook.md`

**Interfaces:**
- Consumes: commit SHA, PR/run number, test count, role, date và historical evidence đã được ghi nhận.
- Produces: prose tiếng Việt dễ đọc mà không viết lại hoặc phóng đại bằng chứng lịch sử.

- [ ] **Step 1: Quét evidence anchors và số liệu**

Run:

```powershell
rg -n "[0-9a-f]{7,40}|PR #[0-9]+|run [0-9]{8,}|[0-9]+/[0-9]+|FE0[1-9]|FE1[0-2]|MEMBER|LIBRARIAN|ADMIN|PASS|FAIL" docs/performance/phase3-performance-report-2026-07-19.md docs/release/phase3-rehearsal-record.md docs/release/phase3-staging-evidence-2026-07-19.md docs/release/phase3-user-testing-record-2026-07-19.md docs/release/week13-acceptance-record.md docs/security/react-router-rsc-audit-exception-2026-07-25.md docs/testing/master-test-plan.md docs/testing/system-integration-demo-runbook.md
```

So sánh mọi anchor đã thay đổi với `git show "HEAD:$path"`, trong đó `$path` là file đang review. Chỉ
sửa cách diễn đạt; không đổi kết quả, ngày, actor, commit, PR, CI run hoặc số lượng test nếu không có
evidence mới trong repository.

- [ ] **Step 2: Sửa lỗi dịch máy có nghĩa sai**

Sửa các mẫu như `Azureh`, `Á hậu được lưu trữ`, `cam kết` khi nghĩa gốc là Git commit, `Hành động GitHub` khi là GitHub Actions, và tên kỹ thuật bị dịch. Không đổi những từ tiếng Việt tự nhiên chỉ vì chúng trùng danh sách quét.

- [ ] **Step 3: Chạy gates và commit**

Run:

```powershell
npm run test:deployment
npm run test:secrets
npm run trace:enforce
git diff --check -- docs/performance docs/release docs/security docs/testing
git add -- docs/performance/phase3-performance-report-2026-07-19.md docs/release/phase3-rehearsal-record.md docs/release/phase3-staging-evidence-2026-07-19.md docs/release/phase3-user-testing-record-2026-07-19.md docs/release/week13-acceptance-record.md docs/security/react-router-rsc-audit-exception-2026-07-25.md docs/testing/master-test-plan.md docs/testing/system-integration-demo-runbook.md
git diff --cached --name-status
git commit -m "docs: reconcile Vietnamese delivery evidence"
```

Expected: deployment `20/20`, secret and traceability gates exit `0`, staged paths đúng tám file.

---

### Task 6: Review các plan/design lịch sử mà không viết lại sự kiện

**Files:**
- Modify: tracked files currently changed under `docs/superpowers/plans/`
- Modify: tracked files currently changed under `docs/superpowers/specs/`, ngoại trừ design đã commit `docs/superpowers/specs/2026-08-03-vietnamese-documentation-reconciliation-design.md`
- Exclude: `docs/superpowers/plans/2026-08-02-pr95-release-closeout.md`
- Exclude: `docs/superpowers/plans/2026-08-02-worktree-and-react-router-hygiene.md`
- Exclude: `docs/superpowers/plans/2026-08-03-vietnamese-documentation-reconciliation.md`

**Interfaces:**
- Consumes: các historical plans/designs đã tracked và version tiếng Anh tại `HEAD`.
- Produces: bản dịch lịch sử không đổi scope, authority gate, task state, commit/PR/run evidence hoặc outcome.

- [ ] **Step 1: Tạo manifest chính xác chỉ từ tracked modified files**

Run:

```powershell
$historicalPaths = @(git diff --name-only --diff-filter=M -- docs/superpowers/plans docs/superpowers/specs) | Where-Object {
  $_ -ne 'docs/superpowers/plans/2026-08-03-vietnamese-documentation-reconciliation.md' -and
  $_ -ne 'docs/superpowers/specs/2026-08-03-vietnamese-documentation-reconciliation-design.md'
}
$historicalPaths.Count
$historicalPaths
```

Expected: manifest chỉ chứa tracked modified historical Markdown; không chứa ba file untracked/excluded và không chứa script/cache.

- [ ] **Step 2: Quét toàn bộ manifest theo nhóm lỗi**

Run:

```powershell
rg -n "Azureh|Á hậu|Hành động GitHub|cam kết [0-9a-f]{7,40}" $historicalPaths
rg -n "H1|H2|H3|B7|COMPLETE|APPROVED|NOT STARTED|PR #[0-9]+|[0-9a-f]{7,40}|run [0-9]{8,}" $historicalPaths
```

Expected: không có placeholder mới; mọi authority/status/evidence anchor giữ nguyên giá trị so với `HEAD`.

- [ ] **Step 3: Review từng diff theo file**

Run:

```powershell
foreach ($path in $historicalPaths) {
  git diff --word-diff=plain -- $path
}
```

Với mỗi file, sửa các lỗi dịch máy nhưng giữ nguyên sự kiện lịch sử. Các câu về artifact từng tồn tại được giữ; chỉ thêm ghi chú “không còn được lưu trong repository” nếu câu đó đồng thời là chỉ dẫn truy cập hiện tại.

- [ ] **Step 4: Chạy semantic/traceability checks và commit manifest**

Run:

```powershell
node --test scripts/fe07-fe12-vietnamese-semantics.test.js
npm run trace:enforce
git diff --check -- $historicalPaths
git add -- $historicalPaths
git diff --cached --name-status
git commit -m "docs: reconcile Vietnamese historical plans"
```

Expected: tests exit `0`; cached paths khớp chính xác `$historicalPaths` và không có untracked file.

---

### Task 7: Xác thực toàn bộ batch và tích hợp trên worktree sạch

**Files:**
- Verify: toàn bộ commit của batch kể từ `origin/main`
- Create worktree branch: `docs/vietnamese-documentation-reconciliation-pr`

**Interfaces:**
- Consumes: design commit `2e34374fffe6e98250fa396966b65ff42dc772fb` và các commit Task 1-6 đã review.
- Produces: nhánh tích hợp sạch, đầy đủ gate evidence và sẵn sàng để push/mở PR sau review.

- [ ] **Step 1: Dùng skill worktree trước khi tạo worktree tích hợp**

Invoke `using-git-worktrees`, sau đó fetch `origin` và xác nhận nhánh đích chưa tồn tại:

```powershell
git fetch origin --prune
git branch --list docs/vietnamese-documentation-reconciliation-pr
git ls-remote --heads origin docs/vietnamese-documentation-reconciliation-pr
```

Expected: không có local/remote branch trùng tên. Nếu đã tồn tại, dừng và kiểm tra thay vì xóa hoặc ghi đè.

- [ ] **Step 2: Tạo worktree sạch từ `origin/main`**

Run bằng path worktree do skill chọn:

```powershell
$integrationWorktree = 'D:\SWP391\library-management-system-vietnamese-docs-pr'
git worktree add -b docs/vietnamese-documentation-reconciliation-pr $integrationWorktree origin/main
```

Expected: branch name không chứa `codex`; `git -C $integrationWorktree status --short` không có output.

- [ ] **Step 3: Áp dụng đúng các commit đã review**

Lấy danh sách SHA theo thứ tự từ checkout nguồn:

```powershell
$batchCommits = @(git rev-list --reverse 2e34374fffe6e98250fa396966b65ff42dc772fb^..docs/vietnamese-documentation-reconciliation)
git show --no-patch --format="%H %s" $batchCommits
```

Cherry-pick design commit và các commit Task 1-6 đã review; không cherry-pick commit ngoài batch:

```powershell
git -C $integrationWorktree cherry-pick $batchCommits
```

Expected: cherry-pick hoàn tất không conflict; diff chỉ có tài liệu và bốn deletion đã phê duyệt.

- [ ] **Step 4: Kiểm tra phạm vi và file bị loại**

Run:

```powershell
git -C $integrationWorktree diff --name-status origin/main...HEAD
git -C $integrationWorktree diff --name-only origin/main...HEAD | rg "^(backend|frontend/src|database|\.github/workflows|scripts/translate_docs_to_vi\.py|.*__pycache__|.*\.pyc$)"
```

Expected: command đầu liệt kê đúng batch tài liệu; command `rg` thứ hai không có output.

- [ ] **Step 5: Chạy toàn bộ verification gates trong worktree sạch**

Run:

```powershell
npm run test:deployment
npm run test:secrets
npm run trace:enforce
node --test scripts/fe07-fe12-vietnamese-semantics.test.js
node --test scripts/vietnamese-documentation-semantics.test.js
npm --prefix frontend test
npm --prefix frontend run lint
npm --prefix frontend run build
npm --prefix backend test -- --silent
git diff --check origin/main...HEAD
```

Expected:

```text
deployment: 20/20 pass
secrets: exit 0
traceability: exit 0 and threshold >= 70
Vietnamese semantics: exit 0
frontend test: exit 0
frontend lint: exit 0
frontend build: exit 0
backend Jest: exit 0
git diff --check: no output
```

- [ ] **Step 6: Chạy deletion/reference audit cuối**

Run:

```powershell
$deleted = @(
  'docs/briefing-thuyet-trinh-du-an-vi.docx',
  'docs/phase_1_foundation/04_context_diagram.drawio (2).png',
  'docs/presentation/phase3-defense-deck-source.md',
  'docs/presentation/phase3-defense-deck.pptx'
)
$integrationWorktree = 'D:\SWP391\library-management-system-vietnamese-docs-pr'
$deleted | ForEach-Object { "$(Test-Path -LiteralPath (Join-Path $integrationWorktree $_))`t$_" }
rg -n -F -e "briefing-thuyet-trinh-du-an-vi.docx" -e "04_context_diagram.drawio (2).png" -e "phase3-defense-deck-source.md" -e "phase3-defense-deck.pptx" $integrationWorktree --glob '!node_modules/**' --glob '!frontend/node_modules/**' --glob '!backend/node_modules/**' --glob '!docs/superpowers/specs/2026-08-03-vietnamese-documentation-reconciliation-design.md' --glob '!docs/superpowers/plans/2026-08-03-vietnamese-documentation-reconciliation.md'
```

Expected: cả bốn `False`; chỉ còn historical references đã được phân loại, không có link hiện hành bị hỏng.

- [ ] **Step 7: Review trạng thái cuối trước khi công bố**

Run:

```powershell
git -C $integrationWorktree status --short --branch
git -C $integrationWorktree log --oneline --decorate origin/main..HEAD
git -C $integrationWorktree diff --stat origin/main...HEAD
```

Expected: working tree sạch, branch `docs/vietnamese-documentation-reconciliation-pr`, commit list chỉ thuộc batch này. Chỉ push và mở PR khi review cuối không phát hiện scope drift.

---

## Self-Review Record

- Spec coverage: Tasks 1-7 bao phủ technical anchors, SDD/API/architecture, artifact deletion, release evidence, historical plans/designs, full verification và clean-worktree integration.
- Unresolved-content scan: không còn bước cần người thực thi tự điền nội dung hoặc tự chọn path/branch/commit strategy.
- Consistency: branch tích hợp thống nhất là `docs/vietnamese-documentation-reconciliation-pr`; bốn deleted paths và 10 deployment anchors thống nhất với design.
- Publication boundary: plan không cho phép stage `scripts/translate_docs_to_vi.py`, Python cache hoặc hai untracked plan ngoài batch.
