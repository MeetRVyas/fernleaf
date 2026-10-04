import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import {
  paginationQuery,
  pageResponse,
  arrayQueryParam,
} from '../helpers/pagination.js';
import {
  dateString,
  hhmmString,
  packaging,
  cents,
  positiveInt,
  uuidParams,
  instantString,
  notImplemented,
} from './common.js';
import {
  dishSnapshot,
  optionsSnapshot,
  addressSnapshot,
  eventMeta,
} from './db-values.js';

export const orderStatus = z.enum([
  'DRAFT',
  'PLACED',
  'CONFIRMED',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
]);
export const orderEventType = z.enum([
  'CREATED',
  'PLACED',
  'EDITED',
  'CONFIRMED',
  'KITCHEN_STARTED',
  'KITCHEN_READY',
  'DISPATCH_READY',
  'OUT_FOR_DELIVERY',
  'DELIVERED',
  'CANCELLED',
  'REJECTED',
  'OVERRIDE',
]);
export const orderCombo = z.object({
  id: z.uuid(),
  quantity: positiveInt,
  dishPriceCents: cents,
  unitPriceCents: cents,
  optionsSnapshot,
  comboKey: z.string(),
});
export const orderLine = z.object({
  id: z.uuid(),
  dishId: z.uuid(),
  dishSnapshot,
  quantity: positiveInt,
  lineTotalCents: cents,
  combos: z.array(orderCombo).min(1),
});
export const orderEvent = z.object({
  id: z.uuid(),
  type: orderEventType,
  at: instantString,
  actorId: z.uuid().nullable(),
  meta: eventMeta.nullable(),
});
export const orderSummary = z.object({
  id: z.uuid(),
  orderNumber: z.number().int().positive(),
  employeeId: z.uuid(),
  companyId: z.uuid(),
  status: orderStatus,
  deliveryDate: dateString,
  deliveryTime: hhmmString,
  totalCents: cents,
  version: z.number().int().nonnegative(),
  invoiceId: z.uuid().nullable(),
});
export const orderDetail = orderSummary.extend({
  addressId: z.uuid().nullable(),
  addressSnapshot: addressSnapshot.nullable(),
  packaging,
  priceTierId: z.uuid().nullable(),
  createdByStaffId: z.uuid(),
  placedAt: instantString.nullable(),
  confirmedAt: instantString.nullable(),
  cancelledAt: instantString.nullable(),
  rejectedAt: instantString.nullable(),
  reason: z.string().nullable(),
  lines: z.array(orderLine),
  events: z.array(orderEvent),
});
export const orderLineInput = z.object({
  dishId: z.uuid(),
  quantity: positiveInt,
  combos: z
    .array(z.object({ quantity: positiveInt, optionIds: z.array(z.uuid()) }))
    .min(1),
});
export const deliveryInput = z.object({
  deliveryTime: hhmmString.optional(),
  addressId: z.uuid().optional(),
  packaging: packaging.optional(),
});
export const orderListQuery = paginationQuery.extend({
  from: dateString.optional(),
  to: dateString.optional(),
  status: arrayQueryParam(orderStatus),
  companyId: z.uuid().optional(),
  invoiced: z.enum(['yes', 'no', 'any']).default('any'),
  q: z.string().optional(),
});
export const listOrders = defineRoute({
  id: 'orders.list',
  method: 'GET',
  path: '/orders',
  permission: PERM.orders.read,
  query: orderListQuery,
  response: pageResponse(orderSummary),
  errors: notImplemented,
});
export const getOrder = defineRoute({
  id: 'orders.get',
  method: 'GET',
  path: '/orders/:id',
  permission: PERM.orders.read,
  params: uuidParams,
  response: orderDetail,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createOrder = defineRoute({
  id: 'orders.create',
  method: 'POST',
  path: '/orders',
  permission: PERM.orders.create,
  body: z.object({ employeeId: z.uuid(), deliveryDate: dateString }),
  response: orderDetail,
  errors: ['CUTOFF_PASSED', 'NOT_IMPLEMENTED'] as const,
});
export const replaceOrderLines = defineRoute({
  id: 'orders.replaceLines',
  method: 'PUT',
  path: '/orders/:id/lines',
  permission: PERM.orders.edit,
  params: uuidParams,
  body: z.object({
    version: z.number().int().nonnegative(),
    lines: z.array(orderLineInput),
  }),
  response: orderDetail,
  errors: [
    'CONFLICT',
    'COMBO_QTY_MISMATCH',
    'REQUIRED_GROUP_MISSING',
    'NO_PRICE_ON_TIER',
    'ORDER_INVOICED',
    'NOT_IMPLEMENTED',
  ] as const,
});
export const updateOrderDelivery = defineRoute({
  id: 'orders.updateDelivery',
  method: 'PATCH',
  path: '/orders/:id/delivery',
  permission: PERM.orders.edit,
  params: uuidParams,
  body: deliveryInput.extend({ version: z.number().int().nonnegative() }),
  response: orderDetail,
  errors: ['CONFLICT', 'CUTOFF_PASSED', 'NOT_IMPLEMENTED'] as const,
});
export const placeOrder = defineRoute({
  id: 'orders.place',
  method: 'POST',
  path: '/orders/:id/place',
  permission: PERM.orders.place,
  params: uuidParams,
  body: z.object({ version: z.number().int().nonnegative() }),
  response: orderDetail,
  errors: ['CUTOFF_PASSED', 'VALIDATION_ERROR', 'NOT_IMPLEMENTED'] as const,
});
export const cancelOrder = defineRoute({
  id: 'orders.cancel',
  method: 'POST',
  path: '/orders/:id/cancel',
  permission: PERM.orders.cancel,
  params: uuidParams,
  body: z.object({
    version: z.number().int().nonnegative(),
    reason: z.string().min(1).optional(),
  }),
  response: orderDetail,
  errors: ['ORDER_INVOICED', 'INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const rejectOrder = defineRoute({
  id: 'orders.reject',
  method: 'POST',
  path: '/orders/:id/reject',
  permission: PERM.orders.reject,
  params: uuidParams,
  body: z.object({
    version: z.number().int().nonnegative(),
    reason: z.string().min(1),
  }),
  response: orderDetail,
  errors: ['ORDER_INVOICED', 'INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const processCutoff = defineRoute({
  id: 'orders.processCutoff',
  method: 'POST',
  path: '/cutoff-runs/:date/process',
  permission: PERM.orders.processCutoff,
  params: z.object({ date: dateString }),
  response: z.object({
    deliveryDate: dateString,
    processedAt: instantString,
    draftsCancelled: z.number().int().nonnegative(),
    ordersConfirmed: z.number().int().nonnegative(),
    alreadyProcessed: z.boolean(),
  }),
  errors: ['CUTOFF_NOT_REACHED', 'NOT_IMPLEMENTED'] as const,
});
export const ordersRoutes = [
  listOrders,
  getOrder,
  createOrder,
  replaceOrderLines,
  updateOrderDelivery,
  placeOrder,
  cancelOrder,
  rejectOrder,
  processCutoff,
] as const;
