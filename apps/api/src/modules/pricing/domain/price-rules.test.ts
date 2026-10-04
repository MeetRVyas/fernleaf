import { describe, expect, it } from 'vitest';
import {
  resolvePrice,
  validateTierGraph,
  entryKey,
  type TierRule,
} from './price-rules.js';

const base: TierRule = {
  id: 'base',
  derivationKind: 'NONE',
  factorMilli: null,
  baseTierId: null,
  percentBp: null,
};
const cost: TierRule = {
  ...base,
  id: 'cost',
  derivationKind: 'COST_MULTIPLIER',
  factorMilli: 2400,
};
const percent: TierRule = {
  ...base,
  id: 'percent',
  derivationKind: 'PERCENT_OVER_TIER',
  baseTierId: 'base',
  percentBp: 1500,
};
const dish = { type: 'DISH' as const, id: 'dish', costCents: 88 };

describe('pricing rules', () => {
  it('rounds derived values upward to five cents and lets manual entries win', () => {
    expect(
      resolvePrice('cost', dish, new Map([['cost', cost]]), new Map())
        .priceCents,
    ).toBe(215);
    expect(
      resolvePrice(
        'cost',
        dish,
        new Map([['cost', cost]]),
        new Map([[entryKey('cost', dish), 210]]),
      ),
    ).toEqual({ priceCents: 210, source: 'MANUAL' });
    const tiers = new Map([
      ['base', base],
      ['percent', percent],
    ]);
    expect(
      resolvePrice(
        'percent',
        dish,
        tiers,
        new Map([[entryKey('base', dish), 333]]),
      ).priceCents,
    ).toBe(385);
    expect(
      resolvePrice(
        'percent',
        dish,
        tiers,
        new Map([[entryKey('base', dish), 1000]]),
      ).priceCents,
    ).toBe(1150);
  });

  it('keeps missing prices missing and permits a free option', () => {
    expect(
      resolvePrice('base', dish, new Map([['base', base]]), new Map())
        .priceCents,
    ).toBeNull();
    expect(
      resolvePrice(
        'base',
        { ...dish, type: 'OPTION' },
        new Map([['base', base]]),
        new Map([[entryKey('base', { ...dish, type: 'OPTION' }), 0]]),
      ).priceCents,
    ).toBe(0);
  });

  it('rejects cycles and derivation chains beyond five tiers', () => {
    const cycle = new Map([
      ['base', { ...percent, id: 'base', baseTierId: 'percent' }],
      ['percent', percent],
    ]);
    expect(() => validateTierGraph('base', cycle)).toThrow('cycle');
    const chain = new Map<string, TierRule>();
    for (let n = 1; n <= 6; n++)
      chain.set(String(n), {
        ...percent,
        id: String(n),
        baseTierId: n === 6 ? null : String(n + 1),
      });
    expect(() => validateTierGraph('1', chain)).toThrow('five');
  });
});
