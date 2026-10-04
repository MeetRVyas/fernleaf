import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import {
  dateString,
  instantString,
  uuidParams,
  notImplemented,
} from './common.js';

export const prepUnit = z.object({
  id: z.uuid(),
  comboId: z.uuid(),
  orderId: z.uuid(),
  stationId: z.uuid().nullable(),
  dishName: z.string(),
  quantity: z.number().int().positive(),
  startedAt: instantString.nullable(),
  doneAt: instantString.nullable(),
  plannedReadyAt: instantString,
  urgency: z.enum(['ON_TIME', 'AT_RISK', 'LATE']),
});
export const kitchenBoard = z.object({
  deliveryDate: dateString,
  units: z.array(prepUnit),
});
export const getKitchenBoard = defineRoute({
  id: 'kitchen.board',
  method: 'GET',
  path: '/kitchen/board',
  permission: PERM.kitchen.read,
  query: z.object({ date: dateString, stationId: z.uuid().optional() }),
  response: kitchenBoard,
  errors: notImplemented,
});
export const startPrepUnit = defineRoute({
  id: 'kitchen.start',
  method: 'POST',
  path: '/prep-units/:id/start',
  permission: PERM.kitchen.start,
  params: uuidParams,
  response: prepUnit,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const finishPrepUnit = defineRoute({
  id: 'kitchen.finish',
  method: 'POST',
  path: '/prep-units/:id/finish',
  permission: PERM.kitchen.finish,
  params: uuidParams,
  response: prepUnit,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const forceCompleteOrder = defineRoute({
  id: 'kitchen.forceComplete',
  method: 'POST',
  path: '/orders/:id/force-complete-kitchen',
  permission: PERM.kitchen.forceComplete,
  params: uuidParams,
  response: z.object({ orderId: z.uuid(), readyAt: instantString }),
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const kitchenRoutes = [
  getKitchenBoard,
  startPrepUnit,
  finishPrepUnit,
  forceCompleteOrder,
] as const;
