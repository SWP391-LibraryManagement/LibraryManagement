import { authorizedRequest } from './libraryFeatureApi';

export const adminApi = {
  dashboard() {
    return authorizedRequest({ method: 'get', url: '/admin/dashboard' }, 'Không thể tải tổng quan quản trị.');
  },
  libraryBooks(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/library/books', params }, 'Không thể tải kho sách.');
  },
  libraryResource(resource, params = {}) {
    return authorizedRequest({ method: 'get', url: `/admin/library/${resource}`, params }, 'Không thể tải dữ liệu thư viện.');
  },
  createResource(resource, data) {
    return authorizedRequest({ method: 'post', url: `/admin/library/${resource}`, data }, 'Không thể thêm dữ liệu.');
  },
  updateResource(resource, id, data) {
    return authorizedRequest({ method: 'put', url: `/admin/library/${resource}/${id}`, data }, 'Không thể cập nhật dữ liệu.');
  },
  deactivateResource(resource, id) {
    return authorizedRequest({ method: 'patch', url: `/admin/library/${resource}/${id}/deactivate`, data: {} }, 'Không thể vô hiệu hóa dữ liệu.');
  },
  borrowings(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/borrowings', params }, 'Không thể tải dữ liệu mượn trả.');
  },
  requests(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/requests', params }, 'Không thể tải danh sách yêu cầu.');
  },
  requestDetail(requestId) {
    return authorizedRequest(
      { method: 'get', url: `/admin/requests/${requestId}` },
      'Không thể tải chi tiết yêu cầu.'
    );
  },
  permissions() {
    return authorizedRequest(
      { method: 'get', url: '/admin/permissions' },
      'Không thể tải ma trận phân quyền.'
    );
  },
  auditLogs(params = {}) {
    return authorizedRequest(
      { method: 'get', url: '/admin/audit-logs', params },
      'Không thể tải nhật ký hoạt động.'
    );
  },
};
