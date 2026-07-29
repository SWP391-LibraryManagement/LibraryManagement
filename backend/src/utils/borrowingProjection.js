function mapCopy(row) {
  if (!row || !row.CopyId) {
    return null;
  }

  return {
    copyId: row.CopyId,
    bookId: row.BookId,
    barcode: row.Barcode,
    status: row.CopyStatus,
    bookStatus: row.BookStatus,
    location: row.Location,
    title: row.Title,
    author: row.AuthorName,
  };
}

function mapBorrowability(row) {
  const copy = mapCopy(row);

  if (!copy) {
    return null;
  }

  return {
    ...copy,
    hasActiveReservation: Boolean(row.ActiveReservationId),
    notifiedReservationId: row.NotifiedReservationId || null,
    notifiedReservationUserId: row.NotifiedReservationUserId || null,
  };
}

function mapMember(row) {
  return {
    userId: row.UserId,
    username: row.Username,
    fullName: row.FullName,
    email: row.Email,
    phone: row.Phone,
    memberId: row.MemberId,
    status: row.UserStatus,
    hasMemberRole: Boolean(row.HasMemberRole),
  };
}

function toDateOnly(value) {
  return value ? new Date(value).toISOString().slice(0, 10) : null;
}

function toExclusiveNextDay(value) {
  const date = new Date(value);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
}

// @spec FR-FE07-029
function mapBorrowDetail(row) {
  if (!row || !row.BorrowDetailId) {
    return null;
  }

  return {
    borrowDetailId: row.BorrowDetailId,
    requestId: row.RequestId,
    userId: row.UserId,
    copyId: row.CopyId,
    borrowDate: toDateOnly(row.BorrowDate),
    dueDate: toDateOnly(row.DueDate),
    returnDate: toDateOnly(row.ReturnDate),
    renewalCount: row.RenewalCount,
    requestStatus: row.RequestStatus,
    status: row.DetailStatus,
    requestDate: row.RequestDate,
    approvedAt: row.ApprovedAt,
    rejectedAt: row.RejectedAt,
    processedAt: row.ProcessedAt,
    requestCreatedAt: row.RequestCreatedAt,
    requestUpdatedAt: row.RequestUpdatedAt,
    createdAt: row.DetailCreatedAt,
    updatedAt: row.DetailUpdatedAt,
    member: mapMember(row),
    copy: mapCopy(row),
  };
}

function mapBorrowRequests(rows) {
  const requestsById = new Map();

  for (const row of rows) {
    if (!requestsById.has(row.RequestId)) {
      requestsById.set(row.RequestId, {
        requestId: row.RequestId,
        userId: row.UserId,
        requestDate: row.RequestDate,
        status: row.RequestStatus,
        createdBy: row.CreatedBy,
        approvedBy: row.ApprovedBy,
        approvedAt: row.ApprovedAt,
        rejectedAt: row.RejectedAt,
        processedAt: row.ProcessedAt,
        createdAt: row.RequestCreatedAt,
        updatedAt: row.RequestUpdatedAt,
        member: mapMember(row),
        details: [],
      });
    }

    const detail = mapBorrowDetail(row);

    if (detail) {
      requestsById.get(row.RequestId).details.push(detail);
    }
  }

  return Array.from(requestsById.values());
}

module.exports = {
  mapBorrowability,
  mapBorrowDetail,
  mapBorrowRequests,
  toExclusiveNextDay,
};
