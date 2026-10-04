import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import {
  dateString,
  hhmmString,
  instantString,
  uuidParams,
  notImplemented,
} from './common.js';

export const drop = z.object({
  id: z.uuid(),
  deliveryDate: dateString,
  companyId: z.uuid(),
  addressId: z.uuid(),
  deliveryTime: hhmmString,
  driverId: z.uuid().nullable(),
  deliveredAt: instantString.nullable(),
  note: z.string().nullable(),
  onTime: z.boolean().nullable(),
  orderIds: z.array(z.uuid()),
  stage: z.enum(['KITCHEN', 'DISPATCH_READY', 'OUT_FOR_DELIVERY', 'DELIVERED']),
});
export const listDrops = defineRoute({
  id: 'dispatch.listDrops',
  method: 'GET',
  path: '/drops',
  permission: PERM.dispatch.read,
  query: z.object({ date: dateString, driverId: z.uuid().optional() }),
  response: z.array(drop),
  errors: notImplemented,
});
export const getDrop = defineRoute({
  id: 'dispatch.getDrop',
  method: 'GET',
  path: '/drops/:id',
  permission: PERM.dispatch.read,
  params: uuidParams,
  response: drop,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const assignDriver = defineRoute({
  id: 'dispatch.assignDriver',
  method: 'PATCH',
  path: '/drops/:id/driver',
  permission: PERM.dispatch.assign,
  params: uuidParams,
  body: z.object({ driverId: z.uuid().nullable() }),
  response: drop,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const markDispatchReady = defineRoute({
  id: 'dispatch.ready',
  method: 'POST',
  path: '/orders/:id/dispatch-ready',
  permission: PERM.dispatch.ready,
  params: uuidParams,
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const markOutForDelivery = defineRoute({
  id: 'dispatch.out',
  method: 'POST',
  path: '/orders/:id/out-for-delivery',
  permission: PERM.dispatch.out,
  params: uuidParams,
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const markDropDispatchReady = defineRoute({
  id: 'dispatch.readyDrop',
  method: 'POST',
  path: '/drops/:id/dispatch-ready',
  permission: PERM.dispatch.ready,
  params: uuidParams,
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const markDropOut = defineRoute({
  id: 'dispatch.outDrop',
  method: 'POST',
  path: '/drops/:id/out-for-delivery',
  permission: PERM.dispatch.out,
  params: uuidParams,
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const deliverDrop = defineRoute({
  id: 'dispatch.deliver',
  method: 'POST',
  path: '/drops/:id/deliver',
  permission: PERM.dispatch.deliver,
  params: uuidParams,
  body: z.object({ note: z.string().optional() }),
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const listMyDrops = defineRoute({
  id: 'dispatch.myDrops',
  method: 'GET',
  path: '/driver/drops',
  permission: PERM.dispatch.ownRead,
  response: z.array(drop),
  errors: notImplemented,
});
export const deliverMyDrop = defineRoute({
  id: 'dispatch.deliverMine',
  method: 'POST',
  path: '/driver/drops/:id/deliver',
  permission: PERM.dispatch.ownDeliver,
  params: uuidParams,
  body: z.object({ note: z.string().optional() }),
  response: drop,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const dispatchRoutes = [
  listDrops,
  getDrop,
  assignDriver,
  markDispatchReady,
  markOutForDelivery,
  markDropDispatchReady,
  markDropOut,
  deliverDrop,
  listMyDrops,
  deliverMyDrop,
] as const;
