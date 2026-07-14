import { useEffect, useMemo, useState } from 'react';
import AppLayout from '../component/layout/AppLayout';
import { Badge, ConfirmAction, EmptyState, StatusNotice, Toast, useToast } from '../component/shared/Feedback';
import { DataTable, DataToolbar } from '../component/shared/OperationalPatterns';
import BookManagement from './BookManagement';
import {
  DAILY_FINE_RATE,
  FINE_RECORDS_KEY,
  calculateOverdueDays,
  getBorrowRecords,
  getFineRecords,
  saveFineRecords,
} from '../utils/libraryWorkflow';
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
  ListChecks,
  Plus,
  ReceiptText,
  Search,
  ShieldCheck,
  Trash2,
} from 'lucide-react';
import '../styles/fine-management.css';

const BANK_TRANSFER_METHOD = 'Chuyển khoản';

const libraryBankAccount = {
  bankName: 'Vietcombank',
  accountNumber: '0123456789',
  accountName: 'LIBRARY MANAGEMENT SYSTEM',
};

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

const fineSections = [
  {
    key: 'list',
    label: 'Danh sách phiếu phạt',
    description: 'Tra cứu, lọc và xem chi tiết phiếu phạt.',
    icon: ListChecks,
  },
  {
    key: 'calculate',
    label: 'Tính tiền phạt',
    description: 'Tạo hoặc cập nhật phiếu phạt quá hạn.',
    icon: Calculator,
  },
  {
    key: 'collection',
    label: 'Ghi nhận thu tiền',
    description: 'Lưu thông tin thu tiền tại quầy.',
    icon: CreditCard,
  },
  {
    key: 'paid',
    label: 'Đánh dấu đã thanh toán',
    description: 'Hoàn tất trạng thái phiếu phạt.',
    icon: Check,
  },
];

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

function getTransferContent(fine) {
  if (!fine) {
    return 'FINE';
  }

  return `FINE-${fine.fineId}-${fine.memberCode}`;
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
  const tone = status === 'PAID' ? 'paid' : status === 'WAIVED' ? 'info' : 'unpaid';
  return <Badge status={tone}>{statusLabels[status] || status}</Badge>;
}

const DEFAULT_FINE_FORM = {
  fineId: '',
  userId: '',
  memberName: '',
  memberCode: '',
  email: '',
  borrowDetailId: '',
  bookTitle: '',
  barcode: '',
  dueDate: '',
  returnDate: '',
  overdueDays: '',
  amount: '',
  status: 'UNPAID',
};

function fineToForm(fine) {
  if (!fine) {
    return DEFAULT_FINE_FORM;
  }

  return {
    fineId: String(fine.fineId || ''),
    userId: String(fine.userId || ''),
    memberName: fine.memberName || '',
    memberCode: fine.memberCode || '',
    email: fine.email || '',
    borrowDetailId: String(fine.borrowDetailId || ''),
    bookTitle: fine.bookTitle || '',
    barcode: fine.barcode || '',
    dueDate: fine.dueDate ? String(fine.dueDate).slice(0, 10) : '',
    returnDate: fine.returnDate ? String(fine.returnDate).slice(0, 10) : '',
    overdueDays: String(fine.overdueDays ?? ''),
    amount: String(fine.amount ?? ''),
    status: fine.status || 'UNPAID',
  };
}

function validateFineForm(form) {
  const errors = {};
  const requiredFields = [
    'userId',
    'memberName',
    'memberCode',
    'email',
    'borrowDetailId',
    'bookTitle',
    'barcode',
    'dueDate',
    'overdueDays',
    'amount',
    'status',
  ];

  requiredFields.forEach((field) => {
    if (!String(form[field] || '').trim()) {
      errors[field] = 'Trường này là bắt buộc.';
    }
  });

  if (form.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    errors.email = 'Email không đúng định dạng.';
  }

  ['userId', 'borrowDetailId'].forEach((field) => {
    const value = Number(form[field]);
    if (!Number.isInteger(value) || value <= 0) {
      errors[field] = 'Giá trị phải là số nguyên dương.';
    }
  });

  const overdueDays = Number(form.overdueDays);
  if (!Number.isInteger(overdueDays) || overdueDays <= 0) {
    errors.overdueDays = 'Số ngày quá hạn phải là số nguyên dương.';
  }

  if (!Number.isFinite(Number(form.amount)) || Number(form.amount) <= 0) {
    errors.amount = 'Số tiền phải lớn hơn 0.';
  }

  if (!['UNPAID', 'PAID', 'WAIVED'].includes(form.status)) {
    errors.status = 'Trạng thái không hợp lệ.';
  }

  return errors;
}

function makeFinePayload(form) {
  const overdueDays = Number(form.overdueDays || 0);
  return {
    userId: Number(form.userId),
    memberName: form.memberName.trim(),
    memberCode: form.memberCode.trim(),
    email: form.email.trim(),
    borrowDetailId: Number(form.borrowDetailId),
    bookTitle: form.bookTitle.trim(),
    barcode: form.barcode.trim(),
    dueDate: form.dueDate,
    returnDate: form.returnDate,
    overdueDays,
    ratePerDay: DAILY_FINE_RATE,
    amount: form.amount === '' ? overdueDays * DAILY_FINE_RATE : Number(form.amount),
    status: form.status,
    reason: 'OVERDUE',
  };
}

function getNextFineId(records) {
  return records.reduce((max, fine) => Math.max(max, Number(fine.fineId) || 0), 9000) + 1;
}

export default function FineManagement() {
  const staffUser = getStoredStaffUser();
  const [workspace, setWorkspace] = useState('fines');
  const [activeSection, setActiveSection] = useState('list');
  const [borrowDetails, setBorrowDetails] = useState(() => [...getBorrowRecords(), ...sampleBorrowDetails]);
  const [fines, setFines] = useState(() => {
    if (localStorage.getItem(FINE_RECORDS_KEY) !== null) {
      return getFineRecords();
    }

    const storedFines = getFineRecords();
    return storedFines.length ? storedFines : initialFines;
  });
  const [selectedFineId, setSelectedFineId] = useState(() => {
    const storedFines = localStorage.getItem(FINE_RECORDS_KEY) !== null ? getFineRecords() : initialFines;
    return storedFines[0]?.fineId || '';
  });
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [query, setQuery] = useState('');
  const [calculateForm, setCalculateForm] = useState({
    borrowDetailId: String((getBorrowRecords()[0] || sampleBorrowDetails[0]).borrowDetailId),
  });
  const [collectionForm, setCollectionForm] = useState({
    paymentMethod: 'Tiền mặt',
    transferBank: '',
    transferCode: '',
    note: '',
  });
  const [fineForm, setFineForm] = useState(DEFAULT_FINE_FORM);
  const [fineFormErrors, setFineFormErrors] = useState({});
  const [fineFormMode, setFineFormMode] = useState('create');
  const [confirmTarget, setConfirmTarget] = useState(null);
  const [toast, showToast, clearToast] = useToast();

  const unpaidFines = useMemo(() => fines.filter((fine) => fine.status === 'UNPAID'), [fines]);
  const isPaymentWorkflow = activeSection === 'collection' || activeSection === 'paid';
  const selectedFine = isPaymentWorkflow
    ? unpaidFines.find((fine) => fine.fineId === selectedFineId) || unpaidFines[0] || null
    : fines.find((fine) => fine.fineId === selectedFineId) || null;
  useEffect(() => {
    saveFineRecords(fines);
  }, [fines]);

  useEffect(() => {
    const refreshBorrowDetails = () => setBorrowDetails([...getBorrowRecords(), ...sampleBorrowDetails]);
    window.addEventListener('storage', refreshBorrowDetails);
    return () => window.removeEventListener('storage', refreshBorrowDetails);
  }, []);

  const fineBorrowDetails = useMemo(() => (
    fines.map((fine) => {
      const sourceBorrow = borrowDetails.find((item) => item.borrowDetailId === fine.borrowDetailId) || {};

      return {
        ...sourceBorrow,
        borrowDetailId: fine.borrowDetailId,
        memberId: fine.userId,
        memberName: fine.memberName,
        memberCode: fine.memberCode,
        email: fine.email,
        bookTitle: fine.bookTitle,
        barcode: fine.barcode,
        dueDate: fine.dueDate,
        returnDate: fine.returnDate,
        overdueDays: fine.overdueDays,
        ratePerDay: fine.ratePerDay,
        amount: fine.amount,
        calculatedAt: fine.calculatedAt,
        reason: fine.reason,
        fineStatus: fine.status,
        status: sourceBorrow.status || (fine.status === 'PAID' ? 'FINE_PAID' : 'FINE_UNPAID'),
      };
    })
  ), [borrowDetails, fines]);

  const selectedBorrowDetail =
    fineBorrowDetails.find((item) => item.borrowDetailId === Number(calculateForm.borrowDetailId)) ||
    fineBorrowDetails[0] ||
    null;
  const calculateBorrowDetailId = selectedBorrowDetail ? String(selectedBorrowDetail.borrowDetailId) : '';
  const calculatedPreviewDays = selectedBorrowDetail
    ? Number(selectedBorrowDetail.overdueDays) || calculateOverdueDays(selectedBorrowDetail.dueDate, selectedBorrowDetail.returnDate)
    : 0;
  const calculatedPreviewAmount = selectedBorrowDetail?.amount !== undefined
    ? Number(selectedBorrowDetail.amount) || 0
    : calculatedPreviewDays * DAILY_FINE_RATE;

  const filteredFines = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase();

    return fines
      .filter((fine) => {
        const matchesStatus = statusFilter === 'ALL' || fine.status === statusFilter;
        const matchesQuery =
          !normalizedQuery ||
          fine.memberName.toLowerCase().includes(normalizedQuery) ||
          fine.memberCode.toLowerCase().includes(normalizedQuery) ||
          fine.bookTitle.toLowerCase().includes(normalizedQuery) ||
          String(fine.borrowDetailId).includes(normalizedQuery);

        return matchesStatus && matchesQuery;
      })
      .sort((first, second) => Number(first.fineId) - Number(second.fineId));
  }, [fines, query, statusFilter]);

  const stats = useMemo(() => {
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
  }, [fines, unpaidFines]);

  const activeMeta = fineSections.find((item) => item.key === activeSection) || fineSections[0];
  const isBankTransfer = collectionForm.paymentMethod === BANK_TRANSFER_METHOD;
  const transferContent = getTransferContent(selectedFine);

  function resetFineForm() {
    setFineForm(DEFAULT_FINE_FORM);
    setFineFormErrors({});
    setFineFormMode('create');
  }

  function chooseFine(fineOrId, nextSection = activeSection) {
    const fine = typeof fineOrId === 'object'
      ? fineOrId
      : fines.find((item) => item.fineId === fineOrId);

    if (!fine) {
      return;
    }

    setSelectedFineId(fine.fineId);
    setActiveSection(nextSection);
    setFineForm(fineToForm(fine));
    setFineFormErrors({});
    setFineFormMode('edit');
  }

  function handleSaveFine(event) {
    event.preventDefault();
    const errors = validateFineForm(fineForm);
    setFineFormErrors(errors);

    if (Object.keys(errors).length) {
      showToast('Vui lòng sửa các trường phiếu phạt được đánh dấu.', 'error');
      return;
    }

    const payload = makeFinePayload(fineForm);
    const isEdit = fineFormMode === 'edit' && fineForm.fineId;
    const duplicateFine = fines.find(
      (fine) =>
        fine.borrowDetailId === payload.borrowDetailId &&
        fine.reason === 'OVERDUE' &&
        (!isEdit || Number(fine.fineId) !== Number(fineForm.fineId))
    );

    if (duplicateFine) {
      showToast('Chi tiết mượn này đã có phiếu phạt quá hạn.', 'error');
      return;
    }

    const previousFine = isEdit
      ? fines.find((fine) => Number(fine.fineId) === Number(fineForm.fineId)) || {}
      : {};
    const savedFine = {
      ...previousFine,
      fineId: isEdit ? Number(fineForm.fineId) : getNextFineId(fines),
      ...payload,
      paidAmount: payload.status === 'PAID' ? payload.amount : 0,
      calculatedAt: previousFine.calculatedAt || new Date().toISOString(),
      paidAt: payload.status === 'PAID' ? previousFine.paidAt || new Date().toISOString() : '',
    };

    setFines((current) =>
      isEdit
        ? current.map((fine) => (fine.fineId === savedFine.fineId ? savedFine : fine))
        : [savedFine, ...current]
    );
    chooseFine(savedFine);
    showToast(isEdit ? 'Đã lưu thay đổi phiếu phạt.' : 'Đã thêm phiếu phạt vào danh sách.');
  }

  function handleDeleteFine() {
    if (!selectedFine) {
      showToast('Vui lòng chọn một phiếu phạt trước.', 'error');
      return;
    }

    const remainingFines = fines.filter((fine) => fine.fineId !== selectedFine.fineId);
    setFines(remainingFines);
    setSelectedFineId(remainingFines[0]?.fineId || '');
    resetFineForm();
    showToast('Đã xóa phiếu phạt khỏi danh sách.');
  }

  function handleCalculateFine(event) {
    event.preventDefault();
    const borrowDetailId = Number(calculateBorrowDetailId);
    const borrowDetail = fineBorrowDetails.find((item) => item.borrowDetailId === borrowDetailId);

    if (!borrowDetailId) {
      showToast('Không có chi tiết mượn quá hạn để tính tiền phạt.', 'error');
      return;
    }

    if (!borrowDetail) {
      showToast('Không tìm thấy chi tiết mượn.', 'error');
      return;
    }

    const paidFine = fines.find(
      (fine) => fine.borrowDetailId === borrowDetailId && fine.reason === 'OVERDUE' && fine.status === 'PAID'
    );

    if (paidFine) {
      chooseFine(paidFine.fineId, 'list');
      showToast('Phiếu phạt này đã thanh toán, không thể tính lại.', 'error');
      return;
    }

    const overdueDays = Number(borrowDetail.overdueDays) || calculateOverdueDays(borrowDetail.dueDate, borrowDetail.returnDate);

    if (overdueDays <= 0) {
      showToast('Không tạo phiếu phạt vì sách chưa quá hạn.', 'success');
      return;
    }

    const existingFine = fines.find(
      (fine) => fine.borrowDetailId === borrowDetailId && fine.reason === 'OVERDUE' && fine.status === 'UNPAID'
    );
    const amount = Number(borrowDetail.amount) || overdueDays * DAILY_FINE_RATE;

    if (existingFine) {
      const updatedFine = {
        ...existingFine,
        overdueDays,
        amount,
        calculatedAt: new Date().toISOString(),
      };

      setFines((current) =>
        current.map((fine) =>
          fine.fineId === existingFine.fineId ? updatedFine : fine
        )
      );
      chooseFine(updatedFine, 'list');
      showToast('Đã cập nhật phiếu phạt chưa thanh toán hiện có, không tạo trùng.');
      return;
    }

    const newFine = {
      fineId: getNextFineId(fines),
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
    chooseFine(newFine, 'list');
    showToast('Đã tính tiền phạt quá hạn và thêm vào danh sách phiếu phạt.');
  }

  function recordCollection() {
    if (!selectedFine || selectedFine.status !== 'UNPAID') {
      showToast('Chỉ phiếu chưa thanh toán mới được ghi nhận thu tiền.', 'error');
      return;
    }

    if (isBankTransfer) {
      const transferBank = collectionForm.transferBank.trim();
      const transferCode = collectionForm.transferCode.trim();

      if (!transferBank) {
        showToast('Vui lòng nhập ngân hàng chuyển khoản của khách.', 'error');
        return;
      }

      if (transferCode.length < 6) {
        showToast('Vui lòng nhập mã giao dịch chuyển khoản tối thiểu 6 ký tự.', 'error');
        return;
      }

      const duplicateTransfer = fines.some(
        (fine) =>
          fine.fineId !== selectedFine.fineId &&
          fine.paymentMethod === BANK_TRANSFER_METHOD &&
          fine.collectionNote?.includes(`Mã giao dịch: ${transferCode}`)
      );

      if (duplicateTransfer) {
        showToast('Mã giao dịch này đã được ghi nhận cho phiếu phạt khác.', 'error');
        return;
      }
    }

    const transferNote = isBankTransfer
      ? [
          `Chuyển khoản ${formatCurrency(selectedFine.amount)} vào ${libraryBankAccount.bankName} - ${libraryBankAccount.accountNumber}.`,
          `Nội dung: ${transferContent}.`,
          `Ngân hàng khách: ${collectionForm.transferBank.trim()}.`,
          `Mã giao dịch: ${collectionForm.transferCode.trim()}.`,
        ].join(' ')
      : 'Đã thu trực tiếp tại quầy lưu thông.';
    const collectionNote = [collectionForm.note.trim(), transferNote].filter(Boolean).join(' ');

    setFines((current) =>
      current.map((fine) =>
        fine.fineId === selectedFine.fineId
          ? {
              ...fine,
              paidAmount: fine.amount,
              paymentReviewStatus: 'PENDING',
              paymentReviewRequestedAt: new Date().toISOString(),
              collectionNote,
              paymentMethod: collectionForm.paymentMethod,
              collectedAt: new Date().toISOString(),
              collectedBy: staffUser?.email || 'Thủ thư demo',
            }
          : fine
      )
    );
    showToast(isBankTransfer ? 'Đã ghi nhận giao dịch chuyển khoản cho phiếu phạt.' : 'Đã ghi nhận thông tin thu tiền phạt.');
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
    showToast('Đã đánh dấu phiếu phạt là đã thanh toán.');
  }

  return (
    <AppLayout
      active="fine-management"
      title={workspace === 'books' ? 'Quản lý sách' : activeMeta.label}
      subtitle={workspace === 'books' ? 'Theo dõi thông tin đầu sách hiện có.' : activeMeta.description}
    >
      <StatusNotice type="warning" title="Dữ liệu trình diễn">
        Giao diện tiền phạt vẫn dùng dữ liệu mẫu và localStorage cho đến khi FE09-T012 được triển khai.
      </StatusNotice>

      <div className="tabs" aria-label="Không gian nghiệp vụ">
        <button type="button" className={`tab${workspace === 'books' ? ' active' : ''}`} onClick={() => setWorkspace('books')}>
          <BookOpen size={14} /> Quản lý sách
        </button>
        <button type="button" className={`tab${workspace === 'fines' ? ' active' : ''}`} onClick={() => setWorkspace('fines')}>
          <ReceiptText size={14} /> Quản lý tiền phạt
        </button>
      </div>

      <div className="tabs" aria-label="Nghiệp vụ tiền phạt" hidden={workspace !== 'fines'}>
        {fineSections.map((item) => {
          const Icon = item.icon;
          return (
            <button type="button" key={item.key} className={`tab${activeSection === item.key ? ' active' : ''}`} onClick={() => setActiveSection(item.key)}>
              <Icon size={14} /> {item.label}
            </button>
          );
        })}
      </div>

        {workspace === 'books' ? (
          <BookManagement />
        ) : (
          <>
        <div className="fine-policy" style={{ marginBottom: 18 }}>
            <ShieldCheck size={20} />
            <div>
              <strong>Chính sách giai đoạn 1</strong>
              <span>Chỉ xử lý phạt quá hạn. Bản chính thức phải tính tiền phạt và phân quyền ở máy chủ.</span>
            </div>
        </div>

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

        {activeSection === 'list' && (
          <section className="fine-grid">
            <div className="fine-panel fine-list-panel">
              <div className="fine-panel-head">
                <div>
                  <p>Theo dõi phiếu phạt</p>
                  <h2>Danh sách phiếu phạt</h2>
                </div>
                <StatusBadge status={selectedFine?.status || 'UNPAID'} />
              </div>

              <DataToolbar
                primary={(
                  <div className="search-input">
                    <Search size={18} />
                    <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Tìm thành viên, sách, mã mượn..." aria-label="Tìm phiếu phạt" />
                  </div>
                )}
                filters={(
                  <div className="row-flex">
                    <Filter size={17} />
                    <select className="select" value={statusFilter} onChange={(event) => setStatusFilter(event.target.value)} aria-label="Lọc trạng thái phiếu phạt">
                      {Object.entries(statusLabels).map(([value, label]) => <option key={value} value={value}>{label}</option>)}
                    </select>
                  </div>
                )}
                actions={(
                  <>
                    <button type="button" className="btn btn-outline" onClick={resetFineForm}><Plus size={15} /> Tạo mới</button>
                    <button type="button" className="btn btn-danger" onClick={() => setConfirmTarget({ type: 'delete', fine: selectedFine })} disabled={!selectedFine}><Trash2 size={15} /> Xóa</button>
                  </>
                )}
              />

              <form className="fine-crud-form" onSubmit={handleSaveFine}>
                <div className="fine-crud-head">
                  <strong>{fineFormMode === 'edit' ? `Chỉnh sửa phiếu #${fineForm.fineId}` : 'Thêm phiếu phạt'}</strong>
                </div>

                <div className="fine-crud-grid">
                  {[
                    ['userId', 'Mã người dùng', 'number'],
                    ['memberName', 'Tên thành viên', 'text'],
                    ['memberCode', 'Mã thành viên', 'text'],
                    ['email', 'Email', 'email'],
                    ['borrowDetailId', 'Mã chi tiết mượn', 'number'],
                    ['bookTitle', 'Tên sách', 'text'],
                    ['barcode', 'Barcode', 'text'],
                    ['dueDate', 'Ngày đến hạn', 'date'],
                    ['returnDate', 'Ngày trả', 'date'],
                    ['overdueDays', 'Số ngày quá hạn', 'number'],
                    ['amount', 'Số tiền', 'number'],
                  ].map(([field, label, type]) => (
                    <label key={field}>
                      {label}
                      <input
                        type={type}
                        value={fineForm[field]}
                        min={type === 'number' ? 1 : undefined}
                        step={type === 'number' ? 1 : undefined}
                        onChange={(event) => setFineForm((current) => ({ ...current, [field]: event.target.value }))}
                      />
                      {fineFormErrors[field] && <span>{fineFormErrors[field]}</span>}
                    </label>
                  ))}

                  <label>
                    Trạng thái
                    <select
                      value={fineForm.status}
                      onChange={(event) => setFineForm((current) => ({ ...current, status: event.target.value }))}
                    >
                      <option value="UNPAID">Chưa thanh toán</option>
                      <option value="PAID">Đã thanh toán</option>
                      <option value="WAIVED">Đã miễn</option>
                    </select>
                    {fineFormErrors.status && <span>{fineFormErrors.status}</span>}
                  </label>
                </div>

                <button type="submit" className="fine-save-button">
                  <Check size={16} />{fineFormMode === 'edit' ? 'Lưu thay đổi' : 'Thêm phiếu phạt'}
                </button>
              </form>

              <DataTable
                caption="Fine records table"
                headers={['Phiếu phạt', 'Thành viên', 'Sách', 'Quá hạn', 'Số tiền', 'Trạng thái']}
                isEmpty={filteredFines.length === 0}
                emptyState={(
                  <EmptyState
                    icon={ReceiptText}
                    title="Không có phiếu phạt phù hợp"
                    action={(query || statusFilter !== 'ALL') ? (
                      <button type="button" className="btn btn-outline" onClick={() => { setQuery(''); setStatusFilter('ALL'); }}>Xóa bộ lọc</button>
                    ) : null}
                  />
                )}
              >
                {filteredFines.map((fine) => (
                  <tr key={fine.fineId} className={fine.fineId === selectedFine?.fineId ? 'selected' : ''} onClick={() => chooseFine(fine.fineId)}>
                    <td data-label="Phiếu phạt">#{fine.fineId}</td>
                    <td data-label="Thành viên"><strong>{fine.memberName}</strong><span className="field-hint">{fine.memberCode}</span></td>
                    <td data-label="Sách"><strong>{fine.bookTitle}</strong><span className="field-hint">{fine.barcode}</span></td>
                    <td data-label="Quá hạn">{fine.overdueDays} ngày</td>
                    <td data-label="Số tiền">{formatCurrency(fine.amount)}</td>
                    <td data-label="Trạng thái"><StatusBadge status={fine.status} /></td>
                  </tr>
                ))}
              </DataTable>
            </div>

            <FineDetailPanel selectedFine={selectedFine} />
          </section>
        )}

        {activeSection === 'calculate' && (
          <section className="fine-section-layout">
            <form className="fine-panel fine-form-panel" onSubmit={handleCalculateFine}>
              <div className="fine-panel-head">
                <div>
                  <p>Tạo phiếu từ mượn trả</p>
                  <h2>Tính tiền phạt</h2>
                </div>
                <Calculator size={24} />
              </div>

              <label>
                Chi tiết mượn
                <select
                  value={calculateBorrowDetailId}
                  onChange={(event) => setCalculateForm({ borrowDetailId: event.target.value })}
                >
                  {fineBorrowDetails.map((item) => (
                    <option key={item.borrowDetailId} value={item.borrowDetailId}>
                      #{item.borrowDetailId} - {item.memberName} - {item.bookTitle}
                    </option>
                  ))}
                </select>
              </label>

              {fineBorrowDetails.length === 0 && <EmptyState icon={ReceiptText} title="Không có chi tiết mượn trong danh sách phiếu phạt" />}

              <div className="fine-preview-grid">
                <div>
                  <span>Ngày đến hạn</span>
                  <strong>{formatDate(selectedBorrowDetail?.dueDate)}</strong>
                </div>
                <div>
                  <span>Ngày trả/hiện tại</span>
                  <strong>{formatDate(selectedBorrowDetail?.returnDate || getTodayValue())}</strong>
                </div>
                <div>
                  <span>Số ngày quá hạn</span>
                  <strong>{calculatedPreviewDays} ngày</strong>
                </div>
                <div>
                  <span>Tiền phạt dự kiến</span>
                  <strong>{formatCurrency(calculatedPreviewAmount)}</strong>
                </div>
              </div>

              <button type="submit"><Calculator size={17} />Tính phạt quá hạn</button>
            </form>

            <div className="fine-panel fine-guide-panel">
              <h2>Quy trình đề xuất</h2>
              <ol>
                <li>Chọn chi tiết mượn đã quá hạn.</li>
                <li>Kiểm tra ngày đến hạn, ngày trả và số ngày quá hạn.</li>
                <li>Tạo phiếu phạt rồi quay về danh sách để xử lý thu tiền.</li>
              </ol>
            </div>
          </section>
        )}

        {activeSection === 'collection' && (
          <section className="fine-section-layout">
            <form
              className="fine-panel fine-form-panel"
              onSubmit={(event) => {
                event.preventDefault();
                if (selectedFine) setConfirmTarget({ type: 'collect', fine: selectedFine });
              }}
            >
              <div className="fine-panel-head">
                <div>
                  <p>Thu tiền tại quầy</p>
                  <h2>Ghi nhận thu tiền</h2>
                </div>
                <CreditCard size={24} />
              </div>

              <label>
                Phiếu phạt cần thu
                <select value={selectedFine?.fineId || ''} onChange={(event) => setSelectedFineId(Number(event.target.value))}>
                  {unpaidFines.map((fine) => (
                    <option key={fine.fineId} value={fine.fineId}>
                      #{fine.fineId} - {fine.memberName} - {formatCurrency(fine.amount)}
                    </option>
                  ))}
                </select>
              </label>

              {unpaidFines.length === 0 && <EmptyState icon={ReceiptText} title="Không còn phiếu phạt chưa thanh toán để ghi nhận thu tiền" />}

              <label>
                Phương thức thanh toán
                <select
                  value={collectionForm.paymentMethod}
                  onChange={(event) => setCollectionForm((current) => ({ ...current, paymentMethod: event.target.value }))}
                >
                  <option>Tiền mặt</option>
                  <option>{BANK_TRANSFER_METHOD}</option>
                  <option>Quẹt thẻ tại quầy</option>
                </select>
              </label>

              {isBankTransfer && (
                <div className="fine-transfer-card">
                  <div className="fine-transfer-head">
                    <Banknote size={20} />
                    <div>
                      <strong>Thông tin chuyển khoản</strong>
                      <span>Yêu cầu khách chuyển đúng số tiền và nội dung để thủ thư đối soát.</span>
                    </div>
                  </div>

                  <div className="fine-transfer-grid">
                    <div>
                      <span>Ngân hàng nhận</span>
                      <strong>{libraryBankAccount.bankName}</strong>
                    </div>
                    <div>
                      <span>Số tài khoản</span>
                      <strong>{libraryBankAccount.accountNumber}</strong>
                    </div>
                    <div>
                      <span>Chủ tài khoản</span>
                      <strong>{libraryBankAccount.accountName}</strong>
                    </div>
                    <div>
                      <span>Số tiền</span>
                      <strong>{selectedFine ? formatCurrency(selectedFine.amount) : '-'}</strong>
                    </div>
                  </div>

                  <div className="fine-copy-line">
                    <span>Nội dung chuyển khoản</span>
                    <strong>{transferContent}</strong>
                  </div>

                  <label>
                    Ngân hàng khách đã chuyển
                    <input
                      value={collectionForm.transferBank}
                      onChange={(event) => setCollectionForm((current) => ({ ...current, transferBank: event.target.value }))}
                      placeholder="Ví dụ: VietinBank, MB Bank, Techcombank..."
                    />
                  </label>

                  <label>
                    Mã giao dịch chuyển khoản
                    <input
                      value={collectionForm.transferCode}
                      onChange={(event) => setCollectionForm((current) => ({ ...current, transferCode: event.target.value.trim().toUpperCase() }))}
                      placeholder="Ví dụ: FT2523456789"
                    />
                  </label>
                </div>
              )}

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

            <FineDetailPanel selectedFine={selectedFine} compact />
          </section>
        )}

        {activeSection === 'paid' && (
          <section className="fine-section-layout">
            <div className="fine-panel fine-form-panel">
              <div className="fine-panel-head">
                <div>
                  <p>Hoàn tất phiếu phạt</p>
                  <h2>Đánh dấu đã thanh toán</h2>
                </div>
                <FileText size={24} />
              </div>

              {unpaidFines.length === 0 ? (
                <EmptyState icon={ReceiptText} title="Không còn phiếu phạt chưa thanh toán để tất toán" />
              ) : (
                <>
                  <label>
                    Phiếu phạt cần tất toán
                    <select value={selectedFine?.fineId || ''} onChange={(event) => setSelectedFineId(Number(event.target.value))}>
                      {unpaidFines.map((fine) => (
                        <option key={fine.fineId} value={fine.fineId}>
                          #{fine.fineId} - {fine.memberName} - {formatCurrency(fine.amount)}
                        </option>
                      ))}
                    </select>
                  </label>

                  <div className="fine-paid-preview">
                    <span>Phiếu đang chọn</span>
                    <strong>{selectedFine ? `#${selectedFine.fineId}` : '-'}</strong>
                    <span>Số tiền cần tất toán</span>
                    <strong>{selectedFine ? formatCurrency(selectedFine.amount) : '-'}</strong>
                    <span>Trạng thái hiện tại</span>
                    <strong>{selectedFine ? statusLabels[selectedFine.status] : '-'}</strong>
                  </div>

                  <button onClick={() => setConfirmTarget({ type: 'paid', fine: selectedFine })} disabled={!selectedFine || selectedFine.status !== 'UNPAID'}>
                    <Check size={17} />Đánh dấu đã thanh toán
                  </button>
                </>
              )}
            </div>

            <div className="fine-panel fine-guide-panel">
              <h2>Lưu ý trước khi tất toán</h2>
              <ol>
                <li>Chỉ tất toán phiếu đã thu đủ tiền hoặc được xác nhận thanh toán.</li>
                <li>Nếu chưa ghi nhận thu tiền, hệ thống sẽ tự ghi nhận theo phương thức đang chọn.</li>
                <li>Phiếu đã thanh toán không thể bấm lại trong giao diện này.</li>
              </ol>
            </div>
          </section>
        )}
          </>
        )}
      {confirmTarget && (
        <ConfirmAction
          title={confirmTarget.type === 'delete' ? 'Xóa phiếu phạt' : confirmTarget.type === 'collect' ? 'Ghi nhận thu tiền' : 'Đánh dấu đã thanh toán'}
          tone={confirmTarget.type === 'delete' ? 'danger' : 'primary'}
          confirmLabel={confirmTarget.type === 'delete' ? 'Xóa phiếu' : 'Xác nhận'}
          onCancel={() => setConfirmTarget(null)}
          onConfirm={() => {
            if (confirmTarget.type === 'delete') handleDeleteFine();
            if (confirmTarget.type === 'collect') recordCollection();
            if (confirmTarget.type === 'paid') handleMarkPaid();
            setConfirmTarget(null);
          }}
        >
          <p>Kiểm tra lại phiếu phạt <strong>#{confirmTarget.fine?.fineId}</strong> và số tiền trước khi tiếp tục.</p>
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}

function FineDetailPanel({ selectedFine, compact = false }) {
  return (
    <aside className={`fine-panel fine-detail-panel ${compact ? 'compact' : ''}`}>
      <div className="fine-panel-head">
        <div>
          <p>Phiếu đang chọn</p>
          <h2>{selectedFine ? `Phiếu phạt #${selectedFine.fineId}` : 'Chưa chọn phiếu'}</h2>
        </div>
        <ReceiptText size={22} />
      </div>

      {!selectedFine ? (
        <EmptyState icon={ReceiptText} title="Chọn một phiếu phạt để xem chi tiết" />
      ) : (
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
            <div><dt>Trạng thái</dt><dd><StatusBadge status={selectedFine.status} /></dd></div>
            <div><dt>Mã chi tiết mượn</dt><dd>#{selectedFine.borrowDetailId}</dd></div>
            <div><dt>Sách</dt><dd>{selectedFine.bookTitle}</dd></div>
            <div><dt>Lý do</dt><dd>{selectedFine.reason === 'OVERDUE' ? 'Quá hạn' : selectedFine.reason}</dd></div>
            <div><dt>Ngày đến hạn</dt><dd>{formatDate(selectedFine.dueDate)}</dd></div>
            <div><dt>Ngày trả/hiện tại</dt><dd>{formatDate(selectedFine.returnDate || getTodayValue())}</dd></div>
            <div><dt>Ngày tính phạt</dt><dd>{formatDate(selectedFine.calculatedAt)}</dd></div>
            <div><dt>Phương thức thu</dt><dd>{selectedFine.paymentMethod || '-'}</dd></div>
            <div><dt>Người thu</dt><dd>{selectedFine.collectedBy || '-'}</dd></div>
            <div><dt>Ngày thanh toán</dt><dd>{formatDate(selectedFine.paidAt)}</dd></div>
            <div><dt>Ghi chú thu tiền</dt><dd>{selectedFine.collectionNote || '-'}</dd></div>
          </dl>
        </>
      )}
    </aside>
  );
}
