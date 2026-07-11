import { useState } from 'react';
import AddIcon from '@mui/icons-material/Add';
import CloseIcon from '@mui/icons-material/Close';
import Inventory2Icon from '@mui/icons-material/Inventory2';
import SaveIcon from '@mui/icons-material/Save';
import DeleteIcon from '@mui/icons-material/Delete';

import { inventoryApi } from '../../api/libraryFeatureApi';
import StatusBadge from './StatusBadge';

const STATUS_OPTIONS = ['AVAILABLE', 'DAMAGED', 'LOST', 'INACTIVE'];

export default function BookCopies({ book, copies, onClose, onChanged, showToast }) {
  const [drafts, setDrafts] = useState({});
  const [newCopy, setNewCopy] = useState({ barcode: '', location: '', status: 'AVAILABLE' });
  const [saving, setSaving] = useState(false);

  if (!book) return null;

  function updateDraft(copyId, patch) {
    setDrafts((current) => ({ ...current, [copyId]: { ...(current[copyId] || {}), ...patch } }));
  }

  async function saveCopy(copy) {
    const draft = drafts[copy.copyId] || {};
    setSaving(true);
    try {
      if (draft.status && draft.status !== copy.status) {
        await inventoryApi.updateStatus(copy.copyId, { status: draft.status });
      }
      if (draft.location !== undefined && draft.location !== copy.location) {
        await inventoryApi.updateCopy(copy.copyId, { location: draft.location });
      }
      showToast('Đã cập nhật bản sao.', 'success');
      setDrafts((current) => ({ ...current, [copy.copyId]: undefined }));
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
      await inventoryApi.createCopy(book.bookId, newCopy);
      setNewCopy({ barcode: '', location: '', status: 'AVAILABLE' });
      showToast('Đã thêm bản sao.', 'success');
      await onChanged();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  async function deactivate(copy) {
    setSaving(true);
    try {
      await inventoryApi.deactivate(copy.copyId);
      showToast('Đã ngừng sử dụng bản sao.', 'success');
      await onChanged();
    } catch (error) {
      showToast(error.message, 'error');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="modal" style={{ width: 'min(960px, 100%)' }} onMouseDown={(event) => event.stopPropagation()} role="dialog" aria-modal="true">
        <div className="modal-header">
          <div>
            <p className="muted" style={{ margin: 0, fontSize: 12, fontWeight: 600 }}>FE06 • BookCopies</p>
            <h2 className="modal-title">{book.title}</h2>
          </div>
          <button type="button" className="icon-btn" onClick={onClose} aria-label="Đóng">
            <CloseIcon fontSize="small" />
          </button>
        </div>
        <div className="modal-body">
          <div className="lib-table-wrap">
            <table className="lib-table">
              <caption className="sr-only">Book copies table</caption>
              <thead>
                <tr>
                  <th>ID</th>
                  <th>Barcode</th>
                  <th>Vị trí</th>
                  <th>Trạng thái</th>
                  <th style={{ textAlign: 'right' }}>Action</th>
                </tr>
              </thead>
              <tbody>
                {copies.map((copy) => {
                  const draft = drafts[copy.copyId] || {};
                  const nextStatus = draft.status || copy.status;
                  const nextLocation = draft.location ?? copy.location ?? '';
                  return (
                    <tr key={copy.copyId}>
                      <td>{copy.copyId}</td>
                      <td><strong>{copy.barcode}</strong></td>
                      <td>
                        <input
                          className="input"
                          value={nextLocation}
                          onChange={(event) => updateDraft(copy.copyId, { location: event.target.value })}
                          aria-label={`Vị trí bản sao ${copy.copyId}`}
                        />
                      </td>
                      <td>
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
                            {[...new Set([copy.status, ...STATUS_OPTIONS])].map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td style={{ textAlign: 'right' }}>
                        <div className="row-flex" style={{ justifyContent: 'flex-end' }}>
                          <button type="button" className="btn btn-outline btn-sm" onClick={() => saveCopy(copy)} disabled={saving}>
                            <SaveIcon fontSize="small" /> Lưu
                          </button>
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => deactivate(copy)} disabled={saving || copy.status === 'INACTIVE'}>
                            <DeleteIcon fontSize="small" /> Ngừng
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {copies.length === 0 && (
              <div className="empty">
                <Inventory2Icon />
                <h3>Chưa có bản sao cho đầu sách này</h3>
              </div>
            )}
          </div>

          <h3 className="section-title">Thêm bản sao</h3>
          <div className="toolbar" style={{ marginBottom: 0 }}>
            <input className="input" style={{ width: 220 }} value={newCopy.barcode} onChange={(event) => setNewCopy({ ...newCopy, barcode: event.target.value })} placeholder="Barcode" />
            <input className="input" style={{ width: 180 }} value={newCopy.location} onChange={(event) => setNewCopy({ ...newCopy, location: event.target.value })} placeholder="Vị trí" />
            <select className="select" style={{ width: 160 }} value={newCopy.status} onChange={(event) => setNewCopy({ ...newCopy, status: event.target.value })}>
              {STATUS_OPTIONS.map((status) => <option key={status} value={status}>{status}</option>)}
            </select>
            <button type="button" className="btn btn-primary" onClick={addCopy} disabled={saving}>
              <AddIcon fontSize="small" /> Thêm
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
