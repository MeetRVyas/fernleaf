export const PRICING_PERM = {
  read: 'pricing:read',
  manage: 'pricing:manage',
} as const;
export const PRICING_GRANTS = {
  ADMIN: Object.values(PRICING_PERM),
  KITCHEN: [],
  DISPATCH: [],
  DRIVER: [],
} as const;
