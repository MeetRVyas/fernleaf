export const EMPLOYEES_PERM = {
  read: 'employees:read',
  manage: 'employees:manage',
} as const;
export const EMPLOYEES_GRANTS = {
  ADMIN: Object.values(EMPLOYEES_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
