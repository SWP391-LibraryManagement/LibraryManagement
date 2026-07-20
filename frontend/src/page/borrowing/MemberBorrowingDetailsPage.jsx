/** FE07 - UC34 - Member Borrowing Details (Librarian/Admin). */

import { useEffect, useMemo, useState } from 'react';
import {
  Barcode,
  BookOpen,
  CalendarClock,
  ChevronLeft,
  ChevronRight,
  Hash,
  Mail,
  Phone,
  RefreshCw,
  Search,
  UserRound,
} from 'lucide-react';

import { borrowingApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable } from '../../component/shared/OperationalPatterns';
import { fmtDate, statusToUi } from '../../utils/libraryFeatureViewModels';
import { getStatusLabel } from '../../utils/uiLabels';

const PAGE_SIZE = 8;
const STATUS_OPTIONS = [
  { value: 'ALL', label: 'Tất cả trạng thái' },
  { value: 'REQUESTED', label: 'Chờ duyệt' },
  { value: 'BORROWED', label: 'Đang mượn' },
  { value: 'OVERDUE', label: 'Quá hạn' },
  { value: 'RETURNED', label: 'Đã trả' },
  { value: 'DAMAGED', label: 'Hư hỏng' },
  { value: 'LOST', label: 'Mất sách' },
];

function normalize(value) {
  return String(value || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function toMemberDirectory(requests = []) {
  const members = new Map();
  requests.forEach((request) => {
    const member = request.member;
    if (!member?.userId) return;
    members.set(member.userId, {
      userId: member.userId,
      memberId: member.memberId || member.userId,
      name: member.fullName || member.username || member.email || `Thành viên #${member.userId}`,
      username: member.username || '—',
      email: member.email || '—',
      phone: member.phone || '—',
      status: member.status || '—',
    });
  });
  return [...members.values()].sort((left, right) => left.memberId - right.memberId);
}

function mapBorrowing(detail) {
  const rawStatus = String(detail.status || '').toUpperCase();
  return {
    id: detail.borrowDetailId,
    requestId: detail.requestId,
    book: detail.copy?.title || `Bản sao #${detail.copyId}`,
    author: detail.copy?.author || '—',
    barcode: detail.copy?.barcode || '—',
    location: detail.copy?.location || '—',
    borrowDate: detail.borrowDate || detail.createdAt,
    dueDate: detail.dueDate,
    returnDate: detail.returnDate,
    rawStatus,
    status: statusToUi(rawStatus, { expiresAt: detail.dueDate }),
  };
}

export default function MemberBorrowingDetailsPage() {
  const [members, setMembers] = useState([]);
  const [selectedUserId, setSelectedUserId] = useState('');
  const [rows, setRows] = useState([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [transactionSearch, setTransactionSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [page, setPage] = useState(1);
  const [loadingDirectory, setLoadingDirectory] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [notice, setNotice] = useState('');
  const [lastUpdated, setLastUpdated] = useState('');

  async function loadMemberBorrowings(userId) {
    if (!userId) {
      setRows([]);
      return;
    }
    setLoadingDetails(true);
    setNotice('');
    try {
      const data = await borrowingApi.listMemberBorrowings(userId);
      setRows((data.borrowings || []).map(mapBorrowing));
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      setPage(1);
    } catch (error) {
      setRows([]);
      setNotice(error.message || 'Không thể tải lịch sử mượn của thành viên.');
    } finally {
      setLoadingDetails(false);
    }
  }

  async function loadDirectory() {
    setLoadingDirectory(true);
    setNotice('');
    try {
      const data = await borrowingApi.listAll();
      const directory = toMemberDirectory(data.borrowRequests || []);
      setMembers(directory);
      const nextUserId = directory.some((item) => String(item.userId) === String(selectedUserId))
        ? selectedUserId
        : String(directory[0]?.userId || '');
      setSelectedUserId(nextUserId);
      await loadMemberBorrowings(nextUserId);
    } catch (error) {
      setMembers([]);
      setRows([]);
      setNotice(error.message || 'Không thể tải danh sách thành viên.');
    } finally {
      setLoadingDirectory(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(loadDirectory, 0);
    return () => window.clearTimeout(timer);
    // Chỉ tải danh mục lần đầu; các lần tải tiếp theo do người dùng chủ động.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const visibleMembers = useMemo(() => {
    const query = normalize(memberSearch);
    return members.filter((member) => !query || normalize([
      member.memberId,
      member.userId,
      member.name,
      member.username,
      member.email,
      member.phone,
    ].join(' ')).includes(query));
  }, [members, memberSearch]);

  const selectedMember = members.find((item) => String(item.userId) === String(selectedUserId)) || null;
  const filteredRows = useMemo(() => {
    const query = normalize(transactionSearch);
    return rows.filter((row) => (statusFilter === 'ALL' || row.rawStatus === statusFilter)
      && (!query || normalize([row.id, row.requestId, row.book, row.author, row.barcode, row.location].join(' ')).includes(query)));
  }, [rows, statusFilter, transactionSearch]);
  const totalPages = Math.max(1, Math.ceil(filteredRows.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageRows = filteredRows.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);
  const activeCount = rows.filter((row) => ['BORROWED', 'OVERDUE'].includes(row.rawStatus)).length;
  const pendingCount = rows.filter((row) => row.rawStatus === 'REQUESTED').length;
  const returnedCount = rows.filter((row) => row.rawStatus === 'RETURNED').length;

  async function selectMember(userId) {
    setSelectedUserId(String(userId));
    setTransactionSearch('');
    setStatusFilter('ALL');
    await loadMemberBorrowings(userId);
  }

  return (
    <AppLayout
      active="member-details"
      title="Chi tiết mượn sách của thành viên"
      subtitle="Tra cứu hồ sơ thành viên và toàn bộ giao dịch mượn, trả theo dữ liệu hệ thống."
      actions={(
        <button className="btn btn-outline" onClick={loadDirectory} disabled={loadingDirectory || loadingDetails}>
          <RefreshCw size={16} /> {loadingDirectory ? 'Đang tải...' : 'Tải lại'}
        </button>
      )}
    >
      {notice && <DataNotice type="error" title="Không thể tải thông tin">{notice}</DataNotice>}

      <div className="member-detail-layout">
        <aside className="member-directory" aria-label="Danh sách thành viên">
          <div className="member-directory-header">
            <div><strong>Thành viên có giao dịch</strong><span className="muted">{visibleMembers.length} thành viên</span></div>
            <div className="member-directory-search"><Search size={16} /><input value={memberSearch} onChange={(event) => setMemberSearch(event.target.value)} placeholder="Tìm tên, email, mã..." aria-label="Tìm thành viên" /></div>
          </div>
          <div className="member-directory-list">
            {visibleMembers.map((member) => (
              <button key={member.userId} className={`member-directory-item${String(member.userId) === String(selectedUserId) ? ' active' : ''}`} onClick={() => selectMember(member.userId)}>
                <span className="app-avatar">{member.name.slice(0, 1).toUpperCase()}</span>
                <span><strong>{member.name}</strong><small>{member.email}</small><small>Mã hội viên: {member.memberId}</small></span>
              </button>
            ))}
            {!loadingDirectory && !visibleMembers.length && <EmptyState icon={UserRound} title="Không tìm thấy thành viên" />}
          </div>
        </aside>

        <section className="member-detail-content">
          {selectedMember ? (
            <>
              <article className="member-profile-card">
                <div className="app-avatar">{selectedMember.name.slice(0, 1).toUpperCase()}</div>
                <div className="member-profile-main"><h2>{selectedMember.name}</h2><span className="muted">@{selectedMember.username}</span></div>
                <Badge status={selectedMember.status}>{getStatusLabel(selectedMember.status)}</Badge>
                <div className="member-profile-meta">
                  <span><Hash size={15} /> Mã hội viên: <strong>{selectedMember.memberId}</strong></span>
                  <span><Mail size={15} /> {selectedMember.email}</span>
                  <span><Phone size={15} /> {selectedMember.phone}</span>
                </div>
              </article>

              <div className="member-borrow-stats">
                <div><BookOpen size={18} /><span>Đang mượn<strong>{activeCount}</strong></span></div>
                <div><CalendarClock size={18} /><span>Chờ duyệt<strong>{pendingCount}</strong></span></div>
                <div><RefreshCw size={18} /><span>Đã trả<strong>{returnedCount}</strong></span></div>
                <div><Hash size={18} /><span>Tổng giao dịch<strong>{rows.length}</strong></span></div>
              </div>

              <div className="member-borrow-toolbar">
                <div className="member-transaction-search"><Search size={16} /><input value={transactionSearch} onChange={(event) => { setTransactionSearch(event.target.value); setPage(1); }} placeholder="Tìm sách, tác giả, barcode..." aria-label="Tìm giao dịch mượn" /></div>
                <select value={statusFilter} onChange={(event) => { setStatusFilter(event.target.value); setPage(1); }} aria-label="Lọc trạng thái mượn">
                  {STATUS_OPTIONS.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
                </select>
                <span className="muted">{lastUpdated ? `Cập nhật lúc ${lastUpdated}` : ''}</span>
              </div>

              <div className="member-borrow-table">
                <DataTable
                  caption="Lịch sử mượn trả của thành viên"
                  headers={['Mã lượt', 'Sách / bản sao', 'Ngày mượn', 'Hạn trả', 'Ngày trả', 'Trạng thái']}
                  loading={loadingDetails}
                  isEmpty={!loadingDetails && pageRows.length === 0}
                  emptyState={<EmptyState icon={BookOpen} title="Không có giao dịch phù hợp" />}
                >
                  {pageRows.map((row) => (
                    <tr key={row.id} className={row.rawStatus === 'OVERDUE' ? 'row-overdue' : ''}>
                      <td data-label="Mã lượt"><strong>#{row.id}</strong></td>
                      <td data-label="Sách / bản sao"><div className="stack-sm"><strong>{row.book}</strong><span className="muted">{row.author}</span><span className="muted"><Barcode size={13} /> {row.barcode} • {row.location}</span></div></td>
                      <td data-label="Ngày mượn">{fmtDate(row.borrowDate)}</td>
                      <td data-label="Hạn trả">{fmtDate(row.dueDate)}</td>
                      <td data-label="Ngày trả">{fmtDate(row.returnDate)}</td>
                      <td data-label="Trạng thái"><Badge status={row.status}>{getStatusLabel(row.status)}</Badge></td>
                    </tr>
                  ))}
                </DataTable>
                {!loadingDetails && (
                  <nav className="pagination member-borrow-pagination" aria-label="Phân trang lịch sử mượn">
                    <span className="muted">Trang {safePage}/{totalPages} • {filteredRows.length} giao dịch</span>
                    <div className="page-controls">
                      <button className="page-btn" disabled={safePage <= 1} onClick={() => setPage(safePage - 1)} aria-label="Trang trước"><ChevronLeft size={16} /></button>
                      {Array.from({ length: totalPages }, (_, index) => <button key={index} className={`page-btn${safePage === index + 1 ? ' active' : ''}`} onClick={() => setPage(index + 1)}>{index + 1}</button>)}
                      <button className="page-btn" disabled={safePage >= totalPages} onClick={() => setPage(safePage + 1)} aria-label="Trang sau"><ChevronRight size={16} /></button>
                    </div>
                  </nav>
                )}
              </div>
            </>
          ) : !loadingDirectory && <EmptyState icon={UserRound} title="Chưa có thành viên có giao dịch mượn" />}
        </section>
      </div>
    </AppLayout>
  );
}
