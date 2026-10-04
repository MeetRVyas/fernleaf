export const COMPANIES_PERM = {
  read: 'companies:read',
  manage: 'companies:manage',
} as const;
export const COMPANIES_GRANTS = {
  ADMIN: Object.values(COMPANIES_PERM),
  KITCHEN: [],
  DISPATCH: [COMPANIES_PERM.read],
  DRIVER: [],
} as const;
