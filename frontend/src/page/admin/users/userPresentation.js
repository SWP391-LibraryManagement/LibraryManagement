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

export function buildRoleReplacement(currentRoleNames, selectedRoleName, roleCatalog) {
  const editableCatalog = normalizeEditableRoleCatalog(roleCatalog);
  const normalizedSelectedRole = String(selectedRoleName || '').trim().toUpperCase();
  const selectedRole = editableCatalog.find(({ roleName }) => roleName === normalizedSelectedRole);

  if (!selectedRole) {
    throw new Error('Mỗi tài khoản phải có đúng một vai trò hợp lệ.');
  }

  const currentRoles = (currentRoleNames || []).map((roleName) => String(roleName).toUpperCase());
  return currentRoles.length === 1 && currentRoles[0] === selectedRole.roleName
    ? null
    : selectedRole;
}

export function validateUserCreateForm(form) {
  const errors = {};
  const email = form.email.trim();
  const fullName = form.fullName.trim();
  const phone = form.phone.trim();
  const address = form.address.trim();

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

  if (phone) {
    const digits = phone.replace(/\D/g, '');
    if (digits.length < 7 || digits.length > 15 || !/^[0-9+\-\s()]+$/.test(phone)) {
      errors.phone = 'Số điện thoại không hợp lệ (7-15 chữ số).';
    }
  }

  if (address.length > 255) {
    errors.address = 'Địa chỉ không được vượt quá 255 ký tự.';
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
