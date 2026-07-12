export const DEMO_BORROW_CATALOG = [
  { id: 'BK-001', title: 'Clean Code', author: 'Robert C. Martin', category: 'Lập trình', rating: 4.7, copies: [
    { id: 1, branch: 'Chi nhánh Trung tâm', shelf: 'A-12' },
    { id: 2, branch: 'Chi nhánh Quận 7', shelf: 'B-04' },
  ] },
  { id: 'BK-002', title: 'The Pragmatic Programmer', author: 'Andrew Hunt, David Thomas', category: 'Lập trình', rating: 4.6, copies: [
    { id: 4, branch: 'Chi nhánh Trung tâm', shelf: 'A-15' },
  ] },
  { id: 'BK-003', title: 'Sapiens: Lược sử loài người', author: 'Yuval Noah Harari', category: 'Lịch sử', rating: 4.8, copies: [
    { id: 5, branch: 'Chi nhánh Trung tâm', shelf: 'D-02' },
    { id: 6, branch: 'Chi nhánh Quận 7', shelf: 'D-03' },
  ] },
  { id: 'BK-004', title: 'Nhà Giả Kim', author: 'Paulo Coelho', category: 'Tiểu thuyết', rating: 4.5, copies: [] },
];

export const DEMO_RESERVABLE = [
  { id: 'BK-001', copyId: 1, title: 'Clean Code', author: 'Robert C. Martin', availableCopies: 0, queue: 2, eta: 'khoảng 5 ngày' },
  { id: 'BK-010', copyId: 2, title: 'You Don\'t Know JS', author: 'Kyle Simpson', availableCopies: 2, queue: 0, eta: 'Sẵn sàng mượn' },
  { id: 'BK-022', copyId: 3, title: 'Atomic Habits', author: 'James Clear', availableCopies: 0, queue: 4, eta: 'khoảng 12 ngày' },
];

export const DEMO_MY_RESERVATIONS = [
  { id: 'RS-501', reservationId: 501, copyId: 1, title: 'Sapiens', author: 'Yuval Noah Harari', reservedDate: '2026-06-08', queue: 1, status: 'Waiting' },
  { id: 'RS-502', reservationId: 502, copyId: 2, title: 'Design Patterns', author: 'Erich Gamma', reservedDate: '2026-06-05', queue: 0, status: 'Ready to pick up', deadline: '2026-06-18' },
  { id: 'RS-503', reservationId: 503, copyId: 3, title: 'Refactoring', author: 'Martin Fowler', reservedDate: '2026-05-20', queue: 0, status: 'Expired' },
];

export const DEMO_ALL_RESERVATIONS = [
  { id: 'RS-501', reservationId: 501, copyId: 1, member: 'Nguyễn Văn An', book: 'Clean Code', reservedDate: '2026-06-08', queue: 1, status: 'Waiting' },
  { id: 'RS-510', reservationId: 510, copyId: 1, member: 'Trần Thị Bình', book: 'Clean Code', reservedDate: '2026-06-09', queue: 2, status: 'Waiting' },
  { id: 'RS-511', reservationId: 511, copyId: 1, member: 'Lê Hoàng Cường', book: 'Clean Code', reservedDate: '2026-06-10', queue: 3, status: 'Waiting' },
  { id: 'RS-502', reservationId: 502, copyId: 4, member: 'Phạm Thu Hà', book: 'Sapiens', reservedDate: '2026-06-05', queue: 1, status: 'Ready to pick up', deadline: '2026-06-22' },
  { id: 'RS-520', reservationId: 520, copyId: 4, member: 'Đỗ Minh Khoa', book: 'Sapiens', reservedDate: '2026-06-07', queue: 2, status: 'Waiting' },
  { id: 'RS-530', reservationId: 530, copyId: 3, member: 'Vũ Thanh Mai', book: 'Atomic Habits', reservedDate: '2026-06-11', queue: 1, status: 'Waiting' },
];

export const DEMO_BORROW_ROWS = [
  { id: 1, borrowDetailId: 1, requestId: 101, title: 'Clean Code', author: 'Robert C. Martin', borrowDate: '2026-06-02', dueDate: '2026-06-16', returnDate: null, status: 'Borrowed', renewalsLeft: 1 },
  { id: 2, borrowDetailId: 2, requestId: 102, title: 'The Pragmatic Programmer', author: 'Andrew Hunt', borrowDate: '2026-05-20', dueDate: '2026-06-03', returnDate: null, status: 'Overdue', renewalsLeft: 0 },
  { id: 3, borrowDetailId: 3, requestId: 103, title: 'Sapiens', author: 'Yuval Noah Harari', borrowDate: '2026-05-01', dueDate: '2026-05-15', returnDate: '2026-05-14', status: 'Returned', renewalsLeft: 0 },
  { id: 4, borrowDetailId: 4, requestId: 104, title: 'Nhà Giả Kim', author: 'Paulo Coelho', borrowDate: '2026-06-10', dueDate: '2026-06-24', returnDate: null, status: 'Borrowed', renewalsLeft: 0 },
  { id: 5, borrowDetailId: 5, requestId: 105, title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', borrowDate: '2026-06-12', dueDate: '2026-06-26', returnDate: null, status: 'Pending', renewalsLeft: 0 },
];

export const DEMO_ADMIN_REQUESTS = [
  { id: 'REQ-1042', requestId: 1042, member: 'Nguyễn Văn An', memberId: 'MB-0231', email: 'an.nguyen@example.com', phone: '0905 123 456', membershipActive: true, unpaidFines: 0, book: 'Clean Code', author: 'Robert C. Martin', copyId: 1, branch: 'Chi nhánh Trung tâm', copyAvailable: true, requestDate: '2026-06-14', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending' },
  { id: 'REQ-1043', requestId: 1043, member: 'Trần Thị Bình', memberId: 'MB-0198', email: 'binh.tran@example.com', phone: '0912 987 654', membershipActive: true, unpaidFines: 25000, book: 'Sapiens', author: 'Yuval Noah Harari', copyId: 5, branch: 'Chi nhánh Quận 7', copyAvailable: true, requestDate: '2026-06-14', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending' },
  { id: 'REQ-1044', requestId: 1044, member: 'Lê Hoàng Cường', memberId: 'MB-0420', email: 'cuong.le@example.com', phone: '0987 222 333', membershipActive: false, unpaidFines: 0, book: 'Design Patterns', author: 'Erich Gamma', copyId: 7, branch: 'Chi nhánh Trung tâm', copyAvailable: false, requestDate: '2026-06-13', borrowDate: '2026-06-15', dueDate: '2026-06-29', status: 'Pending' },
];

export const DEMO_MEMBERS = [
  {
    id: '1', name: 'Nguyễn Văn An', email: 'an.nguyen@example.com', phone: '0905 123 456', membership: 'Active', totalFines: 0, activeReservations: 1,
    current: [
      { book: 'Clean Code', borrowDate: '2026-06-02', dueDate: '2026-06-16', status: 'Borrowed' },
      { book: 'Nhà Giả Kim', borrowDate: '2026-06-10', dueDate: '2026-06-24', status: 'Borrowed' },
    ],
    history: [
      { book: 'Sapiens', borrowDate: '2026-05-01', returnDate: '2026-05-14', status: 'Returned' },
      { book: 'Design Patterns', borrowDate: '2026-04-10', returnDate: '2026-04-22', status: 'Returned' },
      { book: 'Refactoring', borrowDate: '2026-05-28', returnDate: null, status: 'Overdue' },
    ],
  },
  {
    id: '2', name: 'Trần Thị Bình', email: 'binh.tran@example.com', phone: '0912 987 654', membership: 'Active', totalFines: 25000, activeReservations: 0,
    current: [{ book: 'The Pragmatic Programmer', borrowDate: '2026-05-20', dueDate: '2026-06-03', status: 'Overdue' }],
    history: [{ book: 'Đắc Nhân Tâm', borrowDate: '2026-03-02', returnDate: '2026-03-16', status: 'Returned' }],
  },
];

export const DEMO_REPORTS = {
  borrowing: {
    totals: { requests: 1284, details: 1496, activeLoans: 342, overdueLoans: 57 },
    requestStatusCounts: { PENDING: 46, APPROVED: 972, COMPLETED: 221, REJECTED: 45 },
    detailStatusCounts: { BORROWED: 342, OVERDUE: 57, RETURNED: 1038, REQUESTED: 59 },
    borrowCountByPeriod: { '2026-01': 120, '2026-02': 98, '2026-03': 145, '2026-04': 132, '2026-05': 167, '2026-06': 189 },
    topBorrowedBooks: [
      { title: 'Clean Code', author: 'Robert C. Martin', borrowCount: 87, category: 'Lập trình' },
      { title: 'Sapiens', author: 'Yuval Noah Harari', borrowCount: 76, category: 'Lịch sử' },
      { title: 'Atomic Habits', author: 'James Clear', borrowCount: 71, category: 'Kỹ năng' },
      { title: 'Nhà Giả Kim', author: 'Paulo Coelho', borrowCount: 64, category: 'Tiểu thuyết' },
      { title: 'Đắc Nhân Tâm', author: 'Dale Carnegie', borrowCount: 59, category: 'Kỹ năng' },
    ],
  },
  inventory: {
    totals: { books: 2140, copies: 6580 },
    copyStatusCounts: { AVAILABLE: 4230, BORROWED: 2180, DAMAGED: 110, LOST: 60 },
    categoryCounts: { 'Lập trình': 1820, 'Lịch sử': 940, 'Tiểu thuyết': 1560, 'Kỹ năng': 1280, 'Khác': 980 },
    lowAvailabilityBooks: [
      { title: 'Clean Code', categoryName: 'Lập trình', totalCopies: 12, availableCopies: 2 },
      { title: 'Atomic Habits', categoryName: 'Kỹ năng', totalCopies: 10, availableCopies: 0 },
      { title: 'Design Patterns', categoryName: 'Lập trình', totalCopies: 6, availableCopies: 1 },
    ],
  },
  users: {
    totals: { users: 3420, members: 2910 },
    usersByStatus: { ACTIVE: 2910, INACTIVE: 476, BLOCKED: 34 },
    usersByRole: { MEMBER: 2910, LIBRARIAN: 18, ADMIN: 5 },
    membersByStatus: { APPROVED: 2910, PENDING: 34 },
    newMembersByPeriod: { '2026-01': 3010, '2026-02': 3095, '2026-03': 3180, '2026-04': 3250, '2026-05': 3340, '2026-06': 3420 },
  },
};

export function fmtDate(value) {
  if (!value) return '—';
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? '—' : date.toLocaleDateString('vi-VN');
}

export function vnd(value) {
  return Number(value || 0).toLocaleString('vi-VN') + ' ₫';
}

export function statusToUi(status, { notifiedAt, expiresAt } = {}) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'ACTIVE' && notifiedAt) return 'Ready to pick up';
  if (normalized === 'ACTIVE') return 'Waiting';
  if (normalized === 'NOTIFIED') return 'Ready to pick up';
  if (normalized === 'FULFILLED') return 'Completed';
  if (normalized === 'CANCELLED') return 'Cancelled';
  if (normalized === 'EXPIRED') return 'Expired';
  if (normalized === 'PENDING' || normalized === 'REQUESTED') return 'Pending';
  if (normalized === 'APPROVED') return 'Approved';
  if (normalized === 'REJECTED') return 'Rejected';
  if (normalized === 'BORROWED') return isPast(expiresAt) ? 'Overdue' : 'Borrowed';
  if (normalized === 'RETURNED') return 'Returned';
  if (normalized === 'DAMAGED') return 'Damaged';
  if (normalized === 'LOST') return 'Lost';
  if (normalized === 'COMPLETED') return 'Completed';
  if (normalized === 'OVERDUE') return 'Overdue';
  return status || 'Unknown';
}

export function isPast(dateValue) {
  if (!dateValue) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const date = new Date(dateValue);
  date.setHours(0, 0, 0, 0);
  return date < today;
}

function firstDetail(request) {
  return Array.isArray(request?.details) ? request.details[0] : null;
}

export function mapBorrowRequestsToHistoryRows(borrowRequests = []) {
  return borrowRequests.flatMap((request) => (request.details || []).map((detail) => ({
    id: detail.borrowDetailId || `${request.requestId}-${detail.copyId}`,
    borrowDetailId: detail.borrowDetailId,
    requestId: request.requestId,
    title: detail.copy?.title || `Bản sao #${detail.copyId}`,
    author: detail.copy?.author || '-',
    borrowDate: detail.borrowDate || request.approvedAt || request.requestDate,
    dueDate: detail.dueDate,
    returnDate: detail.returnDate,
    status: statusToUi(detail.status, { expiresAt: detail.dueDate }),
    renewalsLeft: detail.status === 'BORROWED' ? Math.max(0, 1 - Number(detail.renewalCount || 0)) : 0,
  })));
}

export function mapBorrowRequestsToAdminRows(borrowRequests = []) {
  return borrowRequests.map((request) => {
    const detail = firstDetail(request) || {};
    const details = request.details || [];
    const title = details.length > 1
      ? details.map((item) => item.copy?.title || `Copy #${item.copyId}`).join(', ')
      : detail.copy?.title || `Copy #${detail.copyId || '-'}`;
    return {
      id: `REQ-${request.requestId}`,
      requestId: request.requestId,
      member: request.member?.username || request.member?.email || `Member #${request.userId}`,
      memberId: request.userId,
      email: request.member?.email || '-',
      phone: '-',
      membershipActive: true,
      unpaidFines: 0,
      book: title,
      author: '-',
      copyId: detail.copyId || '-',
      branch: detail.copy?.location || '-',
      copyAvailable: details.every((item) => ['REQUESTED', 'AVAILABLE'].includes(item.status) || item.copy?.status === 'AVAILABLE'),
      requestDate: request.requestDate || request.createdAt,
      borrowDate: detail.borrowDate || request.approvedAt || request.requestDate,
      dueDate: detail.dueDate,
      status: statusToUi(request.status),
    };
  });
}

export function mapBorrowRequestsToReturnRows(borrowRequests = []) {
  return borrowRequests.flatMap((request) => (request.details || [])
    .filter((detail) => detail.status === 'BORROWED' || detail.status === 'OVERDUE')
    .map((detail) => ({
      id: `L-${detail.borrowDetailId}`,
      borrowDetailId: detail.borrowDetailId,
      member: detail.member?.username || detail.member?.email || request.member?.email || `Member #${detail.userId}`,
      book: detail.copy?.title || `Bản sao #${detail.copyId}`,
      copyId: detail.copy?.barcode || detail.copyId,
      dueDate: detail.dueDate,
    })));
}

export function mapBorrowDetailsToMember(details = [], selectedMember = {}) {
  const rows = details.map((detail) => ({
    book: detail.copy?.title || `Bản sao #${detail.copyId}`,
    borrowDate: detail.borrowDate || detail.createdAt,
    dueDate: detail.dueDate,
    returnDate: detail.returnDate,
    status: statusToUi(detail.status, { expiresAt: detail.dueDate }),
  }));
  return {
    id: String(selectedMember.id),
    name: selectedMember.name,
    email: selectedMember.email,
    phone: selectedMember.phone,
    membership: selectedMember.membership || 'Active',
    totalFines: selectedMember.totalFines || 0,
    activeReservations: selectedMember.activeReservations || 0,
    current: rows.filter((row) => ['Borrowed', 'Overdue', 'Pending'].includes(row.status)),
    history: rows.filter((row) => !['Borrowed', 'Pending'].includes(row.status)),
  };
}

export function mapReservation(reservation) {
  return {
    id: `RS-${reservation.reservationId}`,
    reservationId: reservation.reservationId,
    copyId: reservation.copyId,
    title: reservation.copy?.title || `Copy #${reservation.copyId}`,
    author: reservation.copy?.author || '-',
    member: reservation.member?.username || reservation.member?.email || `Member #${reservation.userId}`,
    reservedDate: reservation.reservedAt || reservation.createdAt,
    queue: reservation.queuePosition || 1,
    status: statusToUi(reservation.status, reservation),
    deadline: reservation.expiresAt,
  };
}

export function objectToChart(object = {}, labelTransform = (label) => label) {
  return Object.entries(object).map(([label, value]) => ({ label: labelTransform(label), value: Number(value) || 0 }));
}
