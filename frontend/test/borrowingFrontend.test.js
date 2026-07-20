import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';

async function loadBorrowingAccess() {
  try {
    return await import('../src/utils/borrowingAccess.js');
  } catch {
    return {};
  }
}

async function loadBorrowingViewModels() {
  try {
    return await import('../src/utils/libraryFeatureViewModels.js');
  } catch {
    return {};
  }
}

test('shared view models retain only the documented FE07 temporary candidate catalog', async () => {
  const source = await readFile(
    new URL('../src/utils/libraryFeatureViewModels.js', import.meta.url),
    'utf8'
  );

  assert.match(source, /export const DEMO_BORROW_CATALOG/);
  assert.doesNotMatch(source, /export const DEMO_RESERVABLE/);
  assert.doesNotMatch(
    source,
    /DEMO_MY_RESERVATIONS|DEMO_ALL_RESERVATIONS|DEMO_BORROW_ROWS|DEMO_ADMIN_REQUESTS|DEMO_MEMBERS/
  );
});

test('FE07 route access redirects guests and wrong roles', async () => {
  const { getBorrowingRouteRedirect } = await loadBorrowingAccess();

  assert.equal(typeof getBorrowingRouteRedirect, 'function');
  assert.equal(getBorrowingRouteRedirect({ authenticated: false, roles: [] }, 'member'), '/login');
  assert.equal(getBorrowingRouteRedirect({ authenticated: true, roles: ['MEMBER'] }, 'member'), null);
  assert.equal(getBorrowingRouteRedirect({ authenticated: true, roles: ['LIBRARIAN'] }, 'member'), '/home');
  assert.equal(getBorrowingRouteRedirect({ authenticated: true, roles: ['MEMBER'] }, 'staff'), '/home');
  assert.equal(getBorrowingRouteRedirect({ authenticated: true, roles: ['LIBRARIAN'] }, 'staff'), null);
  assert.equal(getBorrowingRouteRedirect({ authenticated: true, roles: ['ADMIN'] }, 'staff'), null);
});

test('all FE07 routes use the borrowing route guard', async () => {
  const source = await readFile(new URL('../src/App.jsx', import.meta.url), 'utf8');

  assert.match(source, /import BorrowingRouteGuard from '.\/component\/borrowing\/BorrowingRouteGuard';/);
  for (const path of ['/borrowing/new', '/borrowing/history']) {
    const escapedPath = path.replaceAll('/', '\\/');
    assert.match(source, new RegExp(`path="${escapedPath}" element=\\{<BorrowingRouteGuard audience="member">`));
  }
  for (const path of ['/librarian/borrow-requests', '/librarian/returns', '/librarian/members']) {
    const escapedPath = path.replaceAll('/', '\\/');
    assert.match(source, new RegExp(`path="${escapedPath}" element=\\{<BorrowingRouteGuard audience="staff">`));
  }
});

test('FE07 API-backed pages use empty canonical state after load failures', async () => {
  const cases = [
    ['../src/page/borrowing/BorrowingHistoryPage.jsx', /setRows\(\[\]\)/],
    ['../src/page/borrowing/BorrowRequestsAdminPage.jsx', /setRequests\(\[\]\)/],
    ['../src/page/borrowing/ProcessReturnsPage.jsx', /setLoans\(\[\]\)/],
    ['../src/page/borrowing/MemberBorrowingDetailsPage.jsx', /setRows\(\[\]\)/],
  ];

  for (const [path, emptyStatePattern] of cases) {
    const source = await readFile(new URL(path, import.meta.url), 'utf8');
    assert.match(source, emptyStatePattern, path);
    assert.match(source, /setNotice\(error\.message(?:\s*\|\|[^)]*)?\)/, path);
    assert.doesNotMatch(source, /DEMO_BORROW_ROWS|DEMO_ADMIN_REQUESTS|DEMO_MEMBERS|DEMO_RETURN_ROWS/, path);
    assert.doesNotMatch(source, /\bisDemo\b|Demo fallback/, path);
  }
});

test('FE07 mutations always call the backend instead of simulating demo success', async () => {
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');
  const requests = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const returns = await readFile(new URL('../src/page/borrowing/ProcessReturnsPage.jsx', import.meta.url), 'utf8');

  assert.match(history, /await borrowingApi\.renewDetail\(renewRow\.borrowDetailId\)/);
  assert.match(requests, /await borrowingApi\.approve\(approveTarget\.requestId/);
  assert.match(requests, /await borrowingApi\.reject\(selected\.requestId/);
  assert.match(returns, /await borrowingApi\.returnDetail\(returnTarget\.borrowDetailId/);
  for (const source of [history, requests, returns]) {
    assert.doesNotMatch(source, /if \(!isDemo\)/);
  }
});

test('shared FE07 dialogs use namespaced classes that cannot inherit Bootstrap modal hiding', async () => {
  const feedback = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  for (const className of ['lib-modal-backdrop', 'lib-modal', 'lib-modal-header', 'lib-modal-title', 'lib-modal-body', 'lib-modal-actions']) {
    assert.match(feedback, new RegExp(`className="${className}"`), className);
    assert.match(styles, new RegExp(`\\.${className}\\b`), className);
  }
  assert.doesNotMatch(feedback, /className="modal(?:-|")/);
  assert.doesNotMatch(styles, /^\.modal(?:-|\s*\{)/m);
});

test('borrow request helper copy is readable Vietnamese', async () => {
  const source = await readFile(new URL('../src/page/borrowing/BorrowRequestPage.jsx', import.meta.url), 'utf8');
  const adminSource = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const memberSource = await readFile(new URL('../src/page/borrowing/MemberBorrowingDetailsPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /Hệ thống sẽ kiểm tra tư cách thành viên, giới hạn 5 sách, sách quá hạn, phí phạt và tình trạng bản sao\./);
  assert.doesNotMatch(source, /Backend mới l-|Chon mot cu-n/);
  assert.doesNotMatch(adminSource, /backend re-check|Backend sẽ re-check/);
  assert.match(memberSource, /placeholder="Tìm tên, email, mã\.\.\."/);
  assert.doesNotMatch(memberSource, /placeholder="Nhập (?:mã thành viên|userId)/);
});

test('borrow request review layout yields to the single-column mobile breakpoint', async () => {
  const page = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(page, /className="split borrow-request-split"/);
  assert.doesNotMatch(page, /className="split"\s+style=\{\{\s*gridTemplateColumns/);
  assert.match(styles, /\.borrow-request-split\s*\{[^}]*grid-template-columns:\s*1\.15fr \.85fr;/s);
  assert.match(styles, /\.split\s*>\s*\*\s*\{[^}]*min-width:\s*0;/s);
  assert.match(styles, /@media \(max-width: 1024px\)[\s\S]*\.split\s*\{[^}]*grid-template-columns:\s*1fr;/);
});

test('overdue member borrowings stay active without being duplicated in history', async () => {
  const { mapBorrowDetailsToMember } = await loadBorrowingViewModels();
  const member = mapBorrowDetailsToMember([
    { borrowDetailId: 1, copyId: 1, dueDate: '2000-01-01', status: 'BORROWED' },
    { borrowDetailId: 2, copyId: 2, returnDate: '2026-07-14', status: 'RETURNED' },
  ], { id: 257 });

  assert.equal(member.current.length, 1);
  assert.equal(member.current[0].status, 'Overdue');
  assert.equal(member.history.length, 1);
  assert.equal(member.history[0].status, 'Returned');
});

test('pending requests are separated from active borrowed copies and history', async () => {
  const { mapBorrowDetailsToMember } = await loadBorrowingViewModels();
  const member = mapBorrowDetailsToMember([
    { borrowDetailId: 1, copyId: 1, createdAt: '2026-07-14', status: 'REQUESTED' },
    { borrowDetailId: 2, copyId: 2, dueDate: '2099-01-01', status: 'BORROWED' },
    { borrowDetailId: 3, copyId: 3, returnDate: '2026-07-14', status: 'RETURNED' },
  ], { id: 257 });

  assert.equal(member.pending.length, 1);
  assert.equal(member.pending[0].status, 'Pending');
  assert.equal(member.current.length, 1);
  assert.equal(member.current[0].status, 'Borrowed');
  assert.equal(member.history.length, 1);
  assert.equal(member.history[0].status, 'Returned');
});

test('member history maps canonical borrow-detail rows without a request envelope', async () => {
  const { mapBorrowDetailsToHistoryRows } = await loadBorrowingViewModels();
  const rows = mapBorrowDetailsToHistoryRows([
    {
      borrowDetailId: 41,
      requestId: 17,
      copyId: 9,
      borrowDate: '2026-07-01',
      dueDate: '2026-07-15',
      returnDate: null,
      renewalCount: 0,
      status: 'OVERDUE',
      copy: { title: 'Clean Architecture', author: 'Robert C. Martin' },
    },
  ]);

  assert.deepEqual(rows, [{
    id: 41,
    borrowDetailId: 41,
    requestId: 17,
    title: 'Clean Architecture',
    author: 'Robert C. Martin',
    borrowDate: '2026-07-01',
    dueDate: '2026-07-15',
    returnDate: null,
    status: 'Overdue',
    renewalsLeft: 0,
  }]);
});

test('member history uses canonical server filtering and pagination', async () => {
  const source = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /mapBorrowDetailsToHistoryRows/);
  assert.match(source, /const PAGE_SIZE = 20/);
  assert.match(source, /active:\s*'BORROWED'/);
  assert.match(source, /overdue:\s*'OVERDUE'/);
  assert.match(source, /returned:\s*'RETURNED'/);
  assert.match(source, /borrowingApi\.listMine\(\{ status, page, limit: PAGE_SIZE \}\)/);
  assert.match(source, /data\.borrowings \|\| \[\]/);
  assert.match(source, /setPagination\(data\.pagination/);
  assert.match(source, /pagination\.totalPages/);
  assert.match(source, /pagination\.total/);
  assert.doesNotMatch(source, /filtered\.slice/);
});

test('approval UI does not invent audit notes or eligibility evidence', async () => {
  const { mapBorrowRequestsToAdminRows } = await loadBorrowingViewModels();
  const source = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const [row] = mapBorrowRequestsToAdminRows([{
    requestId: 1,
    userId: 257,
    status: 'PENDING',
    details: [{ copyId: 1, status: 'REQUESTED', copy: { status: 'BORROWED' } }],
  }]);

  assert.equal(row.copyAvailable, false);
  assert.equal(Object.hasOwn(row, 'unpaidFines'), false);
  assert.equal(Object.hasOwn(row, 'membershipActive'), false);
  assert.doesNotMatch(source, /Approved from FE07 UI|req\.unpaidFines|disabled=\{!allOk\}/);
  assert.match(source, /borrowingApi\.approve\(approveTarget\.requestId\)/);
});

test('librarian borrow request review filters and refreshes canonical API state', async () => {
  const { mapBorrowRequestsToAdminRows } = await loadBorrowingViewModels();
  const source = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const [row] = mapBorrowRequestsToAdminRows([{
    requestId: 9,
    userId: 3,
    status: 'PENDING',
    member: { memberId: 7, fullName: 'Nguyễn Minh An', username: 'member_an', phone: '0900000003' },
    details: [{ copyId: 2, copy: { title: 'Clean Code', author: 'Robert Martin', barcode: 'BC2', location: 'A2', status: 'AVAILABLE' } }],
  }]);

  assert.equal(row.rawStatus, 'PENDING');
  assert.equal(row.member, 'Nguyễn Minh An');
  assert.equal(row.memberId, 7);
  assert.equal(row.phone, '0900000003');
  assert.equal(row.details[0].barcode, 'BC2');
  assert.match(source, /borrowingApi\.listAll\(params\)/);
  assert.match(source, /await loadRequests\(\)/);
  assert.match(source, /value=\{statusFilter\}/);
  assert.match(source, /value=\{searchInput\}/);
  assert.match(source, /onSubmit=\{handleSearch\}/);
  assert.match(source, /type="submit" className="btn btn-primary"/);
  assert.match(source, /setSearchQuery\(searchInput\.trim\(\)\)/);
  assert.match(source, /normalizeSearchValue/);
  assert.match(source, /row\.details\.flatMap/);
  assert.match(source, /filteredRequests\.slice/);
  assert.match(source, /selected\.rawStatus === 'PENDING'/);
  assert.match(source, /Number\(left\.requestId\) - Number\(right\.requestId\)/);
  assert.match(source, /const PAGE_SIZE = 8/);
  assert.match(source, /pagedRequests\.map/);
  assert.match(source, /aria-label="Phân trang yêu cầu mượn"/);
  assert.match(source, /title="Yêu cầu mượn sách"/);
  assert.doesNotMatch(source, /YÃªu|yÃªu|mÆ°á»£n|Tráº¡ng/);
});

test('return UI omits the client UTC date and does not claim a fine handoff occurred', async () => {
  const source = await readFile(new URL('../src/page/borrowing/ProcessReturnsPage.jsx', import.meta.url), 'utf8');

  assert.match(source, /returnDetail\(returnTarget\.borrowDetailId,\s*\{\s*condition,?\s*\}\)/s);
  assert.doesNotMatch(source, /returnDate:\s*new Date\(\)\.toISOString\(\)/);
  assert.doesNotMatch(source, /đã được chuyển cho quản lý phí phạt/i);
});

test('shared modal exposes an accessible name and manages keyboard focus', async () => {
  const source = await readFile(new URL('../src/component/shared/Feedback.jsx', import.meta.url), 'utf8');

  assert.match(source, /aria-labelledby=\{titleId\}/);
  assert.match(source, /tabIndex=\{-1\}/);
  assert.match(source, /dialogRef/);
  assert.match(source, /previouslyFocused/);
  assert.match(source, /e\.key === 'Tab'/);
  assert.match(source, /\.focus\(\)/);
});

test('borrowing pagination wraps instead of hiding later pages on mobile', async () => {
  const styles = await readFile(new URL('../src/styles/app-shell.css', import.meta.url), 'utf8');

  assert.match(styles, /\.pagination\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(styles, /\.page-controls\s*\{[^}]*flex-wrap:\s*wrap;/s);
  assert.match(styles, /--lib-heading:\s*var\(--heading\);/);
});

test('FE07 member pages use shared operational patterns without changing API calls', async () => {
  const request = await readFile(new URL('../src/page/borrowing/BorrowRequestPage.jsx', import.meta.url), 'utf8');
  const history = await readFile(new URL('../src/page/borrowing/BorrowingHistoryPage.jsx', import.meta.url), 'utf8');

  assert.match(request, /DataToolbar/);
  assert.match(request, /EmptyState/);
  assert.doesNotMatch(request, /<div className="empty">/);
  assert.match(request, /borrowingApi\.createRequest\(\[Number\(copyId\)\]\)/);

  assert.match(history, /DataToolbar/);
  assert.match(history, /DataTable/);
  assert.match(history, /ConfirmAction/);
  assert.match(history, /const \[renewing, setRenewing\] = useState\(false\)/);
  assert.match(history, /data-label="Hạn trả"/);
  assert.match(history, /await borrowingApi\.renewDetail\(renewRow\.borrowDetailId\)/);
  assert.doesNotMatch(history, /<table className="lib-table"/);
});

test('FE07 staff pages use shared tables and pending confirmations', async () => {
  const requests = await readFile(new URL('../src/page/borrowing/BorrowRequestsAdminPage.jsx', import.meta.url), 'utf8');
  const returns = await readFile(new URL('../src/page/borrowing/ProcessReturnsPage.jsx', import.meta.url), 'utf8');
  const member = await readFile(new URL('../src/page/borrowing/MemberBorrowingDetailsPage.jsx', import.meta.url), 'utf8');

  assert.match(requests, /DataTable/);
  assert.match(requests, /ConfirmAction/);
  assert.match(requests, /const \[actionPending, setActionPending\] = useState\(false\)/);
  assert.match(requests, /await borrowingApi\.approve\(approveTarget\.requestId\)/);
  assert.match(requests, /await borrowingApi\.reject\(selected\.requestId, rejectReason\.trim\(\)\)/);

  assert.match(returns, /DataTable/);
  assert.match(returns, /ConfirmAction/);
  assert.match(returns, /const \[returnTarget, setReturnTarget\] = useState\(null\)/);
  assert.match(returns, /returnDetail\(returnTarget\.borrowDetailId, \{ condition \}\)/);
  assert.match(returns, /borrowingApi\.listAll\(\{ status: 'APPROVED' \}\)/);
  assert.match(returns, /onSubmit=\{handleSearch\}/);
  assert.match(returns, /await loadLoans\(\)/);
  assert.match(returns, /className="split return-workspace"/);
  assert.doesNotMatch(returns, /DataToolbar/);

  assert.match(member, /DataTable/);
  assert.match(member, /borrowingApi\.listAll\(\)/);
  assert.match(member, /borrowingApi\.listMemberBorrowings\(userId\)/);
  assert.match(member, /const PAGE_SIZE = 8/);
  assert.match(member, /value=\{statusFilter\}/);
  assert.match(member, /visibleMembers\.map/);
  assert.doesNotMatch(member, /<table className="lib-table"/);
});
