function freezePermission(permission) {
  return Object.freeze({
    ...permission,
    allowedRoles: Object.freeze([...permission.allowedRoles]),
  });
}

const adminPermissionPolicy = Object.freeze({
  roles: Object.freeze([
    Object.freeze({ roleName: 'ADMIN', label: 'Admin' }),
    Object.freeze({ roleName: 'LIBRARIAN', label: 'Librarian' }),
    Object.freeze({ roleName: 'MEMBER', label: 'Member' }),
  ]),
  permissions: Object.freeze([
    { permissionKey: 'USER_VIEW', label: 'View users', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_CREATE', label: 'Create accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_UPDATE', label: 'Update Librarian work fields', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'USER_DEACTIVATE', label: 'Deactivate accounts', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'ROLE_MANAGE', label: 'Manage roles', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'AUDIT_VIEW', label: 'View audit logs', moduleKey: 'USER_ROLE', moduleLabel: 'User & Role', allowedRoles: ['ADMIN'] },
    { permissionKey: 'CATALOG_MANAGE', label: 'Manage library catalog', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'METADATA_MANAGE', label: 'Manage authors/publishers/categories', moduleKey: 'LIBRARY', moduleLabel: 'Library', allowedRoles: ['ADMIN'] },
    { permissionKey: 'BORROW_APPROVE_REJECT', label: 'Approve/reject borrow requests', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'RETURN_RENEW_PROCESS', label: 'Process returns and renewals', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_CALCULATE_COLLECT', label: 'Calculate and collect fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'FINE_WAIVE_CANCEL', label: 'Waive or cancel fines', moduleKey: 'FINE', moduleLabel: 'Fine', allowedRoles: ['ADMIN'] },
    { permissionKey: 'REPORT_VIEW', label: 'View reports', moduleKey: 'REPORTS', moduleLabel: 'Reports', allowedRoles: ['ADMIN', 'LIBRARIAN'] },
    { permissionKey: 'BORROW_REQUEST_CREATE', label: 'Create borrow request', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
    { permissionKey: 'BORROW_HISTORY_VIEW_OWN', label: 'View own borrowing history', moduleKey: 'BORROW_RETURN', moduleLabel: 'Borrow/Return', allowedRoles: ['MEMBER'] },
  ].map(freezePermission)),
});

module.exports = { adminPermissionPolicy };
