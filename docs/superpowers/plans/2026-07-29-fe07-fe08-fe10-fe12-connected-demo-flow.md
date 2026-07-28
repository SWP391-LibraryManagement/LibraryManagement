# FE07/FE08/FE10/FE12 Connected Demo Flow Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `executing-plans` to implement
> this plan task-by-task. Do not dispatch subagents unless the user explicitly
> requests delegation. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Xây dựng một luồng demo web desktop liên hoàn từ yêu cầu mượn, đặt chỗ,
thông báo đến tổng quan vận hành mà không thay đổi giới hạn nghiệp vụ hiện hành,
không thêm bảng dữ liệu và không tự động xử lý hàng đợi.

**Architecture:** FE07 và FE08 tiếp tục sở hữu transaction nguồn; FE10 nhận các
yêu cầu thông báo lũy đẳng sau commit và ánh xạ action path ở backend; FE12 đọc
một snapshot tổng hợp trực tiếp từ SQL Server. Frontend chỉ trình bày trạng thái
chuẩn, hiển thị handoff thủ công và không tự tính KPI từ danh sách phân trang.

**Tech Stack:** Node.js 22, Express 5, SQL Server/Azure SQL, Jest 30, React 19,
React Router 7, Bootstrap/CSS hiện hữu, Node test runner, Playwright Chromium.

## Global Constraints

- Batch ID: `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.
- Desktop acceptance viewport: `1440x900`.
- Business timezone: `Asia/Ho_Chi_Minh`.
- Borrow limit: tối đa `5` bản sao đang mượn.
- Daily borrow limit: `5` với FE04 `APPROVED`, `3` với tài khoản `MEMBER` hoạt
  động khác.
- Loan duration: `14` ngày theo lịch; renewal limit: `1`.
- Open reservation limit: `3`; pickup hold: `2` ngày; queue order: FIFO.
- Mỗi tài khoản lưu trữ có đúng một vai trò.
- Không thêm bảng, kênh thông báo, scheduler, WebSocket, SSE, push hoặc SMS.
- Không tự động xử lý FE08 khi FE07 trả sách; Librarian phải xác nhận.
- FE10 failure không rollback transaction FE07/FE08.
- FE12 chỉ đọc và không hiển thị KPI thiếu/lỗi thành số `0`.
- FE12 chỉ tính bản sao khả dụng hiệu lực khi `Books.Status = 'ACTIVE'` và
  `BookCopies.Status = 'AVAILABLE'`; sách không hoạt động không được tính vào
  `availableCopies` hoặc `lowStockBooks`.
- Không nhận action URL từ caller; backend chỉ trả fixed relative allowlist.
- Không đưa lý do từ chối, email, token, OTP, stack hoặc provider detail vào
  notification payload/inbox.
- Product code của batch phải để uncommitted đến khi H2 duyệt toàn bộ diff cùng
  L1-L4 evidence. Chỉ governance activation diff được commit sau H1.
- Không stage hoặc sửa các thay đổi cục bộ có trước batch nếu chúng không nằm
  trong danh sách file của task hiện tại.

---

## File Structure

### Governance

- Modify: `.sdd/specs/feat-borrowing-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Modify: `.sdd/specs/feat-reservation-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Modify: `.sdd/specs/feat-notification-management/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Modify: `.sdd/specs/feat-reporting-statistics/{SPEC,CONTEXT,PLAN,TASKS,TEST_PLAN,CHANGELOG}.md`
- Modify: `docs/architecture/feature-integration-map.md`
- Modify: `docs/api/api-contract.md`
- Modify: `docs/testing/master-test-plan.md`

### FE10 notification contract

- Create: `database/migrations/2026-07-29-fe10-borrowing-result-templates.sql`
- Modify: `database/Librarymanagement.sql`
- Modify: `backend/src/services/notificationService.js`
- Modify: `backend/src/utils/notificationInbox.js`
- Modify: `backend/src/repositories/notificationRepository.js`
- Modify: `backend/tests/helpers/inMemoryNotificationRepositories.js`
- Test: `backend/tests/notificationRoutes.test.js`
- Test: `backend/tests/notificationRepository.test.js`
- Test: `backend/tests/notificationInboxRepository.test.js`
- Test: `backend/tests/notificationInboxMigration.test.js`
- Test: `frontend/test/notificationInboxFrontend.test.js`

### FE07 borrowing journey and handoff

- Modify: `backend/src/services/borrowingService.js`
- Modify: `backend/src/repositories/borrowingRepository.js`
- Test: `backend/tests/borrowingRoutes.test.js`
- Test: `backend/tests/borrowingRepository.test.js`
- Create: `frontend/src/component/borrowing/BorrowingJourneyTimeline.jsx`
- Create: `frontend/src/utils/borrowingJourney.js`
- Modify: `frontend/src/utils/libraryFeatureViewModels.js`
- Modify: `frontend/src/page/borrowing/BorrowingHistoryPage.jsx`
- Modify: `frontend/src/page/borrowing/ProcessReturnsPage.jsx`
- Modify: `frontend/src/api/apiErrorMessages.js`
- Modify: `frontend/src/styles/app-shell.css`
- Create: `frontend/test/borrowingJourneyFrontend.test.js`
- Test: `frontend/test/borrowingFrontend.test.js`
- Test: `frontend/test/apiErrorMessages.test.js`

### FE08 truthful queue surface

- Modify: `backend/src/services/reservationService.js`
- Test: `backend/tests/reservationService.test.js`
- Test: `backend/tests/reservationRoutes.test.js`
- Modify: `frontend/src/page/reservation/ReservationsLibrarianPage.jsx`
- Modify: `frontend/src/utils/notificationFeedback.js`
- Test: `frontend/test/reservationFrontend.test.js`

### FE12 operations summary

- Modify: `backend/src/repositories/reportRepository.js`
- Modify: `backend/src/services/reportService.js`
- Modify: `backend/src/controllers/reportController.js`
- Modify: `backend/src/routes/reportRoutes.js`
- Modify: `backend/src/validators/reportValidators.js`
- Modify: `backend/tests/helpers/inMemoryReportRepositories.js`
- Modify: `backend/tests/helpers/systemIntegrationHarness.js`
- Test: `backend/tests/reportRepository.test.js`
- Test: `backend/tests/reportService.test.js`
- Test: `backend/tests/reportRoutes.test.js`
- Test: `backend/tests/reportContract.test.js`
- Modify: `frontend/src/api/libraryFeatureApi.js`
- Modify: `frontend/src/page/dashboard/dashboardViewModel.js`
- Modify: `frontend/src/page/dashboard/RoleDashboardPage.jsx`
- Test: `frontend/test/appShellFrontend.test.js`
- Test: `frontend/test/reportOperationalFrontend.test.js`

### Cross-feature evidence

- Modify serially during product tasks: `backend/src/docs/openapi.yaml`.
- Modify: `backend/tests/systemIntegration.test.js`
- Modify: `tests/e2e/support/systemTestServer.js`
- Create: `tests/e2e/fe07-fe12-connected-demo-flow.spec.js`
- Modify: `docs/user-manual.md`
- Modify: `docs/testing/system-integration-demo-runbook.md`
- Modify: the four feature `TEST_PLAN.md`, `TASKS.md`, and `CHANGELOG.md` files
  listed under Governance with exact evidence after execution.

---

### Task 1: Activate the approved design in SDD and obtain H1

**Files:**

- Modify: all Governance files listed above.
- Modify: `docs/superpowers/specs/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow-design.md`

**Interfaces:**

- Consumes: approved written design revision published in PR #80 on branch
  `codex/impl-fe07-fe12-connected-demo-flow`.
- Produces: approved versions FE07 `0.9.0`, FE08 `0.6.0`, FE10 `0.6.0`,
  FE12 `0.3.0`; batch contract
  `BATCH-FE07-FE12-CONNECTED-DEMO-2026-07-29`.

- [x] **Step 1: Allocate stable requirement IDs and write the SPEC fan-out**

  Add these exact IDs and definitions:

  ```text
  FE07
  BR-FE07-035 post-commit borrowing-result notification is idempotent and non-blocking
  BR-FE07-036 return response may expose only a read-only manual FE08 handoff
  BR-FE07-037 journey timeline uses canonical states/timestamps only
  FR-FE07-040 request approved/rejected notifications
  FR-FE07-041 renewed/returned notifications
  FR-FE07-042 reservationQueueAction return DTO
  FR-FE07-043 member journey timeline
  FR-FE07-044 stale/blocker guidance
  AC-FE07-033..036 map to AT-002, AT-003, AT-004, AT-009

  FE08
  BR-FE08-021 only the owner of a NOTIFIED hold sees the held-copy borrow CTA
  BR-FE08-022 notification failure is shown truthfully without rolling back hold
  FR-FE08-036 held-copy CTA and exact copy handoff
  FR-FE08-037 staff decision surface and manual processing
  FR-FE08-038 notification warning DTO
  FR-FE08-039 stale 409 refresh
  AC-FE08-023..025 map to AT-005, AT-007, AT-008/AT-009

  FE10
  BR-FE10-021 GENERAL_SYSTEM ownership is checked per template, not per type only
  BR-FE10-022 borrowing-result inbox rows map only to /borrowing/history
  BR-FE10-023 borrowing-result payloads contain no rejection reason or sensitive data
  FR-FE10-017 accept four FE07 GENERAL_SYSTEM templates
  FR-FE10-018 persist/replay each source key once
  FR-FE10-019 include four templates in personal inbox eligibility
  FR-FE10-020 return fixed borrowing action path
  AC-FE10-017..020 map to AT-002, AT-003, AT-006, AT-009

  FE12
  BR-FE12-017 operations summary is one authorized read-only snapshot
  BR-FE12-018 six KPI definitions match canonical source states
  BR-FE12-019 missing/failed KPI is never rendered as zero
  BR-FE12-020 every overdue projection uses one service-owned business date
  FR-FE12-012 GET /api/reports/operations-summary
  FR-FE12-013 staff role enforcement and empty query allowlist
  FR-FE12-014 deterministic KPI projection, generatedAt and injected business date
  FR-FE12-015 fixed dashboard drill-down
  AC-FE12-012..016 map to AT-010..AT-013 and KPI failure behavior
  ```

- [x] **Step 2: Synchronize CONTEXT, CHANGELOG, integration map and API contract**

  Record the exact endpoint and response in SDD and `docs/api/api-contract.md`.
  Do not publish the new path in runtime OpenAPI until Task 6 implements the
  matching route; the FE07 return schema is added to OpenAPI with Task 3.

  ```yaml
  /api/reports/operations-summary:
    get:
      security: [{ bearerAuth: [] }]
      parameters: []
      responses:
        '200':
          content:
            application/json:
              schema:
                type: object
                required:
                  - pendingBorrowRequests
                  - activeLoans
                  - overdueLoans
                  - openReservations
                  - availableCopies
                  - lowStockBooks
                  - generatedAt
  ```

  Record the additive FE07 return member:

  ```json
  {
    "reservationQueueAction": {
      "copyId": 123,
      "hasActiveQueue": true,
      "actionPath": "/librarian/reservations"
    }
  }
  ```

- [x] **Step 3: Write PLAN/TASKS boundaries and H1 contract**

  Use these slices and ownership:

  ```text
  SL-001 governance activation
  SL-002 FE10 contract and templates
  SL-003 FE07 source events, timeline and return handoff
  SL-004 FE08 truthful queue/pickup UI
  SL-005 FE12 operations summary
  SL-006 cross-feature browser and Azure staging evidence
  ```

  Set a single Core builder lane. Other lanes remain read-only unless the user
  explicitly requests delegation.

- [x] **Step 4: Run governance validation**

  Run:

  ```powershell
  npm run trace:enforce
  npm run test:traceability-state
  git diff --check
  ```

  Expected: both trace commands exit `0`; diff check is empty; manual document
  review finds no unresolved requirement content.

- [x] **Step 5: Stop for human H1 review**

  H1 and its reviewed addendum were approved by Nhat on 2026-07-29. Product
  work remains blocked until this activation PR merges.

- [x] **Step 6: Commit and publish only the H1-reviewed governance activation**

  After H1:

  ```powershell
  git add -- .sdd/specs/feat-borrowing-management .sdd/specs/feat-reservation-management .sdd/specs/feat-notification-management .sdd/specs/feat-reporting-statistics docs/architecture/feature-integration-map.md docs/api/api-contract.md docs/testing/master-test-plan.md docs/superpowers/specs/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow-design.md docs/superpowers/plans/2026-07-29-fe07-fe08-fe10-fe12-connected-demo-flow.md
  git diff --cached --check
  git commit -m "docs: activate connected circulation demo batch"
  ```

  Governance-only PR #80 was published. H3 remediation removes the unauthorized
  test-only commit, corrects source-of-truth drift and requires a reviewed H1
  drift addendum before its replacement commit is pushed.

---

### Task 2: Extend FE10 with FE07-owned borrowing-result templates

**Files:**

- Create/Modify/Test: FE10 files listed in File Structure.

**Interfaces:**

- Consumes:
  `notificationService.createSourceNotificationRequester('FE07')`.
- Produces:

  ```js
  GENERAL_SYSTEM_TEMPLATES = new Set([
    'MEMBERSHIP_RESULT',
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ]);
  ```

  Each new FE07-owned row returns `actionPath: '/borrowing/history'`.

- [ ] **Step 1: Write failing canonical-pair and source-ownership tests**

  Add table-driven cases to `backend/tests/notificationRoutes.test.js`:

  ```js
  test.each([
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ])('accepts FE07 GENERAL_SYSTEM template %s exactly once', async (templateKey) => {
    const requester = notificationService.createSourceNotificationRequester('FE07');
    const payload = {
      type: 'GENERAL_SYSTEM',
      templateKey,
      userId: member.userId,
      sourceEntityType: 'BorrowRequest',
      sourceEntityId: 91,
      idempotencyKey: `FE07:${templateKey}:91`,
      templateData: templateDataFor(templateKey),
    };
    const first = await requester.createNotificationRequest(payload);
    const replay = await requester.createNotificationRequest(payload);
    expect(replay.notificationId).toBe(first.notificationId);
  });
  ```

  Add negative cases proving FE04 cannot send the four FE07 templates, FE07
  cannot send `MEMBERSHIP_RESULT`, and public HTTP cannot provide a bound
  `GENERAL_SYSTEM` source.

- [ ] **Step 2: Run RED FE10 tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js tests/notificationInboxRepository.test.js
  ```

  Expected: FAIL because new templates are not canonical/seeded/eligible.

- [ ] **Step 3: Implement per-template canonical ownership**

  Refactor the FE10 constants to preserve exact ownership:

  ```js
  const canonicalTemplateKeys = {
    ACCOUNT_VERIFICATION: new Set(['ACCOUNT_VERIFICATION']),
    PASSWORD_RESET: new Set(['PASSWORD_RESET']),
    ACCOUNT_SETUP: new Set(['ACCOUNT_SETUP']),
    RESERVATION_AVAILABLE: new Set(['RESERVATION_READY']),
    DUE_DATE_REMINDER: new Set(['DUE_DATE_REMINDER']),
    OVERDUE_NOTICE: new Set(['OVERDUE_NOTICE']),
    FINE_NOTICE: new Set(['FINE_NOTICE']),
    GENERAL_SYSTEM: new Set([
      'MEMBERSHIP_RESULT',
      'BORROW_REQUEST_APPROVED',
      'BORROW_REQUEST_REJECTED',
      'BORROW_RENEWED',
      'BORROW_RETURNED',
    ]),
  };

  const generalSystemTemplateOwners = {
    MEMBERSHIP_RESULT: 'FE04',
    BORROW_REQUEST_APPROVED: 'FE07',
    BORROW_REQUEST_REJECTED: 'FE07',
    BORROW_RENEWED: 'FE07',
    BORROW_RETURNED: 'FE07',
  };
  ```

  Replace scalar equality with:

  ```js
  if (!canonicalTemplateKeys[type]?.has(templateKey)) {
    throw errors.badRequest(
      'CANONICAL_TEMPLATE_MISMATCH',
      'Notification type and template key do not match.'
    );
  }

  if (type === 'GENERAL_SYSTEM') {
    const owner = generalSystemTemplateOwners[templateKey];
    if (!isInternal || effectiveSourceFeature !== owner) {
      throw errors.forbidden(
        'NOTIFICATION_SOURCE_OWNER_MISMATCH',
        'Notification template is not owned by this source.'
      );
    }
  }
  ```

- [ ] **Step 4: Add inbox eligibility and fixed action mappings**

  Add four `ACTION_MAPPINGS` entries:

  ```js
  ...[
    'BORROW_REQUEST_APPROVED',
    'BORROW_REQUEST_REJECTED',
    'BORROW_RENEWED',
    'BORROW_RETURNED',
  ].map((templateKey) => ({
    type: 'GENERAL_SYSTEM',
    templateKey,
    sourceFeatures: ['FE07'],
    actionPath: '/borrowing/history',
  }))
  ```

  Add the same exact pairs to `INBOX_ELIGIBILITY_SQL` and the in-memory
  `inboxTypeTemplatePairs`.

- [ ] **Step 5: Add idempotent Azure SQL template migration and base seed**

  The migration must upsert these exact definitions:

  ```sql
  VALUES
    ('BORROW_REQUEST_APPROVED', N'Yêu cầu mượn đã được duyệt',
      N'Yêu cầu mượn #{{requestId}} đã được duyệt. Hạn trả: {{dueDate}}.'),
    ('BORROW_REQUEST_REJECTED', N'Yêu cầu mượn đã bị từ chối',
      N'Yêu cầu mượn #{{requestId}} đã bị từ chối.'),
    ('BORROW_RENEWED', N'Khoản mượn đã được gia hạn',
      N'Khoản mượn #{{borrowDetailId}} đã được gia hạn đến {{dueDate}}.'),
    ('BORROW_RETURNED', N'Đã ghi nhận trả sách',
      N'Khoản mượn #{{borrowDetailId}} đã được ghi nhận trả với trạng thái {{returnStatus}}.');
  ```

  Use one transaction, `SET XACT_ABORT ON`, and update-or-insert per
  `TemplateCode`. Add the same rows to `database/Librarymanagement.sql`.

- [ ] **Step 6: Run GREEN FE10 and migration tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/notificationRoutes.test.js tests/notificationRepository.test.js tests/notificationInboxRepository.test.js tests/notificationInboxMigration.test.js
  node --test --test-name-pattern="notification" frontend/test/*.test.js
  git diff --check
  ```

  Expected: focused FE10 backend/frontend tests pass; migration replay assertions
  pass; diff check is empty.

- [ ] **Step 7: Record the slice checkpoint without committing product code**

  Save RED/GREEN commands and output in FE10 `TEST_PLAN.md`/`TASKS.md`.
  Leave product changes uncommitted for H2.

---

### Task 3: Emit FE07 result notifications and authoritative return handoff

**Files:**

- Modify/Test: FE07 backend files listed in File Structure.

**Interfaces:**

- Consumes: Task 2 FE10 template contract.
- Produces:

  ```js
  {
    borrowRequest,
    notificationWarning?: { code, message }
  }

  {
    borrowDetail,
    fineCandidate,
    reservationQueueAction: {
      copyId: number,
      hasActiveQueue: boolean,
      actionPath: '/librarian/reservations'
    },
    notificationWarning?: { code, message }
  }
  ```

- [ ] **Step 1: Write failing service/route tests for all four source events**

  Capture requester calls and assert:

  ```js
  expect(notificationRequests).toContainEqual(expect.objectContaining({
    type: 'GENERAL_SYSTEM',
    templateKey: 'BORROW_REQUEST_APPROVED',
    sourceEntityType: 'BorrowRequest',
    sourceEntityId: requestId,
    idempotencyKey: `FE07:BORROW_REQUEST_APPROVED:${requestId}`,
  }));
  ```

  Repeat for rejected, renewed and returned. Assert rejected payload does not
  include `reason`; make requester throw and prove committed source status is
  preserved while response contains a safe `notificationWarning`.

- [ ] **Step 2: Write failing repository test for locked queue evidence**

  Assert the return transaction reads `Reservations` under
  `UPDLOCK, HOLDLOCK`, and maps only `Status = 'ACTIVE'` to
  `authoritativeReturn.hasActiveQueue`.

- [ ] **Step 3: Run RED FE07 backend tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js
  ```

  Expected: FAIL on missing FE07 result requests and missing
  `reservationQueueAction`.

- [ ] **Step 4: Implement one safe post-commit requester helper**

  Add:

  ```js
  async function requestBorrowingResultNotification({
    templateKey,
    userId,
    recipientEmail,
    sourceEntityType,
    sourceEntityId,
    idempotencyKey,
    templateData,
  }) {
    try {
      await notificationRequester.createNotificationRequest({
        type: 'GENERAL_SYSTEM',
        channel: 'EMAIL',
        templateKey,
        userId,
        recipientEmail,
        sourceEntityType,
        sourceEntityId,
        idempotencyKey,
        templateData,
      });
      return null;
    } catch {
      return {
        code: 'BORROW_NOTIFICATION_REQUEST_FAILED',
        message: 'Nghiệp vụ đã hoàn tất nhưng thông báo chưa được tạo.',
      };
    }
  }
  ```

  Invoke it only after repository mutation resolves successfully.

- [ ] **Step 5: Preserve queue evidence inside the return transaction**

  Replace the discarded reservation lock query with:

  ```js
  const reservationQueueResult = await new sql.Request(transaction)
    .input('CopyId', sql.Int, lockedDetail.CopyId)
    .query(`
      SELECT ReservationId, Status
      FROM Reservations WITH (UPDLOCK, HOLDLOCK)
      WHERE CopyId = @CopyId
        AND Status IN ('ACTIVE', 'NOTIFIED');
    `);

  authoritativeReturn.hasActiveQueue = reservationQueueResult.recordset
    .some((row) => row.Status === 'ACTIVE');
  ```

  Project the service response with a server-owned path:

  ```js
  reservationQueueAction: {
    copyId: authoritativeReturn.copyId,
    hasActiveQueue: Boolean(authoritativeReturn.hasActiveQueue),
    actionPath: '/librarian/reservations',
  }
  ```

- [ ] **Step 6: Run GREEN FE07 backend tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/borrowingRoutes.test.js tests/borrowingRepository.test.js tests/notificationRoutes.test.js
  git diff --check
  ```

  Expected: all focused suites pass; mutation success survives notification
  failure; no rejection reason appears in persisted/request payload.

- [ ] **Step 7: Record the slice checkpoint without committing product code**

  Update FE07 `TEST_PLAN.md`/`TASKS.md` evidence and leave code uncommitted.

---

### Task 4: Add FE07 desktop journey timeline and return-to-queue handoff

**Files:**

- Create/Modify/Test: FE07 frontend files listed in File Structure.

**Interfaces:**

- Consumes: Task 3 response DTOs.
- Produces:

  ```js
  buildBorrowingJourney(row) -> Array<{
    key: string,
    label: string,
    state: 'complete' | 'current' | 'pending',
    at: string | null
  }>
  ```

- [ ] **Step 1: Write failing pure-view-model tests**

  Add cases:

  ```js
  assert.deepEqual(
    buildBorrowingJourney({
      requestStatus: 'REJECTED',
      rawStatus: 'REQUESTED',
      requestDate: '2026-07-29T01:00:00Z',
      processedAt: '2026-07-29T02:00:00Z',
    }).map(({ label, state }) => ({ label, state })),
    [
      { label: 'Đã gửi yêu cầu', state: 'complete' },
      { label: 'Đã từ chối', state: 'current' },
    ],
  );
  ```

  Add BORROWED and RETURNED cases and assert missing timestamps remain `null`.

- [ ] **Step 2: Run RED frontend tests**

  Run:

  ```powershell
  node --test --test-name-pattern="borrowing journey|return queue handoff" frontend/test/*.test.js
  ```

  Expected: FAIL because the journey helper/component and handoff UI do not exist.

- [ ] **Step 3: Implement canonical row projection and timeline component**

  Preserve these raw members in `mapBorrowDetailsToHistoryRows`:

  ```js
  rawStatus: String(detail.status || '').toUpperCase(),
  requestStatus: String(detail.requestStatus || '').toUpperCase(),
  requestDate: detail.requestDate || detail.createdAt || null,
  approvedAt: detail.approvedAt || null,
  processedAt: detail.processedAt || null,
  createdAt: detail.createdAt || null,
  updatedAt: detail.updatedAt || null,
  ```

  Render an ordered list with `aria-label={`Hành trình ${row.title}`}`. Do not
  synthesize timestamps or infer a completed step from client time.

- [ ] **Step 4: Implement return handoff and truthful notification warning**

  In `ProcessReturnsPage`:

  ```js
  const navigate = useNavigate();
  const [queueHandoff, setQueueHandoff] = useState(null);

  const handoff = result.reservationQueueAction;
  setQueueHandoff(handoff?.hasActiveQueue ? handoff : null);

  if (result.notificationWarning) {
    showToast(result.notificationWarning.message, 'warning');
  }
  ```

  Render a persistent post-success panel with button:

  ```jsx
  <button
    type="button"
    className="btn btn-primary"
    onClick={() => navigate(queueHandoff.actionPath, {
      state: { copyId: queueHandoff.copyId },
    })}
  >
    Xử lý hàng đợi đặt chỗ
  </button>
  ```

  Validate the server path against the fixed literal before navigation.

- [ ] **Step 5: Extend blocker copy and stale guidance**

  Add `BORROW_STATE_CONFLICT` and update FE07 conflict messages so every 409
  tells the user to reload, reject a stale request, resolve fines/overdue items,
  or process the FE08 queue as appropriate. Never display backend raw messages.

- [ ] **Step 6: Add desktop CSS**

  Use focused classes:

  ```css
  .borrow-journey { display: flex; align-items: flex-start; gap: 10px; min-width: 320px; }
  .borrow-journey__step { min-width: 0; flex: 1; }
  .return-queue-handoff { display: flex; align-items: center; justify-content: space-between; gap: 16px; }
  ```

  Do not alter notification popover width/z-index or add mobile-specific
  redesign in this batch.

- [ ] **Step 7: Run GREEN FE07 frontend tests**

  Run:

  ```powershell
  node --test --test-name-pattern="borrowing|api error" frontend/test/*.test.js
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```

  Expected: focused tests, lint and production build pass.

- [ ] **Step 8: Record the slice checkpoint without committing product code**

  Update FE07 evidence files; leave implementation uncommitted.

---

### Task 5: Make FE08 queue processing truthful under warning and stale state

**Files:**

- Modify/Test: FE08 files listed in File Structure.

**Interfaces:**

- Consumes: existing `processQueue(copyId)` and held-copy CTA.
- Produces:

  ```js
  {
    selectedReservation,
    notificationWarning?: {
      code: 'RESERVATION_NOTIFICATION_REQUEST_FAILED'
          | 'RESERVATION_NOTIFY_AUDIT_FAILED',
      message: string
    }
  }
  ```

- [ ] **Step 1: Write failing backend warning-isolation tests**

  Make the requester throw while audit succeeds and assert:

  ```js
  expect(result.selectedReservation.status).toBe('NOTIFIED');
  expect(result.notificationWarning).toEqual({
    code: 'RESERVATION_NOTIFICATION_REQUEST_FAILED',
    message: 'The reservation hold was created, but the notification request failed.',
  });
  ```

  Preserve the stronger audit-failure warning when both operations fail.

- [ ] **Step 2: Write failing frontend stale/warning tests**

  Assert `ReservationsLibrarianPage`:

  ```js
  if (result.notificationWarning) {
    showToast(result.notificationWarning.message, 'warning');
  }
  if (error?.cause?.response?.status === 409) {
    await loadReservations();
  }
  ```

  Also retain the existing CTA condition:

  ```jsx
  item.rawStatus === 'NOTIFIED' && item.bookId
  ```

  and the exact link with both `bookId` and `copyId`.

- [ ] **Step 3: Run RED FE08 tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js
  node --test --test-name-pattern="reservation" frontend/test/*.test.js
  ```

  Expected: warning test fails because request failure is currently hidden when
  audit succeeds; stale reload assertion fails.

- [ ] **Step 4: Implement enumerable safe warnings**

  Always set a request-failure warning after the hold commits. If audit also
  fails, replace it with `RESERVATION_NOTIFY_AUDIT_FAILED`. Keep the warning
  outside `selectedReservation`; expose it only at the response envelope.

- [ ] **Step 5: Implement UI warning and 409 refresh**

  After a successful hold, show success only when no warning exists. When a
  warning exists, say the hold succeeded but notification has not been created.
  On 409, reload canonical reservation data before closing the confirmation.

- [ ] **Step 6: Run GREEN FE08 tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reservationService.test.js tests/reservationRoutes.test.js
  node --test --test-name-pattern="reservation|notification feedback" frontend/test/*.test.js
  git diff --check
  ```

  Expected: focused FE08 suites pass and no notification failure rolls back a
  `NOTIFIED` hold.

- [ ] **Step 7: Record the slice checkpoint without committing product code**

  Update FE08 evidence files; leave implementation uncommitted.

---

### Task 6: Add FE12 read-only operations summary and desktop dashboard

**Files:**

- Modify/Test: FE12 files listed in File Structure.

**Interfaces:**

- Consumes: canonical SQL tables and `formatBusinessDate(clock())`.
- Produces:

  ```js
  getOperationsSummary(businessDate) -> {
    pendingBorrowRequests: number,
    activeLoans: number,
    overdueLoans: number,
    openReservations: number,
    availableCopies: number,
    lowStockBooks: number
  }
  ```

  HTTP adds `generatedAt` from the service clock.

- [ ] **Step 1: Write failing repository/service/route tests**

  Assert exact body:

  ```js
  expect(response.body).toEqual({
    pendingBorrowRequests: 1,
    activeLoans: 2,
    overdueLoans: 1,
    openReservations: 2,
    availableCopies: 3,
    lowStockBooks: 2,
    generatedAt: '2026-07-29T03:00:00.000Z',
  });
  ```

  Add role matrix for `LIBRARIAN=200`, `ADMIN=200`, `MEMBER=403`,
  unauthenticated `401`. Add `?bogus=secret` => `400` before repository call and
  prove source fixtures remain byte-for-byte unchanged. Add the baseline
  regression first: with the service clock frozen at `2026-07-14`, a due date of
  `2026-07-28` remains `BORROWED` in both SQL-contract and in-memory report
  projections even when the host date is later.

- [ ] **Step 2: Run RED FE12 backend tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportService.test.js tests/reportRoutes.test.js tests/reportContract.test.js
  ```

  Expected: FAIL because endpoint/repository/service methods do not exist.

- [ ] **Step 3: Implement the parameterized read-only SQL snapshot**

  Add one repository query using `@BusinessDate`:

  ```sql
  SELECT
    (SELECT COUNT_BIG(*) FROM BorrowRequests WHERE Status = 'PENDING')
      AS PendingBorrowRequests,
    (SELECT COUNT_BIG(*) FROM BorrowDetails WHERE Status = 'BORROWED')
      AS ActiveLoans,
    (SELECT COUNT_BIG(*) FROM BorrowDetails
      WHERE Status = 'BORROWED' AND DueDate < @BusinessDate)
      AS OverdueLoans,
    (SELECT COUNT_BIG(*) FROM Reservations
      WHERE Status IN ('ACTIVE', 'NOTIFIED'))
      AS OpenReservations,
    (SELECT COUNT_BIG(*)
      FROM BookCopies bc
      JOIN Books b ON b.BookId = bc.BookId
      WHERE b.Status = 'ACTIVE' AND bc.Status = 'AVAILABLE')
      AS AvailableCopies,
    (SELECT COUNT_BIG(*)
      FROM Books b
      WHERE b.Status = 'ACTIVE'
        AND (
        SELECT COUNT_BIG(*)
        FROM BookCopies bc
        WHERE bc.BookId = b.BookId AND bc.Status = 'AVAILABLE'
      ) BETWEEN 0 AND 2)
      AS LowStockBooks;
  ```

  Map all SQL `BIGINT` values through `Number(...)`. Do not accept raw filters.

- [ ] **Step 4: Add service/controller/route/validator**

  Service:

  ```js
  async function getOperationsSummary(actor, context = {}) {
    requireStaff(actor);
    const generatedAt = clock();
    const summary = await reportRepository.getOperationsSummary(
      formatBusinessDate(generatedAt)
    );
    await writeAudit(context, 'REPORT_OPERATIONS_SUMMARY_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('OPERATIONS_SUMMARY'),
    });
    return { ...summary, generatedAt: generatedAt.toISOString() };
  }
  ```

  Apply the same one-read clock rule to the existing borrowing report:
  `getBorrowingReport()` must compute `businessDate` in the service and pass it
  explicitly to its repository. Repository defaults based on `new Date()` are
  forbidden for overdue classification.

  Route:

  ```js
  router.get(
    '/operations-summary',
    ...staffOnly,
    operationsSummaryValidators,
    controller.operationsSummary
  );
  ```

  Validator must be exactly:

  ```js
  const operationsSummaryValidators = [
    rejectUnsupportedQueryParameters([]),
    handleValidationErrors,
  ];
  ```

- [ ] **Step 5: Implement in-memory parity**

  Extend the helper signature without breaking report-only tests:

  ```js
  function makeInMemoryReportDependencies(
    authState,
    borrowingState,
    reservationState = { reservations: [] }
  ) {
  ```

  Count from the same `borrowingState` and `reservationState` supplied by
  `systemIntegrationHarness.js`. Do not clone then mutate fixtures; return a new
  plain object. Both the existing borrowing report and operations summary must
  consume the explicit `businessDate` argument so in-memory parity cannot drift
  with the host clock.

- [ ] **Step 6: Run GREEN FE12 backend tests**

  Run:

  ```powershell
  npm --prefix backend test -- --runTestsByPath tests/reportRepository.test.js tests/reportService.test.js tests/reportRoutes.test.js tests/reportContract.test.js tests/reportInMemoryParity.test.js
  ```

  Expected: all focused report suites pass.

- [ ] **Step 7: Write failing frontend summary tests**

  Assert API and view model:

  ```js
  assert.match(apiSource, /operationsSummary\\(\\)/);
  assert.deepEqual(buildStaffSummary({
    pendingBorrowRequests: 1,
    activeLoans: 2,
    overdueLoans: 1,
    openReservations: 3,
    availableCopies: 4,
    lowStockBooks: 2,
  }).map((item) => item.value), [1, 2, 1, 3, 4, 2]);
  ```

  Add a missing-field case whose card value is `null`, never `0`.

- [ ] **Step 8: Replace staff dashboard fan-out with FE12 summary**

  Keep Member dashboard behavior unchanged. For staff:

  ```js
  const request = audience === 'member'
    ? Promise.all([borrowingApi.listMine(), reservationApi.listMine()])
    : reportApi.operationsSummary();
  ```

  Build six fixed cards:

  ```js
  [
    ['Yêu cầu chờ duyệt', 'pendingBorrowRequests', '/librarian/borrow-requests'],
    ['Đang mượn', 'activeLoans', '/reports/borrowing'],
    ['Quá hạn', 'overdueLoans', '/reports/borrowing'],
    ['Đặt chỗ đang mở', 'openReservations', '/librarian/reservations'],
    ['Bản sao sẵn có', 'availableCopies', '/reports/inventory'],
    ['Sắp hết', 'lowStockBooks', '/reports/inventory'],
  ]
  ```

  Render `Không tải được` for a `null` value and provide per-card retry by
  reloading the single snapshot. Do not derive counts from paginated rows.

- [ ] **Step 9: Run GREEN FE12 frontend tests**

  Run:

  ```powershell
  node --test --test-name-pattern="report|dashboard|app shell" frontend/test/*.test.js
  npm --prefix frontend run lint
  npm --prefix frontend run build
  git diff --check
  ```

  Expected: focused frontend tests, lint and build pass.

- [ ] **Step 10: Record the slice checkpoint without committing product code**

  Update FE12 evidence files; leave implementation uncommitted.

---

### Task 7: Prove the connected flow with integration and desktop browser tests

**Files:**

- Modify/Create: Cross-feature evidence files listed in File Structure.

**Interfaces:**

- Consumes: Tasks 2-6.
- Produces: one deterministic fixture and browser path:

  ```text
  FE07 PENDING
  -> FE07 BORROWED + FE10 BORROW_REQUEST_APPROVED
  -> FE08 ACTIVE
  -> FE07 RETURNED + reservationQueueAction
  -> FE08 NOTIFIED + FE10 RESERVATION_READY
  -> FE07 BORROWED + FE08 FULFILLED
  -> FE12 operations summary matches final source state
  ```

- [ ] **Step 1: Write a failing backend cross-feature integration test**

  Extend `backend/tests/systemIntegration.test.js` to use Member A, Member B and
  Librarian. Assert source state and notification count after every transition.
  Snapshot the FE12 body before and after; assert no duplicate notification after
  replaying an identical source request.

- [ ] **Step 2: Run RED system test**

  Run:

  ```powershell
  npm --prefix backend run test:integration:system
  ```

  Expected: new connected case fails until all slices are wired into the shared
  in-memory harness.

- [ ] **Step 3: Extend the deterministic E2E harness**

  Add setup helpers only under `/__e2e__/` for:

  ```js
  {
    memberAUserId,
    memberBUserId,
    librarianUserId,
    copyId,
    bookId
  }
  ```

  Use production routes for every business mutation. Harness-only endpoints may
  seed dates or inspect state; they must not perform the mutation being tested.

- [ ] **Step 4: Write the desktop Playwright golden flow**

  Set:

  ```js
  await page.setViewportSize({ width: 1440, height: 900 });
  ```

  Verify:

  ```text
  Member A creates borrow request.
  Librarian approves.
  Member A opens FE10 result and lands on /borrowing/history.
  Member B reserves the borrowed copy.
  Librarian returns the copy and uses the visible queue handoff.
  Librarian processes FIFO queue.
  Member B opens RESERVATION_READY, sees NOTIFIED expiry and creates exact-copy request.
  Librarian approves that request; reservation becomes FULFILLED.
  Librarian /home shows FE12 KPI values matching the final backend snapshot.
  documentElement.scrollWidth <= documentElement.clientWidth.
  browser console contains no unexpected error.
  ```

- [ ] **Step 5: Run GREEN integration and browser tests**

  Run:

  ```powershell
  npm --prefix backend run test:integration:system
  npx playwright test tests/e2e/fe07-fe12-connected-demo-flow.spec.js --project=chromium
  ```

  Expected: both pass at `1440x900`.

- [ ] **Step 6: Update user/demo documentation**

  Add exact routes, roles, setup data, clicks and expected state transitions to:

  ```text
  docs/user-manual.md
  docs/testing/system-integration-demo-runbook.md
  ```

  State that Azure staging uses Azure SQL and that `/health` alone is not
  business-flow evidence.

- [ ] **Step 7: Run the full local verification gate**

  Run:

  ```powershell
  npm --prefix backend test
  npm --prefix backend run test:coverage:ci
  npm --prefix frontend test
  npm --prefix frontend run lint
  npm --prefix frontend run build
  npm run test:system
  npm run test:deployment
  npm run test:traceability-state
  npm run trace:enforce
  npm run schema:azure:prepare
  git diff --check
  ```

  Expected: every command exits `0`; backend coverage remains above global
  `80%` branches/functions/lines/statements; traceability stays at or above
  `70%`; Azure-compatible schema is generated without database create/switch.

- [ ] **Step 8: Record complete L1-L4 evidence and stop for H2**

  Record exact counts, command output, browser screenshot paths, migration hash
  and the complete local diff. Do not stage or commit product implementation
  before the user approves H2.

---

### Task 8: H2 commit, PR, H3 merge and Azure staging verification

**Files:**

- Modify: feature `TASKS.md`, `TEST_PLAN.md`, `CHANGELOG.md` only for exact
  evidence substitutions allowed by H3.

**Interfaces:**

- Consumes: complete H2-reviewed local diff and L1-L4 evidence.
- Produces: exact-head PR, merged `main`, exact post-merge CI and Azure staging
  evidence against Azure SQL.

- [ ] **Step 1: Present the H2 packet**

  Include:

  ```text
  branch and base commit
  complete changed-file list
  git diff --check result
  RED/GREEN commands and counts per slice
  full backend/frontend/coverage/lint/build/system results
  traceability result
  migration SHA-256
  Playwright 1440x900 evidence
  known limitations and out-of-scope confirmation
  ```

- [ ] **Step 2: Stage only reviewed batch files after H2 approval**

  Run:

  ```powershell
  git add -- backend/src backend/tests frontend/src frontend/test database docs .sdd tests/e2e
  git diff --cached --check
  git diff --cached --name-only
  ```

  Remove any unrelated pre-existing file from the index before commit. Expected:
  staged list matches the H2 packet exactly.

- [ ] **Step 3: Commit and push the exact H2-reviewed diff**

  Run:

  ```powershell
  git commit -m "feat: connect borrowing reservation notifications and reporting"
  git push -u origin codex/impl-fe07-fe12-connected-demo-flow
  ```

  Open a draft PR, wait for required CI, then mark ready only when the exact head
  remains unchanged and checks pass.

- [ ] **Step 4: Stop for H3 integration review**

  Review Standards and Spec axes, PR mergeability, required checks, schema
  migration instructions, secret scan and exact head SHA. Do not merge until the
  user explicitly approves H3.

- [ ] **Step 5: Merge and monitor exact post-merge CI**

  After H3:

  ```text
  merge reviewed PR
  capture merge SHA
  wait for CI on that exact main SHA
  wait for deploy-staging on that exact main SHA
  ```

  Do not treat a different commit's green run as evidence.

- [ ] **Step 6: Apply/verify Azure SQL migration and staging flow**

  Use the reviewed idempotent migration against the configured Azure SQL staging
  database through the existing deployment workflow. Verify migration twice,
  then run:

  ```powershell
  npm run smoke:staging
  ```

  Execute the bounded live role flow on the Azure Static Web Apps frontend and
  Azure App Service backend. Confirm FE10 inbox rows, FE08 manual queue handoff
  and FE12 KPI values from Azure SQL; `/health` is only the entry gate.

- [ ] **Step 7: Close evidence only after exact staging success**

  Record PR number, H2/H3 approvals, implementation head, merge SHA, exact CI
  run, exact Azure run, migration hash and bounded live verification. If any
  required check or live business step fails, keep the batch open and report the
  precise failing boundary.

---

## Self-Review

### Spec coverage

- AT-001/AT-002/AT-003: Tasks 2-4.
- AT-004: Tasks 3-4.
- AT-005/AT-006/AT-007/AT-008/AT-009: Tasks 2, 3 and 5.
- AT-010/AT-011: Task 6.
- AT-012: Task 7.
- Azure SQL and staging truth: Task 8.

### Placeholder scan

The plan assigns exact file paths, API names, requirement IDs, commands,
response members, template keys, action paths and expected outcomes. It contains
no deferred implementation marker.

### Type consistency

- `reservationQueueAction.copyId` is a positive integer end-to-end.
- `reservationQueueAction.hasActiveQueue` is boolean.
- `reservationQueueAction.actionPath` is always
  `/librarian/reservations`.
- FE10 action path for all four FE07 result templates is always
  `/borrowing/history`.
- FE12 KPI fields are numbers at the backend boundary and `number | null` only
  in the frontend view model to represent invalid/missing fields without false
  zero.
- `generatedAt` is an ISO-8601 server timestamp.
