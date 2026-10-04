import { ceilDiv } from '@fernleaf/shared';

export type PriceSubject = { type: 'DISH' | 'OPTION'; id: string; costCents: number };
export type TierRule = {
  id: string;
  derivationKind: 'NONE' | 'COST_MULTIPLIER' | 'PERCENT_OVER_TIER';
  factorMilli: number | null;
  baseTierId: string | null;
  percentBp: number | null;
};
export type PriceResult = { priceCents: number | null; source: 'MANUAL' | 'DERIVED' | 'MISSING' };

export const priceKey = (type: PriceSubject['type'], id: string): string => `${type}:${id}`;
export const entryKey = (tierId: string, subject: PriceSubject): string => `${tierId}:${priceKey(subject.type, subject.id)}`;

/** Reject cycles and chains with more than five distinct tiers, including the edited tier. */
export function validateTierGraph(tierId: string, tiers: ReadonlyMap<string, TierRule>): void {
  const visited = new Set<string>();
  let next: string | null = tierId;
  while (next !== null) {
    if (visited.has(next)) throw new RangeError('Tier derivation has a cycle');
    visited.add(next);
    if (visited.size > 5) throw new RangeError('Tier derivation exceeds five tiers');
    const tier = tiers.get(next);
    if (!tier) throw new RangeError('Base tier does not exist');
    next = tier.derivationKind === 'PERCENT_OVER_TIER' ? tier.baseTierId : null;
  }
}

export function resolvePrice(
  tierId: string,
  subject: PriceSubject,
  tiers: ReadonlyMap<string, TierRule>,
  entries: ReadonlyMap<string, number>,
): PriceResult {
  const visited = new Set<string>();
  function at(id: string): PriceResult {
    if (visited.has(id) || visited.size >= 5) throw new RangeError('Invalid tier derivation chain');
    visited.add(id);
    const tier = tiers.get(id);
    if (!tier || !Number.isSafeInteger(subject.costCents) || subject.costCents < 0)
      throw new RangeError('Invalid pricing input');
    const manual = entries.get(entryKey(id, subject));
    if (manual !== undefined) return { priceCents: manual, source: 'MANUAL' };
    let price: number | null = null;
    if (tier.derivationKind === 'COST_MULTIPLIER' && tier.factorMilli !== null)
      price = ceilDiv(subject.costCents * tier.factorMilli, 5000) * 5;
    if (tier.derivationKind === 'PERCENT_OVER_TIER' && tier.baseTierId && tier.percentBp !== null) {
      const base = at(tier.baseTierId).priceCents;
      if (base !== null) price = ceilDiv(base * (10000 + tier.percentBp), 50000) * 5;
    }
    return price === null || (subject.type === 'DISH' && price === 0)
      ? { priceCents: null, source: 'MISSING' }
      : { priceCents: price, source: 'DERIVED' };
  }
  return at(tierId);
}
