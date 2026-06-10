function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function makeInMemoryReportDependencies(authState, borrowingState) {
  const reportRepository = {
    async getBorrowingReport(filters = {}) {
      const requests = borrowingState.borrowRequests.filter((request) => {
        if (filters.status && request.status !== filters.status) {
          const hasMatchingDetail = borrowingState.borrowDetails.some(
            (detail) => detail.requestId === request.requestId && detail.status === filters.status
          );

          if (!hasMatchingDetail) {
            return false;
          }
        }

        if (filters.userId && request.userId !== Number(filters.userId)) {
          return false;
        }

        return true;
      });

      const details = borrowingState.borrowDetails.filter((detail) => {
        if (filters.status && detail.status !== filters.status) {
          return false;
        }

        if (filters.userId && detail.userId !== Number(filters.userId)) {
          return false;
        }

        if (filters.bookId) {
          const copy = borrowingState.copies.find((item) => item.copyId === detail.copyId);
          if (!copy || copy.bookId !== Number(filters.bookId)) {
            return false;
          }
        }

        return true;
      });

      const borrowCountByPeriod = {};
      const topBorrowedBooks = {};

      for (const detail of details) {
        const dateKey = (detail.borrowDate || detail.createdAt || new Date()).toISOString().slice(0, 10);
        borrowCountByPeriod[dateKey] = (borrowCountByPeriod[dateKey] || 0) + 1;

        const copy = borrowingState.copies.find((item) => item.copyId === detail.copyId);
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
          overdueLoans: details.filter((detail) => detail.status === 'OVERDUE').length,
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
        topBorrowedBooks: Object.values(topBorrowedBooks).sort(
          (left, right) => right.borrowCount - left.borrowCount
        ),
      };
    },

    async getInventoryReport(filters = {}) {
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

        return true;
      });

      const categoryCounts = books.reduce((accumulator, book) => {
        const categoryName = `Category-${book.categoryId}`;
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
        lowAvailabilityBooks: books.filter((book) => {
          const bookCopies = borrowingState.copies.filter((copy) => copy.bookId === book.bookId);
          const availableCount = bookCopies.filter((copy) => copy.status === 'AVAILABLE').length;
          return bookCopies.length > 0 && availableCount === 0;
        }),
      };
    },

    async getUserStatistics(filters = {}) {
      const users = authState.users.filter((user) => {
        if (filters.status && user.status !== filters.status) {
          return false;
        }

        if (filters.fromDate && new Date(user.createdAt) < new Date(filters.fromDate)) {
          return false;
        }

        if (filters.toDate && new Date(user.createdAt) > new Date(filters.toDate)) {
          return false;
        }

        if (filters.roleId) {
          const roles = authState.rolesByUserId.get(user.userId) || [];
          const roleNames = roles.map((role) => String(role).toUpperCase());
          const requiredRole = Number(filters.roleId) === 1 ? 'ADMIN' : String(filters.roleId);
          if (!roleNames.includes(requiredRole) && filters.roleId !== 0) {
            return false;
          }
        }

        return true;
      });

      const usersByStatus = users.reduce((accumulator, user) => {
        accumulator[user.status] = (accumulator[user.status] || 0) + 1;
        return accumulator;
      }, {});

      const usersByRole = {};
      for (const roles of authState.rolesByUserId.values()) {
        for (const role of roles) {
          usersByRole[role] = (usersByRole[role] || 0) + 1;
        }
      }

      const members = users.filter((user) => borrowingState.memberStatuses.get(user.userId) === 'APPROVED');

      return {
        totals: {
          users: users.length,
          members: members.length,
        },
        usersByStatus,
        usersByRole,
        membersByStatus: members.reduce((accumulator, user) => {
          const memberStatus = borrowingState.memberStatuses.get(user.userId) || 'UNKNOWN';
          accumulator[memberStatus] = (accumulator[memberStatus] || 0) + 1;
          return accumulator;
        }, {}),
        newMembersByPeriod: members.reduce((accumulator, user) => {
          const periodKey = new Date(user.createdAt).toISOString().slice(0, 10);
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

module.exports = {
  makeInMemoryReportDependencies,
};
