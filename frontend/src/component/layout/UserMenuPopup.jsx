import CloseIcon from "@mui/icons-material/Close";
import Inventory2Icon from "@mui/icons-material/Inventory2";
import StatusBadge from "./StatusBadge";

export default function BookCopies({ book, copies, onClose }) {
  const statusOrder = ["AVAILABLE", "RESERVED", "BORROWED", "DAMAGED", "LOST", "INACTIVE"];
  const sorted = [...copies].sort(
    (a, b) => statusOrder.indexOf(a.status) - statusOrder.indexOf(b.status)
  );

  const statusCounts = copies.reduce((acc, c) => {
    acc[c.status] = (acc[c.status] ?? 0) + 1;
    return acc;
  }, {});

  const STATUS_SUMMARY = [
    { key: "AVAILABLE", label: "Có sẵn", color: "#198754" },
    { key: "BORROWED", label: "Đang mượn", color: "#b45309" },
    { key: "RESERVED", label: "Đã đặt trước", color: "#0d6efd" },
    { key: "DAMAGED", label: "Hư hỏng", color: "#fd7e14" },
    { key: "LOST", label: "Thất lạc", color: "#842029" },
    { key: "INACTIVE", label: "Ngừng lưu hành", color: "#6c757d" },
  ];

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0,0,0,0.45)",
          zIndex: 1040,
        }}
      />

      {/* Modal */}
      <div
        style={{
          position: "fixed",
          inset: 0,
          zIndex: 1050,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          padding: "16px",
          pointerEvents: "none",
        }}
      >
        <div
          style={{
            background: "#fff",
            borderRadius: 10,
            width: "100%",
            maxWidth: 760,
            maxHeight: "86vh",
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
              alignItems: "flex-start",
              justifyContent: "space-between",
              padding: "16px 20px 12px",
              borderBottom: "1px solid #dee2e6",
              flexShrink: 0,
            }}
          >
            <div className="d-flex align-items-start gap-2">
              <Inventory2Icon style={{ fontSize: 20, color: "#0d6efd", marginTop: 2 }} />
              <div>
                <div style={{ fontWeight: 700, fontSize: 15, color: "#212529", lineHeight: 1.3 }}>
                  {book.title}
                </div>
                <div style={{ fontSize: 12, color: "#6c757d", marginTop: 2 }}>
                  {book.author} &middot; ISBN: {book.isbn}
                </div>
              </div>
            </div>
            <button
              onClick={onClose}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#6c757d",
                padding: "2px",
                lineHeight: 1,
                marginLeft: 12,
                flexShrink: 0,
              }}
            >
              <CloseIcon style={{ fontSize: 20 }} />
            </button>
          </div>

          {/* Summary bar */}
          <div
            style={{
              padding: "8px 20px",
              borderBottom: "1px solid #f0f0f0",
              background: "#f8f9fa",
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              flexWrap: "wrap",
              gap: "6px 14px",
            }}
          >
            <span style={{ fontSize: 12, color: "#495057", fontWeight: 600, marginRight: 4 }}>
              Tổng: <strong style={{ color: "#212529" }}>{copies.length}</strong>
            </span>
            {STATUS_SUMMARY.filter((s) => statusCounts[s.key]).map((s) => (
              <span key={s.key} style={{ fontSize: 12, color: "#495057", display: "flex", alignItems: "center", gap: 4 }}>
                <span
                  style={{
                    width: 8,
                    height: 8,
                    borderRadius: "50%",
                    background: s.color,
                    display: "inline-block",
                    flexShrink: 0,
                  }}
                />
                {s.label}:{" "}
                <strong style={{ color: s.color }}>{statusCounts[s.key]}</strong>
              </span>
            ))}
          </div>

          {/* Table */}
          <div style={{ overflowY: "auto", flexGrow: 1, padding: "0 4px" }}>
            {sorted.length === 0 ? (
              <div
                className="d-flex flex-column align-items-center justify-content-center"
                style={{ padding: "48px 24px", color: "#adb5bd" }}
              >
                <Inventory2Icon style={{ fontSize: 40, marginBottom: 8 }} />
                <span style={{ fontSize: 14 }}>Chưa có bản sao cho đầu sách này</span>
              </div>
            ) : (
              <table className="table table-hover table-sm mb-0" style={{ fontSize: 13 }}>
                <thead style={{ background: "#f8f9fa", position: "sticky", top: 0 }}>
                  <tr>
                    <th style={{ fontWeight: 600, color: "#495057", paddingLeft: 16 }}>Mã bản sao</th>
                    <th style={{ fontWeight: 600, color: "#495057" }}>Barcode</th>
                    <th style={{ fontWeight: 600, color: "#495057" }}>Vị trí</th>
                    <th style={{ fontWeight: 600, color: "#495057" }}>Trạng thái</th>
                    <th style={{ fontWeight: 600, color: "#495057" }}>Ngày cập nhật</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((copy) => (
                    <tr key={copy.id}>
                      <td style={{ paddingLeft: 16, fontFamily: "monospace", color: "#212529" }}>
                        {copy.copyCode}
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: 12, color: "#495057" }}>
                        {copy.barcode}
                      </td>
                      <td style={{ color: "#495057" }}>{copy.location}</td>
                      <td>
                        <StatusBadge status={copy.status} />
                      </td>
                      <td style={{ color: "#6c757d", fontSize: 12 }}>{copy.updatedAt}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              justifyContent: "flex-end",
              padding: "12px 20px",
              borderTop: "1px solid #dee2e6",
              flexShrink: 0,
            }}
          >
            <button className="btn btn-sm btn-secondary" onClick={onClose} style={{ fontSize: 13 }}>
              Đóng
            </button>
          </div>
        </div>
      </div>
    </>
  );
}