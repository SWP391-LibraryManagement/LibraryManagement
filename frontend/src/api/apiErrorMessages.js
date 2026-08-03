// @spec FR-FE07-044, NFR-FE07-UX-001 - stale/blocker codes provide truthful reload or next-action guidance.
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
  COPY_NOT_AVAILABLE: 'Bản sao của yêu cầu không còn khả dụng. Hãy tải lại trạng thái; nếu bản sao đã được mượn, yêu cầu đang chờ này cần được từ chối với lý do rõ ràng.',
  COPY_PENDING_REQUEST_CONFLICT: 'Bản sao này đã thuộc một yêu cầu mượn đang chờ xử lý. Vui lòng tải lại và chọn bản sao khác.',
  BOOK_ALREADY_IN_BORROWING_WORKFLOW: 'Bạn đã có yêu cầu đang chờ hoặc đang mượn một bản của đầu sách này. Chỉ được tạo yêu cầu mới sau khi luồng hiện tại kết thúc.',
  BOOK_ALREADY_BORROWED_BY_MEMBER: 'Thành viên đang mượn một bản khác của đầu sách này nên yêu cầu không thể được duyệt.',
  BORROW_REQUEST_OWNER_NOT_MEMBER: 'Chủ yêu cầu không còn vai trò thành viên nên không thể duyệt. Hãy từ chối yêu cầu và ghi rõ lý do.',
  BORROW_REQUEST_OWNER_INACTIVE: 'Tài khoản chủ yêu cầu không còn hoạt động nên không thể duyệt. Hãy từ chối yêu cầu và ghi rõ lý do.',
  RESERVATION_QUEUE_PRIORITY: 'Bản sao này đang có hàng đợi đặt chỗ. Thủ thư cần xử lý hàng đợi trước khi duyệt mượn.',
  RESERVATION_STATE_CONFLICT: 'Trạng thái giữ chỗ vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này. Vui lòng tải lại dữ liệu và thử lại.',
  DUPLICATE_COPY_IN_REQUEST: 'Không thể gửi trùng cùng một bản sao sách trong một yêu cầu mượn.',
  DUPLICATE_BOOK_IN_REQUEST: 'Mỗi yêu cầu chỉ được chọn một bản sao của cùng một đầu sách.',
  COPY_IDS_REQUIRED: 'Vui lòng chọn ít nhất một bản sao sách để gửi yêu cầu mượn.',
  RESERVATION_BLOCKS_RENEWAL: 'Không thể gia hạn vì thành viên khác đang có quyền ưu tiên đặt chỗ bản sao này.',
  BORROW_REQUEST_NOT_FOUND: 'Không tìm thấy yêu cầu mượn sách này.',
  BORROW_REQUEST_NOT_PENDING: 'Chỉ yêu cầu đang chờ xử lý mới có thể được duyệt hoặc từ chối.',
  BORROW_DETAIL_NOT_FOUND: 'Không tìm thấy lượt mượn sách này.',
  BORROW_DETAIL_NOT_BORROWED: 'Chỉ sách đang được mượn mới có thể trả hoặc gia hạn.',
  BORROW_STATE_CONFLICT: 'Trạng thái lượt mượn hoặc bản sao vừa thay đổi. Vui lòng tải lại dữ liệu trước khi thử lại.',
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
  BOOK_ALREADY_BORROWED: 'Bạn đang mượn một bản của đầu sách này nên không thể đặt thêm.',
  ACTIVE_RESERVATION_LIMIT: 'Bạn đã đạt giới hạn 3 lượt đặt chỗ đang hoạt động.',
  RESERVATION_NOT_FOUND: 'Không tìm thấy lượt đặt chỗ này. Vui lòng tải lại dữ liệu.',
  RESERVATION_OWNER_REQUIRED: 'Bạn chỉ có thể hủy lượt đặt chỗ của chính mình.',
  RESERVATION_NOT_ACTIVE: 'Lượt đặt chỗ này không còn ở trạng thái cho phép thực hiện thao tác.',
  COPY_NOT_AVAILABLE: 'Bản sao chưa sẵn sàng để xử lý hàng đợi đặt chỗ.',
  COPY_MISMATCH: 'Bản sao được chọn không khớp với lượt đặt chỗ.',
  INVALID_ID: 'Mã đặt chỗ hoặc bản sao không hợp lệ.',
};

const MEMBERSHIP_ERROR_MESSAGES = {
  MEMBERSHIP_PROFILE_INCOMPLETE: 'Vui lòng hoàn tất họ tên, số điện thoại, ngày sinh và địa chỉ trước khi đăng ký hội viên.',
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
  BOOK_HAS_DEPENDENCIES: 'Không thể xóa sách đã có bản sao hoặc lịch sử mượn, trả, đặt chỗ liên quan.',
  STALE_BOOK_STATE: 'Dữ liệu sách đã thay đổi bởi người khác. Vui lòng tải lại danh sách rồi thử lại.',
  INVALID_BOOK_STATUS_TRANSITION: 'Trạng thái sách vừa thay đổi. Vui lòng tải lại dữ liệu và thử lại.',
};

// @spec NFR-FE09-SEC-003, BR-FE09-011..015 — fine-specific error codes mapped to Vietnamese copy.
const FINE_ERROR_MESSAGES = {
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc quản trị viên mới được thực hiện thao tác tiền phạt này.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác tiền phạt này.',
  FINE_NOT_FOUND: 'Không tìm thấy phiếu phạt. Vui lòng tải lại danh sách.',
  BORROW_DETAIL_NOT_FOUND: 'Không tìm thấy chi tiết mượn cho mã đã nhập. Hãy kiểm tra lại mã.',
  BORROW_DETAIL_NOT_OVERDUE: 'Lượt mượn không quá hạn nên không tạo phiếu phạt.',
  FINE_ALREADY_EXISTS: 'Đã có phiếu phạt chưa thanh toán cho chi tiết mượn này, không tạo trùng.',
  FINE_NOT_COLLECTIBLE: 'Phiếu phạt đã được xử lý (đã thu/đã miễn/đã hủy) nên không thể ghi nhận thu tiền lại.',
  FINE_NOT_PAYABLE: 'Phiếu phạt đã thanh toán hoặc ở trạng thái cuối, không thể đánh dấu lại.',
  FINE_NOT_RESOLVABLE: 'Phiếu phạt đã ở trạng thái cuối (đã thanh toán/đã miễn/đã hủy), không thể miễn hoặc hủy.',
  REASON_REQUIRED: 'Lý do miễn/hủy là bắt buộc.',
  REASON_TOO_LONG: 'Lý do miễn/hủy không được vượt quá 500 ký tự.',
  INVALID_PAYMENT_METHOD: 'Phương thức thanh toán không hợp lệ.',
  FINE_AMOUNT_INVALID: 'Số tiền phạt không hợp lệ.',
};

const INVENTORY_ERROR_MESSAGES = {
  STALE_COPY_STATE: 'Dữ liệu bản sao đã thay đổi. Vui lòng tải lại rồi thử lại.',
  RESERVATION_STATE_CONFLICT: 'Bản sao đang thuộc hàng đợi giữ chỗ. Hãy xử lý qua FE08 trước.',
  ACTIVE_BORROW_CONFLICT: 'Bản sao đang được mượn. Hãy xử lý trả sách qua FE07 trước.',
  PENDING_BORROW_REQUEST_CONFLICT: 'Bản sao đang thuộc yêu cầu mượn chờ duyệt. Hãy duyệt hoặc từ chối yêu cầu đó trong Quản lý yêu cầu trước.',
  INACTIVE_PARENT_BOOK: 'Đầu sách đang ngừng hoạt động nên không thể đưa bản sao về trạng thái khả dụng.',
};

// @spec BR-FE12-008, BR-FE12-009, FR-FE12-005 — report validation codes mapped to Vietnamese copy.
const REPORT_ERROR_MESSAGES = {
  UNSUPPORTED_REPORT_QUERY_PARAMETER: 'Bộ lọc báo cáo chứa tham số không được hỗ trợ. Vui lòng làm mới trang và thử lại.',
  INVALID_REPORT_FILTER: 'Giá trị bộ lọc báo cáo không hợp lệ. Hãy kiểm tra ngày, trạng thái và mã số.',
  INVALID_DATE_RANGE: 'Khoảng ngày không hợp lệ. Ngày bắt đầu phải trước hoặc bằng ngày kết thúc.',
  INVALID_PAGINATION: 'Phân trang không hợp lệ. Số trang phải lớn hơn 0 và giới hạn dòng nằm trong 1..100.',
  SEARCH_TOO_LONG: 'Từ khóa tìm kiếm quá dài. Giới hạn 200 ký tự.',
  REPORT_QUERY_FAILED: 'Không thể tạo báo cáo với bộ lọc hiện tại. Vui lòng thử lại.',
};

const NOTIFICATION_INBOX_ERROR_MESSAGES = {
  VALIDATION_ERROR: 'Bộ lọc hoặc mã thông báo không hợp lệ. Vui lòng tải lại trang và thử lại.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền sử dụng hộp thư thông báo.',
  NOTIFICATION_NOT_FOUND: 'Không tìm thấy thông báo này hoặc thông báo không thuộc tài khoản của bạn.',
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

// @spec NFR-FE09-SEC-003 — fine-specific error resolver for calculate/collect/paid/waive/cancel.
export function getFineErrorMessage(error, fallback = 'Không thể xử lý phiếu phạt.') {
  if (!error.response) return 'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.';
  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  if (FINE_ERROR_MESSAGES[code]) return FINE_ERROR_MESSAGES[code];
  if (error.response?.status === 403) return 'Tài khoản hiện tại không có quyền thực hiện thao tác tiền phạt này.';
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

  if (REPORT_ERROR_MESSAGES[code]) {
    return REPORT_ERROR_MESSAGES[code];
  }

  if (error.response?.status === 400) {
    return REPORT_ERROR_MESSAGES.INVALID_REPORT_FILTER;
  }

  if (error.response?.status === 403) {
    return 'Tài khoản hiện tại không có quyền xem báo cáo này.';
  }

  return getLibraryFeatureErrorMessage(error, fallback);
}

export function getNotificationInboxErrorMessage(error, fallback = 'Không thể xử lý hộp thư thông báo.') {
  if (!error.response) {
    return 'Không kết nối được backend. Không thể cập nhật hộp thư thông báo.';
  }

  const code = error.response?.data?.error?.code;
  if (code === 'UNAUTHORIZED' || error.response?.status === 401) {
    return 'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.';
  }

  if (NOTIFICATION_INBOX_ERROR_MESSAGES[code]) {
    return NOTIFICATION_INBOX_ERROR_MESSAGES[code];
  }

  if (error.response?.status === 403) {
    return NOTIFICATION_INBOX_ERROR_MESSAGES.ROLE_REQUIRED;
  }

  return fallback;
}
