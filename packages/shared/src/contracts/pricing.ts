import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import { cents, uuidParams, notImplemented, queryBoolean } from './common.js';

export const priceTier = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  isDefault: z.boolean(),
  isActive: z.boolean(),
  derivationKind: z.enum(['NONE', 'COST_MULTIPLIER', 'PERCENT_OVER_TIER']),
  factorMilli: z.number().int().positive().nullable(),
  baseTierId: z.uuid().nullable(),
  percentBp: z.number().int().gt(-10000).nullable(),
});
export const priceTierBody = priceTier.omit({ id: true });
export const priceRow = z.object({
  subjectType: z.enum(['DISH', 'OPTION']),
  subjectId: z.uuid(),
  name: z.string(),
  priceCents: cents.nullable(),
  source: z.enum(['MANUAL', 'DERIVED', 'MISSING']),
});
export const listTiers = defineRoute({
  id: 'pricing.listTiers',
  method: 'GET',
  path: '/price-tiers',
  permission: PERM.pricing.read,
  response: z.array(priceTier),
  errors: notImplemented,
});
export const createTier = defineRoute({
  id: 'pricing.createTier',
  method: 'POST',
  path: '/price-tiers',
  permission: PERM.pricing.manage,
  body: priceTierBody,
  response: priceTier,
  errors: ['VALIDATION_ERROR', 'CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateTier = defineRoute({
  id: 'pricing.updateTier',
  method: 'PATCH',
  path: '/price-tiers/:id',
  permission: PERM.pricing.manage,
  params: uuidParams,
  body: priceTierBody.partial(),
  response: priceTier,
  errors: ['VALIDATION_ERROR', 'NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const getTierPrices = defineRoute({
  id: 'pricing.getTierPrices',
  method: 'GET',
  path: '/price-tiers/:id/prices',
  permission: PERM.pricing.read,
  params: uuidParams,
  query: paginationQuery.extend({
    missingOnly: queryBoolean.optional(),
    subjectType: z.enum(['DISH', 'OPTION']).optional(),
  }),
  response: pageResponse(priceRow),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const setManualPrice = defineRoute({
  id: 'pricing.setManualPrice',
  method: 'PUT',
  path: '/price-tiers/:id/prices',
  permission: PERM.pricing.manage,
  params: uuidParams,
  body: priceRow
    .pick({ subjectType: true, subjectId: true, priceCents: true })
    .extend({ priceCents: cents }),
  response: priceRow,
  errors: ['VALIDATION_ERROR', 'NOT_IMPLEMENTED'] as const,
});
export const clearManualPrice = defineRoute({
  id: 'pricing.clearManualPrice',
  method: 'DELETE',
  path: '/price-tiers/:id/prices/:subjectType/:subjectId',
  permission: PERM.pricing.manage,
  params: z.object({
    id: z.uuid(),
    subjectType: z.enum(['DISH', 'OPTION']),
    subjectId: z.uuid(),
  }),
  response: z.object({ ok: z.literal(true) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const pricingRoutes = [
  listTiers,
  createTier,
  updateTier,
  getTierPrices,
  setManualPrice,
  clearManualPrice,
] as const;
