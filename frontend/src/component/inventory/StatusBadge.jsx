import { Badge } from '../shared/Feedback';

const STATUS_CONFIG = {
  AVAILABLE: { tone: 'available', label: 'Có sẵn' },
  BORROWED: { tone: 'borrowed', label: 'Đang mượn' },
  RESERVED: { tone: 'info', label: 'Đã đặt trước' },
  DAMAGED: { tone: 'pending', label: 'Hư hỏng' },
  LOST: { tone: 'overdue', label: 'Thất lạc' },
  INACTIVE: { tone: 'inactive', label: 'Ngừng lưu hành' },
};

export default function StatusBadge({ status }) {
  const config = STATUS_CONFIG[status] || { tone: 'default', label: status };
  return <Badge status={config.tone}>{config.label}</Badge>;
}
