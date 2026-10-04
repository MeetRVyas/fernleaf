export const DASHBOARDS_PERM = {
  admin: 'dashboards:admin',
  kitchen: 'dashboards:kitchen',
  dispatch: 'dashboards:dispatch',
  driver: 'dashboards:driver',
} as const;
export const DASHBOARDS_GRANTS = {
  ADMIN: Object.values(DASHBOARDS_PERM),
  KITCHEN: [DASHBOARDS_PERM.kitchen],
  DISPATCH: [DASHBOARDS_PERM.dispatch],
  DRIVER: [DASHBOARDS_PERM.driver],
} as const;
