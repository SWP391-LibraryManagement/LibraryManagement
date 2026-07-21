export const APP_NAV_GROUPS = [
  {
    label: 'Thành viên',
    roles: ['MEMBER'],
    items: [
      { key: 'membership', label: 'Đăng ký hội viên', path: '/membership' },
      { key: 'borrow-request', label: 'Mượn sách', path: '/borrowing/new' },
      { key: 'borrowing-history', label: 'Lịch sử mượn', path: '/borrowing/history' },
      { key: 'my-reservations', label: 'Đặt chỗ của tôi', path: '/reservations/mine' },
    ],
  },
  {
    label: 'Thủ thư',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrow-requests-admin', label: 'Yêu cầu mượn', path: '/librarian/borrow-requests' },
      { key: 'process-returns', label: 'Xử lý trả sách', path: '/librarian/returns' },
      { key: 'reservations-librarian', label: 'Quản lý đặt chỗ', path: '/librarian/reservations' },
      { key: 'member-details', label: 'Chi tiết thành viên', path: '/librarian/members' },
      { key: 'membership-review', label: 'Duyệt hội viên', path: '/membership' },
      { key: 'book-management', label: 'Quản lý sách', path: '/librarian/books' },
      { key: 'inventory-management', label: 'Quản lí kho', path: '/librarian/inventory' },
      { key: 'fine-management', label: 'Quản lý tiền phạt', path: '/librarian/fines' },
    ],
  },
  {
    label: 'Báo cáo',
    roles: ['LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'borrowing-report', label: 'Báo cáo mượn sách', path: '/reports/borrowing' },
      { key: 'inventory-report', label: 'Báo cáo tồn kho', path: '/reports/inventory' },
      { key: 'user-statistics', label: 'Thống kê người dùng', path: '/reports/users' },
    ],
  },
  {
    label: 'Tài khoản',
    roles: ['MEMBER', 'LIBRARIAN', 'ADMIN'],
    items: [
      { key: 'profile', label: 'Thông tin cá nhân', path: '/profile' },
    ],
  },
];

const HOME_ITEM = { key: 'home', label: 'Tổng quan', path: '/home' };
const LIBRARY_HOME_ITEM = { key: 'library-home', label: 'Thư viện', path: '/homepage' };

export function getVisibleNavigation(roles = []) {
  const isStaff = roles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role));
  const items = APP_NAV_GROUPS
    .filter((group) => group.label !== 'Thành viên' || !isStaff)
    .filter((group) => group.roles.some((role) => roles.includes(role)))
    .flatMap((group) => group.items);
  const canOpenLibraryHome = roles.some((role) => ['MEMBER', 'LIBRARIAN', 'ADMIN'].includes(role));
  const libraryHomeItem = roles.includes('MEMBER') && !roles.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role))
    ? { ...LIBRARY_HOME_ITEM, label: 'Home' }
    : LIBRARY_HOME_ITEM;
  return [
    ...(canOpenLibraryHome ? [libraryHomeItem] : []),
    HOME_ITEM,
    ...items,
  ];
}

export function getActiveNavigationKey(pathname) {
  return [LIBRARY_HOME_ITEM, HOME_ITEM, ...APP_NAV_GROUPS.flatMap((group) => group.items)]
    .find((item) => item.path === pathname)?.key || null;
}

export function getDashboardAudience(roles = []) {
  if (roles.includes('ADMIN') || roles.includes('LIBRARIAN')) return 'staff';
  if (roles.includes('MEMBER')) return 'member';
  return 'guest';
}
