export function getHomeBookAction({ book, isLoggedIn, roles = [] }) {
  // @spec FR-FE01-014, FR-FE01-020
  const bookId = Number(book?.bookId);
  const isAvailable = book?.availabilityStatus === 'AVAILABLE';
  const query = Number.isInteger(bookId) && bookId > 0 ? `?bookId=${bookId}` : '';

  if (!isLoggedIn) {
    return {
      label: isAvailable ? 'Đăng nhập để mượn' : 'Đăng nhập để đặt chỗ',
      path: '/login',
      kind: 'login',
      disabled: false,
    };
  }

  // FE11 persists exactly one role. Staff-first evaluation remains defensive for
  // stale legacy clients so staff never enter Member-only flows.
  if (roles.includes('ADMIN') || roles.includes('LIBRARIAN')) {
    return isAvailable
      ? { label: 'Mở quản lý sách', path: `/librarian/books${query}`, kind: 'manage', disabled: false }
      : { label: 'Kiểm tra bản sao', path: `/librarian/inventory${query}`, kind: 'manage', disabled: false };
  }

  if (roles.includes('MEMBER')) {
    if (book?.circulationAction === 'BORROW') {
      return { label: 'Mượn sách này', path: `/borrowing/new${query}`, kind: 'borrow', disabled: false };
    }
    if (book?.circulationAction === 'RESERVE') {
      return { label: 'Đặt chỗ sách này', path: `/reservations/mine${query}`, kind: 'reserve', disabled: false };
    }
    if (book?.circulationAction === 'WAIT') {
      return { label: 'Đang chờ thư viện xử lý', path: null, kind: 'wait', disabled: true };
    }
    return { label: 'Tạm chưa khả dụng', path: null, kind: 'unavailable', disabled: true };
  }

  return { label: 'Về trang chủ', path: '/home', kind: 'home', disabled: false };
}
