export const ORDERS_PERM = {
  read: 'orders:read',
  create: 'orders:create',
  edit: 'orders:edit',
  place: 'orders:place',
  cancel: 'orders:cancel',
  reject: 'orders:reject',
  processCutoff: 'orders:process-cutoff',
} as const;
export const ORDERS_GRANTS = {
  ADMIN: Object.values(ORDERS_PERM),
  KITCHEN: [ORDERS_PERM.read],
  DISPATCH: [ORDERS_PERM.read],
  DRIVER: [],
} as const;
