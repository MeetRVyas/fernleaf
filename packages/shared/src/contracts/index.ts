import { authRoutes } from './auth.js';
import { staffRoutes } from './staff.js';
import { coreRoutes } from './core.js';
export * from './auth.js';
export * from './staff.js';
export * from './core.js';
export const allRoutes = [...coreRoutes, ...authRoutes, ...staffRoutes] as const;
