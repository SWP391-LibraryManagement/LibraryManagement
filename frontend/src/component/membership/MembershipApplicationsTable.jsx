import ApplicationTableBody from './ApplicationTableBody';
import TablePagination from './TablePagination';

export default function MembershipApplicationsTable({ applications, page, totalPages, onPageChange, onApprove, onReject }) {
  return (
    <>
      <div className="lib-table-wrap">
        <table className="lib-table">
          <caption className="sr-only">Danh sách đơn đăng ký hội viên</caption>
          <thead>
            <tr>
              <th>Mã đơn</th>
              <th>Người nộp</th>
              <th>Email</th>
              <th>Ngày nộp</th>
              <th>Trạng thái</th>
              <th style={{ textAlign: 'right' }}>Thao tác</th>
            </tr>
          </thead>
          <tbody>
            <ApplicationTableBody applications={applications} onApprove={onApprove} onReject={onReject} />
          </tbody>
        </table>
      </div>
      <TablePagination page={page} totalPages={totalPages} onPageChange={onPageChange} />
    </>
  );
}
