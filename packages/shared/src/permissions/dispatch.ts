export const DISPATCH_PERM = {
  read: 'dispatch:read',
  assign: 'dispatch:assign',
  ready: 'dispatch:ready',
  out: 'dispatch:out',
  deliver: 'dispatch:deliver',
  ownRead: 'drops:own-read',
  ownDeliver: 'drops:own-deliver',
} as const;
export const DISPATCH_GRANTS = {
  ADMIN: Object.values(DISPATCH_PERM),
  KITCHEN: [],
  DISPATCH: [
    DISPATCH_PERM.read,
    DISPATCH_PERM.assign,
    DISPATCH_PERM.ready,
    DISPATCH_PERM.out,
    DISPATCH_PERM.deliver,
  ],
  DRIVER: [DISPATCH_PERM.ownRead, DISPATCH_PERM.ownDeliver],
} as const;
