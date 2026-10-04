import { z } from 'zod';
import { defineRoute } from './route.js';
import { ALL, PERM, ROLES, type Permission } from '../permissions/roles.js';

export const staffPublic = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.email(),
  role: z.enum(ROLES),
  isActive: z.boolean(),
});
export const login = defineRoute({
  id: 'auth.login',
  method: 'POST',
  path: '/auth/login',
  permission: null,
  body: z.object({ email: z.email(), password: z.string().min(1) }),
  response: staffPublic,
  errors: ['VALIDATION_ERROR', 'UNAUTHENTICATED', 'THROTTLED'],
});
export const logout = defineRoute({
  id: 'auth.logout',
  method: 'POST',
  path: '/auth/logout',
  permission: PERM.auth.logout,
  response: z.object({ ok: z.literal(true) }),
  errors: ['UNAUTHENTICATED'],
});
// Auth always contributes permissions, so the derived list is nonempty.
export const me = defineRoute({
  id: 'auth.me',
  method: 'GET',
  path: '/auth/me',
  permission: PERM.auth.me,
  response: staffPublic.extend({
    permissions: z.array(z.enum([...ALL] as [Permission, ...Permission[]])),
  }),
  errors: ['UNAUTHENTICATED'],
});
export const authRoutes = [login, logout, me] as const;
