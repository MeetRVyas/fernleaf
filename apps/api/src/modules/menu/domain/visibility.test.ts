import { describe, expect, it } from 'vitest';
import { visibleCategory, visibleDish } from './visibility.js';

describe('menu visibility', () => {
  it('omits secret categories from listing but opens them directly', () => {
    expect(visibleCategory(true, true, false, false)).toBe(false);
    expect(visibleCategory(true, true, false, true)).toBe(true);
    expect(visibleCategory(true, true, true, true)).toBe(false);
  });
  it('requires a dish price and an offered option in each required group', () => {
    const group = {
      id: 'group',
      isRequired: true,
      options: [{ id: 'option', active: true, priceCents: null }],
    };
    expect(visibleDish(true, false, 300, [group])).toBe(false);
    expect(
      visibleDish(true, false, 300, [
        { ...group, options: [{ ...group.options[0], priceCents: 0 }] },
      ]),
    ).toBe(true);
    expect(visibleDish(true, false, null, [])).toBe(false);
    expect(visibleDish(true, true, 300, [])).toBe(false);
  });
});
