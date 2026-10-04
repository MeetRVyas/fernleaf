import { PERM, type Permission } from '@fernleaf/shared';

export type NavItem = { label: string; path: string; permission: Permission };

// Feature folders add their items here after their shared permissions land.
export const featureNavigation: readonly NavItem[] = [
  { label: 'Home', path: '/', permission: PERM.auth.me },
];
