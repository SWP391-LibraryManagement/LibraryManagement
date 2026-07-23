function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

const ACTUAL_LOAN_DETAIL_STATUSES = new Set(['BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);
const BORROW_DETAIL_STATUSES = new Set(['REQUESTED', 'BORROWED', 'RETURNED', 'LOST', 'DAMAGED', 'OVERDUE']);
const COPY_STATUSES = new Set(['AVAILABLE', 'BORROWED', 'RESERVED', 'DAMAGED', 'LOST', 'INACTIVE']);
const USER_STATUSES = new Set(['ACTIVE', 'INACTIVE', 'LOCKED']);
const MEMBERSHIP_STATUSES = new Set(['PENDING', 'APPROVED', 'REJECTED', 'INACTIVE']);
const ROLE_STATUSES = new Set(['ADMIN', 'LIBRARIAN', 'MEMBER', 'GUEST']);

function normalizeStatus(value, allowedStatuses) {
  if (value == null) return null;
  const normalized = String(value).toUpperCase();
  return allowedStatuses.has(normalized) ? normalized : 'UNKNOWN';
}

function escapeRegexLiteral(character) {
  return character.replace(/[\\^$.*+?()[\]{}|]/g, '\\$&');
}

function sqlLikePatternToRegExp(pattern) {
  let source = '^';

  for (let index = 0; index < pattern.length; index += 1) {
    const character = pattern[index];
    if (character === '%') {
      source += '.*';
    } else if (character === '_') {
      source += '.';
    } else if (character === '[') {
      const closingIndex = pattern.indexOf(']', index + 1);
      const negated = pattern[index + 1] === '^';
      const contentStart = index + (negated ? 2 : 1);
      if (closingIndex > contentStart) {
        const classBody = pattern
          .slice(contentStart, closingIndex)
          .replace(/\\/g, '\\\\')
          .replace(/\^/g, '\\^');
        source += `[${negated ? '^' : ''}${classBody}]`;
        index = closingIndex;
      } else {
        source += '\\[';
      }
    } else {
      source += escapeRegexLiteral(character);
    }
  }

  return new RegExp(`${source}$`, 'iu');
}

function matchesSqlLike(value, query) {
  const pattern = `%${String(query).trim()}%`;
  return sqlLikePatternToRegExp(pattern).test(String(value ?? ''));
}

function toDateKey(value) {
  if (!value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date.toISOString().slice(0, 10);
}

function toLibraryDateKey(value = new Date()) {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Ho_Chi_Minh',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).formatToParts(new Date(value));
  const values = Object.fromEntries(parts.map((part) => [part.type, part.value]));
  return `${values.year}-${values.month}-${values.day}`;
}

function buildReport(metrics, rows, filters = {}) {
  const page = Number(filters.page) || 1;
  const limit = Number(filters.limit) || 20;
  const offset = (page - 1) * limit;
  return { metrics, rows: rows.slice(offset, offset + limit), page, limit, totalRows: rows.length };
}

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
      const today = toLibraryDateKey();
      // Mirror getBorrowRows: filters apply to each request/detail joined row.
      const rows = borrowingState.borrowRequests.flatMap((request) => {
        if (filters.userId && request.userId !== Number(filters.userId)) {
          return [];
        }
        const details = borrowingState.borrowDetails.filter(
          (detail) => detail.requestId === request.requestId
        );
        const joinedDetails = details.length ? details : [null];

        return joinedDetails.flatMap((detail) => {
          if (!detail || !matchesDateRange(detail.borrowDate, filters)) {
            return [];
          }
          const copy = detail
            ? borrowingState.copies.find((item) => item.copyId === detail.copyId)
            : null;

          const detailStatus = normalizeStatus(detail?.status, BORROW_DETAIL_STATUSES);
          if (filters.status === 'OVERDUE') {
            const dueDateKey = toDateKey(detail?.dueDate);
            if (detailStatus !== 'BORROWED' || !dueDateKey || dueDateKey >= today) {
              return [];
            }
          } else if (filters.status
            && request.status !== filters.status
            && detailStatus !== filters.status) {
              return [];
          }
          if (filters.bookId && (!copy || copy.bookId !== Number(filters.bookId))) {
            return [];
          }

          return [{ request, detail, copy }];
        });
      });
      const details = rows.map((row) => row.detail);

      const borrowCountByPeriod = {};
      const topBorrowedBooks = {};

      for (const { request, detail, copy } of rows.filter((row) => row.detail)) {
        const status = normalizeStatus(detail.status, BORROW_DETAIL_STATUSES);
        if (!ACTUAL_LOAN_DETAIL_STATUSES.has(status)) {
          continue;
        }

        const dateKey = toDateKey(detail.borrowDate);
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

      const detailedRows = [...rows]
        .sort(
          (left, right) =>
            new Date(right.detail?.borrowDate || 0).getTime() - new Date(left.detail?.borrowDate || 0).getTime() ||
            right.detail.borrowDetailId - left.detail.borrowDetailId
        )
        .map(({ request, detail, copy }) => {
          const rawStatus = normalizeStatus(detail.status, BORROW_DETAIL_STATUSES);
          const dueDateKey = detail.dueDate
            ? new Date(detail.dueDate).toISOString().slice(0, 10)
            : null;
          return {
            borrowDetailId: detail.borrowDetailId,
            requestId: request.requestId,
            userId: request.userId,
            bookId: copy?.bookId || null,
            copyId: detail.copyId,
            status:
              rawStatus === 'BORROWED' && dueDateKey && dueDateKey < today
                ? 'OVERDUE'
                : rawStatus,
            borrowDate: toDateKey(detail.borrowDate),
            dueDate: toDateKey(detail.dueDate),
            returnDate: toDateKey(detail.returnDate),
          };
        });

      return buildReport(
        {
          activeLoans: details.filter(
            (detail) => normalizeStatus(detail.status, BORROW_DETAIL_STATUSES) === 'BORROWED'
          ).length,
          overdueLoans: detailedRows.filter((row) => row.status === 'OVERDUE').length,
          borrowCountByPeriod,
          topBorrowedBooks: Object.values(topBorrowedBooks)
            .sort(
              (left, right) =>
                right.borrowCount - left.borrowCount ||
                String(left.title || '').localeCompare(String(right.title || '')) ||
                left.bookId - right.bookId
            )
            .slice(0, 10),
        },
        detailedRows,
        filters
      );
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

      const availabilityByBookId = new Map(
        books.map((book) => [
          book.bookId,
          borrowingState.copies.filter(
            (copy) => copy.bookId === book.bookId && normalizeStatus(copy.status, COPY_STATUSES) === 'AVAILABLE'
          ).length,
        ])
      );
      const detailedRows = copies
        .map((copy) => {
          const book = borrowingState.books.find((item) => item.bookId === copy.bookId);
          return {
            bookId: copy.bookId,
            title: book?.title || null,
            copyId: copy.copyId,
            barcode: copy.barcode || null,
            location: copy.location || null,
            status: normalizeStatus(copy.status, COPY_STATUSES),
            effectiveAvailability: availabilityByBookId.get(copy.bookId) || 0,
          };
        })
        .sort(
          (left, right) =>
            String(left.title || '').localeCompare(String(right.title || '')) ||
            left.bookId - right.bookId ||
            left.copyId - right.copyId
        );

      return buildReport(
        {
          totalBooks: books.length,
          totalCopies: copies.length,
          copiesByStatus: copies.reduce((accumulator, copy) => {
            const status = normalizeStatus(copy.status, COPY_STATUSES);
            accumulator[status] = (accumulator[status] || 0) + 1;
            return accumulator;
          }, {}),
          lowStockBooks: books
            .map((book) => ({
              bookId: book.bookId,
              title: book.title || null,
              effectiveAvailability: availabilityByBookId.get(book.bookId) || 0,
            }))
            .filter((book) => book.effectiveAvailability <= 2),
        },
        detailedRows,
        filters
      );
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
        if (filters.q) {
          const searchableValues = [
            user.userId,
            user.status,
            memberStatus,
            ...roles,
          ];
          if (!searchableValues.some((value) => matchesSqlLike(value, filters.q))) {
            return [];
          }
        }

        const selectedRoles = filters.roleId
          ? roles.filter((role) => roleIdForName(role) === Number(filters.roleId))
          : roles;

        if (filters.roleId && !selectedRoles.length) {
          return [];
        }

        return [{
          ...user,
          status: normalizeStatus(user.status, USER_STATUSES),
          memberStatus: normalizeStatus(memberStatus, MEMBERSHIP_STATUSES),
          memberApprovedAt: borrowingState.memberApprovedAt.get(user.userId) || null,
          roles: selectedRoles.map((role) => normalizeStatus(role, ROLE_STATUSES)),
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

      const historicallyApprovedMembers = users.filter((user) => user.memberApprovedAt);
      const membershipByStatus = users
        .filter((user) => user.memberStatus)
        .reduce((accumulator, user) => {
          accumulator[user.memberStatus] = (accumulator[user.memberStatus] || 0) + 1;
          return accumulator;
        }, {});
      const newMembersByPeriod = historicallyApprovedMembers.reduce((accumulator, user) => {
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
        }, {});
      const detailedRows = users
        .map((user) => ({
          userId: user.userId,
          status: user.status,
          roles: [...user.roles].sort(),
          membershipStatus: user.memberStatus,
          createdAt: user.createdAt || null,
          approvedAt: user.memberApprovedAt || null,
        }))
        .sort((left, right) => left.userId - right.userId);

      return buildReport(
        {
          totalMembers: users.filter((user) => user.roles.includes('MEMBER')).length,
          usersByStatus,
          usersByRole,
          membershipByStatus,
          newMembersByPeriod,
        },
        detailedRows,
        filters
      );
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
