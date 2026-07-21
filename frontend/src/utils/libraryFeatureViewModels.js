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

// @spec FR-FE07-028
export function mapBorrowDetailsToHistoryRows(details = []) {
  return details.map((detail) => ({
    id: detail.borrowDetailId || `${detail.requestId}-${detail.copyId}`,
    borrowDetailId: detail.borrowDetailId,
    requestId: detail.requestId,
    title: detail.copy?.title || `Bản sao #${detail.copyId}`,
    author: detail.copy?.author || '-',
    borrowDate: detail.borrowDate || detail.createdAt,
    dueDate: detail.dueDate,
    returnDate: detail.returnDate,
    status: statusToUi(detail.status, { expiresAt: detail.dueDate }),
    renewalsLeft: detail.status === 'BORROWED'
      ? Math.max(0, 1 - Number(detail.renewalCount || 0))
      : 0,
  }));
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
      copyAvailable: details.length > 0 && details.every((item) => item.copy?.status === 'AVAILABLE'),
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

export function mapReservation(reservation) {
  return {
    id: `RS-${reservation.reservationId}`,
    reservationId: reservation.reservationId,
    copyId: reservation.copyId,
    title: reservation.copy?.title || `Bản sao #${reservation.copyId}`,
    author: reservation.copy?.author || '-',
    barcode: reservation.copy?.barcode || '-',
    location: reservation.copy?.location || '-',
    copyStatus: reservation.copy?.status || null,
    member: reservation.member?.fullName || reservation.member?.username || reservation.member?.email || `Thành viên #${reservation.userId}`,
    username: reservation.member?.username || null,
    email: reservation.member?.email || null,
    reservedDate: reservation.reservedAt || reservation.createdAt,
    queue: reservation.queuePosition || 1,
    status: statusToUi(reservation.status, reservation),
    deadline: reservation.expiresAt,
  };
}

export function objectToChart(object = {}, labelTransform = (label) => label) {
  return Object.entries(object).map(([label, value]) => ({ label: labelTransform(label), value: Number(value) || 0 }));
}
