import { describe, expect, it } from 'vitest';
import { dbDateToString, stringToDbDate } from './db-date.js';
import { normalizeLower } from './normalize-lower.js';

describe('database value helpers', () => {
  it('round trips leap dates through UTC midnight', () => {
    const value = stringToDbDate('2028-02-29');
    expect(value.toISOString()).toBe('2028-02-29T00:00:00.000Z');
    expect(dbDateToString(value)).toBe('2028-02-29');
  });
  it('rejects invalid dates and non-midnight instants', () => {
    expect(() => stringToDbDate('2027-02-29')).toThrow();
    expect(() =>
      dbDateToString(new Date('2026-10-07T01:00:00.000Z')),
    ).toThrow();
  });
  it('normalizes database identifiers', () => {
    expect(normalizeLower('  Dish-ABC@Example.COM  ')).toBe(
      'dish-abc@example.com',
    );
  });
});
