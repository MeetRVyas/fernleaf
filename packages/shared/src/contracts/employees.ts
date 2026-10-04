import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { paginationQuery, pageResponse } from '../helpers/pagination.js';
import { uuidParams, notImplemented, queryBoolean } from './common.js';

export const employee = z.object({
  id: z.uuid(),
  companyId: z.uuid(),
  name: z.string().min(1),
  email: z.email(),
  phone: z.string().nullable(),
  canChooseAddress: z.boolean(),
  canChangeDeliveryTime: z.boolean(),
  canChangePackaging: z.boolean(),
  allergenIds: z.array(z.uuid()),
  dietaryTagIds: z.array(z.uuid()),
  isActive: z.boolean(),
});
export const employeeBody = employee.omit({ id: true });
export const listEmployees = defineRoute({
  id: 'employees.list',
  method: 'GET',
  path: '/employees',
  permission: PERM.employees.read,
  query: paginationQuery.extend({
    companyId: z.uuid().optional(),
    q: z.string().optional(),
    active: queryBoolean.optional(),
  }),
  response: pageResponse(employee),
  errors: notImplemented,
});
export const getEmployee = defineRoute({
  id: 'employees.get',
  method: 'GET',
  path: '/employees/:id',
  permission: PERM.employees.read,
  params: uuidParams,
  response: employee,
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const createEmployee = defineRoute({
  id: 'employees.create',
  method: 'POST',
  path: '/employees',
  permission: PERM.employees.manage,
  body: employeeBody,
  response: employee,
  errors: ['VALIDATION_ERROR', 'CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const updateEmployee = defineRoute({
  id: 'employees.update',
  method: 'PATCH',
  path: '/employees/:id',
  permission: PERM.employees.manage,
  params: uuidParams,
  body: employeeBody.partial(),
  response: employee,
  errors: ['VALIDATION_ERROR', 'NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const employeesRoutes = [
  listEmployees,
  getEmployee,
  createEmployee,
  updateEmployee,
] as const;
