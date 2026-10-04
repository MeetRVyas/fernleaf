import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import {
  dateString,
  hhmmString,
  packaging,
  uuidParams,
  notImplemented,
  queryBoolean,
} from './common.js';

export const companyAddress = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  label: z.string().min(1),
  line1: z.string().min(1),
  line2: z.string().nullable(),
  city: z.string().min(1),
  region: z.string().min(1),
  postalCode: z.string().min(1),
  country: z.string().min(1),
  isDefault: z.boolean(),
});
export const company = z.object({
  id: z.uuid(),
  name: z.string().min(1),
  tierId: z.uuid().nullable(),
  defaultDeliveryTime: hhmmString,
  deliveryLeadMinutes: z.number().int().nonnegative(),
  defaultPackaging: packaging,
  driverInstructions: z.string(),
  defaultDriverId: z.uuid().nullable(),
  billingName: z.string(),
  billingEmail: z.email(),
  billingPhone: z.string(),
  billingAddress: z.string(),
  ownerEmployeeId: z.uuid().nullable(),
  workingDays: z.array(z.number().int().min(1).max(7)).min(1),
  domains: z.array(z.string()),
  addresses: z.array(companyAddress),
  isActive: z.boolean(),
});
export const companyBody = company
  .omit({ id: true, addresses: true })
  .extend({
    addresses: z
      .array(companyAddress.omit({ id: true, companyId: true }))
      .min(1),
  });
export const companyHoliday = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  date: dateString,
  name: z.string().min(1),
});
export const listCompanies = defineRoute({
  id: 'companies.list',
  method: 'GET',
  path: '/companies',
  permission: PERM.companies.read,
  query: paginationQuery.extend({
    q: z.string().optional(),
    active: queryBoolean.optional(),
  }),
  response: pageResponse(company),
  errors: notImplemented,
});
export const getCompany = defineRoute({
  id: 'companies.get',
  method: 'GET',
  path: '/companies/:id',
  permission: PERM.companies.read,
  params: uuidParams,
  response: company,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createCompany = defineRoute({
  id: 'companies.create',
  method: 'POST',
  path: '/companies',
  permission: PERM.companies.manage,
  body: companyBody,
  response: company,
  errors: [
    'DOMAIN_TAKEN',
    'PUBLIC_DOMAIN_NOT_ALLOWED',
    'NOT_IMPLEMENTED',
  ] as const,
});
export const updateCompany = defineRoute({
  id: 'companies.update',
  method: 'PATCH',
  path: '/companies/:id',
  permission: PERM.companies.manage,
  params: uuidParams,
  body: companyBody.partial(),
  response: company,
  errors: ['DOMAIN_TAKEN', 'NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createCompanyAddress = defineRoute({
  id: 'companies.createAddress',
  method: 'POST',
  path: '/companies/:id/addresses',
  permission: PERM.companies.manage,
  params: uuidParams,
  body: companyAddress.omit({ id: true, companyId: true }),
  response: companyAddress,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const updateCompanyAddress = defineRoute({
  id: 'companies.updateAddress',
  method: 'PATCH',
  path: '/company-addresses/:id',
  permission: PERM.companies.manage,
  params: uuidParams,
  body: companyAddress.omit({ id: true, companyId: true }).partial(),
  response: companyAddress,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const listCompanyHolidays = defineRoute({
  id: 'companies.listHolidays',
  method: 'GET',
  path: '/companies/:id/holidays',
  permission: PERM.companies.read,
  params: uuidParams,
  response: z.array(companyHoliday),
  errors: notImplemented,
});
export const createCompanyHoliday = defineRoute({
  id: 'companies.createHoliday',
  method: 'POST',
  path: '/companies/:id/holidays',
  permission: PERM.companies.manage,
  params: uuidParams,
  body: companyHoliday.omit({ id: true, companyId: true }),
  response: companyHoliday,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const deleteCompanyHoliday = defineRoute({
  id: 'companies.deleteHoliday',
  method: 'DELETE',
  path: '/company-holidays/:id',
  permission: PERM.companies.manage,
  params: uuidParams,
  response: z.object({ ok: z.literal(true) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const companiesRoutes = [
  listCompanies,
  getCompany,
  createCompany,
  updateCompany,
  createCompanyAddress,
  updateCompanyAddress,
  listCompanyHolidays,
  createCompanyHoliday,
  deleteCompanyHoliday,
] as const;
