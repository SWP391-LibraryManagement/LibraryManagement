// @spec NFR-FE07-UX-001
const BORROWING_ERROR_MESSAGES = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới gửi được yêu cầu mượn sách. Hãy đăng nhập bằng tài khoản thành viên.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc quản trị viên mới được thực hiện thao tác này.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác này.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh email hoặc liên hệ thủ thư hoặc quản trị viên.',
  ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh email hoặc liên hệ thủ thư hoặc quản trị viên.',
  MEMBER_NOT_FOUND: 'Không tìm thấy hồ sơ thành viên được yêu cầu.',
  UNPAID_FINE_BLOCKS_BORROWING: 'Bạn còn khoản phạt chưa thanh toán nên chưa thể mượn hoặc gia hạn sách.',
  OVERDUE_LOAN_BLOCKS_BORROWING: 'Bạn còn sách quá hạn nên chưa thể mượn hoặc gia hạn sách.',
  BORROW_LIMIT_EXCEEDED: 'Bạn đã đạt giới hạn 5 bản sao đang mượn, nên chưa thể mượn thêm.',
  BORROW_DAILY_LIMIT_EXCEEDED: 'Bạn đã đạt giới hạn mượn sách trong ngày theo trạng thái hội viên.',
  COPY_NOT_AVAILABLE: 'Bản sao sách này hiện không khả dụng. Vui lòng chọn bản sao khác.',
  RESERVATION_QUEUE_PRIORITY: 'Bản sao này đang có hàng đợi đặt chỗ. Thủ thư cần xử lý hàng đợi trước khi duyệt mượn.',
  RESERVATION_STATE_CONFLICT: 'Trạng thái giữ chỗ vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  DUPLICATE_COPY_IN_REQUEST: 'Không thể gửi trùng cùng một bản sao sách trong một yêu cầu mượn.',
  COPY_IDS_REQUIRED: 'Vui lòng chọn ít nhất một bản sao sách để gửi yêu cầu mượn.',
  RESERVATION_BLOCKS_RENEWAL: 'Không thể gia hạn vì thành viên khác đang có quyền ưu tiên đặt chỗ bản sao này.',
  BORROW_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu mượn sách này.',
  BORROW_REQUEST_NOT_PENDING: 'Chỉ yêu cầu đang chờ xử lý mới có thể được duyệt hoặc từ chối.',
  BORROW_DETAIL_NOT_FOUND: 'Không tìm thấy lượt mượn sách này.',
  BORROW_DETAIL_NOT_BORROWED: 'Chỉ sách đang được mượn mới có thể trả hoặc gia hạn.',
  INVALID_RETURN_DATE: 'Ngày trả phải nằm trong khoảng từ ngày mượn đến ngày hiện tại.',
  BOOK_INACTIVE: 'Sách này đã ngừng phục vụ nên không thể mượn.',
  RENEWAL_LIMIT_REACHED: 'Sách này đã được gia hạn một lần và không thể gia hạn thêm.',
  BORROW_DETAIL_OVERDUE: 'Sách đã quá hạn nên không thể gia hạn.',
  BORROW_DETAIL_OWNER_REQUIRED: 'Bạn chỉ có thể gia hạn sách do chính mình mượn.',
};

const RESERVATION_ERROR_MESSAGES = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc quản trị viên mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư hoặc quản trị viên.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_AVAILABLE: 'Bản sao này đang sẵn có. Vui lòng mượn sách thay vì đặt chỗ.',
  RESERVATION_NOT_ALLOWED: 'Không thể đặt chỗ bản sao ở trạng thái hiện tại.',
  DUPLICATE_ACTIVE_RESERVATION: 'Bạn đã có một lượt đặt chỗ đang hoạt động cho bản sao này.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

const MEMBERSHIP_ERROR_MESSAGES = {
  MEMBERSHIP_APPLICATION_PENDING: 'Bạn đã có một đơn đăng ký đang chờ duyệt.',
  MEMBERSHIP_ALREADY_APPROVED: 'Tài khoản này đã là hội viên được duyệt.',
  MEMBERSHIP_APPLICATION_NOT_PENDING: 'Đơn đăng ký này không còn ở trạng thái chờ duyệt.',
  MEMBERSHIP_APPLICATION_NOT_FOUND: 'Không tìm thấy đơn đăng ký hội viên.',
  USER_ACCOUNT_INACTIVE: 'Tài khoản chưa hoạt động nên chưa thể đăng ký hội viên.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc quản trị viên mới được xét duyệt đơn hội viên.',
  REJECTION_REASON_REQUIRED: 'Lý do từ chối là bắt buộc.',
  REJECTION_REASON_TOO_LONG: 'Lý do từ chối không được vượt quá 500 ký tự.',
};

const BOOK_ERROR_MESSAGES = {
  STALE_BOOK_STATE: 'Dữ liệu sách đã thay đổi bởi người khác. Vui lòng tải lại danh sách rồi thử lại.',
  INVALID_BOOK_STATUS_TRANSITION: 'Trạng thái sách vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
};

const INVENTORY_ERROR_MESSAGES = {
  STALE_COPY_STATE: 'Dữ liệu bản sao đã thay đổi. Vui lòng tải lại rồi thử lại.',
  RESERVATION_STATE_CONFLICT: 'Bản sao đang thuộc hàng đợi giữ chỗ. Hãy xử lý qua FE08 trước.',
  ACTIVE_BORROW_CONFLICT: 'Bản sao đang được mượn. Hãy xử lý trả sách qua FE07 trước.',
  INACTIVE_PARENT_BOOK: 'Đầu sách đang ngừng hoạt động nên không thể đưa bản sao về trạng thái khả dụng.',
};

export function getLibraryFeatureErrorMessage(error, fallback = 'Không thể tải dữ liệu từ backend.') {
  if (!error.response) {
    return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem dữ liệu này.';
  }

  return fallback;
}

export function getBorrowingErrorMessage(error, fallback = 'Không thể tải dữ liệu mượn sách.') {
  if (!error.response) {
    return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (BORROWING_ERROR_MESSAGES[code]) {
    return BORROWING_ERROR_MESSAGES[code];
  }

  if (error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem dữ liệu mượn sách này.';
  }

  return fallback;
}

export function getReservationErrorMessage(error, fallback = 'Không thể xử lý đặt chỗ.') {
  const code = error.response?.data?.error?.code;
  const shouldUseGenericMessage = !error.response || code === 'UNAUTHORIZED' || error.response?.status === 401;

  if (!shouldUseGenericMessage && RESERVATION_ERROR_MESSAGES[code]) {
    return RESERVATION_ERROR_MESSAGES[code];
  }

  return getLibraryFeatureErrorMessage(error, fallback);
}

export function getBookErrorMessage(error, fallback = 'Không thể xử lý yêu cầu quản lý sách.') {
  if (!error.response) return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  if (BOOK_ERROR_MESSAGES[code]) return BOOK_ERROR_MESSAGES[code];
  if (error.response?.status === 403) return 'Tài khoản hiện tại không có quyền quản lý sách.';
  return fallback;
}

export function getInventoryErrorMessage(error, fallback = 'Không thể xử lý dữ liệu kho sách.') {
  if (!error.response) return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  if (INVENTORY_ERROR_MESSAGES[code]) return INVENTORY_ERROR_MESSAGES[code];
  if (error.response?.status === 403) return 'Tài khoản hiện tại không có quyền quản lý kho sách.';
  return fallback;
}

export function getMembershipErrorMessage(error, fallback = 'Không thể xử lý dữ liệu hội viên.') {
  if (!error.response) {
    return 'Không kết nối được backend. Không thể xác nhận trạng thái hội viên.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (MEMBERSHIP_ERROR_MESSAGES[code]) {
    return MEMBERSHIP_ERROR_MESSAGES[code];
  }

  if (error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền thực hiện thao tác hội viên này.';
  }

  return fallback;
}

export function getReportErrorMessage(error, fallback = 'Không thể tải báo cáo.') {
  if (!error.response) {
    return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem báo cáo này.';
  }

  return getLibraryFeatureErrorMessage(error, fallback);
}
