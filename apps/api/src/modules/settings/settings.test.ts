import { describe, expect, it } from 'vitest';
import { encodeSettingValue, parseSettingValue, settingValueSchemas } from '@fernleaf/shared';

describe('settings rules', () => {
  it('accepts only registered setting keys', () => {
    expect('cutoff.time' in settingValueSchemas).toBe(true);
    expect('cutoff.unknown' in settingValueSchemas).toBe(false);
  });
  it('stores a time as a JSON encoded string', () => {
    expect(encodeSettingValue('cutoff.time', '16:00')).toBe('"16:00"');
    expect(parseSettingValue('cutoff.time', '"16:00"')).toBe('16:00');
  });
  it('rejects duplicate working days', () => {
    expect(settingValueSchemas['kitchen.workingDays'].safeParse([1, 1]).success).toBe(false);
  });
});
