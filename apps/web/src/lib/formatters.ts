import { formatMoney as sharedFormatMoney, kitchenDate } from '@fernleaf/shared';

export const formatMoney = sharedFormatMoney;

export function formatKitchenDate(instant: string, zone: string): string {
  return kitchenDate(new Date(instant), zone);
}

export function formatKitchenDateTime(instant: string, zone: string): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: zone, dateStyle: 'medium', timeStyle: 'short',
  }).format(new Date(instant));
}

export function formatKitchenTime(instant: string, zone: string): string {
  return new Intl.DateTimeFormat('en-US', { timeZone: zone, timeStyle: 'short' }).format(new Date(instant));
}
