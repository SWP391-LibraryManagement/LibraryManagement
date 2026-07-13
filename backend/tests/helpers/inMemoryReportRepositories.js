function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const ACTUAL_LOAN_DETAIL_STATUSES = new Set(['BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);

function matchesDateRange(value, filters = {}) {
  if (!filters.fromDate && !filters.toDate) {
    return true;
  }
  if (!value) {
    return false;
  }

  const dateKey = new Date(value).toISOString().slice(0, 10);
  return (!filters.fromDate || dateKey >= filters.fromDate)
    && (!filters.toDate || dateKey <= filters.toDate);
}

function makeInMemoryReportDependencies(authState, borrowingState) {
  const reportRepository = {
    async getBorrowingReport(filters = {}) {
      // Mirror getBorrowRows: filters apply to each request/detail joined row.
      const rows = borrowingState.borrowRequests.flatMap((request) => {
        if (filters.userId && request.userId !== Number(filters.userId)) {
          return [];
        }
        if (!matchesDateRange(request.requestDate || request.createdAt, filters)) {
          return [];
        }

        const details = borrowingState.borrowDetails.filter(
          (detail) => detail.requestId === request.requestId
        );
        const joinedDetails = details.length ? details : [null];

        return joinedDetails.flatMap((detail) => {
          const copy = detail
            ? borrowingState.copies.find((item) => item.copyId === detail.copyId)
            : null;

          if (filters.status
            && request.status !== filters.status
            && detail?.status !== filters.status) {
            return [];
          }
          if (filters.bookId && (!copy || copy.bookId !== Number(filters.bookId))) {
            return [];
          }

          return [{ request, detail, copy }];
        });
      });
      const details = rows.filter((row) => row.detail).map((row) => row.detail);
      const requests = Array.from(
        new Map(rows.map((row) => [row.request.requestId, row.request])).values()
      );

      const borrowCountByPeriod = {};
      const topBorrowedBooks = {};

      for (const { request, detail, copy } of rows.filter((row) => row.detail)) {
        if (!ACTUAL_LOAN_DETAIL_STATUSES.has(detail.status)) {
          continue;
        }

        const periodSource = detail.borrowDate || request.requestDate || request.createdAt;
        const dateKey = periodSource ? new Date(periodSource).toISOString().slice(0, 10) : null;
        if (!dateKey) {
          continue;
        }
        borrowCountByPeriod[dateKey] = (borrowCountByPeriod[dateKey] || 0) + 1;

        if (copy) {
          topBorrowedBooks[copy.bookId] = topBorrowedBooks[copy.bookId] || {
            bookId: copy.bookId,
            title: borrowingState.books.find((book) => book.bookId === copy.bookId)?.title || null,
            borrowCount: 0,
          };
          topBorrowedBooks[copy.bookId].borrowCount += 1;
        }
      }

      return {
        totals: {
          requests: new Set(requests.map((request) => request.requestId)).size,
          details: details.length,
          activeLoans: details.filter((detail) => detail.status === 'BORROWED').length,
          overdueLoans: details.filter(
            (detail) => detail.status === 'OVERDUE'
              || (detail.status === 'BORROWED' && detail.dueDate && new Date(detail.dueDate) < new Date())
          ).length,
        },
        requestStatusCounts: requests.reduce((accumulator, request) => {
          accumulator[request.status] = (accumulator[request.status] || 0) + 1;
          return accumulator;
        }, {}),
        detailStatusCounts: details.reduce((accumulator, detail) => {
          accumulator[detail.status] = (accumulator[detail.status] || 0) + 1;
          return accumulator;
        }, {}),
        borrowCountByPeriod,
        topBorrowedBooks: Object.values(topBorrowedBooks)
          .sort((left, right) => right.borrowCount - left.borrowCount)
          .slice(0, 5),
      };
    },

    async getInventoryReport(filters = {}) {
      const categoryNameById = new Map(
        (borrowingState.categories || []).map((category) => [category.categoryId, category.categoryName])
      );
      const resolveCategoryName = (book) => categoryNameById.get(book.categoryId) || null;
      const hasCopyFilters = Boolean(filters.status || filters.location);
      const copies = borrowingState.copies.filter((copy) => {
        if (filters.categoryId) {
          const book = borrowingState.books.find((item) => item.bookId === copy.bookId);
          if (!book || book.categoryId !== Number(filters.categoryId)) {
            return false;
          }
        }

        if (filters.bookId && copy.bookId !== Number(filters.bookId)) {
          return false;
        }

        if (filters.status && copy.status !== filters.status) {
          return false;
        }

        if (filters.location && copy.location !== filters.location) {
          return false;
        }

        return true;
      });

      const books = borrowingState.books.filter((book) => {
        if (filters.categoryId && book.categoryId !== Number(filters.categoryId)) {
          return false;
        }

        if (filters.bookId && book.bookId !== Number(filters.bookId)) {
          return false;
        }

        if (hasCopyFilters && !copies.some((copy) => copy.bookId === book.bookId)) {
          return false;
        }

        return true;
      });

      const categoryCounts = books.reduce((accumulator, book) => {
        const categoryName = resolveCategoryName(book) || 'UNKNOWN';
        accumulator[categoryName] = (accumulator[categoryName] || 0) + 1;
        return accumulator;
      }, {});

      const copyStatusCounts = copies.reduce((accumulator, copy) => {
        accumulator[copy.status] = (accumulator[copy.status] || 0) + 1;
        return accumulator;
      }, {});

      return {
        totals: {
          books: books.length,
          copies: copies.length,
        },
        copyStatusCounts,
        categoryCounts,
        lowAvailabilityBooks: books
          .map((book) => {
            const bookCopies = borrowingState.copies.filter((copy) => copy.bookId === book.bookId);
            return {
              ...book,
              categoryName: resolveCategoryName(book),
              copies: bookCopies.map((copy) => ({
                copyId: copy.copyId,
                status: copy.status || null,
                location: copy.location || null,
              })),
              totalCopies: bookCopies.length,
              availableCopies: bookCopies.filter((copy) => copy.status === 'AVAILABLE').length,
            };
          })
          .filter((book) => book.availableCopies <= 2),
      };
    },

    async getUserStatistics(filters = {}) {
      const users = authState.users.flatMap((user) => {
        if (filters.status && user.status !== filters.status) {
          return [];
        }
        const memberStatus = borrowingState.memberStatuses.get(user.userId) || null;
        if (filters.membershipStatus && memberStatus !== filters.membershipStatus) {
          return [];
        }

        const roles = authState.rolesByUserId.get(user.userId) || [];
        const selectedRoles = filters.roleId
          ? roles.filter((role) => roleIdForName(role) === Number(filters.roleId))
          : roles;

        if (filters.roleId && !selectedRoles.length) {
          return [];
        }

        return [{
          ...user,
          memberStatus,
          memberApprovedAt: borrowingState.memberApprovedAt.get(user.userId) || null,
          roles: selectedRoles.map((role) => String(role).toUpperCase()),
        }];
      });

      const usersByStatus = users.reduce((accumulator, user) => {
        accumulator[user.status] = (accumulator[user.status] || 0) + 1;
        return accumulator;
      }, {});

      const usersByRole = {};
      for (const user of users) {
        for (const role of user.roles) {
          usersByRole[role] = (usersByRole[role] || 0) + 1;
        }
      }

      const members = users.filter((user) => user.memberStatus === 'APPROVED');

      return {
        totals: {
          users: users.length,
          members: members.length,
        },
        usersByStatus,
        usersByRole,
        membersByStatus: users.filter((user) => user.memberStatus).reduce((accumulator, user) => {
          accumulator[user.memberStatus] = (accumulator[user.memberStatus] || 0) + 1;
          return accumulator;
        }, {}),
        newMembersByPeriod: members.reduce((accumulator, user) => {
          const approvedAt = user.memberApprovedAt;
          if (!approvedAt) {
            return accumulator;
          }

          const periodKey = new Date(approvedAt).toISOString().slice(0, 10);
          if (filters.fromDate && periodKey < filters.fromDate) {
            return accumulator;
          }
          if (filters.toDate && periodKey > filters.toDate) {
            return accumulator;
          }

          accumulator[periodKey] = (accumulator[periodKey] || 0) + 1;
          return accumulator;
        }, {}),
      };
    },
  };

  return {
    reportRepository,
    state: {
      authState: clone(authState),
      borrowingState: clone(borrowingState),
    },
  };
}

function roleIdForName(role) {
  return {
    ADMIN: 1,
    LIBRARIAN: 2,
    MEMBER: 3,
    GUEST: 4,
  }[String(role).toUpperCase()];
}

module.exports = {
  makeInMemoryReportDependencies,
};
