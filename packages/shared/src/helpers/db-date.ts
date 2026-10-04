import { z } from 'zod';

const dateOnly = z.iso.date();

/** Prisma @db.Date values are represented by UTC midnight Date objects. */
export function dbDateToString(value: Date): string {
  const iso = value.toISOString();
  if (!iso.endsWith('T00:00:00.000Z'))
    throw new RangeError('Expected a UTC-midnight database date');
  return iso.slice(0, 10);
}

export function stringToDbDate(value: string): Date {
  dateOnly.parse(value);
  const date = new Date(`${value}T00:00:00.000Z`);
  if (date.toISOString().slice(0, 10) !== value)
    throw new RangeError('Invalid database date');
  return date;
}
