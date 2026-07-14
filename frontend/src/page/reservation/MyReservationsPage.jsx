/**
 * FE08 - UC36 Reserve Book + UC37 Cancel Reservation (Member)
 * API thật: /api/reservations, /api/reservations/me, /api/reservations/:id/cancel.
 */

import { useEffect, useMemo, useState } from 'react';
import { Bookmark, BookOpen, Search, X, Clock, CheckCircle2, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

import { reservationApi } from '../../api/libraryFeatureApi';
import AppLayout from '../../component/layout/AppLayout';
import { Toast, useToast, ConfirmAction, Badge, DataNotice, EmptyState } from '../../component/shared/Feedback';
import { DataTable, DataToolbar } from '../../component/shared/OperationalPatterns';
import { DEMO_MY_RESERVATIONS, DEMO_RESERVABLE, fmtDate, mapReservation } from '../../utils/libraryFeatureViewModels';

export default function MyReservationsPage() {
  const navigate = useNavigate();
  const [reservations, setReservations] = useState(DEMO_MY_RESERVATIONS);
  const [search, setSearch] = useState('');
  const [cancelTarget, setCancelTarget] = useState(null);
  const [cancelling, setCancelling] = useState(false);
  const [loading, setLoading] = useState(false);
  const [notice, setNotice] = useState('Đang hiển thị dữ liệu demo để review UI đặt chỗ.');
  const [isDemo, setIsDemo] = useState(true);
  const [toast, showToast, clearToast] = useToast();

  async function loadReservations() {
    setLoading(true);
    try {
      const data = await reservationApi.listMine();
      setReservations((data.reservations || []).map(mapReservation));
      setIsDemo(false);
      setNotice('Dữ liệu đặt chỗ đã được cập nhật.');
    } catch (error) {
      setReservations(DEMO_MY_RESERVATIONS);
      setIsDemo(true);
      setNotice(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const timer = window.setTimeout(() => { loadReservations(); }, 0);
    return () => window.clearTimeout(timer);
  }, []);

  const matches = useMemo(() => {
    const query = search.trim().toLowerCase();
    return DEMO_RESERVABLE.filter((book) => !query || `${book.title} ${book.author}`.toLowerCase().includes(query));
  }, [search]);

  async function reserve(book) {
    if (book.availableCopies > 0) {
      showToast(`"${book.title}" đang có bản khả dụng. Vui lòng tạo yêu cầu mượn thay vì đặt chỗ.`, 'info');
      return;
    }
    if (reservations.some((item) => item.title === book.title && !['Cancelled', 'Expired'].includes(item.status))) {
      showToast(`Bạn đã có đặt chỗ đang hoạt động cho "${book.title}".`, 'info');
      return;
    }

    try {
      const data = await reservationApi.create(book.copyId);
      const next = mapReservation(data.reservation);
      setReservations((current) => [next, ...current]);
      setIsDemo(false);
      showToast(`Đã đặt "${next.title}". Vị trí hiện tại: #${next.queue}.`, 'success');
    } catch (error) {
      if (isDemo) {
        const next = {
          id: `RS-DEMO-${reservations.length + 900}`,
          reservationId: reservations.length + 900,
          copyId: book.copyId,
          title: book.title,
          author: book.author,
          reservedDate: new Date().toISOString(),
          queue: book.queue + 1,
          status: 'Waiting',
        };
        setReservations((current) => [next, ...current]);
        showToast('Backend chưa nhận yêu cầu; đã thêm đặt chỗ demo để kiểm tra UI.', 'info');
      } else {
        showToast(error.message, 'error');
      }
    }
  }

  async function confirmCancel() {
    if (!cancelTarget || cancelling) return;
    setCancelling(true);
    try {
      if (!isDemo) {
        await reservationApi.cancel(cancelTarget.reservationId, 'Cancelled by member from UI');
      }
      setReservations((current) => current.filter((item) => item.id !== cancelTarget.id));
      showToast(`Đã hủy đặt chỗ "${cancelTarget.title}".`, 'info');
      setCancelTarget(null);
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setCancelling(false);
    }
  }

  return (
    <AppLayout
      active="my-reservations"
      title="Đặt chỗ của tôi"
      subtitle="Đặt sách và theo dõi vị trí trong hàng đợi."
      actions={<button className="btn btn-outline" onClick={loadReservations} disabled={loading}><RefreshCw size={16} /> Tải lại</button>}
    >
      <DataNotice type={isDemo ? 'warning' : 'success'} title={isDemo ? 'Dữ liệu demo' : 'Đã cập nhật dữ liệu'}>{notice}</DataNotice>

      <div className="lib-card">
        <h3 className="lib-card-title">Đặt một cuốn sách</h3>
        <DataToolbar
          primary={(
            <div className="search-input" style={{ width: '100%' }}>
              <Search size={16} />
              <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm sách để đặt..." aria-label="Tìm sách" />
            </div>
          )}
        />
        <div className="queue-list">
          {matches.map((book) => (
            <div className="queue-item" key={book.id}>
              <span className="book-spine" style={{ background: 'linear-gradient(135deg,#a87532,#7b5528)' }} />
              <div className="stack-sm" style={{ flex: 1 }}><strong>{book.title}</strong><span className="muted" style={{ fontSize: 13 }}>{book.author}</span></div>
              <span className={`badge badge-${book.availableCopies > 0 ? 'available' : 'waiting'}`}>
                {book.availableCopies > 0 ? `${book.availableCopies} bản khả dụng • hãy mượn ngay` : `${book.queue} người đang chờ • ${book.eta}`}
              </span>
              {book.availableCopies > 0 ? (
                <button className="btn btn-outline btn-sm" onClick={() => navigate('/borrowing/new')}><BookOpen size={14} /> Mượn ngay</button>
              ) : (
                <button className="btn btn-primary btn-sm" onClick={() => reserve(book)}><Bookmark size={14} /> Đặt chỗ</button>
              )}
            </div>
          ))}
          {matches.length === 0 && <EmptyState icon={BookOpen} title="Không tìm thấy sách" />}
        </div>
      </div>

      <div className="lib-card">
        <h3 className="lib-card-title">Đặt chỗ của tôi</h3>
        <DataTable
          caption="My reservations table"
          headers={['Sách', 'Ngày đặt', 'Vị trí hàng đợi', 'Trạng thái', { label: 'Thao tác', align: 'right' }]}
          loading={loading}
          loadingRows={3}
          isEmpty={reservations.length === 0}
          emptyState={<EmptyState icon={Bookmark} title="Bạn chưa có đặt chỗ" />}
        >
          {reservations.map((item) => (
            <tr key={item.id}>
              <td data-label="Sách"><div className="stack-sm"><strong>{item.title}</strong><span className="muted" style={{ fontSize: 13 }}>{item.author}</span></div></td>
              <td data-label="Ngày đặt">{fmtDate(item.reservedDate)}</td>
              <td data-label="Vị trí hàng đợi">
                {item.status === 'Ready to pick up'
                  ? <span className="row-flex" style={{ gap: 6, color: 'var(--st-green)' }}><CheckCircle2 size={15} /> Đến lượt bạn</span>
                  : item.status === 'Expired' || item.status === 'Cancelled'
                    ? <span className="muted">-</span>
                    : <span className="row-flex" style={{ gap: 6 }}><Clock size={15} /> #{item.queue}</span>}
              </td>
              <td data-label="Trạng thái"><Badge status={item.status} />{item.status === 'Ready to pick up' && item.deadline && <div className="field-hint">Lấy trước {fmtDate(item.deadline)}</div>}</td>
              <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                {!['Expired', 'Cancelled'].includes(item.status) && <button className="btn btn-outline btn-sm" onClick={() => setCancelTarget(item)}><X size={14} /> Hủy</button>}
              </td>
            </tr>
          ))}
        </DataTable>
      </div>

      {cancelTarget && (
        <ConfirmAction
          eyebrow="UC37 • Hủy đặt chỗ"
          title="Hủy đặt chỗ"
          tone="danger"
          confirmLabel="Xác nhận hủy"
          pending={cancelling}
          onCancel={() => setCancelTarget(null)}
          onConfirm={confirmCancel}
        >
          <p>Bạn có chắc muốn hủy đặt chỗ cho <strong>{cancelTarget.title}</strong>?</p>
          {cancelTarget.status === 'Waiting' && <div className="alert-box info" style={{ marginTop: 12 }}>Bạn sẽ mất vị trí #{cancelTarget.queue} trong hàng đợi và không thể khôi phục.</div>}
        </ConfirmAction>
      )}
      <Toast toast={toast} onClose={clearToast} />
    </AppLayout>
  );
}
