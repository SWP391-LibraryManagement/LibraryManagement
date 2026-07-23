export function getHomeBookAction({ book, isLoggedIn, roles = [] }) {
  // @spec FR-FE01-014
  const bookId = Number(book?.bookId);
  const isAvailable = book?.availabilityStatus === 'AVAILABLE';
  const query = Number.isInteger(bookId) && bookId > 0 ? `?bookId=${bookId}` : '';

  if (!isLoggedIn) {
    return {
      label: isAvailable ? 'Đăng nhập để mượn' : 'Đăng nhập để đặt chỗ',
      path: '/login',
      kind: 'login',
    };
  }

  // FE11 accounts may hold multiple roles. Keep the same staff-first precedence
  // used by the dashboard and navigation so staff never enter Member-only flows.
  if (roles.includes('ADMIN') || roles.includes('LIBRARIAN')) {
    return isAvailable
      ? { label: 'Mở quản lý sách', path: `/librarian/books${query}`, kind: 'manage' }
      : { label: 'Kiểm tra bản sao', path: `/librarian/inventory${query}`, kind: 'manage' };
  }

  if (roles.includes('MEMBER')) {
    return isAvailable
      ? { label: 'Mượn sách này', path: `/borrowing/new${query}`, kind: 'borrow' }
      : { label: 'Đặt chỗ sách này', path: `/reservations/mine${query}`, kind: 'reserve' };
  }

  return { label: 'Về trang chủ', path: '/home', kind: 'home' };
}
