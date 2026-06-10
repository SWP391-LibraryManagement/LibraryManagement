const errors = require('../utils/safeErrors');

function normalizeRole(role) {
  return String(role || '').toUpperCase();
}

function hasAnyRole(user, allowedRoles) {
  const currentRoles = Array.isArray(user?.roles) ? user.roles.map(normalizeRole) : [];
  return allowedRoles.map(normalizeRole).some((role) => currentRoles.includes(role));
}

function createReportService({ reportRepository, auditLogRepository } = {}) {
  if (!reportRepository) {
    reportRepository = require('../repositories/reportRepository');
  }

  if (!auditLogRepository) {
    auditLogRepository = require('../repositories/auditLogRepository');
  }

  async function writeAudit(context, action, extra = {}) {
    if (!auditLogRepository || typeof auditLogRepository.create !== 'function') {
      return;
    }

    await auditLogRepository.create({
      userId: extra.userId ?? context?.userId ?? null,
      action,
      targetType: extra.targetType || 'REPORT',
      targetId: extra.targetId ?? null,
      metadata: extra.metadata || null,
      ipAddress: context?.ip || null,
      userAgent: context?.userAgent || null,
    });
  }

  function requireStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
    }
  }

  function requireAdminOrApprovedStaff(actor) {
    if (!hasAnyRole(actor, ['LIBRARIAN', 'ADMIN'])) {
      throw errors.forbidden('ROLE_REQUIRED', 'Your role cannot perform this action.');
    }
  }

  async function getBorrowingReport(filters, actor, context = {}) {
    requireStaff(actor);
    const report = await reportRepository.getBorrowingReport(filters);

    await writeAudit(context, 'REPORT_BORROWING_VIEW', {
      userId: actor.userId,
      metadata: filters,
    });

    return report;
  }

  async function getInventoryReport(filters, actor, context = {}) {
    requireStaff(actor);
    const report = await reportRepository.getInventoryReport(filters);

    await writeAudit(context, 'REPORT_INVENTORY_VIEW', {
      userId: actor.userId,
      metadata: filters,
    });

    return report;
  }

  async function getUserStatistics(filters, actor, context = {}) {
    requireAdminOrApprovedStaff(actor);
    const report = await reportRepository.getUserStatistics(filters);

    await writeAudit(context, 'REPORT_USERS_VIEW', {
      userId: actor.userId,
      metadata: filters,
    });

    return report;
  }

  return {
    getBorrowingReport,
    getInventoryReport,
    getUserStatistics,
  };
}

const defaultReportService = createReportService();

module.exports = {
  createReportService,
  defaultReportService,
};
