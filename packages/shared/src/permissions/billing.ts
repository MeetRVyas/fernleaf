export const BILLING_PERM = {
  read: 'billing:read',
  manage: 'billing:manage',
} as const;
export const BILLING_GRANTS = {
  ADMIN: Object.values(BILLING_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
