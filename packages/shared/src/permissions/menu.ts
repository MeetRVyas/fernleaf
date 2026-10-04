export const MENU_PERM = {
  read: 'menu:read',
  manage: 'menu:manage',
  preview: 'menu:preview',
} as const;
export const MENU_GRANTS = {
  ADMIN: Object.values(MENU_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
