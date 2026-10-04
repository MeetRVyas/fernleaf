import { z } from 'zod';
export const uuidParams = z.object({ id: z.uuid() });
export const dateString = z.iso.date();
export const instantString = z.iso.datetime({ offset: true });
export const hhmmString = z.string().regex(/^([01]\d|2[0-3]):[0-5]\d$/);
export const cents = z.number().int().nonnegative();
export const positiveInt = z.number().int().positive();
export const packaging = z.enum(['STANDARD', 'ECO', 'INSULATED']);
export const notImplemented = ['NOT_IMPLEMENTED'] as const;
export const queryBoolean = z
  .enum(['true', 'false'])
  .transform((value) => value === 'true');
