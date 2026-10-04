import { stringToDbDate } from '@fernleaf/shared';

const PUBLIC_EMAIL_DOMAINS = new Set(['gmail.com', 'yahoo.com', 'outlook.com', 'hotmail.com', 'live.com', 'msn.com', 'icloud.com', 'me.com', 'aol.com', 'proton.me', 'protonmail.com', 'gmx.com', 'yandex.com', 'zoho.com']);

export function normalizeDomains(domains: string[]): string[] {
  const normalized = domains.map(domain => domain.trim().toLowerCase());
  if (new Set(normalized).size !== normalized.length || normalized.some(domain => !/^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?(?:\.[a-z0-9](?:[a-z0-9-]*[a-z0-9])?)+$/.test(domain))) throw new Error('Invalid or duplicate company domain');
  if (normalized.some(domain => PUBLIC_EMAIL_DOMAINS.has(domain))) throw new Error('Public email domain is not allowed');
  return normalized;
}

export function validateWorkingDays(days: number[]): void {
  if (!days.length || new Set(days).size !== days.length || days.some(day => !Number.isInteger(day) || day < 1 || day > 7)) throw new Error('Working days must be distinct weekdays 1 through 7');
}

export function allowsDelivery(days: number[], date: string, holidayDates: readonly string[]): boolean {
  const weekday = stringToDbDate(date).getUTCDay() || 7;
  return days.includes(weekday) && !holidayDates.includes(date);
}
