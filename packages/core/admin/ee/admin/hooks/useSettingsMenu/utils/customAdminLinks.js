import adminPermissions from '../../../../../admin/src/permissions';

const auditLogsRoutes = [
  // TODO check if feature enabled
  {
    intlLabel: { id: 'global.auditLogs', defaultMessage: 'Audit Logs' },
    to: '/settings/audit-logs?pageSize=50&page=1&sort=date:DESC',
    id: 'auditLogs',
    isDisplayed: false,
    permissions: adminPermissions.settings.auditLogs.main,
  },
];

const customAdminLinks = [...auditLogsRoutes];

export default customAdminLinks;
