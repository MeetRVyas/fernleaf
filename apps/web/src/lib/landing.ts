import type { Role } from '@fernleaf/shared';

const LANDING_PATHS: Record<Role, string> = {
  ADMIN: '/admin',
  KITCHEN: '/kitchen',
  DISPATCH: '/dispatch',
  DRIVER: '/driver',
};

export function landingPath(user: { role: Role }): string {
  return LANDING_PATHS[user.role];
}
