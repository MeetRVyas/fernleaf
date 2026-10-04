export const REFERENCE_PERM = {
  read: 'reference:read',
  manage: 'reference:manage',
} as const;
export const REFERENCE_GRANTS = {
  ADMIN: Object.values(REFERENCE_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
