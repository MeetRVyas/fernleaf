export const STAFF_PERM = {
  list: 'staff:list',
  create: 'staff:create',
  role: 'staff:role',
  deactivate: 'staff:deactivate',
  resetPassword: 'staff:reset-password',
} as const;
export const STAFF_GRANTS = {
  ADMIN: Object.values(STAFF_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
