import { authorizedRequest } from './libraryFeatureApi';

export const adminApi = {
  dashboard() {
    return authorizedRequest({ method: 'get', url: '/admin/dashboard' }, 'Khong the tai dashboard admin.');
  },
  libraryBooks(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/library/books', params }, 'Khong the tai kho sach.');
  },
  bookMetadata() {
    return authorizedRequest({ method: 'get', url: '/books/metadata' }, 'Khong the tai metadata sach.');
  },
  createBook(data) {
    return authorizedRequest({ method: 'post', url: '/books', data }, 'Khong the them sach.');
  },
  updateBook(id, data) {
    return authorizedRequest({ method: 'put', url: `/books/${id}`, data }, 'Khong the cap nhat sach.');
  },
  deactivateBook(id) {
    return authorizedRequest({ method: 'patch', url: `/books/${id}/deactivate`, data: {} }, 'Khong the xoa sach.');
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
  deleteResource(resource, id) {
    return authorizedRequest({ method: 'delete', url: `/admin/library/${resource}/${id}` }, 'Khong the xoa du lieu.');
  },
  borrowings(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/borrowings', params }, 'Khong the tai du lieu muon tra.');
  },
  createBorrowing(data) {
    return authorizedRequest({ method: 'post', url: '/admin/borrowings', data }, 'Khong the them muon tra.');
  },
  updateBorrowing(id, data) {
    return authorizedRequest({ method: 'put', url: `/admin/borrowings/${id}`, data }, 'Khong the cap nhat muon tra.');
  },
  requests(params = {}) {
    return authorizedRequest({ method: 'get', url: '/admin/requests', params }, 'Khong the tai yeu cau.');
  },
  updateRequestStatus(id, status) {
    return authorizedRequest({ method: 'patch', url: `/admin/requests/${id}/status`, data: { status } }, 'Khong the cap nhat yeu cau.');
  },
};
