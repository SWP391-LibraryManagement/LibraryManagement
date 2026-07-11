import { useState } from "react";
import CloseIcon from "@mui/icons-material/Close";
import SaveIcon from "@mui/icons-material/Save";

export default function EditBookModal({ book, onSave, onClose }) {
  const [form, setForm] = useState({ ...book });
  const [errors, setErrors] = useState({});

  const handle = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const errs = {};
    if (!form.title.trim()) errs.title = "Tên đầu sách không được để trống";
    if (!form.author.trim()) errs.author = "Tác giả không được để trống";
    if (!form.isbn.trim()) errs.isbn = "ISBN không được để trống";
    if (!form.genre.trim()) errs.genre = "Thể loại không được để trống";
    return errs;
  };

  const handleSave = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setErrors(errs);
      return;
    }
    onSave({ ...form, publishYear: Number(form.publishYear) });
  };

  return (
    <>
      <div
        onClick={onClose}
        style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,0.45)", zIndex: 1040 }}
      />

      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            width: "100%",
            maxWidth: 580,
            maxHeight: "90vh",
            display: "flex",
            flexDirection: "column",
            boxShadow: "0 8px 40px rgba(0,0,0,0.18)",
            pointerEvents: "auto",
          }}
        >
          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "14px 20px",
              borderBottom: "1px solid #dee2e6",
              flexShrink: 0,
            }}
          >
            <span style={{ fontWeight: 700, fontSize: 15, color: "#212529" }}>
              Chỉnh sửa thông tin đầu sách
            </span>
            <button
              onClick={onClose}
              style={{ background: "none", border: "none", cursor: "pointer", color: "#6c757d", padding: 2 }}
            >
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Body */}
          <div style={{ overflowY: "auto", padding: "16px 20px", flexGrow: 1 }}>
            <div className="row g-3">
              <div className="col-12">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Tên đầu sách <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.title ? "is-invalid" : ""}`}
                  value={form.title}
                  onChange={handle("title")}
                  style={{ fontSize: 13 }}
                />
                {errors.title && <div className="invalid-feedback">{errors.title}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Tác giả <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.author ? "is-invalid" : ""}`}
                  value={form.author}
                  onChange={handle("author")}
                  style={{ fontSize: 13 }}
                />
                {errors.author && <div className="invalid-feedback">{errors.author}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Thể loại <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.genre ? "is-invalid" : ""}`}
                  value={form.genre}
                  onChange={handle("genre")}
                  style={{ fontSize: 13 }}
                />
                {errors.genre && <div className="invalid-feedback">{errors.genre}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  ISBN <span className="text-danger">*</span>
                </label>
                <input
                  type="text"
                  className={`form-control form-control-sm ${errors.isbn ? "is-invalid" : ""}`}
                  value={form.isbn}
                  onChange={handle("isbn")}
                  style={{ fontSize: 13, fontFamily: "monospace" }}
                />
                {errors.isbn && <div className="invalid-feedback">{errors.isbn}</div>}
              </div>

              <div className="col-md-6">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Năm xuất bản
                </label>
                <input
                  type="number"
                  className="form-control form-control-sm"
                  min={1900}
                  max={2099}
                  value={form.publishYear}
                  onChange={handle("publishYear")}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div className="col-12">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Nhà xuất bản
                </label>
                <input
                  type="text"
                  className="form-control form-control-sm"
                  value={form.publisher}
                  onChange={handle("publisher")}
                  style={{ fontSize: 13 }}
                />
              </div>

              <div className="col-12">
                <label className="form-label" style={{ fontSize: 13, fontWeight: 600 }}>
                  Mô tả
                </label>
                <textarea
                  className="form-control form-control-sm"
                  rows={3}
                  value={form.description}
                  onChange={handle("description")}
                  style={{ fontSize: 13, resize: "none" }}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              gap: 8,
              padding: "12px 20px",
              borderTop: "1px solid #dee2e6",
              flexShrink: 0,
            }}
          >
            <button
              className="btn btn-sm btn-secondary"
              onClick={onClose}
              style={{ fontSize: 13 }}
            >
              Hủy
            </button>
            <button
              className="btn btn-sm btn-primary"
              onClick={handleSave}
              style={{ fontSize: 13, display: "flex", alignItems: "center", gap: 4 }}
            >
              <SaveIcon style={{ fontSize: 15 }} />
              Lưu thay đổi
            </button>
          </div>
        </div>
      </div>
    </>
  );
}