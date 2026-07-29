const LIBRARY_TIME_ZONE = 'Asia/Ho_Chi_Minh';

// @spec NFR-FE07-TIME-001 — parse date-only (YYYY-MM-DD) as UTC midnight để tránh lệch host timezone.
function parseDateOnly(value) {
  const match = String(value || '').match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!match) return null;
  const [, year, month, day] = match;
  return Date.UTC(Number(year), Number(month) - 1, Number(day));
}

function libraryTodayEpoch(now = new Date()) {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
      timeZone: LIBRARY_TIME_ZONE,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).formatToParts(now).filter(({ type }) => type !== 'literal').map(({ type, value }) => [type, value]),
  );
  return Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
}

// @spec NFR-FE07-TIME-001 — định dạng ngày theo Asia/Ho_Chi_Minh để giữ nguyên ngày bất kể host timezone.
export function fmtDate(value) {
  if (!value) return '—';
  const dateOnlyEpoch = parseDateOnly(value);
  if (dateOnlyEpoch !== null) {
    const formatted = new Intl.DateTimeFormat('vi-VN', {
      timeZone: LIBRARY_TIME_ZONE,
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    }).format(new Date(dateOnlyEpoch));
    return formatted;
  }
  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? '—' : fallback.toLocaleDateString('vi-VN');
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

// @spec NFR-FE07-TIME-001 — so sánh theo business date của thư viện, không dùng host-local midnight.
export function isPast(dateValue) {
  if (!dateValue) return false;
  const epoch = parseDateOnly(dateValue);
  if (epoch === null) return false;
  return epoch < libraryTodayEpoch();
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

// @spec FR-FE07-028, FR-FE07-029
export function mapBorrowDetailsToHistoryRows(details = []) {
  return details.map((detail) => {
    const displayStatus = detail.requestStatus === 'REJECTED'
      ? detail.requestStatus
      : detail.status;

    return {
      id: detail.borrowDetailId || `${detail.requestId}-${detail.copyId}`,
      borrowDetailId: detail.borrowDetailId,
      requestId: detail.requestId,
      title: detail.copy?.title || `Bản sao #${detail.copyId}`,
      author: detail.copy?.author || '-',
      borrowDate: detail.borrowDate || detail.createdAt,
      dueDate: detail.dueDate,
      returnDate: detail.returnDate,
      rawStatus: String(detail.status || '').toUpperCase(),
      requestStatus: String(detail.requestStatus || '').toUpperCase(),
      requestDate: detail.requestDate || detail.createdAt || null,
      approvedAt: detail.approvedAt || null,
      rejectedAt: detail.rejectedAt || null,
      processedAt: detail.processedAt || null,
      createdAt: detail.createdAt || null,
      updatedAt: detail.updatedAt || null,
      status: statusToUi(displayStatus, { expiresAt: detail.dueDate }),
      renewalsLeft: detail.status === 'BORROWED'
        ? Math.max(0, 1 - Number(detail.renewalCount || 0))
        : 0,
    };
  });
}

export function mapBorrowRequestsToAdminRows(borrowRequests = []) {
  return borrowRequests.map((request) => {
    const detail = firstDetail(request) || {};
    const details = request.details || [];
    const title = details.length > 1
      ? details.map((item) => item.copy?.title || `Bản sao #${item.copyId}`).join(', ')
      : detail.copy?.title || `Bản sao #${detail.copyId || '-'}`;
    return {
      id: `REQ-${request.requestId}`,
      requestId: request.requestId,
      member: request.member?.fullName || request.member?.username || request.member?.email || `Thành viên #${request.userId}`,
      username: request.member?.username || '-',
      memberId: request.member?.memberId || request.userId,
      email: request.member?.email || '-',
      phone: request.member?.phone || '-',
      book: title,
      author: detail.copy?.author || '-',
      copyId: detail.copyId || '-',
      barcode: detail.copy?.barcode || '-',
      branch: detail.copy?.location || '-',
      requestDate: request.requestDate || request.createdAt,
      borrowDate: detail.borrowDate || request.approvedAt || request.requestDate,
      dueDate: detail.dueDate,
      details: details.map((item) => ({
        copyId: item.copyId,
        barcode: item.copy?.barcode || '-',
        book: item.copy?.title || `Bản sao #${item.copyId}`,
        author: item.copy?.author || '-',
        location: item.copy?.location || '-',
        status: item.copy?.status || '-',
      })),
      rawStatus: String(request.status || '').toUpperCase(),
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
      requestId: request.requestId,
      member: detail.member?.fullName || request.member?.fullName || detail.member?.username || detail.member?.email || request.member?.email || `Thành viên #${detail.userId}`,
      memberId: detail.member?.memberId || request.member?.memberId || detail.userId,
      username: detail.member?.username || request.member?.username || '-',
      email: detail.member?.email || request.member?.email || '-',
      phone: detail.member?.phone || request.member?.phone || '-',
      book: detail.copy?.title || `Bản sao #${detail.copyId}`,
      author: detail.copy?.author || '-',
      copyId: detail.copyId,
      barcode: detail.copy?.barcode || '-',
      location: detail.copy?.location || '-',
      borrowDate: detail.borrowDate,
      dueDate: detail.dueDate,
      renewalCount: Number(detail.renewalCount || 0),
      rawStatus: String(detail.status || '').toUpperCase(),
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
    name: selectedMember.name || `Thành viên #${selectedMember.id}`,
    email: selectedMember.email || null,
    phone: selectedMember.phone || null,
    membership: selectedMember.membership || null,
    totalFines: selectedMember.totalFines ?? null,
    activeReservations: selectedMember.activeReservations ?? null,
    pending: rows.filter((row) => row.status === 'Pending'),
    current: rows.filter((row) => ['Borrowed', 'Overdue'].includes(row.status)),
    history: rows.filter((row) => !['Borrowed', 'Overdue', 'Pending'].includes(row.status)),
  };
}

export function isOpenMemberReservationStatus(status) {
  return ['ACTIVE', 'NOTIFIED'].includes(String(status || '').toUpperCase());
}

export function splitMemberReservations(reservations = []) {
  return {
    current: reservations.filter((item) => isOpenMemberReservationStatus(item.rawStatus)),
    history: reservations.filter((item) => !isOpenMemberReservationStatus(item.rawStatus)),
  };
}

export function memberReservationBadgeStatus(status) {
  const normalized = String(status || '').toUpperCase();
  if (normalized === 'NOTIFIED') return 'ready';
  if (normalized === 'ACTIVE') return 'waiting';
  if (normalized === 'FULFILLED') return 'completed';
  if (normalized === 'CANCELLED') return 'cancelled';
  if (normalized === 'EXPIRED') return 'expired';
  return 'default';
}

// @spec NFR-FE08-UX-001 — badge class thống nhất cho cả member và librarian page.
// Trả về status đã chuẩn hóa (chấp nhận cả display 'Ready to pick up' từ statusToUi).
export function librarianReservationBadgeStatus(displayStatus, rawStatus) {
  const normalized = String(displayStatus || '').toLowerCase();
  if (normalized === 'ready to pick up') return 'ready';
  if (normalized === 'waiting') return 'waiting';
  if (normalized === 'completed') return 'completed';
  if (normalized === 'cancelled') return 'cancelled';
  if (normalized === 'expired') return 'expired';
  return memberReservationBadgeStatus(rawStatus);
}

// @spec FR-FE08-035, AC-FE08-022
export function formatReservationQueuePosition(queuePosition, scopeLabel = '') {
  if (queuePosition == null) return 'Chưa xác định';
  const scope = String(scopeLabel).trim();
  return `#${queuePosition}${scope ? ` trong hàng đợi ${scope}` : ''}`;
}

export function mapReservation(reservation) {
  return {
    id: `RS-${reservation.reservationId}`,
    reservationId: reservation.reservationId,
    copyId: reservation.copyId,
    bookId: reservation.copy?.bookId || null,
    title: reservation.copy?.title || `Bản sao #${reservation.copyId}`,
    author: reservation.copy?.author || '-',
    barcode: reservation.copy?.barcode || '-',
    location: reservation.copy?.location || '-',
    copyStatus: reservation.copy?.status || null,
    member: reservation.member?.fullName || reservation.member?.username || reservation.member?.email || `Thành viên #${reservation.userId}`,
    username: reservation.member?.username || null,
    email: reservation.member?.email || null,
    reservedDate: reservation.reservedAt || reservation.createdAt,
    queue: reservation.queuePosition ?? null,
    rawStatus: String(reservation.status || '').toUpperCase(),
    status: statusToUi(reservation.status, reservation),
    pickupStart: reservation.notifiedAt,
    deadline: reservation.expiresAt,
  };
}

export function objectToChart(object = {}, labelTransform = (label) => label) {
  return Object.entries(object).map(([label, value]) => ({ label: labelTransform(label), value: Number(value) || 0 }));
}
