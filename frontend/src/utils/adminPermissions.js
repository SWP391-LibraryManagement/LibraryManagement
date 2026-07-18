function toNonNegativeCount(value) {
  const count = Number(value);
  return Number.isFinite(count) && count >= 0 ? count : 0;
}

export function buildPermissionRoleSummary(roles = [], usersByRole = {}) {
  return roles.map(({ roleName, label }) => ({
    roleName,
    label,
    count: toNonNegativeCount(usersByRole?.[roleName]),
  }));
}

export function buildPermissionModuleCoverage(roles = [], permissions = []) {
  const modules = new Map();

  for (const permission of permissions) {
    if (!modules.has(permission.moduleKey)) {
      modules.set(permission.moduleKey, {
        moduleKey: permission.moduleKey,
        moduleLabel: permission.moduleLabel,
        counts: Object.fromEntries(roles.map(({ roleName }) => [roleName, 0])),
      });
    }

    const module = modules.get(permission.moduleKey);
    for (const { roleName } of roles) {
      if (permission.allowedRoles.includes(roleName)) {
        module.counts[roleName] += 1;
      }
    }
  }

  return [...modules.values()];
}

export function roleAllowsPermission(permission, roleName) {
  return permission.allowedRoles.includes(roleName);
}
