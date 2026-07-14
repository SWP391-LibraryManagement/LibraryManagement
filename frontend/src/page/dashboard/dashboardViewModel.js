export function buildMemberSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    activeBorrows: borrowRows.filter((row) => ['APPROVED', 'BORROWED'].includes(row.status)).length,
    completedBorrows: borrowRows.filter((row) => ['COMPLETED', 'RETURNED'].includes(row.status)).length,
    activeReservations: reservationRows.filter((row) => !['CANCELLED', 'EXPIRED', 'COMPLETED'].includes(row.status)).length,
  };
}

export function buildStaffSummary(borrowing = {}, reservations = {}) {
  const borrowRows = borrowing.borrowRequests || [];
  const reservationRows = reservations.reservations || [];
  return {
    pendingBorrowRequests: borrowRows.filter((row) => row.status === 'PENDING').length,
    waitingReservations: reservationRows.filter((row) => row.status === 'WAITING').length,
    readyReservations: reservationRows.filter((row) => row.status === 'READY').length,
  };
}
