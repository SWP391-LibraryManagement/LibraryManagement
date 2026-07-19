import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

import { inventoryApi } from '../../api/libraryFeatureApi';
import { ConfirmAction, EmptyState, Modal } from '../shared/Feedback';
import { DataTable, DataToolbar } from '../shared/OperationalPatterns';
import StatusBadge from './StatusBadge';

const STATUS_OPTIONS = ['AVAILABLE', 'DAMAGED', 'LOST', 'INACTIVE'];

export default function BookCopies({ book, copies, onClose, onChanged = async () => {}, showToast = () => {} }) {
  const [drafts, setDrafts] = useState({});
  const [statusReasons, setStatusReasons] = useState({});
  const [newCopy, setNewCopy] = useState({ barcode: '', location: '' });
  const [deactivateTarget, setDeactivateTarget] = useState(null);
  const [deactivateReason, setDeactivateReason] = useState('');
  const [saving, setSaving] = useState(false);

  if (!book) return null;

  function updateDraft(copyId, patch) {
    setDrafts((current) => ({ ...current, [copyId]: { ...(current[copyId] || {}), ...patch } }));
  }

  async function saveCopy(copy) {
    const draft = drafts[copy.copyId] || {};
    const reason = String(statusReasons[copy.copyId] || '').trim();
    const statusChanged = draft.status && draft.status !== copy.status;
    if (statusChanged && (!reason || reason.length > 500)) {
      showToast('Vui lòng nhập lý do từ 1 đến 500 ký tự.', 'error');
      return;
    }

    setSaving(true);
    try {
      let version = copy.version;
      if (statusChanged) {
        const statusResult = await inventoryApi.updateStatus(
          copy.copyId,
          { status: draft.status, reason: reason.trim() },
          copy.version
        );
        version = statusResult.copy?.version || version;
      }
      if (draft.location !== undefined && draft.location !== copy.location) {
        await inventoryApi.updateCopy(copy.copyId, { location: draft.location }, version);
      }
      showToast('Đã cập nhật bản sao.', 'success');
      setDrafts((current) => ({ ...current, [copy.copyId]: undefined }));
      setStatusReasons((current) => ({ ...current, [copy.copyId]: '' }));
      await onChanged();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function addCopy() {
    setSaving(true);
    try {
      await inventoryApi.createCopy(book.bookId || book.id, newCopy);
      setNewCopy({ barcode: '', location: '' });
      showToast('Đã thêm bản sao.', 'success');
      await onChanged();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(copy) {
    const reason = deactivateReason.trim();
    if (!reason || reason.length > 500) {
      showToast('Vui lòng nhập lý do từ 1 đến 500 ký tự.', 'error');
      return;
    }
    setSaving(true);
    try {
      await inventoryApi.deactivate(copy.copyId, reason, copy.version);
      showToast('Đã ngừng sử dụng bản sao.', 'success');
      setDeactivateTarget(null);
      setDeactivateReason('');
      await onChanged();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Modal title={book.title} eyebrow="FE06 • Bản sao vật lý" onClose={onClose} width={960}>
        <DataTable
          caption="Book copies table"
          headers={['ID', 'Barcode', 'Vị trí', 'Trạng thái', 'Lý do', { label: 'Thao tác', align: 'right' }]}
          isEmpty={copies.length === 0}
          emptyState={<EmptyState icon={Inventory2Icon} title="Chưa có bản sao cho đầu sách này" />}
        >
          {copies.map((copy) => {
            const draft = drafts[copy.copyId] || {};
            const nextStatus = draft.status || copy.status;
            const nextLocation = draft.location ?? copy.location ?? '';
            return (
              <tr key={copy.copyId}>
                <td data-label="ID">{copy.copyId}</td>
                <td data-label="Barcode"><strong>{copy.barcode}</strong></td>
                <td data-label="Vị trí">
                  <input className="input" value={nextLocation} onChange={(event) => updateDraft(copy.copyId, { location: event.target.value })} aria-label={`Vị trí bản sao ${copy.copyId}`} />
                </td>
                <td data-label="Trạng thái">
                  <div className="row-flex">
                    <StatusBadge status={copy.status} />
                    <select
                      className="select"
                      style={{ width: 150 }}
                      value={nextStatus}
                      onChange={(event) => updateDraft(copy.copyId, { status: event.target.value })}
                      disabled={copy.status === 'BORROWED' || copy.status === 'RESERVED'}
                      aria-label={`Trạng thái bản sao ${copy.copyId}`}
                    >
                      {[...new Set([copy.status, ...STATUS_OPTIONS])].map((status) => <option key={status} value={status}>{status}</option>)}
                    </select>
                  </div>
                </td>
                <td data-label="Lý do">
                  <textarea
                    className="input"
                    rows={2}
                    maxLength={500}
                    value={statusReasons[copy.copyId] || ''}
                    onChange={(event) => setStatusReasons((current) => ({ ...current, [copy.copyId]: event.target.value }))}
                    aria-label={`Lý do thay đổi bản sao ${copy.copyId}`}
                  />
                </td>
                <td data-label="Thao tác" style={{ textAlign: 'right' }}>
                  <div className="row-flex" style={{ justifyContent: 'flex-end' }}>
                    <button type="button" className="btn btn-outline btn-sm" onClick={() => saveCopy(copy)} disabled={saving}><SaveIcon fontSize="small" /> Lưu</button>
                    <button type="button" className="btn btn-danger btn-sm" onClick={() => { setDeactivateTarget(copy); setDeactivateReason(''); }} disabled={saving || copy.status === 'INACTIVE'}><DeleteIcon fontSize="small" /> Ngừng</button>
                  </div>
                </td>
              </tr>
            );
          })}
        </DataTable>

        <h3 className="section-title">Thêm bản sao</h3>
        <DataToolbar
          primary={<input className="input" value={newCopy.barcode} onChange={(event) => setNewCopy({ ...newCopy, barcode: event.target.value })} placeholder="Barcode" aria-label="Barcode bản sao mới" />}
          filters={<input className="input" value={newCopy.location} onChange={(event) => setNewCopy({ ...newCopy, location: event.target.value })} placeholder="Vị trí" aria-label="Vị trí bản sao mới" />}
          actions={<button type="button" className="btn btn-primary" onClick={addCopy} disabled={saving}><AddIcon fontSize="small" /> Thêm</button>}
        />
      </Modal>

      {deactivateTarget && (
        <ConfirmAction
          title="Ngừng sử dụng bản sao"
          tone="danger"
          confirmLabel="Ngừng sử dụng"
          pending={saving}
          onCancel={() => setDeactivateTarget(null)}
          onConfirm={() => deactivate(deactivateTarget)}
        >
          <p>Bản sao <strong>{deactivateTarget.barcode}</strong> sẽ không còn được tính là khả dụng.</p>
          <textarea
            rows={3}
            maxLength={500}
            value={deactivateReason}
            onChange={(event) => setDeactivateReason(event.target.value)}
            aria-label="Lý do ngừng sử dụng bản sao"
          />
        </ConfirmAction>
      )}
    </>
  );
}
