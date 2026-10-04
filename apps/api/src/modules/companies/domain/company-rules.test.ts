import { describe, expect, it } from 'vitest';
import { allowsDelivery, normalizeDomains, validateWorkingDays } from './company-rules.js';

describe('company rules', () => {
  it('normalizes domains and rejects public, malformed and duplicate domains', () => {
    expect(normalizeDomains(['Kitchen.Example'])).toEqual(['kitchen.example']);
    expect(() => normalizeDomains(['Gmail.com'])).toThrow('Public');
    expect(() => normalizeDomains(['a.example', 'A.EXAMPLE'])).toThrow('duplicate');
    expect(() => normalizeDomains(['@bad'])).toThrow('Invalid');
  });
  it('requires distinct weekdays', () => {
    expect(() => validateWorkingDays([1, 1])).toThrow();
    expect(() => validateWorkingDays([])).toThrow();
    expect(() => validateWorkingDays([1, 5])).not.toThrow();
  });
  it('excludes company holidays and closed weekdays', () => {
    expect(allowsDelivery([1, 2, 3, 4, 5], '2026-10-05', [])).toBe(true);
    expect(allowsDelivery([1, 2, 3, 4, 5], '2026-10-05', ['2026-10-05'])).toBe(false);
    expect(allowsDelivery([1, 2, 3, 4, 5], '2026-10-10', [])).toBe(false);
  });
});
