import { authorizedRequest } from './libraryFeatureApi';

export const adminApi = {
  dashboard() {
    return authorizedRequest({ method: 'get', url: '/admin/dashboard' }, 'Khong the tai dashboard admin.');
  },
  libraryBooks(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/library/books', params }, 'Khong the tai kho sach.');
  },
  libraryResource(resource, params = {}) {
    return authorizedRequest({ method: 'get', url: `/admin/library/${resource}`, params }, 'Khong the tai du lieu thu vien.');
  },
  createResource(resource, data) {
    return authorizedRequest({ method: 'post', url: `/admin/library/${resource}`, data }, 'Khong the them du lieu.');
  },
  updateResource(resource, id, data) {
    return authorizedRequest({ method: 'put', url: `/admin/library/${resource}/${id}`, data }, 'Khong the cap nhat du lieu.');
  },
  deactivateResource(resource, id) {
    return authorizedRequest({ method: 'patch', url: `/admin/library/${resource}/${id}/deactivate`, data: {} }, 'Khong the vo hieu hoa du lieu.');
  },
  borrowings(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/borrowings', params }, 'Khong the tai du lieu muon tra.');
  },
  requests(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/requests', params }, 'Khong the tai yeu cau.');
  },
  requestDetail(requestId) {
    return authorizedRequest(
      { method: 'get', url: `/admin/requests/${requestId}` },
      'Khong the tai chi tiet yeu cau.'
    );
  },
  permissions() {
    return authorizedRequest(
      { method: 'get', url: '/admin/permissions' },
      'Khong the tai ma tran phan quyen.'
    );
  },
  auditLogs(params = {}) {
    return authorizedRequest(
      { method: 'get', url: '/admin/audit-logs', params },
      'Khong the tai nhat ky hoat dong.'
    );
  },
};
