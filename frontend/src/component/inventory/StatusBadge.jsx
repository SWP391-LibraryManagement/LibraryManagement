const STATUS_CONFIG = {
  AVAILABLE: { label: "Có sẵn", bg: "#198754", color: "#fff" },
  BORROWED: { label: "Đang mượn", bg: "#ffc107", color: "#212529" },
  RESERVED: { label: "Đã đặt trước", bg: "#0d6efd", color: "#fff" },
  DAMAGED: { label: "Hư hỏng", bg: "#fd7e14", color: "#fff" },
  LOST: { label: "Thất lạc", bg: "#842029", color: "#fff" },
  INACTIVE: { label: "Ngừng lưu hành", bg: "#6c757d", color: "#fff" },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] ?? {
    label: status,
    bg: "#6c757d",
    color: "#fff",
  };

  return (
    <span
      style={{
        backgroundColor: config.bg,
        color: config.color,
        padding: "3px 10px",
        borderRadius: 4,
        fontSize: 12,
        fontWeight: 600,
        letterSpacing: 0.2,
        display: "inline-block",
        whiteSpace: "nowrap",
      }}
    >
      {config.label}
    </span>
  );
}