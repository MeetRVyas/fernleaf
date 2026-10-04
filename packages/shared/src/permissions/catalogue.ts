export const CATALOGUE_PERM = {
  read: 'dishes:read',
  manage: 'catalogue:manage',
} as const;
export const CATALOGUE_GRANTS = {
  ADMIN: Object.values(CATALOGUE_PERM),
  KITCHEN: [CATALOGUE_PERM.read],
  DISPATCH: [],
  DRIVER: [],
} as const;
