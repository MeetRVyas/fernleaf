import { describe, expect, it } from 'vitest';
import { kitchenInstant } from './time.js';

describe('kitchen instants across daylight saving', () => {
  it('converts the cut-off vectors to UTC without milliseconds', () => {
    expect(kitchenInstant('2026-10-30', '16:00', 'America/New_York')).toBe('2026-10-30T20:00:00Z');
    expect(kitchenInstant('2026-11-02', '16:00', 'America/New_York')).toBe('2026-11-02T21:00:00Z');
  });
});
