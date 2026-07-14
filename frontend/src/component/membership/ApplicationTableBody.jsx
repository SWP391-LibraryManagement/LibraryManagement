import { ClipboardList } from 'lucide-react';

import { EmptyState } from '../shared/Feedback';
import ApplicationTableRow from './ApplicationTableRow';

export default function ApplicationTableBody({ applications, onReview }) {
  if (!applications.length) {
    return (
      <tr>
        <td colSpan={6}>
          <EmptyState icon={ClipboardList} title="Khong co don membership" />
        </td>
      </tr>
    );
  }

  return applications.map((application) => (
    <ApplicationTableRow key={application.applicationId || application.id} application={application} onReview={onReview} />
  ));
}
