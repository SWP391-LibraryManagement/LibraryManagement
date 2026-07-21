const EDITABLE_ROLES = ['ADMIN', 'LIBRARIAN', 'MEMBER'];

export const ROLE_CATALOG_ERROR = 'Không thể tải danh mục vai trò. Vui lòng thử lại.';

export function normalizeEditableRoleCatalog(roleCatalog = []) {
  const seenNames = new Set();
  const seenIds = new Set();
  const normalized = [];

  for (const role of roleCatalog) {
    const roleName = String(role?.roleName || '').trim().toUpperCase();
    if (!EDITABLE_ROLES.includes(roleName)) continue;

    const roleId = Number(role?.roleId);
    const hasValidRoleId = Number.isInteger(roleId) && roleId > 0;
    if (!hasValidRoleId || seenNames.has(roleName) || seenIds.has(roleId)) {
      throw new Error(ROLE_CATALOG_ERROR);
    }

    seenNames.add(roleName);
    seenIds.add(roleId);
    normalized.push({ roleId, roleName });
  }

  if (normalized.length !== EDITABLE_ROLES.length) {
    throw new Error(ROLE_CATALOG_ERROR);
  }

  return normalized;
}

export function buildRoleMutationPlan(currentRoleNames, selectedRoleNames, roleCatalog) {
  const editableCatalog = normalizeEditableRoleCatalog(roleCatalog);
  const currentRoles = new Set(currentRoleNames || []);
  const selectedRoles = new Set(selectedRoleNames || []);
  const assignments = [];
  const revocations = [];

  for (const { roleId, roleName } of editableCatalog) {
    if (selectedRoles.has(roleName) && !currentRoles.has(roleName)) {
      assignments.push({ roleName, roleId });
    }
    if (currentRoles.has(roleName) && !selectedRoles.has(roleName)) {
      revocations.push({ roleName, roleId });
    }
  }

  return { assignments, revocations };
}

export function validateUserForm(form) {
  const errors = {};
  const email = form.email.trim();
  const fullName = form.fullName.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();
  const department = String(form.department || '').trim();
  const specialization = String(form.specialization || '').trim();

  if (!fullName) {
    errors.fullName = 'Họ và tên là bắt buộc.';
  } else if (fullName.length > 100) {
    errors.fullName = 'Họ và tên không được vượt quá 100 ký tự.';
  }

  if (!email) {
    errors.email = 'Email là bắt buộc.';
  } else if (email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    errors.email = 'Vui lòng nhập email hợp lệ.';
  }

  if (phone && (phone.length > 20 || !/^[0-9+\-\s()]+$/.test(phone))) {
    errors.phone = 'Số điện thoại không hợp lệ.';
  }

  if (address.length > 255) {
    errors.address = 'Địa chỉ không được vượt quá 255 ký tự.';
  }

  if (form.type === 'librarian' && department.length > 100) {
    errors.department = 'Phòng ban không được vượt quá 100 ký tự.';
  }

  if (form.type === 'librarian' && specialization.length > 100) {
    errors.specialization = 'Chuyên môn không được vượt quá 100 ký tự.';
  }

  return errors;
}

export function getPrimaryRole(user) {
  return user.roles?.includes('ADMIN')
    ? 'ADMIN'
    : user.roles?.includes('LIBRARIAN')
      ? 'LIBRARIAN'
      : 'MEMBER';
}

export function formatAdminDate(value) {
  if (!value) return '-';

  return new Date(value).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}
