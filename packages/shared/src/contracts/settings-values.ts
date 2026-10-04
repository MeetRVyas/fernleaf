import { z } from 'zod';

const weekdays = z
  .array(z.number().int().min(1).max(7))
  .min(1)
  .refine(
    (days) => new Set(days).size === days.length,
    'Weekdays must be unique',
  );
export const settingValueSchemas = {
  'kitchen.timezone': z
    .string()
    .min(1)
    .refine((zone) => {
      try {
        new Intl.DateTimeFormat('en', { timeZone: zone });
        return true;
      } catch {
        return false;
      }
    }, 'Invalid IANA time zone'),
  'kitchen.workingDays': weekdays,
  'kitchen.prepBufferMinutes': z.number().int().nonnegative(),
  'kitchen.atRiskMinutes': z.number().int().nonnegative(),
  'cutoff.time': z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/),
  'cutoff.workingDaysBefore': z.number().int().nonnegative(),
  'cutoff.autoProcess': z.boolean(),
  'delivery.onTimeGraceMinutes': z.number().int().nonnegative(),
} as const;
export type SettingKey = keyof typeof settingValueSchemas;
export const settingDefaults = {
  'kitchen.timezone': 'America/New_York',
  'kitchen.workingDays': [1, 2, 3, 4, 5],
  'kitchen.prepBufferMinutes': 30,
  'kitchen.atRiskMinutes': 30,
  'cutoff.time': '16:00',
  'cutoff.workingDaysBefore': 2,
  'cutoff.autoProcess': true,
  'delivery.onTimeGraceMinutes': 0,
} as const;

/** Setting.value is a JSON-encoded string, including strings themselves. */
export function parseSettingValue<K extends SettingKey>(
  key: K,
  value: string,
): z.infer<(typeof settingValueSchemas)[K]> {
  return settingValueSchemas[key].parse(JSON.parse(value)) as z.infer<
    (typeof settingValueSchemas)[K]
  >;
}
export function encodeSettingValue<K extends SettingKey>(
  key: K,
  value: z.infer<(typeof settingValueSchemas)[K]>,
): string {
  return JSON.stringify(settingValueSchemas[key].parse(value));
}
