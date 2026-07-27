import { useCallback, useEffect, useState } from 'react';
import { ReceiptText, RefreshCw } from 'lucide-react';
import { Link } from 'react-router-dom';

import { fineApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { getStatusLabel } from '../../utils/uiLabels';

const MEMBER_FINE_PAGE_SIZE = 8;

const EMPTY_PAGINATION = {
  page: 1,
  limit: MEMBER_FINE_PAGE_SIZE,
  total: 0,
  totalPages: 0,
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value || 0));
}

function formatDate(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN').format(new Date(value));
}

function formatDateTime(value) {
  if (!value) return '—';
  return new Intl.DateTimeFormat('vi-VN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
}

const FINE_REASON_LABELS = {
  OVERDUE: 'Quá hạn trả sách',
};

// @spec FR-FE09-019, AC-FE09-017
export default function MemberFinesPage() {
  const [page, setPage] = useState(1);
  const [fines, setFines] = useState([]);
  const [pagination, setPagination] = useState(EMPTY_PAGINATION);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('');

  const loadFines = useCallback(async () => {
    setLoading(true);
    setNotice('');
    try {
      const result = await fineApi.listMine({ page, limit: MEMBER_FINE_PAGE_SIZE });
      setFines(result.fines || []);
      setPagination({
        page: Number(result.page || page),
        limit: Number(result.limit || MEMBER_FINE_PAGE_SIZE),
        total: Number(result.total || 0),
        totalPages: Number(result.totalPages || 0),
      });
    } catch (error) {
      setFines([]);
      setPagination({ ...EMPTY_PAGINATION, page });
      setNotice(error.message || 'Không thể tải tiền phạt của bạn.');
    } finally {
      setLoading(false);
    }
  }, [page]);

  useEffect(() => {
    const timer = window.setTimeout(loadFines, 0);
    return () => window.clearTimeout(timer);
  }, [loadFines]);

  const totalPages = Math.max(1, pagination.totalPages || 0);
  const currentPage = Math.min(pagination.page || page, totalPages);
  const unpaidFines = fines.filter((fine) => fine.status === 'UNPAID' && Number(fine.amount) > 0);
  const unpaidTotal = unpaidFines.reduce((total, fine) => total + Number(fine.amount || 0), 0);

  return (
    <AppLayout
      active="my-fines"
      title="Tiền phạt của tôi"
      subtitle="Theo dõi các khoản phạt phát sinh từ lịch sử mượn trả của bạn."
      actions={<button type="button" className="btn btn-outline" onClick={loadFines} disabled={loading}><RefreshCw size={16} /> {loading ? 'Đang tải...' : 'Tải lại'}</button>}
    >
      {notice && <DataNotice type="error" title="Không thể tải tiền phạt">{notice}</DataNotice>}

      <div className={`alert-box ${unpaidFines.length ? 'warn' : 'info'}`}>
        {unpaidFines.length ? (
          <span>
            Trang này có <strong>{unpaidFines.length}</strong> khoản chưa thanh toán, tổng cộng{' '}
            <strong>{formatCurrency(unpaidTotal)}</strong>. Khoản phạt chưa thanh toán sẽ chặn tạo
            yêu cầu mượn và gia hạn cho đến khi Librarian/Admin ghi nhận đã thu tiền.
          </span>
        ) : (
          <span>Bạn không có khoản phạt chưa thanh toán trên trang hiện tại.</span>
        )}
        {' '}
        <Link to="/borrowing/history">Đối chiếu lịch sử mượn</Link>
      </div>

      <div className="lib-card">
        <DataTable
          caption="Danh sách tiền phạt của tôi"
          headers={['Sách', 'Hạn trả', 'Ngày trả', 'Lý do', 'Quá hạn', 'Số tiền', 'Trạng thái', 'Mã mượn']}
          loading={loading}
          loadingRows={4}
          isEmpty={fines.length === 0}
          emptyState={<EmptyState icon={ReceiptText} title="Bạn chưa có khoản phạt nào" />}
        >
          {fines.map((fine) => (
            <tr key={fine.fineId}>
              <td data-label="Sách"><strong>{fine.bookTitle || `Chi tiết mượn #${fine.borrowDetailId}`}</strong></td>
              <td data-label="Hạn trả">{formatDate(fine.dueDate)}</td>
              <td data-label="Ngày trả">{formatDate(fine.returnDate)}</td>
              <td data-label="Lý do">{FINE_REASON_LABELS[fine.reason] || fine.reason || 'Quá hạn trả sách'}</td>
              <td data-label="Quá hạn">{Number(fine.overdueDays || 0)} ngày</td>
              <td data-label="Số tiền"><strong>{formatCurrency(fine.amount)}</strong></td>
              <td data-label="Trạng thái">
                <Badge status={fine.status}>{getStatusLabel(fine.status)}</Badge>
                {fine.status === 'PAID' && fine.paidAt && (
                  <div className="field-hint">Đã ghi nhận ngày {formatDateTime(fine.paidAt)}</div>
                )}
              </td>
              <td data-label="Mã mượn">#{fine.borrowDetailId}</td>
            </tr>
          ))}
        </DataTable>

        <div className="pagination" aria-label="Phân trang tiền phạt của tôi">
          <span>Trang {currentPage}/{totalPages} • {pagination.total} phiếu</span>
          <div className="page-controls">
            <button type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={currentPage <= 1 || loading}>Trước</button>
            <span className="active">{currentPage}</span>
            <button type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={currentPage >= totalPages || loading}>Sau</button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}
