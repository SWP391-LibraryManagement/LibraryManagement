function normalizeStatus(value) {
  return String(value || '').toUpperCase();
}

function step(key, label, state, at) {
  return {
    key,
    label,
    state,
    at: at || null,
  };
}

// @spec BR-FE07-037, FR-FE07-043 - derive the journey from canonical states and timestamps only.
export function buildBorrowingJourney(row = {}) {
  const requestStatus = normalizeStatus(row.requestStatus);
  const detailStatus = normalizeStatus(row.rawStatus || row.status);
  const requestAt = row.requestDate || row.requestCreatedAt || row.createdAt || null;

  if (requestStatus === 'REJECTED') {
    return [
      step('requested', 'Đã gửi yêu cầu', 'complete', requestAt),
      step('rejected', 'Đã từ chối', 'current', row.rejectedAt || row.processedAt),
    ];
  }

  if (
    requestStatus === 'PENDING'
    || detailStatus === 'REQUESTED'
    || (!requestStatus && !detailStatus)
  ) {
    return [
      step('requested', 'Đã gửi yêu cầu', 'complete', requestAt),
      step('pending', 'Chờ duyệt', 'current', null),
    ];
  }

  const approvedAt = row.approvedAt || row.processedAt || null;
  const journey = [
    step('requested', 'Đã gửi yêu cầu', 'complete', requestAt),
    step('approved', 'Đã duyệt', 'complete', approvedAt),
  ];

  if (detailStatus === 'RETURNED') {
    return [
      ...journey,
      step('borrowed', 'Đang mượn', 'complete', row.borrowDate),
      step('returned', 'Đã trả', 'current', row.returnDate),
    ];
  }

  if (detailStatus === 'DAMAGED') {
    return [
      ...journey,
      step('borrowed', 'Đang mượn', 'complete', row.borrowDate),
      step('damaged', 'Đã trả - hư hỏng', 'current', row.returnDate),
    ];
  }

  if (detailStatus === 'LOST') {
    return [
      ...journey,
      step('borrowed', 'Đang mượn', 'complete', row.borrowDate),
      step('lost', 'Đã ghi nhận thất lạc', 'current', row.returnDate),
    ];
  }

  if (detailStatus === 'BORROWED' || detailStatus === 'OVERDUE') {
    return [
      ...journey,
      step(
        'borrowed',
        detailStatus === 'OVERDUE' ? 'Quá hạn' : 'Đang mượn',
        'current',
        row.borrowDate,
      ),
    ];
  }

  return [
    step('requested', 'Đã gửi yêu cầu', 'complete', requestAt),
    step('approved', 'Đã duyệt', 'current', approvedAt),
  ];
}
