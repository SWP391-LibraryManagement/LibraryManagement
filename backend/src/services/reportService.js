const errors = require('../utils/safeErrors');
const { hasAnyRole } = require('../utils/featureAccess');
const { formatBusinessDate } = require('../utils/libraryBusinessTime');

function createReportService({ reportRepository, auditLogRepository, clock = () => new Date() } = {}) {
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

  // @spec FR-FE12-009
  function successMetadata(reportType, timestamp = clock()) {
    return {
      reportType,
      result: 'SUCCESS',
      timestamp: timestamp.toISOString(),
    };
  }

  async function getBorrowingReport(filters, actor, context = {}) {
    requireStaff(actor);
    const generatedAt = clock();
    const report = await reportRepository.getBorrowingReport(
      filters,
      formatBusinessDate(generatedAt)
    );

    await writeAudit(context, 'REPORT_BORROWING_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('BORROWING', generatedAt),
    });

    return report;
  }

  // @spec FR-FE12-012 FR-FE12-013 FR-FE12-014
  async function getOperationsSummary(actor, context = {}) {
    requireStaff(actor);
    const generatedAt = clock();
    const summary = await reportRepository.getOperationsSummary(
      formatBusinessDate(generatedAt)
    );

    await writeAudit(context, 'REPORT_OPERATIONS_SUMMARY_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('OPERATIONS_SUMMARY', generatedAt),
    });

    return {
      ...summary,
      generatedAt: generatedAt.toISOString(),
    };
  }

  async function getInventoryReport(filters, actor, context = {}) {
    requireStaff(actor);
    const report = await reportRepository.getInventoryReport(filters);

    await writeAudit(context, 'REPORT_INVENTORY_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('INVENTORY'),
    });

    return report;
  }

  async function getUserStatistics(filters, actor, context = {}) {
    requireStaff(actor);
    const report = await reportRepository.getUserStatistics(filters);

    await writeAudit(context, 'REPORT_USERS_VIEW', {
      userId: actor.userId,
      metadata: successMetadata('USERS'),
    });

    return report;
  }

  async function auditAccessFailure(error, actor, context = {}) {
    const statusCode = Number(error?.statusCode) || 500;
    const code = statusCode >= 500 ? 'INTERNAL_ERROR' : error?.code || 'UNKNOWN_ERROR';

    await writeAudit(context, 'REPORT_ACCESS_DENIED', {
      userId: actor?.userId ?? null,
      metadata: {
        code,
        statusCode,
        method: context.method || null,
        path: context.path || null,
      },
    });
  }

  return {
    getBorrowingReport,
    getOperationsSummary,
    getInventoryReport,
    getUserStatistics,
    auditAccessFailure,
  };
}

const defaultReportService = createReportService();

module.exports = {
  createReportService,
  defaultReportService,
};
