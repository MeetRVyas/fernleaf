export const KITCHEN_PERM = {
  read: 'kitchen:read',
  start: 'kitchen:start',
  finish: 'kitchen:finish',
  forceComplete: 'kitchen:force-complete',
} as const;
export const KITCHEN_GRANTS = {
  ADMIN: Object.values(KITCHEN_PERM),
  KITCHEN: [KITCHEN_PERM.read, KITCHEN_PERM.start, KITCHEN_PERM.finish],
  DISPATCH: [],
  DRIVER: [],
} as const;
