import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { uuidParams, cents, notImplemented } from './common.js';

export const menuCategory = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
  isSecret: z.boolean(),
});
export const menuItem = z.object({
  id: z.uuid(),
  categoryId: z.uuid(),
  dishId: z.uuid(),
  sortOrder: z.number().int(),
  isActive: z.boolean(),
});
export const offeredOption = z.object({
  id: z.uuid(),
  name: z.string(),
  priceCents: cents,
});
export const orderableDish = z.object({
  id: z.uuid(),
  name: z.string(),
  sku: z.string(),
  priceCents: cents,
  minOrderQty: z.number().int().positive(),
  groups: z.array(
    z.object({
      id: z.uuid(),
      name: z.string(),
      isRequired: z.boolean(),
      options: z.array(offeredOption),
    }),
  ),
});
export const employeeMenu = z.object({
  employeeId: z.uuid(),
  categories: z.array(menuCategory.extend({ dishes: z.array(orderableDish) })),
});
export const listCategories = defineRoute({
  id: 'menu.listCategories',
  method: 'GET',
  path: '/menu-categories',
  permission: PERM.menu.read,
  response: z.array(menuCategory),
  errors: notImplemented,
});
export const createCategory = defineRoute({
  id: 'menu.createCategory',
  method: 'POST',
  path: '/menu-categories',
  permission: PERM.menu.manage,
  body: menuCategory.omit({ id: true }),
  response: menuCategory,
  errors: notImplemented,
});
export const updateCategory = defineRoute({
  id: 'menu.updateCategory',
  method: 'PATCH',
  path: '/menu-categories/:id',
  permission: PERM.menu.manage,
  params: uuidParams,
  body: menuCategory.omit({ id: true }).partial(),
  response: menuCategory,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createMenuItem = defineRoute({
  id: 'menu.createItem',
  method: 'POST',
  path: '/menu-items',
  permission: PERM.menu.manage,
  body: menuItem.omit({ id: true }),
  response: menuItem,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateMenuItem = defineRoute({
  id: 'menu.updateItem',
  method: 'PATCH',
  path: '/menu-items/:id',
  permission: PERM.menu.manage,
  params: uuidParams,
  body: menuItem.omit({ id: true }).partial(),
  response: menuItem,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const setCompanyMenuHiding = defineRoute({
  id: 'menu.setHiding',
  method: 'PUT',
  path: '/companies/:id/menu-hiding',
  permission: PERM.menu.manage,
  params: uuidParams,
  body: z.object({
    hiddenCategoryIds: z.array(z.uuid()),
    hiddenItemIds: z.array(z.uuid()),
  }),
  response: z.object({
    hiddenCategoryIds: z.array(z.uuid()),
    hiddenItemIds: z.array(z.uuid()),
  }),
  errors: notImplemented,
});
export const previewMenu = defineRoute({
  id: 'menu.preview',
  method: 'GET',
  path: '/employees/:id/menu',
  permission: PERM.menu.preview,
  params: uuidParams,
  response: employeeMenu,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const previewSecretCategory = defineRoute({
  id: 'menu.previewCategory',
  method: 'GET',
  path: '/employees/:id/menu/categories/:categoryId',
  permission: PERM.menu.preview,
  params: z.object({ id: z.uuid(), categoryId: z.uuid() }),
  response: menuCategory.extend({ dishes: z.array(orderableDish) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const menuRoutes = [
  listCategories,
  createCategory,
  updateCategory,
  createMenuItem,
  updateMenuItem,
  setCompanyMenuHiding,
  previewMenu,
  previewSecretCategory,
] as const;
