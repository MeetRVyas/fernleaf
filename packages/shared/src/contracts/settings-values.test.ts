import { describe, expect, it } from 'vitest';
import { encodeSettingValue, parseSettingValue } from './settings-values.js';

describe('settings values', () => {
  it('stores string values as JSON strings', () => {
    expect(encodeSettingValue('cutoff.time', '16:00')).toBe('"16:00"');
    expect(parseSettingValue('cutoff.time', '"16:00"')).toBe('16:00');
  });
  it('rejects duplicate weekdays and invalid zones', () => {
    expect(() => encodeSettingValue('kitchen.workingDays', [1, 1])).toThrow();
    expect(() =>
      encodeSettingValue('kitchen.timezone', 'Not/A_Zone'),
    ).toThrow();
  });
});
