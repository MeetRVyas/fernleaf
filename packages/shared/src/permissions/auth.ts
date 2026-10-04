export const AUTH_PERM = { me: 'auth:me', logout: 'auth:logout' } as const;
export const AUTH_GRANTS = {
  ADMIN: Object.values(AUTH_PERM),
  KITCHEN: Object.values(AUTH_PERM),
  DISPATCH: Object.values(AUTH_PERM),
  DRIVER: Object.values(AUTH_PERM),
} as const;
