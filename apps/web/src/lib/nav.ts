import { PERM, type Permission } from '@fernleaf/shared';

export type NavItem = { label: string; path: string; permission: Permission };

export const featureNavigation: readonly NavItem[] = [
  { label: 'Home', path: '/', permission: PERM.auth.me },
  { label: 'Staff', path: '/staff', permission: PERM.staff.list },
];
