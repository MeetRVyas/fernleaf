import { DateTime } from 'luxon';

export function kitchenToday(now: Date, zone: string): string {
  const date = DateTime.fromJSDate(now, { zone });
  if (!date.isValid) throw new RangeError(date.invalidExplanation ?? 'Invalid time zone');
  return date.toISODate()!;
}

export function kitchenInstant(date: string, time: string, zone: string): string {
  const value = DateTime.fromISO(`${date}T${time}`, { zone });
  if (!value.isValid) throw new RangeError(value.invalidExplanation ?? 'Invalid kitchen time');
  return value.toUTC().toISO({ suppressMilliseconds: true })!;
}

export function kitchenDate(instant: Date, zone: string): string {
  return DateTime.fromJSDate(instant, { zone }).toISODate()!;
}
