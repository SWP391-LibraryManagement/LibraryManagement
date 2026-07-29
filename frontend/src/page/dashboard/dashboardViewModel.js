export function buildMemberSummary(borrowing = {}, reservations = {}) {
  const borrowRows = Array.isArray(borrowing.borrowings) ? borrowing.borrowings : [];
  const reservationRows = reservations.reservations || [];
  return {
    activeBorrows: borrowRows.filter((row) => ['APPROVED', 'BORROWED'].includes(row.status)).length,
    completedBorrows: borrowRows.filter((row) => ['COMPLETED', 'RETURNED'].includes(row.status)).length,
    activeReservations: reservationRows.filter((row) => !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(row.status)).length,
  };
}

const OPERATIONS_SUMMARY_KEYS = [
  'pendingBorrowRequests',
  'activeLoans',
  'overdueLoans',
  'openReservations',
  'availableCopies',
  'lowStockBooks',
];

function canonicalKpiValue(value) {
  return Number.isInteger(value) && value >= 0 ? value : null;
}

export function buildStaffSummary(snapshot = {}) {
  return {
    ...Object.fromEntries(
      OPERATIONS_SUMMARY_KEYS.map((key) => [key, canonicalKpiValue(snapshot?.[key])]),
    ),
    generatedAt: typeof snapshot?.generatedAt === 'string' ? snapshot.generatedAt : null,
  };
}
