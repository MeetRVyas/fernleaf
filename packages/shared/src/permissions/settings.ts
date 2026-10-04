export const SETTINGS_PERM = {
  read: 'settings:read',
  manage: 'settings:manage',
} as const;
export const SETTINGS_GRANTS = {
  ADMIN: Object.values(SETTINGS_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
