import { useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Banknote,
  BookOpen,
  Calculator,
  Check,
  ClipboardCheck,
  CreditCard,
  FileText,
  Filter,
  LayoutDashboard,
  LogOut,
  ReceiptText,
  Search,
  ShieldCheck,
  UserRound,
} from 'lucide-react';

const DAILY_FINE_RATE = 5000;

const sampleBorrowDetails = [
  {
    borrowDetailId: 7001,
    memberId: 101,
    memberName: 'Nguyen Minh Anh',
    memberCode: 'USR-1001',
    email: 'minhanh@example.test',
    bookTitle: 'Clean Code',
    barcode: 'BC-CLN-001',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
    status: 'RETURNED',
  },
  {
    borrowDetailId: 7002,
    memberId: 102,
    memberName: 'Tran Bao Long',
    memberCode: 'USR-1002',
    email: 'baolong@example.test',
    bookTitle: 'Database System Concepts',
    barcode: 'BC-DBS-014',
    dueDate: '2026-06-05',
    returnDate: '',
    status: 'BORROWED',
  },
  {
    borrowDetailId: 7003,
    memberId: 103,
    memberName: 'Le Thao Vy',
    memberCode: 'USR-1003',
    email: 'thaovy@example.test',
    bookTitle: 'Designing Data-Intensive Applications',
    barcode: 'BC-DDI-004',
    dueDate: '2026-06-14',
    returnDate: '2026-06-14',
    status: 'RETURNED',
  },
];

const initialFines = [
  {
    fineId: 9001,
    userId: 101,
    memberName: 'Nguyen Minh Anh',
    memberCode: 'USR-1001',
    email: 'minhanh@example.test',
    borrowDetailId: 7001,
    bookTitle: 'Clean Code',
    barcode: 'BC-CLN-001',
    dueDate: '2026-06-01',
    returnDate: '2026-06-08',
    overdueDays: 7,
    ratePerDay: DAILY_FINE_RATE,
    amount: 35000,
    paidAmount: 0,
    reason: 'OVERDUE',
    status: 'UNPAID',
    calculatedAt: '2026-06-08T09:30:00',
    paidAt: '',
    collectionNote: '',
    paymentMethod: '',
    collectedAt: '',
    collectedBy: '',
  },
  {
    fineId: 9002,
    userId: 104,
    memberName: 'Pham Gia Han',
    memberCode: 'USR-1004',
    email: 'giahan@example.test',
    borrowDetailId: 6998,
    bookTitle: 'JavaScript: The Good Parts',
    barcode: 'BC-JSG-002',
    dueDate: '2026-05-22',
    returnDate: '2026-05-25',
    overdueDays: 3,
    ratePerDay: DAILY_FINE_RATE,
    amount: 15000,
    paidAmount: 15000,
    reason: 'OVERDUE',
    status: 'PAID',
    calculatedAt: '2026-05-25T15:05:00',
    paidAt: '2026-05-25T15:20:00',
    collectionNote: 'Đã thu tại quầy lưu thông.',
    paymentMethod: 'Tiền mặt',
    collectedAt: '2026-05-25T15:18:00',
    collectedBy: 'Thủ thư demo',
  },
  {
    fineId: 9003,
    userId: 102,
    memberName: 'Tran Bao Long',
    memberCode: 'USR-1002',
    email: 'baolong@example.test',
    borrowDetailId: 7002,
    bookTitle: 'Database System Concepts',
    barcode: 'BC-DBS-014',
    dueDate: '2026-06-05',
    returnDate: '',
    overdueDays: 9,
    ratePerDay: DAILY_FINE_RATE,
    amount: 45000,
    paidAmount: 0,
    reason: 'OVERDUE',
    status: 'UNPAID',
    calculatedAt: '2026-06-14T08:00:00',
    paidAt: '',
    collectionNote: '',
    paymentMethod: '',
    collectedAt: '',
    collectedBy: '',
  },
];

const statusLabels = {
  ALL: 'Tất cả phiếu phạt',
  UNPAID: 'Chưa thanh toán',
  PAID: 'Đã thanh toán',
  WAIVED: 'Đã miễn',
};

function formatCurrency(value) {
  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0);
}

function formatDate(value) {
  if (!value) {
    return '-';
  }

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

function getTodayValue() {
  return new Date().toISOString().slice(0, 10);
}

function calculateOverdueDays(dueDate, returnDate) {
  if (!dueDate) {
    return 0;
  }

  const due = new Date(`${dueDate}T00:00:00`);
  const end = new Date(`${returnDate || getTodayValue()}T00:00:00`);
  const diff = Math.floor((end - due) / 86400000);
  return Math.max(diff, 0);
}

function getStoredStaffUser() {
  const rawUser = localStorage.getItem('authUser') || sessionStorage.getItem('authUser');

  if (!rawUser) {
    return null;
  }

  try {
    const user = JSON.parse(rawUser);
    return user.roles?.some((role) => ['LIBRARIAN', 'ADMIN'].includes(role)) ? user : null;
  } catch {
    return null;
  }
}

function StatusBadge({ status }) {
  return <span className={`fine-badge status-${status.toLowerCase()}`}>{statusLabels[status] || status}</span>;
}

function Toast({ toast, onClose }) {
  return (
    <button className={`fine-toast ${toast.type}`} onClick={onClose}>
      {toast.type === 'error' ? <AlertTriangle size={17} /> : <Check size={17} />}
      <span>{toast.message}</span>
    </button>
  );
}

export default function FineManagement() {
  const navigate = useNavigate();
  const staffUser = getStoredStaffUser();
  const [fines, setFines] = useState(initialFines);
  const [selectedFineId, setSelectedFineId] = useState(initialFines[0].fineId);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [calculateForm, setCalculateForm] = useState({
    borrowDetailId: String(sampleBorrowDetails[0].borrowDetailId),
  });
  const [collectionForm, setCollectionForm] = useState({
    paymentMethod: 'Tiền mặt',
    note: '',
  });
  const [toast, setToast] = useState(null);
  const [activeAction, setActiveAction] = useState('calculate');
  const calculateActionRef = useRef(null);
  const collectionActionRef = useRef(null);
  const paidActionRef = useRef(null);

  const selectedFine = fines.find((fine) => fine.fineId === selectedFineId) || fines[0];

  const filteredFines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return fines.filter((fine) => {
      const matchesStatus = statusFilter === 'ALL' || fine.status === statusFilter;
      const matchesQuery =
        !normalizedQuery ||
        fine.memberName.toLowerCase().includes(normalizedQuery) ||
        fine.memberCode.toLowerCase().includes(normalizedQuery) ||
        fine.bookTitle.toLowerCase().includes(normalizedQuery) ||
        String(fine.borrowDetailId).includes(normalizedQuery);

      return matchesStatus && matchesQuery;
    });
  }, [fines, query, statusFilter]);

  const stats = useMemo(() => {
    const unpaidFines = fines.filter((fine) => fine.status === 'UNPAID');
    const paidFines = fines.filter((fine) => fine.status === 'PAID');

    return [
      {
        label: 'Tổng chưa thu',
        value: formatCurrency(unpaidFines.reduce((total, fine) => total + fine.amount, 0)),
        icon: AlertTriangle,
        tone: 'danger',
      },
      {
        label: 'Phiếu chưa thanh toán',
        value: unpaidFines.length,
        icon: ReceiptText,
        tone: 'warning',
      },
      {
        label: 'Đã thu',
        value: formatCurrency(paidFines.reduce((total, fine) => total + fine.paidAmount, 0)),
        icon: Banknote,
        tone: 'success',
      },
      {
        label: 'Mức phạt',
        value: '5.000 VND/ngày',
        icon: ShieldCheck,
        tone: 'neutral',
      },
    ];
  }, [fines]);

  function showToast(message, type = 'success') {
    setToast({ message, type });
    window.clearTimeout(showToast.timer);
    showToast.timer = window.setTimeout(() => setToast(null), 3200);
  }

  function handleActionNav(actionKey, actionRef) {
    setActiveAction(actionKey);
    actionRef.current?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function handleCalculateFine(event) {
    event.preventDefault();
    const borrowDetailId = Number(calculateForm.borrowDetailId);
    const borrowDetail = sampleBorrowDetails.find((item) => item.borrowDetailId === borrowDetailId);

    if (!borrowDetail) {
      showToast('Không tìm thấy chi tiết mượn.', 'error');
      return;
    }

    const overdueDays = calculateOverdueDays(borrowDetail.dueDate, borrowDetail.returnDate);

    if (overdueDays <= 0) {
      showToast('Không tạo phiếu phạt vì sách chưa quá hạn.', 'success');
      return;
    }

    const existingFine = fines.find(
      (fine) => fine.borrowDetailId === borrowDetailId && fine.reason === 'OVERDUE' && fine.status === 'UNPAID'
    );
    const amount = overdueDays * DAILY_FINE_RATE;

    if (existingFine) {
      setFines((current) =>
        current.map((fine) =>
          fine.fineId === existingFine.fineId
            ? {
                ...fine,
                overdueDays,
                amount,
                calculatedAt: new Date().toISOString(),
              }
            : fine
        )
      );
      setSelectedFineId(existingFine.fineId);
      showToast('Đã cập nhật phiếu phạt chưa thanh toán hiện có, không tạo trùng.');
      return;
    }

    const newFine = {
      fineId: Math.max(...fines.map((fine) => fine.fineId)) + 1,
      userId: borrowDetail.memberId,
      memberName: borrowDetail.memberName,
      memberCode: borrowDetail.memberCode,
      email: borrowDetail.email,
      borrowDetailId: borrowDetail.borrowDetailId,
      bookTitle: borrowDetail.bookTitle,
      barcode: borrowDetail.barcode,
      dueDate: borrowDetail.dueDate,
      returnDate: borrowDetail.returnDate,
      overdueDays,
      ratePerDay: DAILY_FINE_RATE,
      amount,
      paidAmount: 0,
      reason: 'OVERDUE',
      status: 'UNPAID',
      calculatedAt: new Date().toISOString(),
      paidAt: '',
      collectionNote: '',
      paymentMethod: '',
      collectedAt: '',
      collectedBy: '',
    };

    setFines((current) => [newFine, ...current]);
    setSelectedFineId(newFine.fineId);
    showToast('Đã tính tiền phạt quá hạn và thêm vào danh sách xử lý.');
  }

  function handleRecordCollection(event) {
    event.preventDefault();

    if (!selectedFine || selectedFine.status !== 'UNPAID') {
      showToast('Chỉ phiếu chưa thanh toán mới được ghi nhận thu tiền.', 'error');
      return;
    }

    setFines((current) =>
      current.map((fine) =>
        fine.fineId === selectedFine.fineId
          ? {
              ...fine,
              paidAmount: fine.amount,
              collectionNote: collectionForm.note.trim() || 'Đã thu trực tiếp tại quầy lưu thông.',
              paymentMethod: collectionForm.paymentMethod,
              collectedAt: new Date().toISOString(),
              collectedBy: staffUser?.email || 'Thủ thư demo',
            }
          : fine
      )
    );
    showToast('Đã ghi nhận thông tin thu tiền phạt.');
  }

  function handleMarkPaid() {
    if (!selectedFine || selectedFine.status !== 'UNPAID') {
      showToast('Phiếu phạt này không thể thanh toán.', 'error');
      return;
    }

    setFines((current) =>
      current.map((fine) =>
        fine.fineId === selectedFine.fineId
          ? {
              ...fine,
              status: 'PAID',
              paidAmount: fine.amount,
              paidAt: new Date().toISOString(),
              collectedAt: fine.collectedAt || new Date().toISOString(),
              collectedBy: fine.collectedBy || staffUser?.email || 'Thủ thư demo',
              paymentMethod: fine.paymentMethod || collectionForm.paymentMethod,
              collectionNote: fine.collectionNote || collectionForm.note.trim() || 'Đã đánh dấu thanh toán sau khi thu trực tiếp.',
            }
          : fine
      )
    );
    showToast('Đã đánh dấu phiếu phạt là ĐÃ THANH TOÁN và ghi nhận thời điểm thanh toán.');
  }

  function handleLogout() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('authUser');
    sessionStorage.removeItem('accessToken');
    sessionStorage.removeItem('refreshToken');
    sessionStorage.removeItem('authUser');
    navigate('/login');
  }

  return (
    <div className="fine-shell">
      <aside className="fine-sidebar">
        <div className="fine-brand">
          <div className="fine-brand-mark"><BookOpen size={22} /></div>
          <div>
            <strong>Library LMS</strong>
            <span>Bảng điều khiển thủ thư</span>
          </div>
        </div>

        <nav className="fine-nav">
          <button className="active"><LayoutDashboard size={18} />Quản lý tiền phạt</button>
          <button onClick={() => navigate('/home')}><BookOpen size={18} />Danh mục công khai</button>
          <button onClick={() => navigate('/admin/users')}><UserRound size={18} />Danh sách người dùng</button>
        </nav>

        <div className="fine-nav-section">
          <span>Nghiệp vụ tiền phạt</span>
          <button
            className={activeAction === 'calculate' ? 'active' : ''}
            onClick={() => handleActionNav('calculate', calculateActionRef)}
          >
            <Calculator size={18} />Tính tiền phạt
          </button>
          <button
            className={activeAction === 'collection' ? 'active' : ''}
            onClick={() => handleActionNav('collection', collectionActionRef)}
          >
            <CreditCard size={18} />Ghi nhận thu tiền
          </button>
          <button
            className={activeAction === 'paid' ? 'active' : ''}
            onClick={() => handleActionNav('paid', paidActionRef)}
          >
            <Check size={18} />Đánh dấu đã thanh toán
          </button>
        </div>

        <div className="fine-session">
          <span>Đang đăng nhập với</span>
          <strong>{staffUser?.email || 'librarian.demo@library.test'}</strong>
          <button onClick={handleLogout}><LogOut size={17} />Đăng xuất</button>
        </div>
      </aside>

      <main className="fine-main">
        <header className="fine-header">
          <div>
            <p>FE09 Quản lý tiền phạt</p>
            <h1>Nghiệp vụ tiền phạt</h1>
            <span>Xem thông tin phạt, tính phạt quá hạn, ghi nhận thu tiền trực tiếp và đánh dấu đã thanh toán.</span>
          </div>
          <div className="fine-policy">
            <ShieldCheck size={20} />
            <div>
              <strong>Chính sách giai đoạn 1</strong>
              <span>Chỉ xử lý phạt quá hạn, không thanh toán một phần, bản chính thức phải tính tiền phạt ở máy chủ.</span>
            </div>
          </div>
        </header>

        <section className="fine-stats">
          {stats.map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.label} className={`fine-stat ${item.tone}`}>
                <div><Icon size={20} /></div>
                <span>{item.label}</span>
                <strong>{item.value}</strong>
              </div>
            );
          })}
        </section>

        <section className="fine-grid">
          <div className="fine-panel fine-list-panel">
            <div className="fine-panel-head">
              <div>
                <p>Thông tin tiền phạt</p>
                <h2>Danh sách phiếu phạt</h2>
              </div>
              <StatusBadge status={selectedFine?.status || 'UNPAID'} />
            </div>

            <div className="fine-toolbar">
              <label className="fine-search">
                <Search size={18} />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Tìm thành viên, sách, mã mượn..."
                />
              </label>
              <label className="fine-select">
                <Filter size={17} />
                <select value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)}>
                  {Object.entries(statusLabels).map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
              </label>
            </div>

            <div className="fine-table-wrap">
              <table className="fine-table">
                <thead>
                  <tr>
                    <th>Phiếu phạt</th>
                    <th>Thành viên</th>
                    <th>Sách</th>
                    <th>Quá hạn</th>
                    <th>Số tiền</th>
                    <th>Trạng thái</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredFines.map((fine) => (
                    <tr
                      key={fine.fineId}
                      className={fine.fineId === selectedFine?.fineId ? 'selected' : ''}
                      onClick={() => setSelectedFineId(fine.fineId)}
                    >
                      <td>#{fine.fineId}</td>
                      <td>
                        <strong>{fine.memberName}</strong>
                        <span>{fine.memberCode}</span>
                      </td>
                      <td>
                        <strong>{fine.bookTitle}</strong>
                        <span>{fine.barcode}</span>
                      </td>
                      <td>{fine.overdueDays} ngày</td>
                      <td>{formatCurrency(fine.amount)}</td>
                      <td><StatusBadge status={fine.status} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <aside className="fine-panel fine-detail-panel">
            <div className="fine-panel-head">
              <div>
                <p>Phiếu đang chọn</p>
                <h2>Phiếu phạt #{selectedFine?.fineId}</h2>
              </div>
              <ReceiptText size={22} />
            </div>

            {selectedFine && (
              <>
                <div className="fine-detail-card">
                  <div>
                    <span>Thành viên</span>
                    <strong>{selectedFine.memberName}</strong>
                    <small>{selectedFine.email}</small>
                  </div>
                  <div>
                    <span>Tổng tiền phạt</span>
                    <strong>{formatCurrency(selectedFine.amount)}</strong>
                    <small>{selectedFine.overdueDays} ngày x {formatCurrency(selectedFine.ratePerDay)}</small>
                  </div>
                </div>

                <dl className="fine-details">
                  <div><dt>Mã chi tiết mượn</dt><dd>#{selectedFine.borrowDetailId}</dd></div>
                  <div><dt>Sách</dt><dd>{selectedFine.bookTitle}</dd></div>
                  <div><dt>Lý do</dt><dd>{selectedFine.reason === 'OVERDUE' ? 'Quá hạn' : selectedFine.reason}</dd></div>
                  <div><dt>Ngày đến hạn</dt><dd>{formatDate(selectedFine.dueDate)}</dd></div>
                  <div><dt>Ngày trả/hiện tại</dt><dd>{formatDate(selectedFine.returnDate || getTodayValue())}</dd></div>
                  <div><dt>Ngày tính phạt</dt><dd>{formatDate(selectedFine.calculatedAt)}</dd></div>
                  <div><dt>Người thu</dt><dd>{selectedFine.collectedBy || '-'}</dd></div>
                  <div><dt>Ngày thanh toán</dt><dd>{formatDate(selectedFine.paidAt)}</dd></div>
                </dl>
              </>
            )}
          </aside>
        </section>

        <section className="fine-actions">
          <form
            ref={calculateActionRef}
            className="fine-panel fine-action-card"
            onFocusCapture={() => setActiveAction('calculate')}
            onSubmit={handleCalculateFine}
          >
            <div className="fine-action-title">
              <Calculator size={21} />
              <div>
                <h2>Tính tiền phạt</h2>
                <p>Tạo mới hoặc cập nhật một phiếu phạt quá hạn cho mỗi chi tiết mượn.</p>
              </div>
            </div>
            <label>
              Chi tiết mượn
              <select
                value={calculateForm.borrowDetailId}
                onChange={(event) => setCalculateForm({ borrowDetailId: event.target.value })}
              >
                {sampleBorrowDetails.map((item) => (
                  <option key={item.borrowDetailId} value={item.borrowDetailId}>
                    #{item.borrowDetailId} - {item.memberName} - {item.bookTitle}
                  </option>
                ))}
              </select>
            </label>
            <div className="fine-note">
              Số tiền phạt trên màn hình này chỉ phục vụ demo quy trình cho thủ thư. Bản chính thức phải tính ở máy chủ.
            </div>
            <button type="submit"><Calculator size={17} />Tính phạt quá hạn</button>
          </form>

          <form
            ref={collectionActionRef}
            className="fine-panel fine-action-card"
            onFocusCapture={() => setActiveAction('collection')}
            onSubmit={handleRecordCollection}
          >
            <div className="fine-action-title">
              <CreditCard size={21} />
              <div>
                <h2>Ghi nhận thu tiền</h2>
                <p>Ghi nhận khoản thu trực tiếp cho phiếu phạt chưa thanh toán đang chọn.</p>
              </div>
            </div>
            <label>
              Phương thức thanh toán
              <select
                value={collectionForm.paymentMethod}
                onChange={(event) => setCollectionForm((current) => ({ ...current, paymentMethod: event.target.value }))}
              >
                <option>Tiền mặt</option>
                <option>Chuyển khoản</option>
                <option>Quẹt thẻ tại quầy</option>
              </select>
            </label>
            <label>
              Ghi chú thu tiền
              <textarea
                value={collectionForm.note}
                onChange={(event) => setCollectionForm((current) => ({ ...current, note: event.target.value }))}
                maxLength={180}
                placeholder="Mã biên nhận, ghi chú tại quầy hoặc ghi chú của thủ thư..."
              />
            </label>
            <button type="submit" disabled={!selectedFine || selectedFine.status !== 'UNPAID'}>
              <ClipboardCheck size={17} />Ghi nhận thu tiền
            </button>
          </form>

          <div
            ref={paidActionRef}
            className="fine-panel fine-action-card"
            onFocusCapture={() => setActiveAction('paid')}
          >
            <div className="fine-action-title">
              <FileText size={21} />
              <div>
                <h2>Đánh dấu đã thanh toán</h2>
                <p>Hoàn tất phiếu phạt đang chọn và chuyển trạng thái sang đã thanh toán.</p>
              </div>
            </div>
            <div className="fine-paid-preview">
              <span>Phiếu đang chọn</span>
              <strong>{selectedFine ? `#${selectedFine.fineId}` : '-'}</strong>
              <span>Số tiền cần tất toán</span>
              <strong>{selectedFine ? formatCurrency(selectedFine.amount) : '-'}</strong>
            </div>
            <button onClick={handleMarkPaid} disabled={!selectedFine || selectedFine.status !== 'UNPAID'}>
              <Check size={17} />Đánh dấu đã thanh toán
            </button>
          </div>
        </section>
      </main>

      {toast && <Toast toast={toast} onClose={() => setToast(null)} />}

      <style>{`
        .fine-shell { min-height: 100vh; background: #f6f7fb; color: #17202a; display: flex; font-family: Inter, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif; }
        .fine-sidebar { width: 260px; background: #17202a; color: #edf2f7; padding: 22px 16px; display: flex; flex-direction: column; gap: 28px; position: sticky; top: 0; height: 100vh; }
        .fine-brand { display: flex; align-items: center; gap: 12px; padding: 4px 6px; }
        .fine-brand-mark { width: 42px; height: 42px; border-radius: 8px; display: grid; place-items: center; background: #0f766e; color: #fff; }
        .fine-brand strong, .fine-brand span { display: block; }
        .fine-brand strong { font-size: 17px; }
        .fine-brand span { color: #94a3b8; font-size: 12px; margin-top: 3px; }
        .fine-nav, .fine-nav-section, .fine-session { display: flex; flex-direction: column; gap: 8px; }
        .fine-nav-section { border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .fine-nav-section > span { color: #94a3b8; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; padding: 0 12px 2px; }
        .fine-nav button, .fine-nav-section button, .fine-session button { min-height: 42px; border-radius: 8px; border: 0; background: transparent; color: #cbd5e1; display: flex; align-items: center; gap: 10px; padding: 0 12px; cursor: pointer; font-size: 15px; text-align: left; }
        .fine-nav button:hover, .fine-nav-section button:hover, .fine-session button:hover, .fine-nav button.active, .fine-nav-section button.active { background: #243244; color: #fff; }
        .fine-session { margin-top: auto; border-top: 1px solid rgba(255,255,255,0.1); padding-top: 16px; }
        .fine-session span { color: #94a3b8; font-size: 12px; }
        .fine-session strong { color: #fff; font-size: 13px; overflow-wrap: anywhere; }
        .fine-main { flex: 1; padding: 28px; min-width: 0; }
        .fine-header { display: flex; justify-content: space-between; align-items: flex-start; gap: 20px; margin-bottom: 22px; }
        .fine-header p, .fine-panel-head p { color: #0f766e; font-size: 12px; font-weight: 800; letter-spacing: .08em; text-transform: uppercase; margin: 0 0 6px; }
        .fine-header h1, .fine-panel-head h2, .fine-action-title h2 { margin: 0; color: #111827; letter-spacing: 0; }
        .fine-header h1 { font-size: 32px; line-height: 1.1; }
        .fine-header span, .fine-action-title p { color: #64748b; font-size: 14px; line-height: 1.55; }
        .fine-policy { max-width: 420px; display: flex; gap: 12px; padding: 14px 16px; border: 1px solid #ccfbf1; border-radius: 8px; background: #f0fdfa; color: #0f766e; }
        .fine-policy strong, .fine-policy span { display: block; }
        .fine-policy span { color: #475569; font-size: 13px; margin-top: 3px; }
        .fine-stats { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 14px; margin-bottom: 18px; }
        .fine-stat, .fine-panel { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; box-shadow: 0 10px 30px rgba(15, 23, 42, .05); }
        .fine-stat { padding: 18px; display: grid; gap: 8px; }
        .fine-stat div { width: 38px; height: 38px; border-radius: 8px; display: grid; place-items: center; }
        .fine-stat span { color: #64748b; font-size: 13px; }
        .fine-stat strong { color: #111827; font-size: 22px; }
        .fine-stat.danger div { background: #fee2e2; color: #b91c1c; }
        .fine-stat.warning div { background: #fef3c7; color: #b45309; }
        .fine-stat.success div { background: #dcfce7; color: #15803d; }
        .fine-stat.neutral div { background: #e0f2fe; color: #0369a1; }
        .fine-grid { display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 18px; align-items: start; }
        .fine-panel { padding: 18px; }
        .fine-panel-head { display: flex; align-items: center; justify-content: space-between; gap: 14px; margin-bottom: 16px; }
        .fine-toolbar { display: grid; grid-template-columns: minmax(0, 1fr) 190px; gap: 12px; margin-bottom: 14px; }
        .fine-search, .fine-select { min-height: 42px; border: 1px solid #cbd5e1; border-radius: 8px; display: flex; align-items: center; gap: 9px; padding: 0 12px; color: #64748b; background: #fff; }
        .fine-search input, .fine-select select, .fine-action-card select, .fine-action-card textarea { width: 100%; border: 0; outline: 0; color: #111827; background: transparent; font: inherit; }
        .fine-table-wrap { overflow-x: auto; }
        .fine-table { width: 100%; border-collapse: collapse; min-width: 780px; }
        .fine-table th { color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: .06em; text-align: left; padding: 11px 10px; border-bottom: 1px solid #e2e8f0; }
        .fine-table td { padding: 13px 10px; border-bottom: 1px solid #f1f5f9; vertical-align: middle; font-size: 14px; }
        .fine-table tr { cursor: pointer; }
        .fine-table tr:hover, .fine-table tr.selected { background: #f8fafc; }
        .fine-table td strong, .fine-table td span { display: block; }
        .fine-table td span { color: #64748b; font-size: 12px; margin-top: 3px; }
        .fine-badge { display: inline-flex; align-items: center; justify-content: center; min-height: 26px; padding: 0 10px; border-radius: 999px; font-size: 12px; font-weight: 800; }
        .status-unpaid { background: #fee2e2; color: #b91c1c; }
        .status-paid { background: #dcfce7; color: #15803d; }
        .status-waived { background: #e0e7ff; color: #3730a3; }
        .fine-detail-panel { position: sticky; top: 20px; }
        .fine-detail-card { display: grid; gap: 12px; margin-bottom: 16px; }
        .fine-detail-card > div { border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; padding: 14px; }
        .fine-detail-card span, .fine-details dt, .fine-paid-preview span { color: #64748b; font-size: 12px; text-transform: uppercase; font-weight: 800; letter-spacing: .06em; }
        .fine-detail-card strong { display: block; margin-top: 5px; color: #111827; font-size: 18px; }
        .fine-detail-card small { color: #64748b; display: block; margin-top: 4px; }
        .fine-details { display: grid; gap: 10px; margin: 0; }
        .fine-details div { display: flex; justify-content: space-between; gap: 18px; border-bottom: 1px solid #f1f5f9; padding-bottom: 9px; }
        .fine-details dd { margin: 0; color: #111827; text-align: right; }
        .fine-actions { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 18px; margin-top: 18px; }
        .fine-action-card { display: flex; flex-direction: column; gap: 14px; scroll-margin-top: 20px; }
        .fine-action-title { display: flex; align-items: flex-start; gap: 11px; }
        .fine-action-title svg { color: #0f766e; margin-top: 3px; }
        .fine-action-title h2 { font-size: 18px; }
        .fine-action-title p { margin: 4px 0 0; }
        .fine-action-card label { display: grid; gap: 7px; color: #334155; font-size: 13px; font-weight: 800; }
        .fine-action-card select, .fine-action-card textarea { border: 1px solid #cbd5e1; border-radius: 8px; padding: 11px 12px; resize: vertical; min-height: 42px; }
        .fine-action-card textarea { min-height: 78px; }
        .fine-action-card button { min-height: 42px; border: 0; border-radius: 8px; background: #0f766e; color: #fff; font-weight: 800; cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 8px; }
        .fine-action-card button:hover { background: #115e59; }
        .fine-action-card button:disabled { background: #cbd5e1; cursor: not-allowed; }
        .fine-note { border-radius: 8px; background: #fff7ed; color: #9a3412; border: 1px solid #fed7aa; padding: 10px 12px; font-size: 13px; line-height: 1.5; }
        .fine-paid-preview { display: grid; grid-template-columns: 1fr auto; gap: 10px 16px; padding: 14px; border-radius: 8px; background: #f8fafc; border: 1px solid #e2e8f0; }
        .fine-paid-preview strong { color: #111827; text-align: right; }
        .fine-toast { position: fixed; right: 24px; bottom: 24px; border: 0; border-radius: 8px; padding: 13px 16px; color: #fff; background: #0f766e; display: flex; align-items: center; gap: 10px; box-shadow: 0 18px 40px rgba(15, 23, 42, .18); cursor: pointer; }
        .fine-toast.error { background: #b91c1c; }
        @media (max-width: 1180px) {
          .fine-stats, .fine-actions { grid-template-columns: repeat(2, minmax(0, 1fr)); }
          .fine-grid { grid-template-columns: 1fr; }
          .fine-detail-panel { position: static; }
        }
        @media (max-width: 820px) {
          .fine-shell { flex-direction: column; }
          .fine-sidebar { width: 100%; height: auto; position: static; }
          .fine-nav, .fine-nav-section, .fine-session { flex-direction: row; flex-wrap: wrap; }
          .fine-nav-section { width: 100%; }
          .fine-nav-section > span { width: 100%; }
          .fine-main { padding: 18px; }
          .fine-header { flex-direction: column; }
          .fine-stats, .fine-actions, .fine-toolbar { grid-template-columns: 1fr; }
        }
      `}</style>
    </div>
  );
}
