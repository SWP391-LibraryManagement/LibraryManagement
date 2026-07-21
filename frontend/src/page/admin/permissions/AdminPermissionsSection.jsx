import { RefreshCw, Shield, Users } from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

import { adminApi } from '../../../api/adminApi';
import { reportApi } from '../../../api/libraryFeatureApi';
import {
  buildPermissionModuleCoverage,
  buildPermissionRoleSummary,
  roleAllowsPermission,
} from '../../../utils/adminPermissions';
import { normalizeAdminUserStatistics } from '../../../utils/adminStatistics';
import { createLatestRequestGuard } from '../../../utils/latestRequestGuard';
import { getRoleLabel } from '../../../utils/uiLabels';
import { AdminActionButton } from '../components/AdminActionButton';
import { AdminEmptyState } from '../components/AdminEmptyState';
import { AdminPageHeader } from '../components/AdminPageHeader';
import { RoleBadge } from '../users/UserBadges';
import { getPermissionDecision } from './permissionPresentation';

const PERMISSION_LABELS = Object.freeze({
  USER_VIEW: 'Xem người dùng',
  USER_CREATE: 'Tạo tài khoản',
  USER_UPDATE: 'Cập nhật tài khoản',
  USER_DEACTIVATE: 'Vô hiệu hóa tài khoản',
  ROLE_MANAGE: 'Quản lý vai trò',
  AUDIT_VIEW: 'Xem nhật ký hoạt động',
  CATALOG_MANAGE: 'Quản lý danh mục thư viện',
  METADATA_MANAGE: 'Quản lý tác giả, nhà xuất bản và danh mục',
  BORROW_APPROVE_REJECT: 'Duyệt hoặc từ chối yêu cầu mượn',
  RETURN_RENEW_PROCESS: 'Xử lý trả và gia hạn sách',
  FINE_CALCULATE_COLLECT: 'Tính và thu tiền phạt',
  FINE_WAIVE_CANCEL: 'Miễn hoặc hủy tiền phạt',
  REPORT_VIEW: 'Xem báo cáo',
  BORROW_REQUEST_CREATE: 'Tạo yêu cầu mượn',
  BORROW_HISTORY_VIEW_OWN: 'Xem lịch sử mượn của mình',
});

const MODULE_LABELS = Object.freeze({
  USER_ROLE: 'Người dùng và vai trò',
  LIBRARY: 'Thư viện',
  BORROW_RETURN: 'Mượn và trả',
  FINE: 'Tiền phạt',
  REPORTS: 'Báo cáo',
});

function getPermissionLabel(permission) {
  return PERMISSION_LABELS[permission?.permissionKey] || 'Quyền chưa xác định';
}

function getModuleLabel(module) {
  return MODULE_LABELS[module?.moduleKey] || 'Chức năng chưa xác định';
}

export function AdminPermissionsSection() {
  const permissionGuard = useRef(createLatestRequestGuard());
  const statisticsGuard = useRef(createLatestRequestGuard());
  const [permissionPolicy, setPermissionPolicy] = useState({ roles: [], permissions: [] });
  const [userStats, setUserStats] = useState({ usersByRole: {} });
  const [permissionsLoading, setPermissionsLoading] = useState(false);
  const [statisticsLoading, setStatisticsLoading] = useState(false);
  const [permissionsError, setPermissionsError] = useState('');
  const [statisticsError, setStatisticsError] = useState('');
  const [permissionsUpdatedAt, setPermissionsUpdatedAt] = useState(null);
  const [statisticsUpdatedAt, setStatisticsUpdatedAt] = useState(null);

  const loadPermissions = useCallback(async () => {
    const token = permissionGuard.current.begin();
    setPermissionsLoading(true);
    setPermissionsError('');
    try {
      const result = await adminApi.permissions();
      if (!permissionGuard.current.isLatest(token)) return;
      setPermissionPolicy({ roles: result.roles || [], permissions: result.permissions || [] });
      setPermissionsUpdatedAt(new Date());
    } catch (error) {
      if (!permissionGuard.current.isLatest(token)) return;
      setPermissionsError(error.message);
    } finally {
      if (permissionGuard.current.isLatest(token)) setPermissionsLoading(false);
    }
  }, []);

  const loadUserStatistics = useCallback(async () => {
    const token = statisticsGuard.current.begin();
    setStatisticsLoading(true);
    setStatisticsError('');
    try {
      const result = await reportApi.users();
      if (!statisticsGuard.current.isLatest(token)) return;
      setUserStats(normalizeAdminUserStatistics(result));
      setStatisticsUpdatedAt(new Date());
    } catch (error) {
      if (!statisticsGuard.current.isLatest(token)) return;
      setStatisticsError(error.message);
    } finally {
      if (statisticsGuard.current.isLatest(token)) setStatisticsLoading(false);
    }
  }, []);

  useEffect(() => {
    const permissionTimer = window.setTimeout(loadPermissions, 0);
    const statisticsTimer = window.setTimeout(loadUserStatistics, 0);
    return () => {
      window.clearTimeout(permissionTimer);
      window.clearTimeout(statisticsTimer);
    };
  }, [loadPermissions, loadUserStatistics]);

  const roleSummary = useMemo(
    () => buildPermissionRoleSummary(permissionPolicy.roles, userStats.usersByRole),
    [permissionPolicy.roles, userStats.usersByRole],
  );
  const moduleCoverage = useMemo(
    () => buildPermissionModuleCoverage(permissionPolicy.roles, permissionPolicy.permissions),
    [permissionPolicy.permissions, permissionPolicy.roles],
  );

  return (
    <section className="admin-permissions">
      <AdminPageHeader
        eyebrow="Chính sách truy cập chỉ đọc"
        title="Phân quyền"
        refreshing={permissionsLoading || statisticsLoading}
        onRefresh={() => { loadPermissions(); loadUserStatistics(); }}
      />

      <p className="admin-permissions__explanation">
        Một tài khoản có thể có nhiều vai trò. Quyền hiệu lực là tập hợp các quyền được cho phép bởi mọi vai trò đang gán; dữ liệu dưới đây chỉ dùng để quan sát, không chỉnh sửa tại màn hình này.
      </p>

      <section className="admin-permission-sources" aria-label="Trạng thái nguồn dữ liệu">
        <article>
          <Shield aria-hidden="true" />
          <div><strong>Dữ liệu phân quyền</strong><span>{permissionsLoading ? 'Đang tải...' : permissionsUpdatedAt ? `Cập nhật lúc ${permissionsUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu.'}</span></div>
          {permissionsError ? <><small>{permissionsError}</small><AdminActionButton icon={RefreshCw} label="Thử lại" onClick={loadPermissions} /></> : null}
        </article>
        <article>
          <Users aria-hidden="true" />
          <div><strong>Thống kê tài khoản theo vai trò</strong><span>{statisticsLoading ? 'Đang tải...' : statisticsUpdatedAt ? `Cập nhật lúc ${statisticsUpdatedAt.toLocaleTimeString('vi-VN')}` : 'Chưa tải dữ liệu.'}</span></div>
          {statisticsError ? <><small>{statisticsError}</small><AdminActionButton icon={RefreshCw} label="Thử lại" onClick={loadUserStatistics} /></> : null}
        </article>
      </section>

      <section className="admin-permission-role-cards" aria-label="Số tài khoản theo vai trò">
        {roleSummary.map((role) => (
          <article key={role.roleName}><RoleBadge role={role.roleName} /><strong>{role.count}</strong><span>{getRoleLabel(role.roleName)} tài khoản</span></article>
        ))}
      </section>

      {permissionPolicy.permissions.length === 0 && !permissionsLoading ? (
        <AdminEmptyState icon={Shield} title="Chưa có dữ liệu phân quyền" description={permissionsError || 'Hệ thống chưa trả về chính sách quyền.'} action={permissionsError ? <AdminActionButton icon={RefreshCw} label="Thử lại" tone="primary" onClick={loadPermissions} /> : null} />
      ) : null}

      {permissionPolicy.permissions.length > 0 ? (
        <div className="admin-permission-panels">
          <section>
            <header><h2>Mức bao phủ chức năng</h2><p>Số quy tắc cho phép theo từng nhóm nghiệp vụ.</p></header>
            <div className="admin-table-scroll">
              <table className="admin-permission-table admin-permission-table--compact">
                <thead><tr><th>Chức năng</th>{permissionPolicy.roles.map((role) => <th key={role.roleName}>{getRoleLabel(role.roleName)}</th>)}</tr></thead>
                <tbody>{moduleCoverage.map((module) => (
                  <tr key={module.moduleKey}><td>{getModuleLabel(module)}</td>{permissionPolicy.roles.map((role) => <td key={role.roleName}>{module.counts[role.roleName] || 0} quy tắc</td>)}</tr>
                ))}</tbody>
              </table>
            </div>
          </section>

          <section>
            <header><h2>Chi tiết quyền</h2><p>Quyết định Có/Không được lấy trực tiếp từ chính sách FE11.</p></header>
            <div className="admin-table-scroll">
              <table className="admin-permission-table">
                <thead><tr><th>Quyền</th>{permissionPolicy.roles.map((role) => <th key={role.roleName}>{getRoleLabel(role.roleName)}</th>)}</tr></thead>
                <tbody>{permissionPolicy.permissions.map((permission) => (
                  <tr key={permission.permissionKey}>
                    <td>{getPermissionLabel(permission)}</td>
                    {permissionPolicy.roles.map((role) => {
                      const decision = getPermissionDecision(roleAllowsPermission(permission, role.roleName));
                      return <td key={role.roleName}><span className={`permission-decision ${decision.tone}`}><b aria-hidden="true">{decision.symbol}</b>{decision.label}</span></td>;
                    })}
                  </tr>
                ))}</tbody>
              </table>
            </div>
          </section>
        </div>
      ) : null}
    </section>
  );
}
