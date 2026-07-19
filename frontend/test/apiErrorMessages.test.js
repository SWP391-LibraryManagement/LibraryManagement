import assert from 'node:assert/strict';
import test from 'node:test';

async function loadApiErrorMessages() {
  try {
    return await import('../src/api/apiErrorMessages.js');
  } catch {
    return {};
  }
}

const expectedMessages = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới gửi được yêu cầu mượn sách. Hãy đăng nhập bằng tài khoản Member.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được thực hiện thao tác này.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác này.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh email hoặc liên hệ thủ thư/admin.',
  ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt. Vui lòng xác minh email hoặc liên hệ thủ thư/admin.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt. Vui lòng chờ thủ thư/admin duyệt trước khi mượn sách.',
    MEMBER_NOT_FOUND: 'Không tìm thấy hồ sơ thành viên được yêu cầu.',
  UNPAID_FINE_BLOCKS_BORROWING: 'Bạn còn khoản phạt chưa thanh toán nên chưa thể mượn hoặc gia hạn sách.',
  OVERDUE_LOAN_BLOCKS_BORROWING: 'Bạn còn sách quá hạn nên chưa thể mượn hoặc gia hạn sách.',
  BORROW_LIMIT_EXCEEDED: 'Bạn đã đạt giới hạn 5 bản sao đang mượn, nên chưa thể mượn thêm.',
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
  INVALID_RETURN_DATE: 'Ngày trả sách không thể sớm hơn ngày mượn.',
  RENEWAL_LIMIT_REACHED: 'Sách này đã được gia hạn một lần và không thể gia hạn thêm.',
  BORROW_DETAIL_OVERDUE: 'Sách đã quá hạn nên không thể gia hạn.',
  BORROW_DETAIL_OWNER_REQUIRED: 'Bạn chỉ có thể gia hạn sách do chính mình mượn.',
};

test('maps FE07 API error codes to actionable Vietnamese messages', async () => {
  const { getBorrowingErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getBorrowingErrorMessage, 'function');

  for (const [code, message] of Object.entries(expectedMessages)) {
    assert.equal(
      getBorrowingErrorMessage({ response: { status: 400, data: { error: { code } } } }),
      message,
      code,
    );
  }
});

test('keeps authentication, validation, backend, and network fallbacks', async () => {
  const { getBorrowingErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getBorrowingErrorMessage, 'function');
  assert.equal(
    getBorrowingErrorMessage({ response: { status: 401, data: { error: {} } } }),
    'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.',
  );
  assert.equal(
    getBorrowingErrorMessage({ response: { status: 422, data: { error: { details: [{ message: 'copyIds must be an array.' }] } } } }),
    'copyIds must be an array.',
  );
  assert.equal(
    getBorrowingErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Fallback'),
    'Backend error',
  );
  assert.equal(
    getBorrowingErrorMessage({ response: { status: 403, data: { error: { code: 'BORROW_DETAIL_OWNER_REQUIRED' } } } }),
    'Bạn chỉ có thể gia hạn sách do chính mình mượn.',
  );
  assert.equal(
    getBorrowingErrorMessage({ response: { status: 403, data: { error: { code: 'UNKNOWN_ROLE_ERROR' } } } }),
    'Tài khoản hiện tại không có quyền xem dữ liệu mượn sách này.',
  );
  assert.equal(
    getBorrowingErrorMessage({}, 'Fallback'),
    'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.',
  );
});

test('does not leak borrowing-specific messages into other feature APIs', async () => {
  const { getLibraryFeatureErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getLibraryFeatureErrorMessage, 'function');
  assert.equal(
    getLibraryFeatureErrorMessage({ response: { status: 404, data: { error: { code: 'COPY_NOT_FOUND', message: 'Book copy was not found.' } } } }),
    'Book copy was not found.',
  );
  assert.equal(
    getLibraryFeatureErrorMessage({ response: { status: 403, data: { error: { code: 'MEMBERSHIP_NOT_APPROVED' } } } }),
    'Tài khoản hiện tại không có quyền xem dữ liệu này.',
  );
});

test('keeps FE12 report errors truthful without claiming demo fallback data', async () => {
  const { getReportErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getReportErrorMessage, 'function');
  assert.equal(
    getReportErrorMessage({}, 'Report fallback.'),
    'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.',
  );
  assert.equal(
    getReportErrorMessage({ response: { status: 401, data: { error: {} } } }),
    'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.',
  );
  assert.equal(
    getReportErrorMessage({ response: { status: 403, data: { error: {} } } }),
    'Tài khoản hiện tại không có quyền xem báo cáo này.',
  );
  assert.equal(
    getReportErrorMessage({ response: { status: 500, data: { error: { message: 'Backend error' } } } }, 'Report fallback.'),
    'Backend error',
  );
});

const expectedReservationMessages = {
  MEMBER_ROLE_REQUIRED: 'Chỉ tài khoản thành viên mới được đặt chỗ sách.',
  STAFF_ROLE_REQUIRED: 'Chỉ thủ thư hoặc admin mới được quản lý hàng đợi đặt chỗ.',
  ROLE_REQUIRED: 'Tài khoản hiện tại không có quyền thực hiện thao tác đặt chỗ này.',
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin.',
  MEMBER_ACCOUNT_INACTIVE: 'Tài khoản của bạn chưa được kích hoạt nên chưa thể đặt chỗ sách.',
  MEMBERSHIP_NOT_APPROVED: 'Membership của bạn chưa được duyệt nên chưa thể đặt chỗ sách.',
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

test('maps FE08 API error codes to actionable Vietnamese messages', async () => {
  const { getReservationErrorMessage } = await loadApiErrorMessages();

  assert.equal(typeof getReservationErrorMessage, 'function');
  for (const [code, message] of Object.entries(expectedReservationMessages)) {
    assert.equal(
      getReservationErrorMessage({ response: { status: 400, data: { error: { code } } } }),
      message,
      code,
    );
  }
});

test('keeps FE08 messages isolated from borrowing and generic feature APIs', async () => {
  const { getBorrowingErrorMessage, getLibraryFeatureErrorMessage } = await loadApiErrorMessages();
  const error = {
    response: {
      status: 409,
      data: { error: { code: 'ACTIVE_RESERVATION_LIMIT', message: 'Backend reservation message.' } },
    },
  };

  assert.equal(getBorrowingErrorMessage(error, 'Fallback'), 'Backend reservation message.');
  assert.equal(getLibraryFeatureErrorMessage(error, 'Fallback'), 'Backend reservation message.');
});

test('keeps FE08 generic error precedence and fallbacks', async () => {
  const { getReservationErrorMessage } = await loadApiErrorMessages();

  assert.equal(
    getReservationErrorMessage({
      response: { status: 401, data: { error: { code: 'ACTIVE_RESERVATION_LIMIT' } } },
    }),
    'Bạn chưa đăng nhập hoặc phiên đã hết hạn. Vui lòng đăng nhập lại.',
  );
  assert.equal(
    getReservationErrorMessage({}, 'Reservation fallback.'),
    'Không kết nối được backend. Vui lòng kiểm tra kết nối và thử lại.',
  );
  assert.equal(
    getReservationErrorMessage({
      response: { status: 409, data: { error: { code: 'UNKNOWN_RESERVATION_ERROR', message: 'Backend reservation message.' } } },
    }, 'Reservation fallback.'),
    'Backend reservation message.',
  );
  assert.equal(
    getReservationErrorMessage({
      response: { status: 409, data: { error: { code: 'UNKNOWN_RESERVATION_ERROR' } } },
    }, 'Reservation fallback.'),
    'Reservation fallback.',
  );
});
