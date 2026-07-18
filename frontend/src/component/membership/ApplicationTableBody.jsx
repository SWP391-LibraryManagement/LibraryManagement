import { ClipboardList } from 'lucide-react';

import { EmptyState } from '../shared/Feedback';
import ApplicationTableRow from './ApplicationTableRow';

export default function ApplicationTableBody({ applications, onApprove, onReject }) {
  if (!applications.length) {
    return (
      <tr>
        <td colSpan={6}>
          <EmptyState icon={ClipboardList} title="Không có đơn đăng ký hội viên" />
        </td>
      </tr>
    );
  }

  return applications.map((application) => (
    <ApplicationTableRow
      key={application.applicationId || application.id}
      application={application}
      onApprove={onApprove}
      onReject={onReject}
    />
  ));
}
