import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import { uuidParams, notImplemented } from './common.js';

export const referenceItem = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  isActive: z.boolean(),
});
export const referenceBody = referenceItem.pick({ name: true, isActive: true });
export const listAllergens = defineRoute({
  id: 'reference.listAllergens',
  method: 'GET',
  path: '/allergens',
  permission: PERM.reference.read,
  query: paginationQuery,
  response: pageResponse(referenceItem),
  errors: notImplemented,
});
export const createAllergen = defineRoute({
  id: 'reference.createAllergen',
  method: 'POST',
  path: '/allergens',
  permission: PERM.reference.manage,
  body: referenceBody,
  response: referenceItem,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateAllergen = defineRoute({
  id: 'reference.updateAllergen',
  method: 'PATCH',
  path: '/allergens/:id',
  permission: PERM.reference.manage,
  params: uuidParams,
  body: referenceBody.partial(),
  response: referenceItem,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const listDietaryTags = defineRoute({
  id: 'reference.listDietaryTags',
  method: 'GET',
  path: '/dietary-tags',
  permission: PERM.reference.read,
  query: paginationQuery,
  response: pageResponse(referenceItem),
  errors: notImplemented,
});
export const createDietaryTag = defineRoute({
  id: 'reference.createDietaryTag',
  method: 'POST',
  path: '/dietary-tags',
  permission: PERM.reference.manage,
  body: referenceBody,
  response: referenceItem,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateDietaryTag = defineRoute({
  id: 'reference.updateDietaryTag',
  method: 'PATCH',
  path: '/dietary-tags/:id',
  permission: PERM.reference.manage,
  params: uuidParams,
  body: referenceBody.partial(),
  response: referenceItem,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const listKitchenStations = defineRoute({
  id: 'reference.listStations',
  method: 'GET',
  path: '/kitchen-stations',
  permission: PERM.reference.read,
  query: paginationQuery,
  response: pageResponse(referenceItem),
  errors: notImplemented,
});
export const createKitchenStation = defineRoute({
  id: 'reference.createStation',
  method: 'POST',
  path: '/kitchen-stations',
  permission: PERM.reference.manage,
  body: referenceBody,
  response: referenceItem,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateKitchenStation = defineRoute({
  id: 'reference.updateStation',
  method: 'PATCH',
  path: '/kitchen-stations/:id',
  permission: PERM.reference.manage,
  params: uuidParams,
  body: referenceBody.partial(),
  response: referenceItem,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const referenceRoutes = [
  listAllergens,
  createAllergen,
  updateAllergen,
  listDietaryTags,
  createDietaryTag,
  updateDietaryTag,
  listKitchenStations,
  createKitchenStation,
  updateKitchenStation,
] as const;
