import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import {
  cents,
  dateString,
  instantString,
  uuidParams,
  notImplemented,
} from './common.js';

export const invoice = z.object({
  id: z.uuid(),
  number: z.string(),
  companyId: z.uuid(),
  status: z.enum(['OPEN', 'PAID', 'VOID']),
  totalCents: cents,
  createdAt: instantString,
  paidAt: instantString.nullable(),
  voidedAt: instantString.nullable(),
  orderIds: z.array(z.uuid()),
});
export const listBillableOrders = defineRoute({
  id: 'billing.listBillable',
  method: 'GET',
  path: '/companies/:id/billable-orders',
  permission: PERM.billing.read,
  params: uuidParams,
  query: paginationQuery.extend({ through: dateString.optional() }),
  response: pageResponse(
    z.object({
      orderId: z.uuid(),
      deliveryDate: dateString,
      totalCents: cents,
    }),
  ),
  errors: notImplemented,
});
export const listInvoices = defineRoute({
  id: 'billing.list',
  method: 'GET',
  path: '/invoices',
  permission: PERM.billing.read,
  query: paginationQuery.extend({
    companyId: z.uuid().optional(),
    status: z.enum(['OPEN', 'PAID', 'VOID']).optional(),
  }),
  response: pageResponse(invoice),
  errors: notImplemented,
});
export const getInvoice = defineRoute({
  id: 'billing.get',
  method: 'GET',
  path: '/invoices/:id',
  permission: PERM.billing.read,
  params: uuidParams,
  response: invoice,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createInvoice = defineRoute({
  id: 'billing.create',
  method: 'POST',
  path: '/invoices',
  permission: PERM.billing.manage,
  body: z.object({
    companyId: z.uuid(),
    orderIds: z.array(z.uuid()).optional(),
    through: dateString.optional(),
  }),
  response: invoice,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const markInvoicePaid = defineRoute({
  id: 'billing.markPaid',
  method: 'POST',
  path: '/invoices/:id/paid',
  permission: PERM.billing.manage,
  params: uuidParams,
  response: invoice,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const voidInvoice = defineRoute({
  id: 'billing.void',
  method: 'POST',
  path: '/invoices/:id/void',
  permission: PERM.billing.manage,
  params: uuidParams,
  response: invoice,
  errors: ['INVALID_TRANSITION', 'NOT_IMPLEMENTED'] as const,
});
export const billingRoutes = [
  listBillableOrders,
  listInvoices,
  getInvoice,
  createInvoice,
  markInvoicePaid,
  voidInvoice,
] as const;
