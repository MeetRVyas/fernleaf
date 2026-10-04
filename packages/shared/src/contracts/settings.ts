import { z } from 'zod';
import { defineRoute } from './route.js';
import { PERM } from '../permissions/roles.js';
import { dateString, uuidParams, notImplemented } from './common.js';
import { settingDefaults, settingValueSchemas } from './settings-values.js';

export const settingKey = z.enum(
  Object.keys(settingValueSchemas) as [
    keyof typeof settingDefaults,
    ...(keyof typeof settingDefaults)[],
  ],
);
export const settingRecord = z.object({
  key: settingKey,
  value: z.union([z.string(), z.number(), z.boolean(), z.array(z.number())]),
  updatedAt: z.iso.datetime({ offset: true }),
});
export const holiday = z.object({
  id: z.uuid(),
  date: dateString,
  name: z.string().min(1),
});
export const listSettings = defineRoute({
  id: 'settings.list',
  method: 'GET',
  path: '/settings',
  permission: PERM.settings.read,
  response: z.array(settingRecord),
  errors: notImplemented,
});
export const updateSetting = defineRoute({
  id: 'settings.update',
  method: 'PUT',
  path: '/settings/:key',
  permission: PERM.settings.manage,
  params: z.object({ key: settingKey }),
  body: z.object({ value: settingRecord.shape.value }),
  response: settingRecord,
  errors: ['VALIDATION_ERROR', 'NOT_IMPLEMENTED'] as const,
});
export const listKitchenHolidays = defineRoute({
  id: 'settings.listHolidays',
  method: 'GET',
  path: '/kitchen-holidays',
  permission: PERM.settings.read,
  response: z.array(holiday),
  errors: notImplemented,
});
export const createKitchenHoliday = defineRoute({
  id: 'settings.createHoliday',
  method: 'POST',
  path: '/kitchen-holidays',
  permission: PERM.settings.manage,
  body: holiday.omit({ id: true }),
  response: holiday,
  errors: ['CONFLICT', 'NOT_IMPLEMENTED'] as const,
});
export const deleteKitchenHoliday = defineRoute({
  id: 'settings.deleteHoliday',
  method: 'DELETE',
  path: '/kitchen-holidays/:id',
  permission: PERM.settings.manage,
  params: uuidParams,
  response: z.object({ ok: z.literal(true) }),
  errors: ['NOT_FOUND', 'NOT_IMPLEMENTED'] as const,
});
export const settingsRoutes = [
  listSettings,
  updateSetting,
  listKitchenHolidays,
  createKitchenHoliday,
  deleteKitchenHoliday,
] as const;
