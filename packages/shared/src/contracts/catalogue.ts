import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import {
  cents,
  positiveInt,
  uuidParams,
  notImplemented,
  queryBoolean,
} from './common.js';

export const dish = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  description: z.string(),
  imageUrl: z.url().nullable(),
  sku: z.string().min(1),
  temperature: z.enum(['HOT', 'COLD']),
  costCents: cents,
  stationId: z.uuid().nullable(),
  minOrderQty: positiveInt,
  allergenIds: z.array(z.uuid()),
  dietaryTagIds: z.array(z.uuid()),
  isActive: z.boolean(),
});
export const dishBody = dish.omit({ id: true });
export const option = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  costCents: cents,
  allergenIds: z.array(z.uuid()),
  dietaryTagIds: z.array(z.uuid()),
  isActive: z.boolean(),
});
export const optionBody = option.omit({ id: true });
export const optionGroup = z.object({
  id: z.uuid(),
  dishId: z.uuid(),
  name: z.string().min(1),
  isRequired: z.boolean(),
  sortOrder: z.number().int(),
  options: z.array(
    z.object({ optionId: z.uuid(), sortOrder: z.number().int() }),
  ),
});
export const optionGroupBody = optionGroup.omit({ id: true, dishId: true });
export const listDishes = defineRoute({
  id: 'catalogue.listDishes',
  method: 'GET',
  path: '/dishes',
  permission: PERM.catalogue.read,
  query: paginationQuery.extend({
    q: z.string().optional(),
    active: queryBoolean.optional(),
  }),
  response: pageResponse(dish),
  errors: notImplemented,
});
export const getDish = defineRoute({
  id: 'catalogue.getDish',
  method: 'GET',
  path: '/dishes/:id',
  permission: PERM.catalogue.read,
  params: uuidParams,
  response: dish.extend({ groups: z.array(optionGroup) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createDish = defineRoute({
  id: 'catalogue.createDish',
  method: 'POST',
  path: '/dishes',
  permission: PERM.catalogue.manage,
  body: dishBody,
  response: dish,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateDish = defineRoute({
  id: 'catalogue.updateDish',
  method: 'PATCH',
  path: '/dishes/:id',
  permission: PERM.catalogue.manage,
  params: uuidParams,
  body: dishBody.partial(),
  response: dish,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const listOptions = defineRoute({
  id: 'catalogue.listOptions',
  method: 'GET',
  path: '/options',
  permission: PERM.catalogue.read,
  query: paginationQuery.extend({ q: z.string().optional() }),
  response: pageResponse(option),
  errors: notImplemented,
});
export const createOption = defineRoute({
  id: 'catalogue.createOption',
  method: 'POST',
  path: '/options',
  permission: PERM.catalogue.manage,
  body: optionBody,
  response: option,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateOption = defineRoute({
  id: 'catalogue.updateOption',
  method: 'PATCH',
  path: '/options/:id',
  permission: PERM.catalogue.manage,
  params: uuidParams,
  body: optionBody.partial(),
  response: option,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const listGroups = defineRoute({
  id: 'catalogue.listGroups',
  method: 'GET',
  path: '/dishes/:id/option-groups',
  permission: PERM.catalogue.read,
  params: uuidParams,
  response: z.array(optionGroup),
  errors: notImplemented,
});
export const createGroup = defineRoute({
  id: 'catalogue.createGroup',
  method: 'POST',
  path: '/dishes/:id/option-groups',
  permission: PERM.catalogue.manage,
  params: uuidParams,
  body: optionGroupBody,
  response: optionGroup,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const updateGroup = defineRoute({
  id: 'catalogue.updateGroup',
  method: 'PATCH',
  path: '/option-groups/:id',
  permission: PERM.catalogue.manage,
  params: uuidParams,
  body: optionGroupBody.partial(),
  response: optionGroup,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const deleteGroup = defineRoute({
  id: 'catalogue.deleteGroup',
  method: 'DELETE',
  path: '/option-groups/:id',
  permission: PERM.catalogue.manage,
  params: uuidParams,
  response: z.object({ ok: z.literal(true) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const catalogueRoutes = [
  listDishes,
  getDish,
  createDish,
  updateDish,
  listOptions,
  createOption,
  updateOption,
  listGroups,
  createGroup,
  updateGroup,
  deleteGroup,
] as const;
