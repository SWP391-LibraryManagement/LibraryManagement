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
  MEMBER_NOT_FOUND: 'Tài khoản hiện tại chưa có hồ sơ thành viên. Vui lòng liên hệ thủ thư/admin để tạo membership.',
  UNPAID_FINE_BLOCKS_BORROWING: 'Bạn còn khoản phạt chưa thanh toán nên chưa thể mượn hoặc gia hạn sách.',
  OVERDUE_LOAN_BLOCKS_BORROWING: 'Bạn còn sách quá hạn nên chưa thể mượn hoặc gia hạn sách.',
  BORROW_LIMIT_EXCEEDED: 'Bạn đã đạt giới hạn 5 bản sao đang mượn, nên chưa thể mượn thêm.',
  COPY_NOT_AVAILABLE: 'Bản sao sách này hiện không khả dụng. Vui lòng chọn bản sao khác.',
  COPY_NOT_FOUND: 'Không tìm thấy bản sao sách này trong backend. Dữ liệu demo có thể không khớp database hiện tại.',
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
    'Bạn chưa đăng nhập hoặc phiên đã hết hạn. UI đang hiển thị dữ liệu demo.',
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
    'Tài khoản hiện tại không có quyền xem dữ liệu này. UI đang hiển thị dữ liệu demo.',
  );
  assert.equal(
    getBorrowingErrorMessage({}, 'Fallback'),
    'Không kết nối được backend. UI đang dùng dữ liệu demo để bạn vẫn kiểm tra được màn hình.',
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
    'Tài khoản hiện tại không có quyền xem dữ liệu này. UI đang hiển thị dữ liệu demo.',
  );
});
