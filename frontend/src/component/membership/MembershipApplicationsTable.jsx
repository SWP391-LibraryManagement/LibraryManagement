import ApplicationTableBody from './ApplicationTableBody';
import TablePagination from './TablePagination';

export default function MembershipApplicationsTable({ applications, page, totalPages, onPageChange, onReview }) {
  return (
    <>
      <div className="lib-table-wrap">
        <table className="lib-table">
          <caption className="sr-only">Membership applications</caption>
          <thead>
            <tr>
              <th>Ma don</th>
              <th>Nguoi nop</th>
              <th>Email</th>
              <th>Ngay nop</th>
              <th>Trang thai</th>
              <th style={{ textAlign: 'right' }}>Thao tac</th>
            </tr>
          </thead>
          <tbody>
            <ApplicationTableBody applications={applications} onReview={onReview} />
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}
