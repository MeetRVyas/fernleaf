import { describe, expect, it } from 'vitest';
import {
  addressSnapshot,
  dishSnapshot,
  eventMeta,
  optionsSnapshot,
} from './db-values.js';

describe('JSON snapshot schemas', () => {
  it('accepts an order snapshot and rejects negative option prices', () => {
    expect(
      dishSnapshot.parse({
        name: 'Bowl',
        sku: 'bowl',
        temperature: 'HOT',
        allergens: [],
      }).sku,
    ).toBe('bowl');
    expect(
      addressSnapshot.parse({
        label: 'Office',
        line1: '1 Main',
        line2: null,
        city: 'New York',
        region: 'NY',
        postalCode: '10001',
        country: 'US',
      }).label,
    ).toBe('Office');
    expect(() =>
      optionsSnapshot.parse([
        {
          groupId: '00000000-0000-4000-8000-000000000001',
          groupName: 'Protein',
          optionId: '00000000-0000-4000-8000-000000000002',
          name: 'Tofu',
          priceCents: -1,
        },
      ]),
    ).toThrow();
    expect(eventMeta.parse({ reason: 'Cut-off', count: 2 })).toEqual({
      reason: 'Cut-off',
      count: 2,
    });
  });
});
